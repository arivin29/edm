import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';

/**
 * Interceptor to handle HTTP errors globally
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notification = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Terjadi kesalahan. Silakan coba lagi.';

      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = error.error.message;
      } else {
        // Server-side error
        switch (error.status) {
          case 0:
            errorMessage = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
            break;
          case 400:
            errorMessage = error.error?.message || 'Permintaan tidak valid.';
            break;
          case 401:
            // Handled by auth interceptor
            errorMessage = 'Sesi Anda telah berakhir. Silakan login kembali.';
            break;
          case 403:
            errorMessage = 'Anda tidak memiliki izin untuk melakukan aksi ini.';
            break;
          case 404:
            errorMessage = error.error?.message || 'Data tidak ditemukan.';
            break;
          case 409:
            errorMessage = error.error?.message || 'Data sudah ada.';
            break;
          case 422:
            // Validation errors
            if (error.error?.errors) {
              const errors = error.error.errors;
              const firstError = Object.values(errors)[0];
              errorMessage = Array.isArray(firstError) ? firstError[0] : (firstError as string);
            } else {
              errorMessage = error.error?.message || 'Data tidak valid.';
            }
            break;
          case 429:
            errorMessage = 'Terlalu banyak permintaan. Silakan tunggu beberapa saat.';
            break;
          case 500:
            errorMessage = 'Terjadi kesalahan pada server. Silakan coba lagi nanti.';
            break;
          case 502:
          case 503:
          case 504:
            errorMessage = 'Server sedang tidak tersedia. Silakan coba lagi nanti.';
            break;
          default:
            errorMessage = error.error?.message || `Error: ${error.status}`;
        }
      }

      // Don't show notification for 401 (handled by auth interceptor)
      if (error.status !== 401) {
        notification.error('Error', errorMessage);
      }

      return throwError(() => error);
    })
  );
};
