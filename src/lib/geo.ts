// Geo-detection for payment provider routing.
// KE → Paystack (M-Pesa), others → Stripe (placeholder until keys added).
const CACHE_KEY = "pov-geo";

export type GeoInfo = { country: string; currency: string; provider: "paystack" | "stripe" };

export async function detectGeo(): Promise<GeoInfo> {
  const cached = sessionStorage.getItem(CACHE_KEY);
  if (cached) return JSON.parse(cached);

  let info: GeoInfo = { country: "KE", currency: "KES", provider: "paystack" };
  try {
    // Free, no-key endpoint; falls back gracefully on failure
    const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(2500) });
    if (res.ok) {
      const data = await res.json();
      const country = (data.country_code || "KE").toUpperCase();
      const provider = country === "KE" ? "paystack" : "stripe";
      info = { country, currency: data.currency || "KES", provider };
    }
  } catch { /* keep default */ }

  sessionStorage.setItem(CACHE_KEY, JSON.stringify(info));
  return info;
}
