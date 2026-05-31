import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payments')
export class PaymentController {
  constructor(private service: PaymentService) {}

  @Post('razorpay/create/:orderId')
  createRazorpay(@Param('orderId') orderId: string) {
    return this.service.createRazorpayOrder(orderId);
  }

  @Post('razorpay/verify')
  verifyRazorpay(@Body() body: { paymentId: string; razorpayPaymentId: string; razorpaySignature: string }) {
    return this.service.verifyRazorpayPayment(body.paymentId, body.razorpayPaymentId, body.razorpaySignature);
  }

  @Post('cash/:orderId')
  @UseGuards(JwtAuthGuard)
  recordCash(@Param('orderId') orderId: string) {
    return this.service.recordCashPayment(orderId);
  }
}
