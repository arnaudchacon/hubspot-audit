import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function ReviewFeature() {
  return (
    <section className="px-6 py-16 border-b border-border">
      <div className="max-w-content mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-caption text-accent uppercase tracking-[0.08em] font-mono mb-4">
            Duplicate review workbench
          </p>
          <h2 className="font-serif text-[28px] text-text-primary mb-4 leading-snug">
            Automation decides the obvious.
            <br />
            You decide the greyzone.
          </h2>
          <p className="text-body text-text-secondary mb-4 max-w-[440px]">
            High-confidence duplicates are clustered automatically. But the borderline pairs —
            a 0.72 similarity score, same company, slightly different name — are where dedup
            actually goes wrong. The workbench deals you each borderline pair as a card:
            confirm, reject, or skip, with keyboard shortcuts and per-signal scores.
          </p>
          <p className="text-body text-text-secondary mb-6 max-w-[440px]">
            Confirmed pairs merge into pools, and the whole session exports as a merge plan
            CSV ready for HubSpot re-import.
          </p>
          <Link
            href="/review?source=demo"
            className="inline-flex items-center gap-1.5 text-body font-medium text-accent hover:text-accent-hover transition-colors duration-150"
          >
            Try it on the demo data <ArrowRight size={15} />
          </Link>
        </div>

        {/* Stylized pair-card preview */}
        <div className="relative select-none" aria-hidden>
          <div className="absolute inset-0 translate-x-2 translate-y-2 bg-surface border border-border rounded-xl" />
          <div className="relative bg-bg border border-border rounded-xl p-6 shadow-hover">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-text-tertiary">
                Pair 3 of 8
              </span>
              <span className="text-[12px] font-mono text-accent">match 0.73</span>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-5">
              {[
                { name: 'Sarah Chen', email: 'sarah@meridiancap.io' },
                { name: 'Sarah Cheng', email: 's.cheng@meridiancap.io' },
              ].map(c => (
                <div key={c.email} className="border border-border rounded-lg p-3">
                  <p className="text-body-sm font-semibold text-text-primary">{c.name}</p>
                  <p className="text-[12px] font-mono text-text-secondary truncate">{c.email}</p>
                  <p className="text-[12px] text-text-tertiary mt-1">meridiancap.io</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-body-sm text-severity-high font-medium">← Not a duplicate</span>
              <span className="text-body-sm text-text-tertiary">Skip</span>
              <span className="text-body-sm text-severity-low font-medium">Duplicate →</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
