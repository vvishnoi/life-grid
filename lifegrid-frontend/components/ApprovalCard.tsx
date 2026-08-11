"use client";
import { useState } from "react";
import type { Approval } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Check, X, Loader2 } from "lucide-react";

interface Props {
  approval: Approval;
  onDecision: (id: string, approved: boolean) => void;
}

export function ApprovalCard({ approval, onDecision }: Props) {
  const [deciding, setDeciding] = useState<"approve" | "reject" | null>(null);
  const [decided, setDecided] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const isPending = approval.status === "pending" && !decided;
  const isHigh = approval.risk_level === "high";
  const riskColor = isHigh ? "var(--accent-red)" : "var(--accent-amber)";

  async function handle(approved: boolean) {
    if (!isPending || deciding) return;
    setDeciding(approved ? "approve" : "reject");
    setLocalError(null);
    try {
      await onDecision(approval.id, approved);
      setDecided(true);
    } catch {
      setLocalError("Failed to submit. Please try again.");
      setDeciding(null);
    }
  }

  return (
    <article
      className="rounded-xl p-4 space-y-3"
      style={{
        backgroundColor: "var(--bg-surface)",
        border: `1px solid ${isPending ? "var(--accent-amber)" : "var(--border-subtle)"}`,
      }}
      aria-label="Approval request"
      aria-live="polite"
    >
      {/* Header */}
      <div className="flex items-start gap-2">
        <AlertTriangle
          size={14}
          style={{ color: riskColor, flexShrink: 0, marginTop: 2 }}
          aria-hidden
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug" style={{ color: "var(--text-primary)" }}>
            {approval.action}
          </p>
        </div>
        {/* Risk badge */}
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0 capitalize"
          style={{ backgroundColor: `${riskColor}22`, color: riskColor }}
        >
          {isHigh ? "High risk" : "Low risk"}
        </span>
      </div>

      {/* Error */}
      {localError && (
        <p className="text-xs" style={{ color: "var(--accent-red)" }} role="alert">
          {localError}
        </p>
      )}

      {/* Decided state */}
      {decided && (
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          Decision submitted — waiting for update…
        </p>
      )}

      {/* Action buttons */}
      {isPending && (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => handle(true)}
            disabled={deciding !== null}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg font-medium text-xs"
            style={{ backgroundColor: "var(--accent-green)", color: "var(--bg-base)" }}
            aria-label="Approve"
          >
            {deciding === "approve" ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Check size={13} />
            )}
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handle(false)}
            disabled={deciding !== null}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg font-medium text-xs"
            style={{
              borderColor: "var(--accent-red)",
              color: "var(--accent-red)",
              backgroundColor: "transparent",
            }}
            aria-label="Reject"
          >
            {deciding === "reject" ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <X size={13} />
            )}
            Reject
          </Button>
        </div>
      )}
    </article>
  );
}
