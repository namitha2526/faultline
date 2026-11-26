export interface FaultlineConfig {
  dsn: string;
  apiKey?: string;
  release: string;
  environment: string;
}

export interface FaultlineUser {
  id: string;
  hashedId?: string;
}

export interface BrowserOverride {
  browser: string;
  os: string;
}

export interface FaultlinePayload {
  event_id: string;
  message: string;
  stack_trace: string | null;
  exception_type: string | null;
  url: string;
  browser: string;
  os: string;
  release: string;
  environment?: string;
  user_id: string | null;
  timestamp: string;
  extra?: Record<string, unknown>;
}

export type SdkEventStatus = "queued" | "sent" | "failed" | "dropped";

export interface SdkEventLog {
  id: string;
  event_id: string;
  timestamp: string;
  message: string;
  exception_type: string;
  status: SdkEventStatus;
  retryCount: number;
  reason?: string;
  payload: FaultlinePayload;
}

