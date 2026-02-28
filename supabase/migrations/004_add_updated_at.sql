-- Add updated_at column to daily_records to fix trigger error
-- Supabase moddatetime extension expects this column

-- Enable moddatetime extension
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

-- Add updated_at column
ALTER TABLE daily_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE pushup_set_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Drop any existing moddatetime triggers that might be causing the issue
DROP TRIGGER IF EXISTS handle_updated_at ON daily_records;
DROP TRIGGER IF EXISTS handle_updated_at ON users;
DROP TRIGGER IF EXISTS handle_updated_at ON pushup_set_records;

-- Create moddatetime triggers
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON daily_records
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime(updated_at);

CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON pushup_set_records
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime(updated_at);
