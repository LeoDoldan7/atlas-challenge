import { SubscriptionPeriod } from '../value-objects/subscription-period.value-object';

describe('SubscriptionPeriod Value Object', () => {
  const startDate = new Date('2024-01-01T00:00:00Z');
  const endDate = new Date('2024-01-31T23:59:59Z');

  describe('Construction', () => {
    it('should create period with valid dates', () => {
      const period = new SubscriptionPeriod(startDate, endDate);
      expect(period.getStartDate()).toEqual(startDate);
      expect(period.getEndDate()).toEqual(endDate);
    });

    it('should create new Date instances to prevent mutation', () => {
      const mutableStart = new Date(startDate);
      const mutableEnd = new Date(endDate);
      const period = new SubscriptionPeriod(mutableStart, mutableEnd);

      // Store the original values
      const originalStart = period.getStartDate().getFullYear();
      const originalEnd = period.getEndDate().getFullYear();

      // Mutate the original dates passed to constructor
      mutableStart.setFullYear(2025);
      mutableEnd.setFullYear(2025);

      // The period should be unaffected by the mutation
      expect(period.getStartDate().getFullYear()).toBe(originalStart);
      expect(period.getEndDate().getFullYear()).toBe(originalEnd);
    });

    it('should throw error if start date is after end date', () => {
      expect(() => new SubscriptionPeriod(endDate, startDate)).toThrow(
        'Start date must be before end date',
      );
    });

    it('should throw error if start date equals end date', () => {
      expect(() => new SubscriptionPeriod(startDate, startDate)).toThrow(
        'Start date must be before end date',
      );
    });
  });

  describe('Duration Calculations', () => {
    const period = new SubscriptionPeriod(
      new Date('2024-01-01T00:00:00Z'),
      new Date('2024-01-31T00:00:00Z'),
    );

    it('should calculate duration in days', () => {
      expect(period.getDurationInDays()).toBe(30);
    });

    it('should calculate duration for single day', () => {
      const singleDay = new SubscriptionPeriod(
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-01T23:59:59Z'),
      );
      expect(singleDay.getDurationInDays()).toBe(1);
    });

    it('should calculate duration across months', () => {
      const crossMonth = new SubscriptionPeriod(
        new Date('2024-01-15T00:00:00Z'),
        new Date('2024-02-15T00:00:00Z'),
      );
      expect(crossMonth.getDurationInDays()).toBe(31);
    });
  });

  describe('Status Checks', () => {
    const period = new SubscriptionPeriod(
      new Date('2024-01-01T00:00:00Z'),
      new Date('2024-01-31T23:59:59Z'),
    );

    it('should identify active period', () => {
      const duringPeriod = new Date('2024-01-15T12:00:00Z');
      expect(period.isActive(duringPeriod)).toBe(true);
    });

    it('should identify active at start date', () => {
      const atStart = new Date('2024-01-01T00:00:00Z');
      expect(period.isActive(atStart)).toBe(true);
    });

    it('should identify active at end date', () => {
      const atEnd = new Date('2024-01-31T23:59:59Z');
      expect(period.isActive(atEnd)).toBe(true);
    });

    it('should identify expired period', () => {
      const afterPeriod = new Date('2024-02-01T00:00:00Z');
      expect(period.isExpired(afterPeriod)).toBe(true);
      expect(period.isActive(afterPeriod)).toBe(false);
    });

    it('should identify pending period', () => {
      const beforePeriod = new Date('2023-12-31T23:59:59Z');
      expect(period.isPending(beforePeriod)).toBe(true);
      expect(period.isActive(beforePeriod)).toBe(false);
    });

    it('should use current date when no date provided', () => {
      const currentPeriod = new SubscriptionPeriod(
        new Date(Date.now() - 86400000), // 1 day ago
        new Date(Date.now() + 86400000), // 1 day from now
      );
      expect(currentPeriod.isActive()).toBe(true);
    });
  });

  describe('Serialization', () => {
    const period = new SubscriptionPeriod(startDate, endDate);

    it('should convert to string representation', () => {
      const result = period.toString();
      expect(result).toBe('2024-01-01 - 2024-01-31');
    });

    it('should convert to JSON', () => {
      const json = period.toJSON();
      expect(json).toEqual({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle periods spanning years', () => {
      const yearSpanning = new SubscriptionPeriod(
        new Date('2023-12-15T00:00:00Z'),
        new Date('2024-01-15T00:00:00Z'),
      );
      expect(yearSpanning.getDurationInDays()).toBe(31);
    });

    it('should handle leap year calculations', () => {
      const leapYear = new SubscriptionPeriod(
        new Date('2024-02-01T00:00:00Z'),
        new Date('2024-03-01T00:00:00Z'),
      );
      expect(leapYear.getDurationInDays()).toBe(29); // February 2024 has 29 days
    });

    it('should handle very short periods', () => {
      const shortPeriod = new SubscriptionPeriod(
        new Date('2024-01-01T00:00:00Z'),
        new Date('2024-01-01T00:00:01Z'), // 1 second duration
      );
      expect(shortPeriod.getDurationInDays()).toBe(1); // Rounded up
    });

    it('should handle timezone differences', () => {
      const period = new SubscriptionPeriod(
        new Date('2024-01-01T23:00:00-05:00'), // 11 PM EST
        new Date('2024-01-02T01:00:00-05:00'), // 1 AM EST (2 hours later)
      );
      expect(period.getDurationInDays()).toBe(1);
    });
  });

  describe('Immutability', () => {
    const period = new SubscriptionPeriod(startDate, endDate);

    it('should return new Date instances from getters', () => {
      const retrievedStart = period.getStartDate();
      const retrievedEnd = period.getEndDate();

      // Store original values
      const originalStartYear = period.getStartDate().getFullYear();
      const originalEndYear = period.getEndDate().getFullYear();

      retrievedStart.setFullYear(2025);
      retrievedEnd.setFullYear(2025);

      // Original period should be unchanged
      expect(period.getStartDate().getFullYear()).toBe(originalStartYear);
      expect(period.getEndDate().getFullYear()).toBe(originalEndYear);
    });
  });
});
