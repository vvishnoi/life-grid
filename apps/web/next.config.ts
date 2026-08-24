import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Required for Dockerfile's `.next/standalone` COPY step — without this
  // the Cloud Run container build fails, standalone output isn't produced.
  output: 'standalone',
  // This is an npm workspaces monorepo (apps/web + packages/agent) — without
  // this, Next's file tracer defaults to apps/web as the root and won't
  // follow @lifegrid/agent's real files (or the hoisted root node_modules)
  // into .next/standalone. See Next's `output` config docs, "Caveats".
  outputFileTracingRoot: path.join(__dirname, '../../'),
  // Each ADK agent's instructions.md is read at runtime via fs.readFileSync
  // (see packages/agent/src/agents/*/agent.ts) — the tracer only follows
  // static import/require analysis, so it can't see that dynamic read and
  // silently drops the .md files from .next/standalone. Confirmed live: the
  // standalone server 500s with ENOENT for instructions.md without this.
  outputFileTracingIncludes: {
    '/*': ['../../packages/agent/dist/agents/**/*.md'],
  },
};

export default nextConfig;
