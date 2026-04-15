import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state">
      <div class="empty-icon">
        <ng-content select="[icon]"></ng-content>
        @if (!hasIconContent) {
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M20 7h-9M14 17H5M17 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0ZM3 7a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z"/>
          </svg>
        }
      </div>
      <h3 class="empty-title">{{ title }}</h3>
      @if (message) {
        <p class="empty-message">{{ message }}</p>
      }
      <div class="empty-actions">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
    }

    .empty-icon {
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      color: #d1d5db;

      svg {
        width: 100%;
        height: 100%;
      }
    }

    .empty-title {
      margin: 0 0 8px;
      font-size: 16px;
      font-weight: 600;
      color: #374151;
    }

    .empty-message {
      margin: 0 0 20px;
      font-size: 14px;
      color: #6b7280;
      max-width: 320px;
    }

    .empty-actions {
      display: flex;
      gap: 12px;

      &:empty {
        display: none;
      }
    }
  `]
})
export class EmptyStateComponent {
  @Input() title = 'Tidak ada data';
  @Input() message = '';
  @Input() hasIconContent = false;
}
