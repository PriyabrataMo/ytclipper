-- +goose Up
-- +goose StatementBegin

-- Add OTP columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS otp VARCHAR(6),
ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS otp_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create index for OTP lookups
CREATE INDEX IF NOT EXISTS idx_users_otp ON users(otp) WHERE otp IS NOT NULL;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

-- Drop OTP index
DROP INDEX IF EXISTS idx_users_otp;

-- Remove OTP columns from users table
ALTER TABLE users 
DROP COLUMN IF EXISTS otp,
DROP COLUMN IF EXISTS otp_expires_at,
DROP COLUMN IF EXISTS otp_created_at;

-- +goose StatementEnd
