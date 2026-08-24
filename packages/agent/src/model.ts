// ─────────────────────────────────────────────────────
// MODEL CONFIGURATION
// ─────────────────────────────────────────────────────
// Kept as a plain model name (not an eagerly-constructed `Gemini` instance)
// so importing this module never throws when GCP credentials aren't
// configured — scripted mode must still build/run without them. Vertex AI
// is selected purely via env vars, read lazily on first real model call:
//   GOOGLE_GENAI_USE_VERTEXAI=true
//   GOOGLE_CLOUD_PROJECT=<project>
//   GOOGLE_CLOUD_LOCATION=global   <- NOT us-central1, see note below
//
// Hackathon requirement is Gemini 3.5+ (allthingsagentichackathon.devpost.com).
// gemini-3.5-flash-lite confirmed live via direct API probe on 2026-08-19 —
// it (and gemini-3.5-flash) only resolve on Vertex AI's `global` location in
// this project; both 404 on `us-central1`. GOOGLE_CLOUD_LOCATION must be
// `global` for this model id to work.
//
// Cost policy (see docs/COST_OPTIMIZATION.md): every agent uses Flash
// (lite, even), not Pro. Only bump a single agent to Pro if its output
// quality genuinely requires it — never switch the whole pipeline.
export const geminiModel = 'gemini-3.5-flash-lite';

export interface ModelOption {
  id: string;
  label: string;
  description: string;
}

// The only two Gemini 3.5+ model ids confirmed to actually resolve on this
// project's Vertex AI setup (direct API probe, 2026-08-23) — not a
// hypothetical list. gemini-3.5-pro and gemini-3-pro-preview both 404 here
// (not enabled for this project/region, or don't exist under those ids);
// gemini-3-flash-preview does resolve but is Gemini *3.0*, not 3.5 — an
// older major version than the hackathon's "Gemini 3.5 or newer"
// requirement, so it's deliberately left off this list rather than risk
// eligibility over one extra "high-end"-sounding option.
export const AVAILABLE_MODELS: ModelOption[] = [
  {
    id: 'gemini-3.5-flash-lite',
    label: 'Lite',
    description: 'Fastest and cheapest — the default, good for most requests.',
  },
  {
    id: 'gemini-3.5-flash',
    label: 'Standard',
    description: 'A step up in reasoning quality, costs a little more per run.',
  },
];

// Not a real model id — resolves server-side to each agent's own built-in
// default (currently geminiModel for all seven, but the point of "auto" is
// that LifeGrid decides, not the user, so a future per-agent tuning
// wouldn't need a UI change).
export const AUTO_MODEL = 'auto';
