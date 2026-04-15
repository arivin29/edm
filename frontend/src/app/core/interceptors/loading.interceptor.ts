import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

/**
 * Interceptor to show/hide global loading spinner for API requests
 * Skip loading for requests with 'X-Skip-Loading' header
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  // Skip loading if header is set
  if (req.headers.has('X-Skip-Loading')) {
    const newReq = req.clone({
      headers: req.headers.delete('X-Skip-Loading')
    });
    return next(newReq);
  }

  loadingService.show();

  return next(req).pipe(
    finalize(() => {
      loadingService.hide();
    })
  );
};
