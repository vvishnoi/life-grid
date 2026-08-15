'use client';

import React from 'react';
import { AgentInfo } from '@/lib/types';
import { Brain, Plane, Users, Calendar, Wallet, ShoppingBag, ShieldCheck, Lock } from 'lucide-react';

interface AgentRegistryViewProps {
  agents: AgentInfo[];
  activeAgentId?: string;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Brain: <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
  Plane: <Plane className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />,
  Users: <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
  Calendar: <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
  Wallet: <Wallet className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
  ShoppingBag: <ShoppingBag className="w-5 h-5 text-rose-600 dark:text-rose-400" />
};

export function AgentRegistryView({ agents, activeAgentId }: AgentRegistryViewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Enterprise Fleet Directory (Agent Registry)</h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
          Zero-Trust Scoped
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => {
          const isActive = activeAgentId === agent.id;
          return (
            <div
              key={agent.id}
              className={`glass-card rounded-xl p-5 space-y-3 relative overflow-hidden transition-all ${
                isActive
                  ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/30 glow-indigo'
                  : ''
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-lg bg-slate-200 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800">
                    {ICON_MAP[agent.icon] || <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{agent.name}</h4>
                    <p className="text-[11px] text-indigo-700 dark:text-indigo-300 font-semibold">{agent.role}</p>
                  </div>
                </div>

                {/* Status Dot */}
                <div className="flex items-center space-x-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isActive ? 'bg-emerald-500 animate-ping' : 'bg-slate-400 dark:bg-slate-500'
                    }`}
                  />
                  <span className={isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}>
                    {isActive ? 'ACTIVE' : 'READY'}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-700 dark:text-slate-400 leading-relaxed font-medium">
                {agent.description}
              </p>

              {/* Zero-Trust RBAC Permissions */}
              <div className="pt-2 border-t border-slate-300 dark:border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-400">
                  <span className="flex items-center space-x-1 text-slate-900 dark:text-slate-300">
                    <Lock className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                    <span>Zero-Trust Scope</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">{agent.riskProfile}</span>
                </div>

                <div className="space-y-1">
                  {agent.permissions.map((perm, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[10px] font-medium">
                      <span className="text-slate-700 dark:text-slate-400 truncate max-w-[170px]">{perm.domain}</span>
                      <span
                        className={`font-extrabold uppercase text-[9px] px-1.5 py-0.5 rounded ${
                          perm.access === 'read'
                            ? 'bg-cyan-500/15 text-cyan-800 dark:text-cyan-400 border border-cyan-500/30'
                            : perm.access === 'write'
                            ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-800 dark:text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {perm.access}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
