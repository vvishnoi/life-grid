import { NextRequest, NextResponse } from 'next/server';
import { memoryBank } from '@lifegrid/agent';

export async function GET() {
  const memories = await memoryBank.getMemories();
  return NextResponse.json({ success: true, memories });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category, key, value, sentiment, sourceAgent } = body;

    const newMemory = await memoryBank.addMemory({
      category,
      key,
      value,
      sentiment,
      sourceAgent
    });

    return NextResponse.json({ success: true, memory: newMemory });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
