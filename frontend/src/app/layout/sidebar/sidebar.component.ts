import { Component, signal, computed, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { MENU_ITEMS } from './menu-config';

export interface MenuItem {
  key: string;
  label: string;
  icon?: string;
  route?: string;
  permission?: string;
  children?: MenuItem[];
  badge?: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, NzMenuModule, NzIconModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  private readonly authState = inject(AuthStateService);

  // Inputs
  collapsed = input<boolean>(false);

  // Outputs
  toggleCollapse = output<void>();

  // State
  menuItems = signal<MenuItem[]>(MENU_ITEMS);

  // Computed - filter menu items based on permissions
  visibleMenuItems = computed(() => {
    return this.filterMenuItems(this.menuItems());
  });

  /**
   * Filter menu items based on user permissions
   */
  private filterMenuItems(items: MenuItem[]): MenuItem[] {
    return items.filter(item => {
      if (item.permission && !this.authState.hasPermission(item.permission)) {
        return false;
      }
      if (item.children) {
        const visibleChildren = this.filterMenuItems(item.children);
        if (visibleChildren.length === 0) {
          return false;
        }
        item = { ...item, children: visibleChildren };
      }
      return true;
    });
  }

  hasChildren(item: MenuItem): boolean {
    return !!item.children && item.children.length > 0;
  }
}
