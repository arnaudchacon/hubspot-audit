import { levenshtein } from '@/lib/levenshtein';
import type { Contact, AuditIssue, Severity, DuplicatesRawData, ReviewPair } from '@/lib/audit/types';

// Pairs at or above MERGE_THRESHOLD are clustered automatically. Pairs in
// [REVIEW_THRESHOLD, MERGE_THRESHOLD) are the greyzone — surfaced for human
// review in the workbench instead of being silently dropped.
const MERGE_THRESHOLD = 0.80;
const REVIEW_THRESHOLD = 0.60;
const MAX_REVIEW_PAIRS = 40;

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

function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 0;
  return 1 - levenshtein(a, b) / maxLen;
}

// Levenshtein distance is at least the length difference, so this bounds the
// similarity from above without running the DP. Lets us skip most pairs.
function similarityUpperBound(lenA: number, lenB: number): number {
  const maxLen = Math.max(lenA, lenB);
  if (maxLen === 0) return 0;
  return 1 - Math.abs(lenA - lenB) / maxLen;
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

  // Precompute normalized fields once instead of per pair.
  const names = contacts.map(normalizeName);
  const locals = contacts.map(c => emailLocal(c.email));
  const phones = contacts.map(c => lastEightDigits(c.phone));

  type Candidate = { i: number; j: number; score: number; subscores: ReviewPair['subscores'] };
  const greyzone: Candidate[] = [];

  for (let i = 0; i < contacts.length; i++) {
    for (let j = i + 1; j < contacts.length; j++) {
      const domainScore = contacts[i].company_domain === contacts[j].company_domain ? 1.0 : 0.0;
      const phoneScore = phones[i] !== '' && phones[i] === phones[j] ? 1.0 : 0.0;

      // Cheap exact-safe prune: if even the most optimistic name/email
      // similarity can't reach the review threshold, skip the Levenshtein calls.
      const nameUpper = similarityUpperBound(names[i].length, names[j].length);
      const emailUpper = similarityUpperBound(locals[i].length, locals[j].length);
      if (0.40 * nameUpper + 0.30 * emailUpper + 0.20 * domainScore + 0.10 * phoneScore < REVIEW_THRESHOLD) {
        continue;
      }

      const nameScore = similarity(names[i], names[j]);
      const emailScore = similarity(locals[i], locals[j]);
      const score = 0.40 * nameScore + 0.30 * emailScore + 0.20 * domainScore + 0.10 * phoneScore;

      if (score >= MERGE_THRESHOLD) {
        parent[find(contacts[i].id)] = find(contacts[j].id);
      } else if (score >= REVIEW_THRESHOLD) {
        greyzone.push({
          i, j, score,
          subscores: { name: nameScore, email: emailScore, domain: domainScore, phone: phoneScore },
        });
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

  // Greyzone pairs whose members already ended up in the same auto cluster
  // (via a transitive high-confidence link) don't need review.
  const toReviewContact = (idx: number) => ({
    id: contacts[idx].id,
    name: `${contacts[idx].first_name} ${contacts[idx].last_name}`,
    email: contacts[idx].email,
    phone: contacts[idx].phone,
    domain: contacts[idx].company_domain,
    owner_id: contacts[idx].owner_id,
    created_at: contacts[idx].created_at,
  });

  const reviewPairs: ReviewPair[] = greyzone
    .filter(p => find(contacts[p.i].id) !== find(contacts[p.j].id))
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_REVIEW_PAIRS)
    .map(p => ({
      pair_id: [contacts[p.i].id, contacts[p.j].id].sort().join('|'),
      score: p.score,
      subscores: p.subscores,
      a: toReviewContact(p.i),
      b: toReviewContact(p.j),
    }));

  if (clusters.length === 0 && reviewPairs.length === 0) return null;

  const contactsById = Object.fromEntries(contacts.map(c => [c.id, c]));
  const affectedContacts = clusters.reduce((sum, c) => sum + c.length, 0);
  const clusterCount = clusters.length;
  const totalContacts = contacts.length;

  const severity: Severity = clusterCount > 5 ? 'HIGH' : clusterCount > 2 ? 'MEDIUM' : 'LOW';

  const sortedClusters = [...clusters].sort((a, b) => b.length - a.length);

  const fullClusters: DuplicatesRawData['full_clusters'] = sortedClusters.map((ids, idx) => {
    const clusterContacts = ids.map(id => contactsById[id]);
    const clusterNames = clusterContacts.map(c => normalizeName(c));
    const emailLocals = clusterContacts.map(c => emailLocal(c.email));
    const domains = clusterContacts.map(c => c.company_domain);
    const clusterPhones = clusterContacts.map(c => lastEightDigits(c.phone));
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
        name_varies: new Set(clusterNames).size > 1,
        email_local_varies: new Set(emailLocals).size > 1,
        domain_matches: new Set(domains).size === 1,
        phone_matches: clusterPhones[0] !== '' && new Set(clusterPhones).size === 1,
      },
    };
  });

  const detail = clusterCount > 0
    ? `Found ${clusterCount} duplicate clusters covering ${affectedContacts} of ${totalContacts} contacts.`
    : `No confirmed duplicates, but ${reviewPairs.length} borderline pair${reviewPairs.length !== 1 ? 's' : ''} need${reviewPairs.length === 1 ? 's' : ''} human review.`;

  return {
    check_id: 'duplicates',
    title: 'Likely duplicate contacts detected',
    severity,
    detail,
    raw_data: {
      cluster_count: clusterCount,
      affected_contacts: affectedContacts,
      total_contacts: totalContacts,
      review_pairs: reviewPairs,
      full_clusters: fullClusters,
    },
  };
}
