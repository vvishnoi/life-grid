import { LlmAgent } from '@google/adk';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { geminiModel } from '../../model.js';
import { calendarAgentTools } from '../../tools.js';

const instructionsPath = join(dirname(fileURLToPath(import.meta.url)), 'instructions.md');

// Checks household schedule availability for the requested dates.
export const calendarAgent = new LlmAgent({
  name: 'CalendarAgent',
  model: geminiModel,
  instruction: readFileSync(instructionsPath, 'utf-8'),
  tools: calendarAgentTools,
  outputKey: 'calendar_results',
});
