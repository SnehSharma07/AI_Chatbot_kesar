# Kesar & Co. Support Copilot — <Your Name>

## 1. Summary

- **What I built:** An n8n AI Order-Support Copilot for Kesar & Co. that classifies incoming emails into strict schema-validated JSON, verifies order ownership and `2026-11-20` policy windows deterministically, drafts brand-voice replies, deduplicates open support tickets, and logs every run to Google Sheets.
- **Platform and LLM used:** n8n + Groq (`<exact-model-name>`, e.g. `llama-3.3-70b-versatile`) + Google Sheets (`Kesar Support`).
- **Time spent (approx. hours):** <fill hours>
- **What works / what doesn't:** End-to-end triage, ownership gating, date math, prompt-injection resistance, ticket deduplication (`E04` -> `E21`), and sheet logging work reliably. Replies are saved as drafts only (not auto-sent), and `orders.json` is embedded in-workflow rather than pulled from a live Shopify API.

## 2. Architecture

![workflow](./screenshots/workflow.png)

| Step / node | What it does | Why I designed it this way |
|---|---|---|
| Webhook | Receives email JSON (`id`, `received_at`, `from`, `subject`, `body`, `attachments`) | Clean HTTP trigger for batch testing and future email integration |
| LLM Node 1 (Groq) | Classifies intent/sentiment/language and extracts `KC-####` JSON | Separates structured extraction from prose generation |
| Code Node 1 | Validates/repairs JSON, looks up order, checks `customer_email`, computes 48h/7d windows vs `received_at`, sets `needs_human` | Prevents hallucinations, PII leaks, and host-clock drift |
| IF (Skip Spam?) | Skips reply/ticket steps for spam (`E06`) | Avoids wasting tokens or cluttering tickets |
| LLM Node 2 (Groq) | Drafts 3–6 sentence reply grounded in `faq.md`, `brand_voice.md`, and verified order JSON only | Guarantees safe, on-brand replies |
| IF (Needs Ticket?) + Get Rows + Code Node 2 | Checks `Tickets` for open `order_id`; updates existing ticket or appends new one | Prevents duplicate tickets (`E04` + `E21`) |
| Code Node 3 + Google Sheets (`Audit Log`) | Safely merges all branches and appends full 18-column audit row including `ticket_id` | Prevents unexecuted-node errors and keeps complete traceability |

## 3. Setup — how someone else can run this

1. **Accounts/credentials needed (no actual keys!):** n8n instance, Groq API key, Google OAuth2 credential with access to the `Kesar Support` spreadsheet (`Audit Log` and `Tickets` tabs).
2. **How to import the workflow:** In n8n, open **Workflows -> Import from File** and upload `workflow.json`.
3. **Where to configure environment variables / credentials:** Attach your Groq credential to both `Groq Chat Model` nodes, attach your Google Sheets OAuth2 credential to all 4 `Google Sheets` nodes, and select your `Kesar Support` document ID.
4. **How to run the 25 test emails:** Publish/activate the workflow and run `scripts/run_test_emails.ps1 -WebhookUrl "<YOUR_WEBHOOK_URL>"`.

## 4. Prompts

See `prompts/llm_classify_v2.txt` (temperature `0.1`) and `prompts/llm_reply_v2.txt` (temperature `0.3`).

## 5. Key decisions and assumptions

- **Low-confidence classifications:** Any confidence `< 0.75`, invalid LLM JSON, missing/unknown order ID, or unanswered policy (`E13`) sets `needs_human = true` and opens a review ticket.
- **Duplicate tickets:** Before creating a ticket, the flow reads `Tickets` (`Always Output Data = true`) and matches any non-closed row with the same `order_id` (`E04` -> `E21`), appending the new `email_id` and note instead of creating a duplicate.
- **Order ownership:** `order_id` lookup falls back to `from.email` only when `order_id` is absent (`E10`); order JSON is passed to the reply LLM *only* when `order.customer_email === from.email` (`E07` withheld).
- **FAQ grounding:** `faq.md` is embedded in the drafting prompt with strict rules against guessing, medical cure claims (`E20`), or out-of-policy promises (`E12`, `E16`).
- **Other assumptions:** Eligibility uses each email's `received_at` relative to `2026-11-20`, never the host system clock; `orders.json` is treated as authoritative store state.

