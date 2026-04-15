import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateFormat',
  standalone: true
})
export class DateFormatPipe implements PipeTransform {
  transform(value: string | Date | null, format: 'short' | 'medium' | 'long' | 'datetime' | 'relative' = 'medium'): string {
    if (!value) return '-';

    const date = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(date.getTime())) return '-';

    switch (format) {
      case 'short':
        return this.formatShort(date);
      case 'long':
        return this.formatLong(date);
      case 'datetime':
        return this.formatDateTime(date);
      case 'relative':
        return this.formatRelative(date);
      case 'medium':
      default:
        return this.formatMedium(date);
    }
  }

  private formatShort(date: Date): string {
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  private formatMedium(date: Date): string {
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  private formatLong(date: Date): string {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  private formatDateTime(date: Date): string {
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private formatRelative(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    if (days < 7) return `${days} hari lalu`;
    return this.formatMedium(date);
  }
}
