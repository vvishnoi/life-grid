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
