import { Component, Input, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="form-field" [class.has-error]="error" [class.required]="required">
      @if (label) {
        <label class="form-label">
          {{ label }}
          @if (required) {
            <span class="required-mark">*</span>
          }
        </label>
      }
      <div class="form-control">
        <ng-content></ng-content>
      </div>
      @if (error) {
        <p class="form-error">{{ error }}</p>
      }
      @if (hint && !error) {
        <p class="form-hint">{{ hint }}</p>
      }
    </div>
  `,
  styles: [`
    .form-field {
      margin-bottom: 16px;
    }

    .form-label {
      display: block;
      margin-bottom: 6px;
      font-size: 13px;
      font-weight: 500;
      color: #374151;
    }

    .required-mark {
      color: #dc2626;
      margin-left: 2px;
    }

    .form-error {
      margin: 6px 0 0;
      font-size: 12px;
      color: #dc2626;
    }

    .form-hint {
      margin: 6px 0 0;
      font-size: 12px;
      color: #6b7280;
    }

    .has-error {
      :ng-deep input,
      :ng-deep select,
      :ng-deep textarea {
        border-color: #dc2626 !important;

        &:focus {
          box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.1) !important;
        }
      }
    }
  `]
})
export class FormFieldComponent {
  @Input() label = '';
  @Input() error = '';
  @Input() hint = '';
  @Input() required = false;
}

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ],
  template: `
    <div class="input-wrapper" [class.has-prefix]="prefix" [class.has-suffix]="suffix">
      @if (prefix) {
        <span class="input-prefix">{{ prefix }}</span>
      }
      <input
        [type]="type"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [readonly]="readonly"
        [value]="value"
        (input)="onInput($event)"
        (blur)="onTouched()"
        class="input"
      />
      @if (suffix) {
        <span class="input-suffix">{{ suffix }}</span>
      }
    </div>
  `,
  styles: [`
    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      color: #1f2937;
      background: #fff;
      outline: none;
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
      }

      &:read-only {
        background: #f9fafb;
      }
    }

    .has-prefix .input {
      padding-left: 36px;
    }

    .has-suffix .input {
      padding-right: 36px;
    }

    .input-prefix,
    .input-suffix {
      position: absolute;
      color: #6b7280;
      font-size: 14px;
    }

    .input-prefix {
      left: 12px;
    }

    .input-suffix {
      right: 12px;
    }
  `]
})
export class InputComponent implements ControlValueAccessor {
  @Input() type = 'text';
  @Input() placeholder = '';
  @Input() prefix = '';
  @Input() suffix = '';
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
    const value = (event.target as HTMLInputElement).value;
    this.value = value;
    this.onChange(value);
  }
}
