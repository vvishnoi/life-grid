#!/usr/bin/env node
// tsc only emits .ts -> .js/.d.ts; each agent's instructions.md lives next
// to its agent.ts and is loaded at runtime via readFileSync(__dirname-ish),
// so it has to land in dist/ at the same relative path as its source. This
// runs as the second half of `npm run build` (see package.json).
import { cpSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(packageRoot, 'src', 'agents');
const dest = join(packageRoot, 'dist', 'agents');

cpSync(src, dest, {
  recursive: true,
  filter: (source) => statSync(source).isDirectory() || source.endsWith('.md'),
});
