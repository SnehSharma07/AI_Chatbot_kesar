let ctx = {};
try {
  ctx = $('Code Node 1').first().json || {};
} catch (e) {
  ctx = {};
}

let incoming = {};
try {
  incoming = $input.first().json || {};
} catch (e) {
  incoming = {};
}

let replyText = '';
let extraError = '';
if (!ctx.skip_reply) {
  try {
    const llm2 = $('LLM Node 2').first().json || {};
    if (llm2.error) {
      extraError = `LLM Node 2 error: ${typeof llm2.error === 'string' ? llm2.error : (llm2.error.message || JSON.stringify(llm2.error))}`;
    } else {
      replyText = String(
        llm2.text ??
        (llm2.response && llm2.response.text) ??
        llm2.content ??
        (llm2.choices && llm2.choices[0] && llm2.choices[0].message && llm2.choices[0].message.content) ??
        ''
      ).trim();
    }
  } catch (e) {
    extraError = `LLM Node 2 read error: ${e.message}`;
  }

  if (!replyText) {
    const firstName = String(ctx.from_name || '').trim().split(/\s+/)[0] || 'there';
    replyText = `Hi ${firstName},\n\nThank you for contacting Kesar & Co. A team member will review your request and follow up within 24 business hours.\n\nWarm regards,\nTeam Kesar`;
  }
}

let ticketId = '';
if (ctx.create_ticket) {
  ticketId = incoming.ticket_id || '';
  if (!ticketId) {
    try {
      ticketId = $('Code Node 2').first().json.ticket_id || '';
    } catch (e) {
      ticketId = '';
    }
  }
}

const combinedError = [ctx.error, extraError].filter(Boolean).join('; ');

return [{
  json: {
    email_id: ctx.email_id || '',
    received_at: ctx.received_at || '',
    from_email: ctx.from_email || '',
    intent: ctx.intent || 'other',
    secondary_intent: ctx.secondary_intent || '',
    order_id: ctx.resolved_order_id || '',
    language: ctx.language || 'en',
    sentiment: ctx.sentiment || 'neutral',
    confidence: ctx.confidence ?? 0,
    order_found: Boolean(ctx.order_found),
    action_taken: ctx.action_taken || 'escalate_with_draft',
    needs_human: Boolean(ctx.needs_human || extraError),
    ticket_id: ticketId,
    reply_draft: replyText,
    prompt_version: ctx.prompt_version || 'v2',
    processed_at: new Date().toISOString(),
    error: combinedError,
    notes: ctx.escalation_reasons || ''
  }
}];
