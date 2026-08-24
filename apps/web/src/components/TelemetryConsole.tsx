'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { TelemetryLog } from '@lifegrid/agent/client';
import { ShieldAlert, Cpu, CheckCircle2, AlertTriangle, Brain as ThoughtIcon, Loader2, Sparkles, Activity } from 'lucide-react';

interface TelemetryConsoleProps {
  logs: TelemetryLog[];
  isRunning: boolean;
}

// Short, single-line, technical progress notes — kept compact and muted so
// they don't compete for attention with an agent's actual findings below.
const COMPACT_TYPES: TelemetryLog['type'][] = ['tool_call', 'security_inspection', 'orchestration'];

export function TelemetryConsole({ logs, isRunning }: TelemetryConsoleProps) {
  if (logs.length === 0) {
    return isRunning ? (
      <div className="rounded-xl border border-border bg-surface p-10 text-center flex flex-col items-center gap-3">
        <Loader2 className="w-5 h-5 text-accent animate-spin" />
        <p className="text-sm text-muted">Starting up — the security check runs first, then a few agents research at once. This can take a bit.</p>
      </div>
    ) : (
      <div className="rounded-xl border border-dashed border-border p-10 text-center flex flex-col items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-surface-2 flex items-center justify-center">
          <Activity className="w-5 h-5 text-muted" />
        </div>
        <p className="text-sm text-muted max-w-xs">Nothing happening yet — start a request and you&rsquo;ll see each step here as it runs.</p>
      </div>
    );
  }

  // Newest-first array — the final plan, if the run finished, is the most
  // recent execution_success. Pin it above the step-by-step feed so the
  // actual answer isn't just one more row in a long scrolling log.
  const finalPlan = !isRunning ? logs.find((l) => l.type === 'execution_success') : undefined;

  return (
    <div className="space-y-5">
      {isRunning && (
        <div className="flex items-center gap-2 text-xs font-medium text-accent px-1">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Still working…</span>
        </div>
      )}

      {finalPlan && (
        <div className="rounded-xl border border-accent/30 bg-accent-soft p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-xs font-semibold uppercase tracking-wide text-accent">Your plan is ready</span>
          </div>
          <div className="markdown-content markdown-content-lg text-sm text-ink">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{finalPlan.message}</ReactMarkdown>
          </div>
        </div>
      )}

      <LogList logs={logs} />
    </div>
  );
}

export function LogList({ logs }: { logs: TelemetryLog[] }) {
  return (
    <div className="space-y-2">
      {logs.map((log) => {
        const isAlert = log.type === 'security_alert' || log.type === 'error' || log.threatDetected;
        const isApproval = log.type === 'approval_required';
        const isSuccess = log.type === 'execution_success';
        const isCompact = COMPACT_TYPES.includes(log.type) && !isAlert;

        if (isCompact) {
          const Icon = log.type === 'tool_call' ? Cpu : ThoughtIcon;
          return (
            <div key={log.id} className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-muted">
              <Icon className="w-3 h-3 shrink-0 opacity-70" />
              <span className="font-medium text-ink/70 shrink-0">{log.agentName}</span>
              <span className="truncate">{log.message}</span>
              <span className="ml-auto shrink-0 tabular-nums opacity-70">{log.timestamp}</span>
            </div>
          );
        }

        const Icon = isAlert ? ShieldAlert : isApproval ? AlertTriangle : isSuccess ? CheckCircle2 : ThoughtIcon;
        const tone = isAlert
          ? 'border-danger/30 bg-danger-soft'
          : isApproval
          ? 'border-warn/30 bg-warn-soft'
          : isSuccess
          ? 'border-success/30 bg-success-soft'
          : 'border-border bg-surface';
        const iconTone = isAlert ? 'text-danger' : isApproval ? 'text-warn' : isSuccess ? 'text-success' : 'text-muted';

        return (
          <div key={log.id} className={`flex gap-3 p-4 rounded-lg border ${tone}`}>
            <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${iconTone}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-medium text-ink">{log.agentName}</span>
                <div className="flex items-center gap-2 shrink-0">
                  {log.riskLevel && (log.riskLevel === 'critical' || log.riskLevel === 'high') && (
                    <span className="text-[10px] uppercase tracking-wide text-danger font-medium">{log.riskLevel}</span>
                  )}
                  <span className="text-[11px] text-muted tabular-nums">{log.timestamp}</span>
                </div>
              </div>
              <div className="markdown-content text-sm text-ink/90">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{log.message}</ReactMarkdown>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
