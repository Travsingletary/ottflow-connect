import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SECRET = Deno.env.get("PAYMENT_WEBHOOK_SECRET")!;

async function validSig(req: Request, rawBody: string) {
  const headerSig = req.headers.get("x-nowpayments-sig") ?? "";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const calc = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2,"0")).join("");
  return headerSig.toLowerCase() === calc.toLowerCase();
}

Deno.serve(async (req) => {
  const raw = await req.text();

  // reject if signature invalid
  const ok = await validSig(req, raw);
  if (!ok) return new Response("invalid signature", { status: 401 });

  const evt = JSON.parse(raw);
  const status = String(evt.payment_status || evt.invoice_status || evt.status || "").toLowerCase();
  const paid = ["finished", "confirmed", "completed", "paid"].includes(status);
  if (!paid) return new Response("ignored", { status: 200 });

  // extract email & planId from your order_description format
  const desc = String(evt.order_description || "");
  const m = /SteadyStreamTV\s([a-z0-9\-]+)\s\(([^)]+)\)/i.exec(desc);
  const planId = m?.[1] ?? "basic-1stream";
  const email = m?.[2] ?? evt.customer_email ?? evt.email;
  const txId = evt.payment_id || evt.invoice_id || crypto.randomUUID();

  if (!email) return new Response("no email", { status: 400 });

  // call your provision function
  const url = new URL("/functions/v1/provision", Deno.env.get("SUPABASE_URL")!);
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, planId, txId }),
  });

  return new Response(resp.ok ? "ok" : "provision failed", { status: resp.ok ? 200 : 500 });
});