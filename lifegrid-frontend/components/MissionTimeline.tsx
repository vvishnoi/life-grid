"use client";
import type { Task } from "@/lib/types";
import { AGENT_DISPLAY_NAMES } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle } from "lucide-react";

function formatTimestamp(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

interface Props {
  tasks: Task[];
  loading?: boolean;
}

export function MissionTimeline({ tasks, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton
              className="w-7 h-7 rounded-full shrink-0"
              style={{ backgroundColor: "var(--bg-surface-raised)" }}
            />
            <div className="flex-1 space-y-2 pt-0.5">
              <Skeleton className="h-3 w-1/3" style={{ backgroundColor: "var(--bg-surface-raised)" }} />
              <Skeleton className="h-3 w-3/4" style={{ backgroundColor: "var(--bg-surface-raised)" }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Only completed / rejected tasks, newest first
  const done = tasks
    .filter((t) => t.status === "completed" || t.status === "rejected")
    .sort((a, b) =>
      new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime()
    );

  if (done.length === 0) {
    return (
      <p className="text-sm py-4" style={{ color: "var(--text-secondary)" }}>
        Completed steps will appear here as agents finish their work.
      </p>
    );
  }

  return (
    <ol className="space-y-0" aria-label="Mission timeline">
      {done.map((task, idx) => {
        const isCompleted = task.status === "completed";
        const accentColor = isCompleted ? "var(--accent-green)" : "var(--accent-red)";
        const Icon = isCompleted ? CheckCircle2 : XCircle;
        const isLast = idx === done.length - 1;

        return (
          <li key={task.id} className="flex gap-3">
            {/* Spine */}
            <div className="flex flex-col items-center">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: "var(--bg-surface-raised)" }}
                aria-hidden
              >
                <Icon size={13} style={{ color: accentColor }} />
              </div>
              {!isLast && (
                <div
                  className="w-px flex-1 my-1 min-h-[1rem]"
                  style={{ backgroundColor: "var(--border-subtle)" }}
                />
              )}
            </div>

            {/* Content */}
            <div className={`pb-4 flex-1 min-w-0${isLast ? " pb-0" : ""}`}>
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {AGENT_DISPLAY_NAMES[task.agent]}
                </span>
                <span
                  className="text-xs capitalize px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: `${accentColor}22`, color: accentColor }}
                >
                  {task.status}
                </span>
              </div>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {task.description}
              </p>
              <time
                className="text-xs font-mono mt-1 block"
                style={{ color: "var(--text-secondary)", opacity: 0.6 }}
                dateTime={task.updated_at}
              >
                {formatTimestamp(task.updated_at)}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
