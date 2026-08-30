'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sidebar, type View } from '@/components/Sidebar';
import { LifeGridLogo } from '@/components/LifeGridLogo';
import { BottomTabBar } from '@/components/BottomTabBar';
import { GoalInputSection } from '@/components/GoalInputSection';
import { AgentRegistryView } from '@/components/AgentRegistryView';
import { TelemetryConsole } from '@/components/TelemetryConsole';
import { ActivityHistory, type PastRun } from '@/components/ActivityHistory';
import { ApprovalCenterModal } from '@/components/ApprovalCenterModal';
import { MemoryBankView } from '@/components/MemoryBankView';
import { SettingsView } from '@/components/SettingsView';
import { ENTERPRISE_AGENT_REGISTRY, TelemetryLog, ApprovalItem, MemoryItem, AgentInfo, geminiModel } from '@lifegrid/agent/client';
import { consumeOrchestrationStream } from '@/lib/adk-client';
import type { OrchestrationMode } from '@/components/GoalInputSection';

// Cost control (docs/COST_OPTIMIZATION.md #7): only matters once
// DEMO_API_KEY is set server-side for a public deploy. NEXT_PUBLIC_ vars
// are bundled into client JS, so this is a "keep casual bots off the paid
// endpoint" gate, not real secrecy — anyone can read it from the bundle.
const LIVE_MODE_HEADERS: HeadersInit = {
  'Content-Type': 'application/json',
  ...(process.env.NEXT_PUBLIC_DEMO_API_KEY ? { 'x-demo-key': process.env.NEXT_PUBLIC_DEMO_API_KEY } : {}),
};

// A non-2xx /api/orchestrate or /api/approvals response is a plain JSON
// error body, not an SSE stream — consumeOrchestrationStream would just
// silently find no "data:" lines to parse and return having done nothing,
// which looked exactly like "live mode does nothing" with no explanation
// (confirmed live 2026-08-29: the real cause was a missing demo-key header,
// but ANY failed request would have looked identical without this check).
async function describeFailedResponse(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (data?.error) return data.error as string;
  } catch {
    // body wasn't JSON — fall through to the status line below
  }
  return `${response.status} ${response.statusText}`;
}

