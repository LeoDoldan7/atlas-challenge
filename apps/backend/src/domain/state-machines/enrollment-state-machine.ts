import {
  EnrollmentStatus,
  EnrollmentEvent,
  EnrollmentTransition,
  EnrollmentContext,
  EnrollmentStateMachine,
} from './enrollment-state.interface';

export class SubscriptionEnrollmentStateMachine
  implements EnrollmentStateMachine
{
  private context: EnrollmentContext;
  private transitions: EnrollmentTransition[];

  constructor(
    subscriptionId: string,
    initialStatus: EnrollmentStatus = EnrollmentStatus.DRAFT,
  ) {
    this.context = {
      subscriptionId,
      currentStatus: initialStatus,
      transitionHistory: [],
    };

    this.transitions = this.defineTransitions();
  }

  getCurrentState(): EnrollmentStatus {
    return this.context.currentStatus;
  }

  canTransition(event: EnrollmentEvent): boolean {
    const transition = this.findTransition(this.context.currentStatus, event);
    if (!transition) return false;

    return transition.guard ? transition.guard() : true;
  }

  async transition(event: EnrollmentEvent): Promise<boolean> {
    const transition = this.findTransition(this.context.currentStatus, event);

    if (!transition) {
      throw new Error(
        `Invalid transition: ${event} from state ${this.context.currentStatus}`,
      );
    }

    if (transition.guard && !transition.guard()) {
      return false;
    }

    const previousState = this.context.currentStatus;

    try {
      if (transition.action) {
        await transition.action();
      }

      this.context.currentStatus = transition.to;

      this.context.transitionHistory.push({
        from: previousState,
        to: transition.to,
        event,
        timestamp: new Date(),
      });

      return true;
    } catch (error) {
      throw new Error(
        `Transition action failed for ${event}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  getContext(): EnrollmentContext {
    return { ...this.context };
  }

  private defineTransitions(): EnrollmentTransition[] {
    return [
      {
        from: EnrollmentStatus.DRAFT,
        event: EnrollmentEvent.START_ENROLLMENT,
        to: EnrollmentStatus.ENROLLMENT_STARTED,
      },
      {
        from: EnrollmentStatus.DRAFT,
        event: EnrollmentEvent.CANCEL,
        to: EnrollmentStatus.CANCELLED,
      },

      {
        from: EnrollmentStatus.ENROLLMENT_STARTED,
        event: EnrollmentEvent.PROCESS_PAYMENT,
        to: EnrollmentStatus.PAYMENT_PENDING,
      },
      {
        from: EnrollmentStatus.ENROLLMENT_STARTED,
        event: EnrollmentEvent.CANCEL,
        to: EnrollmentStatus.CANCELLED,
      },

      {
        from: EnrollmentStatus.PAYMENT_PENDING,
        event: EnrollmentEvent.PAYMENT_SUCCESS,
        to: EnrollmentStatus.PAYMENT_PROCESSED,
      },
      {
        from: EnrollmentStatus.PAYMENT_PENDING,
        event: EnrollmentEvent.PAYMENT_FAILED,
        to: EnrollmentStatus.ENROLLMENT_STARTED,
      },
      {
        from: EnrollmentStatus.PAYMENT_PENDING,
        event: EnrollmentEvent.CANCEL,
        to: EnrollmentStatus.CANCELLED,
      },

      {
        from: EnrollmentStatus.PAYMENT_PROCESSED,
        event: EnrollmentEvent.ACTIVATE,
        to: EnrollmentStatus.ACTIVE,
      },
      {
        from: EnrollmentStatus.PAYMENT_PROCESSED,
        event: EnrollmentEvent.CANCEL,
        to: EnrollmentStatus.CANCELLED,
      },

      {
        from: EnrollmentStatus.ACTIVE,
        event: EnrollmentEvent.CANCEL,
        to: EnrollmentStatus.CANCELLED,
      },
      {
        from: EnrollmentStatus.ACTIVE,
        event: EnrollmentEvent.EXPIRE,
        to: EnrollmentStatus.EXPIRED,
      },
    ];
  }

  private findTransition(
    from: EnrollmentStatus,
    event: EnrollmentEvent,
  ): EnrollmentTransition | undefined {
    return this.transitions.find((t) => t.from === from && t.event === event);
  }
}
