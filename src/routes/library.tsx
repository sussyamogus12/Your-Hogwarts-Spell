import { createFileRoute, Link } from "@tanstack/react-router";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Loader2,
  LogIn,
  Plus,
  ScrollText,
  Search,
  Sparkles,
  Star,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

import {
  createSpell,
  deleteSpell,
  getMyReactions,
  listSpells,
  toggleFavorite,
  voteSpell,
  type MyReactions,
  type SpellRow,
} from "@/lib/spells.functions";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { StarfieldBackground } from "@/components/StarfieldBackground";
import { SiteHeader } from "@/components/SiteHeader";

const spellsQuery = queryOptions({
  queryKey: ["spells"],
  queryFn: () => listSpells(),
});

export const Route = createFileRoute("/library")({
  validateSearch: (search: Record<string, unknown>) => ({
    name: typeof search.name === "string" ? search.name : undefined,
    effect: typeof search.effect === "string" ? search.effect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Библиотека заклинаний — Хогвартс" },
      {
        name: "description",
        content:
          "Общая библиотека заклинаний: смотрите чужие волшебные формулы и их действие, ставьте оценки, добавляйте в избранное и выкладывайте свои.",
      },
      { property: "og:title", content: "Библиотека заклинаний — Хогвартс" },
      {
        property: "og:description",
        content: "Заклинания, придуманные волшебниками со всего мира, и их действие.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(spellsQuery),
  component: LibraryPage,
  errorComponent: ({ error }) => (
    <div className="p-10 text-center text-muted-foreground">{error.message}</div>
  ),
});

function LibraryPage() {
  const { data: spells } = useSuspenseQuery(spellsQuery);
  const { user } = useAuth();

  const reactionsQuery = useQuery({
    queryKey: ["my-reactions", user?.id],
    queryFn: () => getMyReactions(),
    enabled: Boolean(user),
  });
  const reactions: MyReactions = reactionsQuery.data ?? { votes: {}, favorites: [] };
  const favoriteSet = useMemo(() => new Set(reactions.favorites), [reactions.favorites]);

  const search = Route.useSearch();
  const [formOpen, setFormOpen] = useState(Boolean(search.name || search.effect));
  const [query, setQuery] = useState("");
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const visibleSpells = useMemo(() => {
    const q = query.trim().toLowerCase();
    return spells.filter((s) => {
      if (onlyFavorites && !favoriteSet.has(s.id)) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) || s.effect.toLowerCase().includes(q)
      );
    });
  }, [spells, query, onlyFavorites, favoriteSet]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <StarfieldBackground count={50} />
      <div className="relative z-10">
        <SiteHeader />

        <main className="mx-auto w-full max-w-3xl px-5 pb-20 pt-6">
          <motion.header
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-card/50 px-4 py-1.5 text-xs uppercase tracking-[0.25em] text-primary">
              <BookOpen className="h-3.5 w-3.5" />
              Общая библиотека
            </div>
            <h1 className="font-display text-4xl text-primary text-glow-gold sm:text-5xl">
              Библиотека заклинаний
            </h1>
            <p className="mx-auto mt-4 max-w-lg font-serif text-lg text-muted-foreground">
              Заклинания, придуманные волшебниками со всего мира. Загляни — и добавь своё.
            </p>
          </motion.header>

          <div className="mt-8">
            {user ? (
              <AddSpellSection
                open={formOpen}
                setOpen={setFormOpen}
                initialName={search.name ?? ""}
                initialEffect={search.effect ?? ""}
              />
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-gold/25 bg-card/40 p-6 text-center backdrop-blur-sm sm:flex-row sm:justify-between sm:text-left">
                <p className="font-serif text-muted-foreground">
                  Войдите, чтобы выложить своё заклинание в библиотеку.
                </p>
                <Button asChild className="bg-primary text-gold-foreground">
                  <Link to="/auth">
                    <LogIn className="h-4 w-4" />
                    Войти
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Поиск и фильтры */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск по названию или описанию…"
                className="border-gold/30 bg-card/50 pl-9 font-serif backdrop-blur-sm"
              />
            </div>
            <div className="flex rounded-lg border border-gold/25 bg-card/40 p-1 backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setOnlyFavorites(false)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  !onlyFavorites
                    ? "bg-primary text-gold-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Все
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    toast.error("Войдите, чтобы видеть избранное.");
                    return;
                  }
                  setOnlyFavorites(true);
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  onlyFavorites
                    ? "bg-primary text-gold-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Star className="h-3.5 w-3.5" />
                Избранное
              </button>
            </div>
          </div>

          <div className="mt-8">
            {visibleSpells.length === 0 ? (
              <div className="rounded-xl border border-gold/25 bg-card/40 p-10 text-center text-muted-foreground backdrop-blur-sm">
                {spells.length === 0
                  ? "Пока пусто. Стань первым, кто добавит заклинание!"
                  : onlyFavorites
                    ? "В избранном пока ничего нет."
                    : "Ничего не найдено по вашему запросу."}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <AnimatePresence>
                  {visibleSpells.map((spell) => (
                    <SpellCard
                      key={spell.id}
                      spell={spell}
                      isOwner={user?.id === spell.user_id}
                      signedIn={Boolean(user)}
                      myVote={reactions.votes[spell.id] ?? 0}
                      favorited={favoriteSet.has(spell.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function AddSpellSection({
  open,
  setOpen,
  initialName,
  initialEffect,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  initialName: string;
  initialEffect: string;
}) {
  const queryClient = useQueryClient();
  const createFn = useServerFn(createSpell);
  const [name, setName] = useState(initialName);
  const [effect, setEffect] = useState(initialEffect);

  const mutation = useMutation({
    mutationFn: (input: { name: string; effect: string }) => createFn({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spells"] });
      toast.success("Заклинание добавлено в библиотеку!");
      setName("");
      setEffect("");
      setOpen(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Не удалось добавить."),
  });

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        className="w-full bg-primary py-5 font-display tracking-wide text-gold-foreground"
      >
        <Plus className="h-5 w-5" />
        Добавить своё заклинание
      </Button>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim().length < 2) return toast.error("Название слишком короткое.");
        if (effect.trim().length < 3) return toast.error("Опишите действие заклинания.");
        mutation.mutate({ name: name.trim(), effect: effect.trim() });
      }}
      className="space-y-4 rounded-2xl border border-gold/30 bg-card/70 p-6 shadow-arcane backdrop-blur-md"
    >
      <div className="space-y-1.5">
        <Label htmlFor="spell-name">Название заклинания</Label>
        <Input
          id="spell-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Например: Люмос"
          maxLength={80}
          className="border-gold/30 bg-card/50 font-display"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="spell-effect">Что делает заклинание</Label>
        <Textarea
          id="spell-effect"
          value={effect}
          onChange={(e) => setEffect(e.target.value)}
          placeholder="Опишите действие: зажигает свет на кончике палочки, освещая путь в темноте…"
          maxLength={600}
          rows={4}
          className="resize-none border-gold/30 bg-card/50 font-serif"
        />
      </div>
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={mutation.isPending}
          className="flex-1 bg-primary font-display text-gold-foreground"
        >
          {mutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="h-4 w-4" />
          )}
          Опубликовать
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-gold/30">
          Отмена
        </Button>
      </div>
    </motion.form>
  );
}

function SpellCard({
  spell,
  isOwner,
  signedIn,
  myVote,
  favorited,
}: {
  spell: SpellRow;
  isOwner: boolean;
  signedIn: boolean;
  myVote: 1 | -1 | 0;
  favorited: boolean;
}) {
  const queryClient = useQueryClient();
  const deleteFn = useServerFn(deleteSpell);
  const voteFn = useServerFn(voteSpell);
  const favoriteFn = useServerFn(toggleFavorite);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["spells"] });
    queryClient.invalidateQueries({ queryKey: ["my-reactions"] });
  }

  const del = useMutation({
    mutationFn: () => deleteFn({ data: { id: spell.id } }),
    onSuccess: () => {
      invalidate();
      toast.success("Заклинание удалено.");
    },
    onError: () => toast.error("Не удалось удалить."),
  });

  const vote = useMutation({
    mutationFn: (value: 1 | -1) => voteFn({ data: { spellId: spell.id, value } }),
    onSuccess: invalidate,
    onError: () => toast.error("Не удалось оценить."),
  });

  const fav = useMutation({
    mutationFn: () => favoriteFn({ data: { spellId: spell.id } }),
    onSuccess: invalidate,
    onError: () => toast.error("Не удалось изменить избранное."),
  });

  function requireAuth(): boolean {
    if (!signedIn) {
      toast.error("Войдите, чтобы оценивать заклинания.");
      return false;
    }
    return true;
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col rounded-2xl border border-gold/30 bg-card/60 p-5 shadow-arcane backdrop-blur-md"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 text-primary">
          <ScrollText className="h-4 w-4" />
          <h2 className="font-display text-xl text-glow-gold">{spell.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => requireAuth() && fav.mutate()}
            disabled={fav.isPending}
            className={cn(
              "transition-colors",
              favorited
                ? "text-primary"
                : "text-muted-foreground/70 hover:text-primary",
            )}
            aria-label={favorited ? "Убрать из избранного" : "В избранное"}
          >
            <Star className={cn("h-4 w-4", favorited && "fill-current")} />
          </button>
          {isOwner && (
            <button
              type="button"
              onClick={() => del.mutate()}
              disabled={del.isPending}
              className="text-muted-foreground/70 transition-colors hover:text-destructive"
              aria-label="Удалить заклинание"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <p className="flex-1 font-serif text-base leading-relaxed text-foreground/90">
        {spell.effect}
      </p>

      <div className="mt-4 flex items-center gap-3 border-t border-gold/15 pt-3">
        <button
          type="button"
          onClick={() => requireAuth() && vote.mutate(1)}
          disabled={vote.isPending}
          className={cn(
            "inline-flex items-center gap-1 text-sm transition-colors",
            myVote === 1
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-label="Нравится"
        >
          <ThumbsUp className={cn("h-4 w-4", myVote === 1 && "fill-current")} />
          {spell.likes}
        </button>
        <button
          type="button"
          onClick={() => requireAuth() && vote.mutate(-1)}
          disabled={vote.isPending}
          className={cn(
            "inline-flex items-center gap-1 text-sm transition-colors",
            myVote === -1
              ? "text-destructive"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-label="Не нравится"
        >
          <ThumbsDown className={cn("h-4 w-4", myVote === -1 && "fill-current")} />
          {spell.dislikes}
        </button>
        <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" />
          {spell.author_name}
        </span>
      </div>
    </motion.article>
  );
}
