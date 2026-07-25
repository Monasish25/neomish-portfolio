-- ============================================================
-- Supabase migration: projects table + RLS + realtime
-- ============================================================

CREATE TABLE IF NOT EXISTS projects (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title       TEXT NOT NULL,
  client      TEXT NOT NULL,
  cat         TEXT NOT NULL,
  role        TEXT NOT NULL,
  tools       TEXT NOT NULL,
  dur         TEXT NOT NULL,
  year        TEXT NOT NULL,
  blurb       TEXT NOT NULL,
  playback_id TEXT,          -- Mux playback ID for HLS streaming
  asset_id    TEXT,          -- Mux asset ID (needed for deletion)
  thumbnail   TEXT,          -- Mux thumbnail URL (auto-generated)
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Anyone can read (public site uses anon key)
CREATE POLICY "Public read access"
  ON projects FOR SELECT
  USING (true);

-- Only the owner can insert
-- Replace OWNER_UUID with the actual Supabase Auth user ID after signup
CREATE POLICY "Owner insert"
  ON projects FOR INSERT
  WITH CHECK (auth.uid()::text = current_setting('app.owner_id', true));

-- Only the owner can delete
CREATE POLICY "Owner delete"
  ON projects FOR DELETE
  USING (auth.uid()::text = current_setting('app.owner_id', true));

-- Only the owner can update
CREATE POLICY "Owner update"
  ON projects FOR UPDATE
  USING (auth.uid()::text = current_setting('app.owner_id', true));

-- ============================================================
-- Enable Realtime for this table
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE projects;

-- ============================================================
-- Seed data (the original 6 projects, no video yet)
-- ============================================================
INSERT INTO projects (title, client, cat, role, tools, dur, year, blurb) VALUES
  ('Static & Signal', 'Halcyon Records', 'Music Video', 'Edit, Color, VFX comp', 'Premiere · Resolve · AE', '3:24', '2026', 'Performance footage from four shoot days cut against a single continuous lighting rig malfunction as the narrative spine — the flicker sets the cut rate.'),
  ('Ninth Floor', 'Meridian Studios', 'Documentary', 'Assembly, Fine Cut, Sound', 'Avid · Pro Tools', '18:40', '2025', '47 hours of verité footage from a shuttering garment factory, cut down to eighteen minutes without narration — the ambient sound carries the argument.'),
  ('Field Notes Vol. 2', 'Departure Co.', 'Commercial', 'Edit, Grade, Delivery', 'Resolve · After Effects', '0:45', '2026', 'A 45-second spot built entirely from a single handheld oner, re-timed and split into five apparent cuts using speed ramps and whip pans.'),
  ('Low Tide', 'Self-initiated', 'Short Film', 'Full post-production', 'Premiere · DaVinci · Fairlight', '9:12', '2025', 'A dialogue-free short cut on the tide tables of a single beach over one calendar year, structured around six real high-tide timestamps.'),
  ('Counter Service', 'Bloom & Ash', 'Social Cuts', 'Edit, Motion Graphics', 'Premiere · AE', '0:28', '2026', 'A batch of eleven vertical cutdowns from one café shoot, each built around a different customer sound-bite as the cold open.'),
  ('Signal Loss', 'Rearview Films', 'Music Video', 'Edit, Color', 'Resolve · AE', '4:02', '2025', 'Analog camcorder inserts intercut with 8K masters, graded to match a single degraded VHS reference tape shot in 1997.');
