import type { AuditIssue, DuplicatesRawData } from '@/lib/audit/types';
import { DataTable } from './shared/DataTable';
import { PatternBadge } from './shared/PatternBadge';

interface Props { issue: AuditIssue }

const SIGNAL_BADGES: Array<{
  key: keyof DuplicatesRawData['full_clusters'][number]['similarity_signals'];
  label: string;
  variant: 'warning' | 'info' | 'positive';
}> = [
  { key: 'name_varies',        label: 'NAME VARIES',    variant: 'warning'  },
  { key: 'email_local_varies', label: 'EMAIL VARIES',   variant: 'info'     },
  { key: 'domain_matches',     label: 'DOMAIN MATCHES', variant: 'positive' },
  { key: 'phone_matches',      label: 'PHONE MATCHES',  variant: 'positive' },
];

const COLUMNS = [
  { key: 'id',     label: 'ID',     mono: true,  width: '12%' },
  { key: 'name',   label: 'Name',   mono: false, width: '22%' },
  { key: 'email',  label: 'Email',  mono: false, width: '40%' },
  { key: 'domain', label: 'Domain', mono: false, width: '26%' },
];

export function DuplicatesExpanded({ issue }: Props) {
  const d = issue.raw_data as unknown as DuplicatesRawData;
  const clusters = d.full_clusters;
  const totalClusters = d.cluster_count;

  return (
    <div>
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.05em] mb-4"
        style={{ color: 'var(--text-tertiary)' }}
      >
        Duplicate Clusters Detected
      </p>

      <div className="flex flex-col gap-6">
        {clusters.map((cluster, idx) => {
          const rows = cluster.contacts.map(c => ({
            id:     c.id,
            name:   c.name,
            email:  c.email,
            domain: c.domain,
          }));

          const activeSignals = SIGNAL_BADGES.filter(s => cluster.similarity_signals[s.key]);

          return (
            <div key={cluster.cluster_id}>
              {/* Cluster header + badges */}
              <div className="flex items-center flex-wrap gap-2 mb-2">
                <span
                  className="text-[13px] font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Cluster {idx + 1} — {cluster.contacts.length} records
                </span>
                {activeSignals.map(s => (
                  <PatternBadge key={s.key} label={s.label} variant={s.variant} />
                ))}
              </div>

              <DataTable columns={COLUMNS} rows={rows} />
            </div>
          );
        })}
      </div>

      {totalClusters > clusters.length && (
        <p
          className="text-[12px] mt-4"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Showing {clusters.length} of {totalClusters} total clusters.
        </p>
      )}
    </div>
  );
}
