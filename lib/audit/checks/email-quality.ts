import type { Contact, AuditIssue, Severity, EmailQualityRawData } from '@/lib/audit/types';

const FREEMAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.uk', 'yahoo.fr',
  'hotmail.com', 'hotmail.fr', 'outlook.com', 'live.com', 'msn.com',
  'icloud.com', 'me.com', 'aol.com', 'proton.me', 'protonmail.com',
  'gmx.com', 'gmx.de', 'web.de', 'mail.com', 'qq.com', '163.com', 'naver.com',
]);

const ROLE_LOCALS = new Set([
  'info', 'sales', 'contact', 'admin', 'support', 'hello', 'office',
  'team', 'marketing', 'billing', 'accounts', 'finance', 'hr',
  'enquiries', 'inquiries', 'noreply', 'no-reply',
]);

const EMAIL_SYNTAX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type FlagReason = 'invalid' | 'freemail' | 'role_based';

function classifyEmail(email: string): FlagReason | null {
  const cleaned = email.trim().toLowerCase();
  if (!EMAIL_SYNTAX.test(cleaned)) return 'invalid';
  const [local, domain] = cleaned.split('@');
  if (FREEMAIL_DOMAINS.has(domain)) return 'freemail';
  if (ROLE_LOCALS.has(local)) return 'role_based';
  return null;
}

export function checkEmailQuality(contacts: Contact[]): AuditIssue | null {
  if (contacts.length === 0) return null;

  const flagged: Array<{ contact: Contact; reason: FlagReason }> = [];
  for (const c of contacts) {
    const reason = classifyEmail(c.email);
    if (reason) flagged.push({ contact: c, reason });
  }

  if (flagged.length === 0) return null;

  const total = contacts.length;
  const pct = (flagged.length / total) * 100;

  const invalidCount = flagged.filter(f => f.reason === 'invalid').length;
  const freemailCount = flagged.filter(f => f.reason === 'freemail').length;
  const roleCount = flagged.filter(f => f.reason === 'role_based').length;

  // Invalid syntax is worse than freemail/role — weigh it into severity.
  const severity: Severity =
    pct >= 25 || invalidCount >= 5 ? 'HIGH' : pct >= 10 ? 'MEDIUM' : 'LOW';

  const samples: EmailQualityRawData['samples'] = flagged.map(f => ({
    name: `${f.contact.first_name} ${f.contact.last_name}`,
    email: f.contact.email,
    reason: f.reason,
  }));

  return {
    check_id: 'email_quality',
    title: 'Low-quality email addresses',
    severity,
    detail: `${flagged.length} of ${total} contacts (${pct.toFixed(0)}%) use a personal, role-based, or invalid email address.`,
    raw_data: {
      flagged_count: flagged.length,
      total_count: total,
      percentage: pct,
      invalid_count: invalidCount,
      freemail_count: freemailCount,
      role_count: roleCount,
      samples,
    },
  };
}
