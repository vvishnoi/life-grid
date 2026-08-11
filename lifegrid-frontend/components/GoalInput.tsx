"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { createMission, ApiError } from "@/lib/api";

const EXAMPLE_GOALS = [
  "Plan a 5-day family trip under $4,000",
  "Make next week less hectic",
  "Find and book a plumber for Saturday",
  "Organise our anniversary dinner for next month",
  "Research the best schools in our area",
];

const USER_ID = "demo-user";

export function GoalInput() {
  const router = useRouter();
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = goal.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);

    try {
      const { mission_id } = await createMission(USER_ID, trimmed);
      router.push(`/missions/${mission_id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Describe a goal for LifeGrid to handle…"
          rows={4}
          disabled={loading}
          aria-label="Mission goal"
          className="w-full resize-none rounded-xl px-5 py-4 text-base outline-none transition-all disabled:opacity-50"
          style={{
            backgroundColor: "var(--bg-surface)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-subtle)",
            caretColor: "var(--accent-teal)",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent-teal)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-subtle)")}
        />

        {error && (
          <p className="text-sm" style={{ color: "var(--accent-red)" }} role="alert">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={!goal.trim() || loading}
          className="w-full h-12 text-base font-medium rounded-lg flex items-center justify-center gap-2"
          style={{ backgroundColor: "var(--accent-teal)", color: "var(--bg-base)" }}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" aria-hidden />
              Starting mission…
            </>
          ) : (
            <>
              Launch Mission
              <ArrowRight size={18} aria-hidden />
            </>
          )}
        </Button>
      </form>

      {/* Example chips */}
      <div className="mt-6">
        <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>
          Try an example
        </p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_GOALS.map((eg) => (
            <button
              key={eg}
              type="button"
              onClick={() => setGoal(eg)}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-full transition-colors hover:opacity-80 disabled:opacity-40"
              style={{
                backgroundColor: "var(--bg-surface-raised)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
              }}
            >
              {eg}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
