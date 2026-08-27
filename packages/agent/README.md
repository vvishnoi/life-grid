# @lifegrid/agent

The LifeGrid multi-agent pipeline — real Google ADK agents, governance
gateways, memory, and the ADK Runner — with **zero dependency on Next.js or
any particular UI**. This is the whole "Fortified Enterprise Fleet" system
from `docs/IMPLEMENTATION_PLAN.md`; `apps/web` is just one frontend for it.

If you want to build your own UI (a CLI, a Slack bot, a different web
framework) against the same agent pipeline, this is the only package you
need.

## Structure

```
src/
  agents/
    security/      instructions.md + agent.ts   (runs 1st: prompt-injection scan)
    travel/         "                            (parallel research phase)
    family/         "
    calendar/       "
    shopping/       "
    finance/        instructions.md + agent.ts   (runs 3rd: budget + approvals)
    plan-writer/    instructions.md + agent.ts   (runs 4th: final plan)
    index.ts        composes them into the fixed Sequential/Parallel pipeline
  tools.ts          FunctionTool/LongRunningFunctionTool defs the agents call
  gateway/          Model Armor, Policy Engine, Zero-Trust — the governance layer
  memory/           cross-session Memory Bank
  registry.ts       static Agent Registry (identity/permissions directory)
  runner.ts         ADK Runner + session service singleton
  event-mapper.ts   raw ADK Event -> TelemetryLog/ApprovalItem
  stream-response.ts  SSE-frame builder for streaming a run
  scripted-demo.ts  canned zero-cost demo mode (no LLM calls)
  index.ts          public API — import everything from here
```

Each agent's system prompt lives in its own `instructions.md`, not inline in
TypeScript — read and edit it without touching code. The agent *wiring*
(model, tools, `outputKey`, and how agents compose into Sequential/Parallel
phases) stays in `agent.ts`/`agents/index.ts`, since ADK requires real
`LlmAgent` objects — there's currently no declarative YAML/JSON agent-config
loader in `@google/adk` to move that part out of code too.

## Using it standalone (no Next.js)

```ts
import { lifeGridRunner, sessionService, LIFEGRID_APP_NAME, LIFEGRID_USER_ID } from '@lifegrid/agent';

const sessionId = crypto.randomUUID();
await sessionService.createSession({
  appName: LIFEGRID_APP_NAME,
  userId: LIFEGRID_USER_ID,
  sessionId,
  state: { budgetCap: 4000 },
});

for await (const event of lifeGridRunner.runAsync({
  userId: LIFEGRID_USER_ID,
  sessionId,
  newMessage: { role: 'user', parts: [{ text: 'Plan a 5-day family trip to Denver under $4,000.' }] },
})) {
  // Drive your own UI from raw ADK events, or use the helpers below to get
  // the same TelemetryLog/ApprovalItem shapes apps/web uses:
  //   import { mapAdkEventToTelemetryLogs } from '@lifegrid/agent';
  console.log(event);
}
```

Requires the same env vars as `apps/web`'s live mode (`GOOGLE_GENAI_USE_VERTEXAI`,
`GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION=global`) — see the root
`.env.local.example`. With none of those set, `scriptedDemoEngine` and
`PREDEFINED_SCENARIOS` still work with zero credentials and zero cost.

## Build

```
npm run build -w packages/agent
```

Compiles `src/` to `dist/` (ESM + `.d.ts`) and copies each agent's
`instructions.md` alongside its compiled `agent.js`.
