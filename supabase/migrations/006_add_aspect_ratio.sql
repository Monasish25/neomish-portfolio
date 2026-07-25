-- ============================================================
-- Supabase migration: Add aspect_ratio to projects
-- ============================================================

ALTER TABLE projects ADD COLUMN IF NOT EXISTS aspect_ratio TEXT DEFAULT '16:9';
