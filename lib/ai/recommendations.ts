import type { AuditIssue, AuditReport } from '@/lib/audit/types';
import { generateRecommendation } from '@/lib/ai/gemini';
import { buildPromptForIssue } from '@/lib/ai/prompts';

// Used when Gemini is unavailable (rate limit, network error, missing key).
// Surfaced to the user as if they were real recommendations — no error shown.
export const FALLBACK_RECOMMENDATIONS: Record<string, string> = {
  duplicates:
    'Export suspected duplicates to CSV and review manually — prioritize clusters where email domains match. On HubSpot Pro/Enterprise, go to Settings > Data Management > Duplicates. On Free/Starter, dedupe externally and re-import. Estimated fix time: 2-4 hours depending on volume. Going forward, add a domain-based dedup check to your import process.',

  owners:
    'Bulk-select orphaned contacts in the Contacts list view (filter: "Contact owner is unknown") and use the "Assign owner" action. On paid tiers, set up a Workflow via Automation > Workflows to auto-assign owners on new form submissions. Estimated fix time: 1-2 hours for the backfill. Prevents lead leakage on every new contact going forward.',

  workflows:
    'Navigate to Automation > Workflows, filter by "Active" status, and sort by enrollment count. Pause workflows with zero recent enrollments — do not delete, you may need the history. Check each: is the enrollment trigger still valid? Did the target segment disappear? Estimated fix time: 30-60 minutes. Keeps your workflow list meaningful and your tier limit headroom accurate.',

  stale_deals:
    'Filter your deal pipeline in HubSpot by last activity date (> 90 days). For each stale deal: update the stage to reflect reality, or close it as lost with a reason. On Sales Pro/Enterprise, enable inactivity alerts via Settings > Objects > Deals > Pipelines. Estimated fix time: 1-2 hours for the cleanup. Accurate pipeline coverage makes forecasting trustworthy again.',

  phone_format:
    'Export contacts to CSV, standardize to E.164 format (+CountryCode then digits, no spaces or dashes), and re-import with "Update existing contacts" selected. On Operations Hub Pro, use a Data Quality Automation to enforce format on new records. Estimated fix time: 2-3 hours including the import. Consistent formats are required for calling integrations and SMS workflows to function.',
};

export async function addRecommendations(report: AuditReport): Promise<AuditReport> {
  const issues = await Promise.all(
    report.issues.map(async (issue): Promise<AuditIssue> => {
      try {
        const prompt = buildPromptForIssue(issue);
        const ai_recommendation = await generateRecommendation(prompt);
        return { ...issue, ai_recommendation };
      } catch {
        return {
          ...issue,
          ai_recommendation: FALLBACK_RECOMMENDATIONS[issue.check_id] ?? 'No recommendation available.',
        };
      }
    })
  );

  return { ...report, issues };
}
