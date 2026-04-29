'use client';

import { useState } from 'react';
import type { AuditReport, AuditIssue } from '@/lib/audit/types';
import { Score } from '@/components/ui/Score';
import { IssueCard } from '@/components/IssueCard';
import { DrawerPanel } from '@/components/affected-records/DrawerPanel';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface AuditReportProps {
  report: AuditReport;
  source: 'demo' | 'upload';
}

const SEVERITY_DEDUCTIONS = { HIGH: 14, MEDIUM: 7, LOW: 3 } as const;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function AuditReport({ report, source }: AuditReportProps) {
  const { overall_score, score_interpretation, dataset_summary, issues, generated_at } = report;
  const [openIssue, setOpenIssue] = useState<AuditIssue | null>(null);

  return (
    <main className="min-h-screen bg-bg">
      <div className="max-w-content mx-auto px-6 py-16">

        {/* Top utility row — home link sits top-right */}
        <div className="mb-10 flex items-center justify-end">
          <Link
            href="/"
            className="text-caption text-text-tertiary hover:text-text-primary transition-colors duration-150 uppercase tracking-[0.05em] font-mono inline-flex items-center gap-1.5"
          >
            ← Home
          </Link>
        </div>

        {/* Header */}
        <div className="mb-12">
          <p className="text-caption text-text-tertiary uppercase tracking-[0.05em] mb-3 font-mono">
            FIG 01 — Generated {formatDate(generated_at)} · {source === 'demo' ? 'Demo dataset' : 'Your dataset'}
          </p>
          <h1 className="font-serif text-text-primary" style={{ fontSize: '48px', lineHeight: '1.05', letterSpacing: '-0.01em', fontWeight: 400 }}>
            Audit Report
          </h1>
        </div>

        {/* Score card — no border, warm surface, thin top accent rule */}
        <p className="text-caption text-text-tertiary uppercase tracking-[0.05em] mb-3 font-mono">
          FIG 02 — Overall health score
        </p>
        <div className="bg-surface rounded-lg p-8 mb-12 flex items-center gap-8 border-t-2 border-text-primary">
          <div className="flex flex-col items-center shrink-0">
            <Score score={overall_score} />
            <span className="text-caption text-text-tertiary mt-1 font-mono">/ 100</span>
          </div>
          <div className="w-px h-20 bg-border-strong shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-body-lg text-text-primary mb-2">{score_interpretation}</p>
            <p className="text-body-sm text-text-tertiary mb-3">
              <span className="font-mono">{dataset_summary.contacts}</span> contacts ·{' '}
              <span className="font-mono">{dataset_summary.deals}</span> deals ·{' '}
              <span className="font-mono">{dataset_summary.workflows}</span> workflows
            </p>
            {issues.length > 0 && (
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {issues.map(issue => (
                  <span key={issue.check_id} className="text-body-sm text-text-tertiary whitespace-nowrap">
                    <span className="font-mono">−{SEVERITY_DEDUCTIONS[issue.severity]}</span>{' '}
                    {issue.title.toLowerCase()}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Issues section */}
        <p className="text-caption text-text-tertiary uppercase tracking-[0.05em] mb-6 font-mono">
          FIG 03 — Detected issues ({issues.length})
        </p>

        <div className="flex flex-col gap-4 mb-16">
          {issues.map((issue, i) => (
            <IssueCard
              key={issue.check_id}
              issue={issue}
              index={i}
              total={issues.length}
              onViewRecords={() => setOpenIssue(issue)}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="pt-8 border-t border-border flex items-center justify-between">
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
