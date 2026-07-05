'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { DuplicatesRawData } from '@/lib/audit/types';
import { loadReport, type LoadedReport } from '@/lib/report-loader';
import { ReviewWorkbench } from '@/components/review/ReviewWorkbench';

function Spinner() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" />
        <p className="text-caption text-text-tertiary uppercase tracking-[0.05em]">Loading review…</p>
      </div>
    </div>
  );
}

function ReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loaded, setLoaded] = useState<LoadedReport | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadReport(searchParams)
      .then(result => {
        if (cancelled) return;
        if (result) setLoaded(result);
        else router.replace('/');
      })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-body text-text-secondary">Could not load the review. Please try again.</p>
      </div>
    );
  }

  if (!loaded) return <Spinner />;

  const duplicatesIssue = loaded.report.issues.find(i => i.check_id === 'duplicates');
  const rawData = duplicatesIssue?.raw_data as unknown as DuplicatesRawData | undefined;

  return (
    <ReviewWorkbench
      pairs={rawData?.review_pairs ?? []}
      clusters={rawData?.full_clusters ?? []}
      datasetKey={loaded.historyId}
      reportHref={`/audit?id=${loaded.historyId}`}
    />
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <ReviewContent />
    </Suspense>
  );
}
