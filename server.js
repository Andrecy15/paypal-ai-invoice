// AI Invoice + PayPal Pay Link
// PayPal AI Hackathon 2026 — PayPal Sandbox + Google Gemini.
// No dependencies. Node 18+ (uses global fetch).
// Env: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, GEMINI_API_KEY, PORT.
// Run: cp .env.example .env  (fill in the keys)  then  npm start
const http = require("http");
const fs = require("fs");
const path = require("path");

// ---- tiny .env loader (no dependency) ----
try {
  for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch { /* .env is optional */ }

const PORT = Number(process.env.PORT || 3000);
const PAYPAL_BASE = "https://api-m.sandbox.paypal.com";
const GEMINI_MODEL = "gemini-3.5-flash";

function send(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => { try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); } });
    req.on("error", reject);
  });
}

// ---- Gemini: turn a plain-language description into invoice line items ----
async function generateItems({ seller, client, description, currency }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set. Copy .env.example to .env and add your free Google AI Studio key.");
  const prompt = [
    "You write invoices for freelancers. Given the work described below, return ONLY valid JSON, no markdown, no extra text.",
    "JSON shape: {\"items\": [{\"description\": string, \"quantity\": number, \"unitPrice\": number}], \"notes\": string}",
    "Rules: 1 to 6 items. Prices in " + currency + ", realistic freelance rates, unitPrice with at most 2 decimals, quantity is hours or units.",
    "Seller: " + seller + ". Client: " + client + ". Work: " + description,
  ].join("\n");
  const r = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/" + GEMINI_MODEL + ":generateContent?key=" + key,
    { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }
  );
  const data = await r.json();
  if (!r.ok) throw new Error("Gemini error: " + (data.error?.message || r.status));
  let text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
  text = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(text);
  const items = parsed.items.map((it) => ({
    description: String(it.description),
    quantity: Number(it.quantity) || 1,
    unitPrice: Math.round(Number(it.unitPrice) * 100) / 100,
  }));
  if (!items.length) throw new Error("Gemini returned no items.");
  return { items, notes: parsed.notes || "", model: GEMINI_MODEL };
}

// ---- PayPal Sandbox: access token, then a checkout order ----
async function paypalToken() {
  const id = process.env.PAYPAL_CLIENT_ID, secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error("PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET are not set. Create a Sandbox app at developer.paypal.com and copy them into .env.");
  const r = await fetch(PAYPAL_BASE + "/v1/oauth2/token", {
    method: "POST",
    headers: { Authorization: "Basic " + Buffer.from(id + ":" + secret).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  const data = await r.json();
  if (!r.ok) throw new Error("PayPal token error: " + (data.error_description || r.status));
  return data.access_token;
}

async function createOrder({ items, currency, description, clientEmail }) {
  const total = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
  const token = await paypalToken();
  const r = await fetch(PAYPAL_BASE + "/v2/checkout/orders", {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{
        description: description.slice(0, 127),
        amount: {
          currency_code: currency,
          value: total.toFixed(2),
          breakdown: { item_total: { currency_code: currency, value: total.toFixed(2) } },
        },
        items: items.map((it) => ({
          name: it.description.slice(0, 127),
          unit_amount: { currency_code: currency, value: Number(it.unitPrice).toFixed(2) },
          quantity: String(it.quantity),
        })),
      }],
    }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error("PayPal order error: " + JSON.stringify(data.details || data));
  const approve = (data.links || []).find((l) => l.rel === "approve");
  return { orderId: data.id, status: data.status, total: total.toFixed(2), currency, approveUrl: approve?.href || null };
}

async function getOrder(id) {
  const token = await paypalToken();
  const r = await fetch(PAYPAL_BASE + "/v2/checkout/orders/" + encodeURIComponent(id), {
    headers: { Authorization: "Bearer " + token },
  });
  const data = await r.json();
  if (!r.ok) throw new Error("PayPal order lookup error: " + r.status);
  return { orderId: data.id, status: data.status, payer: data.payer?.email_address || null };
}

// ---- HTTP server ----
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (req.method === "GET" && url.pathname === "/") {
      const html = fs.readFileSync(path.join(__dirname, "public", "index.html"));
      res.writeHead(200, { "Content-Type": "text/html" }); return res.end(html);
    }
    if (req.method === "GET" && url.pathname === "/api/config") {
      return send(res, 200, { paypalConfigured: Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET), geminiConfigured: Boolean(process.env.GEMINI_API_KEY), currency: "USD" });
    }
    if (req.method === "POST" && url.pathname === "/api/generate") {
      const body = await readBody(req);
      const out = await generateItems({ seller: body.seller || "Freelancer", client: body.client || "Client", description: body.description || "", currency: body.currency || "USD" });
      return send(res, 200, out);
    }
    if (req.method === "POST" && url.pathname === "/api/create-order") {
      const body = await readBody(req);
      const out = await createOrder({ items: body.items, currency: body.currency || "USD", description: body.description || "Invoice", clientEmail: body.clientEmail || "" });
      return send(res, 200, out);
    }
    if (req.method === "GET" && url.pathname.startsWith("/api/order/")) {
      const out = await getOrder(url.pathname.split("/").pop());
      return send(res, 200, out);
    }
    if (req.method === "GET" && (url.pathname === "/success" || url.pathname === "/cancel")) {
      res.writeHead(200, { "Content-Type": "text/html" });
      return res.end(url.pathname === "/success"
        ? "<h1>Payment approved (Sandbox)</h1><p>Return to the app to check the order status.</p><a href='/'>Back</a>"
        : "<h1>Payment cancelled</h1><p>No charge was made.</p><a href='/'>Back</a>");
    }
    send(res, 404, { error: "not found" });
  } catch (e) {
    send(res, 500, { error: e.message });
  }
});

server.listen(PORT, () => console.log("AI Invoice running at http://localhost:" + PORT));
