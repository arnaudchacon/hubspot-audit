'use client';

import { useState } from 'react';
import type { AuditReport, AuditIssue, Severity } from '@/lib/audit/types';
import { Score } from '@/components/ui/Score';
import { IssueCard } from '@/components/IssueCard';
import { DrawerPanel } from '@/components/affected-records/DrawerPanel';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Printer } from 'lucide-react';
import { DEDUCTIONS } from '@/lib/audit/scoring';
import { formatDate } from '@/lib/utils/format';

interface AuditReportProps {
  report: AuditReport;
  source: 'demo' | 'upload';
  historyId?: string;
}

const SEVERITY_LABELS: Record<Severity, string> = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

const SEVERITY_DOT: Record<Severity, string> = {
  HIGH: 'var(--severity-high)',
  MEDIUM: 'var(--severity-medium)',
  LOW: 'var(--severity-low)',
};

// The summary arrives as one paragraph, a blank line, then numbered lines.
function parseSummary(text: string): { paragraph: string; priorities: string[] } {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const priorities = lines
    .filter(l => /^\d+\.\s/.test(l))
    .map(l => l.replace(/^\d+\.\s*/, ''));
  const paragraph = lines.filter(l => !/^\d+\.\s/.test(l)).join(' ');
  return { paragraph, priorities };
}

export function AuditReport({ report, source, historyId }: AuditReportProps) {
  const { overall_score, score_interpretation, dataset_summary, issues, generated_at, executive_summary } = report;
  const [openIssue, setOpenIssue] = useState<AuditIssue | null>(null);

  const severityCounts = (['HIGH', 'MEDIUM', 'LOW'] as Severity[])
    .map(s => ({ severity: s, count: issues.filter(i => i.severity === s).length }))
    .filter(c => c.count > 0);

  const summary = executive_summary ? parseSummary(executive_summary) : null;
  const reviewHref = historyId ? `/review?id=${historyId}` : `/review?source=${source}`;

  return (
    <main className="min-h-screen bg-bg">
      <div className="max-w-content mx-auto px-6 py-14">

        {/* Header */}
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="font-serif text-text-primary text-[40px] leading-tight tracking-[-0.01em] mb-2">
              Audit report
            </h1>
            <p className="text-body-sm text-text-tertiary">
              Generated {formatDate(generated_at)} · {source === 'demo' ? 'demo dataset' : 'your dataset'} ·{' '}
              <span className="font-mono">{dataset_summary.contacts}</span> contacts ·{' '}
              <span className="font-mono">{dataset_summary.deals}</span> deals ·{' '}
              <span className="font-mono">{dataset_summary.workflows}</span> workflows
            </p>
          </div>
          <div className="flex items-center gap-3 no-print">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 text-body-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-150"
            >
              <Printer size={14} /> Export PDF
            </button>
            <Link href="/">
              <Button variant="secondary">New audit</Button>
            </Link>
          </div>
        </div>

        {/* Score band */}
        <div className="bg-surface rounded-xl p-8 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-8">
          <div className="flex flex-col items-center shrink-0">
            <Score score={overall_score} />
            <span className="text-caption text-text-tertiary mt-1 font-mono">/ 100</span>
          </div>
          <div className="hidden sm:block w-px h-20 bg-border-strong shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-body-lg text-text-primary mb-3">{score_interpretation}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-3">
              {severityCounts.map(({ severity, count }) => (
                <span key={severity} className="inline-flex items-center gap-1.5 text-body-sm text-text-secondary">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: SEVERITY_DOT[severity] }} />
                  <span className="font-mono">{count}</span> {SEVERITY_LABELS[severity]}
                </span>
              ))}
            </div>
            <details className="no-print">
              <summary className="text-body-sm text-text-tertiary cursor-pointer hover:text-text-secondary transition-colors duration-150">
                How the score is calculated
              </summary>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {issues.map(issue => (
                  <span key={issue.check_id} className="text-body-sm text-text-tertiary whitespace-nowrap">
                    <span className="font-mono">−{DEDUCTIONS[issue.severity]}</span> {issue.title.toLowerCase()}
                  </span>
                ))}
              </div>
            </details>
          </div>
        </div>

        {/* Executive summary */}
        {summary && (
          <div className="border border-border rounded-xl p-8 mb-12">
            <p className="text-caption text-accent uppercase tracking-[0.08em] font-mono mb-4">
              Executive summary
            </p>
            <p className="font-serif text-[19px] leading-relaxed text-text-primary mb-5">
              {summary.paragraph}
            </p>
            {summary.priorities.length > 0 && (
              <ol className="flex flex-col gap-2">
                {summary.priorities.map((p, i) => (
                  <li key={i} className="flex gap-3 text-body text-text-secondary">
                    <span className="font-mono text-accent shrink-0">{i + 1}.</span>
                    {p}
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {/* Issues */}
        <h2 className="font-serif text-[24px] text-text-primary mb-6">
          Detected issues <span className="text-text-tertiary">({issues.length})</span>
        </h2>

        <div className="flex flex-col gap-4 mb-16">
          {issues.map((issue, i) => (
            <IssueCard
              key={issue.check_id}
              issue={issue}
              index={i}
              total={issues.length}
              onViewRecords={() => setOpenIssue(issue)}
              reviewHref={reviewHref}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="pt-8 border-t border-border flex items-center justify-between no-print">
          <p className="text-body text-text-secondary">
            {source === 'demo'
              ? 'This used a demo dataset. Upload your own CSV to audit your actual instance.'
              : 'Want to audit a different dataset?'}
          </p>
          <Link href="/">
            <Button variant="secondary">← Back</Button>
          </Link>
        </div>

      </div>
      <DrawerPanel issue={openIssue} onClose={() => setOpenIssue(null)} />
    </main>
  );
}
