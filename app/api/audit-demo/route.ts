import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { runAudit } from '@/lib/audit/index';
import type { Dataset, AuditReport } from '@/lib/audit/types';
import demoDataset from '@/data/demo-dataset.json';

export const dynamic = 'force-dynamic';

function loadCache(): AuditReport | null {
  try {
    const raw = readFileSync(resolve(process.cwd(), 'data/cached-recommendations.json'), 'utf-8');
    const parsed = JSON.parse(raw);
    // Cache is valid when it has been populated (not the empty {} placeholder)
    if (parsed && parsed.overall_score !== undefined) return parsed as AuditReport;
  } catch {
    // File missing or unreadable — fall through to live audit
  }
  return null;
}

export async function GET() {
  try {
    const cached = loadCache();
    if (cached) return NextResponse.json(cached);

    // Fallback: run live audit without AI recommendations (pre-cache state)
    const report = runAudit(demoDataset as unknown as Dataset);
    return NextResponse.json(report);
  } catch (err) {
    console.error('[audit-demo]', err);
    return NextResponse.json({ error: 'Audit failed' }, { status: 500 });
  }
}
