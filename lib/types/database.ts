export type UserRole = "investor" | "startup"

export type InvestmentStage = "pre_seed" | "seed" | "series_a" | "series_b" | "series_c" | "growth"

export type InvestmentType = "equity" | "convertible_note" | "safe"

export type BusinessModel = "b2b" | "b2c" | "b2b2c" | "marketplace"

export type SwipeDirection = "left" | "right"

export type ContractStatus = "draft" | "proposed" | "negotiating" | "accepted" | "rejected" | "expired"

export type DocumentType = "pitch_deck" | "financial_statement" | "term_sheet" | "contract" | "other"

export interface User {
  id: string
  email: string
  role: UserRole
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export interface InvestorProfile {
  id: string
  user_id: string
  full_name: string
  company_name?: string
  title?: string
  bio?: string
  profile_image_url?: string
  location?: string
  linkedin_url?: string
  website_url?: string
  investment_stage: InvestmentStage[]
  preferred_sectors: string[]
  ticket_size_min?: number
  ticket_size_max?: number
  geographic_focus: string[]
  investment_type: InvestmentType[]
  portfolio_companies: string[]
  total_investments: number
  created_at: string
  updated_at: string
}

export interface StartupProfile {
  id: string
  user_id: string
  company_name: string
  tagline?: string
  description?: string
  logo_url?: string
  website_url?: string
  linkedin_url?: string
  location?: string
  founded_year?: number
  team_size?: number
  funding_stage?: InvestmentStage
  funding_goal?: number
  current_valuation?: number
  previous_funding?: number
  sector?: string
  business_model?: BusinessModel
  revenue_model?: string
  monthly_revenue?: number
  monthly_growth_rate?: number
  customer_count?: number
  key_metrics?: Record<string, any>
  ai_score?: number
  ai_score_breakdown?: Record<string, any>
  last_scored_at?: string
  created_at: string
  updated_at: string
}

export interface Match {
  id: string
  investor_id: string
  startup_id: string
  status: "active" | "archived"
  matched_at: string
}

export interface Contract {
  id: string
  match_id: string
  investor_id: string
  startup_id: string
  investment_amount: number
  valuation?: number
  equity_percentage?: number
  investment_type: InvestmentType
  terms: Record<string, any>
  status: ContractStatus
  proposed_by?: string
  version: number
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  link?: string
  read: boolean
  created_at: string
}
