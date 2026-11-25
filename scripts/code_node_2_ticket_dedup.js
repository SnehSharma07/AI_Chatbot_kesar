let ctx = {};
try {
  ctx = $('Code Node 1').first().json || {};
} catch (e) {
  ctx = {};
}

let existingRows = [];
try {
  existingRows = $input.all().map(i => (i && i.json) || {}).filter(r => r && r.ticket_id);
} catch (e) {
  existingRows = [];
}

const nowIso = ctx.received_at || '2026-11-20T12:00:00+05:30';
const orderId = ctx.resolved_order_id || '';
const custEmail = String(ctx.from_email || '').trim().toLowerCase();

// Deduplicate: find any open ticket for the same order_id (or customer_email when order_id is absent)
const openTicket = existingRows.find(r => {
  const status = String(r.status || '').toLowerCase().trim();
  const isOpen = status !== 'closed' && status !== 'resolved';
  if (!isOpen) return false;
  if (orderId) return String(r.order_id || '').trim().toUpperCase() === String(orderId).trim().toUpperCase();
  return custEmail && String(r.customer_email || '').trim().toLowerCase() === custEmail;
});

let priority = 'low';
const escReasons = String(ctx.escalation_reasons || '');
if (ctx.sentiment === 'angry' || escReasons.includes('medical_or_adverse_reaction')) {
  priority = 'high';
} else if (ctx.intent === 'complaint' || ctx.intent === 'return_refund' || ctx.needs_human) {
  priority = 'medium';
}

const emailId = ctx.email_id || `E-${Date.now()}`;
const newNote = `[${nowIso}] ${emailId}: ${ctx.summary || 'Support follow-up'}` +
  (Array.isArray(ctx.attachments) && ctx.attachments.length ? ` [Attachments: ${ctx.attachments.join(', ')}]` : '') +
  (escReasons ? ` (Escalated: ${escReasons})` : '');

if (openTicket) {
  const prevEmails = String(openTicket.email_ids || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!prevEmails.includes(emailId)) prevEmails.push(emailId);

  const prioRank = { low: 1, medium: 2, high: 3 };
  const existingRank = prioRank[String(openTicket.priority || 'low').toLowerCase()] || 1;
  const mergedPriority = prioRank[priority] > existingRank ? priority : (openTicket.priority || priority);

  return [{
    json: {
      ticket_action: 'update',
      ticket_id: openTicket.ticket_id,
      created_at: openTicket.created_at || nowIso,
      updated_at: nowIso,
      order_id: openTicket.order_id || orderId,
      customer_email: openTicket.customer_email || ctx.from_email || '',
      email_ids: prevEmails.join(', '),
      intent: openTicket.intent || ctx.intent || 'other',
      priority: mergedPriority,
      status: openTicket.status || 'open',
      summary: openTicket.summary || ctx.summary || '',
      notes: [openTicket.notes, newNote].filter(Boolean).join('\n')
    }
  }];
}

const newTicketId = `TKT-${String(emailId).replace(/[^A-Za-z0-9_-]/g, '')}`;
return [{
  json: {
    ticket_action: 'create',
    ticket_id: newTicketId,
    created_at: nowIso,
    updated_at: nowIso,
    order_id: orderId,
    customer_email: ctx.from_email || '',
    email_ids: emailId,
    intent: ctx.intent || 'other',
    priority,
    status: 'open',
    summary: ctx.summary || '',
    notes: newNote
  }
}];
