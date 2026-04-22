import { Component, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { LayoutService } from '../../core/services/layout.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent {
  private layoutService = inject(LayoutService);
  
  // State - sync with LayoutService
  sidebarCollapsed = this.layoutService.mainSidebarCollapsed;
  mobileSidebarOpen = signal(false);

  /**
   * Toggle sidebar collapse (desktop)
   */
  toggleSidebar(): void {
    this.layoutService.toggleMainSidebar();
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
