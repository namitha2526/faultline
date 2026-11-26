/**
 * Rate Limiter and Message Deduplicator:
 * - Max 30 events per minute
 * - Ignore identical error messages occurring within 10 seconds
 */
export class RateLimiter {
  private maxPerMinute = 30;
  private dedupeWindowMs = 10000; // 10 seconds

  private eventTimestamps: number[] = [];
  private messageLastSeen: Map<string, number> = new Map();

  public check(message: string): { allowed: boolean; reason?: "RATE_LIMIT_EXCEEDED" | "DEDUPLICATED_10S" } {
    try {
      const now = Date.now();

      // 1. Check 10-second deduplication
      const normalizedMsg = message.trim();
      const lastSeen = this.messageLastSeen.get(normalizedMsg);
      if (lastSeen && now - lastSeen < this.dedupeWindowMs) {
        return { allowed: false, reason: "DEDUPLICATED_10S" };
      }

      // 2. Check 30 events per minute rolling window
      this.eventTimestamps = this.eventTimestamps.filter((ts) => now - ts < 60000);
      if (this.eventTimestamps.length >= this.maxPerMinute) {
        return { allowed: false, reason: "RATE_LIMIT_EXCEEDED" };
      }

      // Allow and record
      this.messageLastSeen.set(normalizedMsg, now);
      this.eventTimestamps.push(now);

      // Clean up old entries in messageLastSeen periodically
      if (this.messageLastSeen.size > 200) {
        for (const [msg, ts] of this.messageLastSeen.entries()) {
          if (now - ts > this.dedupeWindowMs * 2) {
            this.messageLastSeen.delete(msg);
          }
        }
      }

      return { allowed: true };
    } catch {
      return { allowed: true };
    }
  }

  public reset(): void {
    this.eventTimestamps = [];
    this.messageLastSeen.clear();
  }
}

