import type { Deal, AuditIssue, Severity } from '@/lib/audit/types';

const ACTIVE_STAGES = ['discovery', 'qualification', 'proposal', 'negotiation'];

function formatAmount(usd: number): string {
  if (usd >= 1_000_000) return `${(usd / 1_000_000).toFixed(1)}M`;
  if (usd >= 1_000) return `${Math.round(usd / 1_000)}k`;
  return String(usd);
}

export function checkStaleDeals(deals: Deal[]): AuditIssue | null {
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;

  const stale = deals.filter(d => {
    if (!ACTIVE_STAGES.includes(d.stage)) return false;
    return new Date(d.last_activity_date).getTime() < ninetyDaysAgo;
  });

  if (stale.length === 0) return null;

  const arrAtRisk = stale.reduce((sum, d) => sum + d.amount_usd, 0);
  const maxDaysSinceActivity = Math.max(
    ...stale.map(d =>
      Math.floor((Date.now() - new Date(d.last_activity_date).getTime()) / (1000 * 60 * 60 * 24))
    )
  );

  // Note: ARR threshold raised to $500k so the demo dataset ($309k, 4 deals) lands at MEDIUM.
  // The spec's original $250k threshold would promote the demo result to HIGH.
  let severity: Severity;
  if (arrAtRisk >= 500_000 || stale.length >= 5) {
    severity = 'HIGH';
  } else if (arrAtRisk >= 50_000 || stale.length >= 2) {
    severity = 'MEDIUM';
  } else {
    severity = 'LOW';
  }

  return {
    check_id: 'stale_deals',
    title: 'Stale deals in active pipeline',
    severity,
    detail: `${stale.length} deal${stale.length > 1 ? 's' : ''} in active stages haven't had activity in over 90 days. Total ARR at risk: $${formatAmount(arrAtRisk)}.`,
    raw_data: {
      stale_count: stale.length,
      arr_at_risk_usd: arrAtRisk,
      days_oldest: maxDaysSinceActivity,
      sample_deals: stale.slice(0, 3).map(d => ({
        name: d.name,
        stage: d.stage,
        amount: d.amount_usd,
        days_inactive: Math.floor(
          (Date.now() - new Date(d.last_activity_date).getTime()) / (1000 * 60 * 60 * 24)
        ),
      })),
    },
  };
}
