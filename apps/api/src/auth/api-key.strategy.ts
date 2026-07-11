import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-http-bearer';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Passport strategy that authenticates requests bearing an Ariaay API key:
 *
 *   Authorization: Bearer aria_sk_xxxxxxxx...
 *
 * Keys are never stored in plaintext. We look up candidate keys by their 12-char
 * prefix, then bcrypt.compare the raw key against each candidate's hash.
 */
@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async validate(token: string) {
    if (!token || !token.startsWith('aria_sk_')) {
      throw new UnauthorizedException('Invalid API key');
    }

    const prefix = token.slice(0, 12);
    const candidates = await this.prisma.apiKey.findMany({
      where: { prefix, isActive: true },
      include: { user: true },
    });

    for (const candidate of candidates) {
      const matches = await bcrypt.compare(token, candidate.keyHash);
      if (matches) {
        await this.prisma.apiKey.update({
          where: { id: candidate.id },
          data: { lastUsedAt: new Date() },
        });
        // Never expose the password hash downstream.
        const { passwordHash, ...user } = candidate.user;
        return user;
      }
    }

    throw new UnauthorizedException('Invalid API key');
  }
}
