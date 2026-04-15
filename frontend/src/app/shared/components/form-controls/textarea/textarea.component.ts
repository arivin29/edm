import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-textarea',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextareaComponent),
      multi: true
    }
  ],
  template: `
    <div class="textarea-wrapper">
      <textarea
        [placeholder]="placeholder"
        [disabled]="disabled"
        [readonly]="readonly"
        [rows]="rows"
        [attr.maxlength]="maxlength"
        [value]="value"
        (input)="onInput($event)"
        (blur)="onTouched()"
        class="textarea"
      ></textarea>
      @if (showCount && maxlength) {
        <span class="char-count">{{ value.length }}/{{ maxlength }}</span>
      }
    </div>
  `,
  styles: [`
    .textarea-wrapper {
      position: relative;
    }

    .textarea {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      font-family: inherit;
      color: #1f2937;
      background: #fff;
      outline: none;
      resize: vertical;
      min-height: 80px;
      transition: border-color 0.15s, box-shadow 0.15s;

      &::placeholder {
        color: #9ca3af;
      }

      &:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
      }

      &:disabled {
        background: #f9fafb;
        color: #6b7280;
        cursor: not-allowed;
        resize: none;
      }

      &:read-only {
        background: #f9fafb;
        resize: none;
      }
    }

    .char-count {
      position: absolute;
      right: 8px;
      bottom: 8px;
      font-size: 11px;
      color: #9ca3af;
    }
  `]
})
export class TextareaComponent implements ControlValueAccessor {
  @Input() placeholder = '';
  @Input() rows = 4;
  @Input() maxlength: number | null = null;
  @Input() showCount = false;
  @Input() disabled = false;
  @Input() readonly = false;

  value = '';
  onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.value = value;
    this.onChange(value);
  }
}
