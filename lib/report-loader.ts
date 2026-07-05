import type { AuditReport } from '@/lib/audit/types';
import { getAudit, saveAudit } from '@/lib/utils/history';

export interface LoadedReport {
  report: AuditReport;
  source: 'demo' | 'upload';
  historyId: string;
}

// Resolves a report on the client from URL params, in priority order:
//   ?id=…            → saved audit from local history
//   ?source=demo     → fetch the cached demo report, then save to history
//   ?source=upload   → sessionStorage handoff from the upload flow, then save
// Returns null when nothing resolves (caller should redirect home).
export async function loadReport(params: URLSearchParams): Promise<LoadedReport | null> {
  const id = params.get('id');
  if (id) {
    const entry = getAudit(id);
    if (!entry) return null;
    return { report: entry.report, source: entry.source, historyId: entry.id };
  }

  const source = params.get('source');

  if (source === 'demo') {
    const res = await fetch('/api/audit-demo');
    if (!res.ok) throw new Error('demo fetch failed');
    const report: AuditReport = await res.json();
    const entry = saveAudit(report, 'demo');
    return { report, source: 'demo', historyId: entry.id };
  }

  if (source === 'upload') {
    const stored = sessionStorage.getItem('upload-report');
    if (!stored) return null;
    const report: AuditReport = JSON.parse(stored);
    const entry = saveAudit(report, 'upload');
    return { report, source: 'upload', historyId: entry.id };
  }

  return null;
}
