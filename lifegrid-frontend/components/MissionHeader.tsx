"use client";
import type { Mission, MissionStatus } from "@/lib/types";
import { BudgetChart } from "@/components/BudgetChart";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_BADGE: Record<
  MissionStatus,
  { label: string; color: string; bg: string; pulse?: boolean }
> = {
  pending:     { label: "Pending",     color: "var(--text-secondary)",  bg: "var(--bg-surface-raised)" },
  in_progress: { label: "In Progress", color: "var(--accent-teal)",     bg: "rgba(45,212,191,0.12)", pulse: true },
  paused:      { label: "Paused",      color: "var(--accent-amber)",    bg: "rgba(245,185,68,0.12)"  },
  completed:   { label: "Completed",   color: "var(--accent-green)",    bg: "rgba(52,211,153,0.12)"  },
  failed:      { label: "Failed",      color: "var(--accent-red)",      bg: "rgba(248,113,113,0.12)" },
};

interface Props {
  mission: Mission | null;
  loading?: boolean;
}

export function MissionHeader({ mission, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-24" style={{ backgroundColor: "var(--bg-surface-raised)" }} />
        <Skeleton className="h-8 w-2/3" style={{ backgroundColor: "var(--bg-surface-raised)" }} />
        <Skeleton className="h-3 w-full" style={{ backgroundColor: "var(--bg-surface-raised)" }} />
      </div>
    );
  }

  if (!mission) return null;

  const badge = STATUS_BADGE[mission.status] ?? STATUS_BADGE.pending;

  return (
    <header className="space-y-4">
      {/* Status badge */}
      <div>
        <span
          className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
          style={{ color: badge.color, backgroundColor: badge.bg }}
          role="status"
        >
          {badge.pulse && (
            <span
              className="w-1.5 h-1.5 rounded-full inline-block animate-pulse-dot"
              style={{ backgroundColor: badge.color }}
              aria-hidden
            />
          )}
          {badge.label}
        </span>
      </div>

      {/* Goal heading */}
      <h1
        className="text-xl font-semibold leading-snug"
        style={{ color: "var(--text-primary)" }}
      >
        {mission.goal}
      </h1>

      {/* Budget */}
      {(mission.budget_limit > 0 || mission.budget_used > 0) && (
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
        >
          <p className="text-xs mb-3 font-medium" style={{ color: "var(--text-secondary)" }}>
            Budget
          </p>
          <BudgetChart used={mission.budget_used} limit={mission.budget_limit} />
        </div>
      )}
    </header>
  );
}
