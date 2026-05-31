import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { RestaurantModule } from './modules/restaurant/restaurant.module';
import { TableModule } from './modules/table/table.module';
import { MenuModule } from './modules/menu/menu.module';
import { OrderModule } from './modules/order/order.module';
import { WaiterCallModule } from './modules/waiter-call/waiter-call.module';
import { PaymentModule } from './modules/payment/payment.module';
import { NotificationModule } from './modules/notification/notification.module';
import { WebSocketModule } from './modules/websocket/websocket.module';
import { AdminModule } from './modules/admin/admin.module';
import { ReportModule } from './modules/report/report.module';
import { CouponModule } from './modules/coupon/coupon.module';
import { ReviewModule } from './modules/review/review.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    RedisModule,
    AuthModule,
    RestaurantModule,
    TableModule,
    MenuModule,
    OrderModule,
    WaiterCallModule,
    PaymentModule,
    NotificationModule,
    WebSocketModule,
    AdminModule,
    ReportModule,
    CouponModule,
    ReviewModule,
  ],
})
export class AppModule {}
