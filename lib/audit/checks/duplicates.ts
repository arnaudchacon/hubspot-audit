import { levenshtein } from '@/lib/levenshtein';
import type { Contact, AuditIssue, Severity, DuplicatesRawData } from '@/lib/audit/types';

function normalizeName(contact: Contact): string {
  return (contact.first_name + ' ' + contact.last_name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function emailLocal(email: string): string {
  return email.split('@')[0] ?? '';
}

function lastEightDigits(phone: string): string {
  return phone.replace(/\D/g, '').slice(-8);
}

function nameSimilarity(a: Contact, b: Contact): number {
  const fullA = normalizeName(a);
  const fullB = normalizeName(b);
  const distance = levenshtein(fullA, fullB);
  const maxLen = Math.max(fullA.length, fullB.length);
  return maxLen === 0 ? 0 : 1 - distance / maxLen;
}

function pairScore(a: Contact, b: Contact): number {
  const nameScore = nameSimilarity(a, b);

  const localA = emailLocal(a.email);
  const localB = emailLocal(b.email);
  const emailDist = levenshtein(localA, localB);
  const emailScore = Math.max(localA.length, localB.length) === 0
    ? 0
    : 1 - emailDist / Math.max(localA.length, localB.length);

  const domainScore = a.company_domain === b.company_domain ? 1.0 : 0.0;

  const phoneScore = lastEightDigits(a.phone) !== '' &&
    lastEightDigits(a.phone) === lastEightDigits(b.phone) ? 1.0 : 0.0;

  return 0.40 * nameScore + 0.30 * emailScore + 0.20 * domainScore + 0.10 * phoneScore;
}

// Union-Find helpers
function makeFind(parent: Record<string, string>) {
  return function find(x: string): string {
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  };
}

export function checkDuplicates(contacts: Contact[]): AuditIssue | null {
  const parent: Record<string, string> = {};
  for (const c of contacts) parent[c.id] = c.id;
  const find = makeFind(parent);

  for (let i = 0; i < contacts.length; i++) {
    for (let j = i + 1; j < contacts.length; j++) {
      if (pairScore(contacts[i], contacts[j]) >= 0.80) {
        parent[find(contacts[i].id)] = find(contacts[j].id);
      }
    }
  }

  // Build clusters of size > 1
  const clusterMap: Record<string, string[]> = {};
  for (const c of contacts) {
    const root = find(c.id);
    if (!clusterMap[root]) clusterMap[root] = [];
    clusterMap[root].push(c.id);
  }
  const clusters = Object.values(clusterMap).filter(c => c.length > 1);

  if (clusters.length === 0) return null;

  const contactsById = Object.fromEntries(contacts.map(c => [c.id, c]));
  const affectedContacts = clusters.reduce((sum, c) => sum + c.length, 0);
  const clusterCount = clusters.length;
  const totalContacts = contacts.length;

  const severity: Severity = clusterCount > 5 ? 'HIGH' : clusterCount > 2 ? 'MEDIUM' : 'LOW';

  const sortedClusters = [...clusters].sort((a, b) => b.length - a.length).slice(0, 5);

  const fullClusters: DuplicatesRawData['full_clusters'] = sortedClusters.map((ids, idx) => {
    const clusterContacts = ids.map(id => contactsById[id]);
    const names = clusterContacts.map(c => normalizeName(c));
    const emailLocals = clusterContacts.map(c => emailLocal(c.email));
    const domains = clusterContacts.map(c => c.company_domain);
    const phones = clusterContacts.map(c => lastEightDigits(c.phone));
    return {
      cluster_id: `cluster_${idx + 1}`,
      contact_ids: ids,
      contacts: clusterContacts.map(c => ({
        id: c.id,
        name: `${c.first_name} ${c.last_name}`,
        email: c.email,
        domain: c.company_domain,
        phone_normalized: lastEightDigits(c.phone),
      })),
      similarity_signals: {
        name_varies: new Set(names).size > 1,
        email_local_varies: new Set(emailLocals).size > 1,
        domain_matches: new Set(domains).size === 1,
        phone_matches: phones[0] !== '' && new Set(phones).size === 1,
      },
    };
  });

  return {
    check_id: 'duplicates',
    title: 'Likely duplicate contacts detected',
    severity,
    detail: `Found ${clusterCount} duplicate clusters covering ${affectedContacts} of ${totalContacts} contacts.`,
    raw_data: {
      cluster_count: clusterCount,
      affected_contacts: affectedContacts,
      total_contacts: totalContacts,
      sample_clusters: clusters.slice(0, 3).map(ids => ({
        contacts: ids.map(id => contactsById[id]),
      })),
      full_clusters: fullClusters,
    },
  };
}
