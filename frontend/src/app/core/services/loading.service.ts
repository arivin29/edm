import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private _loadingCount = signal(0);
  private _loadingMessage = signal<string | null>(null);

  readonly isLoading = computed(() => this._loadingCount() > 0);
  readonly message = this._loadingMessage.asReadonly();

  /**
   * Show loading indicator
   */
  show(message?: string): void {
    this._loadingCount.update(count => count + 1);
    if (message) {
      this._loadingMessage.set(message);
    }
  }

  /**
   * Hide loading indicator
   */
  hide(): void {
    this._loadingCount.update(count => Math.max(0, count - 1));
    if (this._loadingCount() === 0) {
      this._loadingMessage.set(null);
    }
  }

  /**
   * Force reset loading state
   */
  reset(): void {
    this._loadingCount.set(0);
    this._loadingMessage.set(null);
  }
}
