An npm workspaces monorepo with two packages:

- **[packages/agent](packages/agent)** — `@lifegrid/agent`: the entire multi-agent pipeline (Google ADK agents, tools, governance gateways, memory). Zero dependency on Next.js — usable standalone from any Node app. Start here if you want the agent logic, not this UI.
- **[apps/web](apps/web)** — `@lifegrid/web`: the Next.js frontend (bootstrapped with `create-next-app`) that drives it. Everything below assumes you're working from the repo root, which runs commands against this app via npm workspaces scripts.

## Start here

Building on this project (or picking it up for the first time)? Read
**[docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)** first — it's
structured in three parts on purpose: **Requirements** (what the
hackathon track actually asks for), **Design** (the architecture and the
reasoning behind it — why the multi-agent pipeline is
Sequential-wrapping-Parallel, API contracts, sequence diagrams — written
before any of it existed as code), and **Implementation** (what's
actually built vs. simulated, and known limitations verified by running
the system live, not just reading it).

## Live Agents mode (real Google ADK + Vertex AI)

The app defaults to a free, scripted demo. To run the real multi-agent
pipeline, set up `apps/web/.env.local` from `apps/web/.env.local.example`
and see **[docs/COST_OPTIMIZATION.md](docs/COST_OPTIMIZATION.md)** before
deploying publicly — it covers scale-to-zero, instance caps, endpoint
gating, budget alerts, and teardown steps.

## Getting Started

From the repo root (npm workspaces resolves `@lifegrid/agent` for the web
app automatically — no separate build step needed for `dev`):

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `apps/web/src/app/page.tsx`. The page auto-updates as you edit the file.

`npm run build` (root) builds `packages/agent` first, then `apps/web` —
required for a production build/Docker image, since `apps/web` imports the
package's compiled `dist/`, not its TypeScript source.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy to Google Cloud Run

This hackathon submission targets Google Cloud, not Vercel. Spin up
everything (APIs, Artifact Registry, a least-privilege runtime service
account, and the Cloud Run deploy itself) with one idempotent script:

```bash
gcloud auth login
gcloud config set project <your-project-id>
DEMO_API_KEY=<a-secret-you-pick> ./scripts/gcp-up.sh
```

Tear it back down with `./scripts/gcp-down.sh` (asks for confirmation
first; `--full` also disables the APIs and deletes the service account).
See `docs/COST_OPTIMIZATION.md` for what each flag/setting is protecting
against, and `docs/IMPLEMENTATION_PLAN.md` §3.4 for real bugs this deploy
path hit and how they were fixed.
