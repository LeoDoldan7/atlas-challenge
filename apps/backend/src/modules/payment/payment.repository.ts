import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionType, ItemRole } from '@prisma/client';
import { PaymentProcessorService } from '../../domain/services/payment-processor.service';
import { PaymentAllocation } from '../../domain/value-objects/payment-allocation.value-object';
import { Money } from '../../domain/value-objects/money.value-object';
import { Decimal } from 'decimal.js';

interface EmployeeWithWalletAndSubscriptions {
  id: bigint;
  wallet: {
    balance_cents: bigint;
  } | null;
  subscriptions: Array<{
    id: bigint;
    last_payment_at: Date | null;
    plan: {
      cost_employee_cents: bigint;
      cost_spouse_cents: bigint;
      cost_child_cents: bigint;
      pct_employee_paid_by_company: Decimal;
      pct_spouse_paid_by_company: Decimal;
      pct_child_paid_by_company: Decimal;
    };
    items: Array<{
      role: ItemRole;
    }>;
  }>;
}

interface EmployeeWithWallet {
  id: bigint;
  wallet: {
    balance_cents: bigint;
  };
  subscriptions: Array<{
    id: bigint;
    last_payment_at: Date | null;
    plan: {
      cost_employee_cents: bigint;
      cost_spouse_cents: bigint;
      cost_child_cents: bigint;
      pct_employee_paid_by_company: Decimal;
      pct_spouse_paid_by_company: Decimal;
      pct_child_paid_by_company: Decimal;
    };
    items: Array<{
      role: ItemRole;
    }>;
  }>;
}

interface PaymentResult {
  success: boolean;
  employeeId: string;
  amountPaid?: string;
  subscriptionsPaid?: number;
  error?: string;
  partialSuccess?: boolean;
}

interface BatchPaymentResult {
  overallSuccess: boolean;
  totalAmountProcessed: string;
  successfulPayments: PaymentResult[];
  failedPayments: PaymentResult[];
  partialFailures: PaymentResult[];
}

