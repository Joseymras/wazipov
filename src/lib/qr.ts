import QRCode from "qrcode";
import jsQR from "jsqr";
import { jsPDF } from "jspdf";

/** High-resolution QR on a canvas (black on white, max scan reliability). */
export async function qrCanvas(url: string, size = 2048): Promise<HTMLCanvasElement> {
  const c = document.createElement("canvas");
  await QRCode.toCanvas(c, url, { width: size, margin: 4, errorCorrectionLevel: "H", color: { dark: "#000000", light: "#ffffff" } });
  return c;
}

export const qrSvg = (url: string) => QRCode.toString(url, { type: "svg", margin: 4, errorCorrectionLevel: "H" });

/** Decode the rendered QR and confirm it contains exactly the intended URL. */
export function validateQr(canvas: HTMLCanvasElement, expected: string): boolean {
  const ctx = canvas.getContext("2d")!;
  const d = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(d.data, d.width, d.height)?.data === expected;
}

export type PosterTemplate = { id: string; label: string; bg: string; fg: string; accent: string; kicker: string };
export const POSTER_TEMPLATES: PosterTemplate[] = [
  { id: "minimal", label: "Minimal", bg: "#f5f0e8", fg: "#141414", accent: "#141414", kicker: "SCAN TO CAPTURE" },
  { id: "wedding", label: "Wedding", bg: "#fbf7f1", fg: "#3a2e25", accent: "#b08a5a", kicker: "CAPTURE OUR DAY" },
  { id: "birthday", label: "Birthday", bg: "#ff5c8a", fg: "#ffffff", accent: "#1b1464", kicker: "SNAP THE PARTY" },
  { id: "party", label: "Party", bg: "#111118", fg: "#ffffff", accent: "#ff4fa0", kicker: "SCAN. SHOOT. SHARE." },
  { id: "corporate", label: "Corporate", bg: "#0f1b3d", fg: "#ffffff", accent: "#5fb3ff", kicker: "SHARE YOUR VIEW" },
  { id: "graduation", label: "Graduation", bg: "#14213d", fg: "#ffffff", accent: "#fca311", kicker: "CAPTURE THE MOMENT" },
  { id: "church", label: "Church", bg: "#f3efe6", fg: "#2b2b2b", accent: "#6b4f2a", kicker: "SHARE THE BLESSING" },
  { id: "festival", label: "Festival", bg: "#ff7a00", fg: "#1a0d00", accent: "#1a0d00", kicker: "YOUR FESTIVAL. YOUR POV." },
  { id: "babyshower", label: "Baby Shower", bg: "#e6f1fb", fg: "#24384f", accent: "#7aa7d6", kicker: "CAPTURE THE JOY" },
];

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number) {
  const words = text.split(" "); const lines: string[] = []; let line = "";
  for (const w of words) { const t = line ? `${line} ${w}` : w; if (ctx.measureText(t).width > max && line) { lines.push(line); line = w; } else line = t; }
  if (line) lines.push(line); return lines.slice(0, 3);
}

/** Printable A-series poster (1654x2339 ≈ A4 @ 200dpi). */
export async function posterCanvas(t: PosterTemplate, opts: { name: string; date?: string; venue?: string; url: string; code: string }) {
  const W = 1654, H = 2339; const c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = t.bg; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center"; ctx.fillStyle = t.accent;
  ctx.font = "700 60px 'Space Grotesk', Arial, sans-serif"; ctx.fillText(t.kicker, W / 2, 230);
  ctx.fillStyle = t.fg; ctx.font = "900 130px Anton, Impact, sans-serif";
  wrap(ctx, opts.name.toUpperCase(), W - 220).forEach((l, i) => ctx.fillText(l, W / 2, 420 + i * 145));
  ctx.font = "400 50px Arial, sans-serif";
  const sub = [opts.date, opts.venue].filter(Boolean).join("  ·  ");
  if (sub) ctx.fillText(sub, W / 2, 900);
  const q = await qrCanvas(opts.url, 900);
  ctx.fillStyle = "#ffffff"; ctx.fillRect(W / 2 - 500, 990, 1000, 1000);
  ctx.drawImage(q, W / 2 - 450, 1040, 900, 900);
  ctx.fillStyle = t.fg; ctx.font = "500 52px Arial, sans-serif";
  ctx.fillText("Help us capture the day from your POV.", W / 2, 2100);
  ctx.font = "700 44px Arial, sans-serif"; ctx.fillText(`No app needed · Code ${opts.code}`, W / 2, 2180);
  ctx.font = "400 34px Arial, sans-serif"; ctx.fillText(opts.url.replace(/^https?:\/\//, ""), W / 2, 2250);
  return c;
}

export function downloadCanvas(c: HTMLCanvasElement, filename: string) {
  const a = document.createElement("a"); a.download = filename; a.href = c.toDataURL("image/png"); a.click();
}
export function downloadText(text: string, filename: string, type: string) {
  const a = document.createElement("a"); a.download = filename; a.href = URL.createObjectURL(new Blob([text], { type })); a.click();
}
export function canvasToPdf(c: HTMLCanvasElement, filename: string) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  pdf.addImage(c.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, 210, 297);
  pdf.save(filename);
}
export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "wazi";
