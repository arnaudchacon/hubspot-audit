'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import type { AuditReport } from '@/lib/audit/types';
import { AuditReport as AuditReportView } from '@/components/AuditReport';

function Spinner() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" />
        <p className="text-caption text-text-tertiary uppercase tracking-[0.05em]">Loading report…</p>
      </div>
    </div>
  );
}

function AuditContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const source = searchParams.get('source');

  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (source !== 'demo') {
      router.replace('/');
      return;
    }

    fetch('/api/audit-demo')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data: AuditReport) => setReport(data))
      .catch(() => setError(true));
  }, [source, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-body text-text-secondary">Could not load the report. Please try again.</p>
      </div>
    );
  }

  if (!report) return <Spinner />;

  return <AuditReportView report={report} />;
}

export default function AuditPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <AuditContent />
    </Suspense>
  );
}
