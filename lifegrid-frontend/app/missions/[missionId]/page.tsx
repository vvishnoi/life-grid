"use client";
import { use } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { MissionHeader } from "@/components/MissionHeader";
import { AgentStatusCard, AgentStatusCardSkeleton } from "@/components/AgentStatusCard";
import { ApprovalCard } from "@/components/ApprovalCard";
import { MissionTimeline } from "@/components/MissionTimeline";
import { useMission } from "@/hooks/useMission";
import { useMissionTasks } from "@/hooks/useMissionTasks";
import { useMissionApprovals } from "@/hooks/useMissionApprovals";
import { decideApproval } from "@/lib/api";
import { ALL_AGENTS } from "@/lib/types";
import { AlertTriangle, Clock, LayoutGrid } from "lucide-react";

interface Props {
  params: Promise<{ missionId: string }>;
}

export default function MissionPage({ params }: Props) {
  const { missionId } = use(params);
  const { mission, loading: mLoading, error: mError } = useMission(missionId);
  const { tasks, loading: tLoading } = useMissionTasks(missionId);
  const { pendingApprovals, loading: aLoading } = useMissionApprovals(missionId);

  // Mission not found (after load completes)
  if (!mLoading && !mError && !mission) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-56 flex items-center justify-center p-8">
          <div className="text-center space-y-4 max-w-sm">
            <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              Mission not found
            </p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              This mission doesn&apos;t exist or hasn&apos;t started yet.
            </p>
            <Link
              href="/"
              className="inline-block text-sm font-medium hover:underline"
              style={{ color: "var(--accent-teal)" }}
            >
              ← Back to home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Firestore error
  if (mError) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-56 flex items-center justify-center p-8">
          <div className="text-center space-y-3 max-w-sm">
            <AlertTriangle size={28} className="mx-auto" style={{ color: "var(--accent-red)" }} />
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{mError}</p>
            <Link href="/" className="text-sm font-medium hover:underline" style={{ color: "var(--accent-teal)" }}>
              ← Back to home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  async function handleDecision(approvalId: string, approved: boolean) {
    await decideApproval(approvalId, approved);
  }

  const hasPending = !aLoading && pendingApprovals.length > 0;

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 ml-56 p-8 space-y-8 max-w-6xl">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <MissionHeader mission={mission} loading={mLoading} />

        {/* ── Pending approvals banner ────────────────────────────────────── */}
        {hasPending && (
          <section aria-label="Pending approvals">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={14} style={{ color: "var(--accent-amber)" }} aria-hidden />
              <h2 className="text-sm font-semibold" style={{ color: "var(--accent-amber)" }}>
                {pendingApprovals.length} pending approval
                {pendingApprovals.length !== 1 ? "s" : ""}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pendingApprovals.map((a) => (
                <ApprovalCard key={a.id} approval={a} onDecision={handleDecision} />
              ))}
            </div>
          </section>
        )}

        {/* ── Agent grid ─────────────────────────────────────────────────── */}
        <section aria-label="Agent status">
          <div className="flex items-center gap-2 mb-4">
            <LayoutGrid size={14} style={{ color: "var(--text-secondary)" }} aria-hidden />
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
              Agents
            </h2>
          </div>

          {tLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {ALL_AGENTS.map((a) => <AgentStatusCardSkeleton key={a} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {ALL_AGENTS.map((agentId) => (
                <AgentStatusCard
                  key={agentId}
                  agent={agentId}
                  tasks={tasks.filter((t) => t.agent === agentId)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Timeline ───────────────────────────────────────────────────── */}
        <section
          className="rounded-xl p-5"
          style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
          aria-label="Mission timeline"
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock size={14} style={{ color: "var(--text-secondary)" }} aria-hidden />
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
              Timeline
            </h2>
          </div>
          <MissionTimeline tasks={tasks} loading={tLoading} />
        </section>
      </main>
    </div>
  );
}
