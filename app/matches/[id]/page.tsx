import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  ArrowLeft,
  MapPin,
  Users,
  TrendingUp,
  DollarSign,
  Building2,
  ExternalLink,
  FileText,
  Calendar,
} from "lucide-react"

export default async function MatchDetailPage({ params }: { params: { id: string } }) {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user role
  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

  const isInvestor = userData?.role === "investor"

  // Get match details
  const { data: match } = await supabase
    .from("matches")
    .select(
      `
      *,
      investor:investor_profiles!matches_investor_id_fkey(*),
      startup:startup_profiles!matches_startup_id_fkey(*)
    `,
    )
    .eq("id", params.id)
    .single()

  if (!match) {
    redirect("/matches")
  }

  // Verify user is part of this match
  if (match.investor_id !== user.id && match.startup_id !== user.id) {
    redirect("/matches")
  }

  const profile = isInvestor ? match.startup : match.investor

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/matches" className="flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Matches</span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Profile */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-0">
                <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Building2 className="h-16 w-16 text-primary/40" />
                </div>

                <div className="p-6">
                  {isInvestor ? (
                    <>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h1 className="text-3xl font-bold">{profile.company_name}</h1>
                          {profile.tagline && <p className="text-muted-foreground mt-2">{profile.tagline}</p>}
                        </div>
                        {profile.ai_score && (
                          <Badge variant="secondary" className="text-lg px-3 py-1">
                            {(profile.ai_score * 100).toFixed(0)}%
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 mb-6">
                        {profile.sector && <Badge variant="outline">{profile.sector}</Badge>}
                        {profile.funding_stage && (
                          <Badge variant="outline">{profile.funding_stage.replace("_", " ").toUpperCase()}</Badge>
                        )}
                        {profile.business_model && (
                          <Badge variant="outline">{profile.business_model.toUpperCase()}</Badge>
                        )}
                      </div>

                      {profile.description && (
                        <div className="mb-6">
                          <h3 className="font-semibold mb-2">About</h3>
                          <p className="text-muted-foreground leading-relaxed">{profile.description}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        {profile.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-xs text-muted-foreground">Location</div>
                              <div className="font-medium">{profile.location}</div>
                            </div>
                          </div>
                        )}

                        {profile.team_size && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-xs text-muted-foreground">Team Size</div>
                              <div className="font-medium">{profile.team_size} people</div>
                            </div>
                          </div>
                        )}

                        {profile.funding_goal && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-xs text-muted-foreground">Funding Goal</div>
                              <div className="font-medium">${(profile.funding_goal / 1000000).toFixed(1)}M</div>
                            </div>
                          </div>
                        )}

                        {profile.current_valuation && (
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-xs text-muted-foreground">Valuation</div>
                              <div className="font-medium">${(profile.current_valuation / 1000000).toFixed(1)}M</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {(profile.monthly_revenue || profile.monthly_growth_rate || profile.customer_count) && (
                        <div className="border-t pt-6">
                          <h3 className="font-semibold mb-4">Traction</h3>
                          <div className="grid grid-cols-3 gap-4">
                            {profile.monthly_revenue && (
                              <div>
                                <div className="text-xs text-muted-foreground">Monthly Revenue</div>
                                <div className="text-lg font-semibold">
                                  ${(profile.monthly_revenue / 1000).toFixed(0)}K
                                </div>
                              </div>
                            )}
                            {profile.monthly_growth_rate && (
                              <div>
                                <div className="text-xs text-muted-foreground">Growth Rate</div>
                                <div className="text-lg font-semibold">{profile.monthly_growth_rate}%</div>
                              </div>
                            )}
                            {profile.customer_count && (
                              <div>
                                <div className="text-xs text-muted-foreground">Customers</div>
                                <div className="text-lg font-semibold">{profile.customer_count.toLocaleString()}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {(profile.website_url || profile.linkedin_url) && (
                        <div className="flex gap-4 pt-6 border-t">
                          {profile.website_url && (
                            <a
                              href={profile.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-primary hover:underline"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Website
                            </a>
                          )}
                          {profile.linkedin_url && (
                            <a
                              href={profile.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-primary hover:underline"
                            >
                              <ExternalLink className="h-4 w-4" />
                              LinkedIn
                            </a>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <h1 className="text-3xl font-bold mb-2">{profile.full_name}</h1>
                      <p className="text-lg text-muted-foreground mb-6">
                        {profile.title}
                        {profile.company_name && ` at ${profile.company_name}`}
                      </p>

                      {profile.bio && (
                        <div className="mb-6">
                          <h3 className="font-semibold mb-2">About</h3>
                          <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        {profile.location && (
                          <div>
                            <div className="text-xs text-muted-foreground">Location</div>
                            <div className="font-medium">{profile.location}</div>
                          </div>
                        )}

                        {profile.total_investments && (
                          <div>
                            <div className="text-xs text-muted-foreground">Total Investments</div>
                            <div className="font-medium">{profile.total_investments}</div>
                          </div>
                        )}

                        {profile.ticket_size_min && profile.ticket_size_max && (
                          <div className="col-span-2">
                            <div className="text-xs text-muted-foreground">Ticket Size</div>
                            <div className="font-medium">
                              ${(profile.ticket_size_min / 1000).toFixed(0)}K - $
                              {(profile.ticket_size_max / 1000).toFixed(0)}K
                            </div>
                          </div>
                        )}
                      </div>

                      {profile.preferred_sectors && profile.preferred_sectors.length > 0 && (
                        <div className="border-t pt-6">
                          <h3 className="font-semibold mb-3">Preferred Sectors</h3>
                          <div className="flex flex-wrap gap-2">
                            {profile.preferred_sectors.map((sector: string) => (
                              <Badge key={sector} variant="secondary">
                                {sector}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {profile.investment_stage && profile.investment_stage.length > 0 && (
                        <div className="border-t pt-6 mt-6">
                          <h3 className="font-semibold mb-3">Investment Stages</h3>
                          <div className="flex flex-wrap gap-2">
                            {profile.investment_stage.map((stage: string) => (
                              <Badge key={stage} variant="secondary">
                                {stage.replace("_", " ").toUpperCase()}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {(profile.website_url || profile.linkedin_url) && (
                        <div className="flex gap-4 pt-6 border-t mt-6">
                          {profile.website_url && (
                            <a
                              href={profile.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-primary hover:underline"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Website
                            </a>
                          )}
                          {profile.linkedin_url && (
                            <a
                              href={profile.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-primary hover:underline"
                            >
                              <ExternalLink className="h-4 w-4" />
                              LinkedIn
                            </a>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Match Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Matched</span>
                  <span className="font-medium">{new Date(match.matched_at).toLocaleDateString()}</span>
                </div>

                <Link href={`/contracts/new?match=${match.id}`} className="block">
                  <Button className="w-full gap-2">
                    <FileText className="h-4 w-4" />
                    Start Deal
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
