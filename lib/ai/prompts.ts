import type { AuditIssue } from '@/lib/audit/types';

// ─── Shared system prompt ─────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a senior RevOps consultant who has cleaned up dozens of HubSpot instances. You write fix recommendations for finance and sales operations people who manage HubSpot at small to mid-market B2B companies.

Style rules (non-negotiable):
- 60-90 words. Never longer.
- Plain English. No jargon, no buzzwords.
- Concrete first step. Where applicable, include the actual HubSpot path (e.g. "Settings > Properties > Manage").
- Mention HubSpot tier limitations honestly. Many users are on Starter or Free which lacks Professional/Enterprise features.
- Estimate fix time in hours.
- One-line ongoing impact at the end.
- Never use: "leverage", "synergize", "unlock", "transform", "empower", "best-in-class", "robust", "seamless", "holistic".
- Write like you're talking to a peer over Slack, not writing a sales blog.`;

// ─── Per-check formatters ──────────────────────────────────────────────────────

function formatDuplicatesPrompt(issue: AuditIssue): string {
  const d = issue.raw_data as {
    cluster_count: number;
    affected_contacts: number;
    total_contacts: number;
    sample_clusters: Array<{ contacts: Array<{ first_name: string; last_name: string; email: string; company_domain: string }> }>;
  };

  const sampleText = d.sample_clusters
    .map((cluster, i) => {
      const lines = cluster.contacts.map(
        c => `  - ${c.first_name} ${c.last_name} (${c.email}) — ${c.company_domain}`
      );
      return `Cluster ${i + 1}:\n${lines.join('\n')}`;
    })
    .join('\n\n');

  return `${SYSTEM_PROMPT}

A CRM audit detected this issue:

ISSUE: Likely duplicate contacts
SEVERITY: ${issue.severity}

Data:
- Total contacts in instance: ${d.total_contacts}
- Duplicate clusters detected: ${d.cluster_count}
- Affected contacts: ${d.affected_contacts}
- Detection method: weighted Levenshtein scoring on name + email + domain + phone, threshold 0.80

Sample duplicate cluster (first one detected):
${sampleText}

Important context for your recommendation:
- HubSpot's native "Manage Duplicates" tool is ONLY available on Professional and Enterprise tiers. Free and Starter users do NOT have this feature.
- Even on Pro/Enterprise, HubSpot's tool only matches on email and full name. It does not handle fuzzy matching (Sara vs Sarah) or domain weighting.
- Most clients we've seen need a custom dedup pass beyond what HubSpot offers.

Write the recommendation now. 60-90 words. Concrete first step. Mention tier considerations if relevant. Estimate fix time. One-line ongoing impact.`;
}

function formatOwnersPrompt(issue: AuditIssue): string {
  const d = issue.raw_data as {
    missing_count: number;
    total_count: number;
    percentage: number;
    sample_orphans: Array<{ name: string; email: string; created_at: string }>;
  };

  const sampleText = d.sample_orphans
    .map(o => `  - ${o.name} (${o.email}, created ${o.created_at})`)
    .join('\n');

  return `${SYSTEM_PROMPT}

A CRM audit detected this issue:

ISSUE: Contacts missing owner assignment
SEVERITY: ${issue.severity}

Data:
- Contacts missing owner: ${d.missing_count} of ${d.total_count} (${d.percentage.toFixed(0)}%)
- Sample of orphaned contacts (5 most recent):
${sampleText}

Important context for your recommendation:
- HubSpot allows automatic owner assignment via Workflows on all paid tiers (including Starter), but Free tier requires manual assignment.
- Common causes of missing ownership: form submissions without default owner, CSV imports without owner column, leads created via API without assignment, contacts merged from deleted owner accounts.
- Round-robin assignment is available via Workflows (paid) but not via HubSpot's free CRM.

Write the recommendation now. 60-90 words. Concrete first step (with HubSpot menu path). Mention tier considerations. Estimate fix time. One-line ongoing impact.`;
}

