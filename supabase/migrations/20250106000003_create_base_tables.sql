-- Create portfolios table
CREATE TABLE IF NOT EXISTS portfolios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    client TEXT,
    original_creditor TEXT,
    portfolio_type TEXT DEFAULT 'spec',
    portfolio_category TEXT DEFAULT 'purchased',
    litigation_eligible BOOLEAN DEFAULT false,
    account_count INTEGER DEFAULT 0,
    total_face_value DECIMAL(10,2) DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create debtors table
CREATE TABLE IF NOT EXISTS debtors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cases table
CREATE TABLE IF NOT EXISTS cases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    portfolio_id UUID REFERENCES portfolios(id),
    debtor_id UUID REFERENCES debtors(id),
    debtor_name TEXT,
    account_number TEXT,
    original_balance DECIMAL(10,2) DEFAULT 0,
    current_balance DECIMAL(10,2) DEFAULT 0,
    face_value DECIMAL(10,2) DEFAULT 0,
    original_creditor TEXT,
    charge_off_date TEXT,
    last_payment_date TEXT,
    status TEXT DEFAULT 'new',
    priority TEXT DEFAULT 'medium',
    scrub_method TEXT DEFAULT 'experian',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);