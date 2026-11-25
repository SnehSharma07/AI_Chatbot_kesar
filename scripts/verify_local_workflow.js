#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '..');
const wf = JSON.parse(fs.readFileSync(path.join(baseDir, 'workflow.json'), 'utf8'));

// 1. Check webhook path
const webhook = wf.nodes.find(n => n.name === 'Webhook');
if (!webhook || webhook.parameters.path !== 'kesar-customer-email') {
  throw new Error(`Expected webhook path 'kesar-customer-email', got '${webhook && webhook.parameters.path}'`);
}

// 2. Check zero .first() in non-Code node expressions
const nonCodeFirst = wf.nodes.filter(n => n.type !== 'n8n-nodes-base.code' && JSON.stringify(n.parameters).includes('.first()'));
if (nonCodeFirst.length) {
  throw new Error(`Found .first() in non-code nodes: ${nonCodeFirst.map(n => n.name).join(', ')}`);
}

// 3. Check Google Sheets column alignment and leading '=' on every expression
const auditHdr = fs.readFileSync(path.join(baseDir, 'templates/audit_log_template.csv'), 'utf8').trim().split(',');
const ticketHdr = fs.readFileSync(path.join(baseDir, 'templates/tickets_template.csv'), 'utf8').trim().split(',');
const auditNode = wf.nodes.find(n => n.name === 'Google Sheets: Append Row (Audit Log)');
const ticketApp = wf.nodes.find(n => n.name === 'Google Sheets: Append Row (Tickets)');
const ticketUpd = wf.nodes.find(n => n.name === 'Google Sheets: Update Row (Tickets)');

for (const [label, node, expectedHdr] of [
  ['Audit Log', auditNode, auditHdr],
  ['Tickets Append', ticketApp, ticketHdr],
  ['Tickets Update', ticketUpd, ticketHdr]
]) {
  const valMap = node.parameters.columns.value;
  if (JSON.stringify(Object.keys(valMap)) !== JSON.stringify(expectedHdr)) {
    throw new Error(`${label} columns mismatch`);
  }
  for (const [col, expr] of Object.entries(valMap)) {
    if (typeof expr !== 'string' || !/^=\{\{.*\}\}$/.test(expr)) {
      throw new Error(`${label}.${col} invalid expression: ${expr}`);
    }
  }
}

// 4. Secret scan
const secretRe = /(gsk_[A-Za-z0-9]{10,}|AIza[A-Za-z0-9_-]{10,}|sk-[A-Za-z0-9]{10,}|Bearer\s+[A-Za-z0-9._-]{15,}|ya29\.[A-Za-z0-9_-]+)/;
if (secretRe.test(JSON.stringify(wf))) {
  throw new Error('Secret pattern found in workflow.json');
}

// 5. Execute actual jsCode from workflow.json nodes against all 25 test emails (and spotlight E04, E06, E21)
const code1 = wf.nodes.find(n => n.name === 'Code Node 1').parameters.jsCode;
const code2 = wf.nodes.find(n => n.name === 'Code Node 2').parameters.jsCode;
const code3 = wf.nodes.find(n => n.name === 'Code Node 3').parameters.jsCode;

const fn1 = new Function('$', '$input', code1);
const fn2 = new Function('$', '$input', code2);
const fn3 = new Function('$', '$input', code3);

