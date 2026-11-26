import { Faultline } from "../faultline";
import { ALL_BUGS } from "./index";

export interface InjectedErrorResult {
  bugName: string;
  pathName: string;
  message: string;
  exceptionType: string;
  eventId: string | null;
}

/**
 * 1. Causes an actual runtime exception in the demo app.
 * 2. The Faultline SDK captures it.
 * 3. The SDK immediately flushes and sends it to the FastAPI backend.
 */
export function injectDemoException(preferredBugId?: string): InjectedErrorResult {
  let targetBug = ALL_BUGS[0];
  if (preferredBugId) {
    const found = ALL_BUGS.find((b) => b.id === preferredBugId);
    if (found) targetBug = found;
  } else {
    targetBug = ALL_BUGS[Math.floor(Math.random() * ALL_BUGS.length)];
  }

  const path = targetBug.paths[Math.floor(Math.random() * targetBug.paths.length)];

  let thrownError: Error = new Error("Unknown error");
  let eventId: string | null = null;

  try {
    // 1. An actual exception occurs in the demo app!
    path.trigger();
  } catch (err: any) {
    thrownError = err instanceof Error ? err : new Error(String(err));
    // 2. Captured by Faultline SDK
    eventId = Faultline.captureException(thrownError, {
      injectedVia: "Inject Error Action",
      bugName: targetBug.name,
      pathName: path.name,
    });
  }

  // 3. Immediately flush the queue so it posts to FastAPI backend without waiting for 3s batch window
  Faultline.flush().catch(() => {});

  return {
    bugName: targetBug.name,
    pathName: path.name,
    message: thrownError.message,
    exceptionType: thrownError.name || "Error",
    eventId,
  };
}

/**
 * Injects 5 consecutive errors of the same semantic root cause to exceed
 * the recent 15-minute spike threshold (recent_count >= 5) and trigger spike detection.
 */
export async function injectSpikeErrors(): Promise<void> {
  const bug = ALL_BUGS.find((b) => b.id === "bug-2") || ALL_BUGS[0];
  for (let i = 0; i < 5; i++) {
    const path = bug.paths[i % bug.paths.length];
    try {
      path.trigger();
    } catch (err) {
      Faultline.captureException(err, { source: "Spike Ingestion" });
    }
    await Faultline.flush();
    await new Promise((r) => setTimeout(r, 120));
  }
}

