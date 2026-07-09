import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({ example: 'Production key', maxLength: 50 })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;
}
