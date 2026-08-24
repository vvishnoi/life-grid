'use client';

import React, { useState } from 'react';
import { AgentInfo } from '@lifegrid/agent/client';
import { Brain, Plane, Users, Calendar, Wallet, ShoppingBag, ShieldCheck, ChevronDown } from 'lucide-react';

interface AgentRegistryViewProps {
  agents: AgentInfo[];
  activeAgentId?: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Brain,
  Plane,
  Users,
  Calendar,
  Wallet,
  ShoppingBag,
  ShieldCheck,
};

export function AgentRegistryView({ agents, activeAgentId }: AgentRegistryViewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} isActive={activeAgentId === agent.id} />
      ))}
    </div>
  );
}

function AgentCard({ agent, isActive }: { agent: AgentInfo; isActive: boolean }) {
  const [expanded, setExpanded] = useState(true);
  const Icon = ICON_MAP[agent.icon] || Brain;

  return (
    <div
      className={`rounded-xl border p-4 space-y-3 transition-colors ${
        isActive ? 'border-accent bg-accent-soft' : 'border-border bg-surface'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-surface-2 shrink-0">
            <Icon className="w-4 h-4 text-ink" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-medium text-ink truncate">{agent.name}</h4>
            <p className="text-xs text-muted truncate">{agent.role}</p>
          </div>
        </div>
        {isActive && (
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-accent shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Working
          </span>
        )}
      </div>

      <p className="text-xs text-muted leading-relaxed">{agent.description}</p>

      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1 text-[11px] font-medium text-muted hover:text-ink transition-colors"
      >
        <span>What it&rsquo;s allowed to do</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="pt-1 space-y-1.5">
          {agent.permissions.map((perm, idx) => (
            <div key={idx} className="flex items-center justify-between text-[11px]">
              <span className="text-muted truncate max-w-[65%]">{perm.description}</span>
              <span
                className={`font-medium text-[10px] px-1.5 py-0.5 rounded ${
                  perm.access === 'none'
                    ? 'bg-surface-2 text-muted'
                    : 'bg-accent-soft text-accent'
                }`}
              >
                {perm.access === 'none' ? 'no access' : perm.access}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
