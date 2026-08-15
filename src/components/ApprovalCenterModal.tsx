'use client';

import React from 'react';
import { ApprovalItem } from '@/lib/types';
import { ShieldAlert, Check, X, AlertCircle, Building2 } from 'lucide-react';

interface ApprovalCenterModalProps {
  items: ApprovalItem[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function ApprovalCenterModal({ items, onApprove, onReject }: ApprovalCenterModalProps) {
  if (items.length === 0) return null;

  return (
    <div className="glass-panel rounded-2xl p-5 border border-amber-500/40 bg-amber-500/10 dark:bg-amber-950/20 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">Approval Center (Human-in-the-Loop)</h3>
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300/80">
              {items.length} Action{items.length > 1 ? 's' : ''} require your explicit consent before lock-in.
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/30">
          Policy Engine Safeguard
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="glass-card rounded-xl p-4 space-y-3 border border-amber-500/40 bg-white dark:bg-slate-900/80 hover:border-amber-500"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-400 px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30">
                  {item.agentName}
                </span>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-1">{item.title}</h4>
              </div>
              <div className="text-right">
                <div className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                  ${item.amount.toLocaleString()}
                </div>
                <span className="text-[10px] font-bold text-slate-500">USD</span>
              </div>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{item.summary}</p>

            <div className="flex items-center space-x-4 text-[11px] text-slate-600 dark:text-slate-400 font-semibold pt-1">
              <span className="flex items-center space-x-1">
                <Building2 className="w-3.5 h-3.5" />
                <span>{item.vendor || 'Merchant'}</span>
              </span>
              <span className="flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Risk Score: {item.riskScore}/100</span>
              </span>
            </div>

            <div className="pt-3 border-t border-slate-300 dark:border-slate-800 flex items-center justify-end space-x-2">
              <button
                onClick={() => onReject(item.id)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 border border-rose-500/30 transition-all"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reject Action</span>
              </button>
              <button
                onClick={() => onApprove(item.id)}
                className="flex items-center space-x-1 px-4 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-md shadow-emerald-500/20 transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve & Spend</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
