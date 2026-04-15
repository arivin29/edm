import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.scss',
  animations: [
    trigger('scaleIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('150ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('100ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('150ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('100ms ease-in', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class ConfirmModalComponent {
  @Input() isOpen = false;
  @Input() title = 'Konfirmasi';
  @Input() message = 'Apakah Anda yakin?';
  @Input() confirmText = 'Ya';
  @Input() cancelText = 'Batal';
  @Input() confirmClass = 'btn-primary';
  @Input() type: 'info' | 'warning' | 'danger' = 'info';
  @Input() loading = false;
  @Input() closeOnBackdrop = true;
  @Input() closeOnEsc = true;

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen && this.closeOnEsc && !this.loading) {
      this.cancel();
    }
  }

  confirm(): void {
    if (!this.loading) {
      this.confirmed.emit();
    }
  }

  cancel(): void {
    if (!this.loading) {
      this.cancelled.emit();
    }
  }

  onBackdropClick(): void {
    if (this.closeOnBackdrop && !this.loading) {
      this.cancel();
    }
  }

  getIconClass(): string {
    const icons = {
      info: 'icon-info',
      warning: 'icon-warning',
      danger: 'icon-danger'
    };
    return icons[this.type];
  }
}
