import type { AuditIssue, PhoneFormatRawData } from '@/lib/audit/types';

interface Props { issue: AuditIssue }

const FORMAT_DISPLAY: Record<string, string> = {
  plus_format:  'PLUS FORMAT',
  double_zero:  'DOUBLE ZERO',
  parentheses:  'PARENTHESES',
  no_prefix:    'NO PREFIX',
  other:        'OTHER',
};

export function PhoneFormatExpanded({ issue }: Props) {
  const d = issue.raw_data as unknown as PhoneFormatRawData;

  const sorted = [...d.format_examples_with_counts].sort((a, b) => b.count - a.count);

  return (
    <div>
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.05em] mb-4"
        style={{ color: 'var(--text-tertiary)' }}
      >
        Phone Format Breakdown
      </p>

      <div className="flex flex-col gap-3">
        {sorted.map(fmt => (
          <div
            key={fmt.format}
            className="rounded-lg px-4 py-3"
            style={{ border: '1px solid var(--border)' }}
          >
            {/* Header */}
            <div className="flex items-baseline gap-2 mb-2">
              <span
                className="text-[12px] font-semibold uppercase tracking-[0.05em]"
                style={{ color: 'var(--text-primary)' }}
              >
                {FORMAT_DISPLAY[fmt.format] ?? fmt.format.replace(/_/g, ' ').toUpperCase()}
              </span>
              <span className="text-[12px]" style={{ color: 'var(--text-tertiary)' }}>
                — {fmt.count} contact{fmt.count !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Examples */}
            <div className="flex flex-col gap-0.5 mb-2">
              {fmt.examples.map((ex, i) => (
                <span
                  key={i}
                  className="text-[13px] font-mono"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {ex}
                </span>
              ))}
            </div>

            {/* Description */}
            <p
              className="text-[12px] italic"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {fmt.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
