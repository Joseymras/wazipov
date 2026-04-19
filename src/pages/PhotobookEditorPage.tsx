// Photobook editor: pick template + page size, drag to rearrange spreads, export PDF.
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Download, Plus, GripVertical, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const PAGE_SIZES = [
  { id: "a4", label: "A4 portrait", ratio: 1 / Math.SQRT2 },
  { id: "square", label: "Square", ratio: 1 },
  { id: "landscape", label: "Landscape", ratio: 4 / 3 },
];
const TEMPLATES = [
  { id: "classic", label: "Classic — 1 image per spread" },
  { id: "diptych", label: "Diptych — 2 images side by side" },
  { id: "grid", label: "Grid — 4 thumbnails" },
];

interface Spread { id: string; photo_urls: string[]; }

export default function PhotobookEditorPage() {
  const { bookId } = useParams();
  const [book, setBook] = useState<any>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [spreads, setSpreads] = useState<Spread[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [bookId]);

  async function load() {
    const { data: b } = await supabase.from("photobooks").select("*").eq("id", bookId).single();
    if (!b) return;
    setBook(b); setSpreads((b.spreads as any) || []);
    const { data: ph } = await supabase.from("photos").select("storage_path").eq("event_id", b.event_id).eq("media_type", "photo").limit(60);
    const urls = await Promise.all((ph || []).map(async p => {
      const { data } = supabase.storage.from("event-photos").getPublicUrl(p.storage_path);
      return data.publicUrl;
    }));
    setPhotos(urls);
  }

  function addSpread() {
    setSpreads(s => [...s, { id: Math.random().toString(36).slice(2), photo_urls: [] }]);
  }
  function delSpread(id: string) { setSpreads(s => s.filter(x => x.id !== id)); }
  function move(idx: number, dir: -1 | 1) {
    setSpreads(s => {
      const arr = [...s]; const j = idx + dir;
      if (j < 0 || j >= arr.length) return s;
      [arr[idx], arr[j]] = [arr[j], arr[idx]]; return arr;
    });
  }
  function addPhotoToSpread(idx: number, url: string) {
    setSpreads(s => s.map((sp, i) => i === idx ? { ...sp, photo_urls: [...sp.photo_urls, url] } : sp));
  }

  async function save() {
    setSaving(true);
    await supabase.from("photobooks").update({ spreads, title: book.title, template: book.template, page_size: book.page_size }).eq("id", bookId);
    setSaving(false); toast({ title: "Saved" });
  }

  async function exportPDF() {
    // Open print dialog — simplest reliable PDF export across browsers.
    window.print();
  }

  if (!book) return <div className="p-8 text-muted-foreground">Loading…</div>;
  const size = PAGE_SIZES.find(p => p.id === book.page_size) || PAGE_SIZES[0];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border print:hidden">
        <div className="container flex flex-wrap items-center justify-between gap-2 h-auto py-2 px-4">
          <Link to="/dashboard/photobooks" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <Input value={book.title} onChange={e => setBook({ ...book, title: e.target.value })} className="max-w-xs h-9" />
          <select value={book.page_size} onChange={e => setBook({ ...book, page_size: e.target.value })} className="bg-card border border-border rounded-md text-sm h-9 px-2">
            {PAGE_SIZES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <select value={book.template} onChange={e => setBook({ ...book, template: e.target.value })} className="bg-card border border-border rounded-md text-sm h-9 px-2">
            {TEMPLATES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <div className="flex gap-2">
            <Button onClick={save} disabled={saving} variant="outline" className="rounded-full"><Save className="w-4 h-4" /> {saving ? "Saving…" : "Save"}</Button>
            <Button onClick={exportPDF} className="rounded-full"><Download className="w-4 h-4" /> Export PDF</Button>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-[1fr_280px] gap-4 p-4 max-w-7xl mx-auto">
        <div className="space-y-4">
          {spreads.length === 0 && (
            <div className="border border-dashed border-border rounded-2xl p-12 text-center">
              <p className="text-muted-foreground mb-3">No spreads yet</p>
              <Button onClick={addSpread} className="rounded-full"><Plus className="w-4 h-4" /> Add first spread</Button>
            </div>
          )}
          {spreads.map((sp, i) => (
            <div key={sp.id} className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between p-2 print:hidden">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <GripVertical className="w-4 h-4" /> Spread {i + 1}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => move(i, -1)}>↑</Button>
                  <Button variant="ghost" size="sm" onClick={() => move(i, 1)}>↓</Button>
                  <Button variant="ghost" size="icon" onClick={() => delSpread(sp.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </div>
              <div className="bg-secondary p-4">
                <div className="bg-background mx-auto" style={{ width: "100%", maxWidth: 600, aspectRatio: size.ratio }}>
                  {book.template === "classic" && (
                    <div className="w-full h-full p-3">
                      {sp.photo_urls[0] ? <img src={sp.photo_urls[0]} className="w-full h-full object-cover" alt="" /> : <EmptySlot onAdd={url => addPhotoToSpread(i, url)} options={photos} />}
                    </div>
                  )}
                  {book.template === "diptych" && (
                    <div className="w-full h-full grid grid-cols-2 gap-2 p-3">
                      {[0, 1].map(k => sp.photo_urls[k] ? <img key={k} src={sp.photo_urls[k]} className="w-full h-full object-cover" alt="" /> : <EmptySlot key={k} onAdd={url => addPhotoToSpread(i, url)} options={photos} />)}
                    </div>
                  )}
                  {book.template === "grid" && (
                    <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-2 p-3">
                      {[0,1,2,3].map(k => sp.photo_urls[k] ? <img key={k} src={sp.photo_urls[k]} className="w-full h-full object-cover" alt="" /> : <EmptySlot key={k} onAdd={url => addPhotoToSpread(i, url)} options={photos} />)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {spreads.length > 0 && (
            <Button onClick={addSpread} variant="outline" className="w-full rounded-full"><Plus className="w-4 h-4" /> Add spread</Button>
          )}
        </div>
        <aside className="print:hidden">
          <div className="sticky top-20 rounded-2xl border border-border bg-card p-3 max-h-[80vh] overflow-y-auto">
            <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Photo library ({photos.length})</p>
            <div className="grid grid-cols-3 gap-2">
              {photos.map(p => (
                <img key={p} src={p} alt="" className="aspect-square object-cover rounded cursor-pointer hover:opacity-80"
                  onClick={() => spreads.length > 0 && addPhotoToSpread(spreads.length - 1, p)} />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function EmptySlot({ onAdd, options }: { onAdd: (url: string) => void; options: string[] }) {
  return (
    <div className="w-full h-full bg-secondary border-2 border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
      Tap a photo →
    </div>
  );
}