@Injectable()
export class PaymentRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentProcessor: PaymentProcessorService,
  ) {}

  async getEmployeesWithSubscriptionsForCompany(companyId: string) {
    return this.prisma.employee.findMany({
      where: {
        company_id: BigInt(companyId),
      },
      include: {
        wallet: true,
        subscriptions: {
          where: {
            status: 'active',
          },
          include: {
            plan: true,
            items: true,
          },
        },
      },
    });
  }

  async processPayments(companyId: string): Promise<BatchPaymentResult> {
    const employees = await this.prisma.employee.findMany({
      where: {
        company_id: BigInt(companyId),
      },
      include: {
        wallet: true,
        subscriptions: {
          where: {
            status: 'active',
          },
          include: {
            plan: true,
            items: true,
          },
        },
      },
    });

    const currentDate = new Date();
    const currentMonth = new Date(
      Date.UTC(currentDate.getFullYear(), currentDate.getMonth(), 1),
    );

    const successfulPayments: PaymentResult[] = [];
    const failedPayments: PaymentResult[] = [];
    const partialFailures: PaymentResult[] = [];
    let totalAmountProcessed = BigInt(0);

    // Process each employee independently
    for (const employee of employees) {
      if (!employee.wallet) {
        failedPayments.push({
          success: false,
          employeeId: employee.id.toString(),
          error: 'No wallet found for employee',
        });
        continue;
      }

      try {
        const result = await this.processEmployeePayments(
          employee,
          currentMonth,
          currentDate,
        );

        if (result.success) {
          successfulPayments.push(result);
          totalAmountProcessed += BigInt(result.amountPaid || '0');
        } else if (result.partialSuccess) {
          partialFailures.push(result);
          totalAmountProcessed += BigInt(result.amountPaid || '0');
        } else {
          failedPayments.push(result);
        }
      } catch (error) {
        failedPayments.push({
          success: false,
          employeeId: employee.id.toString(),
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      overallSuccess:
        failedPayments.length === 0 && partialFailures.length === 0,
      totalAmountProcessed: totalAmountProcessed.toString(),
      successfulPayments,
      failedPayments,
      partialFailures,
    };
  }

  private async processEmployeePayments(
    employee: EmployeeWithWalletAndSubscriptions,
    currentMonth: Date,
    currentDate: Date,
  ): Promise<PaymentResult> {
    if (!employee.wallet) {
      return {
        success: false,
        employeeId: employee.id.toString(),
        error: 'No wallet found for employee',
      };
    }

    return this.processEmployeePaymentsWithWallet(
      employee as EmployeeWithWallet,
      currentMonth,
      currentDate,
    );
  }

  private async processEmployeePaymentsWithWallet(
    employee: EmployeeWithWallet,
    currentMonth: Date,
    currentDate: Date,
  ): Promise<PaymentResult> {
    return this.prisma.$transaction(async (prisma) => {
      let totalAmountPaid = BigInt(0);
      let subscriptionsPaid = 0;
      const failedSubscriptions: string[] = [];

      for (const subscription of employee.subscriptions) {
        // Skip if already paid this month
        if (
          subscription.last_payment_at &&
          new Date(subscription.last_payment_at) >= currentMonth
        ) {
          continue;
        }

        try {
          // Calculate payment allocation for this subscription
          const subscriptionAllocation =
            this.calculateSubscriptionPaymentAllocation(subscription);

          // Validate payment can be processed
          const currentWalletBalance = new Money(
            Number(employee.wallet.balance_cents) - Number(totalAmountPaid),
            'USD',
          );

          if (
            !this.paymentProcessor.validatePayment(
              subscriptionAllocation,
              currentWalletBalance,
            )
          ) {
            failedSubscriptions.push(
              `Subscription ${subscription.id}: Insufficient funds`,
            );
            continue;
          }

          // Process payment using domain service
          const paymentResult = this.paymentProcessor.processPayment(
            subscriptionAllocation,
            currentWalletBalance,
            {
              subscriptionId: subscription.id.toString(),
              employeeId: employee.id.toString(),
            },
          );

          if (!paymentResult.success) {
            failedSubscriptions.push(
              `Subscription ${subscription.id}: ${paymentResult.errorMessage}`,
            );
            continue;
          }

          // Deduct employee portion from wallet if any
          if (subscriptionAllocation.employeeContribution.amount > 0) {
            await prisma.wallet.update({
              where: { employee_id: employee.id },
              data: {
                balance_cents: {
                  decrement: BigInt(
                    subscriptionAllocation.employeeContribution.amount * 100,
                  ),
                },
              },
            });
          }

          // Create transaction record
          await prisma.transaction.create({
            data: {
              employee_id: employee.id,
              healthcare_subscription_id: subscription.id,
              type: TransactionType.subscription_payment,
              amount_cents: BigInt(
                subscriptionAllocation.totalAmount.amount * 100,
              ),
              currency_code: 'USD',
              description: `Monthly subscription payment - ${paymentResult.transactionId}`,
            },
          });

          // Update subscription last payment date
          await prisma.healthcareSubscription.update({
            where: { id: subscription.id },
            data: {
              last_payment_at: currentDate,
            },
          });

          totalAmountPaid += BigInt(
            subscriptionAllocation.totalAmount.amount * 100,
          );
          subscriptionsPaid++;
        } catch (error) {
          failedSubscriptions.push(
            `Subscription ${subscription.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      }

      // Determine result type
      if (subscriptionsPaid > 0 && failedSubscriptions.length === 0) {
        return {
          success: true,
          employeeId: employee.id.toString(),
          amountPaid: totalAmountPaid.toString(),
          subscriptionsPaid,
        };
      } else if (subscriptionsPaid > 0 && failedSubscriptions.length > 0) {
        return {
          success: false,
          partialSuccess: true,
          employeeId: employee.id.toString(),
          amountPaid: totalAmountPaid.toString(),
          subscriptionsPaid,
          error: `Partial success: ${failedSubscriptions.join('; ')}`,
        };
      } else {
        return {
          success: false,
          employeeId: employee.id.toString(),
          error:
            failedSubscriptions.join('; ') || 'No subscriptions to process',
        };
      }
    });
  }

  private calculateSubscriptionPaymentAllocation(
    subscription: EmployeeWithWallet['subscriptions'][0],
  ): PaymentAllocation {
    let totalCompanyContribution = 0;
    let totalEmployeeContribution = 0;

    for (const item of subscription.items) {
      const planCost = subscription.plan;
      let itemCostCents = 0;
      let companyPaidPct = 0;

      switch (item.role) {
        case ItemRole.employee:
          itemCostCents = Number(planCost.cost_employee_cents);
          companyPaidPct = Number(planCost.pct_employee_paid_by_company);
          break;
        case ItemRole.spouse:
          itemCostCents = Number(planCost.cost_spouse_cents);
          companyPaidPct = Number(planCost.pct_spouse_paid_by_company);
          break;
        case ItemRole.child:
          itemCostCents = Number(planCost.cost_child_cents);
          companyPaidPct = Number(planCost.pct_child_paid_by_company);
          break;
        default:
          throw new Error(`Unknown item role: ${String(item.role)}`);
      }

      const itemCost = itemCostCents / 100; // Convert cents to dollars
      const companyPortion = (itemCost * companyPaidPct) / 100;
      const employeePortion = itemCost - companyPortion;

      totalCompanyContribution += companyPortion;
      totalEmployeeContribution += employeePortion;
    }

    const companyAmount = new Money(totalCompanyContribution, 'USD');
    const employeeAmount = new Money(totalEmployeeContribution, 'USD');

    if (totalEmployeeContribution === 0) {
      return PaymentAllocation.companyPaid(companyAmount);
    } else if (totalCompanyContribution === 0) {
      return PaymentAllocation.employeePaid(employeeAmount);
    } else {
      return PaymentAllocation.hybrid(companyAmount, employeeAmount);
    }
  }
}
