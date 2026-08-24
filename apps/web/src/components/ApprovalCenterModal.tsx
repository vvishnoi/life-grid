'use client';

import React from 'react';
import { ApprovalItem } from '@lifegrid/agent/client';
import { ShieldAlert, Check, X, Building2 } from 'lucide-react';

interface ApprovalCenterModalProps {
  items: ApprovalItem[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function ApprovalCenterModal({ items, onApprove, onReject }: ApprovalCenterModalProps) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-xl border border-warn/30 bg-warn-soft p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-warn shrink-0" />
        <p className="text-sm font-medium text-ink">
          {items.length} {items.length > 1 ? 'things need' : 'thing needs'} your OK before continuing
        </p>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg bg-surface border border-border p-3.5 space-y-2.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[11px] text-muted">{item.agentName}</span>
                <h4 className="text-sm font-medium text-ink leading-snug">{item.title}</h4>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-semibold text-ink tabular-nums">${item.amount.toLocaleString()}</div>
              </div>
            </div>

            <p className="text-xs text-muted leading-relaxed">{item.summary}</p>

            <div className="flex items-center gap-1.5 text-[11px] text-muted">
              <Building2 className="w-3 h-3" />
              <span>{item.vendor || 'Vendor'}</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => onReject(item.id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-danger hover:bg-danger-soft transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Decline</span>
              </button>
              <button
                onClick={() => onApprove(item.id)}
                className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-medium bg-accent text-accent-ink hover:opacity-90 transition-opacity"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
