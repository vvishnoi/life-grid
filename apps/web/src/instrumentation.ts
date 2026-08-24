// Next.js instrumentation hook — runs once when a server instance starts,
// before it handles any requests. See:
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation.md
//
// Wires ADK's own OpenTelemetry spans (every agent invocation is already
// wrapped in `tracer.startSpan('invoke_agent ...')` internally — see
// node_modules/@google/adk/dist/esm/agents/base_agent.js) to Cloud Trace.
// Without this, those spans are created and immediately discarded — no
// global TracerProvider is registered to export them anywhere. This is
// the fix for the "Agent Observability (OpenTelemetry-compliant)"
// requirement in docs/IMPLEMENTATION_PLAN.md Part 1 §1.3 / Part 3 §3.1.
//
// Tracing only, deliberately not metrics: a PeriodicExportingMetricReader
// runs its own export loop, which is unnecessary cost/complexity beyond
// what the hackathon track actually asks for ("reasoning chain traces").
//
// Two harmless things you'll see in server logs, verified not to be bugs:
// (1) a DEP_GCP_OTEL_TRACE_EXPORTER deprecation warning — this exporter
//     (bundled by @google/adk itself) is slated for archival after
//     2026-10-30; fine through this hackathon's deadline, worth revisiting
//     after. (2) an "Attempted duplicate registration of API: trace" error
//     — ADK's own maybeSetOtelProviders() calls both
//     `tracerProvider.register()` (which already sets the global) and then
//     redundantly calls `trace.setGlobalTracerProvider()` again right
//     after; the first call wins and traces export successfully regardless
//     — confirmed live in Cloud Trace, full span tree with gen_ai.* attrs.
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (!process.env.GOOGLE_CLOUD_PROJECT) return; // scripted-mode-only dev: nothing to export

  const { getGcpExporters, maybeSetOtelProviders } = await import('@google/adk');
  const hooks = await getGcpExporters({ enableTracing: true });
  maybeSetOtelProviders([hooks]);
}
