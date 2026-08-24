import { MemoryItem } from '../types.js';

// Default seeded memory items representing persistent history. Used to
// pre-populate both backends (in-memory.ts on every start, firestore.ts
// once, the first time its collection is empty) so a fresh run — local or
// the live Cloud Run demo — always has realistic Memory Bank content for
// agents to reference, instead of an empty bank that undersells FR-7.
export const INITIAL_SEED_MEMORIES: MemoryItem[] = [
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
