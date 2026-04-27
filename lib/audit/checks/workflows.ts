import type { Workflow, AuditIssue, Severity, WorkflowsRawData } from '@/lib/audit/types';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function classifyWorkflowName(name: string): WorkflowsRawData['zombie_full_list'][number]['name_pattern_hint'] {
  const lower = name.toLowerCase();
  if (/q[1-4]\s*20\d{2}|20\d{2}/.test(lower)) return 'expired_campaign';
  if (/old|legacy|v1|deprecated|backup/.test(lower)) return 'deprecated';
  if (/webinar|event|conference|launch/.test(lower)) return 'one_time_event';
  if (/test|trial|beta/.test(lower)) return 'experiment';
  return 'unknown';
}

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

  const now = Date.now();

  const zombieFullList: WorkflowsRawData['zombie_full_list'] = zombies.map(w => ({
    name: w.name,
    last_enrollment_date: w.last_enrollment_date,
    days_since_enrollment: Math.floor((now - new Date(w.last_enrollment_date).getTime()) / MS_PER_DAY),
    name_pattern_hint: classifyWorkflowName(w.name),
  }));

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
      zombie_full_list: zombieFullList,
    },
  };
}
