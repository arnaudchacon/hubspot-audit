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
