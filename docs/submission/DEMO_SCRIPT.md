# LifeGrid — demo video shot list

Target: ~4 minutes, recorded against the **live Cloud Run URL**
(`https://life-grid-q5fdvprapa-uc.a.run.app` — confirm this is still
current first: `gcloud run services describe life-grid --region=us-central1
--format="value(status.url)"`), not localhost — that's a hard submission
requirement.

Record **live mode**, not scripted — it's the only mode that's actually
calling Gemini. It costs a small amount of real Vertex AI spend; that's
expected and fine for one take. Do a silent dry run first so you're not
improvising narration while also watching for a specific telemetry event
to click on.

---

**0:00–0:15 — Hook**
Show the browser address bar with the live `.run.app` URL visible. One
line: "This is LifeGrid — a governed multi-agent fleet for the Fortified
Enterprise Fleet track, deployed on Cloud Run, not a local demo."

**0:15–0:40 — The registry**
Click the Agent Registry tab. "Seven agents, each with a declared role and
permission set — this isn't decoration, every one of these permissions is
actually enforced by Zero-Trust before a tool call runs." Hover 1–2 agent
cards.

**0:40–1:30 — Launch a live run**
Switch the mode toggle to **Live**. Enter (or pick) the Denver scenario
prompt with a budget cap. Submit. Narrate over the streaming telemetry as
it arrives:
- Security scan passes ("real prompt-injection scanning, not a canned
  line").
- The four research agents' cards light up together — "these four are
  running concurrently, not one after another — that's a `ParallelAgent`,
  not four sequential calls."
- Point at one real tool call log line (e.g. a flight or hotel search)
  scrolling past.

**1:30–2:10 — The approval gate**
When FinanceAgent triggers an approval card (a real spend over $100 or
any travel booking), pause here. "Policy Engine flagged this
automatically — over $100, so it stops and asks me, not the model."
Click Approve. Show the run resuming and completing to the final plan.

**2:10–2:35 — Memory Bank, and why it's real**
Switch to the Memory Bank tab. Point at an existing item. "This is backed
by real Firestore when deployed — not a variable that resets on the next
redeploy." (Optional, if time allows: mention the `K_SERVICE`
auto-detection in one clause — otherwise skip, it's a nice-to-know not a
must-show.)

**2:35–3:00 — Real Google Calendar (only if OAuth testing is fixed by
recording time — see below)**
Click "Connect Google Calendar," complete the real Google consent screen,
then either launch a new run or point at a completed one where
CalendarAgent's result carries real event data. "This one tool is
genuinely live — read-only, so it can never write to my calendar, but it
is pulling my actual events."
**If OAuth isn't test-user-approved yet:** skip this beat entirely rather
than showing a broken sign-in — cut straight to 3:00.

**3:00–3:35 — Architecture, fast**
Cut to the architecture diagram (the artifact built for this submission,
or a screenshot of it). Trace the path with your cursor in ~20 seconds:
browser → Cloud Run API routes → ADK Runner/orchestrator → the three
governance gateways → Vertex AI / Firestore / Cloud Trace. Don't read
every label — just show the shape of it.

**3:35–4:00 — Honest close**
One line on what's simulated: "Flights, hotels, activities, and gear are
realistic simulated data today — swapping any one for a real API is an
isolated change, and it's what's next." Then: repo link on screen, thank
you.

---

## If you're short on time, cut in this order

1. Drop the architecture-diagram cutaway (3:00–3:35) — narrate the shape
   verbally instead while the run is still visibly working in the
   background.
2. Drop the Google Calendar beat entirely (it's genuinely optional —
   everything else in this script demonstrates something already fully
   verified).
3. Don't cut the approval-gate beat or the honest simulated/real close —
   those two map directly to "Architectural Discipline" and "Demo &
   Production Readiness," the two judging criteria worth 30% each.
