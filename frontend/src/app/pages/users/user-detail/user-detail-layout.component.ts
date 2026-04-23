import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { UserDetailService } from './user-detail.service';

interface NavItem {
  key: string;
  label: string;
  description: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-user-detail-layout',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    NzAvatarModule, NzTagModule, NzIconModule, NzSpinModule, NzButtonModule
  ],
  providers: [UserDetailService],
  template: `
    <div class="user-detail-shell">
      @if (userService.loading()) {
        <div class="loading-container">
          <nz-spin nzSimple nzSize="large"></nz-spin>
        </div>
      } @else if (userService.user()) {
        <!-- Left: sidebar card -->
        <aside class="user-sidebar">
          <!-- Back button -->
          <a routerLink="/users" class="user-back-link">
            <span nz-icon nzType="arrow-left" nzTheme="outline"></span>
            Kembali ke Daftar
          </a>

          <!-- Identity card -->
          <div class="user-id-card">
            <div class="user-id-card__cover"></div>
            <div class="user-id-card__body">
              <div class="user-id-card__avatar-wrap">
                @if (userService.user()!.avatar) {
                  <nz-avatar [nzSrc]="userService.user()!.avatar" [nzSize]="80" class="user-id-card__avatar"></nz-avatar>
                } @else {
                  <nz-avatar [nzText]="userInitial()" [nzSize]="80" class="user-id-card__avatar" 
                    [style.background]="'#1677ff'" [style.fontSize]="'32px'" [style.fontWeight]="600"></nz-avatar>
                }
                <span class="user-id-card__status" [class.active]="userService.user()!.is_active"></span>
              </div>
              <div class="user-id-card__name">{{ userService.user()!.name }}</div>
              <div class="user-id-card__email">{{ userService.user()!.email }}</div>
              <div class="user-id-card__position">{{ userService.user()!.position?.name || userService.user()!.position_name || '-' }}</div>
              <div class="user-id-card__roles">
                @for (role of userService.user()!.roles || []; track role.id) {
                  <nz-tag [nzColor]="getRoleColor(role.name)">{{ role.name }}</nz-tag>
                }
              </div>
            </div>
          </div>

          <!-- Navigation -->
          <nav class="user-nav">
            @for (item of navItems; track item.key) {
              <a
                class="user-nav__item"
                [routerLink]="['/users', userId, item.route]"
                routerLinkActive="active"
              >
                <span nz-icon [nzType]="item.icon" nzTheme="outline" class="user-nav__icon"></span>
                <div class="user-nav__text">
                  <span class="user-nav__label">{{ item.label }}</span>
                  <span class="user-nav__desc">{{ item.description }}</span>
                </div>
                <span nz-icon nzType="right" nzTheme="outline" class="user-nav__arrow"></span>
              </a>
            }
          </nav>

          <!-- Quick Actions -->
          <div class="user-actions">
            <button nz-button nzBlock nzType="default" nzSize="small" (click)="toggleStatus()">
              <span nz-icon [nzType]="userService.user()!.is_active ? 'stop' : 'check-circle'"></span>
              {{ userService.user()!.is_active ? 'Nonaktifkan' : 'Aktifkan' }}
            </button>
          </div>
        </aside>

        <!-- Right: content outlet -->
        <main class="user-content">
          <router-outlet></router-outlet>
        </main>
      } @else {
        <div class="not-found">
          <span nz-icon nzType="user" nzTheme="outline"></span>
          <p>User tidak ditemukan</p>
          <a routerLink="/users" nz-button nzType="primary">Kembali ke Daftar</a>
        </div>
      }
    </div>
  `,
  styleUrl: './user-detail-layout.component.scss'
})
export class UserDetailLayoutComponent implements OnInit {
  userService = inject(UserDetailService);
  private route = inject(ActivatedRoute);
  
  userId = '';

  navItems: NavItem[] = [
    { key: 'overview', label: 'Overview', description: 'Informasi & organisasi', icon: 'user', route: 'overview' },
    { key: 'edit', label: 'Edit Profil', description: 'Ubah data user', icon: 'edit', route: 'edit' },
    { key: 'roles', label: 'Role & Akses', description: 'Kelola permission', icon: 'safety-certificate', route: 'roles' },
    { key: 'activity', label: 'Aktivitas', description: 'Riwayat login & aksi', icon: 'history', route: 'activity' },
  ];

  userInitial = computed(() => {
    const name = this.userService.user()?.name || '';
    return name.charAt(0).toUpperCase();
  });

  ngOnInit() {
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    if (this.userId) {
      this.userService.loadUser(this.userId);
    }
  }

  getRoleColor(role: string): string {
    if (role.toLowerCase().includes('super') || role.toLowerCase().includes('admin')) return 'gold';
    if (role.toLowerCase().includes('manager')) return 'blue';
    return 'default';
  }

  toggleStatus() {
    this.userService.toggleStatus();
  }
}
