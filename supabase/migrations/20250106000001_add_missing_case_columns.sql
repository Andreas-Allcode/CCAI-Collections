-- Add missing columns to cases table
ALTER TABLE cases ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES vendors(id);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS updated_date TIMESTAMP DEFAULT now();

-- Update existing records to have updated_date
UPDATE cases SET updated_date = created_at WHERE updated_date IS NULL;