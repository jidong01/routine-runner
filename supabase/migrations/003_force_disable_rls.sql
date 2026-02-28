-- Force disable RLS and add permissive policies for anon access
-- The MVP uses localStorage user IDs without Supabase Auth

-- Disable RLS entirely
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE pushup_set_records DISABLE ROW LEVEL SECURITY;

-- Also grant full access to anon and authenticated roles just in case
GRANT ALL ON users TO anon;
GRANT ALL ON users TO authenticated;
GRANT ALL ON daily_records TO anon;
GRANT ALL ON daily_records TO authenticated;
GRANT ALL ON pushup_set_records TO anon;
GRANT ALL ON pushup_set_records TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
