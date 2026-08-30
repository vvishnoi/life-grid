import type { Event } from '@google/adk';
import { TelemetryLog } from './types.js';
import { mapAdkEventToTelemetryLogs } from './event-mapper.js';

export type OrchestrationFrame =
  | { kind: 'session'; sessionId: string }
  | { kind: 'log'; log: TelemetryLog }
  | { kind: 'done' }
  | { kind: 'error'; message: string };

// Shared SSE envelope (session frame -> caller-supplied work -> done, with
// errors caught and sent as an error frame) — both streamAdkEvents and
// streamFinalPlan are "one shape of work" wrapped in the same framing, so
// the client's frame parser doesn't need to care which produced a response.
function createSseStream(sessionId: string, run: (send: (frame: OrchestrationFrame) => void) => Promise<void>): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (frame: OrchestrationFrame) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(frame)}\n\n`));
      };

      send({ kind: 'session', sessionId });

      try {
        await run(send);
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

/**
 * Streams an ADK event generator to the client as Server-Sent Events, one
 * `data:` frame per TelemetryLog. Used by /api/orchestrate for fresh runs.
 */
export function streamAdkEvents(
  events: AsyncGenerator<Event, void, undefined>,
  sessionId: string,
  isResume = false,
  approvalThreshold?: number
): Response {
  return createSseStream(sessionId, async (send) => {
    for await (const event of events) {
      if (process.env.ADK_DEBUG) {
        console.log('[ADK_DEBUG] event', JSON.stringify({ author: event.author, actions: event.actions, parts: event.content?.parts }));
      }
      for (const log of mapAdkEventToTelemetryLogs(event, sessionId, isResume, approvalThreshold)) {
        send({ kind: 'log', log });
      }
      // A pending human-confirmation is the caller's cue to stop pulling
      // more events (SequentialAgent in this ADK version does NOT stop on
      // its own once a nested agent pauses — it happily proceeds to the
      // next sub-agent regardless). Note this is NOT the same as
      // `event.longRunningToolIds` being non-empty — that flag is also set
      // on the *initial* tool-call-request event for any
      // LongRunningFunctionTool, before it's even run and decided whether
      // it actually needs to pause. `actions.requestedToolConfirmations` is
      // only populated on the real pause event (see functions.js'
      // generateRequestConfirmationEvent).
      if (event.actions?.requestedToolConfirmations && Object.keys(event.actions.requestedToolConfirmations).length > 0) {
        break;
      }
    }
  });
}

/**
 * Streams a single synthesized final-plan message in the same SSE framing
 * as streamAdkEvents — used by /api/approvals in live mode instead of
 * resuming through ADK. See finalize-plan.ts for why.
 */
export function streamFinalPlan(
  sessionId: string,
  buildPlan: () => Promise<string>,
  agent: { agentId: string; agentName: string } = { agentId: 'finance-agent', agentName: 'Finance & Budget Agent' }
): Response {
  return createSseStream(sessionId, async (send) => {
    const message = await buildPlan();
    const log: TelemetryLog = {
      id: `final-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      agentId: agent.agentId,
      agentName: agent.agentName,
      type: 'execution_success',
      message,
    };
    send({ kind: 'log', log });
  });
}
