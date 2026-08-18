'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { GoalInputSection } from '@/components/GoalInputSection';
import { AgentRegistryView } from '@/components/AgentRegistryView';
import { TelemetryConsole } from '@/components/TelemetryConsole';
import { ApprovalCenterModal } from '@/components/ApprovalCenterModal';
import { MemoryBankView } from '@/components/MemoryBankView';
import { ENTERPRISE_AGENT_REGISTRY } from '@/lib/agents/registry';
import { TelemetryLog, ApprovalItem, MemoryItem, AgentInfo } from '@/lib/types';
import { consumeOrchestrationStream } from '@/lib/adk-client';
import type { OrchestrationMode } from '@/components/GoalInputSection';
import { ShieldCheck, Database, Activity } from 'lucide-react';

// Cost control (docs/COST_OPTIMIZATION.md #7): only matters once
// DEMO_API_KEY is set server-side for a public deploy. NEXT_PUBLIC_ vars
// are bundled into client JS, so this is a "keep casual bots off the paid
// endpoint" gate, not real secrecy — anyone can read it from the bundle.
const LIVE_MODE_HEADERS: HeadersInit = {
  'Content-Type': 'application/json',
  ...(process.env.NEXT_PUBLIC_DEMO_API_KEY ? { 'x-demo-key': process.env.NEXT_PUBLIC_DEMO_API_KEY } : {}),
};

export default function LifeGridDashboard() {
  const [agents] = useState<AgentInfo[]>(ENTERPRISE_AGENT_REGISTRY);
  const [activeAgentId, setActiveAgentId] = useState<string | undefined>(undefined);
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalItem[]>([]);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'telemetry' | 'registry' | 'memory'>('telemetry');
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

  // Load initial memories
  useEffect(() => {
    fetch('/api/memory')
      .then(res => res.json())
      .then(data => {
        if (data.success) setMemories(data.memories);
      })
      .catch(err => console.warn('Memory bank load:', err));
  }, []);

  // Records a newly-arrived approval card's batch membership (see
  // ApprovalItem.batchId) before adding it to visible pendingApprovals.
  const registerApprovalBatch = (item: ApprovalItem) => {
    if (!item.batchId) return;
    if (!batchMembersRef.current[item.batchId]) batchMembersRef.current[item.batchId] = new Set();
    batchMembersRef.current[item.batchId].add(item.id);
  };

  const handleLaunchGoal = async (prompt: string, budgetCap: number, scenarioId: string | undefined, mode: OrchestrationMode) => {
    setIsRunning(true);
    setLogs([]);
    setPendingApprovals([]);
    setLiveSessionId(undefined);
    batchMembersRef.current = {};
    batchDecisionsRef.current = {};
    setActiveAgentId('orchestrator');

    if (mode === 'live') {
      try {
        const response = await fetch('/api/orchestrate', {
          method: 'POST',
          headers: LIVE_MODE_HEADERS,
          body: JSON.stringify({ customPrompt: prompt, budgetCap, scenarioId, mode: 'live' })
        });

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

      const decisions = (members ? Array.from(members) : [id]).map((functionCallId) => ({
        functionCallId,
        action: batchDecisionsRef.current[functionCallId],
      }));
      if (batchId) {
        delete batchMembersRef.current[batchId];
        for (const d of decisions) delete batchDecisionsRef.current[d.functionCallId];
      }

      const response = await fetch('/api/approvals', {
        method: 'POST',
        headers: LIVE_MODE_HEADERS,
        body: JSON.stringify({ sessionId: liveSessionId, decisions })
      });

      setIsRunning(true);
      try {
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

    // Scripted mode: no real run to resume, just log the decision.
    setLogs(prev => [
      action === 'approve'
        ? {
            id: `log-app-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            agentId: item.agentId,
            agentName: item.agentName,
            type: 'execution_success',
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

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#07090e] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Navbar Header */}
      <Navbar />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Goal Launch & Input Section */}
        <GoalInputSection onLaunchGoal={handleLaunchGoal} isRunning={isRunning} />

        {/* Approval Center (Human in the loop safeguard) */}
        <ApprovalCenterModal
          items={pendingApprovals}
          onApprove={handleApproveAction}
          onReject={handleRejectAction}
        />

        {/* Workspace Navigation Tabs */}
        <div className="flex items-center space-x-2 border-b border-slate-300 dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'telemetry'
                ? 'bg-indigo-600/25 text-indigo-800 dark:text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-900/50'
            }`}
          >
            <Activity className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>Telemetry Stream ({logs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('registry')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'registry'
                ? 'bg-indigo-600/25 text-indigo-800 dark:text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-900/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Agent Directory ({agents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('memory')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'memory'
                ? 'bg-indigo-600/25 text-indigo-800 dark:text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-900/50'
            }`}
          >
            <Database className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Memory Bank ({memories.length})</span>
          </button>
        </div>

        {/* Tab Panel Content */}
        <div>
          {activeTab === 'telemetry' && <TelemetryConsole logs={logs} />}
          {activeTab === 'registry' && (
            <AgentRegistryView agents={agents} activeAgentId={activeAgentId} />
          )}
          {activeTab === 'memory' && (
            <MemoryBankView
              memories={memories}
              onAddMemory={handleAddMemory}
              onDeleteMemory={handleDeleteMemory}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-300 dark:border-slate-800/80 py-4 px-6 text-center text-xs text-slate-600 dark:text-slate-400 font-medium">
        LifeGrid Autonomous AI Platform • Built for Google Gemini & Cloud Run Fortified Enterprise Fleet
      </footer>
    </div>
  );
}
