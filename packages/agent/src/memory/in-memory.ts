import { MemoryItem } from '../types.js';
import type { MemoryBank } from './types.js';
import { INITIAL_SEED_MEMORIES } from './seed-data.js';

// Local-dev default: a plain in-process array. Resets on every restart —
// deliberately not a persistence claim, just the zero-config path so
// `npm run dev` works with no GCP credentials (design goal, see
// docs/IMPLEMENTATION_PLAN.md §2.1). See firestore.ts for the real
// cross-session store used on Cloud Run.
export class InMemoryMemoryBank implements MemoryBank {
  private store: MemoryItem[] = [...INITIAL_SEED_MEMORIES];

  public async getMemories(): Promise<MemoryItem[]> {
    return this.store;
  }

  public async addMemory(memory: Omit<MemoryItem, 'id' | 'updatedAt'>): Promise<MemoryItem> {
    const newItem: MemoryItem = {
      ...memory,
      id: `mem-${Date.now()}`,
      updatedAt: new Date().toISOString()
    };
    this.store.unshift(newItem);
    return newItem;
  }

  public async deleteMemory(id: string): Promise<boolean> {
    const index = this.store.findIndex(m => m.id === id);
    if (index !== -1) {
      this.store.splice(index, 1);
      return true;
    }
    return false;
  }
}
