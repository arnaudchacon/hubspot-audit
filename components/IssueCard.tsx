import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { AuditIssue, ReviewPair } from '@/lib/audit/types';
import { Badge } from '@/components/ui/Badge';
import { AffectedRecords } from '@/components/affected-records/AffectedRecords';

interface IssueCardProps {
  issue: AuditIssue;
  index: number;
  total: number;
  onViewRecords: () => void;
  reviewHref?: string;
}

const SECTION_KEYS = ['ROOT CAUSE', 'FIRST STEP', 'WATCH FOR'] as const;
type SectionKey = typeof SECTION_KEYS[number];

const SECTION_STYLES: Record<SectionKey, { color: string }> = {
  'ROOT CAUSE': { color: 'var(--text-tertiary)' },
  'FIRST STEP': { color: 'var(--accent)' },
  'WATCH FOR':  { color: 'var(--severity-medium)' },
};

function parseRecommendation(text: string): Array<{ label: SectionKey; content: string }> | null {
  const hasAll = SECTION_KEYS.every(k => text.includes(`${k}:`));
  if (!hasAll) return null;

  return SECTION_KEYS.map((label, i) => {
    const start = text.indexOf(`${label}:`) + label.length + 1;
    const nextKey = SECTION_KEYS[i + 1];
    const end = nextKey ? text.indexOf(`${nextKey}:`) : text.length;
    return { label, content: text.slice(start, end).trim() };
  });
}

export function IssueCard({ issue, index, total, onViewRecords, reviewHref }: IssueCardProps) {
  const sections = issue.ai_recommendation ? parseRecommendation(issue.ai_recommendation) : null;

  const reviewPairs = issue.check_id === 'duplicates'
    ? ((issue.raw_data.review_pairs as ReviewPair[] | undefined) ?? [])
    : [];

  // Severity-aware visual gradient — felt in peripheral vision before badges register.
  const severityClasses =
    issue.severity === 'HIGH'
      ? 'bg-bg border border-border border-l-2 border-l-severity-high'
      : issue.severity === 'LOW'
      ? 'bg-surface border border-border opacity-90'
      : 'bg-bg border border-border';

  const titleColorClass = issue.severity === 'LOW' ? 'text-text-secondary' : 'text-text-primary';

  const issueNumber = String(index + 1).padStart(2, '0');
  const totalNumber = String(total).padStart(2, '0');

  return (
    <div
      className={`${severityClasses} rounded-lg p-6 animate-fade-in hover:border-border-strong hover:shadow-hover transition-[border-color,box-shadow] duration-150`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="mb-3 flex items-center justify-between">
        <Badge severity={issue.severity} />
        <span className="text-caption text-text-tertiary font-mono uppercase tracking-[0.05em]">
          Issue {issueNumber} / {totalNumber}
        </span>
      </div>

      <h3 className={`text-h3 ${titleColorClass} mb-2`}>{issue.title}</h3>
      <p className="text-body text-text-secondary mb-5">{issue.detail}</p>

      {issue.ai_recommendation && (
        <div className="pt-5 border-t border-border">
          <p className="text-caption text-text-tertiary uppercase tracking-[0.05em] mb-3">
            AI Recommendation
          </p>

          {sections ? (
            <div className="space-y-3">
              {sections.map(({ label, content }) => (
                <div key={label}>
                  <span
                    className="text-[11px] font-semibold uppercase tracking-[0.06em]"
                    style={{ color: SECTION_STYLES[label].color }}
                  >
                    {label}
                  </span>
                  <p className="text-body text-text-secondary mt-0.5">{content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-body text-text-secondary">{issue.ai_recommendation}</p>
          )}
        </div>
      )}

      {reviewPairs.length > 0 && reviewHref && (
        <div className="mt-5 flex items-center justify-between gap-4 rounded-lg border border-border bg-accent-bg/60 px-4 py-3 no-print">
          <p className="text-body-sm text-text-primary">
            <span className="font-mono font-semibold">{reviewPairs.length}</span> borderline pair{reviewPairs.length !== 1 ? 's' : ''} scored
            below the auto-merge threshold and need{reviewPairs.length === 1 ? 's' : ''} human review.
          </p>
          <Link
            href={reviewHref}
            className="inline-flex items-center gap-1.5 text-body-sm font-medium text-accent hover:text-accent-hover whitespace-nowrap transition-colors duration-150"
          >
            Open review workbench <ArrowRight size={14} />
          </Link>
        </div>
      )}

      <AffectedRecords issue={issue} onOpen={onViewRecords} />
    </div>
  );
}
