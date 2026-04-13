import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';

@Injectable()
export class ColumnsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertBoardOwner(boardId: number, userId: number) {
    const board = await this.prisma.board.findUnique({ where: { id: boardId } });
    if (!board) throw new NotFoundException('Board not found');
    if (board.userId !== userId) throw new ForbiddenException();
    return board;
  }

  private async assertColumnOwner(columnId: number, userId: number) {
    const column = await this.prisma.column.findUnique({
      where: { id: columnId },
      include: { board: true },
    });
    if (!column) throw new NotFoundException('Column not found');
    if (column.board.userId !== userId) throw new ForbiddenException();
    return column;
  }

  async create(boardId: number, userId: number, dto: CreateColumnDto) {
    await this.assertBoardOwner(boardId, userId);

    const lastColumn = await this.prisma.column.findFirst({
      where: { boardId },
      orderBy: { order: 'desc' },
    });
    const order = dto.order ?? (lastColumn ? lastColumn.order + 1 : 0);

    return this.prisma.column.create({
      data: { title: dto.title, order, boardId },
    });
  }

  async update(id: number, userId: number, dto: UpdateColumnDto) {
    await this.assertColumnOwner(id, userId);
    return this.prisma.column.update({ where: { id }, data: dto });
  }

  async remove(id: number, userId: number) {
    await this.assertColumnOwner(id, userId);
    return this.prisma.column.delete({ where: { id } });
  }

  async reorder(boardId: number, userId: number, orderedIds: number[]) {
    await this.assertBoardOwner(boardId, userId);
    const updates = orderedIds.map((id, index) =>
      this.prisma.column.update({ where: { id }, data: { order: index } }),
    );
    await this.prisma.$transaction(updates);
    return { success: true };
  }
}
