import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { approvalId, action } = body; // action: 'approve' | 'reject'

    if (!approvalId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Invalid parameters' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      approvalId,
      action,
      timestamp: new Date().toISOString(),
      message: action === 'approve' 
        ? `Action '${approvalId}' APPROVED by user. Execution authorized.` 
        : `Action '${approvalId}' REJECTED by user. Re-routing task to alternative provider.`
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
