import { Injectable } from '@nestjs/common';
import { Prisma, UsageSource } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LogUsageDto } from './dto/log-usage.dto';

@Injectable()
export class UsageService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalMessages, thisMonth, assistants, apiCalls, tokens] =
      await Promise.all([
        this.prisma.usageLog.count({ where: { userId } }),
        this.prisma.usageLog.count({
          where: { userId, createdAt: { gte: startOfMonth } },
        }),
        this.prisma.assistant.count({ where: { userId } }),
        this.prisma.usageLog.count({
          where: { userId, source: UsageSource.API },
        }),
        this.prisma.usageLog.aggregate({
          where: { userId },
          _sum: { totalTokens: true },
        }),
      ]);

    return {
      totalMessages,
      thisMonth,
      assistants,
      apiCalls,
      totalTokens: tokens._sum.totalTokens ?? 0,
    };
  }

  /** 30-day daily message counts, grouped by calendar date. */
  async chart(userId: string) {
    const rows = await this.prisma.$queryRaw<
      { date: Date; count: bigint }[]
    >(Prisma.sql`
      SELECT DATE("createdAt") AS date, COUNT(*) AS count
      FROM usage_logs
      WHERE "userId" = ${userId}
        AND "createdAt" >= NOW() - INTERVAL '30 days'
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `);

    return rows.map((r) => ({
      date:
        r.date instanceof Date
          ? r.date.toISOString().slice(0, 10)
          : String(r.date),
      count: Number(r.count),
    }));
  }

  log(dto: LogUsageDto) {
    const inputTokens = dto.inputTokens ?? 0;
    const outputTokens = dto.outputTokens ?? 0;
    return this.prisma.usageLog.create({
      data: {
        userId: dto.userId,
        assistantId: dto.assistantId ?? null,
        source: dto.source ?? UsageSource.API,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
      },
    });
  }
}
