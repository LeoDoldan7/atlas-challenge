import { Injectable } from '@nestjs/common';
import { PaymentRepository } from './payment.repository';

export interface PaymentResult {
  success: boolean;
  totalAmountProcessed: string;
  employeePayments: Array<{
    employeeId: string;
    amountPaid: string;
    subscriptionsPaid: number;
  }>;
}

@Injectable()
export class PaymentService {
  constructor(private readonly repository: PaymentRepository) {}

  async processCompanySubscriptionPayments(companyId: string): Promise<PaymentResult> {
    try {
      return await this.repository.processPayments(companyId);
    } catch (error) {
      throw new Error(`Payment processing failed: ${error.message}`);
    }
  }

  async getEmployeesWithSubscriptions(companyId: string) {
    return this.repository.getEmployeesWithSubscriptionsForCompany(companyId);
  }
}