-- Add missing columns to portfolios table
ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS portfolio_category TEXT DEFAULT 'purchased';

-- Add missing columns to cases table  
ALTER TABLE cases ADD COLUMN IF NOT EXISTS face_value DECIMAL(10,2) DEFAULT 0;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';
ALTER TABLE cases ADD COLUMN IF NOT EXISTS scrub_method TEXT DEFAULT 'experian';