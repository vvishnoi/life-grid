# LifeGrid — demo video shot list

**Goal:** show a real run, a real stop, and a real approval — in plain
English, no jargon read off the screen. Target: ~4 minutes.

Record against the **live Cloud Run URL**
(`https://life-grid-q5fdvprapa-uc.a.run.app` — confirm this is still
current first: `gcloud run services describe life-grid --region=us-central1
--format="value(status.url)"`), not localhost — that's a hard submission
requirement.

Record **Live mode**, not the scripted demo — it's the only mode that's
actually calling Gemini. It costs a small amount of real Vertex AI spend;
that's expected and fine for one take. Do a silent dry run first so
you're not improvising narration while also watching for a specific
moment to click on.

**One thing to say in plain words, every time you're tempted to read a
label out loud:** don't say "SequentialAgent" or "ParallelAgent" on
camera — say "runs in order" and "runs at the same time." Save the exact
terms for the architecture cutaway, where they're written on screen
anyway.

---

**0:00–0:15 — Hook**
Show the browser address bar with the live `.run.app` URL visible. One
line: "This is LifeGrid — a team of AI agents that plans real tasks for
you, and knows when to stop and ask before it spends your money."

**0:15–0:35 — The team**
Click the **Agents** tab. Cards are expanded by default now — point at
one open card's permission list. "Seven agents, each with one job and a
fixed list of what it's allowed to touch — anything outside that list is
blocked automatically, not just discouraged."

**0:35–1:20 — Launch a live run**
Switch the mode toggle to **Live**. Enter (or pick) the Denver family
trip example, with a budget cap. Submit. Narrate over the streaming
activity feed as it arrives:
- Security scan passes — "this actually scans the text, it's not a
  scripted line."
- The four research agent cards light up together — "these four are
  running at the same time, not one after another."
- Point at one real tool-call line (e.g. a flight or hotel search)
  scrolling past.

**1:20–1:55 — The security stop (the strongest moment in this demo)**
Start a **second** run using the "A message trying to trick the AI"
example card — a request with a hidden instruction buried in a URL.
Narrate as it happens: "Watch — the security scanner catches this and
blocks it... and now nothing else runs. No research, no budget check,
no booking. The whole pipeline stops right here, for real — not just a
warning while the rest of the agents keep going anyway." Let the blocked
message sit on screen for a beat before moving on.

**1:55–2:35 — The approval gate**
Back on the successful run (or a fresh one), when FinanceAgent triggers
an approval card — a real spend over $100, or any travel booking — pause
here. "This is a hard rule, checked the same way every time: over $100,
or any booking, and it stops to ask me, not the model." Click Approve.
Show the run finishing with the final plan.

**2:35–2:55 — Memory Bank, and why it's real**
Switch to the **Memory** tab. Point at an existing item. "This is backed
by a real Google Cloud database once deployed — not something that
resets the next time the app restarts."

**2:55–3:15 — Real Google Calendar (only if OAuth testing is approved by
recording time — see below)**
Open **Settings**, click "Connect Google Calendar," complete the real
Google consent screen, then either launch a new run or point at a
completed one where the Calendar Agent's result carries real event data.
"This one is genuinely live — read-only, so it can never write to my
calendar, but it is reading my actual schedule."
**If OAuth isn't test-user-approved yet:** skip this beat entirely rather
than showing a broken sign-in.

**3:15–3:45 — Architecture, fast**
Cut to the architecture diagram (the artifact built for this
submission, or a screenshot of it). Trace the pipeline diagram with your
cursor in ~20 seconds: security check first, then four agents at once,
then budget check, then the final write-up — and point at the new red
"STOP" branch you just showed live a minute ago. Don't read every label —
just show the shape of it.

**3:45–4:00 — Honest close**
One line on what's simulated: "Flights, hotels, activities, and gear are
realistic sample data today — swapping any one for a real booking API is
a contained change, and it's what's next." Then: repo link on screen,
thank you.

---

## If you're short on time, cut in this order

1. Drop the architecture-diagram cutaway (3:15–3:45) — narrate the shape
   verbally instead while the run is still visibly working in the
   background.
2. Drop the Google Calendar beat entirely (it's genuinely optional —
   everything else in this script demonstrates something already fully
   verified).
3. Don't cut the security-stop beat, the approval-gate beat, or the
   honest simulated/real close. The security stop is the newest and most
   convincing thing this system does — it's the one moment that proves
   "governed," not just "multi-agent."
