import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, TrendingUp, Heart, FileText, Activity } from "lucide-react"

export default async function AnalyticsPage() {
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

  // Get analytics data
  const { count: totalMatches } = await supabase
    .from("matches")
    .select("*", { count: "exact", head: true })
    .or(isInvestor ? `investor_id.eq.${user.id}` : `startup_id.eq.${user.id}`)

  const { count: totalContracts } = await supabase
    .from("contracts")
    .select("*", { count: "exact", head: true })
    .or(`investor_id.eq.${user.id},startup_id.eq.${user.id}`)

  const { count: acceptedContracts } = await supabase
    .from("contracts")
    .select("*", { count: "exact", head: true })
    .or(`investor_id.eq.${user.id},startup_id.eq.${user.id}`)
    .eq("status", "accepted")

  const { count: activeContracts } = await supabase
    .from("contracts")
    .select("*", { count: "exact", head: true })
    .or(`investor_id.eq.${user.id},startup_id.eq.${user.id}`)
    .in("status", ["proposed", "negotiating"])

  // Investor-specific analytics
  let investorStats = null
  if (isInvestor) {
    const { count: totalSwipes } = await supabase
      .from("swipes")
      .select("*", { count: "exact", head: true })
      .eq("investor_id", user.id)

    const { count: rightSwipes } = await supabase
      .from("swipes")
      .select("*", { count: "exact", head: true })
      .eq("investor_id", user.id)
      .eq("direction", "right")

    investorStats = {
      totalSwipes: totalSwipes || 0,
      rightSwipes: rightSwipes || 0,
      matchRate: totalSwipes && rightSwipes ? ((rightSwipes / totalSwipes) * 100).toFixed(1) : 0,
    }
  }

  // Startup-specific analytics
  let startupStats = null
  if (!isInvestor) {
    const { count: interestedInvestors } = await supabase
      .from("swipes")
      .select("*", { count: "exact", head: true })
      .eq("startup_id", user.id)
      .eq("direction", "right")

    const { data: profile } = await supabase.from("startup_profiles").select("ai_score").eq("user_id", user.id).single()

    startupStats = {
      interestedInvestors: interestedInvestors || 0,
      aiScore: profile?.ai_score || 0,
    }
  }

  // Get recent activity
  const { data: recentEvents } = await supabase
    .from("analytics_events")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10)

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

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Analytics</h1>
          <p className="text-muted-foreground">Track your performance and activity</p>
        </div>

        {/* Overview Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMatches || 0}</div>
              <p className="text-xs text-muted-foreground">All time connections</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalContracts || 0}</div>
              <p className="text-xs text-muted-foreground">Deals initiated</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeContracts || 0}</div>
              <p className="text-xs text-muted-foreground">In negotiation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Closed Deals</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{acceptedContracts || 0}</div>
              <p className="text-xs text-muted-foreground">Successfully completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Role-specific stats */}
        {isInvestor && investorStats && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Investor Insights</CardTitle>
              <CardDescription>Your investment activity and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Total Startups Reviewed</div>
                  <div className="text-3xl font-bold">{investorStats.totalSwipes}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Showed Interest In</div>
                  <div className="text-3xl font-bold">{investorStats.rightSwipes}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Interest Rate</div>
                  <div className="text-3xl font-bold">{investorStats.matchRate}%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!isInvestor && startupStats && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Startup Insights</CardTitle>
              <CardDescription>Your startup's performance and visibility</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Interested Investors</div>
                  <div className="text-3xl font-bold">{startupStats.interestedInvestors}</div>
                  <p className="text-xs text-muted-foreground mt-1">Investors who swiped right on you</p>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">AI Quality Score</div>
                  <div className="text-3xl font-bold">{(startupStats.aiScore * 100).toFixed(0)}%</div>
                  <p className="text-xs text-muted-foreground mt-1">Based on your metrics and traction</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        {recentEvents && recentEvents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest actions on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentEvents.map((event: any) => (
                  <div key={event.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium capitalize">{event.event_type.replace("_", " ")}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(event.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
