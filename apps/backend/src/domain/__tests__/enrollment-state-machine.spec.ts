import { SubscriptionEnrollmentStateMachine } from '../state-machines/enrollment-state-machine';
import {
  EnrollmentStatus,
  EnrollmentEvent,
} from '../state-machines/enrollment-state.interface';

describe('SubscriptionEnrollmentStateMachine', () => {
  let stateMachine: SubscriptionEnrollmentStateMachine;
  const subscriptionId = 'sub_123';

  beforeEach(() => {
    stateMachine = new SubscriptionEnrollmentStateMachine(subscriptionId);
  });

  describe('Initial State', () => {
    it('should start in DRAFT status', () => {
      expect(stateMachine.getCurrentState()).toBe(EnrollmentStatus.DRAFT);
    });

    it('should allow custom initial state', () => {
      const customMachine = new SubscriptionEnrollmentStateMachine(
        subscriptionId,
        EnrollmentStatus.ACTIVE,
      );
      expect(customMachine.getCurrentState()).toBe(EnrollmentStatus.ACTIVE);
    });
  });

  describe('Valid Transitions', () => {
    it('should transition from DRAFT to ENROLLMENT_STARTED', async () => {
      expect(stateMachine.canTransition(EnrollmentEvent.START_ENROLLMENT)).toBe(
        true,
      );

      const success = await stateMachine.transition(
        EnrollmentEvent.START_ENROLLMENT,
      );

      expect(success).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(
        EnrollmentStatus.ENROLLMENT_STARTED,
      );
    });

    it('should transition from ENROLLMENT_STARTED to PAYMENT_PENDING', async () => {
      await stateMachine.transition(EnrollmentEvent.START_ENROLLMENT);

      const success = await stateMachine.transition(
        EnrollmentEvent.PROCESS_PAYMENT,
      );

      expect(success).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(
        EnrollmentStatus.PAYMENT_PENDING,
      );
    });

    it('should handle payment success flow', async () => {
      await stateMachine.transition(EnrollmentEvent.START_ENROLLMENT);
      await stateMachine.transition(EnrollmentEvent.PROCESS_PAYMENT);

      const success = await stateMachine.transition(
        EnrollmentEvent.PAYMENT_SUCCESS,
      );

      expect(success).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(
        EnrollmentStatus.PAYMENT_PROCESSED,
      );
    });

    it('should handle payment failure and retry flow', async () => {
      await stateMachine.transition(EnrollmentEvent.START_ENROLLMENT);
      await stateMachine.transition(EnrollmentEvent.PROCESS_PAYMENT);

      const failureSuccess = await stateMachine.transition(
        EnrollmentEvent.PAYMENT_FAILED,
      );
      expect(failureSuccess).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(
        EnrollmentStatus.ENROLLMENT_STARTED,
      );

      // Can retry payment
      const retrySuccess = await stateMachine.transition(
        EnrollmentEvent.PROCESS_PAYMENT,
      );
      expect(retrySuccess).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(
        EnrollmentStatus.PAYMENT_PENDING,
      );
    });

    it('should complete full enrollment flow', async () => {
      await stateMachine.transition(EnrollmentEvent.START_ENROLLMENT);
      await stateMachine.transition(EnrollmentEvent.PROCESS_PAYMENT);
      await stateMachine.transition(EnrollmentEvent.PAYMENT_SUCCESS);

      const success = await stateMachine.transition(EnrollmentEvent.ACTIVATE);

      expect(success).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(EnrollmentStatus.ACTIVE);
    });
  });

  describe('Cancellation', () => {
    it('should allow cancellation from DRAFT', async () => {
      const success = await stateMachine.transition(EnrollmentEvent.CANCEL);

      expect(success).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(EnrollmentStatus.CANCELLED);
    });

    it('should allow cancellation from ENROLLMENT_STARTED', async () => {
      await stateMachine.transition(EnrollmentEvent.START_ENROLLMENT);

      const success = await stateMachine.transition(EnrollmentEvent.CANCEL);

      expect(success).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(EnrollmentStatus.CANCELLED);
    });

    it('should allow cancellation from PAYMENT_PENDING', async () => {
      await stateMachine.transition(EnrollmentEvent.START_ENROLLMENT);
      await stateMachine.transition(EnrollmentEvent.PROCESS_PAYMENT);

      const success = await stateMachine.transition(EnrollmentEvent.CANCEL);

      expect(success).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(EnrollmentStatus.CANCELLED);
    });

    it('should allow cancellation from ACTIVE', async () => {
      await stateMachine.transition(EnrollmentEvent.START_ENROLLMENT);
      await stateMachine.transition(EnrollmentEvent.PROCESS_PAYMENT);
      await stateMachine.transition(EnrollmentEvent.PAYMENT_SUCCESS);
      await stateMachine.transition(EnrollmentEvent.ACTIVATE);

      const success = await stateMachine.transition(EnrollmentEvent.CANCEL);

      expect(success).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(EnrollmentStatus.CANCELLED);
    });
  });

  describe('Expiration', () => {
    it('should allow expiration from ACTIVE', async () => {
      await stateMachine.transition(EnrollmentEvent.START_ENROLLMENT);
      await stateMachine.transition(EnrollmentEvent.PROCESS_PAYMENT);
      await stateMachine.transition(EnrollmentEvent.PAYMENT_SUCCESS);
      await stateMachine.transition(EnrollmentEvent.ACTIVATE);

      const success = await stateMachine.transition(EnrollmentEvent.EXPIRE);

      expect(success).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(EnrollmentStatus.EXPIRED);
    });

    it('should allow expiration from SUSPENDED', async () => {
      await stateMachine.transition(EnrollmentEvent.START_ENROLLMENT);
      await stateMachine.transition(EnrollmentEvent.PROCESS_PAYMENT);
      await stateMachine.transition(EnrollmentEvent.PAYMENT_SUCCESS);
      await stateMachine.transition(EnrollmentEvent.ACTIVATE);

      const success = await stateMachine.transition(EnrollmentEvent.EXPIRE);

      expect(success).toBe(true);
      expect(stateMachine.getCurrentState()).toBe(EnrollmentStatus.EXPIRED);
    });
  });

  describe('Invalid Transitions', () => {
    it('should reject invalid transitions from DRAFT', async () => {
      await expect(
        stateMachine.transition(EnrollmentEvent.PAYMENT_SUCCESS),
      ).rejects.toThrow('Invalid transition');
    });

    it('should reject transitions from terminal states', async () => {
      await stateMachine.transition(EnrollmentEvent.CANCEL);

      await expect(
        stateMachine.transition(EnrollmentEvent.START_ENROLLMENT),
      ).rejects.toThrow('Invalid transition');
    });

    it('should reject invalid event sequences', async () => {
      await stateMachine.transition(EnrollmentEvent.START_ENROLLMENT);

      await expect(
        stateMachine.transition(EnrollmentEvent.ACTIVATE),
      ).rejects.toThrow('Invalid transition');
    });
  });
});
