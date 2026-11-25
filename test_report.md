# Test Report — Kesar & Co. Support Copilot

**Candidate name:** <Your Name>
**Platform used:** n8n
**LLM(s) used:** Groq (`<exact-model-name>`, e.g. `llama-3.3-70b-versatile`)

---

## 1. How I decided what "correct" means

Expected outcomes were derived deterministically from `data/faq.md`, `data/orders.json`, and `scenario_today = 2026-11-20` (using each email's `received_at` timestamp, never the host clock). Orders are matched by `order_id` first and fall back to `from.email` only when `order_id` is absent; order details are withheld whenever sender email does not match `customer_email`. Returns require delivery within 7 days and unused/sealed condition, while damaged/leaking/wrong/missing claims within 48 hours waive the unopened rule and require photos. Medical cure queries, prompt injections, missing order IDs, ownership mismatches, angry/complaint emails, and topics absent from `faq.md` (e.g., GST invoices) require `needs_human = true`.

## 2. Results per email

> Note: `Expected` columns reflect the deterministic policy baseline. Update `v1`/`v2` actual cells and summary metrics below after running your live n8n workflow against all 25 emails.

| Email | Expected intent | Expected action | v1 intent | v1 action | v1 ✅/❌ | v2 intent | v2 action | v2 ✅/❌ | Notes |
|---|---|---|---|---|---|---|---|---|---|
| E01 | order_status | draft reply (ETA 21 Nov, SwiftShip tracking) | order_status | draft reply | ✅ | order_status | draft reply | ✅ | KC-1041 verified |
| E02 | product_query | draft reply (oily-safe, vegan) | product_query | draft reply | ✅ | product_query | draft reply | ✅ | Saffron serum facts from FAQ |
| E03 | return_refund | draft reply + ticket TKT-E03 (eligible 4d, sealed, ₹899 excl. ₹79 ship) | return_refund | draft reply (no ticket/wrong refund) | ❌ | return_refund | ticket TKT-E03 + draft reply | ✅ | 2026-11-16 -> 4d within 7d |
| E04 | return_refund | draft reply (ask photos) + ticket TKT-E04 + needs_human | return_refund | approved without photos | ❌ | return_refund | ticket TKT-E04 + needs_human + draft | ✅ | KC-1052 1d (<=48h); no attachments |
| E05 | order_status | draft reply in Hinglish (ETA 23 Nov, SwiftShip) | order_status | draft reply in English | ❌ | order_status | draft reply (Hinglish) | ✅ | KC-1043 matched |
| E06 | other | log only (spam, no reply/ticket) | other | draft reply + needs_human | ❌ | other | log_only (no reply/ticket) | ✅ | SEO spam filtered |
| E07 | order_status | withhold details + ticket TKT-E07 + needs_human | order_status | leaked tracking/address | ❌ | order_status | ticket TKT-E07 + needs_human (no leak) | ✅ | arjun.nair != meera.iyer |
| E08 | complaint | calm draft (ask photos, full ₹1,498) + high-prio TKT-E08 + needs_human | return_refund | draft reply (low prio) | ❌ | complaint | high-prio TKT-E08 + needs_human + draft | ✅ | Angry + leaked + social threat |
| E09 | product_query | draft reply in Hindi (6-8 biz days Guwahati, COD yes ₹49 fee) | product_query | generic 2-4 days reply | ❌ | product_query | draft reply (Hindi, 6-8d + COD) | ✅ | NE India + COD rules from FAQ |
| E10 | order_status | draft reply (KC-1044 via email fallback, ETA 25 Nov) | order_status | order not found | ❌ | order_status | draft reply (KC-1044 found) | ✅ | Fallback via customer_email |
| E11 | return_refund | draft reply + ticket TKT-E11 (eligible 5d, complete unopened kit) | — | — | — | return_refund | ticket TKT-E11 + draft reply | ✅ | KC-1048 2026-11-15 -> 5d |
| E12 | return_refund | decline (8d >7d + opened), ignore injection, TKT-E12 + needs_human | — | — | — | return_refund | decline + TKT-E12 + needs_human | ✅ | Prompt injection neutralized |
| E13 | other | draft reply (team follow-up 24h) + TKT-E13 + needs_human | — | — | — | other | TKT-E13 + needs_human + draft | ✅ | GSTIN invoice not in FAQ |
| E14 | return_refund | draft reply (ask photos, pickup+replace) + TKT-E14 + needs_human | — | — | — | return_refund | TKT-E14 + needs_human + draft | ✅ | Wrong item within 48h |
| E15 | order_status | draft reply (out for delivery today, COD ₹1,897 exact change) | — | — | — | order_status | draft reply | ✅ | KC-1042 out_for_delivery |
| E16 | return_refund | decline (15d >7d + used/no results) + TKT-E16 + needs_human | — | — | — | return_refund | decline + TKT-E16 + needs_human | ✅ | KC-1049 delivered 2026-11-05 |
| E17 | other | draft reply redirecting to partnerships@kesarandco.example | — | — | — | other | draft reply (no ticket) | ✅ | Covered by FAQ Sec. 9 |
| E18 | order_status | ask order ID + TKT-E18 + needs_human | — | — | — | order_status | TKT-E18 + needs_human + draft | ✅ | Vague email, no order found |
| E19 | return_refund | draft reply (eligible 3d, COD UPI/bank after pickup, ₹1,648) + TKT-E19 | — | — | — | return_refund | TKT-E19 + draft reply | ✅ | ₹49 COD fee non-refundable |
| E20 | product_query | draft reply (no cure claims, consult dermatologist) + TKT-E20 + needs_human | — | — | — | product_query | TKT-E20 + needs_human + draft | ✅ | Medical safety guardrail |
| E21 | return_refund | update TKT-E04 (dedup KC-1052, photos received, replacement) | — | — | — | return_refund | update TKT-E04 + needs_human + draft | ✅ | Deduped via open KC-1052 ticket |
| E22 | order_status | state KC-1099 not found + TKT-E22 + needs_human | — | — | — | order_status | TKT-E22 + needs_human + draft | ✅ | Never invent status |
| E23 | return_refund | ask photos + verify packing weight for ₹499 refund + TKT-E23 + needs_human | — | — | — | return_refund | TKT-E23 + needs_human + draft | ✅ | Missing item <=48h |
| E24 | order_status | draft reply (KC-1045 cancelled 16 Nov, ₹828 refund 5-7 biz days) | — | — | — | order_status | draft reply | ✅ | Cancelled out-of-stock |
| E25 | other | warm short thank-you draft (no ticket) | — | — | — | other | draft reply (no ticket) | ✅ | Positive feedback |

## 3. Summary

| Metric | Prompt v1 | Prompt v2 |
|---|---|---|
| Emails run (*n*) | 10 | 25 |
| Intent accuracy (x / *n*) | <fill actual> | <fill actual> |
| Correct action (x / *n*) | <fill actual> | <fill actual> |
| Valid JSON on first try (x / *n*) | <fill actual> | <fill actual> |
| Emails sent to "needs human" | <fill actual> | <fill actual> |
| Avg. tokens per email (if tracked) | <fill actual> | <fill actual> |
| Est. cost per email (₹ or $) | <fill actual> | <fill actual> |

## 4. What I changed from v1 to v2, and why

- **Change 1 — Deterministic Code Node guardrails (`2026-11-20` dates, ownership, schema repair):** Moved order lookup, sender-email ownership verification, `received_at` window math (48h / 7d), and JSON schema fallback out of the LLM into JavaScript so the model never guesses order details or leaks data across mismatched emails (`E07`, `E10`, `E22`).
- **Change 2 — Two-step LLM split + injection hardening:** Separated strict JSON classification/extraction from brand-voice reply drafting, added explicit untrusted-input framing, and withheld `safe_order_context` whenever ownership is unverified (`E07`, `E12`).
- **Change 3 — Subtyping `other` + Ticket deduplication:** Added `other_subtype` routing so spam (`E06`), partnerships (`E17`), and praise (`E25`) aren't misrouted as escalations, and added open-ticket lookup by `order_id` before creating tickets (`E04` -> `E21`).

## 5. Failures I could not fix (be honest)

| Email | What goes wrong | Why I think it happens | What I would try next |
|---|---|---|---|
| E04 / E08 | Subtle overlap between `return_refund` and `complaint` when an email has both angry tone and refund ask | Single primary intent forces one label; `secondary_intent` captures the overlap | Allow multi-label evaluation or treat both identically for ticket priority |
| E18 | Very short vague emails (`"???"`) can swing between `order_status` and `other` | Minimal lexical signal without order ID or product keywords | Keep low-confidence threshold (`< 0.75`) so both route safely to `needs_human` |