function formatWorkflowsPrompt(issue: AuditIssue): string {
  const d = issue.raw_data as {
    zombie_count: number;
    total_active: number;
    zombie_workflows: Array<{ name: string; last_enrollment: string }>;
  };

  const workflowList = d.zombie_workflows
    .map(w => `  - "${w.name}" (last enrollment: ${w.last_enrollment})`)
    .join('\n');

  return `${SYSTEM_PROMPT}

A CRM audit detected this issue:

ISSUE: Inactive workflows still marked active
SEVERITY: ${issue.severity}

Data:
- Zombie workflows: ${d.zombie_count} of ${d.total_active} active workflows
- Workflows with zero enrollments in 30 days:
${workflowList}

Important context for your recommendation:
- Workflows count toward HubSpot's per-tier workflow limits (Marketing Pro = 300, Sales Pro = unlimited but counted in the platform).
- Zombie workflows usually indicate: campaigns that ended without cleanup, A/B tests forgotten in production, criteria that no longer match any contacts, or workflows enrolling on properties that have been renamed/deleted.
- The fix is rarely deletion (you might lose history). Pausing is safer.

Write the recommendation now. 60-90 words. Concrete first step. Estimate fix time. One-line ongoing impact.`;
}

function formatStaleDealsPrompt(issue: AuditIssue): string {
  const d = issue.raw_data as {
    stale_count: number;
    arr_at_risk_usd: number;
    days_oldest: number;
    sample_deals: Array<{ name: string; stage: string; amount: number; days_inactive: number }>;
  };

  const dealList = d.sample_deals
    .map(deal => `  - "${deal.name}" — ${deal.stage}, $${deal.amount.toLocaleString()}, ${deal.days_inactive} days inactive`)
    .join('\n');

  return `${SYSTEM_PROMPT}

A CRM audit detected this issue:

ISSUE: Stale deals in active pipeline
SEVERITY: ${issue.severity}

Data:
- Stale deals (no activity in 90+ days): ${d.stale_count}
- Total ARR at risk: $${d.arr_at_risk_usd.toLocaleString()}
- Oldest stale deal: ${d.days_oldest} days inactive
- Sample of stalest deals:
${dealList}

Important context for your recommendation:
- Stale deals inflate pipeline coverage ratios and skew forecasts. Sales managers stop trusting reports.
- HubSpot has built-in "Pipeline" stale-deal warnings on Sales Pro and Enterprise. Starter doesn't have this.
- The fix is operational discipline (stage exit criteria + automation) not just one-time cleanup.

Write the recommendation now. 60-90 words. Concrete first step. Estimate fix time. One-line ongoing impact.`;
}

function formatPhoneFormatPrompt(issue: AuditIssue): string {
  const d = issue.raw_data as {
    format_distribution: Record<string, number>;
    significant_bucket_count: number;
    examples: {
      plus_format?: string;
      double_zero?: string;
      parentheses?: string;
      no_prefix?: string;
    };
  };

  const distribution = Object.entries(d.format_distribution)
    .map(([bucket, count]) => `  ${bucket}: ${count} contacts`)
    .join('\n');

  return `${SYSTEM_PROMPT}

A CRM audit detected this issue:

ISSUE: Inconsistent phone number formats
SEVERITY: ${issue.severity}

Data:
- Different format buckets in use: ${d.significant_bucket_count}
- Distribution:
${distribution}
- Examples:
  - Plus format: ${d.examples.plus_format ?? 'n/a'}
  - Double-zero international: ${d.examples.double_zero ?? 'n/a'}
  - Parentheses: ${d.examples.parentheses ?? 'n/a'}
  - No prefix: ${d.examples.no_prefix ?? 'n/a'}

Important context for your recommendation:
- HubSpot doesn't natively normalize phone formats on import.
- Inconsistent formats break: SMS workflows, third-party calling integrations (Aircall, JustCall, Dialpad), country-based segmentation, deduplication.
- Standard recommendation is E.164 format (+CountryCode followed by digits).
- Fix can be done via HubSpot Operations Hub (paid) or via a one-time CSV cleanup + import.

Write the recommendation now. 60-90 words. Concrete first step. Estimate fix time. One-line ongoing impact.`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

const promptBuilders: Record<string, (issue: AuditIssue) => string> = {
  duplicates:   formatDuplicatesPrompt,
  owners:       formatOwnersPrompt,
  workflows:    formatWorkflowsPrompt,
  stale_deals:  formatStaleDealsPrompt,
  phone_format: formatPhoneFormatPrompt,
};

export function buildPromptForIssue(issue: AuditIssue): string {
  const builder = promptBuilders[issue.check_id];
  if (!builder) throw new Error(`No prompt builder for check_id: ${issue.check_id}`);
  return builder(issue);
}
