import type { FC } from 'react';
import type { AuditIssue, DuplicatesRawData } from '@/lib/audit/types';
import { DuplicatesExpanded } from './DuplicatesExpanded';

export interface RendererConfig {
  buttonText: (issue: AuditIssue) => string;
  panelTitle: string;
  ExpandedContent: FC<{ issue: AuditIssue }>;
}

export const RENDERERS: Record<string, RendererConfig> = {
  duplicates: {
    buttonText: (issue) => {
      const d = issue.raw_data as unknown as DuplicatesRawData;
      return `View ${d.cluster_count} duplicate cluster${d.cluster_count !== 1 ? 's' : ''}`;
    },
    panelTitle: 'Duplicate Contacts',
    ExpandedContent: DuplicatesExpanded,
  },
  // owners, workflows, stale_deals, phone_format added in Steps 3–6
};
