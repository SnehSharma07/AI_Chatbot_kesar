const SCENARIO_TODAY = '2026-11-20';
const CONFIDENCE_THRESHOLD = 0.75;

const ORDERS = [
  { order_id: "KC-1041", customer_name: "Ananya Rao", customer_email: "ananya.rao@example.com", order_date: "2026-11-15", items: [{ sku: "KC-SER-30", name: "Saffron Glow Face Serum 30 ml", qty: 1, unit_price: 1299 }], subtotal: 1299, shipping_fee: 0, cod_fee: 0, total: 1299, payment_method: "prepaid", status: "shipped", courier: "SwiftShip", tracking_url: "https://track.example.com/SS7781041", shipped_date: "2026-11-17", estimated_delivery: "2026-11-21", delivered_date: null, cancelled_date: null, cancellation_reason: null, refund_status: null, shipping_address: { line1: "12 Koregaon Park Lane", city: "Pune", state: "Maharashtra", pincode: "411001" } },
  { order_id: "KC-1042", customer_name: "Rohit Mehta", customer_email: "rohit.mehta@example.com", order_date: "2026-11-14", items: [{ sku: "KC-KUM-15", name: "Kumkumadi Night Oil 15 ml", qty: 1, unit_price: 1149 }, { sku: "KC-UBT-100", name: "Ubtan Face Pack 100 g", qty: 1, unit_price: 699 }], subtotal: 1848, shipping_fee: 0, cod_fee: 49, total: 1897, payment_method: "cod", status: "out_for_delivery", courier: "BharatExpress", tracking_url: "https://track.example.com/BX5521042", shipped_date: "2026-11-16", estimated_delivery: "2026-11-20", delivered_date: null, cancelled_date: null, cancellation_reason: null, refund_status: null, shipping_address: { line1: "88 Civil Lines", city: "Jaipur", state: "Rajasthan", pincode: "302006" } },
  { order_id: "KC-1043", customer_name: "Priya Sharma", customer_email: "priya.sharma@example.com", order_date: "2026-11-16", items: [{ sku: "KC-ALO-150", name: "Aloe Calm Gel 150 g", qty: 1, unit_price: 499 }], subtotal: 499, shipping_fee: 79, cod_fee: 0, total: 578, payment_method: "prepaid", status: "shipped", courier: "SwiftShip", tracking_url: "https://track.example.com/SS7781043", shipped_date: "2026-11-18", estimated_delivery: "2026-11-23", delivered_date: null, cancelled_date: null, cancellation_reason: null, refund_status: null, shipping_address: { line1: "5 Hazratganj Road", city: "Lucknow", state: "Uttar Pradesh", pincode: "226001" } },
  { order_id: "KC-1044", customer_name: "Vikram Singh", customer_email: "vikram.singh@example.com", order_date: "2026-11-16", items: [{ sku: "KC-BHR-200", name: "Bhringraj Hair Oil 200 ml", qty: 2, unit_price: 649 }], subtotal: 1298, shipping_fee: 0, cod_fee: 0, total: 1298, payment_method: "prepaid", status: "shipped", courier: "BharatExpress", tracking_url: "https://track.example.com/BX5521044", shipped_date: "2026-11-18", estimated_delivery: "2026-11-25", delivered_date: null, cancelled_date: null, cancellation_reason: null, refund_status: null, shipping_address: { line1: "21 GS Road", city: "Guwahati", state: "Assam", "pincode": "781005" } },
  { order_id: "KC-1045", customer_name: "Deepak Rao", customer_email: "deepak.rao@example.com", order_date: "2026-11-15", items: [{ sku: "KC-SAN-250", name: "Sandalwood Body Lotion 250 ml", qty: 1, unit_price: 749 }], subtotal: 749, shipping_fee: 79, cod_fee: 0, total: 828, payment_method: "prepaid", status: "cancelled", courier: null, tracking_url: null, shipped_date: null, estimated_delivery: null, delivered_date: null, cancelled_date: "2026-11-16", cancellation_reason: "Out of stock at warehouse", refund_status: "Refund of INR 828 initiated to original payment method on 2026-11-16", shipping_address: { line1: "3 Residency Road", city: "Bengaluru", state: "Karnataka", pincode: "560025" } },
  { order_id: "KC-1046", customer_name: "Meera Iyer", customer_email: "meera.iyer@example.com", order_date: "2026-11-17", items: [{ sku: "KC-KIT-BRD", name: "Bridal Glow Kit", qty: 1, unit_price: 3499 }], subtotal: 3499, shipping_fee: 0, cod_fee: 0, total: 3499, payment_method: "prepaid", status: "shipped", courier: "SwiftShip", tracking_url: "https://track.example.com/SS7781046", shipped_date: "2026-11-19", estimated_delivery: "2026-11-22", delivered_date: null, cancelled_date: null, cancellation_reason: null, refund_status: null, shipping_address: { line1: "Flat 4B, Lotus Residency, Adyar", city: "Chennai", state: "Tamil Nadu", pincode: "600020" } },
  { order_id: "KC-1047", customer_name: "Kavya Reddy", customer_email: "kavya.reddy@example.com", order_date: "2026-11-12", items: [{ sku: "KC-ROS-200", name: "Rose Water Toner 200 ml", qty: 1, unit_price: 899 }], subtotal: 899, shipping_fee: 79, cod_fee: 0, total: 978, payment_method: "prepaid", status: "delivered", courier: "SwiftShip", tracking_url: "https://track.example.com/SS7781047", shipped_date: "2026-11-13", estimated_delivery: "2026-11-16", delivered_date: "2026-11-16", cancelled_date: null, cancellation_reason: null, refund_status: null, shipping_address: { line1: "9 Jubilee Hills Road No. 36", city: "Hyderabad", state: "Telangana", pincode: "500033" } },
  { order_id: "KC-1048", customer_name: "Sneha Joshi", customer_email: "sneha.joshi@example.com", order_date: "2026-11-11", items: [{ sku: "KC-KIT-BRD", name: "Bridal Glow Kit", qty: 1, unit_price: 3499 }], subtotal: 3499, shipping_fee: 0, cod_fee: 0, total: 3499, payment_method: "prepaid", status: "delivered", courier: "BharatExpress", tracking_url: "https://track.example.com/BX5521048", shipped_date: "2026-11-12", estimated_delivery: "2026-11-15", delivered_date: "2026-11-15", cancelled_date: null, cancellation_reason: null, refund_status: null, shipping_address: { line1: "44 Bandra West, Hill Road", city: "Mumbai", state: "Maharashtra", pincode: "400050" } },
  { order_id: "KC-1049", customer_name: "Aditya Verma", customer_email: "aditya.verma@example.com", order_date: "2026-11-01", items: [{ sku: "KC-SER-30", name: "Saffron Glow Face Serum 30 ml", qty: 1, unit_price: 1299 }], subtotal: 1299, shipping_fee: 0, cod_fee: 0, total: 1299, payment_method: "prepaid", status: "delivered", courier: "SwiftShip", tracking_url: "https://track.example.com/SS7781049", shipped_date: "2026-11-02", estimated_delivery: "2026-11-05", delivered_date: "2026-11-05", cancelled_date: null, cancellation_reason: null, refund_status: null, shipping_address: { line1: "17 Sector 15", city: "Noida", state: "Uttar Pradesh", pincode: "201301" } },
  { order_id: "KC-1050", customer_name: "Farhan Sheikh", customer_email: "farhan.sheikh@example.com", order_date: "2026-11-13", items: [{ sku: "KC-KUM-15", name: "Kumkumadi Night Oil 15 ml", qty: 1, unit_price: 1149 }, { sku: "KC-ALO-150", name: "Aloe Calm Gel 150 g", qty: 1, unit_price: 499 }], subtotal: 1648, shipping_fee: 0, cod_fee: 49, total: 1697, payment_method: "cod", status: "delivered", courier: "BharatExpress", tracking_url: "https://track.example.com/BX5521050", shipped_date: "2026-11-14", estimated_delivery: "2026-11-17", delivered_date: "2026-11-17", cancelled_date: null, cancellation_reason: null, refund_status: null, shipping_address: { line1: "62 Park Street", city: "Kolkata", state: "West Bengal", pincode: "700016" } },
  { order_id: "KC-1051", customer_name: "Riya Kapoor", customer_email: "riya.kapoor@example.com", order_date: "2026-11-15", items: [{ sku: "KC-SAN-250", name: "Sandalwood Body Lotion 250 ml", qty: 2, unit_price: 749 }], subtotal: 1498, shipping_fee: 0, cod_fee: 0, total: 1498, payment_method: "prepaid", status: "delivered", courier: "SwiftShip", tracking_url: "https://track.example.com/SS7781051", shipped_date: "2026-11-16", estimated_delivery: "2026-11-19", delivered_date: "2026-11-19", cancelled_date: null, cancellation_reason: null, refund_status: null, shipping_address: { line1: "7 Rajouri Garden Main Market", city: "New Delhi", state: "Delhi", pincode: "110027" } },
  { order_id: "KC-1052", customer_name: "Tanvi Desai", customer_email: "tanvi.desai@example.com", order_date: "2026-11-15", items: [{ sku: "KC-UBT-100", name: "Ubtan Face Pack 100 g", qty: 1, unit_price: 699 }, { sku: "KC-ROS-200", name: "Rose Water Toner 200 ml", qty: 1, unit_price: 899 }], subtotal: 1598, shipping_fee: 0, cod_fee: 0, total: 1598, payment_method: "prepaid", status: "delivered", courier: "BharatExpress", tracking_url: "https://track.example.com/BX5521052", shipped_date: "2026-11-16", estimated_delivery: "2026-11-19", delivered_date: "2026-11-19", cancelled_date: null, cancellation_reason: null, refund_status: null, shipping_address: { line1: "19 Andheri East, Chakala", city: "Mumbai", state: "Maharashtra", pincode: "400093" } },
  { order_id: "KC-1053", customer_name: "Karan Malhotra", customer_email: "karan.malhotra@example.com", order_date: "2026-11-15", items: [{ sku: "KC-UBT-100", name: "Ubtan Face Pack 100 g", qty: 2, unit_price: 699 }], subtotal: 1398, shipping_fee: 0, cod_fee: 0, total: 1398, payment_method: "prepaid", status: "delivered", courier: "SwiftShip", tracking_url: "https://track.example.com/SS7781053", shipped_date: "2026-11-16", estimated_delivery: "2026-11-19", delivered_date: "2026-11-19", cancelled_date: null, cancellation_reason: null, refund_status: null, shipping_address: { line1: "31 Model Town", city: "Ludhiana", state: "Punjab", pincode: "141002" } },
  { order_id: "KC-1054", customer_name: "Pooja Nair", customer_email: "pooja.nair@example.com", order_date: "2026-11-14", items: [{ sku: "KC-SER-30", name: "Saffron Glow Face Serum 30 ml", qty: 1, unit_price: 1299 }, { sku: "KC-ALO-150", name: "Aloe Calm Gel 150 g", qty: 1, unit_price: 499 }], subtotal: 1798, shipping_fee: 0, cod_fee: 0, total: 1798, payment_method: "prepaid", status: "delivered", courier: "BharatExpress", tracking_url: "https://track.example.com/BX5521054", shipped_date: "2026-11-16", estimated_delivery: "2026-11-19", delivered_date: "2026-11-19", cancelled_date: null, cancellation_reason: null, refund_status: null, shipping_address: { line1: "11 Panampilly Nagar", city: "Kochi", state: "Kerala", pincode: "682036" } },
  { order_id: "KC-1055", customer_name: "Manish Gupta", customer_email: "manish.gupta@example.com", order_date: "2026-11-08", items: [{ sku: "KC-SER-30", name: "Saffron Glow Face Serum 30 ml", qty: 1, unit_price: 1299 }, { sku: "KC-KUM-15", name: "Kumkumadi Night Oil 15 ml", qty: 1, unit_price: 1149 }], subtotal: 2448, shipping_fee: 0, cod_fee: 0, total: 2448, payment_method: "prepaid", status: "delivered", courier: "SwiftShip", tracking_url: "https://track.example.com/SS7781055", shipped_date: "2026-11-09", estimated_delivery: "2026-11-12", delivered_date: "2026-11-12", cancelled_date: null, cancellation_reason: null, refund_status: null, shipping_address: { line1: "26 Vijay Nagar", city: "Indore", state: "Madhya Pradesh", pincode: "452010" } }
];

