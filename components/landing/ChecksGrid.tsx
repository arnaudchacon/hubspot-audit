import { Copy, UserX, Zap, Clock, TrendingDown, Phone, AtSign } from 'lucide-react';

const CHECKS = [
  {
    icon: Copy,
    title: 'Duplicate contacts',
    body: 'Fuzzy matching on name, email, domain, and phone — catches what HubSpot’s exact-match dedup can’t.',
  },
  {
    icon: UserX,
    title: 'Ownership gaps',
    body: 'Contacts nobody owns, with an age breakdown that shows whether the intake is broken right now.',
  },
  {
    icon: Zap,
    title: 'Zombie workflows',
    body: 'Automation marked active with zero enrollments — clutter that hides what’s actually running.',
  },
  {
    icon: Clock,
    title: 'Stale deals',
    body: 'Active-pipeline deals with no activity in 90+ days, priced as ARR at risk.',
  },
  {
    icon: TrendingDown,
    title: 'Unforecastable deals',
    body: 'Deals missing an owner or amount — in your pipeline total, in no one’s forecast.',
  },
  {
    icon: Phone,
    title: 'Phone format chaos',
    body: 'Mixed formats that silently break calling integrations and SMS workflows.',
  },
  {
    icon: AtSign,
    title: 'Email quality',
    body: 'Freemail, role-based, and invalid addresses that never associate to companies.',
  },
];

export function ChecksGrid() {
  return (
    <section className="px-6 py-16 border-b border-border bg-surface">
      <div className="max-w-content mx-auto">
        <h2 className="font-serif text-[28px] text-text-primary mb-2">Seven checks, one score</h2>
        <p className="text-body text-text-secondary mb-10 max-w-[520px]">
          Each check has explicit severity rules — the score is arithmetic, not vibes.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CHECKS.map(check => (
            <div key={check.title} className="bg-bg border border-border rounded-lg p-5">
              <check.icon size={18} className="text-accent mb-3" strokeWidth={1.8} />
              <h3 className="text-body font-semibold text-text-primary mb-1.5">{check.title}</h3>
              <p className="text-body-sm text-text-secondary">{check.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
