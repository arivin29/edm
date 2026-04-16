import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin, catchError, of } from 'rxjs';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { environment } from '../../../environments/environment';

interface DashboardDoc {
  id: string;
  document_number: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  creator?: { name: string };
  document_type?: { name: string; code: string };
  department?: { name: string };
}

interface PendingTask {
  document_id: string;
  document_title: string;
  document_number: string;
  step_name: string;
  action_type: string;
  assignee_name: string;
  deadline: string;
  created_at: string;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  document_id: string;
  is_read: boolean;
  created_at: string;
}

interface StatusCount {
  status: string;
  count: number;
  label: string;
  color: string;
  bgColor: string;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NzCardModule,
    NzStatisticModule,
    NzGridModule,
    NzIconModule,
    NzButtonModule,
    NzTableModule,
    NzTagModule,
    NzTimelineModule,
    NzSpinModule,
    NzEmptyModule,
    NzToolTipModule,
    NzAvatarModule
  ],
  template: `
    <div class="dash">
      <!-- Header -->
      <div class="dash-header">
        <div class="dash-header__left">
          <div class="dash-header__greeting">
            <h1 class="dash-header__title">{{ getGreeting() }}, {{ authState.userName() || 'User' }}</h1>
            <p class="dash-header__subtitle">
              {{ authState.user()?.department_id ? '' : '' }}Berikut ringkasan dokumen dan tugas Anda hari ini
            </p>
          </div>
        </div>
        <div class="dash-header__right">
          <span class="dash-header__date">
            <span nz-icon nzType="calendar" nzTheme="outline"></span>
            {{ today | date:'EEEE, dd MMMM yyyy' }}
          </span>
          <button nz-button nzType="primary" nzSize="small" routerLink="/documents/create" nz-tooltip nzTooltipTitle="Buat Dokumen Baru">
            <span nz-icon nzType="plus"></span> Buat Dokumen
          </button>
        </div>
      </div>

      <!-- Stat Cards -->
      <nz-spin [nzSpinning]="loadingStats()">
        <div class="dash-stats">
          @for (stat of stats(); track stat.key) {
            <div class="dash-stat" [class]="'dash-stat--' + stat.key" [routerLink]="stat.route" [queryParams]="stat.queryParams || {}">
              <div class="dash-stat__icon" [style.background]="stat.bgColor" [style.color]="stat.color">
                <span nz-icon [nzType]="stat.icon"></span>
              </div>
              <div class="dash-stat__info">
                <span class="dash-stat__value">{{ stat.value }}</span>
                <span class="dash-stat__label">{{ stat.title }}</span>
              </div>
            </div>
          }
        </div>
      </nz-spin>

      <!-- Zone 1: Perlu Tindakan -->
      <div class="dash-section">
        <div class="dash-section__header">
          <div class="dash-section__title">
            <span nz-icon nzType="alert" nzTheme="outline"></span>
            Perlu Tindakan Anda
            @if (pendingTasks().length > 0) {
              <span class="dash-badge">{{ pendingTasks().length }}</span>
            }
          </div>
        </div>
        <nz-spin [nzSpinning]="loadingTasks()">
          @if (pendingTasks().length === 0 && !loadingTasks()) {
            <div class="dash-empty-action">
              <span nz-icon nzType="check-circle" nzTheme="outline" class="dash-empty-action__icon"></span>
              <span>Tidak ada tugas menunggu. Semua beres!</span>
            </div>
          } @else {
            <div class="dash-actions-grid">
              @for (task of pendingTasks(); track task.document_id) {
                <a [routerLink]="['/documents', task.document_id]" class="dash-action-card">
                  <div class="dash-action-card__left">
                    <div class="dash-action-card__icon" [attr.data-action]="task.action_type">
                      @if (task.action_type === 'approve') {
                        <span nz-icon nzType="check-circle" nzTheme="outline"></span>
                      } @else if (task.action_type === 'review') {
                        <span nz-icon nzType="eye" nzTheme="outline"></span>
                      } @else {
                        <span nz-icon nzType="edit" nzTheme="outline"></span>
                      }
                    </div>
                    <div class="dash-action-card__info">
                      <span class="dash-action-card__title">{{ task.document_title }}</span>
                      <span class="dash-action-card__meta">
                        <span class="dash-action-card__num">{{ task.document_number }}</span>
                        <span class="dash-action-card__sep">·</span>
                        {{ task.step_name }}
                      </span>
                    </div>
                  </div>
                  <div class="dash-action-card__right">
                    @if (task.deadline) {
                      <span class="dash-action-card__deadline" [class.dash-action-card__deadline--urgent]="isUrgent(task.deadline)">
                        <span nz-icon nzType="clock-circle" nzTheme="outline"></span>
                        {{ task.deadline | date:'dd/MM' }}
                      </span>
                    }
                    <span class="dash-action-card__arrow">
                      <span nz-icon nzType="right" nzTheme="outline"></span>
                    </span>
                  </div>
                </a>
              }
            </div>
          }
        </nz-spin>
      </div>

      <!-- Zone 2: Dokumen Terbaru + Aktivitas -->
      <div class="dash-grid-2">
        <!-- Dokumen Terbaru -->
        <div class="dash-panel">
          <div class="dash-panel__header">
            <span class="dash-panel__title">
              <span nz-icon nzType="file-text" nzTheme="outline"></span>
              Dokumen Terbaru
            </span>
            <a routerLink="/documents" class="dash-panel__link">Lihat Semua</a>
          </div>
          <nz-spin [nzSpinning]="loadingDocs()">
            @if (recentDocs().length === 0 && !loadingDocs()) {
              <nz-empty nzNotFoundContent="Belum ada dokumen"></nz-empty>
            } @else {
              <div class="dash-doc-list">
                @for (doc of recentDocs(); track doc.id) {
                  <a [routerLink]="['/documents', doc.id]" class="dash-doc-item">
                    <div class="dash-doc-item__main">
                      <span class="dash-doc-item__title">{{ doc.title }}</span>
                      <span class="dash-doc-item__meta">
                        {{ doc.document_number || '-' }}
                        @if (doc.document_type) {
                          <span class="dash-doc-item__sep">·</span>
                          {{ doc.document_type.code }}
                        }
                        <span class="dash-doc-item__sep">·</span>
                        {{ doc.creator?.name || '-' }}
                      </span>
                    </div>
                    <div class="dash-doc-item__right">
                      <span class="dash-doc-status" [attr.data-status]="doc.status">
                        <span class="dash-doc-status__dot"></span>
                        {{ getStatusLabel(doc.status) }}
                      </span>
                      <span class="dash-doc-item__date">{{ doc.created_at | date:'dd/MM/yy' }}</span>
                    </div>
                  </a>
                }
              </div>
            }
          </nz-spin>
        </div>

        <!-- Aktivitas Terkini -->
        <div class="dash-panel">
          <div class="dash-panel__header">
            <span class="dash-panel__title">
              <span nz-icon nzType="bell" nzTheme="outline"></span>
              Aktivitas Terkini
            </span>
          </div>
          <nz-spin [nzSpinning]="loadingActivities()">
            @if (activities().length === 0 && !loadingActivities()) {
              <nz-empty nzNotFoundContent="Belum ada aktivitas"></nz-empty>
            } @else {
              <div class="dash-activity-list">
                @for (a of activities(); track a.id) {
                  <div class="dash-activity" [class.dash-activity--unread]="!a.is_read">
                    <div class="dash-activity__dot" [attr.data-type]="a.type"></div>
                    <div class="dash-activity__body">
                      <span class="dash-activity__title">{{ a.title }}</span>
                      <span class="dash-activity__msg">{{ a.message }}</span>
                      <span class="dash-activity__time">{{ formatTimeAgo(a.created_at) }}</span>
                    </div>
                  </div>
                }
              </div>
            }
          </nz-spin>
        </div>
      </div>

      <!-- Zone 3: Statistik (admin/manager only) -->
      @if (isAdmin()) {
        <div class="dash-grid-2" style="margin-top: 14px;">
          <!-- Status Breakdown -->
          <div class="dash-panel">
            <div class="dash-panel__header">
              <span class="dash-panel__title">
                <span nz-icon nzType="pie-chart" nzTheme="outline"></span>
                Distribusi Status Dokumen
              </span>
            </div>
            <nz-spin [nzSpinning]="loadingStatusBreakdown()">
              <div class="dash-status-chart">
                @for (s of statusBreakdown(); track s.status) {
                  <div class="dash-status-row">
                    <div class="dash-status-row__label">
                      <span class="dash-status-row__dot" [style.background]="s.color"></span>
                      {{ s.label }}
                    </div>
                    <div class="dash-status-row__bar-wrap">
                      <div class="dash-status-row__bar" [style.width.%]="getBarWidth(s.count)" [style.background]="s.color"></div>
                    </div>
                    <span class="dash-status-row__count">{{ s.count }}</span>
                  </div>
                }
                <div class="dash-status-total">
                  Total: <strong>{{ getTotalDocs() }}</strong> dokumen
                </div>
              </div>
            </nz-spin>
          </div>

          <!-- Dokumen per Tipe -->
          <div class="dash-panel">
            <div class="dash-panel__header">
              <span class="dash-panel__title">
                <span nz-icon nzType="appstore" nzTheme="outline"></span>
                Dokumen per Tipe
              </span>
            </div>
            <nz-spin [nzSpinning]="loadingTypeBreakdown()">
              @if (typeBreakdown().length === 0 && !loadingTypeBreakdown()) {
                <nz-empty nzNotFoundContent="Belum ada data"></nz-empty>
              } @else {
                <div class="dash-type-grid">
                  @for (t of typeBreakdown(); track t.code) {
                    <div class="dash-type-item">
                      <span class="dash-type-item__count">{{ t.count }}</span>
                      <span class="dash-type-item__label">{{ t.name }}</span>
                      <span class="dash-type-item__code">{{ t.code }}</span>
                    </div>
                  }
                </div>
              }
            </nz-spin>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dash { padding: 0; }

    /* ===== Header ===== */
    .dash-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 16px; padding: 4px 0 16px; flex-wrap: wrap;
    }
    .dash-header__title {
      margin: 0; font-size: 18px; font-weight: 700; color: #18181b; line-height: 1.3;
    }
    .dash-header__subtitle {
      margin: 2px 0 0; font-size: 13px; color: #71717a;
    }
    .dash-header__right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
    .dash-header__date {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 12px; color: #71717a;
      background: #f4f4f5; padding: 4px 10px; border-radius: 6px;
    }

    /* ===== Stat Cards ===== */
    .dash-stats {
      display: grid; grid-template-columns: repeat(5, 1fr);
      gap: 10px; margin-bottom: 16px;
    }
    .dash-stat {
      display: flex; align-items: center; gap: 12px;
      background: #fff; border: 1px solid #e4e4e7; border-radius: 8px;
      padding: 14px 16px; cursor: pointer;
      transition: all .15s ease;
    }
    .dash-stat:hover { border-color: #d4d4d8; box-shadow: 0 2px 8px rgba(0,0,0,.04); transform: translateY(-1px); }
    .dash-stat__icon {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; flex-shrink: 0;
    }
    .dash-stat__info { display: flex; flex-direction: column; min-width: 0; }
    .dash-stat__value { font-size: 22px; font-weight: 700; color: #18181b; line-height: 1.2; }
    .dash-stat__label { font-size: 11px; color: #71717a; margin-top: 1px; white-space: nowrap; }

    /* ===== Section ===== */
    .dash-section { margin-bottom: 16px; }
    .dash-section__header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 10px;
    }
    .dash-section__title {
      display: flex; align-items: center; gap: 6px;
      font-size: 13px; font-weight: 600; color: #27272a;
    }
    .dash-badge {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 18px; height: 18px; border-radius: 9px;
      background: #ef4444; color: #fff;
      font-size: 10px; font-weight: 600; padding: 0 5px;
    }

    /* Empty action state */
    .dash-empty-action {
      display: flex; align-items: center; gap: 8px;
      padding: 16px 20px; background: #f0fdf4; border: 1px solid #dcfce7;
      border-radius: 8px; font-size: 13px; color: #15803d;
    }
    .dash-empty-action__icon { font-size: 18px; color: #22c55e; }

    /* ===== Action Cards (Perlu Tindakan) ===== */
    .dash-actions-grid { display: flex; flex-direction: column; gap: 6px; }
    .dash-action-card {
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px; padding: 10px 14px;
      background: #fff; border: 1px solid #e4e4e7; border-radius: 8px;
      text-decoration: none; color: inherit;
      transition: all .15s ease;
    }
    .dash-action-card:hover { border-color: #0284c7; background: #f0f9ff; }
    .dash-action-card__left { display: flex; align-items: center; gap: 10px; min-width: 0; }
    .dash-action-card__icon {
      width: 32px; height: 32px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; flex-shrink: 0;
      background: #dbeafe; color: #2563eb;
    }
    .dash-action-card__icon[data-action="approve"] { background: #dcfce7; color: #16a34a; }
    .dash-action-card__icon[data-action="review"] { background: #e0e7ff; color: #4338ca; }
    .dash-action-card__icon[data-action="revise"] { background: #fef3c7; color: #b45309; }
    .dash-action-card__info { display: flex; flex-direction: column; min-width: 0; }
    .dash-action-card__title {
      font-size: 13px; font-weight: 500; color: #18181b;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .dash-action-card__meta { font-size: 11px; color: #a1a1aa; display: flex; align-items: center; gap: 4px; }
    .dash-action-card__num { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 10px; }
    .dash-action-card__sep { color: #d4d4d8; }
    .dash-action-card__right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
    .dash-action-card__deadline {
      font-size: 11px; color: #71717a;
      display: inline-flex; align-items: center; gap: 3px;
    }
    .dash-action-card__deadline--urgent { color: #dc2626; font-weight: 600; }
    .dash-action-card__arrow { color: #d4d4d8; font-size: 12px; transition: color .15s; }
    .dash-action-card:hover .dash-action-card__arrow { color: #0284c7; }

    /* ===== Grid 2-col ===== */
    .dash-grid-2 {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 14px; margin-bottom: 16px;
    }

    /* ===== Panel (card wrapper) ===== */
    .dash-panel {
      background: #fff; border: 1px solid #e4e4e7; border-radius: 8px;
      overflow: hidden;
    }
    .dash-panel__header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 14px; border-bottom: 1px solid #f4f4f5;
      background: #fafafa;
    }
    .dash-panel__title {
      display: flex; align-items: center; gap: 6px;
      font-size: 12px; font-weight: 600; color: #27272a;
      text-transform: uppercase; letter-spacing: .3px;
    }
    .dash-panel__link {
      font-size: 11px; color: #0284c7; text-decoration: none;
      &:hover { text-decoration: underline; }
    }

    /* ===== Doc List ===== */
    .dash-doc-list { }
    .dash-doc-item {
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px; padding: 9px 14px;
      border-bottom: 1px solid #fafafa;
      text-decoration: none; color: inherit;
      transition: background .1s;
    }
    .dash-doc-item:last-child { border-bottom: none; }
    .dash-doc-item:hover { background: #fafafa; }
    .dash-doc-item__main { display: flex; flex-direction: column; min-width: 0; gap: 1px; }
    .dash-doc-item__title {
      font-size: 12.5px; font-weight: 500; color: #27272a;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .dash-doc-item__meta { font-size: 11px; color: #a1a1aa; display: flex; align-items: center; gap: 4px; }
    .dash-doc-item__sep { color: #e4e4e7; }
    .dash-doc-item__right { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; flex-shrink: 0; }
    .dash-doc-item__date { font-size: 10px; color: #a1a1aa; }

    /* Doc status mini tag */
    .dash-doc-status {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 10px; font-weight: 500; padding: 1px 6px;
      border-radius: 8px; white-space: nowrap;
    }
    .dash-doc-status__dot { width: 5px; height: 5px; border-radius: 50%; }
    .dash-doc-status[data-status="draft"] { background: #f4f4f5; color: #52525b; }
    .dash-doc-status[data-status="draft"] .dash-doc-status__dot { background: #a1a1aa; }
    .dash-doc-status[data-status="in_review"] { background: #dbeafe; color: #1d4ed8; }
    .dash-doc-status[data-status="in_review"] .dash-doc-status__dot { background: #3b82f6; }
    .dash-doc-status[data-status="approved"] { background: #dcfce7; color: #15803d; }
    .dash-doc-status[data-status="approved"] .dash-doc-status__dot { background: #22c55e; }
    .dash-doc-status[data-status="revision"] { background: #fef3c7; color: #b45309; }
    .dash-doc-status[data-status="revision"] .dash-doc-status__dot { background: #f59e0b; }
    .dash-doc-status[data-status="final"] { background: #e0e7ff; color: #4338ca; }
    .dash-doc-status[data-status="final"] .dash-doc-status__dot { background: #6366f1; }
    .dash-doc-status[data-status="obsolete"] { background: #fee2e2; color: #b91c1c; }
    .dash-doc-status[data-status="obsolete"] .dash-doc-status__dot { background: #ef4444; }

    /* ===== Activity List ===== */
    .dash-activity-list { padding: 8px 14px; }
    .dash-activity {
      display: flex; gap: 10px; padding: 8px 0;
      border-bottom: 1px solid #fafafa;
    }
    .dash-activity:last-child { border-bottom: none; }
    .dash-activity--unread { }
    .dash-activity__dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: #d4d4d8; flex-shrink: 0; margin-top: 5px;
    }
    .dash-activity__dot[data-type="document_created"] { background: #3b82f6; }
    .dash-activity__dot[data-type="document_approved"] { background: #22c55e; }
    .dash-activity__dot[data-type="document_rejected"] { background: #ef4444; }
    .dash-activity__dot[data-type="document_submitted"] { background: #f59e0b; }
    .dash-activity__dot[data-type="task_assigned"] { background: #8b5cf6; }
    .dash-activity__dot[data-type="comment_added"] { background: #71717a; }
    .dash-activity__body { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
    .dash-activity__title { font-size: 12px; font-weight: 500; color: #27272a; }
    .dash-activity__msg {
      font-size: 11.5px; color: #71717a; line-height: 1.4;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .dash-activity__time { font-size: 10px; color: #a1a1aa; margin-top: 1px; }

    /* ===== Status Chart (CSS bar chart) ===== */
    .dash-status-chart { padding: 14px; }
    .dash-status-row {
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 10px;
    }
    .dash-status-row:last-of-type { margin-bottom: 0; }
    .dash-status-row__label {
      display: flex; align-items: center; gap: 6px;
      width: 100px; flex-shrink: 0;
      font-size: 12px; color: #52525b;
    }
    .dash-status-row__dot { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }
    .dash-status-row__bar-wrap {
      flex: 1; height: 20px; background: #f4f4f5;
      border-radius: 4px; overflow: hidden;
    }
    .dash-status-row__bar {
      height: 100%; border-radius: 4px;
      transition: width .4s ease; min-width: 2px;
    }
    .dash-status-row__count {
      font-size: 12px; font-weight: 600; color: #27272a;
      width: 32px; text-align: right;
    }
    .dash-status-total {
      margin-top: 12px; padding-top: 10px; border-top: 1px solid #f4f4f5;
      font-size: 12px; color: #71717a; text-align: right;
    }

    /* ===== Type Grid ===== */
    .dash-type-grid {
      display: grid; grid-template-columns: repeat(3, 1fr);
      gap: 0; padding: 0;
    }
    .dash-type-item {
      display: flex; flex-direction: column; align-items: center;
      padding: 16px 10px; text-align: center;
      border-bottom: 1px solid #f4f4f5;
      border-right: 1px solid #f4f4f5;
      transition: background .1s;
    }
    .dash-type-item:nth-child(3n) { border-right: none; }
    .dash-type-item:hover { background: #fafafa; }
    .dash-type-item__count { font-size: 20px; font-weight: 700; color: #18181b; }
    .dash-type-item__label { font-size: 11px; color: #52525b; margin-top: 2px; }
    .dash-type-item__code {
      font-size: 9px; font-weight: 500; color: #a1a1aa;
      font-family: 'SF Mono', 'Fira Code', monospace;
      text-transform: uppercase; letter-spacing: .5px; margin-top: 2px;
    }

    /* ===== Responsive ===== */
    @media (max-width: 1024px) {
      .dash-stats { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 768px) {
      .dash-stats { grid-template-columns: repeat(2, 1fr); }
      .dash-grid-2 { grid-template-columns: 1fr; }
      .dash-header { flex-direction: column; gap: 8px; }
      .dash-header__right { align-self: flex-start; }
      .dash-type-grid { grid-template-columns: repeat(2, 1fr); }
      .dash-type-item:nth-child(3n) { border-right: 1px solid #f4f4f5; }
      .dash-type-item:nth-child(2n) { border-right: none; }
    }
  `]
})
export class DashboardPage implements OnInit {
  private readonly http = inject(HttpClient);
  readonly authState = inject(AuthStateService);
  private readonly apiUrl = environment.apiUrl;