const VALID_INTENTS = new Set(['order_status', 'product_query', 'return_refund', 'complaint', 'other']);
const VALID_SENTIMENTS = new Set(['positive', 'neutral', 'negative', 'angry']);
const VALID_LANGS = new Set(['en', 'hi', 'hinglish']);
const ORDER_ID_RE = /^KC-[0-9]{4}$/;

function safeJsonParse(raw) {
  if (raw && typeof raw === 'object') return { ok: true, value: raw, error: '' };
  const str = String(raw ?? '').trim();
  if (!str) return { ok: false, value: null, error: 'Empty JSON input' };
  const cleaned = str.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    return { ok: true, value: JSON.parse(cleaned), error: '' };
  } catch (e1) {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return { ok: true, value: JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)), error: '' };
      } catch (e2) {
        return { ok: false, value: null, error: `JSON parse error: ${e2.message}` };
      }
    }
    return { ok: false, value: null, error: `JSON parse error: ${e1.message}` };
  }
}

// Safely extract webhook email payload (handles object, array, or stringified JSON body)
let webhookJson = {};
try {
  webhookJson = $('Webhook').first().json || {};
} catch (e) {
  webhookJson = {};
}
let rawEmail = webhookJson;
if (webhookJson && webhookJson.body !== undefined) {
  if (typeof webhookJson.body === 'object' && webhookJson.body !== null) {
    rawEmail = webhookJson.body;
  } else if (typeof webhookJson.body === 'string' && webhookJson.body.trim().startsWith('{')) {
    const bodyParse = safeJsonParse(webhookJson.body);
    if (bodyParse.ok) rawEmail = bodyParse.value;
  }
}
const email = Array.isArray(rawEmail) ? (rawEmail[0] || {}) : (rawEmail || {});

