import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { AuthStateService } from '../../../core/auth/auth-state.service';

interface NavItem {
  key: string;
  label: string;
  icon: string;
  route: string;
  description: string;
}

@Component({
  selector: 'app-profile-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    NzAvatarModule,
    NzTagModule,
    NzIconModule,
    NzBadgeModule,
  ],
  templateUrl: './profile-layout.component.html',
  styleUrl: './profile-layout.component.scss',
})
export class ProfileLayoutComponent {
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);

  userName = this.authState.userName;
  userEmail = this.authState.userEmail;

  userInitial = computed(() => this.userName()?.charAt(0)?.toUpperCase() || 'U');

  userRoleLabel = computed(() => {
    const roles = this.authState.roles?.() || [];
    const roleMap: Record<string, string> = {
      super_admin: 'Super Admin',
      admin_company: 'Admin Perusahaan',
      creator: 'Creator',
      reviewer: 'Reviewer',
      approver: 'Approver',
      viewer: 'Viewer',
    };
    return roles.map((r) => roleMap[r] || r);
  });

  userAvatar = computed(() => (this.authState.user() as any)?.avatar || '');

  navItems: NavItem[] = [
    {
      key: 'overview',
      label: 'Ikhtisar',
      icon: 'user',
      route: '/profile/overview',
      description: 'Informasi profil & organisasi',
    },
    {
      key: 'settings',
      label: 'Edit Profil',
      icon: 'edit',
      route: '/profile/settings',
      description: 'Ubah nama, telepon & foto',
    },
    {
      key: 'security',
      label: 'Keamanan',
      icon: 'safety-certificate',
      route: '/profile/security',
      description: 'Password & sesi aktif',
    },
    {
      key: 'signature',
      label: 'Tanda Tangan',
      icon: 'form',
      route: '/profile/signature',
      description: 'Tanda tangan digital untuk TTE',
    },
  ];

  isActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }
}
