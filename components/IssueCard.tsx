import type { AuditIssue } from '@/lib/audit/types';
import { Badge } from '@/components/ui/Badge';
import { AffectedRecords } from '@/components/affected-records/AffectedRecords';

interface IssueCardProps {
  issue: AuditIssue;
  index: number;
  onViewRecords: () => void;
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

export function IssueCard({ issue, index, onViewRecords }: IssueCardProps) {
  const sections = issue.ai_recommendation ? parseRecommendation(issue.ai_recommendation) : null;

  return (
    <div
      className="bg-bg border border-border rounded-lg p-6 animate-fade-in hover:border-border-strong hover:shadow-hover transition-[border-color,box-shadow] duration-150"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="mb-3">
        <Badge severity={issue.severity} />
      </div>

      <h3 className="text-h3 text-text-primary mb-2">{issue.title}</h3>
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

      <AffectedRecords issue={issue} onOpen={onViewRecords} />
    </div>
  );
}
