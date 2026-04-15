import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  // State
  sidebarCollapsed = signal(false);
  mobileSidebarOpen = signal(false);

  /**
   * Toggle sidebar collapse (desktop)
   */
  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  /**
   * Toggle mobile sidebar
   */
  toggleMobileSidebar(): void {
    this.mobileSidebarOpen.update(v => !v);
  }

  /**
   * Close mobile sidebar
   */
  closeMobileSidebar(): void {
    this.mobileSidebarOpen.set(false);
  }
}
