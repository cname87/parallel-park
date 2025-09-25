import { Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Base component that provides consistent subscription management for all components.
 * Components extending this class can use the destroy$ subject with takeUntil() operator to automatically unsubscribe from observables when the component is destroyed.
 *
 * @example
 * ```typescript
 * export class MyComponent extends BaseComponent implements OnInit {
 *   ngOnInit(): void {
 *     this.someService.data$
 *       .pipe(takeUntil(this.destroy$))
 *       .subscribe(data => { ... });
 *   }
 * }
 * ```
 */
@Component({
  template: '', // Abstract component - no template
})
export abstract class BaseSubscriptionComponent implements OnDestroy {
  /**
   * Subject that emits when the component is destroyed.
   * Use this with takeUntil() operator to automatically unsubscribe from observables.
   */
  protected destroy$ = new Subject<void>();

  /**
   * Cleanup method called when component is destroyed.
   * Automatically unsubscribes all observables using takeUntil(this.destroy$).
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
