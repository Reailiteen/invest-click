-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Investor profiles policies
CREATE POLICY "Investors can view their own profile" ON public.investor_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Investors can update their own profile" ON public.investor_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Investors can insert their own profile" ON public.investor_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Startup profiles policies
CREATE POLICY "Startups can view their own profile" ON public.startup_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Startups can update their own profile" ON public.startup_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Startups can insert their own profile" ON public.startup_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Investors can view startup profiles" ON public.startup_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'investor'
    )
  );

-- Swipes policies
CREATE POLICY "Investors can view their own swipes" ON public.swipes
  FOR SELECT USING (auth.uid() = investor_id);

CREATE POLICY "Investors can create swipes" ON public.swipes
  FOR INSERT WITH CHECK (auth.uid() = investor_id);

CREATE POLICY "Startups can view swipes on them" ON public.swipes
  FOR SELECT USING (auth.uid() = startup_id);

-- Matches policies
CREATE POLICY "Users can view their matches" ON public.matches
  FOR SELECT USING (auth.uid() = investor_id OR auth.uid() = startup_id);

CREATE POLICY "System can create matches" ON public.matches
  FOR INSERT WITH CHECK (true);

-- Documents policies
CREATE POLICY "Users can view their own documents" ON public.documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upload documents" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" ON public.documents
  FOR DELETE USING (auth.uid() = user_id);

-- Contracts policies
CREATE POLICY "Contract parties can view contracts" ON public.contracts
  FOR SELECT USING (auth.uid() = investor_id OR auth.uid() = startup_id);

CREATE POLICY "Contract parties can create contracts" ON public.contracts
  FOR INSERT WITH CHECK (auth.uid() = investor_id OR auth.uid() = startup_id);

CREATE POLICY "Contract parties can update contracts" ON public.contracts
  FOR UPDATE USING (auth.uid() = investor_id OR auth.uid() = startup_id);

-- Contract history policies
CREATE POLICY "Contract parties can view history" ON public.contract_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.contracts 
      WHERE id = contract_id 
      AND (investor_id = auth.uid() OR startup_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert contract history" ON public.contract_history
  FOR INSERT WITH CHECK (auth.uid() = changed_by);

-- Notifications policies
CREATE POLICY "Users can view their notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Analytics policies
CREATE POLICY "Users can view their analytics" ON public.analytics_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create analytics" ON public.analytics_events
  FOR INSERT WITH CHECK (true);
