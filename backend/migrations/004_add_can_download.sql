-- View-only accounts can read data but cannot export it.
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_download BOOLEAN DEFAULT false;
UPDATE users SET can_download = true WHERE is_admin = true;
