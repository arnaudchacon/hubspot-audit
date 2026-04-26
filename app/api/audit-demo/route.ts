import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { runAudit } from '@/lib/audit/index';
import type { Dataset } from '@/lib/audit/types';
import demoDataset from '@/data/demo-dataset.json';

// Phase 3.3 will replace this with cached-recommendations.json once
// AI recommendations are pre-generated. For now, the audit runs live.
export async function GET() {
  try {
    const report = runAudit(demoDataset as unknown as Dataset);
    return NextResponse.json(report);
  } catch (err) {
    console.error('[audit-demo]', err);
    return NextResponse.json({ error: 'Audit failed' }, { status: 500 });
  }
}
