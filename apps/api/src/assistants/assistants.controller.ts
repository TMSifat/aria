import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators';
import { AssistantsService } from './assistants.service';
import { CreateAssistantDto } from './dto/create-assistant.dto';
import { UpdateAssistantDto } from './dto/update-assistant.dto';

// Auth is enforced globally by ApiKeyGuard (APP_GUARD). @ApiBearerAuth documents
// the requirement in Swagger.
@ApiTags('assistants')
@ApiBearerAuth()
@Controller('assistants')
export class AssistantsController {
  constructor(private readonly assistants: AssistantsService) {}

  @Get()
  async list(@CurrentUser('id') userId: string) {
    return {
      data: await this.assistants.list(userId),
      message: 'Assistants retrieved',
    };
  }

  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateAssistantDto,
  ) {
    return {
      data: await this.assistants.create(userId, dto),
      message: 'Assistant created',
    };
  }

  @Get(':id')
  async get(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return {
      data: await this.assistants.get(userId, id),
      message: 'Assistant retrieved',
    };
  }

  @Patch(':id')
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAssistantDto,
  ) {
    return {
      data: await this.assistants.update(userId, id, dto),
      message: 'Assistant updated',
    };
  }

  @Delete(':id')
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return {
      data: await this.assistants.remove(userId, id),
      message: 'Assistant deleted',
    };
  }
}
