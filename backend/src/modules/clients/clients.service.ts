import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SystemService } from '../system/system.service';
import { CreateClientDto } from './dto/create-client.dto';

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly systemService: SystemService
  ) {}

  async findAll() {
    return this.prisma.client.findMany({
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        updatedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { name: 'asc' }
    });
  }

  async findOne(id: number) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        updatedBy: { select: { id: true, name: true, email: true } },
      }
    });
    if (!client) throw new NotFoundException('Cliente não encontrado');
    return client;
  }

  async create(userId: number, dto: CreateClientDto) {
    // Validação de parâmetro de sistema
    const requireDocParam = await this.systemService.findByKey('REQUIRE_CLIENT_DOCUMENT');
    if (requireDocParam?.value === 'true' && (!dto.document || dto.document.trim() === '')) {
      throw new BadRequestException('O preenchimento do CPF/CNPJ é obrigatório segundo os parâmetros do sistema.');
    }

    if (!dto.stateRegistration || dto.stateRegistration.trim() === '') {
      dto.stateRegistration = 'ISENTO';
    }

    return this.prisma.client.create({
      data: {
        ...dto,
        createdById: userId,
        updatedById: userId,
      }
    });
  }

  async update(id: number, userId: number, dto: Partial<CreateClientDto>) {
    await this.findOne(id); // Ensure exists

    if (dto.document !== undefined) {
      const requireDocParam = await this.systemService.findByKey('REQUIRE_CLIENT_DOCUMENT');
      if (requireDocParam?.value === 'true' && (!dto.document || dto.document.trim() === '')) {
        throw new BadRequestException('O preenchimento do CPF/CNPJ é obrigatório segundo os parâmetros do sistema.');
      }
    }

    if (dto.stateRegistration !== undefined && dto.stateRegistration.trim() === '') {
      dto.stateRegistration = 'ISENTO';
    }

    return this.prisma.client.update({
      where: { id },
      data: {
        ...dto,
        updatedById: userId,
      }
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.client.delete({ where: { id } });
  }
}
