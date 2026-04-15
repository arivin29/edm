import { Component, signal, inject, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthStateService } from '../../core/auth/auth-state.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
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

  // State
  userMenuOpen = signal(false);
  notificationMenuOpen = signal(false);

  // User info
  userName = this.authState.userName;
  userEmail = this.authState.userEmail;

  /**
   * Toggle user dropdown menu
   */
  toggleUserMenu(): void {
    this.userMenuOpen.update(v => !v);
    if (this.userMenuOpen()) {
      this.notificationMenuOpen.set(false);
    }
  }

  /**
   * Toggle notification dropdown
   */
  toggleNotificationMenu(): void {
    this.notificationMenuOpen.update(v => !v);
    if (this.notificationMenuOpen()) {
      this.userMenuOpen.set(false);
    }
  }

  /**
   * Close all dropdowns
   */
  closeDropdowns(): void {
    this.userMenuOpen.set(false);
    this.notificationMenuOpen.set(false);
  }

  /**
   * Logout user
   */
  logout(): void {
    this.authState.logout();
  }
}
