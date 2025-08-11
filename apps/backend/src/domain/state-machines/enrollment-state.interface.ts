export enum EnrollmentStatus {
  DRAFT = 'DRAFT',
  ENROLLMENT_STARTED = 'ENROLLMENT_STARTED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAYMENT_PROCESSED = 'PAYMENT_PROCESSED',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum EnrollmentEvent {
  START_ENROLLMENT = 'START_ENROLLMENT',
  PROCESS_PAYMENT = 'PROCESS_PAYMENT',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  ACTIVATE = 'ACTIVATE',
  SUSPEND = 'SUSPEND',
  RESUME = 'RESUME',
  CANCEL = 'CANCEL',
  EXPIRE = 'EXPIRE',
}

export interface EnrollmentTransition {
  from: EnrollmentStatus;
  event: EnrollmentEvent;
  to: EnrollmentStatus;
  guard?: () => boolean;
  action?: () => void | Promise<void>;
}

export interface EnrollmentContext {
  subscriptionId: string;
  currentStatus: EnrollmentStatus;
  transitionHistory: Array<{
    from: EnrollmentStatus;
    to: EnrollmentStatus;
    event: EnrollmentEvent;
    timestamp: Date;
  }>;
}

export interface EnrollmentStateMachine {
  getCurrentState(): EnrollmentStatus;
  canTransition(event: EnrollmentEvent): boolean;
  transition(
    event: EnrollmentEvent,
    context?: Record<string, any>,
  ): Promise<boolean>;
}
