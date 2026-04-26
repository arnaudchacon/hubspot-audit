import { NextRequest, NextResponse } from 'next/server';
import type { Dataset, Contact } from '@/lib/audit/types';
import { runAudit } from '@/lib/audit/index';
import { addRecommendations } from '@/lib/ai/recommendations';

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

export async function POST(request: NextRequest) {
  let body: { contacts?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { contacts } = body;
  if (!Array.isArray(contacts) || contacts.length === 0) {
    return NextResponse.json({ error: 'contacts must be a non-empty array' }, { status: 400 });
  }
  if (contacts.length > 500) {
    return NextResponse.json({ error: 'Maximum 500 contacts per upload' }, { status: 400 });
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

  const dataset: Dataset = { contacts: contacts as Contact[], deals: [], workflows: [] };
  const report = runAudit(dataset);
  const reportWithRecs = await addRecommendations(report);

  return NextResponse.json(reportWithRecs);
}
