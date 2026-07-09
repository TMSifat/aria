import type { Metadata } from 'next';
import { Archivo, Bricolage_Grotesque, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';

const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  display: 'swap',
});

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  display: 'swap',
  weight: ['500', '600', '700', '800'],
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Aria — AI Assistant Builder',
  description:
    'AI assistants with your instructions and your knowledge base. Test them live, then embed anywhere with one line of code.',
  openGraph: {
    title: 'Aria — AI Assistant Builder',
    description:
      'AI assistants with your instructions and your knowledge base. Test them live, then embed anywhere with one line of code.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${bricolage.variable} ${jetbrains.variable}`}
    >
      <body>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
