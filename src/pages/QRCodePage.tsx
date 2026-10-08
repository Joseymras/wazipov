import { useState, useEffect } from "react";
import { Download, Copy, Share2, ArrowLeft, Printer, FileImage, FileText, CheckCircle2, AlertTriangle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { eventUrl, galleryUrl as mkGallery, whatsappLink, whatsappText } from "@/lib/site";
import { POSTER_TEMPLATES, canvasToPdf, downloadCanvas, downloadText, posterCanvas, qrCanvas, qrSvg, slug, validateQr } from "@/lib/qr";

export default function QRCodePage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState<boolean | null>(null);
  const [tpl, setTpl] = useState(POSTER_TEMPLATES[0].id);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("events").select("*").eq("id", eventId!).maybeSingle().then(({ data }) => { setEvent(data); setLoading(false); });
  }, [eventId]);

  const code: string = event?.public_code || "";
  const url = code ? eventUrl(code) : "";
  const gallery = eventId ? mkGallery(eventId) : "";
  const file = slug(event?.name || "wazi");

  useEffect(() => {
    if (!url) return;
    qrCanvas(url, 1024).then((c) => setValid(validateQr(c, url))).catch(() => setValid(false));
  }, [url]);

  const track = (name: string) => supabase.from("analytics_events").insert({ event_id: eventId, name, metadata: {} }).then(() => {});

  async function copy(text: string, label = "Link copied") {
    try { await navigator.clipboard.writeText(text); toast({ title: label }); } catch { toast({ title: "Couldn't copy", description: text }); }
  }

  async function guard<T>(fn: () => Promise<T>) {
    if (!valid) { toast({ title: "QR code isn't ready yet", variant: "destructive" }); return; }
    setBusy(true);
    try { await fn(); track("qr_generated"); } catch { toast({ title: "Couldn't create the file. Please try again.", variant: "destructive" }); }
    setBusy(false);
  }

  const dlPng = () => guard(async () => downloadCanvas(await qrCanvas(url, 2048), `${file}-qr.png`));
  const dlSvg = () => guard(async () => downloadText(await qrSvg(url), `${file}-qr.svg`, "image/svg+xml"));
  const poster = () => posterCanvas(POSTER_TEMPLATES.find((t) => t.id === tpl)!, {
    name: event.name, url, code,
    date: event.event_date ? new Date(event.event_date).toLocaleDateString("en-KE", { dateStyle: "long" }) : undefined,
    venue: event.location || event.city || undefined,
  });
  const dlPoster = () => guard(async () => downloadCanvas(await poster(), `${file}-poster.png`));
  const dlPdf = () => guard(async () => canvasToPdf(await poster(), `${file}-poster.pdf`));
  const printPoster = () => guard(async () => {
    const w = window.open("", "_blank"); if (!w) return;
    const src = (await poster()).toDataURL("image/png");
    w.document.write(`<html><head><title>${event.name}</title><style>@page{size:A4;margin:0}body{margin:0}img{width:100%;}</style></head><body><img src="${src}" onload="window.print()"/></body></html>`);
  });

  const text = event ? whatsappText(event.name, url) : "";
  function whatsapp() { track("share_clicked"); window.open(whatsappLink(text), "_blank", "noopener"); }
  async function nativeShare() {
    track("share_clicked");
    if (navigator.share) { try { await navigator.share({ title: event.name, text, url }); } catch { /* cancelled */ } }
    else whatsapp();
  }

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Loading…</p></div>;
  if (!event) return <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center"><p className="text-muted-foreground">We couldn't find this event, or it isn't yours.</p></div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-12 px-4">
        <div className="container max-w-4xl mx-auto space-y-8">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/events")}><ArrowLeft className="w-4 h-4" /> Events</Button>
          <div className="text-center">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Scan to capture</p>
            <h1 className="font-display text-4xl md:text-5xl uppercase mt-1">{event.name}</h1>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <section className="rounded-3xl border border-border bg-card p-6 text-center space-y-5">
              <div className="bg-white rounded-2xl p-5 inline-block" data-testid="event-qr">
                <QRCodeSVG value={url} size={240} level="H" fgColor="#000000" bgColor="#ffffff" marginSize={2} />
              </div>
              <p className={`text-sm flex items-center justify-center gap-1.5 ${valid ? "text-primary" : "text-destructive"}`}>
                {valid === null ? "Checking QR…" : valid ? <><CheckCircle2 className="w-4 h-4" /> Scan-tested: opens the camera</> : <><AlertTriangle className="w-4 h-4" /> QR check failed</>}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={dlPng} disabled={busy}><Download className="w-4 h-4" /> PNG</Button>
                <Button variant="outline" onClick={dlSvg} disabled={busy}><FileImage className="w-4 h-4" /> SVG</Button>
              </div>
              <div className="rounded-xl bg-secondary p-3">
                <p className="text-xs text-muted-foreground">Event code</p>
                <button className="font-display text-3xl tracking-[0.2em]" onClick={() => copy(code, "Code copied")}>{code}</button>
              </div>
            </section>

            <section className="space-y-4">
              <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
                <p className="font-semibold">Camera link</p>
                <div className="flex gap-2"><Input value={url} readOnly aria-label="Camera link" /><Button variant="outline" size="icon" aria-label="Copy camera link" onClick={() => copy(url)}><Copy className="w-4 h-4" /></Button></div>
                <p className="font-semibold pt-2">Gallery link</p>
                <div className="flex gap-2"><Input value={gallery} readOnly aria-label="Gallery link" /><Button variant="outline" size="icon" aria-label="Copy gallery link" onClick={() => copy(gallery)}><Copy className="w-4 h-4" /></Button></div>
              </div>
              <Button size="lg" className="w-full rounded-full" onClick={whatsapp}><MessageCircle className="w-5 h-5" /> Share on WhatsApp</Button>
              <Button size="lg" variant="outline" className="w-full rounded-full" onClick={nativeShare}><Share2 className="w-5 h-5" /> More ways to share</Button>
              <Button size="lg" variant="outline" className="w-full rounded-full" onClick={() => navigate(`/events/${eventId}/activate`)}>Unlock more guests & shots</Button>
            </section>
          </div>

          <section className="rounded-3xl border border-border bg-card p-6 space-y-4">
            <div>
              <h2 className="font-heading text-xl font-semibold">Printable poster</h2>
              <p className="text-sm text-muted-foreground">Pick a style, then download or print. The QR always opens this event.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {POSTER_TEMPLATES.map((t) => (
                <button key={t.id} onClick={() => setTpl(t.id)} aria-pressed={tpl === t.id}
                  className={`flex items-center gap-2 h-10 px-3 rounded-full border text-sm ${tpl === t.id ? "border-foreground" : "border-border"}`}>
                  <span className="w-4 h-4 rounded-full border border-border" style={{ background: t.bg }} />{t.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button onClick={dlPoster} disabled={busy}><Download className="w-4 h-4" /> Poster PNG</Button>
              <Button variant="outline" onClick={dlPdf} disabled={busy}><FileText className="w-4 h-4" /> Poster PDF</Button>
              <Button variant="outline" onClick={printPoster} disabled={busy}><Printer className="w-4 h-4" /> Print</Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
