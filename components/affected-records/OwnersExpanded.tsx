import type { AuditIssue, OwnersRawData } from '@/lib/audit/types';
import { DataTable } from './shared/DataTable';
import { StatCard } from './shared/StatCard';
import { formatDate } from '@/lib/utils/format';

interface Props { issue: AuditIssue }

const COLUMNS = [
  { key: 'name',       label: 'Name',    mono: false },
  { key: 'email',      label: 'Email',   mono: false },
  { key: 'created',    label: 'Created', mono: false },
  { key: 'age',        label: 'Age',     mono: true  },
];

export function OwnersExpanded({ issue }: Props) {
  const d = issue.raw_data as unknown as OwnersRawData;
  const dist = d.date_distribution;

  const rows = d.orphans_recent_5.map(o => ({
    name:    o.name,
    email:   o.email,
    created: formatDate(o.created_at),
    age:     `${o.days_old} days`,
  }));

  return (
    <div>
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.05em] mb-4"
        style={{ color: 'var(--text-tertiary)' }}
      >
        Orphaned Contacts — Distribution
      </p>

      {/* Stat cards */}
      <div className="flex gap-3 mb-6">
        <StatCard value={dist.last_30_days} label="Last 30 days" />
        <StatCard value={dist.last_90_days} label="Last 90 days" />
        <StatCard value={dist.older}        label="Older" />
      </div>

      <p
        className="text-[11px] font-semibold uppercase tracking-[0.05em] mb-3"
        style={{ color: 'var(--text-tertiary)' }}
      >
        5 Most Recently Created
      </p>

      <DataTable columns={COLUMNS} rows={rows} />
    </div>
  );
}
