import type { Severity } from '@/lib/audit/types';

const styles: Record<Severity, string> = {
  HIGH:   'text-severity-high bg-severity-high-bg',
  MEDIUM: 'text-severity-medium bg-severity-medium-bg',
  LOW:    'text-severity-low bg-severity-low-bg',
};

interface BadgeProps {
  severity: Severity;
}

export function Badge({ severity }: BadgeProps) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-[0.05em] ${styles[severity]}`}>
      {severity}
    </span>
  );
}
