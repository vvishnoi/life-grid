This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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
pipeline, set up `.env.local` from `.env.local.example` and see
**[docs/COST_OPTIMIZATION.md](docs/COST_OPTIMIZATION.md)** before deploying
publicly — it covers scale-to-zero, instance caps, endpoint gating, budget
alerts, and teardown steps.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
