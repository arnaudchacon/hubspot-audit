import { ReactNode } from 'react';

export interface Column {
  key: string;
  label: string;
  mono?: boolean;
  /** CSS width — e.g. "12%", "120px". When set, table uses fixed layout so
   *  multiple tables with the same Column[] line up identically. */
  width?: string;
}

interface DataTableProps {
  columns: Column[];
  rows: Record<string, ReactNode>[];
}

export function DataTable({ columns, rows }: DataTableProps) {
  const hasFixedWidths = columns.some(c => c.width);

  return (
    <div className="w-full overflow-x-auto">
      <table
        className="data-table w-full border-collapse text-sm"
        style={hasFixedWidths ? { tableLayout: 'fixed' } : undefined}
      >
        {hasFixedWidths && (
          <colgroup>
            {columns.map(col => (
              <col key={col.key} style={{ width: col.width }} />
            ))}
          </colgroup>
        )}
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-strong)' }}>
            {columns.map(col => (
              <th
                key={col.key}
                className="text-left px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.05em]"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
              {columns.map(col => (
                <td
                  key={col.key}
                  className={`px-3 py-2 ${col.mono ? 'font-mono' : ''}`}
                  style={{
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={typeof row[col.key] === 'string' ? (row[col.key] as string) : undefined}
                  data-label={col.label}
                >
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
