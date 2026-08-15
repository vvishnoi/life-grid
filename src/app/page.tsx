'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { GoalInputSection } from '@/components/GoalInputSection';
import { AgentRegistryView } from '@/components/AgentRegistryView';
import { TelemetryConsole } from '@/components/TelemetryConsole';
import { ApprovalCenterModal } from '@/components/ApprovalCenterModal';
import { MemoryBankView } from '@/components/MemoryBankView';
import { ENTERPRISE_AGENT_REGISTRY } from '@/lib/agents/registry';
import { TelemetryLog, ApprovalItem, MemoryItem, AgentInfo } from '@/lib/types';
import { ShieldCheck, Database, Activity } from 'lucide-react';

export default function LifeGridDashboard() {
  const [agents] = useState<AgentInfo[]>(ENTERPRISE_AGENT_REGISTRY);
  const [activeAgentId, setActiveAgentId] = useState<string | undefined>(undefined);
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalItem[]>([]);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'telemetry' | 'registry' | 'memory'>('telemetry');

  // Load initial memories
  useEffect(() => {
    fetch('/api/memory')
      .then(res => res.json())
      .then(data => {
        if (data.success) setMemories(data.memories);
      })
      .catch(err => console.warn('Memory bank load:', err));
  }, []);

  const handleLaunchGoal = async (prompt: string, budgetCap: number, scenarioId?: string) => {
    setIsRunning(true);
    setLogs([]);
    setPendingApprovals([]);
    setActiveAgentId('orchestrator');

    try {
      const response = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customPrompt: prompt, budgetCap, scenarioId })
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

  const handleApproveAction = async (id: string) => {
    const item = pendingApprovals.find(a => a.id === id);
    if (!item) return;

    setPendingApprovals(prev => prev.filter(a => a.id !== id));
    setLogs(prev => [
      {
        id: `log-app-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        agentId: item.agentId,
        agentName: item.agentName,
        type: 'execution_success',
        message: `USER APPROVED: Authorization granted for "${item.title}" ($${item.amount.toLocaleString()}). Transaction completed successfully.`,
        riskLevel: 'low'
      },
      ...prev
    ]);

    await fetch('/api/approvals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvalId: id, action: 'approve' })
    });
  };

  const handleRejectAction = async (id: string) => {
    const item = pendingApprovals.find(a => a.id === id);
    if (!item) return;

    setPendingApprovals(prev => prev.filter(a => a.id !== id));
    setLogs(prev => [
      {
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
      body: JSON.stringify({ approvalId: id, action: 'reject' })
    });
  };

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
