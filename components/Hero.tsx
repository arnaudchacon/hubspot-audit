'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { UploadDropzone } from '@/components/UploadDropzone';

export function Hero() {
  const [showUpload, setShowUpload] = useState(false);

  return (
    <>
      <main className="min-h-screen bg-bg flex items-center justify-center px-6 py-24 relative overflow-hidden">

        {/* Orb A — top-left, large, 18s drift */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-5%',
            width: '860px',
            height: '860px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(200,90,20,0.22) 0%, rgba(200,90,20,0.09) 45%, transparent 70%)',
            filter: 'blur(48px)',
            pointerEvents: 'none',
            animation: 'orb-drift-a 18s ease-in-out infinite',
          }}
        />

        {/* Orb B — bottom-right, smaller, 14s drift */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: '-20%',
            right: '-10%',
            width: '620px',
            height: '620px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(200,90,20,0.16) 0%, rgba(200,90,20,0.06) 45%, transparent 70%)',
            filter: 'blur(48px)',
            pointerEvents: 'none',
            animation: 'orb-drift-b 14s ease-in-out infinite',
          }}
        />

        <div className="w-full max-w-hero flex flex-col items-start gap-6 relative">

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
