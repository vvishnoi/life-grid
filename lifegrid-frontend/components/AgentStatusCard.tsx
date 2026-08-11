"use client";
import type { AgentId, Task, TaskStatus } from "@/lib/types";
import { AGENT_DISPLAY_NAMES } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plane, Users, Calendar, DollarSign,
  Home, ShoppingCart, MessageSquare,
} from "lucide-react";

// ── Icons ────────────────────────────────────────────────────────────────────
const AGENT_ICONS: Record<AgentId, React.ElementType> = {
  travel_agent: Plane,
  family_agent: Users,
  calendar_agent: Calendar,
  finance_agent: DollarSign,
  home_agent: Home,
  shopping_agent: ShoppingCart,
  communication_agent: MessageSquare,
};

// ── Status config ─────────────────────────────────────────────────────────────
type DotStatus = "idle" | "running" | "needs_approval" | "completed" | "rejected" | "pending";

const STATUS_CFG: Record<DotStatus, { color: string; label: string; pulse: boolean }> = {
  idle:           { color: "#4B5563",                  label: "Idle",            pulse: false },
  pending:        { color: "#4B5563",                  label: "Pending",         pulse: false },
  running:        { color: "var(--accent-teal)",       label: "Running",         pulse: true  },
  needs_approval: { color: "var(--accent-amber)",      label: "Needs Approval",  pulse: false },
  completed:      { color: "var(--accent-green)",      label: "Done",            pulse: false },
  rejected:       { color: "var(--accent-red)",        label: "Rejected",        pulse: false },
};

// Priority: needs_approval > running > rejected > pending > completed > idle
const STATUS_PRIORITY: DotStatus[] = [
  "needs_approval", "running", "rejected", "pending", "completed", "idle",
];

function deriveStatus(tasks: Task[]): DotStatus {
  if (tasks.length === 0) return "idle";
  for (const s of STATUS_PRIORITY) {
    if (tasks.some((t) => t.status === s)) return s;
  }
  return "idle";
}

function relativeTime(iso?: string): string | null {
  if (!iso) return null;
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

// ── Component ─────────────────────────────────────────────────────────────────
interface Props {
  agent: AgentId;
  tasks: Task[];
}

export function AgentStatusCard({ agent, tasks }: Props) {
  const Icon = AGENT_ICONS[agent];
  const status = deriveStatus(tasks);
  const cfg = STATUS_CFG[status];

  // Most-recent task (by updated_at)
  const latest = tasks
    .filter((t) => t.updated_at)
    .sort((a, b) => new Date(b.updated_at!).getTime() - new Date(a.updated_at!).getTime())[0];

  const description = latest?.description ?? "Waiting for instructions…";
  const timeAgo = relativeTime(latest?.updated_at);

  return (
    <article
      className="rounded-xl p-4 flex flex-col gap-3"
      style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
      aria-label={`${AGENT_DISPLAY_NAMES[agent]} — ${cfg.label}`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Icon size={14} style={{ color: "var(--text-secondary)", flexShrink: 0 }} aria-hidden />
          <span className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
            {AGENT_DISPLAY_NAMES[agent]}
          </span>
        </div>

        {/* Status dot + label */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`w-2 h-2 rounded-full inline-block${cfg.pulse ? " animate-pulse-dot" : ""}`}
            style={{ backgroundColor: cfg.color }}
            role="status"
            aria-label={cfg.label}
          />
          <span className="text-xs" style={{ color: cfg.color }}>
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm leading-relaxed line-clamp-2" style={{ color: "var(--text-secondary)" }}>
        {description}
      </p>

      {/* Timestamp */}
      {timeAgo && (
        <p className="text-xs font-mono" style={{ color: "var(--text-secondary)", opacity: 0.6 }}>
          {timeAgo}
        </p>
      )}
    </article>
  );
}

export function AgentStatusCardSkeleton() {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3"
      style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" style={{ backgroundColor: "var(--bg-surface-raised)" }} />
        <Skeleton className="h-4 w-16" style={{ backgroundColor: "var(--bg-surface-raised)" }} />
      </div>
      <Skeleton className="h-10 w-full" style={{ backgroundColor: "var(--bg-surface-raised)" }} />
      <Skeleton className="h-3 w-16" style={{ backgroundColor: "var(--bg-surface-raised)" }} />
    </div>
  );
}
