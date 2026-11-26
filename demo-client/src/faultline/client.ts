import {
  FaultlineConfig,
  FaultlinePayload,
  FaultlineUser,
  BrowserOverride,
} from "./types";
import { Transport } from "./transport";
import { RateLimiter } from "./ratelimit";
import { scrubText } from "./scrub";
import { hashSha256 } from "./hasher";
import { sdkLogger } from "./logger";

export class FaultlineClient {
  private static instance: FaultlineClient | null = null;
  private config: FaultlineConfig = {
    dsn: import.meta.env.VITE_FAULTLINE_URL || "http://localhost:8000",
    apiKey: import.meta.env.VITE_FAULTLINE_KEY || "fl_demo_key_9f8e7d6c5b4a",
    release: import.meta.env.VITE_APP_RELEASE || "1.4.1",
    environment: import.meta.env.VITE_APP_ENV || "production",
  };

  private transport: Transport | null = null;
  private rateLimiter: RateLimiter = new RateLimiter();
  private currentUser: FaultlineUser | null = null;
  private browserOverride: BrowserOverride | null = null;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): FaultlineClient {
    if (!FaultlineClient.instance) {
      FaultlineClient.instance = new FaultlineClient();
    }
    return FaultlineClient.instance;
  }

  public init(options: Partial<FaultlineConfig> = {}): void {
    try {
      this.config = {
        ...this.config,
        ...options,
      };

      if (!this.transport) {
        this.transport = new Transport(this.config);
      } else {
        this.transport.updateConfig(this.config);
      }

      if (!this.isInitialized && typeof window !== "undefined") {
        this.hookGlobalErrors();
        this.isInitialized = true;
      }
    } catch {
      // Never crash host app
    }
  }

  public async setUser(user: { id: string } | null): Promise<void> {
    try {
      if (!user || !user.id) {
        this.currentUser = null;
        return;
      }
      const hashedId = await hashSha256(user.id);
      this.currentUser = {
        id: user.id,
        hashedId,
      };
    } catch {
      this.currentUser = user ? { id: user.id, hashedId: user.id } : null;
    }
  }

  public setRelease(release: string): void {
    try {
      this.config.release = release;
      if (this.transport) {
        this.transport.updateConfig({ release });
      }
    } catch {
      // Never crash host app
    }
  }

  public getRelease(): string {
    return this.config.release;
  }

  public setBrowserOverride(override: BrowserOverride | null): void {
    this.browserOverride = override;
  }

  public getBrowserOverride(): BrowserOverride | null {
    return this.browserOverride;
  }

  public async flush(): Promise<void> {
    try {
      if (this.transport) {
        await this.transport.flushQueue();
      }
    } catch {
      // Never crash host app
    }
  }

  public captureException(error: unknown, extraContext?: Record<string, unknown>): string | null {
    try {
      const eventId = this.generateUuid();
      const rawMessage = this.extractErrorMessage(error);
      const rawStack = this.extractErrorStack(error);
      const exceptionType = this.extractExceptionType(error);

      // Scrub PII & sensitive secrets
      const message = scrubText(rawMessage);
      const stack_trace = scrubText(rawStack);

      // Check rate limit and 10s message deduplication
      const check = this.rateLimiter.check(message);
      if (!check.allowed) {
        const droppedPayload: FaultlinePayload = {
          event_id: eventId,
          message,
          stack_trace,
          exception_type: exceptionType,
          url: typeof window !== "undefined" ? window.location.href : "",
          browser: this.detectBrowser(),
          os: this.detectOS(),
          release: this.config.release,
          environment: this.config.environment,
          user_id: this.currentUser?.hashedId || null,
          timestamp: new Date().toISOString(),
          extra: extraContext,
        };
        sdkLogger.logEvent(droppedPayload, "dropped", check.reason);
        return eventId;
      }

      const payload: FaultlinePayload = {
        event_id: eventId,
        message,
        stack_trace,
        exception_type: exceptionType,
        url: typeof window !== "undefined" ? window.location.href : "",
        browser: this.detectBrowser(),
        os: this.detectOS(),
        release: this.config.release,
        environment: this.config.environment,
        user_id: this.currentUser?.hashedId || null,
        timestamp: new Date().toISOString(),
        extra: extraContext,
      };

      if (!this.transport) {
        this.transport = new Transport(this.config);
      }
      this.transport.enqueue(payload);
      return eventId;
    } catch {
      // Never throw and never block the UI
      return null;
    }
  }

  private hookGlobalErrors(): void {
    if (typeof window === "undefined") return;

    // 1. window.onerror
    const prevOnError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      try {
        if (error) {
          this.captureException(error);
        } else {
          this.captureException(new Error(String(message)));
        }
      } catch {
        // Safe
      }
      if (typeof prevOnError === "function") {
        return prevOnError(message, source, lineno, colno, error);
      }
      return false;
    };

    // 2. unhandledrejection
    window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
      try {
        const error = event.reason || new Error("Unhandled Promise Rejection");
        this.captureException(error);
      } catch {
        // Safe
      }
    });
  }

  private detectBrowser(): string {
    if (this.browserOverride?.browser) return this.browserOverride.browser;
    if (typeof navigator === "undefined") return "Chrome";
    const ua = navigator.userAgent;
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Edg")) return "Edge";
    if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
    return "Chrome";
  }

  private detectOS(): string {
    if (this.browserOverride?.os) return this.browserOverride.os;
    if (typeof navigator === "undefined") return "Windows";
    const ua = navigator.userAgent;
    if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
    if (ua.includes("Mac")) return "macOS";
    if (ua.includes("Linux") && !ua.includes("Android")) return "Linux";
    if (ua.includes("Android")) return "Android";
    return "Windows";
  }

  private extractErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message || err.name;
    if (typeof err === "string") return err;
    try {
      return JSON.stringify(err);
    } catch {
      return "Unknown Error";
    }
  }

  private extractErrorStack(err: unknown): string | null {
    if (err instanceof Error && err.stack) {
      return err.stack;
    }
    return null;
  }

  private extractExceptionType(err: unknown): string {
    if (err instanceof Error) {
      return err.name || "Error";
    }
    return "UnhandledException";
  }

  private generateUuid(): string {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      try {
        return crypto.randomUUID();
      } catch {
        // fallback
      }
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

export const Faultline = FaultlineClient.getInstance();