const emails = JSON.parse(fs.readFileSync(path.join(baseDir, 'data/test_emails.json'), 'utf8')).emails;
const mockClassify = {
  E01: { intent: 'order_status', secondary_intent: null, order_id: 'KC-1041', sentiment: 'neutral', language: 'en', confidence: 0.98, summary: 'Customer asking delivery ETA for KC-1041.', other_subtype: null },
  E02: { intent: 'product_query', secondary_intent: null, order_id: null, sentiment: 'neutral', language: 'en', confidence: 0.96, summary: 'Customer asking if Saffron Glow Serum is vegan and oily-skin safe.', other_subtype: null },
  E03: { intent: 'return_refund', secondary_intent: null, order_id: 'KC-1047', sentiment: 'neutral', language: 'en', confidence: 0.95, summary: 'Customer wants to return unopened Rose Water Toner KC-1047.', other_subtype: null },
  E04: { intent: 'return_refund', secondary_intent: 'complaint', order_id: 'KC-1052', sentiment: 'negative', language: 'en', confidence: 0.94, summary: 'Customer reports cracked Ubtan jar in KC-1052.', other_subtype: null },
  E05: { intent: 'order_status', secondary_intent: null, order_id: 'KC-1043', sentiment: 'neutral', language: 'hinglish', confidence: 0.95, summary: 'Customer asking delivery date for KC-1043 in Hinglish.', other_subtype: null },
  E06: { intent: 'other', secondary_intent: null, order_id: null, sentiment: 'positive', language: 'en', confidence: 0.97, summary: 'SEO ranking promotional spam email.', other_subtype: 'spam' },
  E07: { intent: 'order_status', secondary_intent: null, order_id: 'KC-1046', sentiment: 'neutral', language: 'en', confidence: 0.94, summary: 'Sender asking tracking and address for wife Meera order KC-1046.', other_subtype: null },
  E08: { intent: 'complaint', secondary_intent: 'return_refund', order_id: 'KC-1051', sentiment: 'angry', language: 'en', confidence: 0.97, summary: 'Angry customer reports leaked lotion in KC-1051 demanding refund.', other_subtype: null },
  E09: { intent: 'product_query', secondary_intent: null, order_id: null, sentiment: 'neutral', language: 'hi', confidence: 0.95, summary: 'Customer in Guwahati asking Bridal Glow Kit delivery time and COD.', other_subtype: null },
  E10: { intent: 'order_status', secondary_intent: null, order_id: null, sentiment: 'neutral', language: 'en', confidence: 0.93, summary: 'Customer asking status of Bhringraj oil order without order ID.', other_subtype: null },
  E11: { intent: 'return_refund', secondary_intent: null, order_id: 'KC-1048', sentiment: 'neutral', language: 'en', confidence: 0.96, summary: 'Customer wants to return unopened Bridal Glow Kit KC-1048.', other_subtype: null },
  E12: { intent: 'return_refund', secondary_intent: null, order_id: 'KC-1055', sentiment: 'negative', language: 'en', confidence: 0.92, summary: 'Customer requests refund for opened KC-1055 with prompt injection.', other_subtype: null },
  E13: { intent: 'other', secondary_intent: null, order_id: null, sentiment: 'neutral', language: 'en', confidence: 0.89, summary: 'Corporate customer requesting GST invoice with GSTIN.', other_subtype: 'unanswered_policy' },
  E14: { intent: 'return_refund', secondary_intent: 'complaint', order_id: 'KC-1053', sentiment: 'negative', language: 'en', confidence: 0.95, summary: 'Customer received wrong item for KC-1053.', other_subtype: null },
  E15: { intent: 'order_status', secondary_intent: null, order_id: 'KC-1042', sentiment: 'neutral', language: 'en', confidence: 0.97, summary: 'Customer asking delivery date for COD order KC-1042.', other_subtype: null },
  E16: { intent: 'return_refund', secondary_intent: 'complaint', order_id: 'KC-1049', sentiment: 'negative', language: 'en', confidence: 0.93, summary: 'Customer unhappy with serum results after 2 weeks on KC-1049.', other_subtype: null },
  E17: { intent: 'other', secondary_intent: null, order_id: null, sentiment: 'positive', language: 'en', confidence: 0.94, summary: 'Instagram influencer proposing paid collaboration.', other_subtype: 'partnership' },
  E18: { intent: 'order_status', secondary_intent: null, order_id: null, sentiment: 'angry', language: 'en', confidence: 0.62, summary: 'Vague frustrated message asking where order is with no ID.', other_subtype: null },
  E19: { intent: 'return_refund', secondary_intent: null, order_id: 'KC-1050', sentiment: 'neutral', language: 'en', confidence: 0.95, summary: 'Customer asking COD return and refund process for unopened KC-1050.', other_subtype: null },
  E20: { intent: 'product_query', secondary_intent: null, order_id: null, sentiment: 'neutral', language: 'en', confidence: 0.94, summary: 'Customer asking if Kumkumadi Night Oil cures eczema.', other_subtype: null },
  E21: { intent: 'return_refund', secondary_intent: null, order_id: 'KC-1052', sentiment: 'negative', language: 'en', confidence: 0.96, summary: 'Follow-up on KC-1052 with photos requesting replacement.', other_subtype: null },
  E22: { intent: 'order_status', secondary_intent: null, order_id: 'KC-1099', sentiment: 'neutral', language: 'en', confidence: 0.95, summary: 'Customer asking status of non-existent order KC-1099.', other_subtype: null },
  E23: { intent: 'return_refund', secondary_intent: 'complaint', order_id: 'KC-1054', sentiment: 'negative', language: 'en', confidence: 0.95, summary: 'Customer reports Aloe Calm Gel missing from KC-1054.', other_subtype: null },
  E24: { intent: 'order_status', secondary_intent: null, order_id: 'KC-1045', sentiment: 'negative', language: 'en', confidence: 0.96, summary: 'Customer asking why KC-1045 has no tracking link after 5 days.', other_subtype: null },
  E25: { intent: 'other', secondary_intent: null, order_id: null, sentiment: 'positive', language: 'en', confidence: 0.97, summary: 'Customer sending positive thank-you note for Aloe gel.', other_subtype: 'praise' }
};

