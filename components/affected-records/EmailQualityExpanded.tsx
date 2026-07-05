import type { AuditIssue, EmailQualityRawData } from '@/lib/audit/types';
import { DataTable } from './shared/DataTable';
import { StatCard } from './shared/StatCard';

interface Props { issue: AuditIssue }

const REASON_DISPLAY: Record<string, string> = {
  invalid:    'Invalid syntax',
  freemail:   'Personal freemail',
  role_based: 'Role-based inbox',
};

const COLUMNS = [
  { key: 'name',   label: 'Name',   mono: false, width: '26%' },
  { key: 'email',  label: 'Email',  mono: true,  width: '46%' },
  { key: 'reason', label: 'Reason', mono: false, width: '28%' },
];

export function EmailQualityExpanded({ issue }: Props) {
  const d = issue.raw_data as unknown as EmailQualityRawData;

  const rows = d.samples.map(s => ({
    name:   s.name,
    email:  s.email,
    reason: REASON_DISPLAY[s.reason] ?? s.reason,
  }));

  return (
    <div>
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.05em] mb-4"
        style={{ color: 'var(--text-tertiary)' }}
      >
        Flagged Emails — Breakdown
      </p>

      <div className="flex gap-3 mb-6">
        <StatCard value={d.freemail_count} label="Freemail" />
        <StatCard value={d.role_count}     label="Role-based" />
        <StatCard value={d.invalid_count}  label="Invalid" />
      </div>

      <p
        className="text-[11px] font-semibold uppercase tracking-[0.05em] mb-3"
        style={{ color: 'var(--text-tertiary)' }}
      >
        Flagged Contacts
      </p>

      <DataTable columns={COLUMNS} rows={rows} />
    </div>
  );
}
