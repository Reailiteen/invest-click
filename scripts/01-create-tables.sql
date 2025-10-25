-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('investor', 'startup')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Investor profiles
CREATE TABLE IF NOT EXISTS public.investor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  company_name TEXT,
  title TEXT,
  bio TEXT,
  profile_image_url TEXT,
  location TEXT,
  linkedin_url TEXT,
  website_url TEXT,
  
  -- Investment preferences
  investment_stage TEXT[] DEFAULT '{}', -- seed, series_a, series_b, series_c, growth
  preferred_sectors TEXT[] DEFAULT '{}',
  ticket_size_min DECIMAL(15, 2),
  ticket_size_max DECIMAL(15, 2),
  geographic_focus TEXT[] DEFAULT '{}',
  investment_type TEXT[] DEFAULT '{}', -- equity, convertible_note, safe
  
  -- Portfolio
  portfolio_companies TEXT[] DEFAULT '{}',
  total_investments INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Startup profiles
CREATE TABLE IF NOT EXISTS public.startup_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  linkedin_url TEXT,
  location TEXT,
  founded_year INTEGER,
  team_size INTEGER,
  
  -- Funding details
  funding_stage TEXT, -- pre_seed, seed, series_a, series_b, series_c, growth
  funding_goal DECIMAL(15, 2),
  current_valuation DECIMAL(15, 2),
  previous_funding DECIMAL(15, 2),
  
  -- Business details
  sector TEXT,
  business_model TEXT, -- b2b, b2c, b2b2c, marketplace
  revenue_model TEXT,
  monthly_revenue DECIMAL(15, 2),
  monthly_growth_rate DECIMAL(5, 2),
  
  -- Traction
  customer_count INTEGER,
  key_metrics JSONB DEFAULT '{}',
  
  -- AI scoring
  ai_score DECIMAL(3, 2), -- 0.00 to 1.00
  ai_score_breakdown JSONB DEFAULT '{}',
  last_scored_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Swipes table (tracks all swipe actions)
CREATE TABLE IF NOT EXISTS public.swipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  startup_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('left', 'right')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(investor_id, startup_id)
);

-- Matches table (mutual interest)
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  startup_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  matched_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(investor_id, startup_id)
);

-- Documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- pitch_deck, financial_statement, term_sheet, contract, other
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contracts table
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  investor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  startup_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Contract terms
  investment_amount DECIMAL(15, 2) NOT NULL,
  valuation DECIMAL(15, 2),
  equity_percentage DECIMAL(5, 2),
  investment_type TEXT NOT NULL, -- equity, convertible_note, safe
  terms JSONB DEFAULT '{}',
  
  -- Status tracking
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'proposed', 'negotiating', 'accepted', 'rejected', 'expired')),
  proposed_by UUID REFERENCES public.users(id),
  version INTEGER DEFAULT 1,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contract history (for tracking negotiations)
CREATE TABLE IF NOT EXISTS public.contract_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES public.users(id),
  changes JSONB NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- match, contract_proposal, contract_update, message
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics events table
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_swipes_investor ON public.swipes(investor_id);
CREATE INDEX IF NOT EXISTS idx_swipes_startup ON public.swipes(startup_id);
CREATE INDEX IF NOT EXISTS idx_matches_investor ON public.matches(investor_id);
CREATE INDEX IF NOT EXISTS idx_matches_startup ON public.matches(startup_id);
CREATE INDEX IF NOT EXISTS idx_contracts_match ON public.contracts(match_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_documents_user ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON public.analytics_events(event_type);
