import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { CreateLabelDto } from './dto/create-label.dto';
import { CreateChecklistDto, CreateChecklistItemDto, UpdateChecklistItemDto } from './dto/checklist.dto';

@Injectable()
export class CardsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Ownership helpers ────────────────────────────────────────────────────────

  private async assertColumnOwner(columnId: number, userId: number) {
    const column = await this.prisma.column.findUnique({
      where: { id: columnId },
      include: { board: true },
    });
    if (!column) throw new NotFoundException('Column not found');
    if (column.board.userId !== userId) throw new ForbiddenException();
    return column;
  }

  private async assertCardOwner(cardId: number, userId: number) {
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: { column: { include: { board: true } }, labels: true },
    });
    if (!card) throw new NotFoundException('Card not found');
    if (card.column.board.userId !== userId) throw new ForbiddenException();
    return card;
  }

  // ─── CRUD ─────────────────────────────────────────────────────────────────────

  async create(columnId: number, userId: number, dto: CreateCardDto) {
    await this.assertColumnOwner(columnId, userId);

    const maxOrder = await this.prisma.card.aggregate({
      where: { columnId },
      _max: { order: true },
    });
    const order = dto.order ?? (maxOrder._max.order ?? -1) + 1;

    return this.prisma.card.create({
      data: {
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        columnId,
        clientId: dto.clientId,
        order,
      },
      include: { labels: true, client: { select: { id: true, name: true } }, checklists: true },
    });
  }

  async findOne(id: number, userId: number) {
    const card = await this.assertCardOwner(id, userId);
    return this.prisma.card.findUnique({
      where: { id },
      include: { labels: true, client: { select: { id: true, name: true } }, checklists: { include: { items: true } } },
    });
  }

  async update(id: number, userId: number, dto: UpdateCardDto) {
    const card = await this.assertCardOwner(id, userId);

    // If moving to a different column, verify ownership of the target column too
    if (dto.columnId) {
      await this.assertColumnOwner(dto.columnId, userId);
    }

    if (dto.isDone === true) {
      const cardWithChecklists = await this.prisma.card.findUnique({
        where: { id },
        include: { checklists: { include: { items: true } } },
      });
      if (cardWithChecklists) {
        for (const list of cardWithChecklists.checklists) {
          for (const item of list.items) {
            if (item.isMandatory && !item.isCompleted) {
              throw new ForbiddenException('Não é possível marcar o cartão como concluído. Existem itens obrigatórios pendentes no checklist.');
            }
          }
        }
      }
    }

    return this.prisma.card.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.order !== undefined && { order: dto.order }),
        ...(dto.columnId !== undefined && { columnId: dto.columnId }),
        ...(dto.clientId !== undefined && { clientId: dto.clientId }),
        ...(dto.isDone !== undefined && { isDone: dto.isDone }),
      },
      include: { labels: true, client: { select: { id: true, name: true } }, checklists: { include: { items: true } } },
    });
  }

  async remove(id: number, userId: number) {
    await this.assertCardOwner(id, userId);
    return this.prisma.card.delete({ where: { id } });
  }

  // ─── Labels ───────────────────────────────────────────────────────────────────

  async addLabel(cardId: number, userId: number, dto: CreateLabelDto) {
    await this.assertCardOwner(cardId, userId);
    return this.prisma.label.create({
      data: { name: dto.name, color: dto.color ?? '#6366f1', cardId },
    });
  }

  async removeLabel(cardId: number, labelId: number, userId: number) {
    await this.assertCardOwner(cardId, userId);
    return this.prisma.label.delete({ where: { id: labelId } });
  }

  // ─── Checklists ───────────────────────────────────────────────────────────────

  async createChecklist(cardId: number, userId: number, dto: CreateChecklistDto) {
    await this.assertCardOwner(cardId, userId);
    return this.prisma.checklist.create({
      data: { title: dto.title, cardId },
      include: { items: true },
    });
  }

  async deleteChecklist(cardId: number, checklistId: number, userId: number) {
    await this.assertCardOwner(cardId, userId);
    return this.prisma.checklist.delete({ where: { id: checklistId } });
  }

  async createChecklistItem(cardId: number, checklistId: number, userId: number, dto: CreateChecklistItemDto) {
    await this.assertCardOwner(cardId, userId);
    return this.prisma.checklistItem.create({
      data: { text: dto.text, isMandatory: dto.isMandatory || false, checklistId },
    });
  }

  async updateChecklistItem(cardId: number, checklistId: number, itemId: number, userId: number, dto: UpdateChecklistItemDto) {
    await this.assertCardOwner(cardId, userId);
    return this.prisma.checklistItem.update({
      where: { id: itemId },
      data: dto,
    });
  }

  async deleteChecklistItem(cardId: number, checklistId: number, itemId: number, userId: number) {
    await this.assertCardOwner(cardId, userId);
    return this.prisma.checklistItem.delete({ where: { id: itemId } });
  }

  // ─── Bulk reorder within a column ────────────────────────────────────────────

  async reorder(columnId: number, userId: number, orderedIds: number[]) {
    await this.assertColumnOwner(columnId, userId);
    const updates = orderedIds.map((id, index) =>
      this.prisma.card.update({ where: { id }, data: { order: index } }),
    );
    await this.prisma.$transaction(updates);
    return { success: true };
  }
}
