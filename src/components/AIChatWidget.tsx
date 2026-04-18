import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

type Msg = { role: "user" | "assistant"; content: string };

export default function AIChatWidget() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "assistant", content: "Hey! I'm the POV assistant 👋 Ask me about events, pricing, the camera, or anything else." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 99999, behavior: "smooth" });
  }, [msgs, open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...msgs, { role: "user" as const, content: text }];
    setMsgs(next);
    setInput("");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: { mode: "chat", messages: next },
      });
      if (error || !data?.reply) {
        setMsgs(m => [...m, { role: "assistant", content: data?.error || "Sorry, I had trouble answering. Try again?" }]);
      } else {
        setMsgs(m => [...m, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setMsgs(m => [...m, { role: "assistant", content: "Network hiccup. Please retry." }]);
    }
    setLoading(false);
  }

  return (
    <>
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-gradient-warm shadow-xl flex items-center justify-center text-primary-foreground"
        aria-label={t("chat_open")}
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-24 right-5 z-50 w-[min(92vw,380px)] h-[min(75vh,560px)] rounded-3xl glass-card shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="bg-gradient-warm px-4 py-3 text-primary-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <div className="flex-1">
                <p className="font-heading font-semibold text-sm">POV Assistant</p>
                <p className="text-[10px] opacity-80">Powered by Lovable AI</p>
              </div>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-background/50">
              {msgs.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-card text-card-foreground border border-border/50"
                  }`}>{m.content}</div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-3 py-2 bg-card border border-border/50 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" /> Thinking…
                  </div>
                </div>
              )}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); send(); }}
              className="p-2 border-t border-border/30 flex gap-2 bg-background/80">
              <input
                value={input} onChange={(e) => setInput(e.target.value)}
                placeholder={t("chat_placeholder") as string}
                className="flex-1 bg-card rounded-full px-4 py-2 text-sm focus:outline-none border border-border/50 focus:border-primary"
              />
              <button type="submit" disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-full bg-gradient-warm text-primary-foreground flex items-center justify-center disabled:opacity-50">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
