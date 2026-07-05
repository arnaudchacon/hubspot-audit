import type { FC } from 'react';
import type { AuditIssue, DuplicatesRawData, OwnersRawData, WorkflowsRawData, StaleDealsRawData, PhoneFormatRawData, EmailQualityRawData, DealHygieneRawData } from '@/lib/audit/types';
import type { CsvValue } from '@/lib/utils/csv';
import { DuplicatesExpanded }  from './DuplicatesExpanded';
import { OwnersExpanded }      from './OwnersExpanded';
import { WorkflowsExpanded }   from './WorkflowsExpanded';
import { StaleDealsExpanded }  from './StaleDealsExpanded';
import { PhoneFormatExpanded } from './PhoneFormatExpanded';
import { EmailQualityExpanded } from './EmailQualityExpanded';
import { DealHygieneExpanded }  from './DealHygieneExpanded';

export interface CsvExport {
  filename: string;
  headers: string[];
  rows: CsvValue[][];
}

export interface RendererConfig {
  buttonText: (issue: AuditIssue) => string;
  panelTitle: string;
  ExpandedContent: FC<{ issue: AuditIssue }>;
  csv?: (issue: AuditIssue) => CsvExport;
}

export const RENDERERS: Record<string, RendererConfig> = {
  duplicates: {
    buttonText: (issue) => {
      const d = issue.raw_data as unknown as DuplicatesRawData;
      return `View ${d.cluster_count} duplicate cluster${d.cluster_count !== 1 ? 's' : ''}`;
    },
    panelTitle: 'Duplicate Contacts',
    ExpandedContent: DuplicatesExpanded,
    csv: (issue) => {
      const d = issue.raw_data as unknown as DuplicatesRawData;
      return {
        filename: 'duplicate-clusters.csv',
        headers: ['cluster_id', 'contact_id', 'name', 'email', 'company_domain', 'phone_last8'],
        rows: d.full_clusters.flatMap(cluster =>
          cluster.contacts.map(c => [cluster.cluster_id, c.id, c.name, c.email, c.domain, c.phone_normalized])
        ),
      };
    },
  },

  owners: {
    buttonText: (issue) => {
      const d = issue.raw_data as unknown as OwnersRawData;
      return `View ${d.missing_count} affected contact${d.missing_count !== 1 ? 's' : ''}`;
    },
    panelTitle: 'Contacts Missing Owner',
    ExpandedContent: OwnersExpanded,
    csv: (issue) => {
      const d = issue.raw_data as unknown as OwnersRawData;
      return {
        filename: 'contacts-missing-owner.csv',
        headers: ['name', 'email', 'created_at', 'days_old'],
        rows: d.orphans.map(o => [o.name, o.email, o.created_at, o.days_old]),
      };
    },
  },

  workflows: {
    buttonText: (issue) => {
      const d = issue.raw_data as unknown as WorkflowsRawData;
      return `View ${d.zombie_count} zombie workflow${d.zombie_count !== 1 ? 's' : ''}`;
    },
    panelTitle: 'Zombie Workflows',
    ExpandedContent: WorkflowsExpanded,
    csv: (issue) => {
      const d = issue.raw_data as unknown as WorkflowsRawData;
      return {
        filename: 'zombie-workflows.csv',
        headers: ['name', 'last_enrollment_date', 'days_since_enrollment', 'pattern_hint'],
        rows: d.zombie_full_list.map(w => [w.name, w.last_enrollment_date, w.days_since_enrollment, w.name_pattern_hint]),
      };
    },
  },

  stale_deals: {
    buttonText: (issue) => {
      const d = issue.raw_data as unknown as StaleDealsRawData;
      return `View ${d.stale_count} stale deal${d.stale_count !== 1 ? 's' : ''}`;
    },
    panelTitle: 'Stale Deals',
    ExpandedContent: StaleDealsExpanded,
    csv: (issue) => {
      const d = issue.raw_data as unknown as StaleDealsRawData;
      return {
        filename: 'stale-deals.csv',
        headers: ['name', 'stage', 'amount_usd', 'days_inactive', 'deal_type_hint'],
        rows: d.stale_full_list.map(deal => [deal.name, deal.stage, deal.amount_usd, deal.days_inactive, deal.deal_type_hint]),
      };
    },
  },

  deal_hygiene: {
    buttonText: (issue) => {
      const d = issue.raw_data as unknown as DealHygieneRawData;
      return `View ${d.flagged_count} unforecastable deal${d.flagged_count !== 1 ? 's' : ''}`;
    },
    panelTitle: 'Unforecastable Deals',
    ExpandedContent: DealHygieneExpanded,
    csv: (issue) => {
      const d = issue.raw_data as unknown as DealHygieneRawData;
      return {
        filename: 'unforecastable-deals.csv',
        headers: ['name', 'stage', 'amount_usd', 'problems'],
        rows: d.flagged_deals.map(deal => [deal.name, deal.stage, deal.amount_usd, deal.problems.join('; ')]),
      };
    },
  },

  phone_format: {
    buttonText: () => 'View phone format breakdown',
    panelTitle: 'Phone Format Breakdown',
    ExpandedContent: PhoneFormatExpanded,
    csv: (issue) => {
      const d = issue.raw_data as unknown as PhoneFormatRawData;
      return {
        filename: 'phone-format-breakdown.csv',
        headers: ['format', 'count', 'description', 'examples'],
        rows: d.format_examples_with_counts.map(f => [f.format, f.count, f.description, f.examples.join('; ')]),
      };
    },
  },

  email_quality: {
    buttonText: (issue) => {
      const d = issue.raw_data as unknown as EmailQualityRawData;
      return `View ${d.flagged_count} flagged email${d.flagged_count !== 1 ? 's' : ''}`;
    },
    panelTitle: 'Low-Quality Emails',
    ExpandedContent: EmailQualityExpanded,
    csv: (issue) => {
      const d = issue.raw_data as unknown as EmailQualityRawData;
      return {
        filename: 'low-quality-emails.csv',
        headers: ['name', 'email', 'reason'],
        rows: d.samples.map(s => [s.name, s.email, s.reason]),
      };
    },
  },
};
