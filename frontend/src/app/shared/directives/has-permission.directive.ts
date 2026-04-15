import { Directive, Input, TemplateRef, ViewContainerRef, inject, OnInit } from '@angular/core';
import { AuthStateService } from '../../core/auth/auth-state.service';

@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnInit {
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private authState = inject(AuthStateService);

  @Input('appHasPermission') permission = '';
  @Input('appHasPermissionElse') elseTemplate: TemplateRef<any> | null = null;

  private hasView = false;

  ngOnInit(): void {
    this.updateView();
  }

  private updateView(): void {
    const hasPermission = this.authState.hasPermission(this.permission);

    if (hasPermission && !this.hasView) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasPermission) {
      this.viewContainer.clear();
      if (this.elseTemplate) {
        this.viewContainer.createEmbeddedView(this.elseTemplate);
      }
      this.hasView = false;
    }
  }
}

@Directive({
  selector: '[appHasAnyPermission]',
  standalone: true
})
export class HasAnyPermissionDirective implements OnInit {
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private authState = inject(AuthStateService);

  @Input('appHasAnyPermission') permissions: string[] = [];

  private hasView = false;

  ngOnInit(): void {
    this.updateView();
  }

  private updateView(): void {
    const hasAny = this.permissions.some(p => this.authState.hasPermission(p));

    if (hasAny && !this.hasView) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasAny && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}

@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective implements OnInit {
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private authState = inject(AuthStateService);

  @Input('appHasRole') role = '';

  private hasView = false;

  ngOnInit(): void {
    this.updateView();
  }

  private updateView(): void {
    const hasRole = this.authState.hasRole(this.role);

    if (hasRole && !this.hasView) {
      this.viewContainer.clear();
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasRole && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