  today = new Date();

  loadingStats = signal(true);
  loadingDocs = signal(true);
  loadingTasks = signal(true);
  loadingActivities = signal(true);
  loadingStatusBreakdown = signal(true);
  loadingTypeBreakdown = signal(true);

  stats = signal<{ key: string; title: string; value: number; icon: string; color: string; bgColor: string; route: string; queryParams?: any }[]>([
    { key: 'total', title: 'Total Dokumen', value: 0, icon: 'file-text', color: '#0284c7', bgColor: '#e0f2fe', route: '/documents' },
    { key: 'mytask', title: 'Tugas Saya', value: 0, icon: 'bell', color: '#dc2626', bgColor: '#fee2e2', route: '/documents' },
    { key: 'review', title: 'Menunggu Review', value: 0, icon: 'clock-circle', color: '#d97706', bgColor: '#fef3c7', route: '/documents', queryParams: { status: 'in_review' } },
    { key: 'mydocs', title: 'Dokumen Saya', value: 0, icon: 'user', color: '#7c3aed', bgColor: '#ede9fe', route: '/documents' },
    { key: 'users', title: 'Total Pengguna', value: 0, icon: 'team', color: '#059669', bgColor: '#d1fae5', route: '/users' },
  ]);

  recentDocs = signal<DashboardDoc[]>([]);
  pendingTasks = signal<PendingTask[]>([]);
  activities = signal<Notification[]>([]);
  statusBreakdown = signal<StatusCount[]>([]);
  typeBreakdown = signal<{ name: string; code: string; count: number }[]>([]);

