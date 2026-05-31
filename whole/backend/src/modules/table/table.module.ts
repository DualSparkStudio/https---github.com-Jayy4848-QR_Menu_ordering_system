import { Module } from '@nestjs/common';
import { TableController, TablePublicController } from './table.controller';
import { TableService } from './table.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TablePublicController, TableController],
  providers: [TableService],
  exports: [TableService],
})
export class TableModule {}
