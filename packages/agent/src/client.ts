// Client-safe subset of @lifegrid/agent's public API — pure data and
// TypeScript types only, zero runtime dependency on @google/adk or any
// other server-only package. Import this (not the package root) from any
// code that can end up in a browser bundle (React client components, etc.)
// — the root entrypoint pulls in the full ADK/OpenTelemetry/gRPC graph,
// which is server-only and will break a client build if bundled.
export { ENTERPRISE_AGENT_REGISTRY, getAgentById } from './registry.js';
export { AVAILABLE_MODELS, AUTO_MODEL, geminiModel, type ModelOption } from './model.js';
export { buildScriptedFinalPlan } from './scripted-final-plan.js';
export { SPEND_LIMIT_THRESHOLD, APPROVAL_THRESHOLD_OPTIONS } from './gateway/policy-engine.js';
export * from './types.js';
