import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  findAll() {
    return this.clientsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.findOne(id);
  }

  @Post()
  create(@Request() req, @Body() dto: CreateClientDto) {
    return this.clientsService.create(req.user.sub, dto);
  }

  @Patch(':id')
  update(@Request() req, @Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateClientDto>) {
    return this.clientsService.update(id, req.user.sub, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.remove(id);
  }
}
