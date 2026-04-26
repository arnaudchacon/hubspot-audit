export default function AuditLoading() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" />
        <p className="text-caption text-text-tertiary uppercase tracking-[0.05em]">Loading report…</p>
      </div>
    </div>
  );
}
