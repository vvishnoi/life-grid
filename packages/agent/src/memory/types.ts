import { MemoryItem } from '../types.js';

// The Memory Bank contract — cross-session preferences/facts (distinct
// from ADK session state, see Part 2 §2.4 of docs/IMPLEMENTATION_PLAN.md).
// Two backends implement this: in-memory.ts (local dev, resets on
// restart) and firestore.ts (real persistence, selected automatically on
// Cloud Run) — see index.ts for the selection logic.
export interface MemoryBank {
  getMemories(): Promise<MemoryItem[]>;
  addMemory(memory: Omit<MemoryItem, 'id' | 'updatedAt'>): Promise<MemoryItem>;
  deleteMemory(id: string): Promise<boolean>;
}
