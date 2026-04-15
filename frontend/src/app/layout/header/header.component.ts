import { Component, signal, inject, output, input, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NzDropDownModule,
    NzIconModule,
    NzBadgeModule,
    NzAvatarModule,
    NzInputModule,
    NzToolTipModule,
    NotificationBellComponent
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  private readonly authState = inject(AuthStateService);

  // Inputs
  sidebarCollapsed = input<boolean>(false);

  // Outputs
  toggleSidebar = output<void>();
  toggleMobileSidebar = output<void>();

  // User info
  userName = this.authState.userName;
  userEmail = this.authState.userEmail;

  // Role label
  userRoleLabel = computed(() => {
    const roles = this.authState.roles?.() || [];
    const roleMap: Record<string, string> = {
      'super_admin': 'Super Admin',
      'admin_company': 'Admin',
      'creator': 'Creator',
      'reviewer': 'Reviewer',
      'approver': 'Approver',
      'viewer': 'Viewer'
    };
    if (roles.length > 0) {
      return roleMap[roles[0]] || roles[0];
    }
    return 'User';
  });

  get userInitial(): string {
    return this.userName()?.charAt(0)?.toUpperCase() || 'U';
  }

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      this.openSearch();
    }
  }

  openSearch(): void {
    // TODO: implement global search modal/dialog
    console.log('Open search');
  }

  logout(): void {
    this.authState.logout();
  }
}
