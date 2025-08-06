-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUM DEFINITIONS
CREATE TYPE portfolio_type AS ENUM ('committed', 'spec');
CREATE TYPE portfolio_status AS ENUM ('active', 'completed', 'transferred', 'inactive');
CREATE TYPE case_status AS ENUM (
  'new', 'in_collection', 'payment_plan', 'paid', 'settled', 'legal_action',
  'credit_reporting', 'uncollectible', 'disputed', 'deceased', 'bankruptcy',
  'military', 'buyback'
);
CREATE TYPE case_priority AS ENUM ('high', 'medium', 'low');
CREATE TYPE bankruptcy_chapter AS ENUM ('7', '11', '13', 'other');
CREATE TYPE bankruptcy_status AS ENUM ('filed', 'discharged', 'dismissed', 'pending');
CREATE TYPE legal_status_enum AS ENUM (
  'pending_review', 'pre_litigation', 'filed',
  'judgment_awarded', 'settled_in_court', 'dismissed'
);
CREATE TYPE payment_method_enum AS ENUM (
  'credit_card', 'ach', 'check', 'money_order', 'wire', 'cash'
);
CREATE TYPE payment_status_enum AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE payment_plan_frequency AS ENUM ('weekly', 'bi-weekly', 'monthly');
CREATE TYPE payment_plan_status AS ENUM ('active', 'completed', 'defaulted', 'cancelled');
CREATE TYPE communication_type AS ENUM ('email', 'sms', 'letter', 'call', 'portal_message');
CREATE TYPE communication_direction AS ENUM ('outbound', 'inbound');
CREATE TYPE delivery_status_enum AS ENUM ('pending', 'delivered', 'failed', 'bounced', 'opened', 'clicked');
CREATE TYPE template_type AS ENUM ('email', 'sms', 'letter');
CREATE TYPE template_status AS ENUM ('draft', 'active', 'archived');
CREATE TYPE vendor_type AS ENUM (
  'law_firm', 'collection_agency', 'service_provider',
  'technology', 'financial', 'debt_buyer', 'debt_seller', 'other'
);
CREATE TYPE vendor_status AS ENUM ('active', 'inactive', 'pending');
CREATE TYPE integration_type AS ENUM ('sftp');
CREATE TYPE integration_status AS ENUM ('configured', 'unconfigured', 'error');
CREATE TYPE dispute_type_enum AS ENUM (
  'not_mine', 'incorrect_amount', 'already_paid',
  'identity_theft', 'bankruptcy', 'other'
);
CREATE TYPE dispute_status_enum AS ENUM (
  'submitted', 'under_review', 'approved',
  'denied', 'requires_documentation'
);
CREATE TYPE settlement_terms_enum AS ENUM ('lump_sum', 'short_term_plan');
CREATE TYPE settlement_status_enum AS ENUM (
  'pending', 'accepted', 'rejected', 'expired', 'countered'
);
CREATE TYPE activity_type_enum AS ENUM (
  'debt_validation_sent', 'data_scrub_completed', 'status_change',
  'payment_received', 'communication_sent', 'legal_action_initiated',
  'settlement_negotiated', 'dispute_filed', 'note_added'
);
CREATE TYPE preferred_contact_time_enum AS ENUM ('morning', 'afternoon', 'evening');

-- TABLE DEFINITIONS

-- Debtors
CREATE TABLE debtors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  ssn_last4 TEXT,
  dob DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Portfolios
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  client TEXT NOT NULL,
  original_creditor TEXT,
  original_creditor_address TEXT,
  portfolio_type portfolio_type NOT NULL,
  litigation_eligible BOOLEAN DEFAULT true,
  purchase_date DATE,
  purchase_amount NUMERIC,
  total_face_value NUMERIC,
  account_count INTEGER,
  status portfolio_status DEFAULT 'active',
  charge_off_range_start DATE,
  charge_off_range_end DATE,
  average_balance NUMERIC,
  median_balance NUMERIC,
  state_distribution JSONB,
  initial_bankruptcy_rate NUMERIC,
  initial_deceased_rate NUMERIC,
  performance_benchmark NUMERIC,
  created_at TIMESTAMP DEFAULT now()
);

