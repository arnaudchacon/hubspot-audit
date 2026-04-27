'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { AuditIssue, DuplicatesRawData } from '@/lib/audit/types';
import { DuplicatesExpanded } from './DuplicatesExpanded';

// Renderer registry
const RENDERERS: Record<string, {
  buttonText: (issue: AuditIssue) => string;
  ExpandedContent: React.FC<{ issue: AuditIssue }>;
}> = {
  duplicates: {
    buttonText: (issue) => {
      const d = issue.raw_data as unknown as DuplicatesRawData;
      return `View ${d.cluster_count} duplicate cluster${d.cluster_count !== 1 ? 's' : ''}`;
    },
    ExpandedContent: DuplicatesExpanded,
  },
};

interface AffectedRecordsProps {
  issue: AuditIssue;
}

export function AffectedRecords({ issue }: AffectedRecordsProps) {
  const renderer = RENDERERS[issue.check_id];
  const [expanded, setExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!contentRef.current) return;
    if (expanded) {
      setHeight(contentRef.current.scrollHeight);
    } else {
      setHeight(0);
    }
  }, [expanded]);

  if (!renderer) return null;

  const { buttonText, ExpandedContent } = renderer;

  return (
    <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
      {/* Toggle button — right-aligned */}
      <div className="flex justify-end">
        <button
          onClick={() => setExpanded(prev => !prev)}
          className="flex items-center gap-1.5 text-[13px] font-medium transition-colors duration-150"
          style={{ color: expanded ? 'var(--text-primary)' : 'var(--text-secondary)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = expanded ? 'var(--text-primary)' : 'var(--text-secondary)')}
        >
          {expanded ? (
            <>Hide records <ChevronUp size={14} /></>
          ) : (
            <>{buttonText(issue)} <ChevronDown size={14} /></>
          )}
        </button>
      </div>

      {/* Expandable panel with height transition */}
      <div
        style={{
          height: `${height}px`,
          overflow: 'hidden',
          transition: 'height 200ms ease-out',
        }}
      >
        <div ref={contentRef} className="pt-4">
          <ExpandedContent issue={issue} />
        </div>
      </div>
    </div>
  );
}
