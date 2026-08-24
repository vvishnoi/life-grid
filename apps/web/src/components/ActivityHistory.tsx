'use client';

import React, { useState } from 'react';
import { TelemetryLog } from '@lifegrid/agent/client';
import { ChevronDown, History } from 'lucide-react';
import { LogList } from './TelemetryConsole';

export interface PastRun {
  id: string;
  goal: string;
  mode: 'scripted' | 'live';
  startedAt: string;
  finished: boolean;
  finalMessage?: string;
  logs: TelemetryLog[];
}

export function ActivityHistory({ runs }: { runs: PastRun[] }) {
  if (runs.length === 0) return null;

  return (
    <div className="pt-2">
      <div className="flex items-center gap-2 mb-3 text-xs font-medium text-muted uppercase tracking-wide">
        <History className="w-3.5 h-3.5" />
        <span>Past activity ({runs.length})</span>
      </div>
      <div className="space-y-2">
        {runs.map((run) => (
          <PastRunRow key={run.id} run={run} />
        ))}
      </div>
    </div>
  );
}

function PastRunRow({ run }: { run: PastRun }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start gap-3 p-3.5 text-left hover:bg-surface-2 transition-colors"
      >
        <ChevronDown className={`w-3.5 h-3.5 mt-1 shrink-0 text-muted transition-transform ${expanded ? 'rotate-180' : ''}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-ink truncate">{run.goal}</p>
            <span className="text-[11px] text-muted tabular-nums shrink-0">{run.startedAt}</span>
          </div>
          <p className="text-xs text-muted mt-0.5 line-clamp-1">
            {run.finished
              ? run.finalMessage
                ? stripMarkdown(run.finalMessage)
                : 'Finished'
              : 'Ended before a final plan came back'}
          </p>
        </div>
      </button>

      {expanded && (
        <div className="px-3.5 pb-3.5 pt-1 border-t border-border">
          <LogList logs={run.logs} />
        </div>
      )}
    </div>
  );
}

function stripMarkdown(text: string): string {
  return text
    .replace(/[#*`_>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
