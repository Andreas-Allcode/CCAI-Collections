-- Add missing columns to portfolios table
ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(10,2) DEFAULT 0;
ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS asking_price DECIMAL(10,2) DEFAULT 0;