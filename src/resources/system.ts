import type { HttpClient } from '../http.js';
import type {
  HealthResponse,
  SystemStatusResponse,
  VersionResponse,
} from '../types/system.js';
import type { UserConfig } from '../types/user.js';

/**
 * System endpoints. These are intentionally minimal: health and version are
 * unauthenticated, and `config` returns the calling user's feature flags.
 */
export class SystemResource {
  constructor(private readonly http: HttpClient) {}

  /** GET /health - liveness probe and version stamp. */
  health(): Promise<HealthResponse> {
    return this.http.request<HealthResponse>({ method: 'GET', path: '/health' });
  }

  /** GET /version - server version string only. */
  version(): Promise<VersionResponse> {
    return this.http.request<VersionResponse>({ method: 'GET', path: '/version' });
  }

  /** GET /system-status - global flags (upgrade window, outage, waitlist). */
  status(): Promise<SystemStatusResponse> {
    return this.http.request<SystemStatusResponse>({ method: 'GET', path: '/system-status' });
  }

  /** GET /config - per-user feature flags resolved by the API. */
  config(): Promise<UserConfig> {
    return this.http.request<UserConfig>({ method: 'GET', path: '/config' });
  }
}
