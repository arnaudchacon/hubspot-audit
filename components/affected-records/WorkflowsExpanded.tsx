import type { AuditIssue, WorkflowsRawData } from '@/lib/audit/types';
import { DataTable } from './shared/DataTable';
import { PatternBadge } from './shared/PatternBadge';
import { formatDate } from '@/lib/utils/format';

interface Props { issue: AuditIssue }

type PatternHint = WorkflowsRawData['zombie_full_list'][number]['name_pattern_hint'];

const PATTERN_CONFIG: Record<PatternHint, { label: string; variant: 'warning' | 'danger' | 'info' | 'neutral' } | null> = {
  expired_campaign: { label: 'EXPIRED CAMPAIGN', variant: 'warning' },
  deprecated:       { label: 'DEPRECATED',       variant: 'danger'  },
  one_time_event:   { label: 'ONE-TIME EVENT',   variant: 'info'    },
  experiment:       { label: 'EXPERIMENT',       variant: 'neutral' },
  unknown:          null,
};

const COLUMNS = [
  { key: 'name',     label: 'Name',            mono: false },
  { key: 'last',     label: 'Last Enrollment', mono: false },
  { key: 'days',     label: 'Days Dead',       mono: true  },
  { key: 'pattern',  label: 'Pattern',         mono: false },
];

export function WorkflowsExpanded({ issue }: Props) {
  const d = issue.raw_data as unknown as WorkflowsRawData;

  const rows = d.zombie_full_list.map(w => {
    const config = PATTERN_CONFIG[w.name_pattern_hint];
    return {
      name:    w.name,
      last:    formatDate(w.last_enrollment_date),
      days:    `${w.days_since_enrollment} days`,
      pattern: config
        ? <PatternBadge label={config.label} variant={config.variant} />
        : <span style={{ color: 'var(--text-tertiary)' }}>—</span>,
    };
  });

  return (
    <div>
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.05em] mb-4"
        style={{ color: 'var(--text-tertiary)' }}
      >
        Zombie Workflows — {d.zombie_count} Detected
      </p>
      <DataTable columns={COLUMNS} rows={rows} />
    </div>
  );
}
