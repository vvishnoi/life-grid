import React from 'react';
import { Grid2x2 } from 'lucide-react';

// The gradient-ring + pulsing-icon badge from LifeGrid's original header —
// brought back per feedback that the plain flat-accent square that replaced
// it read as flatter/less alive. motion-safe: keeps the pulse off for
// prefers-reduced-motion.
export function LifeGridLogo() {
  return (
    <div className="relative w-8 h-8 rounded-lg bg-gradient-to-tr from-accent via-fuchsia-500 to-cyan-400 p-[1.5px] shadow-lg shadow-accent/30 shrink-0">
      <div className="w-full h-full bg-surface rounded-[7px] flex items-center justify-center">
        <Grid2x2 className="w-4 h-4 text-accent motion-safe:animate-pulse" />
      </div>
    </div>
  );
}
