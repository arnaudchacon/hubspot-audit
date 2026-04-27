// Regenerate a single recommendation and patch the cached JSON.
// Usage: npx tsx scripts/regen-one.ts <check_id>
// Example: npx tsx scripts/regen-one.ts duplicates
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { resolve } from 'path';
import { readFileSync, writeFileSync } from 'fs';
import { runAudit } from '../lib/audit/index';
import { buildPromptForIssue } from '../lib/ai/prompts';
import { generateRecommendation } from '../lib/ai/gemini';
import demoDataset from '../data/demo-dataset.json';
import type { Dataset, AuditReport } from '../lib/audit/types';

const checkId = process.argv[2];
if (!checkId) {
  console.error('Usage: npx tsx scripts/regen-one.ts <check_id>');
  process.exit(1);
}

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set in .env.local');
    process.exit(1);
  }

  const report = runAudit(demoDataset as unknown as Dataset);
  const issue = report.issues.find(i => i.check_id === checkId);
  if (!issue) {
    console.error(`No issue found for check_id: ${checkId}`);
    process.exit(1);
  }

  console.log(`Regenerating recommendation for: ${checkId}\n`);
  const recommendation = await generateRecommendation(buildPromptForIssue(issue));
  console.log('=== NEW RECOMMENDATION ===\n');
  console.log(recommendation);
  const wordCount = recommendation.trim().split(/\s+/).length;
  console.log(`\n--- word count: ${wordCount} (target: 80–120) ---\n`);

  const cachePath = resolve(process.cwd(), 'data/cached-recommendations.json');
  const cached = JSON.parse(readFileSync(cachePath, 'utf-8')) as AuditReport;
  const entry = cached.issues.find(i => i.check_id === checkId);
  if (!entry) {
    console.error(`check_id ${checkId} not found in cached JSON`);
    process.exit(1);
  }

  entry.ai_recommendation = recommendation;
  writeFileSync(cachePath, JSON.stringify(cached, null, 2));
  console.log(`Patched data/cached-recommendations.json — ${checkId} updated.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
