-- Disable RLS for MVP (no Supabase Auth, using localStorage user IDs)
-- This is acceptable for a single-user MVP app

-- Drop existing policies
DROP POLICY IF EXISTS "users: select own" ON users;
DROP POLICY IF EXISTS "users: insert own" ON users;
DROP POLICY IF EXISTS "users: update own" ON users;
DROP POLICY IF EXISTS "daily_records: select own" ON daily_records;
DROP POLICY IF EXISTS "daily_records: insert own" ON daily_records;
DROP POLICY IF EXISTS "daily_records: update own" ON daily_records;
DROP POLICY IF EXISTS "pushup_set_records: select own" ON pushup_set_records;
DROP POLICY IF EXISTS "pushup_set_records: insert own" ON pushup_set_records;
DROP POLICY IF EXISTS "pushup_set_records: update own" ON pushup_set_records;

-- Disable RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE pushup_set_records DISABLE ROW LEVEL SECURITY;
