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
};

const SpellInput = z.object({
  name: z.string().trim().min(2, "Название слишком короткое").max(80),
  effect: z.string().trim().min(3, "Опишите действие подробнее").max(600),
});

export const listSpells = createServerFn({ method: "GET" }).handler(
  async (): Promise<SpellRow[]> => {
    const client = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );

    const { data, error } = await client
      .from("spells")
      .select("id,name,effect,author_name,user_id,created_at")
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) throw new Error(error.message);
    return data ?? [];
  },
);

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
    return row;
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
