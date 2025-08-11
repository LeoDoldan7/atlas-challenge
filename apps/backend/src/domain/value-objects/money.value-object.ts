export class Money {
  private readonly cents: number;
  readonly currency: string;

  private constructor(cents: number, currency: string) {
    if (cents < 0) {
      throw new Error('Money amount cannot be negative');
    }
    if (!currency || currency.length !== 3) {
      throw new Error('Invalid currency code');
    }
    this.cents = cents;
    this.currency = currency.toUpperCase();
  }

  static fromAmount(amount: number, currency = 'USD'): Money {
    return new Money(Math.round(amount * 100), currency);
  }

  static zero(currency = 'USD'): Money {
    return Money.fromAmount(0, currency);
  }

  static fromCents(cents: number | bigint, currency = 'USD'): Money {
    return new Money(Number(cents), currency);
  }

  get amount(): number {
    return this.cents / 100;
  }

  toCents(): number {
    return this.cents;
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add money with different currencies');
    }
    return Money.fromCents(this.cents + other.cents, this.currency);
  }

  subtract(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot subtract money with different currencies');
    }
    const resultCents = this.cents - other.cents;
    if (resultCents < 0) {
      throw new Error('Insufficient funds');
    }
    return Money.fromCents(resultCents, this.currency);
  }

  multiply(factor: number): Money {
    if (factor < 0) {
      throw new Error('Cannot multiply money by negative factor');
    }
    return Money.fromCents(Math.round(this.cents * factor), this.currency);
  }

  isGreaterThanOrEqualTo(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.cents >= other.cents;
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(
        `Currency mismatch: ${this.currency} vs ${other.currency}`,
      );
    }
  }

  toString(): string {
    return `${this.currency} ${this.amount.toFixed(2)}`;
  }

  toJSON() {
    return {
      amount: this.amount,
      currency: this.currency,
    };
  }
}
