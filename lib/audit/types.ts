export type Severity = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company_domain: string;
  owner_id: string | null;
  created_at: string;
}

export interface Deal {
  id: string;
  name: string;
  stage: string;
  amount_usd: number;
  owner_id: string | null;
  contact_id: string;
  created_at: string;
  last_activity_date: string;
}

export interface Workflow {
  id: string;
  name: string;
  is_active: boolean;
  enrollment_count_30d: number;
  last_enrollment_date: string;
}

export interface Dataset {
  contacts: Contact[];
  deals: Deal[];
  workflows: Workflow[];
}

// --- Per-check raw_data interfaces (v1) ---
// AuditIssue.raw_data stays Record<string,unknown> for backward compat.
// Use these interfaces in check files and cast in prompts.ts.

export interface DuplicatesRawData {
  // v0 fields
  cluster_count: number;
  affected_contacts: number;
  total_contacts: number;
  // v1 additions
  full_clusters: Array<{
    cluster_id: string;
    contact_ids: string[];
    contacts: Array<{
      id: string;
      name: string;
      email: string;
      domain: string;
      phone_normalized: string;
    }>;
    similarity_signals: {
      name_varies: boolean;
      email_local_varies: boolean;
      domain_matches: boolean;
      phone_matches: boolean;
    };
  }>;
}

export interface OwnersRawData {
  // v0 fields
  missing_count: number;
  total_count: number;
  percentage: number;
  // v1 additions
  orphans_recent_5: Array<{
    name: string;
    email: string;
    created_at: string;
    days_old: number;
  }>;
  date_distribution: {
    last_30_days: number;
    last_90_days: number;
    older: number;
  };
}

export interface WorkflowsRawData {
  // v0 fields
  zombie_count: number;
  total_active: number;
  // v1 additions
  zombie_full_list: Array<{
    name: string;
    last_enrollment_date: string;
    days_since_enrollment: number;
    name_pattern_hint: 'expired_campaign' | 'deprecated' | 'one_time_event' | 'experiment' | 'unknown';
  }>;
}

export interface StaleDealsRawData {
  // v0 fields
  stale_count: number;
  arr_at_risk_usd: number;
  days_oldest: number;
  // v1 additions
  stale_full_list: Array<{
    name: string;
    stage: string;
    amount_usd: number;
    days_inactive: number;
    deal_type_hint: 'pilot' | 'enterprise' | 'annual_renewal' | 'expansion' | 'standard';
  }>;
}

export interface PhoneFormatRawData {
  // v0 fields
  format_distribution: Record<string, number>;
  examples: Record<string, string>;
  // v1 additions
  format_examples_with_counts: Array<{
    format: string;
    count: number;
    examples: string[];
    description: string;
  }>;
}

// ---

export interface AuditIssue {
  check_id: string;
  title: string;
  severity: Severity;
  detail: string;
  raw_data: Record<string, unknown>;
  ai_recommendation?: string;
}

export interface AuditReport {
  generated_at: string;
  dataset_summary: {
    contacts: number;
    deals: number;
    workflows: number;
  };
  overall_score: number;
  score_interpretation: string;
  issues: AuditIssue[];
}
