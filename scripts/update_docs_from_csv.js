#!/usr/bin/env node
/**
 * Post-run helper: reads exported Google Sheets CSVs (Audit Log + Tickets),
 * computes exact v2 metrics, and populates test_report.md & README.md.
 *
 * Usage:
 *   node scripts/update_docs_from_csv.js --name "Your Name" --model "llama-3.3-70b-versatile" --audit path/to/audit_log.csv --tickets path/to/tickets.csv [--hours 6]
 */

const fs = require('fs');
const path = require('path');

function getArg(flag, fallback = '') {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 && process.argv[idx + 1] ? process.argv[idx + 1] : fallback;
}

// RFC-4180 CSV parser supporting quoted multiline fields
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(field);
        field = '';
      } else if (ch === '\r' && next === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
        i++;
      } else if (ch === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += ch;
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.trim());
  return rows.slice(1)
    .filter(r => r.some(c => c.trim() !== ''))
    .map(r => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? '').trim()])));
}

const EXPECTED_INTENTS = {
  E01: ['order_status'],
  E02: ['product_query'],
  E03: ['return_refund'],
  E04: ['return_refund', 'complaint'],
  E05: ['order_status'],
  E06: ['other'],
  E07: ['order_status'],
  E08: ['complaint', 'return_refund'],
  E09: ['product_query'],
  E10: ['order_status'],
  E11: ['return_refund'],
  E12: ['return_refund'],
  E13: ['other'],
  E14: ['return_refund', 'complaint'],
  E15: ['order_status'],
  E16: ['return_refund'],
  E17: ['other'],
  E18: ['order_status', 'other', 'complaint'],
  E19: ['return_refund'],
  E20: ['product_query'],
  E21: ['return_refund'],
  E22: ['order_status'],
  E23: ['return_refund', 'complaint'],
  E24: ['order_status'],
  E25: ['other']
};

const EXPECTED_NEEDS_HUMAN = {
  E01: false, E02: false, E03: false, E04: true, E05: false,
  E06: false, E07: true, E08: true, E09: false, E10: false,
  E11: false, E12: true, E13: true, E14: true, E15: false,
  E16: true, E17: false, E18: true, E19: false, E20: true,
  E21: true, E22: true, E23: true, E24: false, E25: false
};

const name = getArg('--name');
const model = getArg('--model');
const hours = getArg('--hours');
const auditPath = getArg('--audit');
const ticketsPath = getArg('--tickets');

if (!auditPath || !ticketsPath) {
  console.error('Usage: node scripts/update_docs_from_csv.js --audit <audit.csv> --tickets <tickets.csv> [--name "Your Name"] [--model "llama-3.3-70b-versatile"] [--hours 6]');
  process.exit(1);
}

const auditRows = parseCsv(fs.readFileSync(path.resolve(auditPath), 'utf8'));
const ticketRows = parseCsv(fs.readFileSync(path.resolve(ticketsPath), 'utf8'));

const byId = new Map(auditRows.map(r => [r.email_id, r]));
const totalRun = auditRows.length;
let intentCorrect = 0;
let actionCorrect = 0;
let validJsonFirstTry = 0;
let sentToHuman = 0;

for (const row of auditRows) {
  const id = row.email_id;
  const expIntents = EXPECTED_INTENTS[id] || [];
  if (expIntents.includes(row.intent)) intentCorrect++;

  const nh = String(row.needs_human).toLowerCase() === 'true';
  if (nh) sentToHuman++;
  const expNh = EXPECTED_NEEDS_HUMAN[id];
  const noError = !row.error;
  if (noError) validJsonFirstTry++;

  if (expNh === nh && noError) actionCorrect++;
}

const baseDir = path.resolve(__dirname, '..');
const reportPath = path.join(baseDir, 'test_report.md');
const readmePath = path.join(baseDir, 'README.md');

