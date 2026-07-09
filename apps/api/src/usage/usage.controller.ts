import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Public } from '../common/decorators';
import { InternalSecretGuard } from '../auth/internal-secret.guard';
import { UsageService } from './usage.service';
import { LogUsageDto } from './dto/log-usage.dto';

@ApiTags('usage')
@Controller('usage')
export class UsageController {
  constructor(private readonly usage: UsageService) {}

  @Get('summary')
  @ApiBearerAuth()
  async summary(@CurrentUser('id') userId: string) {
    return {
      data: await this.usage.summary(userId),
      message: 'Usage summary',
    };
  }

  @Get('chart')
  @ApiBearerAuth()
  async chart(@CurrentUser('id') userId: string) {
    return {
      data: await this.usage.chart(userId),
      message: 'Usage chart',
    };
  }

  /**
   * Internal endpoint used by the Next.js /api/chat route to log token usage.
   * Not API-key protected — guarded by the shared NEST_API_INTERNAL_SECRET.
   */
  @Post('log')
  @Public()
  @UseGuards(InternalSecretGuard)
  @ApiExcludeEndpoint()
  async log(@Body() dto: LogUsageDto) {
    return {
      data: await this.usage.log(dto),
      message: 'Usage logged',
    };
  }
}
