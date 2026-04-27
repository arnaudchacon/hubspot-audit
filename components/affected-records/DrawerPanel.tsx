'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { AuditIssue } from '@/lib/audit/types';
import { RENDERERS } from './registry';

interface DrawerPanelProps {
  issue: AuditIssue | null;
  onClose: () => void;
}

export function DrawerPanel({ issue, onClose }: DrawerPanelProps) {
  const renderer = issue ? RENDERERS[issue.check_id] : null;
  const isOpen = !!issue && !!renderer;

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop — very subtle, clicking closes */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 40,
          background: 'rgba(0,0,0,0.06)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 280ms ease-out',
        }}
      />

      {/* Drawer panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100dvh',
          width: 'min(480px, 100vw)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg)',
          borderLeft: '1px solid var(--border)',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.07)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 280ms ease-out',
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-6 py-5 shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-1"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Affected Records
            </p>
            <h2
              className="text-[18px] font-semibold leading-snug"
              style={{ color: 'var(--text-primary)' }}
            >
              {issue && renderer ? renderer.panelTitle : ''}
            </h2>
            {issue && (
              <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                {issue.detail}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 ml-4 mt-0.5 p-1 rounded transition-colors duration-150"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
            aria-label="Close panel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {issue && renderer && <renderer.ExpandedContent issue={issue} />}
        </div>
      </div>
    </>
  );
}
