CREATE TABLE IF NOT EXISTS settings (
  id          INT PRIMARY KEY DEFAULT 1,
  status_text TEXT NOT NULL DEFAULT 'Open for work'
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON settings FOR SELECT USING (true);
CREATE POLICY "Owner update" ON settings FOR UPDATE USING (auth.uid()::text = current_setting('app.owner_id', true));
CREATE POLICY "Owner insert" ON settings FOR INSERT WITH CHECK (auth.uid()::text = current_setting('app.owner_id', true));

INSERT INTO settings (id, status_text) VALUES (1, 'Open for work') ON CONFLICT (id) DO NOTHING;

ALTER PUBLICATION supabase_realtime ADD TABLE settings;
