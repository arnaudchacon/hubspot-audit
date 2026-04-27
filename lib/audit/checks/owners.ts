import type { Contact, AuditIssue, Severity, OwnersRawData } from '@/lib/audit/types';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function checkOwners(contacts: Contact[]): AuditIssue | null {
  const total = contacts.length;
  const orphans = contacts.filter(c => !c.owner_id || c.owner_id === '');
  const missing = orphans.length;

  if (missing === 0) return null;

  const pct = total === 0 ? 0 : (missing / total) * 100;
  const severity: Severity = pct >= 20 ? 'HIGH' : pct >= 10 ? 'MEDIUM' : 'LOW';

  const now = Date.now();

  const orphansRecent5: OwnersRawData['orphans_recent_5'] = [...orphans]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
    .map(c => ({
      name: `${c.first_name} ${c.last_name}`,
      email: c.email,
      created_at: c.created_at,
      days_old: Math.floor((now - new Date(c.created_at).getTime()) / MS_PER_DAY),
    }));

  const dateDistribution = orphans.reduce<OwnersRawData['date_distribution']>(
    (acc, c) => {
      const age = Math.floor((now - new Date(c.created_at).getTime()) / MS_PER_DAY);
      if (age <= 30) acc.last_30_days++;
      else if (age <= 90) acc.last_90_days++;
      else acc.older++;
      return acc;
    },
    { last_30_days: 0, last_90_days: 0, older: 0 }
  );

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
      orphans_recent_5: orphansRecent5,
      date_distribution: dateDistribution,
    },
  };
}
