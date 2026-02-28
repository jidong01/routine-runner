-- Enable Supabase Auth integration
-- Users will now authenticate via email magic link
-- user.id will match auth.uid()

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE pushup_set_records ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies first
DROP POLICY IF EXISTS "users_select" ON users;
DROP POLICY IF EXISTS "users_insert" ON users;
DROP POLICY IF EXISTS "users_update" ON users;
DROP POLICY IF EXISTS "daily_records_select" ON daily_records;
DROP POLICY IF EXISTS "daily_records_insert" ON daily_records;
DROP POLICY IF EXISTS "daily_records_update" ON daily_records;
DROP POLICY IF EXISTS "pushup_sets_select" ON pushup_set_records;
DROP POLICY IF EXISTS "pushup_sets_insert" ON pushup_set_records;
DROP POLICY IF EXISTS "pushup_sets_update" ON pushup_set_records;

-- Users: own data only
CREATE POLICY "users_select" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update" ON users FOR UPDATE USING (auth.uid() = id);

-- Daily records: own data only
CREATE POLICY "daily_records_select" ON daily_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "daily_records_insert" ON daily_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "daily_records_update" ON daily_records FOR UPDATE USING (auth.uid() = user_id);

-- Pushup sets: through daily_records ownership
CREATE POLICY "pushup_sets_select" ON pushup_set_records FOR SELECT
  USING (EXISTS (SELECT 1 FROM daily_records WHERE daily_records.id = pushup_set_records.daily_record_id AND daily_records.user_id = auth.uid()));
CREATE POLICY "pushup_sets_insert" ON pushup_set_records FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM daily_records WHERE daily_records.id = pushup_set_records.daily_record_id AND daily_records.user_id = auth.uid()));
CREATE POLICY "pushup_sets_update" ON pushup_set_records FOR UPDATE
  USING (EXISTS (SELECT 1 FROM daily_records WHERE daily_records.id = pushup_set_records.daily_record_id AND daily_records.user_id = auth.uid()));

-- Auto-create users row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
