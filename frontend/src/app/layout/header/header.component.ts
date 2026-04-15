import { Component, signal, inject, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzInputModule } from 'ng-zorro-antd/input';
import { AuthStateService } from '../../core/auth/auth-state.service';

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
    NzInputModule
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

  get userInitial(): string {
    return this.userName()?.charAt(0)?.toUpperCase() || 'U';
  }

  logout(): void {
    this.authState.logout();
  }
}
