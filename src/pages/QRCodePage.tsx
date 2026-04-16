import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Camera, Download, Copy, Share2, ArrowLeft, Link as LinkIcon, QrCode, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

export default function QRCodePage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const qrRef = useRef<HTMLDivElement>(null);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const cameraUrl = `${window.location.origin}/camera/${eventId}`;
  const galleryUrl = `${window.location.origin}/events/${eventId}/gallery`;

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  async function loadEvent() {
    const { data } = await supabase.from("events").select("*").eq("id", eventId).single();
    if (data) setEvent(data);
    setLoading(false);
  }

  async function copyLink(url: string) {
    await navigator.clipboard.writeText(url);
    toast({ title: "Link copied!" });
  }

  async function shareLink() {
    if (navigator.share) {
      await navigator.share({ title: `${event?.name} - POV Moments`, text: "Capture your POV!", url: cameraUrl });
    } else {
      copyLink(cameraUrl);
    }
  }

  function downloadQR() {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d")!;
    const img = new window.Image();
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 1024, 1024);
      ctx.drawImage(img, 112, 112, 800, 800);
      ctx.font = "bold 48px Space Grotesk, sans-serif";
      ctx.fillStyle = "#1a1a1a";
      ctx.textAlign = "center";
      ctx.fillText(event?.name || "POV Moments", 512, 80);
      ctx.font = "24px DM Sans, sans-serif";
      ctx.fillStyle = "#666";
      ctx.fillText("Scan to capture your POV!", 512, 980);
      const link = document.createElement("a");
      link.download = `${event?.name || "pov"}-qr-code.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  }

  function printQR() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const svgHtml = new XMLSerializer().serializeToString(svg);
    printWindow.document.write(`
      <html><head><title>${event?.name} QR Code</title>
      <style>
        body { font-family: sans-serif; text-align: center; padding: 40px; }
        h1 { font-size: 32px; margin-bottom: 8px; }
        p { color: #666; font-size: 18px; }
        .qr { margin: 30px auto; width: 400px; height: 400px; }
        .url { font-size: 12px; color: #999; word-break: break-all; margin-top: 20px; }
      </style></head><body>
        <h1>${event?.name || "POV Moments"}</h1>
        <p>Scan to capture your POV!</p>
        <div class="qr">${svgHtml}</div>
        <p class="url">${cameraUrl}</p>
        <script>window.onload=()=>window.print()</script>
      </body></html>
    `);
  }

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Navbar /><p className="text-muted-foreground">Loading...</p></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-12 px-4">
        <div className="container max-w-3xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="mb-4">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Button>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <h1 className="font-heading text-3xl font-bold text-foreground">{event?.name}</h1>
            <p className="text-muted-foreground mt-1">Share this QR code with your guests</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* QR Code Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="glass-card rounded-3xl p-8 text-center space-y-6">
              <div ref={qrRef} className="bg-background rounded-2xl p-6 inline-block mx-auto">
                <QRCodeSVG value={cameraUrl} size={240} level="H"
                  fgColor={event?.theme_color || "#e85d3a"}
                  imageSettings={{ src: "", width: 0, height: 0, excavate: false }} />
              </div>
              <div>
                <p className="font-heading font-semibold text-foreground text-lg">Camera QR Code</p>
                <p className="text-sm text-muted-foreground">Guests scan this to open the camera</p>
              </div>
              <div className="flex gap-3 justify-center flex-wrap">
                <Button variant="hero" size="sm" onClick={downloadQR}>
                  <Download className="w-4 h-4" /> Download PNG
                </Button>
                <Button variant="glass" size="sm" onClick={printQR}>
                  <Printer className="w-4 h-4" /> Print
                </Button>
              </div>
            </motion.div>

            {/* Links & Sharing */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="space-y-6">
              {/* Camera Link */}
              <div className="glass-card rounded-2xl p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-primary" />
                  <h3 className="font-heading font-semibold text-foreground">Camera Link</h3>
                </div>
                <div className="flex gap-2">
                  <Input value={cameraUrl} readOnly className="bg-background/50 text-sm" />
                  <Button variant="outline" size="icon" onClick={() => copyLink(cameraUrl)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Gallery Link */}
              <div className="glass-card rounded-2xl p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-5 h-5 text-accent" />
                  <h3 className="font-heading font-semibold text-foreground">Gallery Link</h3>
                </div>
                <div className="flex gap-2">
                  <Input value={galleryUrl} readOnly className="bg-background/50 text-sm" />
                  <Button variant="outline" size="icon" onClick={() => copyLink(galleryUrl)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Share Button */}
              <Button variant="hero" size="lg" className="w-full" onClick={shareLink}>
                <Share2 className="w-5 h-5" /> Share with Guests
              </Button>

              {/* Event Info */}
              <div className="glass-card rounded-2xl p-6 space-y-2 text-sm">
                <h3 className="font-heading font-semibold text-foreground mb-3">Event Details</h3>
                <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="text-foreground">{event?.event_date ? new Date(event.event_date).toLocaleDateString() : "Not set"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Snaps per guest</span><span className="text-foreground">{event?.snaps_per_guest}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Reveal</span><span className="text-foreground capitalize">{event?.reveal_timing?.replace("_", " ")}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Gallery</span><span className="text-foreground capitalize">{event?.gallery_type}</span></div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
