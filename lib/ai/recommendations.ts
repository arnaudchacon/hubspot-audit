import type { AuditIssue, AuditReport } from '@/lib/audit/types';
import { generateRecommendation } from '@/lib/ai/gemini';
import { buildPromptForIssue } from '@/lib/ai/prompts';

// Fallbacks when Gemini is unavailable. Written under the same three-section
// structure and voice rules as the live prompts — no banned phrases.
export const FALLBACK_RECOMMENDATIONS: Record<string, string> = {
  duplicates:
    'Most duplicate contact problems trace back to a single intake path that never had a dedup gate — usually a form that fires on every submission without checking if that email already exists. The duplicates don\'t appear all at once; they compound quietly for months.\n\nThis week: pull your contacts list, filter by email domain, and sort by create date. Clusters of the same domain created days apart are your duplicates. On Pro/Enterprise, Settings → Data Management → Duplicates surfaces the highest-confidence matches. On Free/Starter, you\'re doing this manually in a spreadsheet — export, sort on email, merge row by row.\n\nThe trap most people fall into: merging without fixing the intake. The duplicates come back within weeks. Find out which form or import triggered the pattern first.',

  owners:
    'Orphaned contacts almost always come from one of two things: a CSV import that didn\'t map the owner column, or a form that has no default owner rule. The age distribution of your unowned contacts tells you which one — if they\'re recent, the intake is still broken right now.\n\nFilter your contacts list by "Contact owner is unknown," bulk-select, and use the Assign action. On Starter and above, set a default owner in your form settings or wire a simple Workflow: Contact Created → Set Owner. Free tier users get no automation here — it has to be manual.\n\nDon\'t skip the root cause step. If you assign owners today without fixing the intake, you\'ll be doing this again in 90 days.',

  workflows:
    'Active workflows with no recent enrollments are usually campaigns or events that ended without anyone archiving them. They\'re not doing damage, but they count against your workflow limit and make it impossible to audit what\'s actually running.\n\nGo to Automation → Workflows, filter by Active, sort by enrollment count ascending. Anything at zero for 30+ days should be paused — not deleted. Deletion removes the enrollment history, which sometimes matters for attribution.\n\nThe thing that surprises people: pausing a workflow doesn\'t unenroll contacts already in it. Check the "Currently enrolled" number before you pause — if it\'s non-zero on a workflow you think is dead, something is still triggering it.',

  stale_deals:
    'Deals go stale when reps stop updating them but don\'t close them as lost — usually because closing lost feels like admitting failure, or because the deal might still technically come back someday. The result is a pipeline that looks healthy on paper and is useless for forecasting.\n\nFilter your deal view by last activity date, sort ascending. For each stale deal: move it to Closed Lost with a reason code, or create a custom "On Hold" stage that excludes it from your forecast. Don\'t just update the activity date — that masks the problem.\n\nThe reason codes matter more than the cleanup. If you see a pattern (all stale deals are in Negotiation, all are enterprise-size), that\'s a process signal, not a data signal.',

  phone_format:
    'Mixed phone formats are a symptom of uncoordinated intake channels — each source preserves whatever format it received. The problem isn\'t cosmetic; calling integrations and SMS workflows will silently skip records that don\'t match E.164 (+CountryCode then digits, no separators).\n\nExport to CSV, run a find-and-replace pass to strip non-numeric characters, add the country code prefix, re-import with "Update existing contacts" selected. On Operations Hub Starter and above, you can create a Data Quality Workflow to enforce E.164 on new records and eliminate the problem at the source.\n\nBefore you start: spot-check 10 records manually. If your data mixes US domestic and international numbers, the normalization logic is different for each — don\'t batch them together.',
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
