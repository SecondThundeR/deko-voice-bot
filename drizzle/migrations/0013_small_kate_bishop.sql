-- Enabling pg_trgm if it is not enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Drizzle's migration
CREATE INDEX "voices_title_trgm_idx" ON "voices" USING gin ("voice_title" gin_trgm_ops);
