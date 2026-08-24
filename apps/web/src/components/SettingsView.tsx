'use client';

import React from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { AVAILABLE_MODELS, AUTO_MODEL, geminiModel } from '@lifegrid/agent/client';
import { Sun, Moon, Monitor, CalendarCheck, LogOut, Sparkles, Check } from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface SettingsViewProps {
  model: string;
  onModelChange: (model: string) => void;
}

const THEME_OPTIONS = [
  { id: 'light' as const, icon: Sun, label: 'Light' },
  { id: 'dark' as const, icon: Moon, label: 'Dark' },
  { id: 'system' as const, icon: Monitor, label: 'Match system' },
];

export function SettingsView({ model, onModelChange }: SettingsViewProps) {
  const { theme, setTheme } = useTheme();
  const { data: session, status } = useSession();

  return (
    <div className="space-y-8">
      {/* Model picker */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">AI model (Live mode)</h2>
          <p className="text-xs text-muted mt-0.5">
            Which Gemini model LifeGrid&apos;s agents use when you run in Live mode. Scripted demos don&apos;t call a model, so this has no effect there.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => onModelChange(AUTO_MODEL)}
            className={`text-left p-4 rounded-xl border transition-colors ${
              model === AUTO_MODEL ? 'border-accent bg-accent-soft' : 'border-border bg-surface hover:bg-surface-2'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" />
                <span className="text-sm font-medium text-ink">Auto</span>
              </div>
              {model === AUTO_MODEL && <Check className="w-3.5 h-3.5 text-accent shrink-0" />}
            </div>
            <p className="text-[11px] font-mono text-muted/80 mt-1">currently → {geminiModel}</p>
            <p className="text-xs text-muted mt-1.5">Let LifeGrid pick each agent&apos;s default model for you.</p>
          </button>

          {AVAILABLE_MODELS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onModelChange(opt.id)}
              className={`text-left p-4 rounded-xl border transition-colors ${
                model === opt.id ? 'border-accent bg-accent-soft' : 'border-border bg-surface hover:bg-surface-2'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-ink">{opt.label}</span>
                {model === opt.id && <Check className="w-3.5 h-3.5 text-accent shrink-0" />}
              </div>
              <p className="text-[11px] font-mono text-muted/80 mt-1">{opt.id}</p>
              <p className="text-xs text-muted mt-1.5">{opt.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Google Calendar */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">Google Calendar</h2>
          <p className="text-xs text-muted mt-0.5">
            Connect so CalendarAgent can check your real schedule in Live mode, instead of a simulated one.
          </p>
        </div>

        {status === 'authenticated' ? (
          <button
            onClick={() => signOut()}
            className="w-full sm:w-auto flex items-center gap-2.5 px-4 py-3 rounded-xl border border-border bg-surface text-sm hover:bg-surface-2 transition-colors"
          >
            <CalendarCheck className="w-4 h-4 text-success shrink-0" />
            <span className="flex-1 text-left truncate">Connected as {session?.user?.email ?? 'your Google account'}</span>
            <LogOut className="w-3.5 h-3.5 opacity-50 shrink-0" />
          </button>
        ) : (
          <button
            onClick={() => signIn('google')}
            className="w-full sm:w-auto flex items-center gap-2.5 px-4 py-3 rounded-xl border border-border bg-surface text-sm hover:bg-surface-2 transition-colors"
          >
            <CalendarCheck className="w-4 h-4 shrink-0" />
            <span>Connect Google Calendar</span>
          </button>
        )}
      </section>

      {/* Appearance */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">Appearance</h2>
          <p className="text-xs text-muted mt-0.5">Choose a theme, or follow your device&apos;s setting.</p>
        </div>

        <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-surface-2 border border-border">
          {THEME_OPTIONS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setTheme(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                theme === id ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
