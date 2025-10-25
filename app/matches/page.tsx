import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, Building2, User, MessageSquare, FileText } from "lucide-react"

export default async function MatchesPage() {
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

  // Get matches based on role
  let matches
  if (isInvestor) {
    const { data } = await supabase
      .from("matches")
      .select(
        `
        *,
        startup:startup_profiles!matches_startup_id_fkey(
          company_name,
          tagline,
          sector,
          funding_stage,
          funding_goal,
          location,
          ai_score
        )
      `,
      )
      .eq("investor_id", user.id)
      .eq("status", "active")
      .order("matched_at", { ascending: false })

    matches = data
  } else {
    const { data } = await supabase
      .from("matches")
      .select(
        `
        *,
        investor:investor_profiles!matches_investor_id_fkey(
          full_name,
          company_name,
          title,
          location,
          ticket_size_min,
          ticket_size_max,
          preferred_sectors
        )
      `,
      )
      .eq("startup_id", user.id)
      .eq("status", "active")
      .order("matched_at", { ascending: false })

    matches = data
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Matches</h1>
          <p className="text-muted-foreground">
            {isInvestor ? "Startups you've connected with" : "Investors interested in your startup"}
          </p>
        </div>

        {!matches || matches.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                {isInvestor ? (
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                ) : (
                  <User className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <h3 className="text-lg font-semibold mb-2">No matches yet</h3>
              <p className="text-muted-foreground mb-6">
                {isInvestor
                  ? "Start swiping to discover startups and make connections"
                  : "Investors will appear here when they show interest in your startup"}
              </p>
              {isInvestor && (
                <Link href="/swipe">
                  <Button>Discover Startups</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {matches.map((match: any) => (
              <Card key={match.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {isInvestor ? (
                        <>
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-xl font-semibold">{match.startup?.company_name}</h3>
                              {match.startup?.tagline && (
                                <p className="text-muted-foreground mt-1">{match.startup.tagline}</p>
                              )}
                            </div>
                            {match.startup?.ai_score && (
                              <Badge variant="secondary" className="ml-4">
                                {(match.startup.ai_score * 100).toFixed(0)}% Score
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 mt-3">
                            {match.startup?.sector && <Badge variant="outline">{match.startup.sector}</Badge>}
                            {match.startup?.funding_stage && (
                              <Badge variant="outline">
                                {match.startup.funding_stage.replace("_", " ").toUpperCase()}
                              </Badge>
                            )}
                            {match.startup?.location && <Badge variant="outline">{match.startup.location}</Badge>}
                          </div>

                          {match.startup?.funding_goal && (
                            <p className="text-sm text-muted-foreground mt-3">
                              Seeking ${(match.startup.funding_goal / 1000000).toFixed(1)}M
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <h3 className="text-xl font-semibold mb-1">{match.investor?.full_name}</h3>
                          <p className="text-muted-foreground">
                            {match.investor?.title}
                            {match.investor?.company_name && ` at ${match.investor.company_name}`}
                          </p>

                          <div className="flex flex-wrap gap-2 mt-3">
                            {match.investor?.location && <Badge variant="outline">{match.investor.location}</Badge>}
                            {match.investor?.ticket_size_min && match.investor?.ticket_size_max && (
                              <Badge variant="outline">
                                ${(match.investor.ticket_size_min / 1000).toFixed(0)}K - $
                                {(match.investor.ticket_size_max / 1000).toFixed(0)}K
                              </Badge>
                            )}
                          </div>

                          {match.investor?.preferred_sectors && match.investor.preferred_sectors.length > 0 && (
                            <p className="text-sm text-muted-foreground mt-3">
                              Interested in: {match.investor.preferred_sectors.slice(0, 3).join(", ")}
                            </p>
                          )}
                        </>
                      )}

                      <div className="flex gap-3 mt-4">
                        <Link href={`/matches/${match.id}`}>
                          <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                            <MessageSquare className="h-4 w-4" />
                            View Details
                          </Button>
                        </Link>
                        <Link href={`/contracts/new?match=${match.id}`}>
                          <Button size="sm" className="gap-2">
                            <FileText className="h-4 w-4" />
                            Start Deal
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
