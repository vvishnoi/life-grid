import { Firestore } from '@google-cloud/firestore';
import { MemoryItem } from '../types.js';
import type { MemoryBank } from './types.js';
import { INITIAL_SEED_MEMORIES } from './seed-data.js';

const COLLECTION = 'lifegrid_memory_bank';

// Real cross-session persistence — selected automatically on Cloud Run (see
// index.ts). Auth is via the runtime service account's Application Default
// Credentials, same as Vertex AI; requires `roles/datastore.user` and a
// Firestore Native-mode database to exist in the project (both provisioned
// by scripts/gcp-up.sh).
export class FirestoreMemoryBank implements MemoryBank {
  private db = new Firestore();
  // Memoized so concurrent early requests don't race to seed twice.
  private seeded: Promise<void> | undefined;

  private ensureSeeded(): Promise<void> {
    if (!this.seeded) {
      this.seeded = (async () => {
        const existing = await this.db.collection(COLLECTION).limit(1).get();
        if (existing.empty) {
          const batch = this.db.batch();
          for (const memory of INITIAL_SEED_MEMORIES) {
            batch.set(this.db.collection(COLLECTION).doc(memory.id), memory);
          }
          await batch.commit();
        }
      })();
    }
    return this.seeded;
  }

  public async getMemories(): Promise<MemoryItem[]> {
    await this.ensureSeeded();
    const snapshot = await this.db.collection(COLLECTION).orderBy('updatedAt', 'desc').get();
    return snapshot.docs.map((doc) => doc.data() as MemoryItem);
  }

  public async addMemory(memory: Omit<MemoryItem, 'id' | 'updatedAt'>): Promise<MemoryItem> {
    await this.ensureSeeded();
    const newItem: MemoryItem = {
      ...memory,
      id: `mem-${Date.now()}`,
      updatedAt: new Date().toISOString()
    };
    await this.db.collection(COLLECTION).doc(newItem.id).set(newItem);
    return newItem;
  }

  public async deleteMemory(id: string): Promise<boolean> {
    const ref = this.db.collection(COLLECTION).doc(id);
    const doc = await ref.get();
    if (!doc.exists) return false;
    await ref.delete();
    return true;
  }
}
