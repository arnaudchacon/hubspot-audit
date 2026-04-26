import type { AuditIssue } from '@/lib/audit/types';
import { Badge } from '@/components/ui/Badge';

interface IssueCardProps {
  issue: AuditIssue;
  index: number;
}

export function IssueCard({ issue, index }: IssueCardProps) {
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
          <p className="text-caption text-text-tertiary uppercase tracking-[0.05em] mb-2">
            AI Recommendation
          </p>
          <p className="text-body text-text-secondary">{issue.ai_recommendation}</p>
        </div>
      )}
    </div>
  );
}
