import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PageHeaderComponent, BreadcrumbItem } from '../../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';
import { DocumentsService } from '../../../api/services/documents.service';
import { WorkflowActionsService } from '../../../api/services/workflow-actions.service';
import { CommentsService } from '../../../api/services/comments.service';
import { VersionsService } from '../../../api/services/versions.service';
import { AuthStateService } from '../../../core/auth/auth-state.service';

@Component({
  selector: 'app-document-detail',
  standalone: true,
  imports: [
    CommonModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    LoadingSpinnerComponent,
    ConfirmModalComponent,
    DateFormatPipe
  ],
  templateUrl: './document-detail.component.html',
  styleUrl: './document-detail.component.scss'
})
export class DocumentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly documentsApi = inject(DocumentsService);
  private readonly workflowActionsApi = inject(WorkflowActionsService);
  private readonly commentsApi = inject(CommentsService);
  private readonly versionsApi = inject(VersionsService);
  private readonly authState = inject(AuthStateService);

  // State
  document = signal<any>(null);
  loading = signal(true);
  error = signal('');
  activeTab = signal<'info' | 'workflow' | 'versions' | 'comments'>('info');

  // Workflow state
  workflowInstance = signal<any>(null);
  workflowSteps = signal<any[]>([]);

  // Version history
  versions = signal<any[]>([]);

  // Comments
  comments = signal<any[]>([]);

  // Action modals
  actionModalOpen = signal(false);
  actionType = signal<'approve' | 'reject' | 'delegate'>('approve');
  actionComment = signal('');
  isSubmitting = signal(false);

  get breadcrumbs(): BreadcrumbItem[] {
    return [
      { label: 'Dashboard', link: '/dashboard' },
      { label: 'Dokumen', link: '/documents' },
      { label: this.document()?.title || 'Detail' }
    ];
  }

  get canApprove(): boolean {
    const workflow = this.workflowInstance();
    if (!workflow) return false;
    const currentStep = this.workflowSteps().find((s: any) => s.status === 'active');
    if (!currentStep) return false;
    const user = this.authState.user();
    return currentStep.approver_ids?.includes(user?.id);
  }

  get canEdit(): boolean {
    const doc = this.document();
    return doc?.status === 'draft' && this.authState.hasPermission('document.update');
  }

  get canSubmit(): boolean {
    const doc = this.document();
    return doc?.status === 'draft' && this.authState.hasPermission('document.submit');
  }

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.loadDocument(id);
  }

  loadDocument(id: string): void {
    this.loading.set(true);

    this.documentsApi.documentsIdGet({ id }).subscribe({
      next: (response: any) => {
        this.document.set(response?.data || response);
        this.loadRelatedData(id);
        this.loading.set(false);
      },
      error: (err: any) => {
        this.error.set('Dokumen tidak ditemukan');
        this.loading.set(false);
      }
    });
  }

  loadRelatedData(documentId: string): void {
    // Load workflow instance
    this.workflowActionsApi.documentsIdWorkflowGet({ id: documentId }).subscribe({
      next: (response: any) => {
        this.workflowInstance.set(response?.data || response);
        this.workflowSteps.set(response?.data?.steps || response?.steps || []);
      }
    });

    // Load versions
    this.versionsApi.documentsIdVersionsGet({ id: documentId }).subscribe({
      next: (response: any) => {
        this.versions.set(response?.data || response || []);
      }
    });

    // Load comments
    this.commentsApi.documentsIdCommentsGet({ id: documentId }).subscribe({
      next: (response: any) => {
        this.comments.set(response?.data || response || []);
      }
    });
  }

  switchTab(tab: 'info' | 'workflow' | 'versions' | 'comments'): void {
    this.activeTab.set(tab);
  }

  submitForReview(): void {
    const doc = this.document();
    if (!doc) return;

    this.isSubmitting.set(true);
    this.workflowActionsApi.documentsIdSubmitPost({ id: doc.id }).subscribe({
      next: () => {
        this.loadDocument(doc.id);
        this.isSubmitting.set(false);
      },
      error: () => {
        this.isSubmitting.set(false);
      }
    });
  }

  openActionModal(type: 'approve' | 'reject' | 'delegate'): void {
    this.actionType.set(type);
    this.actionComment.set('');
    this.actionModalOpen.set(true);
  }

  closeActionModal(): void {
    this.actionModalOpen.set(false);
  }

  confirmAction(): void {
    const doc = this.document();
    const type = this.actionType();
    if (!doc) return;

    this.isSubmitting.set(true);

    const request = type === 'approve'
      ? this.workflowActionsApi.documentsIdApprovePost({ id: doc.id, body: { comment: this.actionComment() } })
      : this.workflowActionsApi.documentsIdRejectPost({ id: doc.id, body: { comment: this.actionComment() } });

    request.subscribe({
      next: () => {
        this.actionModalOpen.set(false);
        this.loadDocument(doc.id);
        this.isSubmitting.set(false);
      },
      error: () => {
        this.isSubmitting.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/documents']);
  }

  downloadDocument(): void {
    const doc = this.document();
    if (doc?.file_path) {
      window.open(doc.file_path, '_blank');
    }
  }

  getStepStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'pending': 'step-pending',
      'active': 'step-active',
      'approved': 'step-approved',
      'rejected': 'step-rejected',
      'skipped': 'step-skipped'
    };
    return classes[status] || 'step-pending';
  }
}
