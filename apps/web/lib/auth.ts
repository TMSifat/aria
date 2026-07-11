import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from './prisma';
import { rateLimit } from './ratelimit';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Google sign-in is only offered when OAuth credentials are configured; the
// login/signup pages read /api/auth/providers and hide the button otherwise.
const googleConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: { signIn: '/login', error: '/login' },
  providers: [
    ...(googleConfigured
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        // Brute-force protection: 10 attempts per email per 5 minutes.
        // Fails open if Redis is down (same policy as /api/chat).
        const rl = await rateLimit(
          `login:${parsed.data.email.toLowerCase()}`,
          10,
          300,
        );
        if (!rl.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user || !user.passwordHash) return null;

        // Suspended accounts are allowed to authenticate here so the login
        // form can show the generic "invalid credentials" message only for
        // actual bad credentials — (dashboard)/layout.tsx redirects
        // suspended users to `/login?error=suspended` on their next request,
        // which surfaces the real reason via a proper URL param.
        const valid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash,
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        const [sub, dbUser] = await Promise.all([
          prisma.subscription.findUnique({ where: { userId: user.id as string } }),
          prisma.user.findUnique({ where: { id: user.id as string } }),
        ]);
        token.plan = sub?.plan ?? 'FREE';
        token.role = dbUser?.role ?? 'USER';

        // Bootstrap: the ADMIN_EMAIL account is promoted to admin on sign-in,
        // so no manual SQL is needed to create the first admin.
        const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
        if (
          adminEmail &&
          dbUser &&
          dbUser.email.toLowerCase() === adminEmail &&
          dbUser.role !== 'ADMIN'
        ) {
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { role: 'ADMIN' },
          });
          token.role = 'ADMIN';
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.plan = (token.plan as string) ?? 'FREE';
        session.user.role = (token.role as string) ?? 'USER';
      }
      return session;
    },
  },
});
