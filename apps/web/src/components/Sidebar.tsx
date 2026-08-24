'use client';

import React from 'react';
import { Sparkles, Activity, Users, Brain, Settings } from 'lucide-react';
import { LifeGridLogo } from './LifeGridLogo';

export type View = 'new' | 'activity' | 'agents' | 'memory' | 'settings';

interface SidebarProps {
  view: View;
  onNavigate: (view: View) => void;
  activityCount: number;
  agentCount: number;
  memoryCount: number;
}

export const NAV_ITEMS: { id: View; label: string; icon: React.ElementType }[] = [
  { id: 'new', label: 'New request', icon: Sparkles },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'agents', label: 'Agents', icon: Users },
  { id: 'memory', label: 'Memory', icon: Brain },
  { id: 'settings', label: 'Settings', icon: Settings },
];

// Desktop-only fixed column. Mobile navigation is BottomTabBar — a
// persistent tab bar, not a hamburger + slide-over drawer, per the "should
// become tabs instead of hidden nav" request. Account controls (theme,
// Google Calendar) live in SettingsView now rather than duplicated here.
export function Sidebar({ view, onNavigate, activityCount, agentCount, memoryCount }: SidebarProps) {
  const counts: Partial<Record<View, number>> = {
    activity: activityCount,
    agents: agentCount,
    memory: memoryCount,
  };

  return (
    <aside className="hidden md:flex w-64 shrink-0 border-r border-border bg-surface flex-col h-screen sticky top-0">
      <div className="px-5 pt-5 pb-4 flex items-center gap-2.5">
        <LifeGridLogo />
        <div className="min-w-0">
          <div className="font-semibold text-[15px] leading-tight truncate">LifeGrid</div>
          <div className="text-[11px] text-muted truncate">Your everyday agent</div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = view === id;
          const count = counts[id];
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                active ? 'bg-accent-soft text-accent font-medium' : 'text-muted hover:bg-surface-2 hover:text-ink'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 text-left">{label}</span>
              {typeof count === 'number' && count > 0 && (
                <span className="text-xs tabular-nums text-muted">{count}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-3 pb-4 pt-3 mt-1 border-t border-border">
        <span className="text-[11px] text-muted">Multi-agent · Google Cloud</span>
      </div>
    </aside>
  );
}
