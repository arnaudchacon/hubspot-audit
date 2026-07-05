'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, SkipForward, X } from 'lucide-react';
import type { ReviewPair, ReviewContact } from '@/lib/audit/types';
import { formatDate } from '@/lib/utils/format';
import type { Decision } from './ReviewWorkbench';

interface PairCardProps {
  pair: ReviewPair;
  position: number;
  total: number;
  onDecide: (decision: Decision) => void;
  onUndo?: () => void;
}

const SWIPE_THRESHOLD = 120;

const SIGNALS: Array<{ key: keyof ReviewPair['subscores']; label: string; weight: string }> = [
  { key: 'name',   label: 'Name',   weight: '40%' },
  { key: 'email',  label: 'Email',  weight: '30%' },
  { key: 'domain', label: 'Domain', weight: '20%' },
  { key: 'phone',  label: 'Phone',  weight: '10%' },
];

function digitsTail(phone: string): string {
  return phone.replace(/\D/g, '').slice(-8);
}

type FieldRow = {
  label: string;
  value: (c: ReviewContact) => string;
  matches: (a: ReviewContact, b: ReviewContact) => boolean;
};

const FIELDS: FieldRow[] = [
  { label: 'Name',    value: c => c.name,  matches: (a, b) => a.name.toLowerCase() === b.name.toLowerCase() },
  { label: 'Email',   value: c => c.email, matches: (a, b) => a.email.toLowerCase() === b.email.toLowerCase() },
  { label: 'Phone',   value: c => c.phone || '—', matches: (a, b) => digitsTail(a.phone) !== '' && digitsTail(a.phone) === digitsTail(b.phone) },
  { label: 'Company', value: c => c.domain || '—', matches: (a, b) => a.domain !== '' && a.domain === b.domain },
  { label: 'Owner',   value: c => c.owner_id ?? 'Unassigned', matches: (a, b) => !!a.owner_id && a.owner_id === b.owner_id },
  { label: 'Created', value: c => formatDate(c.created_at), matches: () => false },
];