  ngOnInit(): void {
    this.loadStats();
    this.loadRecentDocs();
    this.loadPendingTasks();
    this.loadActivities();
    if (this.isAdmin()) {
      this.loadStatusBreakdown();
      this.loadTypeBreakdown();
    }
  }

  isAdmin(): boolean {
    return this.authState.hasAnyRole(['admin', 'super_admin', 'manager']);
  }

  getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Selamat Pagi';
    if (h < 15) return 'Selamat Siang';
    if (h < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  }

  isUrgent(deadline: string): boolean {
    if (!deadline) return false;
    const diff = new Date(deadline).getTime() - Date.now();
    return diff < 86400000 * 2; // < 2 days
  }

  formatTimeAgo(dateStr: string): string {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Baru saja';
    if (mins < 60) return `${mins} menit lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} hari lalu`;
    return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
  }

  getBarWidth(count: number): number {
    const max = Math.max(...this.statusBreakdown().map(s => s.count), 1);
    return (count / max) * 100;
  }

  getTotalDocs(): number {
    return this.statusBreakdown().reduce((sum, s) => sum + s.count, 0);
  }

  private loadStats(): void {
    const empty = { data: [], meta: { total: 0 } };

    forkJoin({
      docs: this.http.get<any>(`${this.apiUrl}/documents`, { params: { per_page: '1' } }).pipe(catchError(() => of(empty))),
      inReview: this.http.get<any>(`${this.apiUrl}/documents`, { params: { status: 'in_review', per_page: '1' } }).pipe(catchError(() => of(empty))),
      pending: this.http.get<any>(`${this.apiUrl}/workflow/pending-tasks`).pipe(catchError(() => of({ data: [] }))),
      myDocs: this.http.get<any>(`${this.apiUrl}/documents`, { params: { created_by: 'me', per_page: '1' } }).pipe(catchError(() => of(empty))),
      users: this.http.get<any>(`${this.apiUrl}/users`, { params: { per_page: '1' } }).pipe(catchError(() => of(empty)))
    }).subscribe({
      next: (res) => {
        this.stats.set([
          { key: 'total', title: 'Total Dokumen', value: res.docs?.meta?.total ?? 0, icon: 'file-text', color: '#0284c7', bgColor: '#e0f2fe', route: '/documents' },
          { key: 'mytask', title: 'Tugas Saya', value: res.pending?.data?.length ?? 0, icon: 'bell', color: '#dc2626', bgColor: '#fee2e2', route: '/documents' },
          { key: 'review', title: 'Menunggu Review', value: res.inReview?.meta?.total ?? 0, icon: 'clock-circle', color: '#d97706', bgColor: '#fef3c7', route: '/documents', queryParams: { status: 'in_review' } },
          { key: 'mydocs', title: 'Dokumen Saya', value: res.myDocs?.meta?.total ?? 0, icon: 'user', color: '#7c3aed', bgColor: '#ede9fe', route: '/documents' },
          { key: 'users', title: 'Total Pengguna', value: res.users?.meta?.total ?? 0, icon: 'team', color: '#059669', bgColor: '#d1fae5', route: '/users' },
        ]);
        this.loadingStats.set(false);
      },
      error: () => this.loadingStats.set(false)
    });
  }