const emailId = email.id || email.email_id || `E-${Date.now()}`;
const fromEmail = String((email.from && email.from.email) || email.from_email || '').trim().toLowerCase();
const fromName = String((email.from && email.from.name) || email.from_name || '').trim();
const attachments = Array.isArray(email.attachments) ? email.attachments : [];
const emailText = `${email.subject || ''}\n${email.body || ''}`;

// Safely extract LLM Node 1 output (handles normal text, continueRegularOutput errors, or empty strings)
let llmItem = {};
try {
  llmItem = $input.first().json || {};
} catch (e) {
  llmItem = {};
}

let parseError = '';
let parsed = null;
if (llmItem.error) {
  parseError = `LLM Node 1 error: ${typeof llmItem.error === 'string' ? llmItem.error : (llmItem.error.message || JSON.stringify(llmItem.error))}`;
} else {
  const candidate =
    llmItem.text ??
    (llmItem.response && llmItem.response.text) ??
    llmItem.content ??
    (llmItem.choices && llmItem.choices[0] && llmItem.choices[0].message && llmItem.choices[0].message.content) ??
    (VALID_INTENTS.has(llmItem.intent) ? llmItem : '');
  const res = safeJsonParse(candidate);
  parsed = res.value;
  parseError = res.error;
}

const regexOrderMatch = emailText.toUpperCase().match(/\bKC-[0-9]{4}\b/);
const regexOrderId = regexOrderMatch ? regexOrderMatch[0] : null;

