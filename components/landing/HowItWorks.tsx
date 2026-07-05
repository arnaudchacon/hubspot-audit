const STEPS = [
  {
    title: 'Export from HubSpot',
    body: 'Export contacts (and optionally deals and workflows) as CSV. Common HubSpot column names are mapped automatically.',
  },
  {
    title: 'Run the audit',
    body: 'Seven checks run server-side in seconds. Nothing is stored — the report lives in your browser only.',
  },
  {
    title: 'Fix with a plan',
    body: 'Every issue ships with a prioritized recommendation, the exact affected records, and CSV exports ready for re-import.',
  },
];

export function HowItWorks() {
  return (
    <section className="px-6 py-16 border-b border-border">
      <div className="max-w-content mx-auto">
        <h2 className="font-serif text-[28px] text-text-primary mb-10">How it works</h2>
        <div className="grid md:grid-cols-3 gap-10">
          {STEPS.map((step, i) => (
            <div key={step.title}>
              <p className="font-mono text-[13px] text-accent mb-3">0{i + 1}</p>
              <h3 className="text-h3 text-text-primary mb-2">{step.title}</h3>
              <p className="text-body text-text-secondary">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
