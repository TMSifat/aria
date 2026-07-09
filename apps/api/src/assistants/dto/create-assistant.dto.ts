import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateAssistantDto {
  @ApiProperty({ example: 'Support Bot', maxLength: 50 })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({ example: 'A friendly support agent', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  persona?: string;

  @ApiProperty({
    example: 'You are a warm, concise support agent...',
    minLength: 20,
  })
  @IsString()
  @MinLength(20)
  instructions: string;

  @ApiPropertyOptional({ example: 'Return policy: 30-day returns...' })
  @IsOptional()
  @IsString()
  knowledgeBase?: string;
}
