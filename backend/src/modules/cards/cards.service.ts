import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { CreateLabelDto } from './dto/create-label.dto';

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

    const last = await this.prisma.card.findFirst({
      where: { columnId },
      orderBy: { order: 'desc' },
    });
    const order = dto.order ?? (last ? last.order + 1 : 0);

    return this.prisma.card.create({
      data: {
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        order,
        columnId,
      },
      include: { labels: true },
    });
  }

  async findOne(id: number, userId: number) {
    return this.assertCardOwner(id, userId);
  }

  async update(id: number, userId: number, dto: UpdateCardDto) {
    await this.assertCardOwner(id, userId);

    // If moving to a different column, verify ownership of the target column too
    if (dto.columnId) {
      await this.assertColumnOwner(dto.columnId, userId);
    }

    return this.prisma.card.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.order !== undefined && { order: dto.order }),
        ...(dto.columnId !== undefined && { columnId: dto.columnId }),
      },
      include: { labels: true },
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
