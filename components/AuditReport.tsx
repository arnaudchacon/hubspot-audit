import type { AuditReport } from '@/lib/audit/types';
import { Score } from '@/components/ui/Score';
import { IssueCard } from '@/components/IssueCard';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface AuditReportProps {
  report: AuditReport;
  source: 'demo' | 'upload';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function AuditReport({ report, source }: AuditReportProps) {
  const { overall_score, score_interpretation, dataset_summary, issues, generated_at } = report;

  return (
    <main className="min-h-screen bg-bg">
      <div className="max-w-content mx-auto px-6 py-16">

        {/* Header */}
        <div className="mb-12">
          <p className="text-caption text-text-tertiary uppercase tracking-[0.05em] mb-3">
            Generated {formatDate(generated_at)} · {source === 'demo' ? 'Demo dataset' : 'Your dataset'}
          </p>
          <h1 className="text-h1 text-text-primary">Audit Report</h1>
        </div>

        {/* Score card */}
        <div className="border border-border rounded-lg p-8 mb-12 flex items-center gap-8">
          <div className="flex flex-col items-center shrink-0">
            <Score score={overall_score} />
            <span className="text-caption text-text-tertiary mt-1">/ 100</span>
          </div>
          <div className="w-px h-20 bg-border shrink-0" />
          <div>
            <p className="text-h2 text-text-primary mb-2">{score_interpretation}</p>
            <p className="text-body text-text-tertiary font-mono">
              {dataset_summary.contacts} contacts · {dataset_summary.deals} deals · {dataset_summary.workflows} workflows
            </p>
          </div>
        </div>

        {/* Issues section */}
        <p className="text-caption text-text-tertiary uppercase tracking-[0.05em] mb-6">
          {issues.length} {issues.length === 1 ? 'issue' : 'issues'} detected
        </p>

        <div className="flex flex-col gap-4 mb-16">
          {issues.map((issue, i) => (
            <IssueCard key={issue.check_id} issue={issue} index={i} />
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
    </main>
  );
}
