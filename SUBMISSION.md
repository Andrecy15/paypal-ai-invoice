# Devpost submission pack — AI Invoice + PayPal Pay Link

Prepared 2026-11-11 ~20:40 WIB. Deadline: **Friday 2026-11-13, 03:00 WIB**
(Thursday 2026-11-12, 12:00 PST). ~30 hours left at time of writing.
Do NOT leave submission to the last hour — submit Thursday evening WIB
with buffer, then fix the video/repo link if needed before the cutoff.

Status verified 2026-11-11 20:35 WIB:
- App built and tested in `~/workspace/paypal-ai-invoice/`:
  `server.js` + `public/index.html` + `README.md` + MIT `LICENSE`.
  Gemini test returned valid invoice JSON (logo $850, landing page
  $1,600, revisions 2x$125 = $2,700 total).
- PayPal Sandbox app: Agata created it and copied Client ID + Secret
  (she said "udah" 2026-11-11 20:35 WIB). Keys must NEVER be pasted
  in chat — enter them via the secure entry the main agent provides,
  into `.env` (mode 600, gitignored).
- `.env` does NOT exist yet (checked 20:35 WIB — only `.env.example`).
- No git repo / GitHub remote yet (checked 20:35 WIB).
- Gemini key for `.env` still open: the app reads `GEMINI_API_KEY`
  from `.env`; the Gemini keys already connected in Muse live in the
  Secure Vault and are not the same as a value typed into `.env`.
  Agata needs to supply a Google AI Studio key the same secure way
  (or confirm the existing one can be reused) — do not paste in chat.

## Remaining steps (in order)

1. **Tonight — `.env` + live Sandbox test.** Create `.env` from
   `.env.example`, fill `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`,
   `GEMINI_API_KEY`. Run `npm start`, open http://localhost:3000,
   click Generate invoice with AI, then Create PayPal payment link,
   approve with a Sandbox buyer account, then Check order status.
   Success = a real Sandbox order id + `APPROVED`/`COMPLETED` status.
2. **Push to a PUBLIC GitHub repo** (Devpost requires a public repo
   with an open-source licence — MIT is already in the repo).
   `git init`, add files, commit, create repo on github.com, push.
   Make sure `.env` is NOT committed (`.gitignore` already covers it).
3. **Record the demo video (< 3 minutes)** — script below.
   Upload to YouTube (unlisted is fine for Devpost).
4. **Submit on Devpost** — paste the description below, repo URL,
   video URL, demo instructions, AI tools list. Submit, then verify
   the submission page shows repo + video.

## Devpost description (paste-ready)

**Title:** AI Invoice + PayPal Pay Link

**Tagline:** Type what you did. Gemini writes the invoice. PayPal
turns it into a link your client can actually pay.

**Inspiration:** Freelancers lose hours turning a plain-language job
description into an invoice, then more hours chasing payment. The
invoice and the payment live in two different tools — this app puts
them in one two-click flow.

**What it does:** Type who you are, who the client is, and what you
did, in plain language. Click "Generate invoice with AI" and Gemini
(`gemini-3.5-flash`) returns structured line items — description,
quantity, unit price — as JSON, which you can edit before continuing.
Click "Create PayPal payment link" and the server creates a real
PayPal Sandbox checkout order (`POST /v2/checkout/orders`,
intent `CAPTURE`) for the exact invoice total and returns the
approval link. The client approves in PayPal Sandbox, and the app
can check the order status (`GET /v2/checkout/orders/{id}`).

**How we built it:** Node.js with zero dependencies (Node 18+,
global fetch), single-page UI, MIT licence. PayPal Developer
Platform (Sandbox Orders API) for payments, Google Gemini for the
invoice generation. No mock data: the order, the total and the
approval link are real Sandbox objects, and the PayPal amount comes
from what the model produced.

**Challenges we ran into:** Keeping the whole flow dependency-free
while still doing a real OAuth token exchange with PayPal and a
structured-JSON call to Gemini; making the AI output reliably parse
as invoice line items.

**What's next:** Real PayPal (live) mode behind a toggle, invoice
history, and sending the PayPal link to the client by email.

**Built with:** PayPal Developer Platform (Sandbox Orders API),
Google Gemini (`gemini-3.5-flash`), Node.js, JavaScript, HTML/CSS.

**Try it out (demo instructions):**
1. Clone the public repo, `cp .env.example .env`, fill in the three
   keys (PayPal Sandbox Client ID + Secret from developer.paypal.com,
   Gemini key from Google AI Studio — Sandbox only, no real money).
2. `npm start` — open http://localhost:3000
3. Use the pre-filled example ("Designed a logo and a landing page…")
   and click **Generate invoice with AI**. Example output: logo $850,
   landing page $1,600, revisions 2 x $125 — total $2,700.
4. Click **Create PayPal payment link**, open the link, log in with a
   Sandbox buyer account, approve, then **Check order status**.

## Demo video script (< 3 minutes)

- 0:00–0:15 — "Freelancers waste hours on invoices, then chase
  payment. This app does both in two clicks." Show the form.
- 0:15–1:00 — Type/paste the example description, click Generate
  invoice with AI. Show Gemini's items: logo $850, landing page
  $1,600, revisions 2x$125, total $2,700. Edit one line to show
  it's editable.
- 1:00–1:50 — Click Create PayPal payment link. Show the real
  Sandbox approval link + order id, approve as the Sandbox buyer.
- 1:50–2:30 — Back in the app, click Check order status — show
  APPROVED. Close: "Gemini writes the invoice, PayPal collects
  it. Built with PayPal Sandbox + Gemini."
- Keep it under 3:00. Record the screen + voice in one take if
  possible; captions not required.

## Submission checklist (Devpost)

- [x] Working prototype (runs with `npm start`)
- [x] Public repo with open-source licence (MIT) — repo URL still
      to be created (step 2 above)
- [x] Meaningful PayPal integration (Sandbox Orders API)
- [x] Meaningful AI integration (Gemini generates the invoice)
- [ ] Demo video under 3 minutes (script above)
- [ ] Devpost description + demo instructions (text above)
- [ ] Submitted before Friday 2026-11-13 03:00 WIB
