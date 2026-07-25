-- ============================================================
-- SECURITY LOCKDOWN
-- Explicitly restrict all access to your specific email address
-- ============================================================

-- 1. Lock down PROJECTS table
DROP POLICY IF EXISTS "Owner insert" ON projects;
DROP POLICY IF EXISTS "Owner delete" ON projects;
DROP POLICY IF EXISTS "Owner update" ON projects;

CREATE POLICY "Owner insert" ON projects FOR INSERT WITH CHECK ((auth.jwt() ->> 'email') = 'monasish25@gmail.com');
CREATE POLICY "Owner delete" ON projects FOR DELETE USING ((auth.jwt() ->> 'email') = 'monasish25@gmail.com');
CREATE POLICY "Owner update" ON projects FOR UPDATE USING ((auth.jwt() ->> 'email') = 'monasish25@gmail.com');

-- 2. Lock down SETTINGS table
DROP POLICY IF EXISTS "Owner update" ON settings;
DROP POLICY IF EXISTS "Owner insert" ON settings;

CREATE POLICY "Owner update" ON settings FOR UPDATE USING ((auth.jwt() ->> 'email') = 'monasish25@gmail.com');
CREATE POLICY "Owner insert" ON settings FOR INSERT WITH CHECK ((auth.jwt() ->> 'email') = 'monasish25@gmail.com');

-- 3. Lock down ACTIVITY LOG table
DROP POLICY IF EXISTS "Owner access" ON activity_log;

CREATE POLICY "Owner access" ON activity_log FOR ALL USING ((auth.jwt() ->> 'email') = 'monasish25@gmail.com') WITH CHECK ((auth.jwt() ->> 'email') = 'monasish25@gmail.com');
