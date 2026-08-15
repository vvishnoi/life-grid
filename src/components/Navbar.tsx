'use client';

import React from 'react';
import { ShieldCheck, Cpu, Cloud, Sparkles, Layers, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export function Navbar() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-300 dark:border-slate-800/80 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 transition-colors">
      {/* Brand & Logo */}
      <div className="flex items-center space-x-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-cyan-500 to-emerald-400 p-[1px] shadow-lg shadow-indigo-500/20">
          <div className="w-full h-full bg-slate-900 dark:bg-slate-950 rounded-[11px] flex items-center justify-center">
            <Layers className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              LifeGrid
            </span>
            <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30">
              v2.5 Enterprise
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Autonomous AI Platform for Everyday Life</p>
        </div>
      </div>

      {/* Badges & Tech Stack */}
      <div className="flex items-center space-x-3 text-xs">
        {/* Hackathon Category Badge */}
        <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Fortified Enterprise Fleet</span>
        </div>

        {/* Gemini Engine */}
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-800 dark:text-cyan-300 font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span>Gemini 3.5 Pro</span>
        </div>

        {/* Google Cloud Run */}
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-800 dark:text-indigo-300 font-semibold">
          <Cloud className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Cloud Run & Firestore</span>
        </div>

        {/* Model Armor Status */}
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-800 dark:text-purple-300 font-semibold">
          <Cpu className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>Model Armor Active</span>
        </div>

        {/* Theme Selector Toggle */}
        <div className="flex items-center p-1 rounded-xl bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 space-x-1">
          <button
            onClick={() => setTheme('light')}
            className={`p-1.5 rounded-lg transition-all ${
              theme === 'light'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Light Theme"
          >
            <Sun className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`p-1.5 rounded-lg transition-all ${
              theme === 'dark'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="Dark Theme"
          >
            <Moon className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTheme('system')}
            className={`p-1.5 rounded-lg transition-all ${
              theme === 'system'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title="System Theme (Default)"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
