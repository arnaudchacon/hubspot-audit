'use client';

import { useState, useRef, useEffect, DragEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { X, Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Contact } from '@/lib/audit/types';

interface UploadDropzoneProps {
  onClose: () => void;
}

const REQUIRED_COLUMNS = ['id', 'first_name', 'last_name', 'email', 'phone', 'company_domain', 'owner_id', 'created_at'];

const COLUMN_ALIASES: Record<string, string> = {
  'firstname':      'first_name',
  'first name':     'first_name',
  'lastname':       'last_name',
  'last name':      'last_name',
  'emailaddress':   'email',
  'email address':  'email',
  'phonenumber':    'phone',
  'phone number':   'phone',
  'companydomain':  'company_domain',
  'company domain': 'company_domain',
  'company':        'company_domain',
  'ownerid':        'owner_id',
  'owner id':       'owner_id',
  'createdat':      'created_at',
  'created at':     'created_at',
  'date created':   'created_at',
};

// Returns YYYY-MM-DD if the string is a recognizable date, null otherwise.
// Handles: YYYY-MM-DD, ISO datetime (2024-03-15T...), MM/DD/YYYY, DD/MM/YYYY (ambiguous → MM/DD).
function normalizeDate(raw: string): string | null {
  const s = raw.trim();
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // ISO datetime — take the date part
  const isoMatch = s.match(/^(\d{4}-\d{2}-\d{2})T/);
  if (isoMatch) return isoMatch[1];
  // MM/DD/YYYY or DD/MM/YYYY (treat as MM/DD/YYYY — matches HubSpot US locale export)
  const slashMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, mm, dd, yyyy] = slashMatch;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }
  return null;
}

function validateHeaders(headers: string[]): string[] {
  const errors: string[] = [];
  const lowerHeaders = headers.map(h => h.toLowerCase().trim());
  for (const col of REQUIRED_COLUMNS) {
    if (!headers.includes(col)) {
      const aliasKey = lowerHeaders.find(h => COLUMN_ALIASES[h] === col);
      if (aliasKey) {
        errors.push(`Column "${aliasKey}" should be "${col}"`);
      } else {
        errors.push(`Missing column: "${col}"`);
      }
    }
  }
  return errors;
}

function validateRows(rows: Record<string, string>[]): string[] {
  const errors: string[] = [];
  if (rows.length === 0) return ['File has no data rows.'];
  if (rows.length > 500) errors.push(`Too many rows: ${rows.length} found, max is 500.`);

  const seenIds = new Set<string>();
  for (let i = 0; i < Math.min(rows.length, 500); i++) {
    const row = rows[i];
    const n = i + 2;
    if (!row.id) {
      errors.push(`Row ${n}: missing id`);
    } else if (seenIds.has(row.id)) {
      errors.push(`Row ${n}: duplicate id "${row.id}"`);
    } else {
      seenIds.add(row.id);
    }
    if (!row.email || !row.email.includes('@')) {
      errors.push(`Row ${n}: invalid email "${row.email || ''}"`);
    }
    if (!row.created_at || !normalizeDate(row.created_at)) {
      errors.push(`Row ${n}: unrecognized date "${row.created_at || ''}" — expected YYYY-MM-DD, ISO datetime, or MM/DD/YYYY`);
    }
    if (errors.length >= 5) {
      errors.push('Fix the issues above and re-upload.');
      break;
    }
  }
  return errors;
}

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

export function UploadDropzone({ onClose }: UploadDropzoneProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
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
      setErrors(['Only CSV files are accepted.']);
      setContacts(null);
      setFileName(null);
      return;
    }
    setFileName(file.name);
    setErrors([]);
    setContacts(null);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data, meta }) => {
        const headers = meta.fields ?? [];
        const headerErrors = validateHeaders(headers);
        if (headerErrors.length > 0) {
          setErrors(headerErrors);
          return;
        }
        const rowErrors = validateRows(data);
        if (rowErrors.length > 0) {
          setErrors(rowErrors);
          return;
        }
        setContacts(parseContacts(data));
      },
      error: () => setErrors(['Could not parse the file. Make sure it is a valid CSV.']),
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
  }

  async function runAudit() {
    if (!contacts) return;
    setUploading(true);
    try {
      const res = await fetch('/api/audit-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts }),
      });
      if (!res.ok) throw new Error();
      const report = await res.json();
      sessionStorage.setItem('upload-report', JSON.stringify(report));
      router.push('/audit?source=upload');
    } catch {
      setErrors(['Something went wrong generating the report. Please try again.']);
      setUploading(false);
    }
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
        <p className="text-caption text-text-tertiary uppercase tracking-[0.05em] mb-3">
          Contacts CSV
        </p>
        <h2 className="text-h2 text-text-primary mb-6">Upload your contacts CSV</h2>

        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors duration-150 ${
            dragOver
              ? 'border-accent bg-accent-bg'
              : fileName && contacts
              ? 'border-severity-low bg-severity-low-bg'
              : 'border-border hover:border-border-strong hover:bg-surface'
          }`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={onInputChange} />
          {fileName && contacts ? (
            <>
              <FileText size={24} className="text-severity-low" />
              <p className="text-body text-text-primary font-medium">{fileName}</p>
              <p className="text-body-sm text-severity-low">{contacts.length} contacts ready</p>
            </>
          ) : (
            <>
              <Upload size={24} className="text-text-tertiary" />
              <p className="text-body text-text-secondary">Drag your CSV here, or click to choose</p>
            </>
          )}
        </div>

        {/* Format hint + template download */}
        <p className="text-body-sm text-text-tertiary mt-4">
          Required columns: {REQUIRED_COLUMNS.join(', ')}.{' '}
          <a
            href="/csv-template.csv"
            download
            className="text-accent hover:text-accent-hover transition-colors duration-150"
            onClick={e => e.stopPropagation()}
          >
            Download template
          </a>
        </p>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mt-4 p-4 bg-severity-high-bg border border-severity-high rounded-lg">
            <p className="text-body-sm text-severity-high font-medium mb-2">
              We couldn&apos;t process this file. Issues found:
            </p>
            <ul className="space-y-1">
              {errors.map((e, i) => (
                <li key={i} className="text-body-sm text-severity-high">— {e}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Submit */}
        <div className="mt-6 flex justify-end">
          <Button
            variant="primary"
            disabled={!contacts || uploading}
            onClick={runAudit}
          >
            {uploading ? 'Generating report…' : 'Run Audit'}
          </Button>
        </div>
      </div>
    </div>
  );
}
