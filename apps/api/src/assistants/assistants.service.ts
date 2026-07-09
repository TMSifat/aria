import { Injectable, NotFoundException } from '@nestjs/common';
import { nanoid } from 'nanoid';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssistantDto } from './dto/create-assistant.dto';
import { UpdateAssistantDto } from './dto/update-assistant.dto';

@Injectable()
export class AssistantsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.assistant.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(userId: string, dto: CreateAssistantDto) {
    return this.prisma.assistant.create({
      data: {
        userId,
        name: dto.name,
        persona: dto.persona,
        instructions: dto.instructions,
        knowledgeBase: dto.knowledgeBase,
        widgetKey: `wk_${nanoid(24)}`,
      },
    });
  }

  async get(userId: string, id: string) {
    const assistant = await this.prisma.assistant.findFirst({
      where: { id, userId },
    });
    if (!assistant) throw new NotFoundException('Assistant not found');
    return assistant;
  }

  async update(userId: string, id: string, dto: UpdateAssistantDto) {
    await this.get(userId, id); // ownership check
    return this.prisma.assistant.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    await this.get(userId, id); // ownership check
    await this.prisma.assistant.delete({ where: { id } });
    return { id, deleted: true };
  }
}
