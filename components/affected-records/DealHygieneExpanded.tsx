import type { AuditIssue, DealHygieneRawData } from '@/lib/audit/types';
import { DataTable } from './shared/DataTable';
import { StatCard } from './shared/StatCard';

interface Props { issue: AuditIssue }

const PROBLEM_DISPLAY: Record<string, string> = {
  missing_owner:  'No owner',
  missing_amount: 'No amount',
};

const COLUMNS = [
  { key: 'name',    label: 'Deal',    mono: false, width: '38%' },
  { key: 'stage',   label: 'Stage',   mono: false, width: '20%' },
  { key: 'amount',  label: 'Amount',  mono: true,  width: '18%' },
  { key: 'problems', label: 'Missing', mono: false, width: '24%' },
];

export function DealHygieneExpanded({ issue }: Props) {
  const d = issue.raw_data as unknown as DealHygieneRawData;

  const rows = d.flagged_deals.map(f => ({
    name:     f.name,
    stage:    f.stage,
    amount:   f.amount_usd > 0 ? `$${f.amount_usd.toLocaleString()}` : '—',
    problems: f.problems.map(p => PROBLEM_DISPLAY[p] ?? p).join(', '),
  }));

  return (
    <div>
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.05em] mb-4"
        style={{ color: 'var(--text-tertiary)' }}
      >
        Unforecastable Deals — Breakdown
      </p>

      <div className="flex gap-3 mb-6">
        <StatCard value={d.missing_owner_count}  label="No owner" />
        <StatCard value={d.missing_amount_count} label="No amount" />
        <StatCard value={d.total_active}         label="Active deals" />
      </div>

      <p
        className="text-[11px] font-semibold uppercase tracking-[0.05em] mb-3"
        style={{ color: 'var(--text-tertiary)' }}
      >
        Flagged Deals
      </p>

      <DataTable columns={COLUMNS} rows={rows} />
    </div>
  );
}
