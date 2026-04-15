import { Component, Input, forwardRef, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

export interface SelectOption {
  value: any;
  label: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true
    }
  ],
  template: `
    <div class="select-wrapper">
      <select
        [disabled]="disabled"
        [value]="value"
        (change)="onSelectChange($event)"
        (blur)="onTouched()"
        class="select"
      >
        @if (placeholder) {
          <option value="" disabled [selected]="!value">{{ placeholder }}</option>
        }
        @for (option of options; track option.value) {
          <option
            [value]="option.value"
            [disabled]="option.disabled"
          >
            {{ option.label }}
          </option>
        }
      </select>
      <svg class="select-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="m6 9 6 6 6-6"/>
      </svg>
    </div>
  `,
  styles: [`
    .select-wrapper {
      position: relative;
    }

    .select {
      width: 100%;
      padding: 8px 36px 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      color: #1f2937;
      background: #fff;
      outline: none;
      cursor: pointer;
      appearance: none;
      transition: border-color 0.15s, box-shadow 0.15s;

      &:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
      }

      &:disabled {
        background: #f9fafb;
        color: #6b7280;
        cursor: not-allowed;
      }
    }

    .select-arrow {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      width: 16px;
      height: 16px;
      color: #6b7280;
      pointer-events: none;
    }
  `]
})
export class SelectComponent implements ControlValueAccessor {
  @Input() options: SelectOption[] = [];
  @Input() placeholder = 'Pilih...';
  @Input() disabled = false;

  value: any = '';
  onChange: (value: any) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: any): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onSelectChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.value = value;
    this.onChange(value);
  }
}