  private loadRecentDocs(): void {
    this.http.get<any>(`${this.apiUrl}/documents`, {
      params: { per_page: '7', sort_by: 'created_at', sort_dir: 'desc' }
    }).pipe(catchError(() => of({ data: [] }))).subscribe({
      next: (res) => { this.recentDocs.set(res.data ?? []); this.loadingDocs.set(false); },
      error: () => this.loadingDocs.set(false)
    });
  }

  private loadPendingTasks(): void {
    this.http.get<any>(`${this.apiUrl}/workflow/pending-tasks`).pipe(
      catchError(() => of({ data: [] }))
    ).subscribe({
      next: (res) => { this.pendingTasks.set(res.data ?? []); this.loadingTasks.set(false); },
      error: () => this.loadingTasks.set(false)
    });
  }

  private loadActivities(): void {
    this.http.get<any>(`${this.apiUrl}/notifications`, {
      params: { per_page: '8' }
    }).pipe(catchError(() => of({ data: [] }))).subscribe({
      next: (res) => { this.activities.set(res.data ?? []); this.loadingActivities.set(false); },
      error: () => this.loadingActivities.set(false)
    });
  }

  private loadStatusBreakdown(): void {
    const statuses = ['draft', 'in_review', 'approved', 'revision', 'final', 'obsolete'];
    const colors: Record<string, { color: string; bgColor: string; label: string }> = {
      draft: { color: '#a1a1aa', bgColor: '#f4f4f5', label: 'Draft' },
      in_review: { color: '#3b82f6', bgColor: '#dbeafe', label: 'Dalam Review' },
      approved: { color: '#22c55e', bgColor: '#dcfce7', label: 'Disetujui' },
      revision: { color: '#f59e0b', bgColor: '#fef3c7', label: 'Revisi' },
      final: { color: '#6366f1', bgColor: '#e0e7ff', label: 'Final' },
      obsolete: { color: '#ef4444', bgColor: '#fee2e2', label: 'Usang' },
    };

    forkJoin(
      statuses.map(s =>
        this.http.get<any>(`${this.apiUrl}/documents`, { params: { status: s, per_page: '1' } }).pipe(
          catchError(() => of({ meta: { total: 0 } }))
        )
      )
    ).subscribe({
      next: (results) => {
        this.statusBreakdown.set(
          statuses.map((s, i) => ({
            status: s,
            count: results[i]?.meta?.total ?? 0,
            label: colors[s].label,
            color: colors[s].color,
            bgColor: colors[s].bgColor,
          })).filter(s => s.count > 0)
        );
        this.loadingStatusBreakdown.set(false);
      },
      error: () => this.loadingStatusBreakdown.set(false)
    });
  }

