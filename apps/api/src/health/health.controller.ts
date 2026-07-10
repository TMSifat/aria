import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /** Liveness + DB connectivity probe for load balancers / Railway. */
  @Get()
  @Public()
  async health() {
    let database = 'up';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      database = 'down';
    }
    return {
      data: {
        status: database === 'up' ? 'ok' : 'degraded',
        database,
        uptime: Math.round(process.uptime()),
      },
      message: 'Health',
    };
  }
}
