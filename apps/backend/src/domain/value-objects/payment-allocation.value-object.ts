import { Money } from './money.value-object';

export enum PaymentSource {
  COMPANY = 'COMPANY',
  EMPLOYEE_WALLET = 'EMPLOYEE_WALLET',
  HYBRID = 'HYBRID',
}

export class PaymentAllocation {
  readonly totalAmount: Money;
  readonly source: PaymentSource;
  readonly companyContribution: Money;
  readonly employeeContribution: Money;

  constructor({
    companyContribution,
    employeeContribution,
  }: {
    companyContribution: Money;
    employeeContribution: Money;
  }) {
    if (!companyContribution.currency || !employeeContribution.currency) {
      throw new Error('Payment contributions must have valid currencies');
    }

    if (companyContribution.currency !== employeeContribution.currency) {
      throw new Error('All contributions must be in the same currency');
    }

    this.companyContribution = companyContribution;
    this.employeeContribution = employeeContribution;
    this.totalAmount = companyContribution.add(employeeContribution);
    this.source = this.determineSource(
      companyContribution,
      employeeContribution,
    );
  }

  static companyPaid(amount: Money): PaymentAllocation {
    return new PaymentAllocation({
      companyContribution: amount,
      employeeContribution: Money.zero(amount.currency),
    });
  }

  static employeePaid(amount: Money): PaymentAllocation {
    return new PaymentAllocation({
      companyContribution: Money.zero(amount.currency),
      employeeContribution: amount,
    });
  }

  static hybrid(
    companyAmount: Money,
    employeeAmount: Money,
  ): PaymentAllocation {
    return new PaymentAllocation({
      companyContribution: companyAmount,
      employeeContribution: employeeAmount,
    });
  }

  static fromPercentage(
    totalAmount: Money,
    companyPercentage: number,
  ): PaymentAllocation {
    if (companyPercentage < 0 || companyPercentage > 100) {
      throw new Error('Company percentage must be between 0 and 100');
    }

    const companyAmount = totalAmount.multiply(companyPercentage / 100);
    const employeeAmount = totalAmount.subtract(companyAmount);

    return new PaymentAllocation({
      companyContribution: companyAmount,
      employeeContribution: employeeAmount,
    });
  }

  canBeProcessed(walletBalance: Money): boolean {
    return walletBalance.isGreaterThanOrEqualTo(this.employeeContribution);
  }

  private determineSource(
    companyContribution: Money,
    employeeContribution: Money,
  ): PaymentSource {
    const hasCompany = companyContribution.amount > 0;
    const hasEmployee = employeeContribution.amount > 0;

    if (hasCompany && hasEmployee) return PaymentSource.HYBRID;
    if (hasCompany) return PaymentSource.COMPANY;
    if (hasEmployee) return PaymentSource.EMPLOYEE_WALLET;

    // Allow zero amounts for initialization (empty subscriptions)
    return PaymentSource.COMPANY;
  }

  getCompanyPercentage(): number {
    if (this.totalAmount.amount === 0) return 0;
    return (this.companyContribution.amount / this.totalAmount.amount) * 100;
  }

  getEmployeePercentage(): number {
    if (this.totalAmount.amount === 0) return 0;
    return (this.employeeContribution.amount / this.totalAmount.amount) * 100;
  }

  combine(other: PaymentAllocation): PaymentAllocation {
    return new PaymentAllocation({
      companyContribution: this.companyContribution.add(
        other.companyContribution,
      ),
      employeeContribution: this.employeeContribution.add(
        other.employeeContribution,
      ),
    });
  }

  toString(): string {
    return `Total: ${this.totalAmount.toString()}, Company: ${this.companyContribution.toString()}, Employee: ${this.employeeContribution.toString()}`;
  }

  toJSON() {
    return {
      companyContribution: this.companyContribution.toJSON(),
      employeeContribution: this.employeeContribution.toJSON(),
      totalAmount: this.totalAmount.toJSON(),
      source: this.source,
      companyPercentage: this.getCompanyPercentage(),
      employeePercentage: this.getEmployeePercentage(),
    };
  }
}
