'use client';

import React from 'react';
import { TelemetryLog } from '@/lib/types';
import { Terminal, ShieldAlert, Cpu, CheckCircle2, AlertTriangle } from 'lucide-react';

interface TelemetryConsoleProps {
  logs: TelemetryLog[];
}

export function TelemetryConsole({ logs }: TelemetryConsoleProps) {
  return (
    <div className="glass-panel rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Telemetry & Observability Console</h3>
        </div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
          <span>Live Stream</span>
        </div>
      </div>

      <div className="bg-slate-200/90 dark:bg-slate-950/90 rounded-xl p-4 border border-slate-300 dark:border-slate-900 font-mono text-xs max-h-96 overflow-y-auto space-y-2.5">
        {logs.length === 0 ? (
          <div className="text-slate-500 dark:text-slate-600 italic py-6 text-center font-sans font-medium">
            Awaiting goal deployment... Deploy fleet above to watch multi-agent execution telemetry.
          </div>
        ) : (
          logs.map((log) => {
            const isAlert = log.type === 'security_alert' || log.type === 'error' || log.threatDetected;
            const isApproval = log.type === 'approval_required';
            const isMemory = log.type === 'memory_update';
            const isSuccess = log.type === 'execution_success';

            return (
              <div
                key={log.id}
                className={`p-3 rounded-lg border transition-all ${
                  isAlert
                    ? 'bg-rose-100 dark:bg-rose-950/40 border-rose-400 dark:border-rose-500/50 text-rose-900 dark:text-rose-200'
                    : isApproval
                    ? 'bg-amber-100 dark:bg-amber-950/30 border-amber-400 dark:border-amber-500/40 text-amber-900 dark:text-amber-200'
                    : isMemory
                    ? 'bg-indigo-100 dark:bg-indigo-950/30 border-indigo-400 dark:border-indigo-500/40 text-indigo-900 dark:text-indigo-200'
                    : isSuccess
                    ? 'bg-emerald-100 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-200'
                    : 'bg-white dark:bg-slate-900/60 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2 text-[11px]">
                    {isAlert ? (
                      <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    ) : isApproval ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    ) : isSuccess ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <Cpu className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                    )}
                    <span className="font-extrabold text-slate-900 dark:text-slate-200">[{log.agentName}]</span>
                    <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                  </div>

                  {log.riskLevel && (
                    <span
                      className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-extrabold ${
                        log.riskLevel === 'critical' || log.riskLevel === 'high'
                          ? 'bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-500/40'
                          : log.riskLevel === 'medium'
                          ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {log.riskLevel}
                    </span>
                  )}
                </div>

                <p className="mt-1.5 leading-relaxed text-[11px] font-sans font-medium">{log.message}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
