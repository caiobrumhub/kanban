import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { SystemService } from './system.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller('system/parameters')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @Get()
  async getAllParameters() {
    return this.systemService.findAll();
  }

  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @Patch(':key')
  async updateParameter(
    @Param('key') key: string,
    @Body('value') value: string
  ) {
    return this.systemService.update(key, value);
  }

  @Get(':key')
  async getParameter(@Param('key') key: string) {
    // Both USER and ADMIN can read parameters for validation
    return this.systemService.findByKey(key);
  }
}
