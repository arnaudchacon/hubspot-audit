import Link from 'next/link';

export function Nav() {
  return (
    <header className="sticky top-0 z-30 bg-bg/90 backdrop-blur-sm border-b border-border no-print">
      <div className="max-w-content mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-baseline gap-2 group">
          <span className="font-serif text-[19px] text-text-primary leading-none">
            Health Check
          </span>
          <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-text-tertiary group-hover:text-text-secondary transition-colors duration-150">
            for HubSpot
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/audit?source=demo"
            className="text-body-sm font-medium text-text-secondary hover:text-text-primary transition-colors duration-150"
          >
            Demo report
          </Link>
          <Link
            href="/"
            className="text-body-sm font-medium bg-ink text-bg px-3.5 py-1.5 rounded-[6px] hover:bg-ink-hover transition-colors duration-150"
          >
            Run an audit
          </Link>
        </nav>
      </div>
    </header>
  );
}
