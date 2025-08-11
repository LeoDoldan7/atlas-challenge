import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentRepository } from './payment.repository';
import { PaymentResolver } from '../../graphql/payment/resolver/payment.resolver';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  providers: [PaymentService, PaymentRepository, PaymentResolver, PrismaService],
  exports: [PaymentService],
})
export class PaymentModule {}