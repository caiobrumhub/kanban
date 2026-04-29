import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BoardsModule } from './modules/boards/boards.module';
import { ColumnsModule } from './modules/columns/columns.module';
import { CardsModule } from './modules/cards/cards.module';
import { AdminModule } from './modules/admin/admin.module';
import { SystemModule } from './modules/system/system.module';
import { ClientsModule } from './modules/clients/clients.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    BoardsModule,
    ColumnsModule,
    CardsModule,
    AdminModule,
    SystemModule,
    ClientsModule,
  ],
})
export class AppModule {}
