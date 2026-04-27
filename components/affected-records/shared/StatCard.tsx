interface StatCardProps {
  value: number;
  label: string;
}

export function StatCard({ value, label }: StatCardProps) {
  return (
    <div
      className="flex flex-col gap-1 px-4 py-3 rounded-lg border flex-1"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}
    >
      <span
        className="text-2xl font-mono font-medium leading-none"
        style={{ color: 'var(--text-primary)' }}
      >
        {value}
      </span>
      <span
        className="text-[11px] font-semibold uppercase tracking-[0.05em]"
        style={{ color: 'var(--text-tertiary)' }}
      >
        {label}
      </span>
    </div>
  );
}
