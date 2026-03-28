-- Add one-time setup code for client account activation
ALTER TABLE clients ADD COLUMN IF NOT EXISTS setup_code TEXT UNIQUE;
