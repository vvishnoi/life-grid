"use client";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { USE_MOCKS } from "@/lib/api";
import { MOCK_PREFERENCES } from "@/lib/mockData";
import type { Preference } from "@/lib/types";
import { Brain, RefreshCw, Info } from "lucide-react";

// ── Firestore (only when not mocking) ─────────────────────────────────────────
let collectionFn: Function, onSnapshotFn: Function;
let db: any;

if (!USE_MOCKS) {
  const fs = require("firebase/firestore");
  const fb = require("@/lib/firebase");
  ({ collection: collectionFn, onSnapshot: onSnapshotFn } = fs);
  db = fb.db;
}

function groupByTopic(prefs: Preference[]): Record<string, Preference[]> {
  return prefs.reduce<Record<string, Preference[]>>((acc, p) => {
    (acc[p.topic] ??= []).push(p);
    return acc;
  }, {});
}

const USER_ID = "demo-user";

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<Preference[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);

  function load() {
    setLoading(true);

    if (USE_MOCKS) {
      const t = setTimeout(() => {
        setPrefs(MOCK_PREFERENCES);
        setIsMock(true);
        setLoading(false);
      }, 350);
      return () => clearTimeout(t);
    }

    const ref = collectionFn(db, "memory", USER_ID, "preferences");
    const unsub = onSnapshotFn(
      ref,
      (snap: any) => {
        setPrefs(snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Preference)));
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grouped = groupByTopic(prefs);

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 ml-56 p-8 max-w-4xl">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              Preferences
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              What LifeGrid has learned about you. Used automatically on every mission.
            </p>
          </div>
          <button
            onClick={() => load()}
            aria-label="Refresh preferences"
            className="p-2 rounded-lg transition-opacity hover:opacity-70"
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-secondary)",
            }}
          >
            <RefreshCw size={14} />
          </button>
        </header>

        {/* Mock notice */}
        {isMock && !loading && (
          <div
            className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg mb-6"
            style={{
              backgroundColor: "rgba(139,124,246,0.1)",
              border: "1px solid rgba(139,124,246,0.2)",
              color: "var(--accent-violet)",
            }}
          >
            <Info size={12} aria-hidden />
            Showing sample preferences — connect the backend to see real memory.
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" style={{ backgroundColor: "var(--bg-surface-raised)" }} />
                <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
                  {[1, 2].map((j) => (
                    <div key={j} className="flex gap-6 px-5 py-4" style={{ borderBottom: j === 1 ? "1px solid var(--border-subtle)" : undefined }}>
                      <Skeleton className="h-3 w-1/3" style={{ backgroundColor: "var(--bg-surface-raised)" }} />
                      <Skeleton className="h-3 w-1/2" style={{ backgroundColor: "var(--bg-surface-raised)" }} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && prefs.length === 0 && (
          <div
            className="rounded-xl p-12 flex flex-col items-center gap-3 text-center"
            style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
          >
            <Brain size={32} style={{ color: "var(--text-secondary)", opacity: 0.4 }} />
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              LifeGrid hasn&apos;t learned anything yet — preferences appear here after your first completed mission.
            </p>
          </div>
        )}

        {/* Grouped preferences */}
        {!loading && prefs.length > 0 && (
          <div className="space-y-7">
            {Object.entries(grouped).map(([topic, items]) => (
              <section key={topic} aria-label={`${topic} preferences`}>
                {/* Topic heading */}
                <div className="flex items-center gap-2 mb-3">
                  <Brain size={12} style={{ color: "var(--accent-violet)" }} aria-hidden />
                  <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {topic}
                  </h2>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: "var(--bg-surface-raised)", color: "var(--text-secondary)" }}
                  >
                    {items.length}
                  </span>
                </div>

                <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
                  {items.map((pref, idx) => {
                    const pct = Math.round(pref.confidence * 100);
                    const confColor =
                      pref.confidence >= 0.85
                        ? "var(--accent-green)"
                        : pref.confidence >= 0.6
                          ? "var(--accent-amber)"
                          : "var(--accent-red)";

                    return (
                      <div
                        key={pref.id}
                        className="flex items-start gap-4 px-5 py-4"
                        style={{
                          backgroundColor:
                            idx % 2 === 0 ? "var(--bg-surface)" : "var(--bg-surface-raised)",
                          borderBottom:
                            idx < items.length - 1 ? "1px solid var(--border-subtle)" : undefined,
                        }}
                      >
                        {/* Fact */}
                        <p className="flex-1 text-sm" style={{ color: "var(--text-primary)" }}>
                          {pref.learned_fact}
                        </p>

                        {/* Confidence indicator */}
                        <div
                          className="flex items-center gap-1.5 shrink-0"
                          title={`Confidence: ${pct}%`}
                        >
                          <div
                            className="h-1 w-12 rounded-full overflow-hidden"
                            style={{ backgroundColor: "var(--bg-surface-raised)" }}
                            role="progressbar"
                            aria-valuenow={pct}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`Confidence ${pct}%`}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, backgroundColor: confColor }}
                            />
                          </div>
                          <span
                            className="text-xs font-mono w-8 text-right"
                            style={{ color: confColor }}
                          >
                            {pct}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
