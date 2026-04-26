'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { UploadDropzone } from '@/components/UploadDropzone';

export function Hero() {
  const [showUpload, setShowUpload] = useState(false);

  return (
    <>
      <main className="min-h-screen bg-bg flex items-center justify-center px-6 py-24">
        <div className="w-full max-w-hero flex flex-col items-start gap-6">

          <p className="text-caption text-text-tertiary uppercase tracking-[0.05em]">
            FIG 0.1 — A CRM AUDIT TOOL
          </p>

          <h1 className="text-display text-text-primary">
            Most HubSpot instances are quietly broken.
          </h1>

          <p className="text-body-lg text-text-secondary" style={{ maxWidth: '60%' }}>
            Upload your contacts export and get a scored audit report with specific, actionable fix recommendations.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <Link href="/audit?source=demo">
              <Button variant="primary">Run Demo Audit</Button>
            </Link>
            <Button variant="secondary" onClick={() => setShowUpload(true)}>
              Upload Your CSV
            </Button>
          </div>

          <p className="text-caption text-text-tertiary mt-6">
            Built by Arnaud Chacon
          </p>

        </div>
      </main>

      {showUpload && <UploadDropzone onClose={() => setShowUpload(false)} />}
    </>
  );
}
