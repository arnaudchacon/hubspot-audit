'use client';

import { useState, useRef, useEffect, DragEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { X, Upload, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Contact, Deal, Workflow } from '@/lib/audit/types';

interface UploadDropzoneProps {
  onClose: () => void;
}

type Tab = 'contacts' | 'deals' | 'workflows';

// ─── Column aliases ────────────────────────────────────────────────────────────

const CONTACT_ALIASES: Record<string, string> = {
  'firstname':                'first_name',
  'first name':               'first_name',
  'lastname':                 'last_name',
  'last name':                'last_name',
  'emailaddress':             'email',
  'email address':            'email',
  'phonenumber':              'phone',
  'phone number':             'phone',
  'companydomain':            'company_domain',
  'company domain':           'company_domain',
  'company':                  'company_domain',
  'ownerid':                  'owner_id',
  'owner id':                 'owner_id',
  'createdat':                'created_at',
  'created at':               'created_at',
  'date created':             'created_at',
  'create date':              'created_at',
};

const DEAL_ALIASES: Record<string, string> = {
  'deal name':                'name',
  'dealname':                 'name',
  'deal stage':               'stage',
  'dealstage':                'stage',
  'pipeline stage':           'stage',
  'amount':                   'amount_usd',
  'amount in company currency': 'amount_usd',
  'ownerid':                  'owner_id',
  'owner id':                 'owner_id',
  'deal owner':               'owner_id',
  'hubspot owner id':         'owner_id',
  'contactid':                'contact_id',
  'contact id':               'contact_id',
  'associated contact ids':   'contact_id',
  'createdat':                'created_at',
  'created at':               'created_at',
  'create date':              'created_at',
  'last activity date':       'last_activity_date',
  'lastactivitydate':         'last_activity_date',
};

const WORKFLOW_ALIASES: Record<string, string> = {
  'workflow name':            'name',
  'workflowname':             'name',
  'active':                   'is_active',
  'isactive':                 'is_active',
  'is active':                'is_active',
  'status':                   'is_active',
  'enrollments last 30 days': 'enrollment_count_30d',
  'enrollment count':         'enrollment_count_30d',
  'enrollments':              'enrollment_count_30d',
  'last enrollment':          'last_enrollment_date',
  'last enrollment date':     'last_enrollment_date',
  'lastenrollmentdate':       'last_enrollment_date',
};

// ─── Date normalizer ───────────────────────────────────────────────────────────

function normalizeDate(raw: string): string | null {
  const s = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const isoMatch = s.match(/^(\d{4}-\d{2}-\d{2})T/);
  if (isoMatch) return isoMatch[1];
  const slashMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, mm, dd, yyyy] = slashMatch;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }
  return null;
}

// ─── Header normalizer (apply aliases) ────────────────────────────────────────

function normalizeHeaders(
  headers: string[],
  aliases: Record<string, string>
): string[] {
  return headers.map(h => {
    const lower = h.toLowerCase().trim();
    return aliases[lower] ?? lower;
  });
}

// ─── Validators ───────────────────────────────────────────────────────────────

function validateContacts(rows: Record<string, string>[]): string[] {
  const errors: string[] = [];
  if (rows.length === 0) return ['File has no data rows.'];
  if (rows.length > 500) errors.push(`Too many rows: ${rows.length} found, max 500.`);
  const required = ['id', 'first_name', 'last_name', 'email', 'phone', 'company_domain', 'owner_id', 'created_at'];
  const missing = required.filter(c => !(c in rows[0]));
  if (missing.length) return missing.map(c => `Missing column: "${c}"`);
  const seenIds = new Set<string>();
  for (let i = 0; i < Math.min(rows.length, 500); i++) {
    const row = rows[i];
    const n = i + 2;
    if (!row.id) errors.push(`Row ${n}: missing id`);
    else if (seenIds.has(row.id)) errors.push(`Row ${n}: duplicate id "${row.id}"`);
    else seenIds.add(row.id);
    if (!row.email?.includes('@')) errors.push(`Row ${n}: invalid email "${row.email ?? ''}"`);
    if (!row.created_at || !normalizeDate(row.created_at)) errors.push(`Row ${n}: unrecognized date "${row.created_at ?? ''}"`);
    if (errors.length >= 5) { errors.push('Fix the issues above and re-upload.'); break; }
  }
  return errors;
}

