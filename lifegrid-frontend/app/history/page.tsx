"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { USE_MOCKS } from "@/lib/api";
import { MOCK_MISSIONS } from "@/lib/mockData";
import type { Mission, MissionStatus } from "@/lib/types";
import {
  ArrowRight, Clock, CheckCircle2, XCircle,
  Loader2, AlertTriangle, Inbox, PauseCircle,
} from "lucide-react";

// ── Firestore imports (only when not mocking) ─────────────────────────────────
type Unsubscribe = () => void;
let collectionFn: Function, onSnapshotFn: Function, queryFn: Function,
  orderByFn: Function, whereFn: Function, db: any;

if (!USE_MOCKS) {
  const fs = require("firebase/firestore");
  const fb = require("@/lib/firebase");
  ({ collection: collectionFn, onSnapshot: onSnapshotFn, query: queryFn,
     orderBy: orderByFn, where: whereFn } = fs);
  db = fb.db;
}

// ── Status display ─────────────────────────────────────────────────────────────
const STATUS_CFG: Record<MissionStatus, { icon: React.ElementType; color: string; label: string; spin?: boolean }> = {
  pending:     { icon: Clock,        color: "var(--text-secondary)", label: "Pending"     },
  in_progress: { icon: Loader2,      color: "var(--accent-teal)",    label: "In Progress", spin: true },
  paused:      { icon: PauseCircle,  color: "var(--accent-amber)",   label: "Paused"      },
  completed:   { icon: CheckCircle2, color: "var(--accent-green)",   label: "Completed"   },
  failed:      { icon: XCircle,      color: "var(--accent-red)",     label: "Failed"      },
};

function fmt(n: number) {
  if (!n) return "—";
  return "$" + n.toLocaleString();
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
  } catch { return "—"; }
}

const USER_ID = "demo-user";

export default function HistoryPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (USE_MOCKS) {
      const t = setTimeout(() => {
        setMissions(MOCK_MISSIONS);
        setLoading(false);
      }, 400);
      return () => clearTimeout(t);
    }

    const ref = collectionFn(db, "missions");
    const q = queryFn(
      ref,
      whereFn("user_id", "==", USER_ID),
      orderByFn("created_at", "desc")
    );
    const unsub: Unsubscribe = onSnapshotFn(
      q,
      (snap: any) => {
        setMissions(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Mission)));
        setLoading(false);
      },
      (err: any) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 ml-56 p-8 max-w-5xl">
        <header className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Mission History
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Every goal you&apos;ve handed to LifeGrid, and what happened.
          </p>
        </header>

        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-xl p-4 flex items-center gap-4"
                style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
              >
                <Skeleton className="h-4 flex-1" style={{ backgroundColor: "var(--bg-surface-raised)" }} />
                <Skeleton className="h-4 w-24" style={{ backgroundColor: "var(--bg-surface-raised)" }} />
                <Skeleton className="h-4 w-24" style={{ backgroundColor: "var(--bg-surface-raised)" }} />
                <Skeleton className="h-4 w-16" style={{ backgroundColor: "var(--bg-surface-raised)" }} />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div
            className="rounded-xl p-5 flex items-center gap-3"
            style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
          >
            <AlertTriangle size={16} style={{ color: "var(--accent-amber)" }} />
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {error}
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && missions.length === 0 && (
          <div
            className="rounded-xl p-12 flex flex-col items-center gap-4 text-center"
            style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
          >
            <Inbox size={32} style={{ color: "var(--text-secondary)", opacity: 0.4 }} />
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              No missions yet — launch your first one.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg"
              style={{ backgroundColor: "var(--accent-teal)", color: "var(--bg-base)" }}
            >
              Launch a mission
            </Link>
          </div>
        )}

        {/* Table */}
        {!loading && !error && missions.length > 0 && (
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
            {/* Column headers */}
            <div
              className="grid grid-cols-[1fr_130px_110px_120px_32px] gap-4 px-5 py-3 text-xs font-medium"
              style={{
                backgroundColor: "var(--bg-surface-raised)",
                color: "var(--text-secondary)",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              <span>Goal</span>
              <span>Status</span>
              <span>Date</span>
              <span>Budget</span>
              <span />
            </div>

            {missions.map((m, idx) => {
              const cfg = STATUS_CFG[m.status] ?? STATUS_CFG.pending;
              const Icon = cfg.icon;
              const isLast = idx === missions.length - 1;

              return (
                <Link
                  key={m.id}
                  href={`/missions/${m.id}`}
                  className="grid grid-cols-[1fr_130px_110px_120px_32px] gap-4 px-5 py-4 items-center transition-opacity hover:opacity-80 group"
                  style={{
                    backgroundColor: idx % 2 === 0 ? "var(--bg-surface)" : "var(--bg-surface-raised)",
                    borderBottom: !isLast ? "1px solid var(--border-subtle)" : undefined,
                  }}
                  aria-label={`Open mission: ${m.goal}`}
                >
                  {/* Goal */}
                  <span
                    className="text-sm truncate"
                    style={{ color: "var(--text-primary)" }}
                    title={m.goal}
                  >
                    {m.goal}
                  </span>

                  {/* Status */}
                  <span className="flex items-center gap-1.5">
                    <Icon
                      size={13}
                      style={{ color: cfg.color }}
                      className={cfg.spin ? "animate-spin" : ""}
                      aria-hidden
                    />
                    <span className="text-xs" style={{ color: cfg.color }}>
                      {cfg.label}
                    </span>
                  </span>

                  {/* Date */}
                  <span className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
                    {fmtDate(m.created_at)}
                  </span>

                  {/* Budget */}
                  <span className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
                    {m.budget_limit > 0
                      ? `${fmt(m.budget_used)} / ${fmt(m.budget_limit)}`
                      : "—"}
                  </span>

                  {/* Arrow */}
                  <ArrowRight
                    size={14}
                    style={{ color: "var(--text-secondary)" }}
                    className="group-hover:translate-x-0.5 transition-transform"
                    aria-hidden
                  />
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
