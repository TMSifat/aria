import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { UsageSource } from '@prisma/client';

export class LogUsageDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assistantId?: string;

  @ApiProperty({ default: 0 })
  @IsInt()
  @Min(0)
  inputTokens: number;

  @ApiProperty({ default: 0 })
  @IsInt()
  @Min(0)
  outputTokens: number;

  @ApiPropertyOptional({ enum: UsageSource, default: UsageSource.API })
  @IsOptional()
  @IsEnum(UsageSource)
  source?: UsageSource;
}
