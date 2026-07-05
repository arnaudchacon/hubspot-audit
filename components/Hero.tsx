'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { UploadDropzone } from '@/components/UploadDropzone';

export function Hero() {
  const [showUpload, setShowUpload] = useState(false);

  return (
    <>
      <section className="px-6 pt-24 pb-20 border-b border-border">
        <div className="max-w-content mx-auto">
          <div className="max-w-[680px]">
            <p className="text-caption text-accent uppercase tracking-[0.08em] font-mono mb-5">
              CRM data quality, audited
            </p>

            <h1 className="font-serif text-text-primary text-[44px] md:text-[60px] leading-[1.05] tracking-[-0.01em] mb-6">
              Most HubSpot instances are quietly broken.
            </h1>

            <p className="text-body-lg text-text-secondary max-w-[540px] mb-8">
              Run seven audit checks against your CRM export and get a scored report:
              duplicate contacts, ownership gaps, dead automation, unforecastable pipeline —
              each with a specific fix, the affected records, and an exportable cleanup plan.
            </p>

            <div className="flex items-center gap-3">
              <Link href="/audit?source=demo">
                <Button variant="primary">See a sample report</Button>
              </Link>
              <Button variant="secondary" onClick={() => setShowUpload(true)}>
                Audit your CSV
              </Button>
            </div>

            <p className="text-body-sm text-text-tertiary mt-6">
              No account. Files are processed in memory and never stored — closing the tab is the only cleanup.
            </p>
          </div>
        </div>
      </section>

      {showUpload && <UploadDropzone onClose={() => setShowUpload(false)} />}
    </>
  );
}
