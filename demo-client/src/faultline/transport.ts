import { FaultlineConfig, FaultlinePayload } from "./types";
import { sdkLogger } from "./logger";

interface QueueItem {
  payload: FaultlinePayload;
  retryCount: number;
}

export class Transport {
  private queue: QueueItem[] = [];
  private flushTimer: number | null = null;
  private isFlushing = false;
  private maxRetries = 3;
  private flushIntervalMs = 3000; // 3 seconds batching

  constructor(private config: FaultlineConfig) {
    this.startBatchTimer();
    this.registerUnloadHandlers();
  }

  public updateConfig(config: Partial<FaultlineConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public enqueue(payload: FaultlinePayload): void {
    try {
      this.queue.push({ payload, retryCount: 0 });
      sdkLogger.logEvent(payload, "queued");
    } catch {
      // Never throw
    }
  }

  private startBatchTimer(): void {
    if (typeof window !== "undefined") {
      this.flushTimer = window.setInterval(() => {
        this.flushQueue().catch(() => {});
      }, this.flushIntervalMs);
    }
  }

  private registerUnloadHandlers(): void {
    if (typeof window === "undefined") return;

    const handleUnload = () => {
      this.flushImmediatelyBeacon();
    };

    window.addEventListener("pagehide", handleUnload);
    window.addEventListener("beforeunload", handleUnload);
  }

  public async flushQueue(): Promise<void> {
    if (this.isFlushing || this.queue.length === 0) return;
    this.isFlushing = true;

    const batch = [...this.queue];
    this.queue = [];

    for (const item of batch) {
      await this.sendSingleEventWithRetry(item);
    }

    this.isFlushing = false;
  }

  private async sendSingleEventWithRetry(item: QueueItem): Promise<void> {
    const { payload } = item;
    const url = `${this.config.dsn.replace(/\/+$/, "")}/api/errors`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.config.apiKey) {
      headers["X-API-Key"] = this.config.apiKey;
    }

    const body = JSON.stringify({
      event_id: payload.event_id,
      message: payload.message,
      stack_trace: payload.stack_trace,
      exception_type: payload.exception_type,
      browser: payload.browser,
      os: payload.os,
      url: payload.url,
      user_id: payload.user_id,
      release: payload.release,
      environment: payload.environment,
      timestamp: payload.timestamp,
    });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      sdkLogger.updateStatus(payload.event_id, "sent");
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);

      if (item.retryCount < this.maxRetries) {
        item.retryCount += 1;
        const delay = Math.pow(2, item.retryCount) * 1000; // 2s, 4s, 8s backoff
        sdkLogger.updateStatus(
          payload.event_id,
          "queued",
          `Retry #${item.retryCount} in ${delay / 1000}s (${errMsg})`,
          item.retryCount
        );

        setTimeout(() => {
          this.queue.push(item);
        }, delay);
      } else {
        // Exceeded retries: mark as failed / drop silently
        sdkLogger.updateStatus(
          payload.event_id,
          "failed",
          `Dropped after ${this.maxRetries} retries: ${errMsg}`,
          item.retryCount
        );
      }
    }
  }

  private flushImmediatelyBeacon(): void {
    try {
      if (this.queue.length === 0) return;
      const baseUrl = this.config.dsn.replace(/\/+$/, "");
      const apiKeyParam = this.config.apiKey ? `?api_key=${encodeURIComponent(this.config.apiKey)}` : "";
      const url = `${baseUrl}/api/errors${apiKeyParam}`;
      const batch = [...this.queue];
      this.queue = [];

      for (const item of batch) {
        const body = JSON.stringify({
          event_id: item.payload.event_id,
          message: item.payload.message,
          stack_trace: item.payload.stack_trace,
          exception_type: item.payload.exception_type,
          browser: item.payload.browser,
          os: item.payload.os,
          url: item.payload.url,
          user_id: item.payload.user_id,
          release: item.payload.release,
          environment: item.payload.environment,
          timestamp: item.payload.timestamp,
        });

        let sent = false;
        if (typeof navigator !== "undefined" && navigator.sendBeacon) {
          const blob = new Blob([body], { type: "application/json" });
          sent = navigator.sendBeacon(url, blob);
        }

        if (!sent && typeof fetch !== "undefined") {
          const headers: Record<string, string> = { "Content-Type": "application/json" };
          if (this.config.apiKey) headers["X-API-Key"] = this.config.apiKey;
          fetch(url, {
            method: "POST",
            headers,
            body,
            keepalive: true,
          }).catch(() => {});
        }
      }
    } catch {
      // Never throw on unload
    }
  }

  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }
}

