'use client';

import type { AuditIssue } from '@/lib/audit/types';
import { RENDERERS } from './registry';

interface AffectedRecordsProps {
  issue: AuditIssue;
  onOpen: () => void;
}

export function AffectedRecords({ issue, onOpen }: AffectedRecordsProps) {
  const renderer = RENDERERS[issue.check_id];
  if (!renderer) return null;

  return (
    <div className="mt-4 pt-4 flex justify-end" style={{ borderTop: '1px solid var(--border)' }}>
      <button
        onClick={onOpen}
        className="text-[13px] font-medium transition-colors duration-150"
        style={{ color: 'var(--text-secondary)' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
      >
        {renderer.buttonText(issue)} →
      </button>
    </div>
  );
}