export function PairCard({ pair, position, total, onDecide, onUndo }: PairCardProps) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [leaving, setLeaving] = useState<Decision | null>(null);
  const startXRef = useRef(0);
  const decidedRef = useRef(false);

  const fly = useCallback((decision: Decision) => {
    if (decidedRef.current) return;
    decidedRef.current = true;
    setLeaving(decision);
    setDragging(false);
    setDx(decision === 'confirmed' ? 640 : decision === 'rejected' ? -640 : 0);
    window.setTimeout(() => onDecide(decision), decision === 'skipped' ? 0 : 220);
  }, [onDecide]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); fly('confirmed'); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); fly('rejected'); }
      else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') { e.preventDefault(); fly('skipped'); }
      else if ((e.key === 'z' || e.key === 'Z') && onUndo) { e.preventDefault(); onUndo(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fly, onUndo]);

  // Pointer drag (swipe)
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (leaving) return;
    // Don't hijack text selection attempts on buttons
    if ((e.target as HTMLElement).closest('button')) return;
    setDragging(true);
    startXRef.current = e.clientX;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [leaving]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging || leaving) return;
    setDx(e.clientX - startXRef.current);
  }, [dragging, leaving]);

  const onPointerUp = useCallback(() => {
    if (!dragging || leaving) return;
    setDragging(false);
    if (dx > SWIPE_THRESHOLD) fly('confirmed');
    else if (dx < -SWIPE_THRESHOLD) fly('rejected');
    else setDx(0);
  }, [dragging, leaving, dx, fly]);

  const confirmOpacity = Math.min(1, Math.max(0, dx - 30) / SWIPE_THRESHOLD);
  const rejectOpacity = Math.min(1, Math.max(0, -dx - 30) / SWIPE_THRESHOLD);

  return (
    <div className="relative" style={{ touchAction: 'pan-y' }}>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative bg-bg border border-border rounded-xl p-6 select-none cursor-grab active:cursor-grabbing shadow-hover"
        style={{
          transform: `translateX(${dx}px) rotate(${dx * 0.02}deg)`,
          opacity: leaving && leaving !== 'skipped' ? 0 : 1,
          transition: dragging ? 'none' : 'transform 220ms ease-out, opacity 220ms ease-out',
        }}
      >
        {/* Swipe overlays */}
        <div
          className="absolute top-5 left-5 px-2.5 py-1 rounded border-2 text-[13px] font-semibold uppercase tracking-[0.05em] pointer-events-none"
          style={{ color: 'var(--severity-low)', borderColor: 'var(--severity-low)', opacity: confirmOpacity, transform: 'rotate(-6deg)' }}
        >
          Duplicate
        </div>
        <div
          className="absolute top-5 right-5 px-2.5 py-1 rounded border-2 text-[13px] font-semibold uppercase tracking-[0.05em] pointer-events-none"
          style={{ color: 'var(--severity-high)', borderColor: 'var(--severity-high)', opacity: rejectOpacity, transform: 'rotate(6deg)' }}
        >
          Not a duplicate
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <span className="text-[11px] font-mono uppercase tracking-[0.06em] text-text-tertiary">
            Pair {position} of {total}
          </span>
          <span
            className="text-[12px] font-mono px-2 py-0.5 rounded"
            style={{
              color: pair.score >= 0.72 ? 'var(--severity-medium)' : 'var(--text-secondary)',
              background: 'var(--surface)',
            }}
          >
            match {pair.score.toFixed(2)}
          </span>
        </div>

        {/* Field comparison */}
        <div className="border border-border rounded-lg overflow-hidden mb-5">
          <div className="grid grid-cols-[88px_1fr_1fr] text-[12px] font-semibold uppercase tracking-[0.05em] text-text-tertiary bg-surface border-b border-border">
            <div className="px-3 py-2" />
            <div className="px-3 py-2">Record A</div>
            <div className="px-3 py-2">Record B</div>
          </div>
          {FIELDS.map(field => {
            const isMatch = field.matches(pair.a, pair.b);
            return (
              <div
                key={field.label}
                className="grid grid-cols-[88px_1fr_1fr] border-b border-border last:border-b-0 text-[13px]"
                style={isMatch ? { background: 'var(--severity-low-bg)' } : undefined}
              >
                <div className="px-3 py-2 text-text-tertiary">{field.label}</div>
                <div className="px-3 py-2 text-text-primary font-medium truncate min-w-0" title={field.value(pair.a)}>
                  {field.value(pair.a)}
                </div>
                <div className="px-3 py-2 text-text-primary font-medium truncate min-w-0" title={field.value(pair.b)}>
                  {field.value(pair.b)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Signal bars */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {SIGNALS.map(signal => {
            const value = pair.subscores[signal.key];
            return (
              <div key={signal.key}>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-[11px] text-text-tertiary">{signal.label} <span className="text-text-disabled">· {signal.weight}</span></span>
                  <span className="text-[11px] font-mono text-text-secondary">{Math.round(value * 100)}%</span>
                </div>
                <div className="h-1 rounded-full bg-surface overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${value * 100}%`, background: value >= 0.8 ? 'var(--severity-medium)' : 'var(--border-strong)' }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => fly('rejected')}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[6px] border text-body font-medium transition-colors duration-150"
            style={{ borderColor: 'var(--severity-high)', color: 'var(--severity-high)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--severity-high-bg)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={15} /> Not a duplicate
          </button>
          <button
            onClick={() => fly('skipped')}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[6px] text-body font-medium text-text-tertiary hover:text-text-primary hover:bg-surface transition-colors duration-150"
          >
            <SkipForward size={14} /> Skip
          </button>
          <button
            onClick={() => fly('confirmed')}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[6px] border text-body font-medium transition-colors duration-150"
            style={{ borderColor: 'var(--severity-low)', color: 'var(--severity-low)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--severity-low-bg)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <Check size={15} /> Duplicate
          </button>
        </div>
      </div>
    </div>
  );
}
