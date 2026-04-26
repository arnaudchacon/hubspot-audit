import type { AuditIssue } from '@/lib/audit/types';

// Tuned deduction values (from AUDIT_CHECKS_SPEC.md recommended adjustment):
// 2 HIGH + 2 MEDIUM + 1 LOW = 28 + 14 + 3 = 45 → score 55 ("Below median")
const DEDUCTIONS = { HIGH: 14, MEDIUM: 7, LOW: 3 } as const;

export function calculateScore(issues: AuditIssue[]): {
  score: number;
  interpretation: string;
} {
  const deduction = issues.reduce((sum, i) => sum + DEDUCTIONS[i.severity], 0);
  const score = Math.max(0, Math.min(100, 100 - deduction));

  let interpretation: string;
  if (score >= 85) {
    interpretation = 'Healthy. Your CRM is in good shape.';
  } else if (score >= 70) {
    interpretation = 'Generally healthy with some hygiene issues to address.';
  } else if (score >= 55) {
    interpretation = 'Below median for B2B SaaS instances. Several issues are likely impacting reporting accuracy.';
  } else if (score >= 40) {
    interpretation = 'Significant data quality problems. Reporting and forecasting are likely unreliable.';
  } else {
    interpretation = 'Critical issues across multiple dimensions. Recommend a structured cleanup project.';
  }

  return { score, interpretation };
}
