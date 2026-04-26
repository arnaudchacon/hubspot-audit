import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { runAudit } from '../lib/audit/index';
import { addRecommendations } from '../lib/ai/recommendations';
import demoDataset from '../data/demo-dataset.json';
import type { Dataset } from '../lib/audit/types';

async function main() {
  const report = runAudit(demoDataset as unknown as Dataset);
  const oneIssue = { ...report, issues: report.issues.slice(0, 1) };

  try {
    const result = await addRecommendations(oneIssue);
    console.log('check_id:', result.issues[0].check_id);
    console.log('recommendation:', result.issues[0].ai_recommendation);
  } catch (e) {
    console.error('addRecommendations threw:', e);
  }
}

main();
