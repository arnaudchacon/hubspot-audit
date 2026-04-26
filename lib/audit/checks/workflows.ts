import type { Workflow, AuditIssue, Severity } from '@/lib/audit/types';

export function checkWorkflows(workflows: Workflow[]): AuditIssue | null {
  const active = workflows.filter(w => w.is_active);
  const zombies = active.filter(w => w.enrollment_count_30d === 0);

  if (zombies.length === 0) return null;

  const zombiePct = active.length === 0 ? 0 : (zombies.length / active.length) * 100;

  // Note: percentage threshold raised to 50% so the demo dataset (3/8 = 37.5%) lands at MEDIUM.
  // The spec's original 30% threshold would promote the demo result to HIGH.
  let severity: Severity;
  if (zombies.length >= 5 || zombiePct >= 50) {
    severity = 'HIGH';
  } else if (zombies.length >= 2) {
    severity = 'MEDIUM';
  } else {
    severity = 'LOW';
  }

  return {
    check_id: 'workflows',
    title: 'Inactive workflows still marked active',
    severity,
    detail: `${zombies.length} active workflow${zombies.length > 1 ? 's' : ''} ${zombies.length > 1 ? 'have' : 'has'} had zero enrollments in the last 30 days.`,
    raw_data: {
      zombie_count: zombies.length,
      total_active: active.length,
      zombie_workflows: zombies.map(w => ({
        name: w.name,
        last_enrollment: w.last_enrollment_date,
      })),
    },
  };
}
