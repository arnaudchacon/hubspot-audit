import type { Contact, AuditIssue, Severity, PhoneFormatRawData } from '@/lib/audit/types';

type PhoneBucket = 'plus_format' | 'double_zero' | 'parentheses' | 'no_prefix' | 'other';

const BUCKET_DESCRIPTIONS: Record<PhoneBucket, string> = {
  plus_format: '+CountryCode style (e.g. +1 415 555 0101)',
  double_zero: '00CountryCode style (e.g. 0033 6 12 34 56)',
  parentheses: 'North American parentheses style (e.g. (415) 555-0101)',
  no_prefix: 'Raw digits, no country prefix (e.g. 4155550101)',
  other: 'Other or unrecognized format',
};

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
  const bucketExamples: Record<string, string[]> = {};

  for (const c of contacts) {
    const bucket = classifyPhone(c.phone);
    buckets[bucket] = (buckets[bucket] ?? 0) + 1;
    if (!bucketExamples[bucket]) bucketExamples[bucket] = [];
    if (bucketExamples[bucket].length < 2) bucketExamples[bucket].push(c.phone);
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

  const formatExamplesWithCounts: PhoneFormatRawData['format_examples_with_counts'] =
    significantBuckets.map(([format, count]) => ({
      format,
      count,
      examples: bucketExamples[format] ?? [],
      description: BUCKET_DESCRIPTIONS[format as PhoneBucket] ?? format,
    }));

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
      format_examples_with_counts: formatExamplesWithCounts,
    },
  };
}
