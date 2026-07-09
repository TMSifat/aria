import { Injectable, NotFoundException } from '@nestjs/common';
import { nanoid } from 'nanoid';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  /** Masked list — the raw key and its hash are never returned here. */
  async list(userId: string) {
    const keys = await this.prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return keys.map((k) => ({
      id: k.id,
      name: k.name,
      prefix: k.prefix,
      masked: `${k.prefix}${'•'.repeat(8)}`,
      isActive: k.isActive,
      lastUsedAt: k.lastUsedAt,
      createdAt: k.createdAt,
    }));
  }

  /** Creates a key and returns the raw value ONCE (never stored in plaintext). */
  async create(userId: string, dto: CreateApiKeyDto) {
    const rawKey = `aria_sk_${nanoid(32)}`;
    const keyHash = await bcrypt.hash(rawKey, 10);
    const prefix = rawKey.slice(0, 12);

    const created = await this.prisma.apiKey.create({
      data: { userId, name: dto.name, keyHash, prefix },
    });

    return {
      id: created.id,
      name: created.name,
      key: rawKey, // shown exactly once
      prefix: created.prefix,
      createdAt: created.createdAt,
    };
  }

  /** Soft delete — revoked keys are kept for audit but can no longer auth. */
  async revoke(userId: string, id: string) {
    const key = await this.prisma.apiKey.findFirst({ where: { id, userId } });
    if (!key) throw new NotFoundException('API key not found');
    await this.prisma.apiKey.update({
      where: { id },
      data: { isActive: false },
    });
    return { id, revoked: true };
  }
}
