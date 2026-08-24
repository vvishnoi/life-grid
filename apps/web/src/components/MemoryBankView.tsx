'use client';

import React, { useState } from 'react';
import { MemoryItem } from '@lifegrid/agent/client';
import { Plus, Trash2, ThumbsUp, ThumbsDown, Brain } from 'lucide-react';

interface MemoryBankViewProps {
  memories: MemoryItem[];
  onAddMemory: (memory: Omit<MemoryItem, 'id' | 'updatedAt'>) => void;
  onDeleteMemory: (id: string) => void;
}

const CATEGORY_LABEL: Record<MemoryItem['category'], string> = {
  preference: 'Preference',
  family_profile: 'Family',
  schedule_rule: 'Schedule',
  budget_rule: 'Budget',
  past_trip: 'Past trip',
};

export function MemoryBankView({ memories, onAddMemory, onDeleteMemory }: MemoryBankViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [category, setCategory] = useState<MemoryItem['category']>('preference');
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [sentiment, setSentiment] = useState<MemoryItem['sentiment']>('positive');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key || !value) return;
    onAddMemory({ category, key, value, sentiment, sourceAgent: 'You' });
    setKey('');
    setValue('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{memories.length} saved</p>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-accent hover:bg-accent-soft transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="p-4 rounded-xl border border-border bg-surface space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MemoryItem['category'])}
                className="w-full mt-1 rounded-lg border border-border bg-surface p-2 text-sm text-ink"
              >
                <option value="preference">Preference</option>
                <option value="family_profile">Family</option>
                <option value="schedule_rule">Schedule</option>
                <option value="budget_rule">Budget</option>
                <option value="past_trip">Past trip</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted">Short label</label>
              <input
                type="text"
                placeholder="e.g. seat preference"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full mt-1 rounded-lg border border-border bg-surface p-2 text-sm text-ink"
              />
            </div>
            <div>
              <label className="text-xs text-muted">This is a...</label>
              <select
                value={sentiment}
                onChange={(e) => setSentiment(e.target.value as MemoryItem['sentiment'])}
                className="w-full mt-1 rounded-lg border border-border bg-surface p-2 text-sm text-ink"
              >
                <option value="positive">Like</option>
                <option value="negative">Dislike</option>
                <option value="neutral">Fact</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted">Details</label>
            <input
              type="text"
              placeholder="e.g. Prefers window seats on long flights"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full mt-1 rounded-lg border border-border bg-surface p-2 text-sm text-ink"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs text-muted hover:text-ink transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-accent text-accent-ink hover:opacity-90 transition-opacity"
            >
              Save
            </button>
          </div>
        </form>
      )}

      {memories.length === 0 && !showAddForm ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center flex flex-col items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-surface-2 flex items-center justify-center">
            <Brain className="w-5 h-5 text-muted" />
          </div>
          <p className="text-sm text-muted max-w-xs">Nothing saved yet — LifeGrid will remember things it learns as you use it, or you can add one yourself.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {memories.map((mem) => (
            <div key={mem.id} className="rounded-xl border border-border bg-surface p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-muted shrink-0">{CATEGORY_LABEL[mem.category]}</span>
                  <span className="text-xs font-medium text-ink truncate">{mem.key}</span>
                </div>
                <button
                  onClick={() => onDeleteMemory(mem.id)}
                  className="text-muted hover:text-danger transition-colors p-1 shrink-0"
                  title="Forget this"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-sm text-ink/90 leading-relaxed">{mem.value}</p>

              <div className="flex items-center justify-between text-[11px] text-muted pt-1">
                <span>Learned from {mem.sourceAgent}</span>
                {mem.sentiment !== 'neutral' && (
                  <span className={`flex items-center gap-1 font-medium ${mem.sentiment === 'positive' ? 'text-success' : 'text-danger'}`}>
                    {mem.sentiment === 'negative' ? <ThumbsDown className="w-3 h-3" /> : <ThumbsUp className="w-3 h-3" />}
                    <span>{mem.sentiment === 'positive' ? 'Like' : 'Dislike'}</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
