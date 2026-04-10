export interface HealthResponse {
  status: 'ok';
  version: string;
  timestamp: string;
}

export interface VersionResponse {
  version: string;
}

export interface SystemStatusResponse {
  upgrading: boolean;
  outage: boolean;
  waitlist: boolean;
}