let schemaValid = false;
let llm = {
  intent: 'other',
  secondary_intent: null,
  order_id: regexOrderId,
  sentiment: 'neutral',
  language: 'en',
  confidence: 0.0,
  summary: 'LLM output invalid; escalated for human review.'
};

if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
  const intentOk = VALID_INTENTS.has(parsed.intent);
  const normSec = (parsed.secondary_intent === undefined || parsed.secondary_intent === '' || parsed.secondary_intent === 'null') ? null : parsed.secondary_intent;
  const secOk = normSec === null || VALID_INTENTS.has(normSec);
  const normOrder = (parsed.order_id === undefined || parsed.order_id === '' || parsed.order_id === 'null') ? null : parsed.order_id;
  const orderOk = normOrder === null || (typeof normOrder === 'string' && ORDER_ID_RE.test(normOrder));
  const sentOk = VALID_SENTIMENTS.has(parsed.sentiment);
  const langOk = VALID_LANGS.has(parsed.language);
  const confNum = typeof parsed.confidence === 'string' && parsed.confidence.trim() !== '' ? Number(parsed.confidence) : parsed.confidence;
  const confOk = typeof confNum === 'number' && !Number.isNaN(confNum) && confNum >= 0 && confNum <= 1;
  const sumOk = typeof parsed.summary === 'string' && parsed.summary.trim().length > 0 && parsed.summary.length <= 200;

  schemaValid = intentOk && secOk && orderOk && sentOk && langOk && (typeof parsed.confidence === 'number' && confOk) && sumOk;
  llm = {
    intent: intentOk ? parsed.intent : 'other',
    secondary_intent: secOk ? normSec : null,
    order_id: orderOk ? normOrder : regexOrderId,
    sentiment: sentOk ? parsed.sentiment : 'neutral',
    language: langOk ? parsed.language : 'en',
    confidence: confOk ? confNum : 0.0,
    summary: (typeof parsed.summary === 'string' && parsed.summary.trim())
      ? parsed.summary.trim().slice(0, 200)
      : 'Summary missing; escalated for human review.'
  };
}