  private loadTypeBreakdown(): void {
    this.http.get<any>(`${this.apiUrl}/document-types`).pipe(
      catchError(() => of({ data: [] }))
    ).subscribe({
      next: (res) => {
        const types = res.data ?? [];
        if (types.length === 0) {
          this.typeBreakdown.set([]);
          this.loadingTypeBreakdown.set(false);
          return;
        }
        forkJoin(
          types.map((t: any) =>
            this.http.get<any>(`${this.apiUrl}/documents`, { params: { type_id: t.id, per_page: '1' } }).pipe(
              catchError(() => of({ meta: { total: 0 } }))
            )
          )
        ).subscribe({
          next: (counts) => {
            const results = counts as any[];
            this.typeBreakdown.set(
              types.map((t: any, i: number) => ({
                name: t.name,
                code: t.code,
                count: (results[i] as any)?.meta?.total ?? 0
              })).sort((a: any, b: any) => b.count - a.count)
            );
            this.loadingTypeBreakdown.set(false);
          },
          error: () => this.loadingTypeBreakdown.set(false)
        });
      },
      error: () => this.loadingTypeBreakdown.set(false)
    });
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      draft: 'default', in_review: 'orange', approved: 'green',
      rejected: 'red', archived: 'gray', revision: 'warning',
      final: 'blue', obsolete: 'error'
    };
    return colors[status] || 'default';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: 'Draft', in_review: 'Review', revision: 'Revisi',
      approved: 'Disetujui', final: 'Final', obsolete: 'Usang', archived: 'Diarsipkan'
    };
    return labels[status] || status;
  }

  getNotificationColor(type: string): string {
    const colors: Record<string, string> = {
      document_created: 'blue', document_approved: 'green',
      document_rejected: 'red', document_submitted: 'orange',
      task_assigned: 'purple', comment_added: 'gray'
    };
    return colors[type] || 'blue';
  }
}
