import { Runner, InMemorySessionService } from '@google/adk';
import { lifeGridOrchestrator } from './agents';

export const LIFEGRID_APP_NAME = 'lifegrid';
export const LIFEGRID_USER_ID = 'demo-user';

// Module-level singleton: a session created during the initial live run must
// still be present in memory when the later approval-resume request arrives.
// This is in-process only — it will not survive Cloud Run scaling to
// multiple instances or an instance recycle between pause and resume.
export const sessionService = new InMemorySessionService();

export const lifeGridRunner = new Runner({
  appName: LIFEGRID_APP_NAME,
  agent: lifeGridOrchestrator,
  sessionService,
  resumabilityConfig: { isResumable: true },
});