// Deterministic Order Lookup (by order_id first, else fallback to fromEmail)
let matchedOrder = null;
let lookupMethod = 'none';
if (llm.order_id) {
  matchedOrder = ORDERS.find(o => o.order_id === llm.order_id) || null;
  lookupMethod = matchedOrder ? 'order_id' : 'order_id_not_found';
} else if (fromEmail) {
  const byEmail = ORDERS.filter(o => o.customer_email.toLowerCase() === fromEmail);
  if (byEmail.length === 1) {
    matchedOrder = byEmail[0];
    lookupMethod = 'from_email_fallback';
  }
}

const orderFound = Boolean(matchedOrder);
const ownershipVerified = orderFound && (matchedOrder.customer_email.toLowerCase() === fromEmail);
const resolvedOrderId = ownershipVerified ? matchedOrder.order_id : (llm.order_id || null);

// Date & Return/Damage Window Logic (uses received_at relative to 2026-11-20; never system clock)
const refIso = email.received_at || `${SCENARIO_TODAY}T12:00:00+05:30`;
let refDateStr = SCENARIO_TODAY;
if (/Z$/i.test(String(refIso))) {
  const istMs = Date.parse(refIso) + (5.5 * 3600 * 1000);
  refDateStr = new Date(istMs).toISOString().slice(0, 10);
} else if (/^\d{4}-\d{2}-\d{2}/.test(String(refIso))) {
  refDateStr = String(refIso).slice(0, 10);
}
const refDayMs = Date.parse(`${refDateStr}T00:00:00Z`);

let daysSinceDelivery = null;
let within7DayReturn = null;
let within48HrDamage = null;
if (ownershipVerified && matchedOrder.delivered_date) {
  const delDayMs = Date.parse(`${matchedOrder.delivered_date}T00:00:00Z`);
  daysSinceDelivery = Math.round((refDayMs - delDayMs) / 86400000);
  within7DayReturn = daysSinceDelivery >= 0 && daysSinceDelivery <= 7;
  within48HrDamage = daysSinceDelivery >= 0 && daysSinceDelivery <= 2;
}

