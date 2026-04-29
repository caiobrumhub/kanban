import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { DatabaseModule } from '../../database/database.module';
import { SystemModule } from '../system/system.module';

@Module({
  imports: [DatabaseModule, SystemModule],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService]
})
export class ClientsModule {}
