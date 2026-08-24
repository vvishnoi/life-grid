import { LlmAgent } from '@google/adk';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { geminiModel } from '../../model.js';
import { calendarAgentTools } from '../../tools.js';
import { createZeroTrustCallback } from '../../gateway/zero-trust.js';

const instructionsPath = join(dirname(fileURLToPath(import.meta.url)), 'instructions.md');
const instructionText = readFileSync(instructionsPath, 'utf-8');

// Checks household schedule availability for the requested dates.
export function createCalendarAgent(model: string = geminiModel): LlmAgent {
  return new LlmAgent({
    name: 'CalendarAgent',
    model,
    instruction: instructionText,
    tools: calendarAgentTools,
    outputKey: 'calendar_results',
    beforeToolCallback: createZeroTrustCallback('calendar-agent'),
  });
}

export const calendarAgent = createCalendarAgent();
