import { NextResponse } from 'next/server';
import { ENTERPRISE_AGENT_REGISTRY } from '@lifegrid/agent';

export async function GET() {
  return NextResponse.json({
    success: true,
    totalAgents: ENTERPRISE_AGENT_REGISTRY.length,
    agents: ENTERPRISE_AGENT_REGISTRY
  });
}
