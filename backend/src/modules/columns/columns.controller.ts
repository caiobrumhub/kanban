import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ColumnsService } from './columns.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller()
export class ColumnsController {
  constructor(private readonly columnsService: ColumnsService) {}

  @Post('boards/:boardId/columns')
  create(
    @Param('boardId', ParseIntPipe) boardId: number,
    @CurrentUser('id') userId: number,
    @Body() dto: CreateColumnDto,
  ) {
    return this.columnsService.create(boardId, userId, dto);
  }

  @Patch('columns/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateColumnDto,
  ) {
    return this.columnsService.update(id, userId, dto);
  }

  @Delete('columns/:id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.columnsService.remove(id, userId);
  }

  @Post('boards/:boardId/columns/reorder')
  reorder(
    @Param('boardId', ParseIntPipe) boardId: number,
    @CurrentUser('id') userId: number,
    @Body('orderedIds') orderedIds: number[],
  ) {
    return this.columnsService.reorder(boardId, userId, orderedIds);
  }
}
