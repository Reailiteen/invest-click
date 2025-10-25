-- Insert dummy investor users
INSERT INTO auth.users (id, email) VALUES
  ('11111111-1111-1111-1111-111111111111', 'investor1@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'investor2@example.com'),
  ('33333333-3333-3333-3333-333333333333', 'investor3@example.com')
ON CONFLICT (id) DO NOTHING;

-- Insert dummy startup users
INSERT INTO auth.users (id, email) VALUES
  ('44444444-4444-4444-4444-444444444444', 'startup1@example.com'),
  ('55555555-5555-5555-5555-555555555555', 'startup2@example.com'),
  ('66666666-6666-6666-6666-666666666666', 'startup3@example.com')
ON CONFLICT (id) DO NOTHING;

-- Insert user records
INSERT INTO public.users (id, email, role, onboarding_completed) VALUES
  ('11111111-1111-1111-1111-111111111111', 'investor1@example.com', 'investor', true),
  ('22222222-2222-2222-2222-222222222222', 'investor2@example.com', 'investor', true),
  ('33333333-3333-3333-3333-333333333333', 'investor3@example.com', 'investor', true),
  ('44444444-4444-4444-4444-444444444444', 'startup1@example.com', 'startup', true),
  ('55555555-5555-5555-5555-555555555555', 'startup2@example.com', 'startup', true),
  ('66666666-6666-6666-6666-666666666666', 'startup3@example.com', 'startup', true)
ON CONFLICT (id) DO NOTHING;

-- Insert investor profiles
INSERT INTO public.investor_profiles (
  user_id, full_name, company_name, title, bio, location,
  investment_stage, preferred_sectors, ticket_size_min, ticket_size_max,
  geographic_focus, investment_type, total_investments
) VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'Sarah Chen',
    'Venture Capital Partners',
    'Managing Partner',
    'Experienced investor focused on early-stage SaaS and fintech startups. 15+ years in venture capital.',
    'San Francisco, CA',
    ARRAY['seed', 'series_a'],
    ARRAY['SaaS', 'Fintech', 'Enterprise Software'],
    100000,
    2000000,
    ARRAY['North America', 'Europe'],
    ARRAY['equity', 'safe'],
    23
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Michael Rodriguez',
    'Tech Angels Network',
    'Angel Investor',
    'Serial entrepreneur turned angel investor. Passionate about AI and healthcare innovation.',
    'New York, NY',
    ARRAY['pre_seed', 'seed'],
    ARRAY['AI/ML', 'Healthcare', 'EdTech'],
    50000,
    500000,
    ARRAY['North America'],
    ARRAY['safe', 'convertible_note'],
    12
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Emily Thompson',
    'Growth Equity Fund',
    'Investment Director',
    'Focused on growth-stage companies with proven traction and scalable business models.',
    'London, UK',
    ARRAY['series_b', 'series_c', 'growth'],
    ARRAY['E-commerce', 'Marketplace', 'Consumer Tech'],
    5000000,
    20000000,
    ARRAY['Europe', 'Global'],
    ARRAY['equity'],
    8
  )
ON CONFLICT (user_id) DO NOTHING;

-- Insert startup profiles
INSERT INTO public.startup_profiles (
  user_id, company_name, tagline, description, location, founded_year, team_size,
  funding_stage, funding_goal, current_valuation, sector, business_model,
  monthly_revenue, monthly_growth_rate, customer_count, ai_score
) VALUES
  (
    '44444444-4444-4444-4444-444444444444',
    'DataFlow AI',
    'AI-powered data analytics for enterprises',
    'DataFlow AI helps enterprises make sense of their data with cutting-edge machine learning algorithms. Our platform reduces analysis time by 80% and provides actionable insights in real-time.',
    'San Francisco, CA',
    2022,
    15,
    'seed',
    2000000,
    8000000,
    'AI/ML',
    'b2b',
    45000,
    15.5,
    28,
    0.87
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    'HealthTrack Pro',
    'Personalized health monitoring for everyone',
    'HealthTrack Pro combines wearable technology with AI to provide personalized health insights and early disease detection. Join the future of preventive healthcare.',
    'Boston, MA',
    2023,
    8,
    'pre_seed',
    500000,
    3000000,
    'Healthcare',
    'b2c',
    12000,
    25.0,
    1200,
    0.75
  ),
  (
    '66666666-6666-6666-6666-666666666666',
    'EduLearn Platform',
    'Adaptive learning for K-12 students',
    'EduLearn uses adaptive algorithms to personalize education for every student. Our platform has helped over 50,000 students improve their grades by an average of 23%.',
    'Austin, TX',
    2021,
    22,
    'series_a',
    5000000,
    15000000,
    'EdTech',
    'b2b2c',
    85000,
    12.0,
    50000,
    0.92
  )
ON CONFLICT (user_id) DO NOTHING;

-- Insert some sample swipes
INSERT INTO public.swipes (investor_id, startup_id, direction) VALUES
  ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'right'),
  ('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'left'),
  ('22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', 'right'),
  ('22222222-2222-2222-2222-222222222222', '66666666-6666-6666-6666-666666666666', 'right')
ON CONFLICT (investor_id, startup_id) DO NOTHING;

-- Insert a sample match
INSERT INTO public.matches (investor_id, startup_id, status) VALUES
  ('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'active')
ON CONFLICT (investor_id, startup_id) DO NOTHING;

-- Insert sample notifications
INSERT INTO public.notifications (user_id, type, title, message, link) VALUES
  ('11111111-1111-1111-1111-111111111111', 'match', 'New Match!', 'You matched with DataFlow AI', '/matches'),
  ('44444444-4444-4444-4444-444444444444', 'match', 'New Match!', 'You matched with Sarah Chen from Venture Capital Partners', '/matches')
ON CONFLICT DO NOTHING;
