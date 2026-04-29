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

          <p className="text-caption text-text-tertiary uppercase tracking-[0.05em] font-mono">
            FIG 00 — A CRM audit tool
          </p>

          <h1 className="font-serif text-text-primary text-hero-mobile md:text-hero-desktop">
            Most HubSpot instances<br />are quietly broken.
          </h1>

          <p className="text-body-lg text-text-secondary max-w-[560px]">
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
            Built by{' '}
            <a
              href="https://linkedin.com/in/arnaudchacon"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-text-primary transition-colors duration-150"
            >
              Arnaud Chacon
            </a>
            {' · '}
            <a
              href="mailto:arnaudchacon@gmail.com"
              className="text-text-secondary hover:text-text-primary transition-colors duration-150"
            >
              arnaudchacon@gmail.com
            </a>
          </p>

        </div>
      </main>

      {showUpload && <UploadDropzone onClose={() => setShowUpload(false)} />}
    </>
  );
}
