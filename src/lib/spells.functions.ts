import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type SpellRow = {
  id: string;
  name: string;
  effect: string;
  author_name: string;
  user_id: string;
  created_at: string;
  likes: number;
  dislikes: number;
  score: number;
};

export type MyReactions = {
  votes: Record<string, 1 | -1>;
  favorites: string[];
};

const SpellInput = z.object({
  name: z.string().trim().min(2, "Название слишком короткое").max(80),
  effect: z.string().trim().min(3, "Опишите действие подробнее").max(600),
});

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const listSpells = createServerFn({ method: "GET" }).handler(
  async (): Promise<SpellRow[]> => {
    const client = publicClient();

    const [spellsRes, votesRes] = await Promise.all([
      client
        .from("spells")
        .select("id,name,effect,author_name,user_id,created_at")
        .limit(300),
      client.from("spell_votes").select("spell_id,value"),
    ]);

    if (spellsRes.error) throw new Error(spellsRes.error.message);
    if (votesRes.error) throw new Error(votesRes.error.message);

    const likes = new Map<string, number>();
    const dislikes = new Map<string, number>();
    for (const v of votesRes.data ?? []) {
      if (v.value === 1) likes.set(v.spell_id, (likes.get(v.spell_id) ?? 0) + 1);
      else if (v.value === -1)
        dislikes.set(v.spell_id, (dislikes.get(v.spell_id) ?? 0) + 1);
    }

    const rows: SpellRow[] = (spellsRes.data ?? []).map((s) => {
      const l = likes.get(s.id) ?? 0;
      const d = dislikes.get(s.id) ?? 0;
      return { ...s, likes: l, dislikes: d, score: l - d };
    });

    // Сначала заклинания с лучшим рейтингом, затем более свежие.
    rows.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.created_at.localeCompare(a.created_at);
    });

    return rows;
  },
);

export const getMyReactions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyReactions> => {
    const { supabase, userId } = context;

    const [votesRes, favRes] = await Promise.all([
      supabase.from("spell_votes").select("spell_id,value").eq("user_id", userId),
      supabase.from("spell_favorites").select("spell_id").eq("user_id", userId),
    ]);

    if (votesRes.error) throw new Error(votesRes.error.message);
    if (favRes.error) throw new Error(favRes.error.message);

    const votes: Record<string, 1 | -1> = {};
    for (const v of votesRes.data ?? []) {
      votes[v.spell_id] = v.value === 1 ? 1 : -1;
    }

    return {
      votes,
      favorites: (favRes.data ?? []).map((f) => f.spell_id),
    };
  });

export const createSpell = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => SpellInput.parse(data))
  .handler(async ({ data, context }): Promise<SpellRow> => {
    const { supabase, userId } = context;

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", userId)
      .maybeSingle();

    const authorName = profile?.display_name?.trim() || "Волшебник";

    const { data: row, error } = await supabase
      .from("spells")
      .insert({
        user_id: userId,
        author_name: authorName,
        name: data.name,
        effect: data.effect,
      })
      .select("id,name,effect,author_name,user_id,created_at")
      .single();

    if (error) throw new Error(error.message);
    return { ...row, likes: 0, dislikes: 0, score: 0 };
  });

export const deleteSpell = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("spells")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const voteSpell = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({ spellId: z.string().uuid(), value: z.union([z.literal(1), z.literal(-1)]) })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: existing } = await supabase
      .from("spell_votes")
      .select("id,value")
      .eq("spell_id", data.spellId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      if (existing.value === data.value) {
        // Повторный клик по той же кнопке снимает голос.
        const { error } = await supabase
          .from("spell_votes")
          .delete()
          .eq("id", existing.id);
        if (error) throw new Error(error.message);
        return { ok: true, value: 0 };
      }
      const { error } = await supabase
        .from("spell_votes")
        .update({ value: data.value })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { ok: true, value: data.value };
    }

    const { error } = await supabase
      .from("spell_votes")
      .insert({ spell_id: data.spellId, user_id: userId, value: data.value });
    if (error) throw new Error(error.message);
    return { ok: true, value: data.value };
  });

export const toggleFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ spellId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: existing } = await supabase
      .from("spell_favorites")
      .select("id")
      .eq("spell_id", data.spellId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("spell_favorites")
        .delete()
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { ok: true, favorited: false };
    }

    const { error } = await supabase
      .from("spell_favorites")
      .insert({ spell_id: data.spellId, user_id: userId });
    if (error) throw new Error(error.message);
    return { ok: true, favorited: true };
  });
