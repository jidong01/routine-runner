-- ============================================================
-- Migration: 001_initial_schema
-- Description: Initial schema for Routine Runner MVP
-- ============================================================

-- ============================================================
-- TABLES
-- ============================================================

-- 1. users
CREATE TABLE users (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at                TIMESTAMPTZ DEFAULT now(),
  run_start_km              NUMERIC(4,1) DEFAULT 1.0,
  rest_timer_default_sec    INTEGER DEFAULT 60
                              CHECK (rest_timer_default_sec IN (45, 60, 90)),
  pushup_program_level      INTEGER DEFAULT 1
                              CHECK (pushup_program_level BETWEEN 1 AND 7),
  pushup_program_start_date DATE,
  pushup_session_days       INTEGER[] DEFAULT '{1,3,5}'
  -- 1=Mon, 3=Wed, 5=Fri (ISO weekday)
);

-- 2. daily_records
CREATE TABLE daily_records (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  date             DATE NOT NULL,
  dopamine_status  TEXT CHECK (dopamine_status IN ('success', 'fail')),
  run_target_km    NUMERIC(4,1),
  run_actual_km    NUMERIC(4,1),
  run_completed    BOOLEAN DEFAULT false,
  pushup_week      INTEGER,
  pushup_session   INTEGER,
  pushup_completed BOOLEAN DEFAULT false,
  completed_count  INTEGER DEFAULT 0 CHECK (completed_count BETWEEN 0 AND 3),
  created_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- 3. pushup_set_records
CREATE TABLE pushup_set_records (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_record_id  UUID REFERENCES daily_records(id) ON DELETE CASCADE NOT NULL,
  set_index        INTEGER NOT NULL CHECK (set_index BETWEEN 1 AND 5),
  target_reps      INTEGER NOT NULL,
  completed        BOOLEAN DEFAULT false,
  completed_at     TIMESTAMPTZ,
  UNIQUE(daily_record_id, set_index)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_daily_records_user_date
  ON daily_records (user_id, date);

CREATE INDEX idx_pushup_set_records_daily_record
  ON pushup_set_records (daily_record_id);

-- ============================================================
-- FUNCTION: auto-calculate completed_count
-- ============================================================

CREATE OR REPLACE FUNCTION update_completed_count()
RETURNS TRIGGER AS $$
BEGIN
  NEW.completed_count := 0;
  IF NEW.dopamine_status = 'success' THEN
    NEW.completed_count := NEW.completed_count + 1;
  END IF;
  IF NEW.run_completed = true THEN
    NEW.completed_count := NEW.completed_count + 1;
  END IF;
  IF NEW.pushup_completed = true THEN
    NEW.completed_count := NEW.completed_count + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGER: daily_records completed_count auto-update
-- ============================================================

CREATE TRIGGER trg_update_completed_count
  BEFORE INSERT OR UPDATE OF dopamine_status, run_completed, pushup_completed
  ON daily_records
  FOR EACH ROW
  EXECUTE FUNCTION update_completed_count();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_records     ENABLE ROW LEVEL SECURITY;
ALTER TABLE pushup_set_records ENABLE ROW LEVEL SECURITY;

-- ---- users policies ----

CREATE POLICY "users: select own"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users: insert own"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users: update own"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ---- daily_records policies ----

CREATE POLICY "daily_records: select own"
  ON daily_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "daily_records: insert own"
  ON daily_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_records: update own"
  ON daily_records FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---- pushup_set_records policies ----

CREATE POLICY "pushup_set_records: select own"
  ON pushup_set_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM daily_records dr
      WHERE dr.id = pushup_set_records.daily_record_id
        AND dr.user_id = auth.uid()
    )
  );

CREATE POLICY "pushup_set_records: insert own"
  ON pushup_set_records FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_records dr
      WHERE dr.id = pushup_set_records.daily_record_id
        AND dr.user_id = auth.uid()
    )
  );

CREATE POLICY "pushup_set_records: update own"
  ON pushup_set_records FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM daily_records dr
      WHERE dr.id = pushup_set_records.daily_record_id
        AND dr.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_records dr
      WHERE dr.id = pushup_set_records.daily_record_id
        AND dr.user_id = auth.uid()
    )
  );
