import type { AuditIssue, StaleDealsRawData } from '@/lib/audit/types';
import { DataTable } from './shared/DataTable';
import { PatternBadge } from './shared/PatternBadge';
import { formatAmount, formatAmountCompact } from '@/lib/utils/format';

interface Props { issue: AuditIssue }

type DealHint = StaleDealsRawData['stale_full_list'][number]['deal_type_hint'];

const DEAL_CONFIG: Record<DealHint, { label: string; variant: 'info' | 'accent' | 'positive' } | null> = {
  pilot:          { label: 'PILOT',    variant: 'info'     },
  enterprise:     { label: 'ENTERPRISE', variant: 'accent' },
  annual_renewal: { label: 'ANNUAL',   variant: 'positive' },
  expansion:      { label: 'EXPANSION', variant: 'positive' },
  standard:       null,
};

const COLUMNS = [
  { key: 'name',  label: 'Deal Name', mono: false },
  { key: 'stage', label: 'Stage',     mono: false },
  { key: 'amount',label: 'Amount',    mono: true  },
  { key: 'days',  label: 'Days Dead', mono: true  },
  { key: 'type',  label: 'Type',      mono: false },
];

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function StaleDealsExpanded({ issue }: Props) {
  const d = issue.raw_data as unknown as StaleDealsRawData;
  const totalLabel = formatAmountCompact(d.arr_at_risk_usd);

  const rows = d.stale_full_list.map(deal => {
    const config = DEAL_CONFIG[deal.deal_type_hint];
    return {
      name:   deal.name,
      stage:  titleCase(deal.stage),
      amount: formatAmount(deal.amount_usd),
      days:   `${deal.days_inactive} days`,
      type:   config
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
        Stale Deals — {d.stale_count} Detected · {totalLabel} at Risk
      </p>
      <DataTable columns={COLUMNS} rows={rows} />
    </div>
  );
}
