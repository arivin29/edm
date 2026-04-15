import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

const AUTH_STORAGE_KEY = 'auth';

/**
 * Get token directly from localStorage to avoid circular dependency
 */
function getTokenFromStorage(): string | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const data = localStorage.getItem(AUTH_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return parsed.token || null;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Interceptor to attach JWT token to outgoing requests
 */
export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const platformId = inject(PLATFORM_ID);
  
  // Only works in browser
  if (!isPlatformBrowser(platformId)) {
    return next(req);
  }

  // Only add token to API requests
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  // Skip auth header for login/refresh endpoints
  if (req.url.includes('/auth/login') || req.url.includes('/auth/refresh')) {
    return next(req);
  }

  const token = getTokenFromStorage();
  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // For 401 errors, let the error interceptor or component handle logout
        return throwError(() => error);
      })
    );
  }

  return next(req);
};
