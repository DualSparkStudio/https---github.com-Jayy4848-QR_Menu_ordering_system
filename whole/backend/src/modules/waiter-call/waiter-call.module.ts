import { Module } from '@nestjs/common';
import { WaiterCallController } from './waiter-call.controller';
import { WaiterCallService } from './waiter-call.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { RedisModule } from '../../common/redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [WaiterCallController],
  providers: [WaiterCallService],
  exports: [WaiterCallService],
})
export class WaiterCallModule {}
