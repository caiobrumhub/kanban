import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

@Injectable()
export class BoardsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: number) {
    return this.prisma.board.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { columns: true } } },
    });
  }

  async findOne(id: number, userId: number) {
    const board = await this.prisma.board.findUnique({
      where: { id },
      include: {
        columns: {
          orderBy: { order: 'asc' },
          include: {
            cards: {
              orderBy: { order: 'asc' },
              include: { labels: true },
            },
          },
        },
      },
    });
    if (!board) throw new NotFoundException('Board not found');
    if (board.userId !== userId) throw new ForbiddenException();
    return board;
  }

  async create(userId: number, dto: CreateBoardDto) {
    return this.prisma.board.create({
      data: { title: dto.title, userId },
    });
  }

  async update(id: number, userId: number, dto: UpdateBoardDto) {
    await this.findOne(id, userId);
    return this.prisma.board.update({ where: { id }, data: dto });
  }

  async remove(id: number, userId: number) {
    await this.findOne(id, userId);
    return this.prisma.board.delete({ where: { id } });
  }
}
