import { Component, Input, forwardRef, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FileUploadComponent),
      multi: true
    }
  ],
  template: `
    <div
      class="file-upload"
      [class.has-file]="file()"
      [class.dragging]="isDragging()"
      [class.disabled]="disabled"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
      (click)="fileInput.click()"
    >
      <input
        #fileInput
        type="file"
        [accept]="accept"
        [disabled]="disabled"
        (change)="onFileSelect($event)"
        hidden
      />

      @if (file()) {
        <div class="file-preview">
          <svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <div class="file-info">
            <span class="file-name">{{ file()!.name }}</span>
            <span class="file-size">{{ formatSize(file()!.size) }}</span>
          </div>
          <button
            type="button"
            class="remove-btn"
            (click)="removeFile($event)"
            [disabled]="disabled"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      } @else {
        <div class="upload-prompt">
          <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" x2="12" y1="3" y2="15"/>
          </svg>
          <p class="upload-text">
            <span class="upload-link">Klik untuk upload</span>
            atau drag & drop
          </p>
          @if (hint) {
            <p class="upload-hint">{{ hint }}</p>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .file-upload {
      border: 2px dashed #d1d5db;
      border-radius: 8px;
      padding: 24px;
      text-align: center;
      cursor: pointer;
      transition: all 0.15s;
      background: #fafafa;

      &:hover:not(.disabled) {
        border-color: #9ca3af;
        background: #f3f4f6;
      }

      &.dragging {
        border-color: #3b82f6;
        background: #eff6ff;
      }

      &.has-file {
        border-style: solid;
        border-color: #d1d5db;
        padding: 12px 16px;
      }

      &.disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .upload-prompt {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .upload-icon {
      width: 40px;
      height: 40px;
      color: #9ca3af;
      margin-bottom: 12px;
    }

    .upload-text {
      margin: 0;
      font-size: 14px;
      color: #6b7280;
    }

    .upload-link {
      color: #3b82f6;
      font-weight: 500;
    }

    .upload-hint {
      margin: 8px 0 0;
      font-size: 12px;
      color: #9ca3af;
    }

    .file-preview {
      display: flex;
      align-items: center;
      gap: 12px;
      text-align: left;
    }

    .file-icon {
      width: 32px;
      height: 32px;
      color: #3b82f6;
      flex-shrink: 0;
    }

    .file-info {
      flex: 1;
      min-width: 0;
    }

    .file-name {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #1f2937;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .file-size {
      font-size: 12px;
      color: #6b7280;
    }

    .remove-btn {
      width: 28px;
      height: 28px;
      padding: 0;
      border: none;
      background: #fee2e2;
      color: #dc2626;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &:hover:not(:disabled) {
        background: #fecaca;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      svg {
        width: 16px;
        height: 16px;
      }
    }
  `]
})
export class FileUploadComponent implements ControlValueAccessor {
  @Input() accept = '*';
  @Input() hint = '';
  @Input() maxSize = 10 * 1024 * 1024; // 10MB default
  @Input() disabled = false;

  @Output() fileSelected = new EventEmitter<File>();
  @Output() fileRemoved = new EventEmitter<void>();
  @Output() error = new EventEmitter<string>();

  file = signal<File | null>(null);
  isDragging = signal(false);

  onChange: (value: File | null) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: File | null): void {
    this.file.set(value);
  }

  registerOnChange(fn: (value: File | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.handleFile(file);
    }
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (!this.disabled) {
      this.isDragging.set(true);
    }
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);

    if (this.disabled) return;

    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  private handleFile(file: File): void {
    if (file.size > this.maxSize) {
      this.error.emit(`Ukuran file melebihi batas maksimal ${this.formatSize(this.maxSize)}`);
      return;
    }

    this.file.set(file);
    this.onChange(file);
    this.fileSelected.emit(file);
  }

  removeFile(event: Event): void {
    event.stopPropagation();
    this.file.set(null);
    this.onChange(null);
    this.fileRemoved.emit();
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
