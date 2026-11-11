-- ==============================================================================
-- THE LAST SIGNAL: REALITY ERROR // SUPABASE CLOUD SAVE SCHEMA
-- Run this script in the Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Create table for player saves
CREATE TABLE IF NOT EXISTS public.game_saves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id TEXT NOT NULL UNIQUE,
    player_name TEXT NOT NULL DEFAULT 'Anonymous Operator',
    night_index INT NOT NULL DEFAULT 0,
    night_title TEXT NOT NULL DEFAULT 'NIGHT 1',
    save_data JSONB NOT NULL,
    achievements JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create index for fast lookups by player_id
CREATE INDEX IF NOT EXISTS idx_game_saves_player_id ON public.game_saves(player_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.game_saves ENABLE ROW LEVEL SECURITY;

-- 4. Create policies allowing public anon client to insert, select, and update
DROP POLICY IF EXISTS "Allow public read game_saves" ON public.game_saves;
CREATE POLICY "Allow public read game_saves"
ON public.game_saves
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow public upsert game_saves" ON public.game_saves;
CREATE POLICY "Allow public upsert game_saves"
ON public.game_saves
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update game_saves" ON public.game_saves;
CREATE POLICY "Allow public update game_saves"
ON public.game_saves
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 5. Auto-update updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_game_saves_updated ON public.game_saves;
CREATE TRIGGER on_game_saves_updated
    BEFORE UPDATE ON public.game_saves
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

-- Schema verification check
SELECT 'Schema successfully created! Ready for cloud saves.' AS status;
