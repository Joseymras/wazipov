import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Camera } from "lucide-react";

export default function JoinPage() {
  const { code: urlCode } = useParams();
  const navigate = useNavigate();
  const [code, setCode] = useState(urlCode || "");
  const [nick, setNick] = useState(localStorage.getItem("pov_nickname") || "");

  function start(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (c.length < 6) return;
    if (nick.trim()) localStorage.setItem("pov_nickname", nick.trim().slice(0, 40));
    navigate(`/camera/${c}`);
  }

  return (
    <main className="min-h-[100dvh] bg-foreground text-background flex flex-col items-center justify-center px-6">
      <Link to="/" className="flex items-center gap-2 mb-10" aria-label="POV home">
        <span className="w-9 h-9 rounded-lg bg-background flex items-center justify-center"><Camera className="w-5 h-5 text-foreground" /></span>
        <span className="font-display text-3xl">POV</span>
      </Link>
      <h1 className="font-display uppercase text-5xl text-center leading-none mb-3">Your camera<br />is ready.</h1>
      <p className="text-background/70 mb-8 text-center">Capture something they'll want to remember.</p>
      <form onSubmit={start} className="w-full max-w-sm space-y-3">
        {!urlCode && (
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-background/60">Event code</span>
            <input value={code} onChange={(e) => setCode(e.target.value)} required minLength={6} maxLength={12}
              autoCapitalize="characters" className="mt-1 w-full rounded-xl bg-background/10 border border-background/20 px-4 py-3 text-xl tracking-[0.3em] uppercase text-background focus:outline-none focus:ring-2 focus:ring-accent" />
          </label>
        )}
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-background/60">Your nickname</span>
          <input value={nick} onChange={(e) => setNick(e.target.value)} maxLength={40} placeholder="e.g. Auntie Wanjiru"
            className="mt-1 w-full rounded-xl bg-background/10 border border-background/20 px-4 py-3 text-background placeholder:text-background/40 focus:outline-none focus:ring-2 focus:ring-accent" />
        </label>
        <button className="w-full bg-accent text-accent-foreground rounded-full py-4 font-bold uppercase tracking-wide">Open camera</button>
      </form>
    </main>
  );
}
