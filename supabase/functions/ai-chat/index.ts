// AI assistant + marketing copy generator powered by Lovable AI Gateway.
// Mode: "chat" → conversational support agent (knows the app)
//       "marketing" → generates promo blurbs for hosts/influencers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APP_KNOWLEDGE = `
You are the Wazi assistant for wazievents.co.ke. Wazi is a Kenya-first digital
disposable camera and event memory platform. Core promise: "Every guest becomes
your photographer. No app. Pay with M-Pesa."

HOW IT WORKS
- A host or organizer signs up with email and password, creates an event (name,
  type, date, start/end time, location, cover, description), sets shots per guest
  (10, 15, 20, 25, 30 or custom), guest limit, reveal timing, moderation,
  downloads, nickname requirement, and gallery visibility.
- They activate it by paying with M-Pesa or card through Paystack. The price is
  calculated on our server from the package and guest count. The event goes live
  only after the payment is confirmed.
- Wazi gives a short link (wazievents.co.ke/e/CODE), an event code, a QR code,
  printable posters (Minimal, Wedding, Birthday, Party, Corporate, Graduation,
  Church, Festival, Baby Shower) as PNG/PDF/SVG, and a WhatsApp share message.
- Guests scan the QR or tap the link. No app and no account: they add an optional
  nickname, allow the camera and shoot. Each guest has a limited number of shots,
  enforced on our server. When shots run out: "Your camera is empty."
- Photos are saved on the phone first and upload automatically when the signal
  returns, so a weak network never loses a photo.
- Reveal options: immediately, after the event ends, 24 hours later, or on a
  chosen date. Until then guests see "The memories are developing".
- Hosts see every photo in their dashboard, can approve, hide or delete photos
  (moderation), and download them. Guests can report a photo.
- Join an event manually at wazievents.co.ke/join with the event code.

WHO IT IS FOR
Weddings, birthdays, graduations, church and community events, corporate events,
conferences, concerts, festivals, club and campus nights, school events, baby
showers, sports days, retreats and recurring event series. Wazi works alongside
any ticketing platform; it is the memory layer, not a ticketing tool.
Organizers and sponsors can get event packages; photographers, photobooth
operators, MCs and planners can partner with us.

PRICING
Prices are in Kenyan shillings and set by the Wazi team: a base price per package
(Starter, Pro, Platinum) plus a small amount per guest. Hosts see the exact total
before paying on the Activate page. For current prices point people to the
Pricing page (wazievents.co.ke/pricing). Never invent a price.

PRIVACY
Galleries are private by default and are only shown to guests when the host
allows it. Photos belong to the host. Guests can report content.

CONTACT
Email joseymras88@gmail.com or use the contact form at wazievents.co.ke/contact
(topics: Support, Sales, Sponsorship, Partnership, Press). Replies within one
working day.

STYLE
Answer in 2 to 4 short, warm sentences in plain Kenyan English. Use a Swahili
greeting where natural (Karibu, Asante). No emojis. If you don't know something,
say so and point to the contact page. If asked something off-topic, bring it back
to events and Wazi.
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
          { role: "user", content: `Write 3 promo messages for Wazi (wazievents.co.ke), a no-app QR disposable camera for Kenyan events paid with M-Pesa.\nTopic: ${topic || "general launch"}\nAudience: ${audience || "event hosts"}\nTone: ${tone || "fun"}` },
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
