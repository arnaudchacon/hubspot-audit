import type { AuditIssue, DuplicatesRawData, OwnersRawData, WorkflowsRawData, StaleDealsRawData, PhoneFormatRawData } from '@/lib/audit/types';

// ─── Shared system prompt ─────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a senior RevOps consultant who has personally cleaned up dozens of HubSpot instances at B2B companies between 50 and 500 employees. You write fix recommendations for finance and ops people who actually have to do the work — not for executives, not for marketing.

You write like you're typing a Slack message to a peer who needs help right now. Direct. Specific. Honest about tradeoffs. No hedging.

Output format (strict):

ROOT CAUSE: [one sentence on why this issue exists, naming the specific mechanism that produced it. Reference at least one specific record from the data.]

FIRST STEP: [the single most useful action they should take this week. If applicable, name the specific HubSpot menu path or feature. Mention tier limitations if Free/Starter users can't access the recommended fix.]

WATCH FOR: [one sentence on what NOT to do, or what they'll find harder than expected once they start. This is where senior consultants earn their fee.]

Total length: 80-120 words across all three sections combined. Do not add section headers; just write three short paragraphs.

Banned words: leverage, synergize, unlock, transform, empower, robust, seamless, holistic, best-in-class, ensure, ensure that, going forward, moving forward, take the time to, kindly, please note.

Banned phrases: "this fix will take X hours", "regular review", "ongoing hygiene", "data integrity", "data decay", "consistent reporting", "better system performance", "improve forecast accuracy".

If you catch yourself writing any of these, rewrite the sentence. The banned phrases mark the difference between consultant-grade advice and LinkedIn-thought-leader filler.

Quote at least one specific record name, workflow name, or deal name from the data when relevant. Generic advice signals you didn't read the actual audit.`;

// ─── Data formatters ──────────────────────────────────────────────────────────

function formatClustersForPrompt(clusters: DuplicatesRawData['full_clusters']): string {
  return clusters.map(cluster => {
    const contactLines = cluster.contacts.map(
      c => `    ${c.name} | ${c.email} | ${c.domain}${c.phone_normalized ? ` | phone ends ${c.phone_normalized}` : ''}`
    );
    const signals = cluster.similarity_signals;
    const signalNotes = [
      signals.name_varies ? 'name spelling varies' : 'same name',
      signals.email_local_varies ? 'email prefix varies' : 'same email prefix',
      signals.domain_matches ? 'same domain' : 'different domains',
      signals.phone_matches ? 'same phone' : '',
    ].filter(Boolean).join(', ');
    return `  ${cluster.cluster_id} (${cluster.contacts.length} records — ${signalNotes}):\n${contactLines.join('\n')}`;
  }).join('\n\n');
}

function formatOrphansForPrompt(orphans: OwnersRawData['orphans_recent_5']): string {
  return orphans.map(
    o => `  - ${o.name} (${o.email}) — created ${o.created_at}, ${o.days_old} days ago`
  ).join('\n');
}

function formatZombiesForPrompt(zombies: WorkflowsRawData['zombie_full_list']): string {
  return zombies.map(
    w => `  - "${w.name}" | last enrollment: ${w.last_enrollment_date} (${w.days_since_enrollment} days ago) | pattern: ${w.name_pattern_hint}`
  ).join('\n');
}

function formatDealsForPrompt(deals: StaleDealsRawData['stale_full_list']): string {
  return deals.map(
    d => `  - "${d.name}" | ${d.stage} | $${d.amount_usd.toLocaleString()} | ${d.days_inactive} days inactive | type: ${d.deal_type_hint}`
  ).join('\n');
}

function formatPhoneFormatsForPrompt(formats: PhoneFormatRawData['format_examples_with_counts']): string {
  return formats.map(
    f => `  - ${f.format} (${f.count} contacts) — ${f.description} — examples: ${f.examples.join(', ')}`
  ).join('\n');
}

// ─── Per-check prompt builders ────────────────────────────────────────────────

function formatDuplicatesPrompt(issue: AuditIssue): string {
  const d = issue.raw_data as unknown as DuplicatesRawData;
  const clustersText = formatClustersForPrompt(d.full_clusters);

  return `${SYSTEM_PROMPT}

Issue detected: Likely duplicate contacts.
Severity: ${issue.severity}

Audit data:
- Total contacts: ${d.total_contacts}
- Duplicate clusters detected: ${d.cluster_count}
- Affected contacts: ${d.affected_contacts}
- Detection method: weighted Levenshtein on name + email + domain + phone, threshold 0.80

The actual duplicate clusters detected (sample of largest):
${clustersText}

Each cluster shows the suspected duplicate records with their full names, emails, domain, and a note on what's varying between them (name spelling vs email prefix vs phone format).

Important context:
- HubSpot's native "Manage Duplicates" tool is Pro/Enterprise only. Free and Starter users have NO native dedup feature.
- Even on Pro/Enterprise, HubSpot only matches on email + full name — no fuzzy matching, no domain weighting, no phone matching.
- Manual merging without fixing root cause means duplicates re-appear within weeks via the same intake path.

Write your three-section recommendation now. Quote at least one specific cluster (use the actual names from the data). The ROOT CAUSE section should specifically address WHY these particular duplicates exist (e.g., form intake without dedup check, parallel CSV imports, etc.).`;
}

function formatOwnersPrompt(issue: AuditIssue): string {
  const d = issue.raw_data as unknown as OwnersRawData;
  const orphansText = formatOrphansForPrompt(d.orphans_recent_5);
  const dist = d.date_distribution;

  return `${SYSTEM_PROMPT}

Issue detected: Contacts missing owner assignment.
Severity: ${issue.severity}

Audit data:
- Contacts with no owner: ${d.missing_count} of ${d.total_count} (${d.percentage.toFixed(0)}%)

Age distribution of orphaned contacts:
- Created in last 30 days: ${dist.last_30_days}
- Created 31–90 days ago: ${dist.last_90_days}
- Older than 90 days: ${dist.older}

Sample of orphaned contacts (5 most recently created):
${orphansText}

Important context:
- Owner assignment can be automated via Workflows on Starter and above. Free tier requires manual assignment via the contact list bulk action.
- Round-robin distribution requires Marketing Hub Pro or Sales Hub Pro.
- Common root causes: form submissions without "default owner" rule, CSV imports without owner column mapping, leads from API without owner_id field, contacts surviving after a previous owner's account was deactivated.
- The creation dates of orphaned contacts often reveal which intake channel is broken — recent dates suggest active misconfiguration, old dates suggest cleanup never happened.

Write your three-section recommendation now. Look at the creation dates in the sample — if they cluster recently, the intake is currently broken. If they spread over months, this is accumulated drift. Address which one applies based on the data shown.`;
}

function formatWorkflowsPrompt(issue: AuditIssue): string {
  const d = issue.raw_data as unknown as WorkflowsRawData;
  const zombiesText = formatZombiesForPrompt(d.zombie_full_list);

  return `${SYSTEM_PROMPT}

Issue detected: Inactive workflows still marked active.
Severity: ${issue.severity}

Audit data:
- Active workflows total: ${d.total_active}
- Zombie workflows (zero enrollments in 30 days): ${d.zombie_count}

Specific zombie workflows detected:
${zombiesText}

Each entry shows the workflow name, the last enrollment date, and a pattern hint about why it's likely dead.

Important context:
- HubSpot workflow limits: 300 active in Marketing Hub Pro, unlimited in Sales Hub Pro. Hitting the limit blocks new workflow creation.
- Pausing is reversible; deletion loses enrollment history. Always pause first, delete only after a quarter of confirmed disuse.
- Zombie workflow patterns to recognize:
  * expired_campaign = names with year/quarter (Q4 2024, Webinar 2023) — campaign ended, never archived
  * deprecated = names with "Old", "Legacy", "v1" — succeeded by newer flows
  * one_time_event = specific event name — one-time use, never archived
  * experiment = test/trial/beta — forgotten A/B test

Write your three-section recommendation now. Read the actual workflow names in the data — they tell you the cleanup pattern. Quote at least one specific workflow name and what its name suggests about why it's dead.`;
}

function formatStaleDealsPrompt(issue: AuditIssue): string {
  const d = issue.raw_data as unknown as StaleDealsRawData;
  const dealsText = formatDealsForPrompt(d.stale_full_list);

  return `${SYSTEM_PROMPT}

Issue detected: Stale deals in active pipeline.
Severity: ${issue.severity}

Audit data:
- Stale deal count: ${d.stale_count}
- Total ARR at risk: $${d.arr_at_risk_usd.toLocaleString()}
- Oldest stale deal age: ${d.days_oldest} days

Specific stale deals detected (largest by amount):
${dealsText}

Each entry shows deal name, current stage, amount, days inactive, and a deal type hint.

Important context:
- Stale deals inflate pipeline coverage and pollute forecasts. Sales managers stop trusting the report, then stop using it for planning.
- HubSpot Sales Hub Pro has built-in stale deal warnings. Sales Hub Starter and Free do not.
- Cleanup options: move to "Closed Lost" with a reason code, move to "On Hold" custom stage (preserves deal but excludes from forecast), or actually re-engage the contact.
- The deal type hints reveal the stall pattern: pilot deals stall on champion buy-in, enterprise deals stall on executive sponsor, annual_renewal deals stall on pricing negotiation.

Write your three-section recommendation now. Quote at least one specific deal from the data and use its name to inform what kind of stall it is. The WATCH FOR section should warn about losing pipeline visibility if they nuke the stale deals without proper reason coding.`;
}

function formatPhoneFormatPrompt(issue: AuditIssue): string {
  const d = issue.raw_data as unknown as PhoneFormatRawData;
  const formatsText = formatPhoneFormatsForPrompt(d.format_examples_with_counts);

  return `${SYSTEM_PROMPT}

Issue detected: Inconsistent phone number formats.
Severity: ${issue.severity}

Audit data:
- Format distribution:
${formatsText}

Important context:
- HubSpot doesn't normalize phone formats on import. CSV imports preserve whatever format the source had.
- Operations Hub Starter and above can auto-format phone fields via workflows. CRM-only tiers cannot.
- E.164 format (+CountryCode followed by digits, no spaces or symbols) is the standard required by SMS workflows in HubSpot, calling integrations (Aircall, Dialpad, JustCall), WhatsApp Business API, and most third-party enrichment tools.
- The MIX of formats often reveals which intake channels are uncoordinated. Forms with international support typically use +CC. CSV imports from spreadsheets often have raw digits or parentheses. APIs vary by source.

Write your three-section recommendation now. Note which formats appear in the data and what that mix suggests about the intake channels. The FIRST STEP should be the actual fix path (Operations Hub workflow vs one-time CSV cleanup) based on whether the user likely has Operations Hub.`;
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
