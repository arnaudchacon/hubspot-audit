'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Download, RotateCcw, Undo2 } from 'lucide-react';
import type { DuplicatesRawData, ReviewPair } from '@/lib/audit/types';
import { Button } from '@/components/ui/Button';
import { downloadCsv, type CsvValue } from '@/lib/utils/csv';
import { PairCard } from './PairCard';

export type Decision = 'confirmed' | 'rejected' | 'skipped';

interface ReviewWorkbenchProps {
  pairs: ReviewPair[];
  clusters: DuplicatesRawData['full_clusters'];
  datasetKey: string;
  reportHref: string;
}

interface PoolMember {
  id: string;
  name: string;
  email: string;
  created_at?: string;
}

interface Pool {
  members: PoolMember[];
  origin: 'auto' | 'reviewed' | 'mixed';
}

// Union-find over auto clusters + human-confirmed pairs. Confirming a pair
// whose member already sits in an auto cluster grows that pool ("mixed").
function buildPools(
  clusters: DuplicatesRawData['full_clusters'],
  pairs: ReviewPair[],
  decisions: Record<string, Decision>
): Pool[] {
  const parent: Record<string, string> = {};
  const find = (x: string): string => {
    if (parent[x] === undefined) parent[x] = x;
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  };
  const union = (a: string, b: string) => { parent[find(a)] = find(b); };

  const members: Record<string, PoolMember> = {};
  const fromAuto = new Set<string>();

  for (const cluster of clusters) {
    for (const c of cluster.contacts) {
      members[c.id] = { id: c.id, name: c.name, email: c.email };
      fromAuto.add(c.id);
    }
    for (let i = 1; i < cluster.contact_ids.length; i++) {
      union(cluster.contact_ids[0], cluster.contact_ids[i]);
    }
  }

  for (const pair of pairs) {
    if (decisions[pair.pair_id] !== 'confirmed') continue;
    for (const c of [pair.a, pair.b]) {
      members[c.id] = { id: c.id, name: c.name, email: c.email, created_at: c.created_at };
    }
    union(pair.a.id, pair.b.id);
  }

  const grouped: Record<string, PoolMember[]> = {};
  for (const id of Object.keys(members)) {
    const root = find(id);
    if (!grouped[root]) grouped[root] = [];
    grouped[root].push(members[id]);
  }

  return Object.values(grouped)
    .filter(g => g.length > 1)
    .map(g => {
      const autoCount = g.filter(m => fromAuto.has(m.id)).length;
      const origin: Pool['origin'] =
        autoCount === g.length ? 'auto' : autoCount === 0 ? 'reviewed' : 'mixed';
      // Keep the oldest record when we know creation dates; otherwise first.
      const sorted = [...g].sort((a, b) => {
        if (!a.created_at) return -1;
        if (!b.created_at) return 1;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
      return { members: sorted, origin };
    })
    .sort((a, b) => b.members.length - a.members.length);
}

export function ReviewWorkbench({ pairs, clusters, datasetKey, reportHref }: ReviewWorkbenchProps) {
  const storageKey = `review-decisions-${datasetKey}`;

  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setDecisions(JSON.parse(raw));
    } catch { /* corrupted state — start fresh */ }
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(decisions));
    } catch { /* quota — decisions stay in memory for this session */ }
  }, [decisions, hydrated, storageKey]);

  const queue = useMemo(() => pairs.filter(p => !decisions[p.pair_id]), [pairs, decisions]);
  const current = queue[0] ?? null;
  const decidedCount = pairs.length - queue.length;

  const counts = useMemo(() => {
    const c = { confirmed: 0, rejected: 0, skipped: 0 };
    for (const p of pairs) {
      const d = decisions[p.pair_id];
      if (d) c[d]++;
    }
    return c;
  }, [pairs, decisions]);

  const pools = useMemo(() => buildPools(clusters, pairs, decisions), [clusters, pairs, decisions]);

  const decide = useCallback((pairId: string, decision: Decision) => {
    setDecisions(prev => ({ ...prev, [pairId]: decision }));
    setUndoStack(prev => [...prev, pairId]);
  }, []);

  const undo = useCallback(() => {
    setUndoStack(prev => {
      const last = prev[prev.length - 1];
      if (!last) return prev;
      setDecisions(d => {
        const next = { ...d };
        delete next[last];
        return next;
      });
      return prev.slice(0, -1);
    });
  }, []);

  const reset = useCallback(() => {
    setDecisions({});
    setUndoStack([]);
  }, []);

  const exportMergePlan = useCallback(() => {
    const headers = ['pool_id', 'origin', 'action', 'contact_id', 'name', 'email', 'merge_into'];
    const rows: CsvValue[][] = [];
    pools.forEach((pool, idx) => {
      const poolId = `pool_${String(idx + 1).padStart(2, '0')}`;
      const keep = pool.members[0];
      pool.members.forEach((m, mi) => {
        rows.push([
          poolId,
          pool.origin,
          mi === 0 ? 'keep' : 'merge',
          m.id,
          m.name,
          m.email,
          mi === 0 ? '' : keep.id,
        ]);
      });
    });
    downloadCsv('duplicate-merge-plan.csv', headers, rows);
  }, [pools]);

  if (pairs.length === 0) {
    return (
      <main className="min-h-screen bg-bg flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h1 className="font-serif text-[28px] text-text-primary mb-3">Nothing to review</h1>
          <p className="text-body text-text-secondary mb-6">
            Every duplicate candidate in this dataset scored above the auto-merge threshold or
            below the review floor — there is no greyzone to triage.
          </p>
          <Link href={reportHref}>
            <Button variant="secondary">← Back to report</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg">
      <div className="max-w-content mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <Link
            href={reportHref}
            className="inline-flex items-center gap-1.5 text-body-sm text-text-tertiary hover:text-text-primary transition-colors duration-150 mb-4"
          >
            <ArrowLeft size={14} /> Back to report
          </Link>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-[32px] text-text-primary leading-tight mb-1">
                Duplicate review
              </h1>
              <p className="text-body-sm text-text-secondary">
                {pairs.length} borderline pair{pairs.length !== 1 ? 's' : ''} below the auto-merge
                threshold. Confirm, reject, or skip — decisions stay in this browser.
              </p>
            </div>
            <p className="text-body-sm font-mono text-text-tertiary tabular-nums">
              {decidedCount} / {pairs.length} reviewed
            </p>
          </div>
          {/* Progress bar */}
          <div className="mt-4 h-1 rounded-full bg-surface overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-300 ease-out"
              style={{ width: `${(decidedCount / pairs.length) * 100}%`, background: 'var(--accent)' }}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_300px] gap-8 items-start">

          {/* Card area */}
          <div>
            {!hydrated ? null : current ? (
              <PairCard
                key={current.pair_id}
                pair={current}
                position={decidedCount + 1}
                total={pairs.length}
                onDecide={decision => decide(current.pair_id, decision)}
                onUndo={undoStack.length > 0 ? undo : undefined}
              />
            ) : (
              <div className="border border-border rounded-xl p-10 text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-severity-low-bg mb-4">
                  <Check size={20} className="text-severity-low" />
                </div>
                <h2 className="font-serif text-[24px] text-text-primary mb-2">Review complete</h2>
                <p className="text-body text-text-secondary mb-6">
                  {counts.confirmed} confirmed · {counts.rejected} rejected
                  {counts.skipped > 0 ? ` · ${counts.skipped} skipped` : ''}
                </p>
                <div className="flex items-center justify-center gap-3">
                  {pools.length > 0 && (
                    <Button variant="primary" onClick={exportMergePlan}>
                      <Download size={14} className="mr-1.5" /> Export merge plan
                    </Button>
                  )}
                  <Button variant="secondary" onClick={reset}>
                    <RotateCcw size={14} className="mr-1.5" /> Start over
                  </Button>
                </div>
              </div>
            )}

            {current && (
              <div className="mt-4 flex items-center justify-between text-body-sm text-text-tertiary">
                <p>
                  Keyboard: <kbd className="font-mono">←</kbd> reject · <kbd className="font-mono">→</kbd> confirm ·{' '}
                  <kbd className="font-mono">S</kbd> skip · <kbd className="font-mono">Z</kbd> undo
                </p>
                {undoStack.length > 0 && (
                  <button
                    onClick={undo}
                    className="inline-flex items-center gap-1 hover:text-text-primary transition-colors duration-150"
                  >
                    <Undo2 size={13} /> Undo
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Side panel — running outcome */}
          <aside className="border border-border rounded-xl p-5 lg:sticky lg:top-20">
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-tertiary mb-4">
              Session
            </p>
            <div className="grid grid-cols-3 gap-2 mb-6">
              {[
                { label: 'Confirmed', value: counts.confirmed, color: 'var(--severity-low)' },
                { label: 'Rejected', value: counts.rejected, color: 'var(--severity-high)' },
                { label: 'Skipped', value: counts.skipped, color: 'var(--text-tertiary)' },
              ].map(s => (
                <div key={s.label} className="text-center border border-border rounded-lg py-2.5">
                  <p className="font-mono text-[20px] font-medium tabular-nums" style={{ color: s.color }}>
                    {s.value}
                  </p>
                  <p className="text-[11px] text-text-tertiary">{s.label}</p>
                </div>
              ))}
            </div>

            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-tertiary mb-3">
              Merge pools ({pools.length})
            </p>
            <div className="flex flex-col gap-2.5 mb-5 max-h-[320px] overflow-y-auto">
              {pools.map((pool, i) => (
                <div key={i} className="border border-border rounded-lg px-3 py-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-medium text-text-primary">
                      Pool {i + 1} · {pool.members.length} records
                    </span>
                    <span
                      className="text-[10px] font-mono uppercase tracking-[0.05em]"
                      style={{ color: pool.origin === 'auto' ? 'var(--text-tertiary)' : 'var(--accent)' }}
                    >
                      {pool.origin}
                    </span>
                  </div>
                  <p className="text-[12px] text-text-secondary truncate">
                    {pool.members.map(m => m.name).join(' · ')}
                  </p>
                </div>
              ))}
              {pools.length === 0 && (
                <p className="text-body-sm text-text-tertiary">
                  No pools yet — confirmed pairs and auto-detected clusters appear here.
                </p>
              )}
            </div>

            <Button
              variant="secondary"
              className="w-full"
              disabled={pools.length === 0}
              onClick={exportMergePlan}
            >
              <Download size={14} className="mr-1.5" /> Export merge plan
            </Button>
          </aside>
        </div>
      </div>
    </main>
  );
}
