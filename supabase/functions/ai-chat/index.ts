// AI assistant + marketing copy generator powered by Lovable AI Gateway.
// Mode: "chat" → conversational support agent (knows the app)
//       "marketing" → generates promo blurbs for hosts/influencers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APP_KNOWLEDGE = `
You are POV Moments' built-in assistant. POV Moments is a disposable-style
event camera PWA. Hosts create events, set snaps-per-guest, reveal timing
(immediate/after_event/24h/custom), filters and theme. Guests scan a QR,
take limited photos/video/GIF/boomerang with filters & emoji stickers, no
preview until reveal. Pricing: Starter Ksh 100/mo (1-day trial), Pro Ksh
999/mo, Platinum Ksh 6999 lifetime. KE pays via Paystack/M-Pesa, others
via Stripe. Features: photobook PDF export, audio guestbook, share to any
social, AI captions, referral program 10% commission. Always answer in
2-4 short sentences. If asked something off-topic, redirect to events.
`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { mode = "chat", messages = [], topic, audience, tone } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "AI not configured" }, 500);

    let payload: any;
    if (mode === "marketing") {
      payload = {
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You write punchy, viral marketing copy for event apps. Output 3 distinct messages, each under 280 chars, separated by '---'. No hashtags unless asked. Match the requested tone exactly." },
          { role: "user", content: `Write 3 promo messages for POV Moments.\nTopic: ${topic || "general launch"}\nAudience: ${audience || "event hosts"}\nTone: ${tone || "fun"}` },
        ],
      };
    } else {
      payload = {
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: APP_KNOWLEDGE }, ...messages],
      };
    }

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (r.status === 429) return json({ error: "Rate limit, try again shortly." }, 429);
    if (r.status === 402) return json({ error: "AI credits exhausted." }, 402);
    if (!r.ok) return json({ error: `AI error ${r.status}` }, 500);
    const data = await r.json();
    const reply = data.choices?.[0]?.message?.content ?? "";
    return json({ reply });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
