export class SubscriptionPeriod {
  private startDate: Date;
  private endDate: Date;

  constructor(startDate: Date, endDate: Date) {
    if (startDate >= endDate) {
      throw new Error('Start date must be before end date');
    }
    this.startDate = new Date(startDate);
    this.endDate = new Date(endDate);
  }

  getStartDate(): Date {
    return new Date(this.startDate);
  }

  getEndDate(): Date {
    return new Date(this.endDate);
  }

  getDurationInDays(): number {
    const diffTime = Math.abs(
      this.endDate.getTime() - this.startDate.getTime(),
    );
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  isActive(date: Date = new Date()): boolean {
    return date >= this.startDate && date <= this.endDate;
  }

  isExpired(date: Date = new Date()): boolean {
    return date > this.endDate;
  }

  isPending(date: Date = new Date()): boolean {
    return date < this.startDate;
  }

  toString(): string {
    return `${this.startDate.toISOString().split('T')[0]} - ${this.endDate.toISOString().split('T')[0]}`;
  }

  toJSON() {
    return {
      startDate: this.startDate.toISOString(),
      endDate: this.endDate.toISOString(),
    };
  }
}
