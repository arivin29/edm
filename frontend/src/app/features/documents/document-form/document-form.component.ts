import { Component, Input, Output, EventEmitter, signal, inject, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormFieldComponent, InputComponent } from '../../../shared/components/form-controls/form-field/form-field.component';
import { SelectComponent, SelectOption } from '../../../shared/components/form-controls/select/select.component';
import { TextareaComponent } from '../../../shared/components/form-controls/textarea/textarea.component';
import { FileUploadComponent } from '../../../shared/components/form-controls/file-upload/file-upload.component';
import { DocumentTypesService } from '../../../api/services/document-types.service';
import { CategoriesService } from '../../../api/services/categories.service';
import { TemplatesService } from '../../../api/services/templates.service';
import { ApiConfiguration } from '../../../api/api-configuration';

@Component({
  selector: 'app-document-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormFieldComponent,
    InputComponent,
    SelectComponent,
    TextareaComponent,
    FileUploadComponent
  ],
  templateUrl: './document-form.component.html',
  styleUrl: './document-form.component.scss'
})
export class DocumentFormComponent implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfiguration);
  private readonly docTypesApi = inject(DocumentTypesService);
  private readonly categoriesApi = inject(CategoriesService);
  private readonly templatesApi = inject(TemplatesService);

  @Input() mode: 'create' | 'edit' = 'create';
  @Input() document: any = null;

  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form!: FormGroup;
  isSubmitting = signal(false);
  errorMessage = signal('');

  // Options
  documentTypes = signal<SelectOption[]>([]);
  categories = signal<SelectOption[]>([]);
  templates = signal<SelectOption[]>([]);

  // UI state
  selectedFile = signal<File | null>(null);

  ngOnInit(): void {
    this.initForm();
    this.loadOptions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['document'] && this.form) {
      this.patchForm();
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(255)]],
      document_type_id: ['', Validators.required],
      category_id: ['', Validators.required],
      template_id: [''],
      description: [''],
      effective_date: [''],
      expiry_date: ['']
    });
  }

  private patchForm(): void {
    if (this.document && this.mode === 'edit') {
      this.form.patchValue({
        title: this.document.title,
        document_type_id: this.document.document_type_id,
        category_id: this.document.category_id,
        template_id: this.document.template_id || '',
        description: this.document.description || '',
        effective_date: this.document.effective_date || '',
        expiry_date: this.document.expiry_date || ''
      });
    } else {
      this.form.reset();
    }
  }

  private loadOptions(): void {
    // Load document types
    this.docTypesApi.documentTypesGet().subscribe({
      next: (response: any) => {
        const types = (response?.data || response || []).map((t: any) => ({
          value: t.id,
          label: t.name
        }));
        this.documentTypes.set(types);
      }
    });

    // Load categories
    this.categoriesApi.categoriesGet().subscribe({
      next: (response: any) => {
        const cats = (response?.data || response || []).map((c: any) => ({
          value: c.id,
          label: c.name
        }));
        this.categories.set(cats);
      }
    });

    // Load templates
    this.templatesApi.templatesGet().subscribe({
      next: (response: any) => {
        const tmpls = (response?.data || response || []).map((t: any) => ({
          value: t.id,
          label: t.name
        }));
        this.templates.set([{ value: '', label: '-- Tanpa Template --' }, ...tmpls]);
      }
    });
  }

  onFileSelected(file: File): void {
    this.selectedFile.set(file);
  }

  onFileRemoved(): void {
    this.selectedFile.set(null);
  }

  onFileError(message: string): void {
    this.errorMessage.set(message);
  }

  getFieldError(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control || !control.touched || !control.errors) return '';

    if (control.errors['required']) return 'Field ini wajib diisi';
    if (control.errors['maxlength']) return `Maksimal ${control.errors['maxlength'].requiredLength} karakter`;
    return '';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const formData = new FormData();
    const values = this.form.value;

    Object.keys(values).forEach(key => {
      if (values[key]) {
        formData.append(key, values[key]);
      }
    });

    const file = this.selectedFile();
    if (file) {
      formData.append('file', file);
    }

    const baseUrl = this.apiConfig.rootUrl || '';
    const url = this.mode === 'create' 
      ? `${baseUrl}/documents`
      : `${baseUrl}/documents/${this.document.id}`;
    const method = this.mode === 'create' ? 'POST' : 'PUT';

    this.http.request(method, url, { body: formData }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.saved.emit();
      },
      error: (err: any) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err?.error?.message || 'Terjadi kesalahan');
      }
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
