import { inject } from '@angular/core';
import { Router, CanActivateFn, CanMatchFn } from '@angular/router';
import { AuthStateService } from '../auth/auth-state.service';

/**
 * Guard to protect routes that require authentication
 * Redirects to login if not authenticated
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  // Check if token exists in storage (quick check without waiting for user profile)
  const hasToken = !!authState.token();
  
  if (hasToken) {
    return true;
  }

  // Store the attempted URL for redirecting after login
  const returnUrl = state.url;
  router.navigate(['/landing'], { queryParams: { returnUrl } });
  return false;
};

/**
 * CanMatch guard - only match route if user is authenticated
 */
export const authMatch: CanMatchFn = () => {
  const authState = inject(AuthStateService);
  return !!authState.token();
};

/**
 * Guard to prevent authenticated users from accessing guest-only pages (login, register)
 * Redirects to dashboard if already authenticated
 */
export const guestGuard: CanActivateFn = (route, state) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  // Check if token exists - if so, user is logged in
  const hasToken = !!authState.token();

  if (!hasToken) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