-- Cases
CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
  debtor_id UUID REFERENCES debtors(id),
  debtor_name TEXT,
  debtor_email TEXT,
  debtor_phone TEXT,
  debtor_address TEXT,
  account_number TEXT,
  original_creditor TEXT,
  original_creditor_address TEXT,
  original_balance NUMERIC NOT NULL,
  current_balance NUMERIC NOT NULL,
  last_payment_date DATE,
  charge_off_date DATE,
  status case_status DEFAULT 'new',
  priority case_priority DEFAULT 'medium',
  assigned_to UUID,
  last_contact_date DATE,
  next_action_date DATE,
  settlement_offer NUMERIC,
  notes TEXT,
  bankruptcy_details JSONB,
  deceased_details JSONB,
  legal_details JSONB,
  created_at TIMESTAMP DEFAULT now()
);

-- Payment Plans
CREATE TABLE payment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  total_amount NUMERIC NOT NULL,
  monthly_payment NUMERIC NOT NULL,
  frequency payment_plan_frequency DEFAULT 'monthly',
  start_date DATE NOT NULL,
  end_date DATE,
  status payment_plan_status DEFAULT 'active',
  payment_method payment_method_enum,
  auto_pay BOOLEAN DEFAULT false,
  payments_made INTEGER DEFAULT 0,
  amount_paid NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_method payment_method_enum NOT NULL,
  payment_date DATE,
  transaction_id TEXT,
  payment_plan_id UUID REFERENCES payment_plans(id),
  status payment_status_enum DEFAULT 'pending',
  processed_by UUID,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Communications
CREATE TABLE communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  type communication_type NOT NULL,
  direction communication_direction NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  template_used TEXT,
  sent_date TIMESTAMPTZ,
  delivery_status delivery_status_enum DEFAULT 'pending',
  sent_by UUID,
  response_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

-- Templates
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type template_type NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  status template_status DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT now()
);

-- Company Profile
CREATE TABLE company_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- App Settings
CREATE TABLE app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ccai_base_url TEXT DEFAULT 'https://core.cloudcontactai.com',
  ccai_sms_endpoint TEXT DEFAULT '/api/sms/send',
  ccai_email_endpoint TEXT DEFAULT '/api/email/send',
  created_at TIMESTAMP DEFAULT now()
);

-- Vendors
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type vendor_type DEFAULT 'other' NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  website TEXT,
  status vendor_status DEFAULT 'active',
  contract_start_date DATE,
  contract_end_date DATE,
  services TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Import Templates
CREATE TABLE import_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  target_entity TEXT NOT NULL,
  mapping JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Integrations
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  type integration_type DEFAULT 'sftp',
  hostname TEXT NOT NULL,
  port INTEGER DEFAULT 22,
  username TEXT NOT NULL,
  password TEXT,
  status integration_status DEFAULT 'unconfigured',
  last_checked TIMESTAMPTZ,
  created_at TIMESTAMP DEFAULT now()
);

-- Payment Configuration
CREATE TABLE payment_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_tier_min NUMERIC NOT NULL,
  debt_tier_max NUMERIC NOT NULL,
  min_payment_percentage NUMERIC NOT NULL,
  min_payment_amount NUMERIC,
  max_term_months INTEGER NOT NULL,
  weekly_available BOOLEAN DEFAULT true,
  monthly_available BOOLEAN DEFAULT true,
  settlement_percentage_min NUMERIC,
  settlement_percentage_max NUMERIC,
  created_at TIMESTAMP DEFAULT now()
);

-- Debtor Portal Sessions
CREATE TABLE debtor_portal_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_accessed TIMESTAMPTZ,
  communication_preferences JSONB,
  created_at TIMESTAMP DEFAULT now()
);

-- Disputes (continued)
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  dispute_type dispute_type_enum NOT NULL,
  description TEXT NOT NULL,
  supporting_documents TEXT[],
  status dispute_status_enum DEFAULT 'submitted',
  submitted_by_debtor BOOLEAN DEFAULT true,
  resolution_notes TEXT,
  resolved_date DATE,
  created_at TIMESTAMP DEFAULT now()
);

-- Settlement Offers
CREATE TABLE settlement_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  offer_amount NUMERIC NOT NULL,
  offer_percentage NUMERIC,
  payment_terms settlement_terms_enum,
  expires_at TIMESTAMPTZ NOT NULL,
  status settlement_status_enum DEFAULT 'pending',
  submitted_by_debtor BOOLEAN DEFAULT true,
  counter_offer_amount NUMERIC,
  response_notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Activity Logs
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  activity_type activity_type_enum NOT NULL,
  description TEXT NOT NULL,
  performed_by UUID NOT NULL,
  activity_date TIMESTAMPTZ DEFAULT now(),
  metadata TEXT,
  created_at TIMESTAMP DEFAULT now()
);