export default function LifeGridDashboard() {
  const [agents] = useState<AgentInfo[]>(ENTERPRISE_AGENT_REGISTRY);
  const [activeAgentId, setActiveAgentId] = useState<string | undefined>(undefined);
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalItem[]>([]);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [view, setView] = useState<View>('new');
  const [pastRuns, setPastRuns] = useState<PastRun[]>([]);
  // Which model Live mode runs use — persisted like pastRuns below.
  // Defaults to the cheap Lite tier, not Auto, so a first-time user's
  // spend stays predictable until they opt into something else.
  const [model, setModel] = useState<string>(geminiModel);
  // What the *current* run's goal/mode was, so it can be archived into
  // pastRuns once the next run starts and overwrites `logs`. A ref, not
  // state — purely bookkeeping for the next handleLaunchGoal call, doesn't
  // need to trigger a render on its own.
  const currentRunMetaRef = useRef<{ goal: string; mode: OrchestrationMode; startedAt: string } | null>(null);
  // Set only while a live (real ADK) run's session is active — its presence
  // is how approve/reject decide whether to resume a real paused agent run
  // versus just acknowledging a scripted-mode approval card.
  const [liveSessionId, setLiveSessionId] = useState<string | undefined>(undefined);

  // Batched-approval bookkeeping (live mode only — see ApprovalItem.batchId
  // and src/app/api/approvals/route.ts). Refs, not state: every approval
  // card's full batch membership and the decisions collected so far need to
  // survive individual cards being removed from `pendingApprovals` one at a
  // time as the user clicks through them, without triggering re-renders.
  const batchMembersRef = useRef<Record<string, Set<string>>>({});
  const batchDecisionsRef = useRef<Record<string, 'approve' | 'reject'>>({});
  // Full item details per functionCallId, so the finish line
  // (api/approvals/route.ts) can build the final summary from what was
  // actually approved without re-running the agent pipeline. A ref for the
  // same reason as the two above — items are removed from `pendingApprovals`
  // as each card is clicked, before the whole batch is complete.
  const batchItemDetailsRef = useRef<Record<string, ApprovalItem>>({});

  // Load initial memories
  useEffect(() => {
    fetch('/api/memory')
      .then(res => res.json())
      .then(data => {
        if (data.success) setMemories(data.memories);
      })
      .catch(err => console.warn('Memory bank load:', err));
  }, []);

  // Past runs live in localStorage — browser/device-local, not synced
  // anywhere, but enough to let you check back on earlier requests without
  // adding a backend history store.
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lifegrid_past_runs');
      if (saved) setPastRuns(JSON.parse(saved));
    } catch (err) {
      console.warn('Past runs load:', err);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('lifegrid_past_runs', JSON.stringify(pastRuns));
    } catch (err) {
      console.warn('Past runs save:', err);
    }
  }, [pastRuns]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('lifegrid_model');
      if (saved) setModel(saved);
    } catch (err) {
      console.warn('Model preference load:', err);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('lifegrid_model', model);
    } catch (err) {
      console.warn('Model preference save:', err);
    }
  }, [model]);

  // Records a newly-arrived approval card's batch membership (see
  // ApprovalItem.batchId) before adding it to visible pendingApprovals.
  const registerApprovalBatch = (item: ApprovalItem) => {
    batchItemDetailsRef.current[item.id] = item;
    if (!item.batchId) return;
    if (!batchMembersRef.current[item.batchId]) batchMembersRef.current[item.batchId] = new Set();
    batchMembersRef.current[item.batchId].add(item.id);
  };

  const handleLaunchGoal = async (prompt: string, budgetCap: number, scenarioId: string | undefined, mode: OrchestrationMode) => {
    // Archive the run that's about to be overwritten (if any) so it shows
    // up under "Past activity" instead of just disappearing.
    if (logs.length > 0 && currentRunMetaRef.current) {
      const finalLog = logs.find((l) => l.type === 'execution_success');
      const archived: PastRun = {
        id: `run-${Date.now()}`,
        goal: currentRunMetaRef.current.goal,
        mode: currentRunMetaRef.current.mode,
        startedAt: currentRunMetaRef.current.startedAt,
        finished: Boolean(finalLog),
        finalMessage: finalLog?.message,
        logs,
      };
      setPastRuns((prev) => [archived, ...prev].slice(0, 20));
    }
    currentRunMetaRef.current = { goal: prompt, mode, startedAt: new Date().toLocaleTimeString() };

    setIsRunning(true);
    setView('activity');
    setLogs([]);
    setPendingApprovals([]);
    setLiveSessionId(undefined);
    batchMembersRef.current = {};
    batchDecisionsRef.current = {};
    batchItemDetailsRef.current = {};
    setActiveAgentId('orchestrator');

    if (mode === 'live') {
      try {
        const response = await fetch('/api/orchestrate', {
          method: 'POST',
          headers: LIVE_MODE_HEADERS,
          body: JSON.stringify({ customPrompt: prompt, budgetCap, scenarioId, mode: 'live', model })
        });

        if (!response.ok) {
          const message = await describeFailedResponse(response);
          setLogs(prev => [
            {
              id: `log-err-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString(),
              agentId: 'orchestrator',
              agentName: 'Goal Orchestrator',
              type: 'error',
              message: `Couldn't start this run: ${message}`,
              riskLevel: 'high'
            },
            ...prev
          ]);
          return;
        }

        await consumeOrchestrationStream(response, {
          onSessionId: (sessionId) => setLiveSessionId(sessionId),
          onLog: (log) => {
            setActiveAgentId(log.agentId);
            setLogs(prev => [log, ...prev]);
            if (log.type === 'approval_required' && log.approvalItem) {
              registerApprovalBatch(log.approvalItem);
              setPendingApprovals(prev => [...prev, log.approvalItem as ApprovalItem]);
            }
            if (log.type === 'memory_update' && log.metadata?.memory) {
              setMemories(prev => [log.metadata!.memory as MemoryItem, ...prev]);
            }
          },
          onError: (message) => {
            setLogs(prev => [
              {
                id: `log-err-${Date.now()}`,
                timestamp: new Date().toLocaleTimeString(),
                agentId: 'orchestrator',
                agentName: 'Goal Orchestrator',
                type: 'error',
                message: `Execution Error: ${message}`,
                riskLevel: 'high'
              },
              ...prev
            ]);
          }
        });
      } finally {
        setIsRunning(false);
        setActiveAgentId(undefined);
      }
      return;
    }

    // Scripted branch — unchanged replay of a canned scenario.
    try {
      const response = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customPrompt: prompt, budgetCap, scenarioId, mode: 'scripted' })
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      const steps = data.steps || [];
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        setActiveAgentId(step.agentId);

        await new Promise(resolve => setTimeout(resolve, step.delayMs || 700));

        const newLog: TelemetryLog = {
          id: `log-${Date.now()}-${i}`,
          timestamp: new Date().toLocaleTimeString(),
          agentId: step.agentId,
          agentName: step.agentName,
          type: step.type,
          message: step.message,
          riskLevel: step.riskLevel,
          threatDetected: step.threatDetected
        };

        setLogs(prev => [newLog, ...prev]);

        if (step.approvalItem) {
          const approvalObj: ApprovalItem = {
            ...step.approvalItem,
            id: `app-${Date.now()}-${i}`,
            goalId: 'goal-denver-1',
            status: 'pending',
            timestamp: new Date().toLocaleTimeString()
          };
          setPendingApprovals(prev => [...prev, approvalObj]);
        }
      }
    } catch (err: any) {
      setLogs(prev => [
        {
          id: `log-err-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          agentId: 'orchestrator',
          agentName: 'Goal Orchestrator',
          type: 'security_alert',
          message: `Execution Error: ${err.message}`,
          riskLevel: 'high'
        },
        ...prev
      ]);
    } finally {
      setIsRunning(false);
      setActiveAgentId(undefined);
    }
  };

  const resolveApproval = async (id: string, action: 'approve' | 'reject') => {
    const item = pendingApprovals.find(a => a.id === id);
    if (!item) return;

    setPendingApprovals(prev => prev.filter(a => a.id !== id));

    if (liveSessionId) {
      // id is the ADK adk_request_confirmation functionCallId the
      // event-mapper stashed as ApprovalItem.id. Record this card's
      // decision, but only actually resume once every card from the same
      // batchId has been decided — Gemini requires all function calls from
      // one model turn to get responses together (see api/approvals/route.ts).
      batchDecisionsRef.current[id] = action;

      const batchId = item.batchId;
      const members = batchId ? batchMembersRef.current[batchId] : undefined;
      const allDecided = members ? Array.from(members).every((memberId) => batchDecisionsRef.current[memberId] !== undefined) : true;
      if (!allDecided) return;

      const decisions = (members ? Array.from(members) : [id]).map((functionCallId) => {
        const detail = batchItemDetailsRef.current[functionCallId];
        return {
          functionCallId,
          action: batchDecisionsRef.current[functionCallId],
          title: detail?.title ?? 'Untitled action',
          amount: detail?.amount ?? 0,
          actionType: detail?.actionType ?? 'budget_override',
          vendor: detail?.vendor,
        };
      });
      if (batchId) {
        delete batchMembersRef.current[batchId];
        for (const d of decisions) {
          delete batchDecisionsRef.current[d.functionCallId];
          delete batchItemDetailsRef.current[d.functionCallId];
        }
      }

      // The approval banner shows on every tab, not just Activity — jump
      // there now so the final summary that's about to arrive is actually
      // visible, instead of landing silently in state on a tab that isn't
      // rendering the log feed.
      setView('activity');

      const response = await fetch('/api/approvals', {
        method: 'POST',
        headers: LIVE_MODE_HEADERS,
        body: JSON.stringify({ sessionId: liveSessionId, decisions })
      });

      setIsRunning(true);
      try {
        if (!response.ok) {
          const message = await describeFailedResponse(response);
          setLogs(prev => [
            {
              id: `log-err-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString(),
              agentId: 'finance-agent',
              agentName: 'Finance & Budget Agent',
              type: 'error',
              message: `Your decision was recorded, but the final write-up failed: ${message}`,
              riskLevel: 'high'
            },
            ...prev
          ]);
          return;
        }
        await consumeOrchestrationStream(response, {
          onLog: (log) => {
            setActiveAgentId(log.agentId);
            setLogs(prev => [log, ...prev]);
            if (log.type === 'approval_required' && log.approvalItem) {
              registerApprovalBatch(log.approvalItem);
              setPendingApprovals(prev => [...prev, log.approvalItem as ApprovalItem]);
            }
            if (log.type === 'memory_update' && log.metadata?.memory) {
              setMemories(prev => [log.metadata!.memory as MemoryItem, ...prev]);
            }
          }
        });
      } finally {
        setIsRunning(false);
        setActiveAgentId(undefined);
      }
      return;
    }

    // Scripted mode: no real run to resume, just log the decision. Not
    // 'execution_success' — that type is reserved for the one real final
    // plan (already posted earlier in this same canned run); tagging a
    // small per-item "transaction completed" note the same way let it
    // overwrite the actual trip summary in the pinned "Your plan is ready"
    // card, since that card just shows the most recent execution_success.
    setLogs(prev => [
      action === 'approve'
        ? {
            id: `log-app-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            agentId: item.agentId,
            agentName: item.agentName,
            type: 'thought',
            message: `USER APPROVED: Authorization granted for "${item.title}" ($${item.amount.toLocaleString()}). Transaction completed successfully.`,
            riskLevel: 'low'
          }
        : {
            id: `log-rej-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            agentId: item.agentId,
            agentName: item.agentName,
            type: 'thought',
            message: `USER REJECTED: "${item.title}" ($${item.amount.toLocaleString()}). Re-routing agent strategy for alternative option.`,
            riskLevel: 'medium'
          },
      ...prev
    ]);

    await fetch('/api/approvals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvalId: id, action })
    });
  };

  const handleApproveAction = (id: string) => resolveApproval(id, 'approve');
  const handleRejectAction = (id: string) => resolveApproval(id, 'reject');

  const handleAddMemory = async (newMemory: Omit<MemoryItem, 'id' | 'updatedAt'>) => {
    const res = await fetch('/api/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMemory)
    });
    const data = await res.json();
    if (data.success) {
      setMemories(prev => [data.memory, ...prev]);
    }
  };

  const handleDeleteMemory = (id: string) => {
    setMemories(prev => prev.filter(m => m.id !== id));
  };

  const VIEW_COPY: Record<View, { title: string; subtitle: string }> = {
    new: { title: 'New request', subtitle: 'Tell LifeGrid what you need done.' },
    activity: { title: 'Activity', subtitle: "What's happening right now, step by step." },
    agents: { title: 'Agents', subtitle: 'The specialists LifeGrid can call on, and what each is allowed to do.' },
    memory: { title: 'Memory', subtitle: 'What LifeGrid remembers about you.' },
    settings: { title: 'Settings', subtitle: 'Configure the model LifeGrid uses and your connected accounts.' },
  };
  const { title, subtitle } = VIEW_COPY[view];
  const containerWidth = view === 'agents' ? 'max-w-5xl' : 'max-w-3xl';

  return (
    <div className="min-h-screen bg-bg text-ink flex transition-colors duration-200">
      <Sidebar
        view={view}
        onNavigate={setView}
        activityCount={logs.length}
        agentCount={agents.length}
        memoryCount={memories.length}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-30 flex items-center gap-2.5 px-4 py-3 border-b border-border bg-surface">
          <LifeGridLogo />
          <span className="font-semibold text-sm">LifeGrid</span>
        </div>

        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className={`${containerWidth} mx-auto px-5 sm:px-8 py-8 sm:py-10 space-y-8 transition-[max-width]`}>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              <p className="text-sm text-muted mt-1">{subtitle}</p>
            </div>

            {pendingApprovals.length > 0 && (
              <ApprovalCenterModal
                items={pendingApprovals}
                onApprove={handleApproveAction}
                onReject={handleRejectAction}
              />
            )}

            {view === 'new' && <GoalInputSection onLaunchGoal={handleLaunchGoal} isRunning={isRunning} />}
            {view === 'activity' && (
              <>
                <TelemetryConsole logs={logs} isRunning={isRunning} />
                <ActivityHistory runs={pastRuns} />
              </>
            )}
            {view === 'agents' && <AgentRegistryView agents={agents} activeAgentId={activeAgentId} />}
            {view === 'memory' && (
              <MemoryBankView memories={memories} onAddMemory={handleAddMemory} onDeleteMemory={handleDeleteMemory} />
            )}
            {view === 'settings' && <SettingsView model={model} onModelChange={setModel} />}
          </div>
        </main>
      </div>

      <BottomTabBar view={view} onNavigate={setView} />
    </div>
  );
}