let report = fs.readFileSync(reportPath, 'utf8');
let readme = fs.readFileSync(readmePath, 'utf8');

if (name) {
  report = report.replace('**Candidate name:** <Your Name>', `**Candidate name:** ${name}`);
  readme = readme.replace('# Kesar & Co. Support Copilot — <Your Name>', `# Kesar & Co. Support Copilot — ${name}`);
}
if (model) {
  report = report.replace(/\*\*LLM\(s\) used:\*\* Groq \(`[^`]+`.*\)/, `**LLM(s) used:** Groq (\`${model}\`)`);
  readme = readme.replace(/\*\*Platform and LLM used:\*\* n8n \+ Groq \(`[^`]+`.*\)/, `**Platform and LLM used:** n8n + Groq (\`${model}\`)`);
}
if (hours) {
  readme = readme.replace('**Time spent (approx. hours):** <fill hours>', `**Time spent (approx. hours):** ${hours} hours`);
}

// Update per-email v2 columns in test_report.md
const lines = report.split('\n').map(line => {
  const m = line.match(/^\|\s*(E\d{2})\s*\|/);
  if (!m) return line;
  const id = m[1];
  const row = byId.get(id);
  if (!row) return line;

  const parts = line.split('|');
  // columns: '' | Email | ExpIntent | ExpAction | v1Intent | v1Action | v1Mark | v2Intent | v2Action | v2Mark | Notes | ''
  const nh = String(row.needs_human).toLowerCase() === 'true';
  const v2Intent = row.intent || '—';
  const v2ActionParts = [row.action_taken || 'draft'];
  if (row.ticket_id) v2ActionParts.push(row.ticket_id);
  if (nh) v2ActionParts.push('needs_human');
  const v2Action = v2ActionParts.join(' + ');
  const ok = (EXPECTED_INTENTS[id] || []).includes(row.intent) && EXPECTED_NEEDS_HUMAN[id] === nh && !row.error;

  parts[7] = ` ${v2Intent} `;
  parts[8] = ` ${v2Action} `;
  parts[9] = ` ${ok ? '✅' : '❌'} `;
  return parts.join('|');
});
report = lines.join('\n');

// Update v2 summary metrics
report = report
  .replace(/(\|\s*Emails run \(\*n\*\)\s*\|\s*[^|]+\|\s*)[^|]+(\|)/, `$1${totalRun} $2`)
  .replace(/(\|\s*Intent accuracy \(x \/ \*n\*\)\s*\|\s*[^|]+\|\s*)[^|]+(\|)/, `$1${intentCorrect} / ${totalRun} $2`)
  .replace(/(\|\s*Correct action \(x \/ \*n\*\)\s*\|\s*[^|]+\|\s*)[^|]+(\|)/, `$1${actionCorrect} / ${totalRun} $2`)
  .replace(/(\|\s*Valid JSON on first try \(x \/ \*n\*\)\s*\|\s*[^|]+\|\s*)[^|]+(\|)/, `$1${validJsonFirstTry} / ${totalRun} $2`)
  .replace(/(\|\s*Emails sent to "needs human"\s*\|\s*[^|]+\|\s*)[^|]+(\|)/, `$1${sentToHuman} $2`);

fs.writeFileSync(reportPath, report, 'utf8');
fs.writeFileSync(readmePath, readme, 'utf8');

const kc1052 = ticketRows.find(t => t.order_id === 'KC-1052');
console.log(`Updated test_report.md & README.md!`);
console.log(`Audit rows: ${totalRun} | Tickets: ${ticketRows.length}`);
console.log(`v2 Intent accuracy: ${intentCorrect}/${totalRun} | Action accuracy: ${actionCorrect}/${totalRun} | Valid JSON: ${validJsonFirstTry}/${totalRun} | needs_human: ${sentToHuman}`);
if (kc1052) {
  console.log(`KC-1052 ticket check -> ${kc1052.ticket_id} | email_ids: ${kc1052.email_ids}`);
}
