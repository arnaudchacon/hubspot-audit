'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { listAudits, deleteAudit, type HistoryEntry } from '@/lib/utils/history';
import { formatDate } from '@/lib/utils/format';

function scoreColor(score: number): string {
  if (score >= 70) return 'var(--score-good)';
  if (score >= 40) return 'var(--score-medium)';
  return 'var(--score-poor)';
}

export function RecentAudits() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setEntries(listAudits());
  }, []);

  if (entries.length === 0) return null;

  return (
    <section className="px-6 py-16 border-b border-border">
      <div className="max-w-content mx-auto">
        <h2 className="font-serif text-[28px] text-text-primary mb-2">Recent audits</h2>
        <p className="text-body text-text-secondary mb-8">
          Stored in this browser only — nothing leaves your machine.
        </p>

        <div className="flex flex-col divide-y divide-border border border-border rounded-lg bg-bg">
          {entries.map(entry => (
            <div key={entry.id} className="flex items-center gap-4 px-5 py-4">
              <span
                className="font-mono text-[22px] font-medium w-12 shrink-0 tabular-nums"
                style={{ color: scoreColor(entry.score) }}
              >
                {entry.score}
              </span>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/audit?id=${entry.id}`}
                  className="text-body font-medium text-text-primary hover:text-accent transition-colors duration-150"
                >
                  {entry.source === 'demo' ? 'Demo dataset' : 'Uploaded dataset'} — {entry.contacts} contacts
                </Link>
                <p className="text-body-sm text-text-tertiary">
                  {formatDate(entry.saved_at)} · {entry.issue_count} issue{entry.issue_count !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => { deleteAudit(entry.id); setEntries(listAudits()); }}
                className="p-1.5 text-text-tertiary hover:text-severity-high transition-colors duration-150"
                aria-label="Delete audit from history"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
