import { Injectable } from '@nestjs/common';
import { PaymentRepository } from './payment.repository';

export interface BatchPaymentSummary {
  overallSuccess: boolean;
  totalAmountProcessed: string;
  totalSuccessfulPayments: number;
  totalFailedPayments: number;
  totalPartialFailures: number;
  employeeResults: Array<{
    employeeId: string;
    success: boolean;
    amountPaid?: string;
    subscriptionsPaid?: number;
    error?: string;
    partialSuccess?: boolean;
  }>;
}

@Injectable()
export class PaymentService {
  constructor(private readonly repository: PaymentRepository) {}

  async processCompanySubscriptionPayments(
    companyId: string,
  ): Promise<BatchPaymentSummary> {
    try {
      const result = await this.repository.processPayments(companyId);

      const employeeResults = [
        ...result.successfulPayments.map((p) => ({
          employeeId: p.employeeId,
          success: p.success,
          amountPaid: p.amountPaid,
          subscriptionsPaid: p.subscriptionsPaid,
        })),
        ...result.failedPayments.map((p) => ({
          employeeId: p.employeeId,
          success: p.success,
          error: p.error,
        })),
        ...result.partialFailures.map((p) => ({
          employeeId: p.employeeId,
          success: p.success,
          amountPaid: p.amountPaid,
          subscriptionsPaid: p.subscriptionsPaid,
          error: p.error,
          partialSuccess: p.partialSuccess,
        })),
      ];

      return {
        overallSuccess: result.overallSuccess,
        totalAmountProcessed: result.totalAmountProcessed,
        totalSuccessfulPayments: result.successfulPayments.length,
        totalFailedPayments: result.failedPayments.length,
        totalPartialFailures: result.partialFailures.length,
        employeeResults,
      };
    } catch (error) {
      throw new Error(
        `Payment processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async getEmployeesWithSubscriptions(companyId: string) {
    return this.repository.getEmployeesWithSubscriptionsForCompany(companyId);
  }
}
