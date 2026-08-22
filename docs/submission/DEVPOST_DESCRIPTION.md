# LifeGrid — Devpost submission text

Draft for the Devpost "tell us about your project" fields. Every claim
below is something verified live during development (see
`docs/IMPLEMENTATION_PLAN.md` §3.4 for the receipts) — nothing here is
aspirational.

---

## Inspiration

The Fortified Enterprise Fleet track asks for "a scalable network of
institutional agents that hook into official enterprise infrastructure" —
multiple specialized agents, coordinated by a runtime, governed by
identity and policy controls, inspected for security threats, and
observable end to end. Most demos of that idea use an enterprise-toy
domain (support tickets, internal docs). We picked a household/family
assistant instead, because planning a family trip already contains every
property the track actually wants to see: multi-step autonomous research,
real spend decisions that need a human's sign-off, and personalization
that has to persist across sessions — without needing an invented
enterprise scenario to manufacture those requirements.

## What it does

You give LifeGrid one natural-language goal and a budget cap — "Plan a
5-day family trip to Denver under $4,000, daughter has a nut allergy" —
and it decomposes that into a fixed pipeline of seven agents:

1. **SecurityScanner** inspects your input for prompt injection before
   anything else runs.
2. **Travel, Family, Calendar, and Shopping agents run concurrently**
   (not serially), each reading your Memory Bank for standing preferences
   — "dislikes hotels far from downtown," "no flights before 7:30am."
3. **FinanceAgent** audits the combined cost against your budget cap and
   pauses for your explicit approval on anything over $100, or any travel
   booking regardless of amount.
4. **PlanSynthesizer** compiles everything into one final itinerary.

Every step streams to the UI live as it happens — not a spinner and then
a dump — and every tool call is checked against that agent's declared
permissions before it's allowed to run.

## How we built it

**Stack:** Next.js 16 (App Router) for the UI and API routes, Google ADK
(`@google/adk`) for real multi-agent orchestration — a `SequentialAgent`
wrapping a `ParallelAgent`, deliberately not a dynamic router-agent
pattern, so the security gate is structurally unskippable rather than
merely instructed — Gemini 3.5-flash-lite via Vertex AI, and Cloud Run for
hosting. The whole thing is an npm workspaces monorepo: `@lifegrid/agent`
is the entire agent pipeline with zero dependency on Next.js (usable
standalone from any frontend), and `@lifegrid/web` is just one UI for it.

**Real, not simulated:** the Gemini reasoning itself; the full parallel
research phase (confirmed via near-identical timestamps in traced calls);
the approval pause → batched resume → completion cycle; prompt-injection
scanning, verified against an actual attack payload; Zero-Trust permission
checks on every tool call, fail-closed by default; the Memory Bank, backed
by real Firestore when deployed (auto-selected via Cloud Run's own
`K_SERVICE`, plain in-memory locally); OpenTelemetry GenAI spans exported
to real Cloud Trace; and — the one real external data source — Google
Calendar, via OAuth (read-only scope, so a live demo can never write to a
stranger's real calendar).

**Intentionally simulated:** flight, hotel, activity, and gear search
return realistic generated data, not real external API calls — each
response says so explicitly. Swapping any one for a real API is a
bounded, isolated change (one `FunctionTool` per data source); we
prioritized depth on governance and observability over breadth of live
data sources given the time available.

**Data sources:** Vertex AI (Gemini), Firestore (Memory Bank), Google
Calendar API (real availability, read-only), Cloud Trace (OTel spans);
flights/hotels/activities/gear are simulated, clearly labeled as such in
every tool response.

## Challenges we ran into

A few real bugs, found only by actually running the system, not by
review:

- ADK's `SequentialAgent` doesn't stop on its own once a nested agent
  pauses for approval — it happily proceeds to the next sub-agent. Fixed
  by detecting the pause via `event.actions.requestedToolConfirmations`
  specifically (a naive check on `longRunningToolIds` false-positives on
  the *initial* tool-call event, before the tool has even run).
- Gemini's function-calling protocol requires every function call from
  one model turn to get a response before the next turn can proceed — so
  resolving simultaneous approval requests one at a time is a hard API
  error, not a UX nicety. Fixed with batched approval resolution.
- Restructuring into a monorepo (so the agent ships independently of the
  UI) broke the Docker build twice in ways `next build` alone never
  caught: a `postinstall` script running before source existed in
  Docker's dependency-caching layer, and a `COPY` of per-workspace
  `node_modules` directories that npm's hoisting means never exist.
- Auth.js reported its own OAuth callback URL as `https://0.0.0.0:8080/…`
  — Cloud Run's internal bind address — instead of the real public URL,
  until we pinned `AUTH_URL` explicitly; `trustHost: true` alone wasn't
  enough.
- Turbopack's build-time file tracer can't see a runtime
  `fs.readFileSync()` call, so each agent's `instructions.md` (its system
  prompt, kept in its own file for readability) silently vanished from
  the production build until we told the tracer about it explicitly.

## Accomplishments we're proud of

Every governance claim on the diagram is backed by something we actually
ran, not just wrote: a real injection payload getting blocked, a real
$100+ spend correctly pausing for approval, a real unauthorized tool call
getting denied by Zero-Trust with zero false positives across a full live
run, and a real Memory Bank entry surviving a redeploy because it's
sitting in Firestore, not a variable that resets when the container does.

## What we learned

That "wire it up" and "verified" are different claims, and a project this
governance-heavy earns almost nothing from the first without the second —
several of the bugs above only exist because a design was correct on
paper and wrong the first time it actually ran.

## What's next

Real flight/hotel/activity APIs behind the same `FunctionTool` seam that
already isolates them; tool-poisoning and PII-leak detection to round out
Model Armor (prompt injection is the only guardrail live today); a
Cloud-Tasks/Pub-Sub-backed runtime so an agent run outlives one SSE HTTP
connection; and closing the one known ADK resumability gap where
`PlanSynthesizer` doesn't re-run after an approval resume.
