import { TelemetryLog } from '@lifegrid/agent/client';

type OrchestrationFrame =
  | { kind: 'session'; sessionId: string }
  | { kind: 'log'; log: TelemetryLog }
  | { kind: 'done' }
  | { kind: 'error'; message: string };

/**
 * Reads a text/event-stream Response from /api/orchestrate or /api/approvals
 * (live mode) and dispatches each frame to the given handlers as it arrives.
 */
export async function consumeOrchestrationStream(
  response: Response,
  handlers: {
    onSessionId?: (sessionId: string) => void;
    onLog: (log: TelemetryLog) => void;
    onError?: (message: string) => void;
  }
): Promise<void> {
  if (!response.body) return;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split('\n\n');
    buffer = frames.pop() || '';

    for (const frame of frames) {
      const line = frame.trim();
      if (!line.startsWith('data:')) continue;

      const jsonStr = line.slice('data:'.length).trim();
      if (!jsonStr) continue;

      const parsed: OrchestrationFrame = JSON.parse(jsonStr);
      switch (parsed.kind) {
        case 'session':
          handlers.onSessionId?.(parsed.sessionId);
          break;
        case 'log':
          handlers.onLog(parsed.log);
          break;
        case 'error':
          handlers.onError?.(parsed.message);
          break;
        case 'done':
          break;
      }
    }
  }
}
