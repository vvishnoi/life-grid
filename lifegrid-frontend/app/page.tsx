import { GoalInput } from "@/components/GoalInput";
import { Sidebar } from "@/components/Sidebar";
import { Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 ml-56 flex items-center justify-center px-8 py-16">
        <div className="w-full max-w-2xl">
          {/* Hero */}
          <div className="text-center mb-10 space-y-3">
            <div
              className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full mb-2"
              style={{
                backgroundColor: "rgba(45,212,191,0.1)",
                color: "var(--accent-teal)",
                border: "1px solid rgba(45,212,191,0.2)",
              }}
            >
              <Zap size={12} aria-hidden />
              7-agent AI system
            </div>

            <h1
              className="text-4xl font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              What do you need handled?
            </h1>

            <p
              className="text-base max-w-md mx-auto"
              style={{ color: "var(--text-secondary)" }}
            >
              Describe a goal in plain language. LifeGrid&apos;s specialist
              agents will research, plan, and execute it — with your approval on
              anything that matters.
            </p>
          </div>

          {/* Goal input */}
          <GoalInput />
        </div>
      </main>
    </div>
  );
}
