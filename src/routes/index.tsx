import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Wand2, ScrollText, Loader2, BookOpen } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { StarfieldBackground } from "@/components/StarfieldBackground";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/")({
  component: Index,
});

type Mode = "match" | "create";

type SpellResult = {
  latinName: string;
  russianName: string;
  description: string;
};

const MODE_META: Record<
  Mode,
  { label: string; hint: string; cta: string; placeholder: string }
> = {
  match: {
    label: "Подобрать заклинание",
    hint: "ИИ выберет для вас существующее заклинание из «Гарри Поттера».",
    cta: "Наложить заклинание",
    placeholder:
      "Например: я спокойный и рассудительный, люблю книги, защищаю друзей, но бываю упрям…",
  },
  create: {
    label: "Создать своё",
    hint: "ИИ придумает новое, уникальное заклинание лично для вас.",
    cta: "Сотворить заклинание",
    placeholder:
      "Например: я мечтатель, обожаю ночное небо, всегда ищу приключения и немного хаоса…",
  },
};

function stripLabel(s: string): string {
  return s
    .replace(
      /^\s*(заклинание|название|spell|name|описание|description)\s*[:—–-]?\s*/i,
      "",
    )
    .replace(/^[*#"«»\s]+|[*#"«»\s]+$/g, "")
    .trim();
}

function parseSpell(raw: string): SpellResult {
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  let name = "";
  let description = "";

  if (lines.length >= 2) {
    name = stripLabel(lines[0]);
    description = stripLabel(lines.slice(1).join(" "));
  } else {
    let one = (lines[0] ?? raw).trim();
    one = one.replace(/^\s*(заклинание|название|spell|name)\s*[:—–-]\s*/i, "");

    const dash = one.search(/\s[—–-]\s/);
    const period = one.indexOf(". ");
    let idx = -1;
    let isDash = false;
    if (dash >= 0) {
      idx = dash;
      isDash = true;
    } else if (period >= 0) {
      idx = period;
    }

    if (idx >= 0) {
      name = one.slice(0, idx).trim();
      description = one
        .slice(isDash ? idx : idx + 1)
        .replace(/^\s*[—–-]\s*/, "")
        .trim();
    } else {
      name = one;
    }
    name = stripLabel(name);
    description = stripLabel(description);
  }

  // If the "name" is actually a long sentence, it's the whole answer.
  if (name.length > 60 && !description) {
    description = name;
    name = "Твоё заклинание";
  }

  return {
    name: name || "Заклинание",
    description: description || raw.trim(),
  };
}

function Index() {
  const [mode, setMode] = useState<Mode>("match");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SpellResult | null>(null);

  const meta = MODE_META[mode];

  async function castSpell() {
    const text = description.trim();
    if (text.length < 3) {
      toast.error("Опишите себя чуть подробнее.");
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/spell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: text, mode }),
      });
      const data = (await res.json()) as { result?: string; error?: string };
      if (!res.ok || !data.result) {
        toast.error(data.error ?? "Магия дала сбой. Попробуйте ещё раз.");
        return;
      }
      setResult(parseSpell(data.result));
    } catch {
      toast.error("Не удалось связаться с магической сетью.");
    } finally {
      setLoading(false);
    }
  }

  function switchMode(next: Mode) {
    if (next === mode) return;
    setMode(next);
    setResult(null);
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <StarfieldBackground count={44} />
      {/* Оживающая цветная аура во время колдовства и при появлении результата */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-1000 ease-out"
        style={{
          opacity: loading || result ? 1 : 0,
          background:
            "radial-gradient(ellipse 70% 55% at 50% 18%, color-mix(in oklab, var(--gold) 26%, transparent), transparent 62%), radial-gradient(ellipse 60% 55% at 18% 92%, color-mix(in oklab, var(--emerald) 24%, transparent), transparent 60%), radial-gradient(ellipse 60% 55% at 85% 88%, color-mix(in oklab, var(--burgundy) 26%, transparent), transparent 60%)",
          animation: loading ? "aura-pulse 2.4s ease-in-out infinite" : undefined,
        }}
      />
      <div className="relative z-10">
        <SiteHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-col items-center px-5 pb-16 pt-6 sm:pt-10">
        <motion.header
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-card/50 px-4 py-1.5 text-xs uppercase tracking-[0.25em] text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Школа чародейства
          </div>
          <h1 className="font-display text-4xl leading-tight text-primary text-glow-gold sm:text-5xl">
            Твоё заклинание
            <br />в Хогвартс
          </h1>
          <p className="mx-auto mt-4 max-w-md font-serif text-lg text-muted-foreground">
            Опиши себя и свой характер — а магия сама решит, какое заклинание
            принадлежит тебе.
          </p>
        </motion.header>

        {/* Mode switch */}
        <div className="mt-10 grid w-full grid-cols-2 gap-2 rounded-xl border border-gold/25 bg-card/40 p-1.5 backdrop-blur-sm">
          {(Object.keys(MODE_META) as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={cn(
                "relative rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                mode === m
                  ? "text-gold-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {mode === m && (
                <motion.span
                  layoutId="mode-pill"
                  className="absolute inset-0 rounded-lg bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-1.5">
                {m === "match" ? (
                  <Wand2 className="h-4 w-4" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {MODE_META[m].label}
              </span>
            </button>
          ))}
        </div>

        <p className="mt-3 text-center text-sm text-muted-foreground">{meta.hint}</p>

        {/* Input */}
        <div className="mt-5 w-full">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={meta.placeholder}
            maxLength={1500}
            rows={5}
            className="min-h-32 resize-none border-gold/30 bg-card/50 font-serif text-base backdrop-blur-sm placeholder:text-muted-foreground/70 focus-visible:ring-primary"
          />
          <div className="mt-1.5 text-right text-xs text-muted-foreground">
            {description.trim().length}/1500
          </div>

          <Button
            onClick={castSpell}
            disabled={loading}
            size="lg"
            className="mt-3 w-full bg-primary py-6 font-display text-base tracking-wide text-gold-foreground shadow-arcane transition-transform hover:bg-primary/90 hover:brightness-110 active:scale-[0.99]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Колдуем…
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-5 w-5" />
                {meta.cta}
              </>
            )}
          </Button>
        </div>

        {/* Result scroll */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key={result.name + result.description}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="mt-10 w-full rounded-2xl border border-gold/40 bg-card/70 p-7 text-center shadow-arcane backdrop-blur-md"
            >
              <div className="mb-4 inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
                <ScrollText className="h-4 w-4 text-primary" />
                {mode === "create" ? "Новое заклинание" : "Твоё заклинание"}
              </div>
              <h2 className="font-display text-3xl text-primary text-glow-gold sm:text-4xl">
                {result.name}
              </h2>
              <div className="mx-auto my-5 h-px w-24 bg-gradient-to-r from-transparent via-gold to-transparent" />
              <p className="mx-auto max-w-lg font-serif text-lg leading-relaxed text-foreground/90">
                {result.description}
              </p>
              <Button
                asChild
                variant="outline"
                className="mt-6 border-gold/40 font-display tracking-wide"
              >
                <Link
                  to="/library"
                  search={{ name: result.name, effect: result.description }}
                >
                  <BookOpen className="h-4 w-4" />
                  Опубликовать в библиотеку
                </Link>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="mt-auto pt-14 text-center text-xs text-muted-foreground/70">
          Магия работает на волшебстве ИИ ✦ мир «Гарри Поттера»
        </footer>
      </main>
      </div>
    </div>
  );
}