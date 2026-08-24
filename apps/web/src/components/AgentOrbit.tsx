'use client';

import React from 'react';
import { ShieldCheck, Plane, Users, Calendar, Wallet, ShoppingBag } from 'lucide-react';

const STOPS: { icon: React.ElementType; label: string }[] = [
  { icon: ShieldCheck, label: 'Checks it’s safe' },
  { icon: Plane, label: 'Travel' },
  { icon: Users, label: 'Family' },
  { icon: Calendar, label: 'Schedule' },
  { icon: Wallet, label: 'Budget' },
  { icon: ShoppingBag, label: 'Shopping' },
];

// A light decorative header for the "New request" view — not a photo (none
// available here), a small on-brand illustration instead: the six things
// that actually happen to a request, left to right in the real pipeline
// order, so it doubles as a preview of what's about to happen rather than
// pure decoration.
export function AgentOrbit() {
  return (
    <div className="relative py-2" aria-hidden="true">
      <div className="absolute left-[8%] right-[8%] top-[22px] h-px bg-border" />
      <div className="relative flex items-start justify-between">
        {STOPS.map(({ icon: Icon, label }, i) => (
          <div key={label} className="flex flex-col items-center gap-2 w-[15%]">
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center border shadow-sm ${
                i === 0 ? 'bg-accent-soft border-accent/40' : 'bg-surface border-border'
              }`}
            >
              <Icon className={`w-5 h-5 ${i === 0 ? 'text-accent' : 'text-muted'}`} />
            </div>
            <span className="text-[10px] text-muted text-center leading-tight">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
