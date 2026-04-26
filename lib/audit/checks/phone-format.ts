import type { Contact, AuditIssue, Severity } from '@/lib/audit/types';

type PhoneBucket = 'plus_format' | 'double_zero' | 'parentheses' | 'no_prefix' | 'other';

function classifyPhone(phone: string): PhoneBucket {
  const cleaned = phone.trim();
  if (cleaned.startsWith('+')) return 'plus_format';
  if (cleaned.startsWith('00')) return 'double_zero';
  if (/[()]/.test(cleaned)) return 'parentheses';
  if (/^\d/.test(cleaned)) return 'no_prefix';
  return 'other';
}

export function checkPhoneFormat(contacts: Contact[]): AuditIssue | null {
  if (contacts.length === 0) return null;

  const buckets: Record<string, number> = {};
  for (const c of contacts) {
    const bucket = classifyPhone(c.phone);
    buckets[bucket] = (buckets[bucket] ?? 0) + 1;
  }

  const significantBuckets = Object.entries(buckets).filter(
    ([, count]) => count / contacts.length > 0.05
  );
  const numSignificant = significantBuckets.length;

  if (numSignificant <= 1) return null;

  let severity: Severity;
  if (numSignificant >= 4) {
    severity = 'HIGH';
  } else if (numSignificant === 3) {
    severity = 'MEDIUM';
  } else {
    severity = 'LOW';
  }

  const exampleFor = (bucket: PhoneBucket) =>
    contacts.find(c => classifyPhone(c.phone) === bucket)?.phone;

  return {
    check_id: 'phone_format',
    title: 'Inconsistent phone number formats',
    severity,
    detail: `${numSignificant} different phone number formats are in use across your contacts.`,
    raw_data: {
      format_distribution: buckets,
      significant_bucket_count: numSignificant,
      examples: {
        plus_format: exampleFor('plus_format'),
        double_zero: exampleFor('double_zero'),
        parentheses: exampleFor('parentheses'),
        no_prefix: exampleFor('no_prefix'),
      },
    },
  };
}
