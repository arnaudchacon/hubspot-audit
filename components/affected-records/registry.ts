import type { FC } from 'react';
import type { AuditIssue, DuplicatesRawData, OwnersRawData, WorkflowsRawData, StaleDealsRawData } from '@/lib/audit/types';
import { DuplicatesExpanded }  from './DuplicatesExpanded';
import { OwnersExpanded }      from './OwnersExpanded';
import { WorkflowsExpanded }   from './WorkflowsExpanded';
import { StaleDealsExpanded }  from './StaleDealsExpanded';
import { PhoneFormatExpanded } from './PhoneFormatExpanded';

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

  owners: {
    buttonText: (issue) => {
      const d = issue.raw_data as unknown as OwnersRawData;
      return `View ${d.missing_count} affected contact${d.missing_count !== 1 ? 's' : ''}`;
    },
    panelTitle: 'Contacts Missing Owner',
    ExpandedContent: OwnersExpanded,
  },

  workflows: {
    buttonText: (issue) => {
      const d = issue.raw_data as unknown as WorkflowsRawData;
      return `View ${d.zombie_count} zombie workflow${d.zombie_count !== 1 ? 's' : ''}`;
    },
    panelTitle: 'Zombie Workflows',
    ExpandedContent: WorkflowsExpanded,
  },

  stale_deals: {
    buttonText: (issue) => {
      const d = issue.raw_data as unknown as StaleDealsRawData;
      return `View ${d.stale_count} stale deal${d.stale_count !== 1 ? 's' : ''}`;
    },
    panelTitle: 'Stale Deals',
    ExpandedContent: StaleDealsExpanded,
  },

  phone_format: {
    buttonText: () => 'View phone format breakdown',
    panelTitle: 'Phone Format Breakdown',
    ExpandedContent: PhoneFormatExpanded,
  },
};