const tickets = [];
const audits = [];

for (const email of emails) {
  let ctx = null;
  let tkt = null;
  let llm2Ran = false;
  const webhookItem = { json: { body: email } };

  const makeDollar = () => (name) => {
    if (name === 'Webhook') return { first: () => webhookItem };
    if (name === 'Code Node 1') return { first: () => ({ json: ctx }) };
    if (name === 'LLM Node 2') {
      if (!llm2Ran) throw new Error('LLM Node 2 read when skipped!');
      return { first: () => ({ json: { text: `Draft reply for ${email.id}` } }) };
    }
    if (name === 'Code Node 2') {
      if (!tkt) throw new Error('Code Node 2 read when skipped!');
      return { first: () => ({ json: tkt }) };
    }
    throw new Error(`Unexpected ref: ${name}`);
  };

  ctx = fn1(makeDollar(), { first: () => ({ json: { text: JSON.stringify(mockClassify[email.id]) } }) })[0].json;
  let incoming = ctx;
  if (!ctx.skip_reply) {
    llm2Ran = true;
    incoming = { text: `Draft reply for ${email.id}` };
    if (ctx.create_ticket) {
      tkt = fn2(makeDollar(), { all: () => tickets.map(r => ({ json: r })) })[0].json;
      if (tkt.ticket_action === 'update') {
        const i = tickets.findIndex(r => r.ticket_id === tkt.ticket_id);
        tickets[i] = { ...tkt };
      } else {
        tickets.push({ ...tkt });
      }
      incoming = tkt;
    }
  }
  audits.push(fn3(makeDollar(), { first: () => ({ json: incoming }) })[0].json);
}

// 6. Malformed / empty JSON resilience tests ("Unexpected end of JSON input" prevention)
const edgeCases = [
  { name: 'empty_llm1_text', webhook: { body: emails[0] }, llm1: { text: '' }, llm2: { text: '' } },
  { name: 'truncated_llm1_json', webhook: { body: emails[0] }, llm1: { text: '{"intent":"order_status"' }, llm2: { error: '429 rate limit' } },
  { name: 'prose_wrapped_llm1_json', webhook: { body: JSON.stringify(emails[0]) }, llm1: { text: 'Sure:\n' + JSON.stringify(mockClassify.E01) + '\nDone.' }, llm2: { text: 'Hi Ananya,\nWarm regards,\nTeam Kesar' } },
  { name: 'llm1_error_obj', webhook: { body: emails[0] }, llm1: { error: { message: 'Upstream timeout' } }, llm2: { text: '' } }
];

for (const tc of edgeCases) {
  let ctx = null;
  const mk = () => (name) => {
    if (name === 'Webhook') return { first: () => ({ json: tc.webhook }) };
    if (name === 'Code Node 1') return { first: () => ({ json: ctx }) };
    if (name === 'LLM Node 2') return { first: () => ({ json: tc.llm2 }) };
    if (name === 'Code Node 2') return { first: () => ({ json: { ticket_id: 'TKT-FALLBACK' } }) };
    throw new Error(`Unexpected ref: ${name}`);
  };
  ctx = fn1(mk(), { first: () => ({ json: tc.llm1 }) })[0].json;
  const audit = fn3(mk(), { first: () => ({ json: {} }) })[0].json;
  if (!audit.reply_draft && !ctx.skip_reply) {
    throw new Error(`Edge case ${tc.name} failed to produce fallback reply_draft`);
  }
  console.log(`EdgeCase ${tc.name} -> schema_valid=${ctx.schema_valid}, needs_human=${audit.needs_human}, order_id=${audit.order_id}, error="${audit.error}"`);
}

console.log('Webhook path:', webhook.parameters.path);
console.log('Non-code .first() hits:', nonCodeFirst.length);
console.log('Google Sheets expressions valid: 18 Audit Log + 11 Tickets Append + 11 Tickets Update');
console.log('Audit rows:', audits.length, '| Unique tickets:', tickets.length);

for (const id of ['E04', 'E06', 'E21']) {
  const a = audits.find(x => x.email_id === id);
  console.log(`${id} Audit -> intent=${a.intent}, order=${a.order_id || 'NONE'}, action=${a.action_taken}, needs_human=${a.needs_human}, ticket_id=${a.ticket_id || 'NONE'}, reply_len=${a.reply_draft.length}`);
}
const kc1052 = tickets.find(t => t.order_id === 'KC-1052');
console.log(`KC-1052 Ticket -> id=${kc1052.ticket_id}, email_ids="${kc1052.email_ids}", status=${kc1052.status}, priority=${kc1052.priority}`);
