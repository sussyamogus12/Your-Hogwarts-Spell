CREATE TABLE public.spell_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  spell_id UUID NOT NULL REFERENCES public.spells(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  value SMALLINT NOT NULL CHECK (value IN (-1, 1)),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (spell_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.spell_votes TO authenticated;
GRANT SELECT ON public.spell_votes TO anon;
GRANT ALL ON public.spell_votes TO service_role;

ALTER TABLE public.spell_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Votes are viewable by everyone"
  ON public.spell_votes FOR SELECT USING (true);
CREATE POLICY "Users can insert their own votes"
  ON public.spell_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own votes"
  ON public.spell_votes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own votes"
  ON public.spell_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.spell_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  spell_id UUID NOT NULL REFERENCES public.spells(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (spell_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.spell_favorites TO authenticated;
GRANT SELECT ON public.spell_favorites TO anon;
GRANT ALL ON public.spell_favorites TO service_role;

ALTER TABLE public.spell_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Favorites are viewable by everyone"
  ON public.spell_favorites FOR SELECT USING (true);
CREATE POLICY "Users can insert their own favorites"
  ON public.spell_favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own favorites"
  ON public.spell_favorites FOR DELETE TO authenticated USING (auth.uid() = user_id);