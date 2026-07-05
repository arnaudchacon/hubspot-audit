import { NextRequest, NextResponse } from 'next/server';
import type { Dataset, Contact, Deal, Workflow } from '@/lib/audit/types';
import { runAudit } from '@/lib/audit/index';
import { addRecommendations } from '@/lib/ai/recommendations';

// Gemini free tier is 5 req/min and a full audit makes 8 calls; the client
// retries 429s after the suggested delay, so the function needs headroom.
export const maxDuration = 60;

// Keep in sync with MAX_ROWS in components/UploadDropzone.tsx
const MAX_ROWS = 2000;

const DATE_PREFIX = /^\d{4}-\d{2}-\d{2}/;

function isValidContact(c: unknown): c is Contact {
  if (!c || typeof c !== 'object') return false;
  const obj = c as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.first_name === 'string' &&
    typeof obj.last_name === 'string' &&
    typeof obj.email === 'string' && obj.email.includes('@') &&
    typeof obj.created_at === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(obj.created_at)
  );
}

function isValidDeal(d: unknown): d is Deal {
  if (!d || typeof d !== 'object') return false;
  const obj = d as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.stage === 'string' &&
    typeof obj.amount_usd === 'number' && Number.isFinite(obj.amount_usd) &&
    typeof obj.created_at === 'string' && DATE_PREFIX.test(obj.created_at) &&
    typeof obj.last_activity_date === 'string' && DATE_PREFIX.test(obj.last_activity_date)
  );
}

function isValidWorkflow(w: unknown): w is Workflow {
  if (!w || typeof w !== 'object') return false;
  const obj = w as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.is_active === 'boolean' &&
    typeof obj.enrollment_count_30d === 'number' &&
    typeof obj.last_enrollment_date === 'string'
  );
}

export async function POST(request: NextRequest) {
  let body: { contacts?: unknown; deals?: unknown; workflows?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { contacts, deals = [], workflows = [] } = body;

  if (!Array.isArray(contacts) || contacts.length === 0) {
    return NextResponse.json({ error: 'contacts must be a non-empty array' }, { status: 400 });
  }
  if (contacts.length > MAX_ROWS) {
    return NextResponse.json({ error: `Maximum ${MAX_ROWS} contacts per upload` }, { status: 400 });
  }

  const ids = new Set<string>();
  for (const c of contacts) {
    if (!isValidContact(c)) {
      return NextResponse.json({ error: 'One or more contacts have invalid fields' }, { status: 400 });
    }
    if (ids.has(c.id)) {
      return NextResponse.json({ error: `Duplicate contact id: "${c.id}"` }, { status: 400 });
    }
    ids.add(c.id);
  }

  if (!Array.isArray(deals) || deals.length > MAX_ROWS) {
    return NextResponse.json({ error: `deals must be an array of at most ${MAX_ROWS} rows` }, { status: 400 });
  }
  for (const d of deals) {
    if (!isValidDeal(d)) {
      return NextResponse.json({ error: 'One or more deals have invalid fields' }, { status: 400 });
    }
  }

  if (!Array.isArray(workflows) || workflows.length > MAX_ROWS) {
    return NextResponse.json({ error: `workflows must be an array of at most ${MAX_ROWS} rows` }, { status: 400 });
  }
  for (const w of workflows) {
    if (!isValidWorkflow(w)) {
      return NextResponse.json({ error: 'One or more workflows have invalid fields' }, { status: 400 });
    }
  }

  const dataset: Dataset = {
    contacts: contacts as Contact[],
    deals: deals as Deal[],
    workflows: workflows as Workflow[],
  };

  const report = runAudit(dataset);
  const reportWithRecs = await addRecommendations(report);

  return NextResponse.json(reportWithRecs);
}
