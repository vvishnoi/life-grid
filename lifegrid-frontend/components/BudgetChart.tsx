"use client";

interface Props {
  used: number;
  limit: number;
}

export function BudgetChart({ used, limit }: Props) {
  if (!limit) {
    return (
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        No budget limit set.
      </p>
    );
  }

  const pct = Math.min((used / limit) * 100, 100);
  const over = used > limit;

  const barColor =
    over
      ? "var(--accent-red)"
      : pct >= 80
        ? "var(--accent-amber)"
        : "var(--accent-teal)";

  function fmt(n: number) {
    return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  }

  return (
    <div className="space-y-2">
      {/* Dollar amounts */}
      <div className="flex items-baseline justify-between gap-2">
        <span
          className="text-xl font-semibold font-mono"
          style={{ color: over ? "var(--accent-red)" : "var(--text-primary)" }}
        >
          {fmt(used)}
        </span>
        <span className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
          of {fmt(limit)}
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="h-2 w-full rounded-full overflow-hidden"
        style={{ backgroundColor: "var(--bg-surface-raised)" }}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Budget used"
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>

      {/* Over-budget warning */}
      {over && (
        <p className="text-xs font-mono" style={{ color: "var(--accent-red)" }}>
          Over budget by {fmt(used - limit)}
        </p>
      )}

      {/* Percentage label */}
      {!over && (
        <p className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
          {Math.round(pct)}% used
        </p>
      )}
    </div>
  );
}
