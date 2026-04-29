import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Get()
  findAll(@CurrentUser('id') userId: number) {
    return this.boardsService.findAll(userId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.boardsService.findOne(id, userId);
  }

  @Post()
  create(
    @CurrentUser('id') userId: number,
    @Body() dto: CreateBoardDto,
  ) {
    return this.boardsService.create(userId, dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateBoardDto,
  ) {
    return this.boardsService.update(id, userId, dto);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.boardsService.remove(id, userId);
  }

  @Post(':id/share')
  shareBoard(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body('shareCode') shareCode: string,
  ) {
    return this.boardsService.shareBoard(id, userId, shareCode);
  }

  @Delete(':id/share/:sharedUserId')
  removeSharedBoard(
    @Param('id', ParseIntPipe) id: number,
    @Param('sharedUserId', ParseIntPipe) sharedUserId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.boardsService.removeSharedBoard(id, userId, sharedUserId);
  }
}
