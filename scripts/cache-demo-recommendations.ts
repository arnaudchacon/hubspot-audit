// Run once via: npm run cache-demo
// Calls Gemini 5 times (once per check) and saves the full report to
// data/cached-recommendations.json. After this, the demo endpoint serves
// from that file — zero Gemini calls per demo view.
import { resolve } from 'path';
import { writeFileSync } from 'fs';
import { runAudit } from '../lib/audit/index';
import { addRecommendations } from '../lib/ai/recommendations';
import demoDataset from '../data/demo-dataset.json';
import type { Dataset } from '../lib/audit/types';

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error('Error: GEMINI_API_KEY is not set in .env.local');
    process.exit(1);
  }

  console.log('Running audit on demo dataset...');
  const report = runAudit(demoDataset as unknown as Dataset);
  console.log(`Score: ${report.overall_score}/100 — ${report.issues.length} issues`);

  console.log('\nGenerating AI recommendations (5 Gemini calls)...');
  const reportWithRecs = await addRecommendations(report);

  const outPath = resolve(process.cwd(), 'data/cached-recommendations.json');
  writeFileSync(outPath, JSON.stringify(reportWithRecs, null, 2));
  console.log(`\nSaved to data/cached-recommendations.json\n`);

  for (const issue of reportWithRecs.issues) {
    console.log(`[${issue.severity}] ${issue.check_id}`);
    console.log(`  ${issue.detail}`);
    console.log(`  → ${issue.ai_recommendation}\n`);
  }
}

main().catch((err) => {
  console.error('Cache script failed:', err);
  process.exit(1);
});
