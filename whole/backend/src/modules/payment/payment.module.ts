import { Module, forwardRef } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { OrderModule } from '../order/order.module';

@Module({ 
  imports: [PrismaModule, forwardRef(() => OrderModule)], 
  controllers: [PaymentController], 
  providers: [PaymentService], 
  exports: [PaymentService] 
})
export class PaymentModule {}
