import { SdkEventLog, SdkEventStatus, FaultlinePayload } from "./types";

type LogListener = (logs: SdkEventLog[]) => void;

class SdkLogger {
  private logs: SdkEventLog[] = [];
  private listeners: Set<LogListener> = new Set();
  private maxLogs = 100;

  public capturedCount = 0;
  public sentCount = 0;
  public failedCount = 0;
  public droppedCount = 0;

  public logEvent(
    payload: FaultlinePayload,
    status: SdkEventStatus,
    reason?: string,
    retryCount = 0
  ): SdkEventLog {
    if (status === "queued") this.capturedCount++;
    if (status === "sent") this.sentCount++;
    if (status === "failed") this.failedCount++;
    if (status === "dropped") this.droppedCount++;

    const logEntry: SdkEventLog = {
      id: "log_" + Math.random().toString(36).slice(2, 9),
      event_id: payload.event_id,
      timestamp: new Date().toLocaleTimeString(),
      message: payload.message,
      exception_type: payload.exception_type || "Error",
      status,
      retryCount,
      reason,
      payload,
    };

    // If already exists in logs (e.g. status transition from queued to sent/failed), update it
    const existingIndex = this.logs.findIndex((l) => l.event_id === payload.event_id);
    if (existingIndex >= 0) {
      this.logs[existingIndex] = {
        ...this.logs[existingIndex],
        status,
        retryCount,
        reason: reason || this.logs[existingIndex].reason,
      };
    } else {
      this.logs.unshift(logEntry);
      if (this.logs.length > this.maxLogs) {
        this.logs.pop();
      }
    }

    this.notify();
    return logEntry;
  }

  public updateStatus(
    eventId: string,
    status: SdkEventStatus,
    reason?: string,
    retryCount?: number
  ): void {
    const entry = this.logs.find((l) => l.event_id === eventId);
    if (entry) {
      if (entry.status !== status) {
        if (status === "sent") this.sentCount++;
        if (status === "failed") this.failedCount++;
        if (status === "dropped") this.droppedCount++;
      }
      entry.status = status;
      if (reason) entry.reason = reason;
      if (typeof retryCount === "number") entry.retryCount = retryCount;
      this.notify();
    }
  }

  public getLogs(): SdkEventLog[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
    this.capturedCount = 0;
    this.sentCount = 0;
    this.failedCount = 0;
    this.droppedCount = 0;
    this.notify();
  }

  public subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    listener(this.getLogs());
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const current = this.getLogs();
    this.listeners.forEach((listener) => {
      try {
        listener(current);
      } catch {
        // Safe notification
      }
    });
  }
}

export const sdkLogger = new SdkLogger();

