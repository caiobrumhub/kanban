import { Controller, Get, Patch, Post, Body, Param, UseGuards, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import * as bcrypt from 'bcrypt';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('users')
  async getUsers() {
    const users = await this.prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    return users;
  }

  @Patch('users/:id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number, 
    @Body() body: { name?: string; email?: string; role?: 'USER' | 'ADMIN'; isActive?: boolean }
  ) {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.email && { email: body.email }),
        ...(body.role && { role: body.role }),
        ...(body.isActive !== undefined && { isActive: body.isActive })
      },
      select: { id: true, name: true, email: true, role: true, isActive: true }
    });
    
    // Se o usuário foi inativado, desloga forçadamente
    if (body.isActive === false) {
      await this.prisma.user.update({
        where: { id },
        data: { refreshToken: null }
      });
    }
    
    return user;
  }

  @Post('users/:id/reset-password')
  async resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body('newPassword') newPassword?: string
  ) {
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('A nova senha deve ter pelo menos 6 caracteres.');
    }
    
    const hash = await bcrypt.hash(newPassword, 12);
    
    await this.prisma.user.update({
      where: { id },
      data: { password: hash, refreshToken: null } // Desloga ao resetar senha
    });
    
    return { success: true, message: 'Senha atualizada com sucesso.' };
  }
}
