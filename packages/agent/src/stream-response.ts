import type { Event } from '@google/adk';
import { TelemetryLog } from './types.js';
import { mapAdkEventToTelemetryLogs } from './event-mapper.js';

export type OrchestrationFrame =
  | { kind: 'session'; sessionId: string }
  | { kind: 'log'; log: TelemetryLog }
  | { kind: 'done' }
  | { kind: 'error'; message: string };

/**
 * Streams an ADK event generator to the client as Server-Sent Events, one
 * `data:` frame per TelemetryLog. Shared by /api/orchestrate (fresh runs)
 * and /api/approvals (resumed runs) so both produce identical framing.
 */
export function streamAdkEvents(
  events: AsyncGenerator<Event, void, undefined>,
  sessionId: string,
  isResume = false
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (frame: OrchestrationFrame) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(frame)}\n\n`));
      };

      send({ kind: 'session', sessionId });

      try {
        for await (const event of events) {
          if (process.env.ADK_DEBUG) {
            console.log('[ADK_DEBUG] event', JSON.stringify({ author: event.author, actions: event.actions, parts: event.content?.parts }));
          }
          for (const log of mapAdkEventToTelemetryLogs(event, sessionId, isResume)) {
            send({ kind: 'log', log });
          }
          // A pending human-confirmation is the caller's cue to stop
          // pulling more events (SequentialAgent in this ADK version does
          // NOT stop on its own once a nested agent pauses — it happily
          // proceeds to the next sub-agent regardless). Note this is NOT
          // the same as `event.longRunningToolIds` being non-empty — that
          // flag is also set on the *initial* tool-call-request event for
          // any LongRunningFunctionTool, before it's even run and decided
          // whether it actually needs to pause. `actions.requestedToolConfirmations`
          // is only populated on the real pause event (see functions.js'
          // generateRequestConfirmationEvent).
          if (event.actions?.requestedToolConfirmations && Object.keys(event.actions.requestedToolConfirmations).length > 0) {
            break;
          }
        }
        send({ kind: 'done' });
      } catch (error: unknown) {
        send({ kind: 'error', message: error instanceof Error ? error.message : 'Unknown orchestration error' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
