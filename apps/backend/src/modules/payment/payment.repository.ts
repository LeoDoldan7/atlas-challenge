import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, TransactionType } from '@prisma/client';

@Injectable()
export class PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

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

  async processPayments(companyId: string) {
    return this.prisma.$transaction(async (prisma) => {
      const employees = await prisma.employee.findMany({
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

      // Calculate total needed and check if all employees have sufficient funds
      let totalNeeded = BigInt(0);
      const employeePayments: Array<{
        employeeId: bigint;
        totalCost: bigint;
        subscriptions: Array<{
          id: bigint;
          cost: bigint;
        }>;
      }> = [];

      for (const employee of employees) {
        if (!employee.wallet) continue;

        let employeeTotalCost = BigInt(0);
        const subscriptionCosts: Array<{ id: bigint; cost: bigint }> = [];

        for (const subscription of employee.subscriptions) {
          // Skip if already paid this month
          if (
            subscription.last_payment_at &&
            new Date(subscription.last_payment_at) >= currentMonth
          ) {
            continue;
          }

          let subscriptionCost = BigInt(0);

          // Calculate cost based on subscription items
          for (const item of subscription.items) {
            const planCost = subscription.plan;
            let itemCost = BigInt(0);
            let companyPaidPct = 0;

            switch (item.role) {
              case 'employee':
                itemCost = BigInt(planCost.cost_employee_cents);
                companyPaidPct = Number(planCost.pct_employee_paid_by_company);
                break;
              case 'spouse':
                itemCost = BigInt(planCost.cost_spouse_cents);
                companyPaidPct = Number(planCost.pct_spouse_paid_by_company);
                break;
              case 'child':
                itemCost = BigInt(planCost.cost_child_cents);
                companyPaidPct = Number(planCost.pct_child_paid_by_company);
                break;
            }

            // Calculate employee portion (company pays a percentage)
            const employeePortion =
              (itemCost * BigInt(100 - companyPaidPct)) / BigInt(100);
            subscriptionCost += employeePortion;
          }

          if (subscriptionCost > 0) {
            subscriptionCosts.push({
              id: subscription.id,
              cost: subscriptionCost,
            });
            employeeTotalCost += subscriptionCost;
          }
        }

        if (employeeTotalCost > 0) {
          // Check if employee has sufficient funds
          if (employee.wallet.balance_cents < employeeTotalCost) {
            throw new Error(
              `Insufficient funds for employee ${employee.id}. Required: ${employeeTotalCost}, Available: ${employee.wallet.balance_cents}`,
            );
          }

          employeePayments.push({
            employeeId: employee.id,
            totalCost: employeeTotalCost,
            subscriptions: subscriptionCosts,
          });
          totalNeeded += employeeTotalCost;
        }
      }

      // If we reach here, all employees have sufficient funds, so process payments
      const results: Array<{
        employeeId: string;
        amountPaid: string;
        subscriptionsPaid: number;
      }> = [];

      for (const payment of employeePayments) {
        // Deduct from wallet
        await prisma.wallet.update({
          where: { employee_id: payment.employeeId },
          data: {
            balance_cents: {
              decrement: payment.totalCost,
            },
          },
        });

        // Create transaction records
        for (const subPayment of payment.subscriptions) {
          await prisma.transaction.create({
            data: {
              employee_id: payment.employeeId,
              healthcare_subscription_id: subPayment.id,
              type: TransactionType.subscription_payment,
              amount_cents: subPayment.cost,
              currency_code: 'USD',
              description: `Monthly subscription payment`,
            },
          });

          // Update subscription last payment date
          await prisma.healthcareSubscription.update({
            where: { id: subPayment.id },
            data: {
              last_payment_at: currentDate,
            },
          });
        }

        results.push({
          employeeId: payment.employeeId.toString(),
          amountPaid: payment.totalCost.toString(),
          subscriptionsPaid: payment.subscriptions.length,
        });
      }

      return {
        success: true,
        totalAmountProcessed: totalNeeded.toString(),
        employeePayments: results,
      };
    });
  }
}
