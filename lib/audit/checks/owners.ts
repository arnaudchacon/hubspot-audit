import type { Contact, AuditIssue, Severity } from '@/lib/audit/types';

export function checkOwners(contacts: Contact[]): AuditIssue | null {
  const total = contacts.length;
  const orphans = contacts.filter(c => !c.owner_id || c.owner_id === '');
  const missing = orphans.length;

  if (missing === 0) return null;

  const pct = total === 0 ? 0 : (missing / total) * 100;
  const severity: Severity = pct >= 20 ? 'HIGH' : pct >= 10 ? 'MEDIUM' : 'LOW';

  return {
    check_id: 'owners',
    title: 'Contacts missing owner assignment',
    severity,
    detail: `${missing} of ${total} contacts (${pct.toFixed(0)}%) have no owner assigned.`,
    raw_data: {
      missing_count: missing,
      total_count: total,
      percentage: pct,
      sample_orphans: orphans.slice(0, 5).map(c => ({
        name: `${c.first_name} ${c.last_name}`,
        email: c.email,
        created_at: c.created_at,
      })),
    },
  };
}
