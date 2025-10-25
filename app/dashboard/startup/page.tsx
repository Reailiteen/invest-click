import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { TrendingUp, Heart, Eye, FileText, BarChart3 } from "lucide-react"
import { NotificationBell } from "@/components/notification-bell"

export default async function StartupDashboardPage() {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get startup profile
  const { data: profile } = await supabase.from("startup_profiles").select("*").eq("user_id", user.id).single()

  // Get stats
  const { count: matchCount } = await supabase
    .from("matches")
    .select("*", { count: "exact", head: true })
    .eq("startup_id", user.id)

  const { count: interestedCount } = await supabase
    .from("swipes")
    .select("*", { count: "exact", head: true })
    .eq("startup_id", user.id)
    .eq("direction", "right")

  const { data: recentMatches } = await supabase
    .from("matches")
    .select(
      `
      *,
      investor:investor_profiles!matches_investor_id_fkey(full_name, company_name, title)
    `,
    )
    .eq("startup_id", user.id)
    .order("matched_at", { ascending: false })
    .limit(5)

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Invest Click</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/matches">
              <Button variant="ghost">Matches</Button>
            </Link>
            <Link href="/contracts">
              <Button variant="ghost">Contracts</Button>
            </Link>
            <Link href="/analytics">
              <Button variant="ghost" size="icon">
                <BarChart3 className="h-5 w-5" />
              </Button>
            </Link>
            <NotificationBell />
            <Link href="/profile">
              <Button variant="ghost">Profile</Button>
            </Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {profile?.company_name || "Startup"}!</h1>
          <p className="text-muted-foreground">Track your investor connections and opportunities</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{matchCount || 0}</div>
              <p className="text-xs text-muted-foreground">Connected investors</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Interested Investors</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{interestedCount || 0}</div>
              <p className="text-xs text-muted-foreground">Showed interest</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">In negotiation</p>
            </CardContent>
          </Card>
        </div>

        {/* AI Score Card */}
        {profile?.ai_score && (
          <Card className="mb-8 border-primary/20">
            <CardHeader>
              <CardTitle>Your AI Score</CardTitle>
              <CardDescription>Based on your company metrics and traction</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-primary">{(profile.ai_score * 100).toFixed(0)}%</div>
                <div className="flex-1">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${profile.ai_score * 100}%` }} />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {profile.ai_score >= 0.8
                      ? "Excellent! Your profile is highly attractive to investors."
                      : profile.ai_score >= 0.6
                        ? "Good! Keep improving your metrics to attract more investors."
                        : "Keep building! Focus on traction and growth metrics."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your startup profile and connections</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Link href="/matches">
              <Button>View Matches</Button>
            </Link>
            <Link href="/analytics">
              <Button variant="outline">View Analytics</Button>
            </Link>
            <Link href="/profile">
              <Button variant="outline">Edit Profile</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Matches */}
        {recentMatches && recentMatches.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Matches</CardTitle>
              <CardDescription>Your latest investor connections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentMatches.map((match: any) => (
                  <div key={match.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-semibold">{match.investor?.full_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {match.investor?.title}
                        {match.investor?.company_name && ` at ${match.investor.company_name}`}
                      </p>
                    </div>
                    <Link href={`/matches/${match.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
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
