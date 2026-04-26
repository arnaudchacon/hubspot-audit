import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Score } from '@/components/ui/Score';

export default function TestPage() {
  return (
    <main className="min-h-screen bg-bg px-12 py-16 flex flex-col gap-16">

      <section className="flex flex-col gap-4">
        <p className="text-caption text-text-tertiary uppercase tracking-[0.05em]">Buttons</p>
        <div className="flex items-center gap-3">
          <Button variant="primary">Primary action</Button>
          <Button variant="secondary">Secondary action</Button>
          <Button variant="ghost">Ghost action</Button>
          <Button variant="primary" disabled>Disabled</Button>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <p className="text-caption text-text-tertiary uppercase tracking-[0.05em]">Badges</p>
        <div className="flex items-center gap-3">
          <Badge severity="HIGH" />
          <Badge severity="MEDIUM" />
          <Badge severity="LOW" />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <p className="text-caption text-text-tertiary uppercase tracking-[0.05em]">Card</p>
        <Card className="max-w-sm">
          <p className="text-h3 text-text-primary mb-2">Card title</p>
          <p className="text-body text-text-secondary">
            Static card: 1px border, white background, 8px radius. No shadow at rest. Shadow appears on hover.
          </p>
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <p className="text-caption text-text-tertiary uppercase tracking-[0.05em]">Score (animates on load)</p>
        <div className="flex items-end gap-8">
          <div className="flex flex-col items-center gap-2">
            <Score score={55} />
            <p className="text-caption text-text-tertiary">55 — amber</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Score score={82} />
            <p className="text-caption text-text-tertiary">82 — green</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Score score={28} />
            <p className="text-caption text-text-tertiary">28 — red</p>
          </div>
        </div>
      </section>

    </main>
  );
}
