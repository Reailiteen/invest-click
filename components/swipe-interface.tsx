"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { X, Heart, MapPin, Users, TrendingUp, DollarSign, Building2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { StartupProfile, InvestorProfile } from "@/lib/types/database"

interface SwipeInterfaceProps {
  startups: (StartupProfile & { user: { id: string; email: string } })[]
  investorProfile: InvestorProfile | null
}

export default function SwipeInterface({ startups: initialStartups, investorProfile }: SwipeInterfaceProps) {
  const router = useRouter()
  const [startups, setStartups] = useState(initialStartups)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null)

  const currentStartup = startups[currentIndex]

  const handleSwipe = async (direction: "left" | "right") => {
    if (isAnimating || !currentStartup) return

    setIsAnimating(true)
    setSwipeDirection(direction)

    try {
      const supabase = getSupabaseBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Record the swipe
      const { error: swipeError } = await supabase.from("swipes").insert({
        investor_id: user.id,
        startup_id: currentStartup.user_id,
        direction,
      })

      if (swipeError) throw swipeError

      // If swiped right, check if startup also swiped right (mutual interest)
      if (direction === "right") {
        // For now, we'll create a match immediately for demo purposes
        // In production, you'd check if the startup has also shown interest
        const { error: matchError } = await supabase.from("matches").insert({
          investor_id: user.id,
          startup_id: currentStartup.user_id,
          status: "active",
        })

        // Create notifications for both parties
        if (!matchError) {
          await supabase.from("notifications").insert([
            {
              user_id: user.id,
              type: "match",
              title: "New Match!",
              message: `You matched with ${currentStartup.company_name}`,
              link: "/matches",
            },
            {
              user_id: currentStartup.user_id,
              type: "match",
              title: "New Match!",
              message: `${investorProfile?.full_name || "An investor"} is interested in your startup!`,
              link: "/matches",
            },
          ])
        }
      }

      // Wait for animation
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1)
        setIsAnimating(false)
        setSwipeDirection(null)
      }, 300)
    } catch (error) {
      console.error("[v0] Error swiping:", error)
      setIsAnimating(false)
      setSwipeDirection(null)
    }
  }

  if (!currentStartup) {
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

        <div className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-md mx-auto">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Heart className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-4">No More Startups</h2>
            <p className="text-muted-foreground mb-6">
              You've reviewed all available startups. Check back later for new opportunities!
            </p>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="text-sm text-muted-foreground">
            {currentIndex + 1} / {startups.length}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="relative">
          <Card
            className={`transition-all duration-300 ${
              swipeDirection === "left"
                ? "translate-x-[-100%] opacity-0 rotate-[-10deg]"
                : swipeDirection === "right"
                  ? "translate-x-[100%] opacity-0 rotate-[10deg]"
                  : ""
            }`}
          >
            <CardContent className="p-0">
              {/* Header Image Placeholder */}
              <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Building2 className="h-20 w-20 text-primary/40" />
              </div>

              <div className="p-6 space-y-6">
                {/* Company Header */}
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h2 className="text-2xl font-bold">{currentStartup.company_name}</h2>
                      {currentStartup.tagline && <p className="text-muted-foreground mt-1">{currentStartup.tagline}</p>}
                    </div>
                    {currentStartup.ai_score && (
                      <Badge variant="secondary" className="text-lg px-3 py-1">
                        {(currentStartup.ai_score * 100).toFixed(0)}%
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {currentStartup.sector && <Badge variant="outline">{currentStartup.sector}</Badge>}
                    {currentStartup.funding_stage && (
                      <Badge variant="outline">{currentStartup.funding_stage.replace("_", " ").toUpperCase()}</Badge>
                    )}
                    {currentStartup.business_model && (
                      <Badge variant="outline">{currentStartup.business_model.toUpperCase()}</Badge>
                    )}
                  </div>
                </div>

                {/* Description */}
                {currentStartup.description && (
                  <div>
                    <h3 className="font-semibold mb-2">About</h3>
                    <p className="text-muted-foreground leading-relaxed">{currentStartup.description}</p>
                  </div>
                )}

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  {currentStartup.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">Location</div>
                        <div className="font-medium">{currentStartup.location}</div>
                      </div>
                    </div>
                  )}

                  {currentStartup.team_size && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">Team Size</div>
                        <div className="font-medium">{currentStartup.team_size} people</div>
                      </div>
                    </div>
                  )}

                  {currentStartup.funding_goal && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">Funding Goal</div>
                        <div className="font-medium">${(currentStartup.funding_goal / 1000000).toFixed(1)}M</div>
                      </div>
                    </div>
                  )}

                  {currentStartup.current_valuation && (
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-xs text-muted-foreground">Valuation</div>
                        <div className="font-medium">${(currentStartup.current_valuation / 1000000).toFixed(1)}M</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Traction */}
                {(currentStartup.monthly_revenue ||
                  currentStartup.monthly_growth_rate ||
                  currentStartup.customer_count) && (
                  <div>
                    <h3 className="font-semibold mb-3">Traction</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {currentStartup.monthly_revenue && (
                        <div>
                          <div className="text-xs text-muted-foreground">Monthly Revenue</div>
                          <div className="font-medium">${(currentStartup.monthly_revenue / 1000).toFixed(0)}K</div>
                        </div>
                      )}
                      {currentStartup.monthly_growth_rate && (
                        <div>
                          <div className="text-xs text-muted-foreground">Growth Rate</div>
                          <div className="font-medium">{currentStartup.monthly_growth_rate}%</div>
                        </div>
                      )}
                      {currentStartup.customer_count && (
                        <div>
                          <div className="text-xs text-muted-foreground">Customers</div>
                          <div className="font-medium">{currentStartup.customer_count.toLocaleString()}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Links */}
                {(currentStartup.website_url || currentStartup.linkedin_url) && (
                  <div className="flex gap-3 pt-4 border-t">
                    {currentStartup.website_url && (
                      <a
                        href={currentStartup.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Website
                      </a>
                    )}
                    {currentStartup.linkedin_url && (
                      <a
                        href={currentStartup.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        LinkedIn
                      </a>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Swipe Buttons */}
          <div className="flex items-center justify-center gap-6 mt-8">
            <Button
              size="lg"
              variant="outline"
              className="h-16 w-16 rounded-full border-2 bg-transparent"
              onClick={() => handleSwipe("left")}
              disabled={isAnimating}
            >
              <X className="h-8 w-8 text-destructive" />
            </Button>

            <Button
              size="lg"
              className="h-20 w-20 rounded-full"
              onClick={() => handleSwipe("right")}
              disabled={isAnimating}
            >
              <Heart className="h-10 w-10" />
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-4">
            <X className="h-4 w-4 inline" /> Pass • <Heart className="h-4 w-4 inline" /> Interested
          </p>
        </div>
      </div>
    </div>
  )
}
