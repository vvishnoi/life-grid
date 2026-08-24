import type { MemoryBank } from './types.js';
import { InMemoryMemoryBank } from './in-memory.js';

export type { MemoryBank } from './types.js';

// `K_SERVICE` is set automatically by Cloud Run on every container instance
// (and unset everywhere else — local dev, CI, a plain Docker run) — the
// standard, zero-config way to detect "this is actually deployed," as
// distinct from GOOGLE_CLOUD_PROJECT/live-mode, which can be set locally
// too for testing against real Vertex AI. MEMORY_BANK_BACKEND overrides the
// auto-detection either direction, for the rare case you want one
// explicitly regardless of environment.
function resolveBackend(): 'memory' | 'firestore' {
  const override = process.env.MEMORY_BANK_BACKEND;
  if (override === 'memory' || override === 'firestore') return override;
  return process.env.K_SERVICE ? 'firestore' : 'memory';
}

// Lazily constructed so importing this module never throws when Firestore
// isn't configured (e.g. scripted-mode-only local dev) — the client is
// only instantiated if resolveBackend() actually picks it.
async function createMemoryBank(): Promise<MemoryBank> {
  if (resolveBackend() === 'firestore') {
    const { FirestoreMemoryBank } = await import('./firestore.js');
    return new FirestoreMemoryBank();
  }
  return new InMemoryMemoryBank();
}

let instance: MemoryBank | undefined;
let instancePromise: Promise<MemoryBank> | undefined;

// A thin synchronous-looking wrapper around the lazily-resolved backend, so
// every call site (tools.ts, scripted-demo.ts, apps/web's /api/memory
// route) can keep using `memoryBank.getMemories()` etc. without knowing
// which backend is live or awaiting a separate init step.
async function getInstance(): Promise<MemoryBank> {
  if (instance) return instance;
  if (!instancePromise) instancePromise = createMemoryBank();
  instance = await instancePromise;
  return instance;
}

export const memoryBank: MemoryBank = {
  async getMemories() {
    return (await getInstance()).getMemories();
  },
  async addMemory(memory) {
    return (await getInstance()).addMemory(memory);
  },
  async deleteMemory(id) {
    return (await getInstance()).deleteMemory(id);
  },
};
