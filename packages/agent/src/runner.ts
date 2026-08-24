import { Runner, InMemorySessionService } from '@google/adk';
import { lifeGridOrchestrator, buildLifeGridOrchestrator } from './agents/index.js';
import { geminiModel } from './model.js';

export const LIFEGRID_APP_NAME = 'lifegrid';
export const LIFEGRID_USER_ID = 'demo-user';

// Module-level singleton: a session created during the initial live run must
// still be present in memory when the later approval-resume request arrives.
// This is in-process only — it will not survive Cloud Run scaling to
// multiple instances or an instance recycle between pause and resume.
// Shared across every model-specific Runner below — a Session is just an
// id-keyed record, not tied to whichever Runner instance touches it, so
// this is safe to reuse regardless of which model a given run picked.
export const sessionService = new InMemorySessionService();

export const lifeGridRunner = new Runner({
  appName: LIFEGRID_APP_NAME,
  agent: lifeGridOrchestrator,
  sessionService,
  resumabilityConfig: { isResumable: true },
});

// One Runner per distinct model, built lazily and cached — not one Runner
// with a mutable model, which would race across concurrent requests picking
// different models. Each entry owns its own independent agent graph.
const runnerCache = new Map<string, Runner>();
runnerCache.set(geminiModel, lifeGridRunner);

export function getLifeGridRunner(model?: string): Runner {
  const resolvedModel = model || geminiModel;
  const cached = runnerCache.get(resolvedModel);
  if (cached) return cached;

  const runner = new Runner({
    appName: LIFEGRID_APP_NAME,
    agent: buildLifeGridOrchestrator(resolvedModel),
    sessionService,
    resumabilityConfig: { isResumable: true },
  });
  runnerCache.set(resolvedModel, runner);
  return runner;
}
