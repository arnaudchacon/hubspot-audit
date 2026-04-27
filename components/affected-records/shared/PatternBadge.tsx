type BadgeVariant = 'warning' | 'info' | 'positive' | 'accent' | 'danger' | 'neutral';

interface PatternBadgeProps {
  label: string;
  variant: BadgeVariant;
}

const STYLES: Record<BadgeVariant, { color: string; bg: string }> = {
  warning:  { color: 'var(--severity-medium)',    bg: 'var(--severity-medium-bg)' },
  info:     { color: 'var(--accent)',             bg: 'var(--accent-bg)' },
  positive: { color: 'var(--severity-low)',       bg: 'var(--severity-low-bg)' },
  accent:   { color: 'var(--accent)',             bg: 'var(--accent-bg)' },
  danger:   { color: 'var(--severity-high)',      bg: 'var(--severity-high-bg)' },
  neutral:  { color: 'var(--text-tertiary)',      bg: 'var(--surface)' },
};

export function PatternBadge({ label, variant }: PatternBadgeProps) {
  const { color, bg } = STYLES[variant];
  return (
    <span
      className="inline-block text-[10px] font-semibold uppercase tracking-[0.05em] px-2 py-0.5 rounded"
      style={{ color, backgroundColor: bg }}
    >
      {label}
    </span>
  );
}
