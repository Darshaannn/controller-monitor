import { ErrorHandler, Injectable, NgZone, inject } from '@angular/core';

export interface ClientErrorLog {
  readonly message: string;
  readonly stack?: string;
  readonly timestamp: string;
  readonly url: string;
}

/**
 * Global Application Error Handler for Angular.
 * Intercepts uncaught synchronous and asynchronous client-side errors,
 * prevents crashing of the application, and formats logs for auditing.
 */
@Injectable({
  providedIn: 'root',
})
export class GlobalErrorHandler implements ErrorHandler {
  private readonly zone = inject(NgZone);

  handleError(error: unknown): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const timestamp = new Date().toISOString();
    const url = typeof window !== 'undefined' ? window.location.href : 'unknown';

    const errorLog: ClientErrorLog = {
      message: errorObj.message || 'An unknown error occurred',
      stack: errorObj.stack,
      timestamp,
      url,
    };

    // Safe sanitized logging
    console.error('[GlobalErrorHandler]', errorLog);

    // Run inside NgZone to allow UI alerts or toast updates if needed without desync
    this.zone.run(() => {
      // Intentionally guarded to avoid interrupting reactive state or chart canvases
    });
  }
}