// Escalation & Subtype Guardrails
const escalationReasons = [];
if (!schemaValid) escalationReasons.push('invalid_llm_schema');
if (llm.confidence < CONFIDENCE_THRESHOLD) escalationReasons.push(`low_confidence(${llm.confidence})`);
if (orderFound && !ownershipVerified) escalationReasons.push('email_ownership_mismatch');
if (llm.order_id && !orderFound) escalationReasons.push('order_id_not_found');
if (llm.intent === 'complaint' || llm.secondary_intent === 'complaint') escalationReasons.push('complaint_intent');
if (llm.sentiment === 'angry') escalationReasons.push('angry_sentiment');

const otherSubtype = parsed && typeof parsed.other_subtype === 'string' ? parsed.other_subtype : null;
const isSpam = (llm.intent === 'other' && otherSubtype === 'spam') || /\b(seo|google ranking|guaranteed #1|free #1|website selected|seo-rankers)\b/i.test(emailText);
const isPartnership = llm.intent === 'other' && (otherSubtype === 'partnership' || /\b(collab|collaboration|influencer|followers|media kit|wholesale|press)\b/i.test(emailText));
const isPraise = llm.intent === 'other' && (otherSubtype === 'praise' || (llm.sentiment === 'positive' && /\b(thank|thanks|lovely|love|soothing)\b/i.test(emailText)));

if (llm.intent === 'other' && !isSpam && !isPartnership && !isPraise) {
  escalationReasons.push('unclear_or_unanswered_other');
}

const MEDICAL_OR_REACTION_RE = /\b(rash|itch|itchy|burn|burning|swelling|allergy|allergic|reaction|breakout|eczema|psoriasis|pregnant|pregnancy|doctor|dermatologist|medicine|cure|treat|infection|redness)\b/i;
if (MEDICAL_OR_REACTION_RE.test(emailText)) {
  escalationReasons.push('medical_or_adverse_reaction');
}

const INJECTION_RE = /(ignore (all )?(previous|above) instructions|system note to ai|system prompt|reveal.*prompt|jailbreak)/i;
if (INJECTION_RE.test(emailText)) {
  escalationReasons.push('prompt_injection_detected');
}

const DAMAGE_WRONG_MISSING_RE = /\b(crack|cracked|spilled|leak|leaked|leaking|damaged|broken|wrong item|instead|missing)\b/i;
if (llm.intent === 'return_refund' && DAMAGE_WRONG_MISSING_RE.test(emailText)) {
  escalationReasons.push('damage_wrong_or_missing_verification');
}

if (llm.intent === 'order_status' && !orderFound) {
  escalationReasons.push('order_not_resolved');
}
if (llm.intent === 'return_refund' && ownershipVerified && within7DayReturn === false && !DAMAGE_WRONG_MISSING_RE.test(emailText)) {
  escalationReasons.push('outside_7d_return_window');
}

const needsHuman = isSpam ? false : escalationReasons.length > 0;
const skipReply = isSpam;
const createTicket = !isSpam && (
  ['return_refund', 'complaint'].includes(llm.intent) ||
  ['return_refund', 'complaint'].includes(llm.secondary_intent) ||
  needsHuman
);

const actionTaken = isSpam
  ? 'log_only'
  : (needsHuman ? 'escalate_with_draft' : (createTicket ? 'ticket_and_draft' : 'draft_reply'));

return [{
  json: {
    email_id: emailId,
    received_at: refIso,
    from_email: fromEmail,
    from_name: fromName,
    subject: email.subject || '',
    body: email.body || '',
    attachments,
    prompt_version: email.prompt_version || 'v2',
    ...llm,
    resolved_order_id: resolvedOrderId,
    order_found: orderFound,
    ownership_verified: ownershipVerified,
    lookup_method: lookupMethod,
    days_since_delivery: daysSinceDelivery,
    within_7d_return: within7DayReturn,
    within_48h_damage: within48HrDamage,
    needs_human: needsHuman,
    skip_reply: skipReply,
    action_taken: actionTaken,
    escalation_reasons: escalationReasons.join('; '),
    create_ticket: createTicket,
    schema_valid: schemaValid,
    error: parseError,
    safe_order_context: ownershipVerified ? matchedOrder : null
  }
}];