function validateDeals(rows: Record<string, string>[]): string[] {
  const errors: string[] = [];
  if (rows.length === 0) return ['File has no data rows.'];
  const required = ['id', 'name', 'stage', 'amount_usd', 'created_at', 'last_activity_date'];
  const missing = required.filter(c => !(c in rows[0]));
  if (missing.length) return missing.map(c => `Missing column: "${c}"`);
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const row = rows[i];
    const n = i + 2;
    if (!row.id) errors.push(`Row ${n}: missing id`);
    if (isNaN(Number(row.amount_usd))) errors.push(`Row ${n}: amount_usd must be a number, got "${row.amount_usd}"`);
    if (!row.created_at || !normalizeDate(row.created_at)) errors.push(`Row ${n}: unrecognized date "${row.created_at ?? ''}"`);
    if (!row.last_activity_date || !normalizeDate(row.last_activity_date)) errors.push(`Row ${n}: unrecognized last_activity_date "${row.last_activity_date ?? ''}"`);
    if (errors.length >= 5) { errors.push('Fix the issues above and re-upload.'); break; }
  }
  return errors;
}

function validateWorkflows(rows: Record<string, string>[]): string[] {
  const errors: string[] = [];
  if (rows.length === 0) return ['File has no data rows.'];
  const required = ['id', 'name', 'is_active', 'enrollment_count_30d', 'last_enrollment_date'];
  const missing = required.filter(c => !(c in rows[0]));
  if (missing.length) return missing.map(c => `Missing column: "${c}"`);
  return errors;
}

// ─── Parsers ──────────────────────────────────────────────────────────────────

function parseContacts(rows: Record<string, string>[]): Contact[] {
  return rows.slice(0, 500).map(row => ({
    id:             row.id,
    first_name:     row.first_name,
    last_name:      row.last_name,
    email:          row.email,
    phone:          row.phone || '',
    company_domain: row.company_domain || '',
    owner_id:       row.owner_id || null,
    created_at:     normalizeDate(row.created_at) ?? row.created_at,
  }));
}

function parseDeals(rows: Record<string, string>[]): Deal[] {
  return rows.map(row => ({
    id:                 row.id,
    name:               row.name,
    stage:              row.stage?.toLowerCase().trim() ?? '',
    amount_usd:         Number(row.amount_usd) || 0,
    owner_id:           row.owner_id || null,
    contact_id:         row.contact_id?.split(';')[0]?.trim() || row.contact_id || '',
    created_at:         normalizeDate(row.created_at) ?? row.created_at,
    last_activity_date: normalizeDate(row.last_activity_date) ?? row.last_activity_date,
  }));
}

function parseWorkflows(rows: Record<string, string>[]): Workflow[] {
  return rows.map(row => {
    const activeRaw = row.is_active?.toLowerCase().trim();
    return {
      id:                    row.id,
      name:                  row.name,
      is_active:             activeRaw === 'true' || activeRaw === 'yes' || activeRaw === '1' || activeRaw === 'active',
      enrollment_count_30d:  Number(row.enrollment_count_30d) || 0,
      last_enrollment_date:  normalizeDate(row.last_enrollment_date) ?? row.last_enrollment_date,
    };
  });
}

// ─── Tab config ───────────────────────────────────────────────────────────────

