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
import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { CreateLabelDto } from './dto/create-label.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller()
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Post('columns/:columnId/cards')
  create(
    @Param('columnId', ParseIntPipe) columnId: number,
    @CurrentUser('id') userId: number,
    @Body() dto: CreateCardDto,
  ) {
    return this.cardsService.create(columnId, userId, dto);
  }

  @Get('cards/:id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.cardsService.findOne(id, userId);
  }

  @Patch('cards/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateCardDto,
  ) {
    return this.cardsService.update(id, userId, dto);
  }

  @Delete('cards/:id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.cardsService.remove(id, userId);
  }

  @Post('cards/:id/labels')
  addLabel(
    @Param('id', ParseIntPipe) cardId: number,
    @CurrentUser('id') userId: number,
    @Body() dto: CreateLabelDto,
  ) {
    return this.cardsService.addLabel(cardId, userId, dto);
  }

  @Delete('cards/:id/labels/:labelId')
  removeLabel(
    @Param('id', ParseIntPipe) cardId: number,
    @Param('labelId', ParseIntPipe) labelId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.cardsService.removeLabel(cardId, labelId, userId);
  }

  // ─── Checklists ───────────────────────────────────────────────────────────────

  @Post('cards/:id/checklists')
  createChecklist(
    @Param('id', ParseIntPipe) cardId: number,
    @CurrentUser('id') userId: number,
    @Body() dto: any,
  ) {
    return this.cardsService.createChecklist(cardId, userId, dto);
  }

  @Delete('cards/:id/checklists/:checklistId')
  deleteChecklist(
    @Param('id', ParseIntPipe) cardId: number,
    @Param('checklistId', ParseIntPipe) checklistId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.cardsService.deleteChecklist(cardId, checklistId, userId);
  }

  @Post('cards/:id/checklists/:checklistId/items')
  createChecklistItem(
    @Param('id', ParseIntPipe) cardId: number,
    @Param('checklistId', ParseIntPipe) checklistId: number,
    @CurrentUser('id') userId: number,
    @Body() dto: any,
  ) {
    return this.cardsService.createChecklistItem(cardId, checklistId, userId, dto);
  }

  @Patch('cards/:id/checklists/:checklistId/items/:itemId')
  updateChecklistItem(
    @Param('id', ParseIntPipe) cardId: number,
    @Param('checklistId', ParseIntPipe) checklistId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @CurrentUser('id') userId: number,
    @Body() dto: any,
  ) {
    return this.cardsService.updateChecklistItem(cardId, checklistId, itemId, userId, dto);
  }

  @Delete('cards/:id/checklists/:checklistId/items/:itemId')
  deleteChecklistItem(
    @Param('id', ParseIntPipe) cardId: number,
    @Param('checklistId', ParseIntPipe) checklistId: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.cardsService.deleteChecklistItem(cardId, checklistId, itemId, userId);
  }

  @Post('columns/:columnId/cards/reorder')
  reorder(
    @Param('columnId', ParseIntPipe) columnId: number,
    @CurrentUser('id') userId: number,
    @Body('orderedIds') orderedIds: number[],
  ) {
    return this.cardsService.reorder(columnId, userId, orderedIds);
  }
}
