import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SystemService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Seed default parameters if they don't exist
    await this.initParams();
  }

  private async initParams() {
    const defaultParams = [
      {
        key: 'REQUIRE_CLIENT_DOCUMENT',
        value: 'true',
        description: 'Se verdadeiro, CPF/CNPJ é obrigatório no cadastro de cliente.',
      }
    ];

    for (const param of defaultParams) {
      const exists = await this.prisma.systemParameter.findUnique({ where: { key: param.key } });
      if (!exists) {
        await this.prisma.systemParameter.create({ data: param });
      }
    }
  }

  async findAll() {
    return this.prisma.systemParameter.findMany({ orderBy: { key: 'asc' } });
  }

  async findByKey(key: string) {
    return this.prisma.systemParameter.findUnique({ where: { key } });
  }

  async update(key: string, value: string) {
    return this.prisma.systemParameter.update({
      where: { key },
      data: { value },
    });
  }
}
