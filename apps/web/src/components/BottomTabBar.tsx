'use client';

import React from 'react';
import { type View, NAV_ITEMS } from './Sidebar';

interface BottomTabBarProps {
  view: View;
  onNavigate: (view: View) => void;
}

// Mobile nav: a persistent bottom tab bar, replacing the old hamburger +
// slide-over drawer — the drawer hid navigation behind a tap and covered
// the screen; tabs stay visible and reachable with a thumb at all times.
export function BottomTabBar({ view, onNavigate }: BottomTabBarProps) {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-30 flex items-stretch border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
        const active = view === id;
        return (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] transition-colors ${
              active ? 'text-accent' : 'text-muted'
            }`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon className={`w-5 h-5 ${active ? 'text-accent' : 'text-muted'}`} />
            <span className={active ? 'font-medium' : ''}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
