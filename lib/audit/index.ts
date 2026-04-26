import type { Dataset, AuditReport, AuditIssue } from '@/lib/audit/types';
import { checkDuplicates } from '@/lib/audit/checks/duplicates';
import { checkOwners } from '@/lib/audit/checks/owners';
import { checkWorkflows } from '@/lib/audit/checks/workflows';
import { checkStaleDeals } from '@/lib/audit/checks/stale-deals';
import { checkPhoneFormat } from '@/lib/audit/checks/phone-format';
import { calculateScore } from '@/lib/audit/scoring';

const SEVERITY_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;

export function runAudit(dataset: Dataset): AuditReport {
  const rawIssues: Array<AuditIssue | null> = [
    checkDuplicates(dataset.contacts),
    checkOwners(dataset.contacts),
    checkWorkflows(dataset.workflows),
    checkStaleDeals(dataset.deals),
    checkPhoneFormat(dataset.contacts),
  ];

  const issues = rawIssues
    .filter((i): i is AuditIssue => i !== null)
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  const { score, interpretation } = calculateScore(issues);

  return {
    generated_at: new Date().toISOString(),
    dataset_summary: {
      contacts: dataset.contacts.length,
      deals: dataset.deals.length,
      workflows: dataset.workflows.length,
    },
    overall_score: score,
    score_interpretation: interpretation,
    issues,
  };
}
