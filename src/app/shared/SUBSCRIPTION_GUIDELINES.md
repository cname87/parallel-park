# Subscription Management Guidelines

This document outlines the consistent patterns for managing RxJS subscriptions across the Angular application to prevent memory leaks and ensure optimal performance.

## Patterns by Context

### 1. Components

**Pattern: Use BaseComponent with takeUntil**

```typescript
import { Component, OnInit } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { BaseComponent } from '../shared/base.component';

export class MyComponent extends BaseComponent implements OnInit {
  ngOnInit(): void {
    this.someService.data$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        // Handle data
      });
  }

  // ngOnDestroy is automatically handled by BaseComponent
}
```

**Benefits:**
- Automatic cleanup on component destruction
- Consistent pattern across all components
- No manual subscription management needed

### 2. Services

**Pattern: Use SubscriptionManager**

```typescript
import { Injectable } from '@angular/core';
import { SubscriptionManager } from '../shared/subscription-manager';

@Injectable({ providedIn: 'root' })
export class MyService {
  private subscriptionManager = new SubscriptionManager();

  someMethod(): void {
    const sub = this.dataService.observable$.subscribe(data => {
      // Handle data
    });
    this.subscriptionManager.add(sub);
  }

  // Call this when service is no longer needed or when resetting
  cleanup(): void {
    this.subscriptionManager.unsubscribeAll();
  }
}
```

**Benefits:**
- Centralized subscription management
- Easy cleanup with single method call
- Tracks subscription count and status

### 3. Manual Subscription Management (Advanced Cases)

**Pattern: Use Subscription array**

```typescript
import { Subscription } from 'rxjs';

export class AdvancedService {
  private subscriptions: Subscription[] = [];

  startListening(): void {
    const sub1 = this.service1.data$.subscribe(...);
    const sub2 = this.service2.data$.subscribe(...);

    this.subscriptions.push(sub1, sub2);
  }

  stopListening(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }
}
```

## Best Practices

### 1. Always Clean Up
- Components: Extend BaseComponent for automatic cleanup
- Services: Use SubscriptionManager and call cleanup() when appropriate

### 2. Avoid Constructor Subscriptions in Services
- Services persist for the application lifetime
- Constructor subscriptions can't be easily cleaned up
- Use methods like `trackButton()` or `initialize()` instead

### 3. Use Operators When Possible
- `take(1)` for single-value subscriptions
- `distinctUntilChanged()` to prevent duplicate processing
- `shareReplay(1)` for multicasting observables

### 4. Service Cleanup Scenarios
Call `cleanup()` method when:
- Resetting application state
- Switching major modes/contexts
- Before creating new subscriptions in start/init methods

## Anti-Patterns to Avoid

### ❌ Unmanaged Subscriptions
```typescript
// BAD - No cleanup
ngOnInit(): void {
  this.service.data$.subscribe(data => {
    // This will leak memory!
  });
}
```

### ❌ Constructor Subscriptions in Services
```typescript
// BAD - Can't be cleaned up
constructor(private data: DataService) {
  this.data.observable$.subscribe(...); // Memory leak!
}
```

### ❌ Ignoring Subscription Returns
```typescript
// BAD - Can't unsubscribe later
this.service.data$.subscribe(...);

// GOOD - Store for later cleanup
const sub = this.service.data$.subscribe(...);
this.subscriptionManager.add(sub);
```

## Migration Checklist

When updating existing code:

1. **Components:**
   - [ ] Extend BaseComponent
   - [ ] Add takeUntil(this.destroy$) to all subscriptions
   - [ ] Remove manual ngOnDestroy if only used for subscriptions

2. **Services:**
   - [ ] Add SubscriptionManager property
   - [ ] Store all subscriptions with subscriptionManager.add()
   - [ ] Add cleanup() method
   - [ ] Call cleanup() in appropriate places

3. **Testing:**
   - [ ] Verify no memory leaks during navigation
   - [ ] Test subscription cleanup in development tools
   - [ ] Ensure all observables complete properly

## Future Improvements

- Consider creating decorators for automatic subscription management
- Implement subscription tracking in development mode
- Add linting rules to prevent unmanaged subscriptions
