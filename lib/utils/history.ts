import type { AuditReport } from '@/lib/audit/types';

// Local-only audit history. Reports are stored in the browser, never on a
// server — this is the privacy story: closing the tab is the only cleanup.
const STORAGE_KEY = 'audit-history-v1';
const MAX_ENTRIES = 10;

export interface HistoryEntry {
  id: string;
  saved_at: string;
  source: 'demo' | 'upload';
  score: number;
  issue_count: number;
  contacts: number;
  report: AuditReport;
}

function readAll(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    // Quota exceeded — drop the oldest and retry once.
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, Math.max(1, MAX_ENTRIES - 5))));
    } catch {
      // Give up silently; history is a convenience, not a requirement.
    }
  }
}

export function listAudits(): HistoryEntry[] {
  return readAll();
}

export function getAudit(id: string): HistoryEntry | null {
  return readAll().find(e => e.id === id) ?? null;
}

// Saves a report, deduping by generated_at + source so re-viewing the same
// report (e.g. refreshing the demo) doesn't spam the list.
export function saveAudit(report: AuditReport, source: 'demo' | 'upload'): HistoryEntry {
  const entries = readAll();
  const existing = entries.find(
    e => e.source === source && e.report.generated_at === report.generated_at
  );
  if (existing) return existing;

  const entry: HistoryEntry = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    saved_at: new Date().toISOString(),
    source,
    score: report.overall_score,
    issue_count: report.issues.length,
    contacts: report.dataset_summary.contacts,
    report,
  };
  writeAll([entry, ...entries]);
  return entry;
}

export function deleteAudit(id: string) {
  writeAll(readAll().filter(e => e.id !== id));
}
