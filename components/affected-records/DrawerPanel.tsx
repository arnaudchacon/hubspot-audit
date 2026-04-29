'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import type { AuditIssue } from '@/lib/audit/types';
import { RENDERERS } from './registry';

interface DrawerPanelProps {
  issue: AuditIssue | null;
  onClose: () => void;
}

const DEFAULT_WIDTH = 480;
const MIN_WIDTH = 400;
const STORAGE_KEY = 'drawer-width';

function clampWidth(width: number): number {
  if (typeof window === 'undefined') return width;
  const max = Math.max(MIN_WIDTH, window.innerWidth - 80);
  return Math.min(max, Math.max(MIN_WIDTH, width));
}

export function DrawerPanel({ issue, onClose }: DrawerPanelProps) {
  const renderer = issue ? RENDERERS[issue.check_id] : null;
  const isOpen = !!issue && !!renderer;

  const [width, setWidth] = useState<number>(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(DEFAULT_WIDTH);

  // Restore saved width on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed)) setWidth(clampWidth(parsed));
    }
  }, []);

  // Reclamp on viewport resize so a previously-wide drawer doesn't overflow.
  useEffect(() => {
    const onResize = () => setWidth(w => clampWidth(w));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [width]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isResizing) return;
    const delta = startXRef.current - e.clientX;
    setWidth(clampWidth(startWidthRef.current + delta));
  }, [isResizing]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!isResizing) return;
    setIsResizing(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    localStorage.setItem(STORAGE_KEY, String(width));
  }, [isResizing, width]);

  const onDoubleClick = useCallback(() => {
    setWidth(DEFAULT_WIDTH);
    localStorage.setItem(STORAGE_KEY, String(DEFAULT_WIDTH));
  }, []);

  return (
    <>
      {/* Backdrop */}
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
          width: `${width}px`,
          maxWidth: '100vw',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg)',
          borderLeft: '1px solid var(--border)',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.07)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: isResizing
            ? 'none'
            : 'transform 280ms ease-out, width 0ms',
        }}
      >
        {/* Resize handle — sits on the left edge */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onDoubleClick={onDoubleClick}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panel — double-click to reset"
          style={{
            position: 'absolute',
            top: 0,
            left: -3,
            width: 6,
            height: '100%',
            cursor: 'ew-resize',
            zIndex: 51,
            touchAction: 'none',
          }}
        >
          {/* Visual indicator — only shows on hover or while resizing */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 2,
              width: 2,
              height: '100%',
              backgroundColor: isResizing ? 'var(--accent)' : 'transparent',
              transition: 'background-color 120ms ease-out',
            }}
            className="hover:bg-accent/40"
          />
        </div>

        {/* Header */}
        <div
          className="flex items-start justify-between px-6 py-5 shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="min-w-0">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-1 font-mono"
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
