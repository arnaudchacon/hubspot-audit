import type { Deal, AuditIssue, Severity, DealHygieneRawData } from '@/lib/audit/types';

const ACTIVE_STAGES = ['discovery', 'qualification', 'proposal', 'negotiation'];

export function checkDealHygiene(deals: Deal[]): AuditIssue | null {
  const active = deals.filter(d => ACTIVE_STAGES.includes(d.stage));
  if (active.length === 0) return null;

  const flagged: DealHygieneRawData['flagged_deals'] = [];
  for (const d of active) {
    const problems: Array<'missing_owner' | 'missing_amount'> = [];
    if (!d.owner_id || d.owner_id === '') problems.push('missing_owner');
    if (!d.amount_usd || d.amount_usd <= 0) problems.push('missing_amount');
    if (problems.length > 0) {
      flagged.push({
        name: d.name,
        stage: d.stage,
        amount_usd: d.amount_usd,
        problems,
      });
    }
  }

  if (flagged.length === 0) return null;

  const missingOwner = flagged.filter(f => f.problems.includes('missing_owner')).length;
  const missingAmount = flagged.filter(f => f.problems.includes('missing_amount')).length;

  const severity: Severity =
    flagged.length >= 5 ? 'HIGH' : flagged.length >= 2 ? 'MEDIUM' : 'LOW';

  const parts: string[] = [];
  if (missingOwner > 0) parts.push(`${missingOwner} with no owner`);
  if (missingAmount > 0) parts.push(`${missingAmount} with no amount`);

  return {
    check_id: 'deal_hygiene',
    title: 'Unforecastable deals in active pipeline',
    severity,
    detail: `${flagged.length} of ${active.length} active deal${active.length !== 1 ? 's' : ''} can't be forecast: ${parts.join(', ')}.`,
    raw_data: {
      flagged_count: flagged.length,
      total_active: active.length,
      missing_owner_count: missingOwner,
      missing_amount_count: missingAmount,
      flagged_deals: flagged,
    },
  };
}
