import { MemoryItem } from '../types';

// Default seeded memory items representing persistent history
const INITIAL_SEED_MEMORIES: MemoryItem[] = [
  {
    id: 'mem-1',
    category: 'preference',
    key: 'lodging_location_preference',
    value: 'Must be within 3 miles of downtown; dislikes remote airport hotels based on past Denver trip.',
    sentiment: 'negative',
    sourceAgent: 'Travel & Lodging Agent',
    updatedAt: '2026-07-15T14:32:00Z'
  },
  {
    id: 'mem-2',
    category: 'family_profile',
    key: 'family_dietary_rules',
    value: 'Daughter has nut allergy; prefers restaurants with verified gluten-free & nut-free kitchens.',
    sentiment: 'neutral',
    sourceAgent: 'Family & Activities Agent',
    updatedAt: '2026-08-01T09:15:00Z'
  },
  {
    id: 'mem-3',
    category: 'budget_rule',
    key: 'max_nightly_hotel_rate',
    value: 'Hotel budget cap: $350/night max for family suites.',
    sentiment: 'positive',
    sourceAgent: 'Finance & Budget Agent',
    updatedAt: '2026-08-05T11:20:00Z'
  },
  {
    id: 'mem-4',
    category: 'schedule_rule',
    key: 'no_early_morning_flights',
    value: 'Avoid flights departing before 7:30 AM due to kids morning schedule.',
    sentiment: 'negative',
    sourceAgent: 'Calendar & Time Agent',
    updatedAt: '2026-08-10T16:45:00Z'
  }
];

class MemoryBankService {
  private inMemoryStore: MemoryItem[] = [...INITIAL_SEED_MEMORIES];

  public async getMemories(): Promise<MemoryItem[]> {
    // In production with GCP credentials, this connects to `@google-cloud/firestore`
    return this.inMemoryStore;
  }

  public async addMemory(memory: Omit<MemoryItem, 'id' | 'updatedAt'>): Promise<MemoryItem> {
    const newItem: MemoryItem = {
      ...memory,
      id: `mem-${Date.now()}`,
      updatedAt: new Date().toISOString()
    };
    this.inMemoryStore.unshift(newItem);
    return newItem;
  }

  public async deleteMemory(id: string): Promise<boolean> {
    const index = this.inMemoryStore.findIndex(m => m.id === id);
    if (index !== -1) {
      this.inMemoryStore.splice(index, 1);
      return true;
    }
    return false;
  }
}

export const memoryBank = new MemoryBankService();
