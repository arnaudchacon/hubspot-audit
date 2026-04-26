// Scratch verification script — run with: npx tsx scripts/test-audit.ts
// Verifies the audit engine produces expected results against the demo dataset.
import { levenshtein } from '../lib/levenshtein';
import { runAudit } from '../lib/audit/index';
import dataset from '../data/demo-dataset.json';
import type { Dataset } from '../lib/audit/types';

// ── Levenshtein sanity check ──────────────────────────────────────────────
const levenshteinTests: Array<[string, string, number]> = [
  ['Alex', 'Alexa', 1],
  ['', 'abc', 3],
  ['abc', '', 3],
  ['abc', 'abc', 0],
  ['kitten', 'sitting', 3],
];

console.log('\n── Levenshtein tests ────────────────────────────────');
let allPassed = true;
for (const [a, b, expected] of levenshteinTests) {
  const result = levenshtein(a, b);
  const pass = result === expected;
  if (!pass) allPassed = false;
  console.log(`  levenshtein("${a}", "${b}") = ${result} (expected ${expected}) ${pass ? '✓' : '✗'}`);
}
console.log(allPassed ? '  All passed.' : '  FAILURES DETECTED.');

// ── Audit engine test ─────────────────────────────────────────────────────
console.log('\n── Audit results ────────────────────────────────────');
const report = runAudit(dataset as unknown as Dataset);

console.log(`  Score: ${report.overall_score}/100`);
console.log(`  Interpretation: ${report.score_interpretation}`);
console.log(`  Issues found: ${report.issues.length}`);
console.log('');

for (const issue of report.issues) {
  console.log(`  [${issue.severity}] ${issue.check_id}`);
  console.log(`    ${issue.detail}`);
}

// ── Expected vs actual ────────────────────────────────────────────────────
console.log('\n── Expected vs actual ───────────────────────────────');
const checks = ['duplicates', 'owners', 'workflows', 'stale_deals', 'phone_format'];
for (const id of checks) {
  const issue = report.issues.find(i => i.check_id === id);
  if (issue) {
    console.log(`  ${id}: ${issue.severity} — ${issue.detail}`);
  } else {
    console.log(`  ${id}: NOT DETECTED`);
  }
}
console.log('');
