import { EventType, toStructuredEvents, isFinalResponse, type Event } from '@google/adk';
import { TelemetryLog, ApprovalItem } from './types.js';
import { PolicyEngine } from './gateway/policy-engine.js';

// ADK agent `name`s don't match the registry ids used by the frontend for
// icon/highlight lookups (src/lib/agents/registry.ts) — bridge the two here.
const AGENT_NAME_TO_ID: Record<string, string> = {
  SecurityScanner: 'security-agent',
  TravelAgent: 'travel-agent',
  FamilyAgent: 'family-agent',
  CalendarAgent: 'calendar-agent',
  ShoppingAgent: 'shopping-agent',
  FinanceAgent: 'finance-agent',
  PlanSynthesizer: 'orchestrator',
  ResearchPhase: 'orchestrator',
  LifeGridOrchestrator: 'orchestrator',
};

const AGENT_DISPLAY_NAME: Record<string, string> = {
  SecurityScanner: 'Model Armor Security Scanner',
  TravelAgent: 'Travel & Lodging Agent',
  FamilyAgent: 'Family & Activities Agent',
  CalendarAgent: 'Calendar & Time Agent',
  ShoppingAgent: 'Household & Shopping Agent',
  FinanceAgent: 'Finance & Budget Agent',
  PlanSynthesizer: 'Plan Synthesizer',
  ResearchPhase: 'Research Phase',
  LifeGridOrchestrator: 'Goal Orchestrator',
};

let logCounter = 0;
function nextId(prefix: string): string {
  logCounter += 1;
  return `${prefix}-${Date.now()}-${logCounter}`;
}

function baseLog(event: Event, overrides: Partial<TelemetryLog> & Pick<TelemetryLog, 'type' | 'message'>): TelemetryLog {
  const author = event.author || 'LifeGridOrchestrator';
  return {
    id: nextId('log'),
    timestamp: new Date().toLocaleTimeString(),
    agentId: AGENT_NAME_TO_ID[author] || 'orchestrator',
    agentName: AGENT_DISPLAY_NAME[author] || author,
    ...overrides,
  };
}

interface OriginalApprovalArgs {
  agentName: string;
  actionType: ApprovalItem['actionType'];
  title: string;
  summary: string;
  amount: number;
  vendor?: string;
}

/**
 * Translates one raw ADK Event into 0-N TelemetryLogs. An event can carry
 * multiple structured sub-events (e.g. several tool calls in one turn), and
 * a pending human-approval pause is itself carried as a synthetic
 * `adk_request_confirmation` tool call (see ADK's llm_agent.js /
 * functions.js — the framework yields this in place of the tool's own
 * result once `tool_context.requestConfirmation()` is called).
 */
