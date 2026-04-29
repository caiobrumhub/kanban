import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

@Injectable()
export class BoardsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: number) {
    return this.prisma.board.findMany({
      where: {
        OR: [
          { userId },
          { sharedWith: { some: { userId } } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: { 
        _count: { select: { columns: true } },
        sharedWith: { include: { user: { select: { id: true, name: true, email: true } } } }
      },
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

    const isOwner = board.userId === userId;
    const isShared = await this.prisma.sharedBoard.findFirst({ where: { boardId: id, userId } });

    if (!isOwner && !isShared) {
      throw new ForbiddenException('You do not have access to this board');
    }

    return board;
  }

  async create(userId: number, dto: CreateBoardDto) {
    return this.prisma.board.create({
      data: { title: dto.title, color: dto.color, icon: dto.icon, userId },
    });
  }

  async update(id: number, userId: number, dto: UpdateBoardDto) {
    await this.findOne(id, userId);
    return this.prisma.board.update({ where: { id }, data: dto });
  }

  async remove(id: number, userId: number) {
    const board = await this.findOne(id, userId);
    if (board.userId !== userId) throw new ForbiddenException('Only the owner can delete the board');
    return this.prisma.board.delete({ where: { id } });
  }

  async shareBoard(boardId: number, ownerId: number, shareCode: string) {
    const board = await this.prisma.board.findUnique({ where: { id: boardId } });
    if (!board) throw new NotFoundException('Board not found');
    if (board.userId !== ownerId) throw new ForbiddenException('Only the owner can share this board');

    const targetUser = await this.prisma.user.findUnique({ where: { shareCode } });
    if (!targetUser) throw new NotFoundException('User with this share code not found');
    if (targetUser.id === ownerId) throw new BadRequestException('You cannot share a board with yourself');

    const existingShare = await this.prisma.sharedBoard.findUnique({
      where: { boardId_userId: { boardId, userId: targetUser.id } }
    });
    if (existingShare) throw new BadRequestException('Board is already shared with this user');

    return this.prisma.sharedBoard.create({
      data: { boardId, userId: targetUser.id },
      include: { user: { select: { id: true, name: true, email: true } } }
    });
  }

  async removeSharedBoard(boardId: number, ownerId: number, sharedUserId: number) {
    const board = await this.prisma.board.findUnique({ where: { id: boardId } });
    if (!board) throw new NotFoundException('Board not found');
    if (board.userId !== ownerId) throw new ForbiddenException('Only the owner can remove shares');

    const existingShare = await this.prisma.sharedBoard.findUnique({
      where: { boardId_userId: { boardId, userId: sharedUserId } }
    });
    if (!existingShare) throw new NotFoundException('Share not found');

    return this.prisma.sharedBoard.delete({
      where: { boardId_userId: { boardId, userId: sharedUserId } }
    });
  }
}
