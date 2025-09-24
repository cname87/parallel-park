import { Subscription } from 'rxjs';

/**
 * Utility class for managing subscriptions in services.
 * Services can use this to track and clean up subscriptions when needed.
 *
 * @example
 * ```typescript
 * export class MyService {
 *   private subscriptionManager = new SubscriptionManager();
 *
 *   someMethod(): void {
 *     const sub = this.someObservable$.subscribe(...);
 *     this.subscriptionManager.add(sub);
 *   }
 *
 *   cleanup(): void {
 *     this.subscriptionManager.unsubscribeAll();
 *   }
 * }
 * ```
 */
export class SubscriptionManager {
  private subscriptions: Subscription[] = [];

  /**
   * Add a subscription to be managed.
   * @param subscription The subscription to add
   */
  add(subscription: Subscription): void {
    this.subscriptions.push(subscription);
  }

  /**
   * Add multiple subscriptions at once.
   * @param subscriptions Array of subscriptions to add
   */
  addMultiple(subscriptions: Subscription[]): void {
    this.subscriptions.push(...subscriptions);
  }

  /**
   * Unsubscribe from all managed subscriptions and clear the list.
   */
  unsubscribeAll(): void {
    this.subscriptions.forEach((sub) => {
      if (sub && !sub.closed) {
        sub.unsubscribe();
      }
    });
    this.subscriptions = [];
  }

  /**
   * Get the number of active subscriptions.
   */
  get count(): number {
    return this.subscriptions.filter((sub) => sub && !sub.closed).length;
  }

  /**
   * Check if there are any active subscriptions.
   */
  get hasActiveSubscriptions(): boolean {
    return this.count > 0;
  }
}
