import { Money } from '../value-objects/money.value-object';

describe('Money Value Object', () => {
  describe('Construction', () => {
    it('should create money with positive amount', () => {
      const money = Money.fromAmount(100.5, 'USD');
      expect(money.amount).toBe(100.5);
      expect(money.currency).toBe('USD');
    });

    it('should round amount to 2 decimal places', () => {
      const money = Money.fromAmount(100.999, 'USD');
      expect(money.amount).toBe(101);
    });

    it('should convert currency to uppercase', () => {
      const money = Money.fromAmount(100, 'usd');
      expect(money.currency).toBe('USD');
    });

    it('should default to USD currency', () => {
      const money = Money.fromAmount(100);
      expect(money.currency).toBe('USD');
    });

    it('should throw error for negative amount', () => {
      expect(() => Money.fromAmount(-10)).toThrow(
        'Money amount cannot be negative',
      );
    });

    it('should throw error for invalid currency', () => {
      expect(() => Money.fromAmount(100, '')).toThrow('Invalid currency code');
      expect(() => Money.fromAmount(100, 'US')).toThrow(
        'Invalid currency code',
      );
      expect(() => Money.fromAmount(100, 'USDD')).toThrow(
        'Invalid currency code',
      );
    });
  });

  describe('Static Factory Methods', () => {
    it('should create zero money', () => {
      const money = Money.zero();
      expect(money.amount).toBe(0);
      expect(money.currency).toBe('USD');
    });

    it('should create zero money with specific currency', () => {
      const money = Money.zero('EUR');
      expect(money.amount).toBe(0);
      expect(money.currency).toBe('EUR');
    });
  });

  describe('Arithmetic Operations', () => {
    const usd100 = Money.fromAmount(100, 'USD');
    const usd50 = Money.fromAmount(50, 'USD');
    const eur100 = Money.fromAmount(100, 'EUR');

    it('should add money with same currency', () => {
      const result = usd100.add(usd50);
      expect(result.amount).toBe(150);
      expect(result.currency).toBe('USD');
    });

    it('should throw error when adding different currencies', () => {
      expect(() => usd100.add(eur100)).toThrow(
        'Cannot add money with different currencies',
      );
    });

    it('should subtract money with same currency', () => {
      const result = usd100.subtract(usd50);
      expect(result.amount).toBe(50);
      expect(result.currency).toBe('USD');
    });

    it('should throw error when subtracting different currencies', () => {
      expect(() => usd100.subtract(eur100)).toThrow(
        'Cannot subtract money with different currencies',
      );
    });

    it('should throw error when subtraction results in negative', () => {
      expect(() => usd50.subtract(usd100)).toThrow('Insufficient funds');
    });

    it('should multiply money by positive factor', () => {
      const result = usd100.multiply(2.5);
      expect(result.amount).toBe(250);
      expect(result.currency).toBe('USD');
    });

    it('should throw error when multiplying by negative factor', () => {
      expect(() => usd100.multiply(-2)).toThrow(
        'Cannot multiply money by negative factor',
      );
    });
  });

  describe('Comparison Operations', () => {
    const usd100 = Money.fromAmount(100, 'USD');
    const usd150 = Money.fromAmount(150, 'USD');
    const usd100Copy = Money.fromAmount(100, 'USD');
    const eur100 = Money.fromAmount(100, 'EUR');

    it('should compare greater than correctly', () => {
      expect(usd150.isGreaterThanOrEqualTo(usd100)).toBe(true);
      expect(usd100.isGreaterThanOrEqualTo(usd150)).toBe(false);
    });

    it('should compare equality correctly', () => {
      expect(usd100.isGreaterThanOrEqualTo(usd100Copy)).toBe(true);
      expect(usd100.isGreaterThanOrEqualTo(usd150)).toBe(false);
    });

    it('should throw error when comparing different currencies', () => {
      expect(() => usd100.isGreaterThanOrEqualTo(eur100)).toThrow(
        'Currency mismatch: USD vs EUR',
      );
    });
  });

  describe('Utility Methods', () => {
    const money = Money.fromAmount(123.45, 'USD');

    it('should convert to string', () => {
      expect(money.toString()).toBe('USD 123.45');
    });

    it('should convert to JSON', () => {
      const json = money.toJSON();
      expect(json).toEqual({
        amount: 123.45,
        currency: 'USD',
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero amounts', () => {
      const zero = Money.fromAmount(0);
      expect(zero.amount).toBe(0);
    });

    it('should handle very small amounts', () => {
      const small = Money.fromAmount(0.01);
      expect(small.amount).toBe(0.01);
    });

    it('should handle large amounts', () => {
      const large = Money.fromAmount(999999.99);
      expect(large.amount).toBe(999999.99);
    });
  });
});