const TAB_CONFIG = {
  contacts: {
    label: 'Contacts',
    required: true,
    hint: 'id, first_name, last_name, email, phone, company_domain, owner_id, created_at',
    template: '/csv-template.csv',
    checks: ['duplicates', 'owners', 'phone format'],
  },
  deals: {
    label: 'Deals',
    required: false,
    hint: 'id, name, stage, amount_usd, owner_id, contact_id, created_at, last_activity_date',
    template: '/csv-deals-template.csv',
    checks: ['stale deals'],
  },
  workflows: {
    label: 'Workflows',
    required: false,
    hint: 'id, name, is_active, enrollment_count_30d, last_enrollment_date',
    template: '/csv-workflows-template.csv',
    checks: ['zombie workflows'],
  },
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function UploadDropzone({ onClose }: UploadDropzoneProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<Tab>('contacts');
  const [contacts, setContacts]   = useState<Contact[] | null>(null);
  const [deals, setDeals]         = useState<Deal[] | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[] | null>(null);

  const [fileNames, setFileNames] = useState<Record<Tab, string | null>>({ contacts: null, deals: null, workflows: null });
  const [errors, setErrors]       = useState<Record<Tab, string[]>>({ contacts: [], deals: [], workflows: [] });
  const [dragOver, setDragOver]   = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function processFile(file: File) {
    if (!file.name.endsWith('.csv')) {
      setErrors(prev => ({ ...prev, [tab]: ['Only CSV files are accepted.'] }));
      return;
    }
    setFileNames(prev => ({ ...prev, [tab]: file.name }));
    setErrors(prev => ({ ...prev, [tab]: [] }));

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data, meta }) => {
        const rawHeaders = meta.fields ?? [];
        const aliasMap = tab === 'contacts' ? CONTACT_ALIASES : tab === 'deals' ? DEAL_ALIASES : WORKFLOW_ALIASES;
        const normalized = normalizeHeaders(rawHeaders, aliasMap);
        const normalizedData = data.map((row, i) => {
          const out: Record<string, string> = {};
          rawHeaders.forEach((h, j) => { out[normalized[j]] = row[h] ?? ''; });
          return out;
        });

        if (tab === 'contacts') {
          const errs = validateContacts(normalizedData);
          if (errs.length) { setErrors(prev => ({ ...prev, contacts: errs })); setContacts(null); return; }
          setContacts(parseContacts(normalizedData));
        } else if (tab === 'deals') {
          const errs = validateDeals(normalizedData);
          if (errs.length) { setErrors(prev => ({ ...prev, deals: errs })); setDeals(null); return; }
          setDeals(parseDeals(normalizedData));
        } else {
          const errs = validateWorkflows(normalizedData);
          if (errs.length) { setErrors(prev => ({ ...prev, workflows: errs })); setWorkflows(null); return; }
          setWorkflows(parseWorkflows(normalizedData));
        }
      },
      error: () => setErrors(prev => ({ ...prev, [tab]: ['Could not parse the file. Make sure it is a valid CSV.'] })),
    });
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }

  async function runAudit() {
    if (!contacts) return;
    setUploading(true);
    try {
      const res = await fetch('/api/audit-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts, deals: deals ?? [], workflows: workflows ?? [] }),
      });
      if (!res.ok) throw new Error();
      const report = await res.json();
      sessionStorage.setItem('upload-report', JSON.stringify(report));
      router.push('/audit?source=upload');
    } catch {
      setErrors(prev => ({ ...prev, contacts: ['Something went wrong generating the report. Please try again.'] }));
      setUploading(false);
    }
  }

  const checksAvailable = [
    ...(contacts  ? TAB_CONFIG.contacts.checks  : []),
    ...(deals     ? TAB_CONFIG.deals.checks     : []),
    ...(workflows ? TAB_CONFIG.workflows.checks : []),
  ];
  const totalChecks = 5;
  const checksCount = checksAvailable.length;

  const currentFileName = fileNames[tab];
  const currentReady = tab === 'contacts' ? !!contacts : tab === 'deals' ? !!deals : !!workflows;
  const currentErrors = errors[tab];
  const config = TAB_CONFIG[tab];

  function tabStatus(t: Tab): 'ready' | 'error' | 'empty' {
    if (t === 'contacts' && contacts) return 'ready';
    if (t === 'deals' && deals) return 'ready';
    if (t === 'workflows' && workflows) return 'ready';
    if (errors[t].length > 0) return 'error';
    return 'empty';
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-bg border border-border rounded-xl shadow-floating w-full max-w-lg p-8 relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-tertiary hover:text-text-primary transition-colors duration-150 p-1"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <p className="text-caption text-text-tertiary uppercase tracking-[0.05em] mb-3">Upload CSVs</p>
        <h2 className="text-h2 text-text-primary mb-6">Audit your HubSpot instance</h2>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-border">
          {(['contacts', 'deals', 'workflows'] as Tab[]).map(t => {
            const status = tabStatus(t);
            const isActive = t === tab;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex items-center gap-1.5 px-3 py-2 text-body-sm font-medium transition-colors duration-150 border-b-2 -mb-px ${
                  isActive
                    ? 'border-accent text-text-primary'
                    : 'border-transparent text-text-tertiary hover:text-text-secondary'
                }`}
              >
                {TAB_CONFIG[t].label}
                {TAB_CONFIG[t].required && status === 'empty' && (
                  <span className="text-severity-high text-[10px] leading-none">*</span>
                )}
                {status === 'ready' && (
                  <CheckCircle2 size={13} className="text-severity-low" />
                )}
                {status === 'error' && (
                  <span className="w-2 h-2 rounded-full bg-severity-high inline-block" />
                )}
              </button>
            );
          })}
        </div>

        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors duration-150 ${
            dragOver
              ? 'border-accent bg-accent-bg'
              : currentReady
              ? 'border-severity-low bg-severity-low-bg'
              : 'border-border hover:border-border-strong hover:bg-surface'
          }`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={onInputChange} />
          {currentReady ? (
            <>
              <FileText size={24} className="text-severity-low" />
              <p className="text-body text-text-primary font-medium">{currentFileName}</p>
              <p className="text-body-sm text-severity-low">
                {tab === 'contacts' ? `${contacts!.length} contacts ready` : tab === 'deals' ? `${deals!.length} deals ready` : `${workflows!.length} workflows ready`}
              </p>
            </>
          ) : (
            <>
              <Upload size={24} className="text-text-tertiary" />
              <p className="text-body text-text-secondary">
                Drag your {config.label.toLowerCase()} CSV here, or click to choose
              </p>
              {!config.required && (
                <p className="text-body-sm text-text-tertiary">Optional — skip if you don&apos;t have one</p>
              )}
            </>
          )}
        </div>

        {/* Column hint */}
        <p className="text-body-sm text-text-tertiary mt-4">
          Required columns: {config.hint}.{' '}
          <a
            href={config.template}
            download
            className="text-accent hover:text-accent-hover transition-colors duration-150"
            onClick={e => e.stopPropagation()}
          >
            Download template
          </a>
        </p>

        {/* Errors */}
        {currentErrors.length > 0 && (
          <div className="mt-4 p-4 bg-severity-high-bg border border-severity-high rounded-lg">
            <p className="text-body-sm text-severity-high font-medium mb-2">
              We couldn&apos;t process this file:
            </p>
            <ul className="space-y-1">
              {currentErrors.map((e, i) => (
                <li key={i} className="text-body-sm text-severity-high">— {e}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Checks available */}
        <div className="mt-5 pt-5 border-t border-border flex items-center justify-between gap-4">
          <p className="text-body-sm text-text-tertiary">
            {contacts ? (
              <>
                <span className="text-text-primary font-medium">{checksCount} of {totalChecks} checks</span>
                {' '}will run
                {checksCount < totalChecks && (
                  <> · upload {!deals && !workflows ? 'deals and workflows CSVs' : !deals ? 'a deals CSV' : 'a workflows CSV'} to run all 5</>
                )}
              </>
            ) : (
              'Upload contacts CSV to run the audit'
            )}
          </p>
          <Button
            variant="primary"
            disabled={!contacts || uploading}
            onClick={runAudit}
          >
            {uploading ? 'Generating…' : 'Run Audit'}
          </Button>
        </div>
      </div>
    </div>
  );
}
