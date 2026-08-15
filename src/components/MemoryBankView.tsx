'use client';

import React, { useState } from 'react';
import { MemoryItem } from '@/lib/types';
import { Database, Plus, Trash2, ThumbsUp, ThumbsDown, Clock } from 'lucide-react';

interface MemoryBankViewProps {
  memories: MemoryItem[];
  onAddMemory: (memory: Omit<MemoryItem, 'id' | 'updatedAt'>) => void;
  onDeleteMemory: (id: string) => void;
}

export function MemoryBankView({ memories, onAddMemory, onDeleteMemory }: MemoryBankViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [category, setCategory] = useState<MemoryItem['category']>('preference');
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [sentiment, setSentiment] = useState<MemoryItem['sentiment']>('positive');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!key || !value) return;
    onAddMemory({
      category,
      key,
      value,
      sentiment,
      sourceAgent: 'User Interface'
    });
    setKey('');
    setValue('');
    setShowAddModal(false);
  };

  return (
    <div className="glass-panel rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Memory Bank (Cloud Firestore Memory)</h3>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-xs text-slate-600 dark:text-slate-400 font-mono font-semibold">
            {memories.length} Persistent Rules Loaded
          </span>
          <button
            onClick={() => setShowAddModal(!showAddModal)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-extrabold bg-purple-600/15 hover:bg-purple-600/30 text-purple-800 dark:text-purple-200 border border-purple-500/40 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Memory</span>
          </button>
        </div>
      </div>

      {/* Add Memory Modal Form */}
      {showAddModal && (
        <form onSubmit={handleSubmit} className="glass-card p-4 rounded-xl space-y-3 border border-purple-500/40 bg-white dark:bg-slate-900/90">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-800 dark:text-slate-300">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full mt-1 glass-input rounded-lg p-2 text-xs font-semibold"
              >
                <option value="preference">Preference</option>
                <option value="family_profile">Family Profile</option>
                <option value="schedule_rule">Schedule Rule</option>
                <option value="budget_rule">Budget Rule</option>
                <option value="past_trip">Past Trip</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-800 dark:text-slate-300">Memory Key</label>
              <input
                type="text"
                placeholder="e.g. seat_preference"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full mt-1 glass-input rounded-lg p-2 text-xs font-medium"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-800 dark:text-slate-300">Sentiment</label>
              <select
                value={sentiment}
                onChange={(e) => setSentiment(e.target.value as any)}
                className="w-full mt-1 glass-input rounded-lg p-2 text-xs font-semibold"
              >
                <option value="positive">Positive</option>
                <option value="negative">Negative (Dislikes)</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-800 dark:text-slate-300">Memory Details</label>
            <input
              type="text"
              placeholder="e.g. Prefers window seats on cross-country flights."
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full mt-1 glass-input rounded-lg p-2 text-xs font-medium"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg text-xs font-extrabold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-500/20"
            >
              Save Memory to Firestore
            </button>
          </div>
        </form>
      )}

      {/* Memory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {memories.map((mem) => (
          <div
            key={mem.id}
            className="glass-card rounded-xl p-4 space-y-2 border border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-500/30">
                  {mem.category.replace('_', ' ')}
                </span>
                <span className="text-xs font-extrabold text-slate-900 dark:text-slate-200">{mem.key}</span>
              </div>
              <button
                onClick={() => onDeleteMemory(mem.id)}
                className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                title="Delete memory"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{mem.value}</p>

            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 font-semibold">
              <span className="flex items-center space-x-1 text-slate-600 dark:text-slate-400">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Learned by: {mem.sourceAgent}</span>
              </span>
              <span
                className={`flex items-center space-x-1 font-extrabold ${
                  mem.sentiment === 'positive'
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : mem.sentiment === 'negative'
                    ? 'text-rose-700 dark:text-rose-400'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {mem.sentiment === 'negative' ? (
                  <ThumbsDown className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                ) : (
                  <ThumbsUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                )}
                <span className="capitalize">{mem.sentiment}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
