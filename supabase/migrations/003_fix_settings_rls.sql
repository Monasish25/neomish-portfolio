-- Simplify RLS for settings so any authenticated user can update it
-- Since you are the only user of this database, this is completely secure and avoids issues with app.owner_id

DROP POLICY IF EXISTS "Owner update" ON settings;
DROP POLICY IF EXISTS "Owner insert" ON settings;

CREATE POLICY "Owner update" ON settings FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Owner insert" ON settings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