## 6. Scaling to 1,000 emails/day

At 1,000 emails/day (~42/hr, spiky during sales), two bottlenecks hit first: (1) **Groq rate limits (RPM/TPM)** and (2) **Google Sheets API quotas + full-sheet `Get Rows` scans** for ticket deduplication. To scale: put an inbound queue (Redis/SQS or n8n queue mode with workers) in front of processing, add exponential backoff retries on 429s, migrate `Tickets` and `Audit Log` from Google Sheets to Postgres (indexed `order_id` lookup instead of reading all rows), cache static `faq.md` rules, and add alerting on parse errors or latency spikes.

## 7. Product-thinking questions (<=150 words each)

1. **Auto-send vs. draft:** Auto-send only low-risk, deterministic replies: verified `order_status` updates (`E01`, `E05`, `E15`, `E24`), pure FAQ `product_query` answers with no medical terms (`E02`, `E09`), partnership redirects (`E17`), and thank-you notes (`E25`), provided `confidence >= 0.85` and `needs_human = false`. Keep `return_refund`, `complaint`, `angry` sentiment, medical questions (`E20`), ownership mismatches (`E07`), and `confidence < 0.85` as human-reviewed drafts. A 0.85 threshold captures ~35–40% safe deflection while ensuring refunds, policy exceptions, and tone-sensitive cases never auto-fire unchecked.

2. **Cost:** Assuming ~1,400 input tokens + ~250 output tokens per email across both LLM calls (classify + draft), total usage is ~1,650 tokens/email. Using typical Groq Llama-3.3-70B pricing (~$0.59/1M input, ~$0.79/1M output): `(1,400 * $0.59 + 250 * $0.79) / 1,000,000 = $0.00102` per email (~₹0.09). At 1,000 emails/day (30,000/month), monthly LLM cost is `30,000 * $0.00102 = ~$30.70/month` (~₹2,600/month). Even on a 10x pricier frontier model this stays near ~$300/month, and prompt caching on static FAQ/brand-voice tokens can cut input cost by 50%+.

3. **Success metric:** Track **Human Edit Rate on Drafts** (percentage of AI drafts sent unchanged or with light edits vs. rewritten/rejected) alongside **Zero Policy/PII Violations**. High draft acceptance proves accurate intent, correct FAQ grounding, and usable brand tone in week 1. Switch off auto-drafting/auto-sending immediately if **even one PII/ownership leak** (`E07`), **medical/cure claim** (`E20`), or **>15% policy-incorrect refund promises** occur in daily spot-checks, or if CSAT drops below baseline.

4. **Failure experience:** If misclassified or mishandled, a customer could receive an irrelevant template, wrong return eligibility, a tone-deaf reply when angry, or—worst case—someone else's address or a false refund promise. Damage is limited through defense-in-depth: (1) deterministic code gates `order_found` and `customer_email` before the LLM ever sees order JSON, (2) date windows are computed in JS, not by the LLM, (3) strict `needs_human` escalation routes risky/low-confidence cases to draft-only, and (4) human agents review drafts before sending.

5. **Don't automate:** **Final refund approvals and payouts for damaged, missing, or adverse-reaction complaints** (`E04`, `E08`, `E14`, `E20`, `E23`) should stay manual. Automating payouts invites fraud (fake/missing photos, packing-weight disputes), risks mishandling safety/allergy incidents that need human empathy and batch tracking, and cannot reliably judge image authenticity (`cracked_jar.jpg`). The copilot should gather photos, verify delivery dates, and prepare the ticket, leaving financial/safety sign-off to a human agent.

## 8. How I used AI tools

I used an AI coding assistant to draft n8n JavaScript validators, regex/date-window checks, prompt iterations (`v1` -> `v2`), and test-report formatting. I relied on my own judgment for policy edge cases—such as distinguishing `other` subtypes (spam vs. partnership vs. missing GST policy), setting the `0.75` escalation threshold, gating order context behind deterministic email ownership checks, and designing `Tickets` deduplication in Google Sheets.

## 9. If I had one more week

- Connect live Shopify Orders & courier tracking APIs instead of static `orders.json`.
- Add automated attachment checks and Slack/email alerts for `high` priority and medical escalations.
- Build an automated regression harness comparing `Audit Log` outputs against golden labels on every prompt edit.
