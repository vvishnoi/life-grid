# Cost Optimization — Hackathon Deployment Checklist

LifeGrid's Live Agents mode makes real Vertex AI (Gemini) calls, so it costs
real money once deployed. This is the checklist to keep spend near-zero
between demos and bounded during them. Status notes reflect what's already
applied in this repo vs. what's a manual step only you can do (billing/IAM
actions aren't something an agent should perform unattended).

## 1. Use Gemini Flash first
Reserve Pro-tier models strictly for complex final reasoning; default
everything else to Flash.
**Status: applied.** `src/lib/adk/agents.ts` hardcodes
`gemini-2.5-flash` for all seven agents (security scanner, travel, family,
calendar, shopping, finance, synthesizer). Don't swap any of these to a Pro
model without a specific reason — if one agent's output quality genuinely
needs it, upgrade only that one agent, not the whole pipeline.

## 2. Scale to zero
Keep `min-instances` at 0 so Cloud Run doesn't bill for idle time.
**Status: applied.** `cloudbuild.yaml`'s deploy step sets
`--min-instances=0` explicitly (this is also Cloud Run's default, but it's
set explicitly here so it can't be silently changed later without showing
up in a diff).

## 3. Start small, cap max instances
Provision minimal CPU/RAM and set a hard ceiling on concurrent instances so
a traffic spike (or a bug causing retry storms) can't fan out unbounded
billing.
**Status: applied.** `cloudbuild.yaml` sets `--memory=512Mi --cpu=1
--max-instances=2`. Raise the cap only if you're actually expecting
concurrent demo traffic beyond a couple of judges hitting it at once.

## 4. Use serverless vector search
Avoid dedicated, always-on database clusters for embeddings/RAG.
**Status: not applicable.** This app has no vector search or RAG
component. If one gets added later, prefer a serverless/on-demand option
(e.g. Vertex AI Vector Search in its serverless tier) over a self-managed
always-on cluster.

## 5. Keep storage footprints light
Store only essential state, compress long-term memories, clean up temp
artifacts.
**Status: already minimal.** The "Memory Bank" (`src/lib/memory/firestore.ts`)
is an in-process array, not a live Firestore connection — zero storage
cost as shipped. ADK session state (`src/lib/adk/runner.ts`) uses
`InMemorySessionService` — also zero storage cost, but also means sessions
vanish on every restart/redeploy (acceptable for a demo). If either of
these gets swapped for real Firestore/`DatabaseSessionService` later, add
TTL-based cleanup rather than letting sessions/memories accumulate forever.

## 6. Set budget alerts
Turn on billing alerts so you get an email before crossing your target
spend. **This is a manual step — run it yourself, not something to
automate unattended:**
```bash
gcloud billing budgets create \
  --billing-account=<YOUR_BILLING_ACCOUNT_ID> \
  --display-name="LifeGrid Hackathon Budget" \
  --budget-amount=25USD \
  --threshold-rule=percent=0.5 \
  --threshold-rule=percent=0.9 \
  --threshold-rule=percent=1.0
```
Find your billing account ID with `gcloud billing accounts list`.

## 7. Secure your endpoints
Protect public Cloud Run URLs so random web traffic can't drain credits.
**Status: partially applied.** `cloudbuild.yaml` still deploys with
`--allow-unauthenticated` — needed so judges/demo viewers can load the app
without a Google login prompt. To avoid leaving the *expensive* path wide
open, `/api/orchestrate` and `/api/approvals` reject `mode: 'live'`
requests unless an `x-demo-key` header matches a `DEMO_API_KEY` env var (see
`.env.local.example`). If `DEMO_API_KEY` is unset, the gate is a no-op —
set it before deploying publicly, not just locally. Scripted mode is never
gated (it's free — no LLM calls).
**Honest caveat:** the frontend sends the key via `NEXT_PUBLIC_DEMO_API_KEY`,
which Next.js bundles into client-side JS — anyone can read it from
DevTools. This stops casual bots/scrapers from hitting the paid endpoint
directly, not a determined person reading your page source. For real
protection, put Cloud Run behind IAP or require `--no-allow-unauthenticated`
with a small authenticated proxy in front — out of scope for a hackathon
demo, but don't mistake this gate for that.

## 8. Turn it off after the demo
Record proof the agent worked on GCP (screen recording / screenshots of a
live run), then tear down. **Status: applied** — `scripts/gcp-down.sh`
replaces the manual `gcloud` commands:
```bash
./scripts/gcp-down.sh          # deletes the Cloud Run service + Artifact
                                # Registry images, asks for confirmation first
./scripts/gcp-down.sh --yes    # same, no prompt
./scripts/gcp-down.sh --full   # also disables Vertex AI/Cloud Trace APIs and
                                # deletes the runtime service account
```
Bring it back with `./scripts/gcp-up.sh` (idempotent — safe to re-run,
only recreates what's actually missing). Locally, unset or delete
`.env.local` if you want live mode off by default again (scripted mode
remains fully functional either way).