export function mapAdkEventToTelemetryLogs(event: Event, sessionId: string, isResume = false): TelemetryLog[] {
  const logs: TelemetryLog[] = [];

  for (const structured of toStructuredEvents(event)) {
    switch (structured.type) {
      case EventType.THOUGHT:
        logs.push(baseLog(event, { type: 'thought', message: structured.content }));
        break;

      case EventType.CONTENT: {
        // Known ADK 1.6.0 limitation: after a resumed approval, the
        // Runner's resumability shortcut re-enters FinanceAgent directly and
        // does NOT hand back off to the outer SequentialAgent to run
        // PlanSynthesizer afterward — confirmed by tracing a real resume
        // (FinanceAgent finishes cleanly, stream ends, PlanSynthesizer never
        // invoked). So on a resumed run only, FinanceAgent's own final reply
        // is treated as the completion signal too — otherwise a post-approval
        // run ends on a plain grey "thought" bubble with no success state.
        // Gated to `isResume` because on a normal (non-paused) run,
        // FinanceAgent often has an earlier no-function-call turn (e.g.
        // "still waiting on the Travel Agent") that would otherwise be
        // misflagged as final even though PlanSynthesizer runs right after.
        const isFinalPlan =
          (event.author === 'PlanSynthesizer' || (isResume && event.author === 'FinanceAgent')) && isFinalResponse(event);
        logs.push(
          baseLog(event, {
            type: isFinalPlan ? 'execution_success' : 'thought',
            message: structured.content,
          })
        );
        break;
      }

      case EventType.TOOL_CALL: {
        const call = structured.call;

        if (call.name === 'adk_request_confirmation' && call.id) {
          const args = call.args as { originalFunctionCall?: { args?: OriginalApprovalArgs } } | undefined;
          const originalArgs = args?.originalFunctionCall?.args;
          if (originalArgs) {
            const agentId = AGENT_NAME_TO_ID[event.author || ''] || 'finance-agent';
            const policy = PolicyEngine.evaluateAction({
              agentId,
              agentName: originalArgs.agentName,
              actionType: originalArgs.actionType,
              title: originalArgs.title,
              summary: originalArgs.summary,
              amount: originalArgs.amount,
              vendor: originalArgs.vendor,
            });
            const approvalItem: ApprovalItem = {
              id: call.id,
              goalId: sessionId,
              agentId,
              agentName: originalArgs.agentName,
              title: originalArgs.title,
              summary: originalArgs.summary,
              actionType: originalArgs.actionType,
              amount: originalArgs.amount,
              currency: 'USD',
              vendor: originalArgs.vendor,
              riskScore: policy.riskScore,
              riskLevel: policy.riskLevel,
              reason: policy.reason,
              status: 'pending',
              timestamp: new Date().toLocaleTimeString(),
              // Every adk_request_confirmation call derived from this same
              // raw event was requested in the same model turn and must be
              // resolved together (see the ApprovalItem.batchId doc comment).
              batchId: event.id,
            };
            logs.push(
              baseLog(event, {
                type: 'approval_required',
                message: `Approval required: "${originalArgs.title}" ($${originalArgs.amount.toLocaleString()}). ${policy.reason}`,
                riskLevel: policy.riskLevel,
                approvalItem,
              })
            );
          }
        } else if (call.name === 'scan_with_model_armor') {
          logs.push(
            baseLog(event, {
              type: 'security_inspection',
              message: 'Model Armor Shield: scanning input for threats...',
            })
          );
        } else {
          logs.push(
            baseLog(event, {
              type: 'tool_call',
              message: `Calling ${call.name}(${summarizeArgs(call.args)})`,
            })
          );
        }
        break;
      }

      case EventType.TOOL_RESULT: {
        const result = structured.result;
        const response = (result.response ?? {}) as Record<string, unknown>;

        if (response.zeroTrustDenied) {
          logs.push(
            baseLog(event, {
              type: 'security_alert',
              message: `ZERO-TRUST BLOCKED: ${(response.reason as string) || `Access to '${result.name}' denied.`}`,
              riskLevel: 'high',
              threatDetected: true,
            })
          );
        } else if (result.name === 'scan_with_model_armor') {
          const isSafe = response.isSafe !== false;
          logs.push(
            isSafe
              ? baseLog(event, {
                  type: 'security_inspection',
                  message: 'Model Armor Inspection Passed: input clean and validated.',
                })
              : baseLog(event, {
                  type: 'security_alert',
                  message: `THREAT BLOCKED: ${(response.reasons as string[] | undefined)?.join(' ') || 'Prompt injection detected.'}`,
                  riskLevel: 'critical',
                  threatDetected: true,
                })
          );
        } else if (result.name === 'write_memory_bank') {
          logs.push(
            baseLog(event, {
              type: 'memory_update',
              message: (response.message as string) || 'Persisted a new memory to the Memory Bank.',
              metadata: { memory: response.memory },
            })
          );
        } else if (result.name === 'request_human_approval') {
          // Only reached when the amount was within policy (no confirmation
          // needed) — the confirmation-required path never yields this
          // result directly, it yields the adk_request_confirmation call above.
          logs.push(
            baseLog(event, {
              type: 'tool_call',
              message: 'Policy Engine: action within autonomous safe parameters, executing automatically.',
            })
          );
        } else {
          logs.push(baseLog(event, { type: 'tool_call', message: summarizeToolResult(result.name, response) }));
        }
        break;
      }

      case EventType.ERROR:
        logs.push(baseLog(event, { type: 'error', message: structured.error.message, riskLevel: 'high' }));
        break;

      default:
        break;
    }
  }

  if (event.actions?.transferToAgent) {
    logs.push(
      baseLog(event, {
        type: 'orchestration',
        message: `Transferring to ${event.actions.transferToAgent}...`,
      })
    );
  }

  return logs;
}

function summarizeArgs(args: Record<string, unknown> | undefined): string {
  if (!args) return '';
  return Object.entries(args)
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join(', ');
}

function summarizeToolResult(name: string | undefined, response: Record<string, unknown>): string {
  switch (name) {
    case 'search_flights':
      return `Found ${(response.results as unknown[] | undefined)?.length ?? 0} flight options.`;
    case 'search_hotels':
      return `Found ${(response.results as unknown[] | undefined)?.length ?? 0} hotel options.`;
    case 'search_activities':
      return `Found ${(response.results as unknown[] | undefined)?.length ?? 0} activities.`;
    case 'check_calendar_availability':
      return (response.recommendation as string) || 'Calendar checked.';
    case 'search_gear_and_supplies':
      return `Recommended ${(response.recommendations as unknown[] | undefined)?.length ?? 0} items, total $${response.totalEstimatedCost ?? 0}.`;
    case 'check_budget_status':
      return `Budget status: $${response.currentSpend ?? 0} / $${response.budgetCap ?? 0} (${response.status}).`;
    case 'read_memory_bank':
      return `Retrieved ${(response.count as number | undefined) ?? 0} relevant memories.`;
    default:
      return `${name ?? 'Tool'} completed.`;
  }
}
