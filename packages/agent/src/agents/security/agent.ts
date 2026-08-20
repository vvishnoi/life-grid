import { LlmAgent } from '@google/adk';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { geminiModel } from '../../model.js';
import { securityAgentTools } from '../../tools.js';

const instructionsPath = join(dirname(fileURLToPath(import.meta.url)), 'instructions.md');

// Runs FIRST in the pipeline to scan the user's input for threats.
export const securityScannerAgent = new LlmAgent({
  name: 'SecurityScanner',
  model: geminiModel,
  instruction: readFileSync(instructionsPath, 'utf-8'),
  tools: securityAgentTools,
  outputKey: 'security_scan_result',
});
