import { Injectable, signal, computed } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private _toasts = signal<Toast[]>([]);
  private _nextId = 0;

  readonly toasts = this._toasts.asReadonly();

  /**
   * Show success notification
   */
  success(title: string, message?: string, duration = 3000): void {
    this.show('success', title, message, duration);
  }

  /**
   * Show error notification
   */
  error(title: string, message?: string, duration = 5000): void {
    this.show('error', title, message, duration);
  }

  /**
   * Show warning notification
   */
  warning(title: string, message?: string, duration = 4000): void {
    this.show('warning', title, message, duration);
  }

  /**
   * Show info notification
   */
  info(title: string, message?: string, duration = 3000): void {
    this.show('info', title, message, duration);
  }

  /**
   * Show toast notification
   */
  private show(type: ToastType, title: string, message?: string, duration = 3000): void {
    const id = ++this._nextId;
    const toast: Toast = { id, type, title, message, duration };
    
    this._toasts.update(toasts => [...toasts, toast]);

    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }

  /**
   * Dismiss a specific toast
   */
  dismiss(id: number): void {
    this._toasts.update(toasts => toasts.filter(t => t.id !== id));
  }

  /**
   * Dismiss all toasts
   */
  dismissAll(): void {
    this._toasts.set([]);
  }
}
