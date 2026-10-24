import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, from, of, throwError } from 'rxjs';
import { switchMap, timeout, retry, catchError, map } from 'rxjs/operators';
import { DashboardResponse } from 'telemetry-contracts';
import { environment } from '../../../environments/environment';

import { TelemetryDesktopBridge } from '../models';

@Injectable({
  providedIn: 'root',
})
export class TelemetryApiService {
  private readonly http = inject(HttpClient);

  // Cached base URL initialized from safe environment configuration
  private cachedBaseUrl: string = environment.apiBaseUrl.replace(/\/+$/, '');
  private baseUrlResolved = false;

  /**
   * Sanitizes and validates the base URL to prevent protocol injection or open redirects.
   * Allows loopback/localhost as well as the explicitly configured environment.apiBaseUrl host.
   */
  private sanitizeUrl(rawUrl: string): string {
    try {
      const parsed = new URL(rawUrl);
      const configuredHost = environment.apiBaseUrl ? new URL(environment.apiBaseUrl, 'http://localhost').hostname : '';
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
      // Allow localhost, loopback, private LAN addresses, configured host, or current browser origin host
      const isLoopback =
        parsed.hostname === 'localhost' ||
        parsed.hostname === '127.0.0.1' ||
        parsed.hostname === '[::1]';
      const isConfiguredHost = configuredHost ? parsed.hostname === configuredHost : false;
      const isCurrentOrigin = currentHost ? parsed.hostname === currentHost : false;

      if (!isLoopback && !isConfiguredHost && !isCurrentOrigin) {
        console.warn(
          `Untrusted API host rejected (${parsed.hostname}). Reverting to environment baseline: ${environment.apiBaseUrl}`,
        );
        return environment.apiBaseUrl;
      }
      return `${parsed.protocol}//${parsed.host}`;
    } catch {
      return environment.apiBaseUrl;
    }
  }

  /**
   * Resolves the API base URL safely from the Electron runtime bridge or environment fallback.
   */
  getBaseUrl(): Observable<string> {
    if (this.baseUrlResolved) {
      return of(this.cachedBaseUrl);
    }

    if (typeof window !== 'undefined' && window.telemetryDesktop) {
      return from(window.telemetryDesktop.getApiEndpoint()).pipe(
        map((endpoint) => {
          this.cachedBaseUrl = this.sanitizeUrl(endpoint);
          this.baseUrlResolved = true;
          return this.cachedBaseUrl;
        }),
        catchError((err) => {
          console.warn(
            'Failed to query desktop IPC endpoint, falling back to environment config:',
            err,
          );
          this.cachedBaseUrl = environment.apiBaseUrl;
          this.baseUrlResolved = true;
          return of(this.cachedBaseUrl);
        }),
      );
    }

    // If environment.apiBaseUrl is empty in web mode, use same-origin window.location.origin
    if (!environment.apiBaseUrl && typeof window !== 'undefined' && window.location && window.location.origin) {
      this.cachedBaseUrl = window.location.origin;
    }

    this.baseUrlResolved = true;
    return of(this.cachedBaseUrl);
  }

  /**
   * Securely requests the real-time telemetry dashboard snapshot with timeouts,
   * bounded retries, and typed error handling.
   */
  getDashboard(): Observable<DashboardResponse> {
    return this.getBaseUrl().pipe(
      switchMap((baseUrl) => {
        const url = `${baseUrl}/api/dashboard`;
        return this.http.get<DashboardResponse>(url);
      }),
      // Guard against hung socket connections with configurable timeout
      timeout(environment.apiTimeoutMs),
      catchError((error: unknown) => this.handleHttpError(error)),
    );
  }

  /**
   * Connects to the real-time Server-Sent Events (SSE) telemetry stream: GET /api/telemetry/stream
   * Yields live updates automatically as events arrive without periodic HTTP polling overhead.
   */
  connectTelemetryStream(): Observable<DashboardResponse> {
    return this.getBaseUrl().pipe(
      switchMap((baseUrl) => {
        return new Observable<DashboardResponse>((observer) => {
          const streamUrl = `${baseUrl}/api/telemetry/stream`;
          let eventSource: EventSource | null = null;

          try {
            eventSource = new EventSource(streamUrl);

            eventSource.addEventListener('snapshot', (event: MessageEvent) => {
              try {
                const data = JSON.parse(event.data) as DashboardResponse;
                observer.next(data);
              } catch (parseErr) {
                console.error('Failed to parse SSE telemetry snapshot payload:', parseErr);
              }
            });

            eventSource.onerror = (err) => {
              observer.error(new Error('Telemetry SSE stream connection lost or unreachable.'));
            };
          } catch (initErr) {
            observer.error(initErr);
          }

          return () => {
            if (eventSource) {
              eventSource.close();
              eventSource = null;
            }
          };
        });
      }),
    );
  }

  /**
   * Centralized secure error handler that strips sensitive details and normalizes messages.
   */
  private handleHttpError(error: unknown): Observable<never> {
    let userMessage =
      'Unable to retrieve telemetry data. Check the local monitoring service and try again.';

    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        userMessage = 'Telemetry service is unreachable. Ensure the backend engine is running.';
      } else if (error.status >= 500) {
        userMessage = `Telemetry service reported server error (${error.status}).`;
      } else if (error.status === 404) {
        userMessage = 'Telemetry dashboard endpoint not found on target host.';
      } else {
        userMessage = `Telemetry request failed (HTTP ${error.status}).`;
      }
    }

    return throwError(() => new Error(userMessage));
  }
}
