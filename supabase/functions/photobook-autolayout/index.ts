// AI photobook auto-layout: groups event photos into spreads using mood + recency.
// Returns spreads array compatible with PhotobookEditorPage.
import { corsHeaders } from "npm:@supabase/supabase-js@2.95.0/cors";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SRK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { event_id, template = "diptych" } = await req.json();
    if (!event_id) return j({ error: "event_id required" }, 400);

    const supa = createClient(SUPABASE_URL, SRK);
    const { data: photos } = await supa.from("photos")
      .select("id,storage_path,ai_caption,mood_tag,created_at")
      .eq("event_id", event_id).eq("media_type", "photo").eq("is_flagged", false)
      .order("created_at", { ascending: true }).limit(200);
    if (!photos || !photos.length) return j({ spreads: [] });

    // Build URLs
    const items = photos.map(p => ({
      ...p,
      url: `${SUPABASE_URL}/storage/v1/object/public/event-photos/${p.storage_path}`,
    }));

    // Group by mood; fallback chronological
    const groups: Record<string, typeof items> = {};
    items.forEach(p => {
      const k = (p.mood_tag || "moments").toLowerCase();
      (groups[k] ||= []).push(p);
    });

    // Optionally call Lovable AI to suggest spread captions (best effort)
    let captions: Record<string, string> = {};
    try {
      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: "Return JSON only: {\"<group>\": \"<3-5 word spread title>\"}" },
            { role: "user", content: `Groups: ${Object.keys(groups).join(", ")}` },
          ],
        }),
      });
      const d = await r.json();
      try { captions = JSON.parse(d.choices?.[0]?.message?.content?.replace(/```json|```/g, "") || "{}"); } catch {}
    } catch {}

    // Build spreads — per template
    const perSpread = template === "grid" ? 4 : template === "diptych" ? 2 : 1;
    const spreads: Array<{ id: string; title?: string; photo_urls: string[] }> = [];
    Object.entries(groups).forEach(([k, list]) => {
      for (let i = 0; i < list.length; i += perSpread) {
        spreads.push({
          id: Math.random().toString(36).slice(2),
          title: captions[k] || k,
          photo_urls: list.slice(i, i + perSpread).map(x => x.url),
        });
      }
    });

    return j({ spreads });
  } catch (e) {
    return j({ error: String(e) }, 500);
  }
});

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
