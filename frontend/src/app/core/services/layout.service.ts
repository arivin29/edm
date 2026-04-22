import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  private _mainSidebarCollapsed = signal(false);
  
  readonly mainSidebarCollapsed = this._mainSidebarCollapsed.asReadonly();

  collapseMainSidebar(): void {
    this._mainSidebarCollapsed.set(true);
  }

  expandMainSidebar(): void {
    this._mainSidebarCollapsed.set(false);
  }

  toggleMainSidebar(): void {
    this._mainSidebarCollapsed.update(v => !v);
  }

  setMainSidebarCollapsed(collapsed: boolean): void {
    this._mainSidebarCollapsed.set(collapsed);
  }
}
