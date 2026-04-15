import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthStateService } from '../auth/auth-state.service';
import { NotificationService } from '../services/notification.service';

/**
 * Guard to check if user has required permission
 * Usage in route: data: { permission: 'document.view' }
 * Or for multiple: data: { permissions: ['document.view', 'document.create'], permissionMode: 'any' | 'all' }
 */
export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);
  const notification = inject(NotificationService);

  // Check single permission
  const requiredPermission = route.data['permission'] as string | undefined;
  if (requiredPermission) {
    if (authState.hasPermission(requiredPermission)) {
      return true;
    }
    notification.error('Akses Ditolak', 'Anda tidak memiliki izin untuk mengakses halaman ini');
    router.navigate(['/unauthorized']);
    return false;
  }

  // Check multiple permissions
  const requiredPermissions = route.data['permissions'] as string[] | undefined;
  if (requiredPermissions && requiredPermissions.length > 0) {
    const mode = route.data['permissionMode'] as 'any' | 'all' || 'any';
    
    const hasAccess = mode === 'all' 
      ? authState.hasAllPermissions(requiredPermissions)
      : authState.hasAnyPermission(requiredPermissions);

    if (hasAccess) {
      return true;
    }
    notification.error('Akses Ditolak', 'Anda tidak memiliki izin untuk mengakses halaman ini');
    router.navigate(['/unauthorized']);
    return false;
  }

  // No permission required
  return true;
};

/**
 * Guard to check if user has required role
 * Usage in route: data: { role: 'super_admin' }
 * Or for multiple: data: { roles: ['super_admin', 'admin_company'] }
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);
  const notification = inject(NotificationService);

  // Check single role
  const requiredRole = route.data['role'] as string | undefined;
  if (requiredRole) {
    if (authState.hasRole(requiredRole)) {
      return true;
    }
    notification.error('Akses Ditolak', 'Anda tidak memiliki akses untuk halaman ini');
    router.navigate(['/unauthorized']);
    return false;
  }

  // Check multiple roles (any)
  const requiredRoles = route.data['roles'] as string[] | undefined;
  if (requiredRoles && requiredRoles.length > 0) {
    if (authState.hasAnyRole(requiredRoles)) {
      return true;
    }
    notification.error('Akses Ditolak', 'Anda tidak memiliki akses untuk halaman ini');
    router.navigate(['/unauthorized']);
    return false;
  }

  // No role required
  return true;
};
