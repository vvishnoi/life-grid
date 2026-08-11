"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Clock, Settings, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "New Mission", icon: Zap },
  { href: "/history", label: "History", icon: Clock },
  { href: "/settings", label: "Preferences", icon: Settings },
];

export function Sidebar() {
  const path = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 h-full w-56 flex flex-col border-r z-10"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-subtle)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b" style={{ borderColor: "var(--border-subtle)" }}>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm"
          style={{ backgroundColor: "var(--accent-teal)", color: "var(--bg-base)" }}
        >
          LG
        </div>
        <span className="font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
          LifeGrid
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "font-medium"
                  : "hover:opacity-80"
              )}
              style={{
                backgroundColor: active ? "var(--bg-surface-raised)" : "transparent",
                color: active ? "var(--accent-teal)" : "var(--text-secondary)",
              }}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t text-xs" style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}>
        <p>Powered by Gemini ADK</p>
      </div>
    </aside>
  );
}
