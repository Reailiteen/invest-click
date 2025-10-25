"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Checkbox } from "@/components/ui/checkbox"
import { TrendingUp } from "lucide-react"

const INVESTMENT_STAGES = [
  { id: "pre_seed", label: "Pre-Seed" },
  { id: "seed", label: "Seed" },
  { id: "series_a", label: "Series A" },
  { id: "series_b", label: "Series B" },
  { id: "series_c", label: "Series C" },
  { id: "growth", label: "Growth" },
]

const SECTORS = [
  "SaaS",
  "Fintech",
  "Healthcare",
  "AI/ML",
  "E-commerce",
  "EdTech",
  "Enterprise Software",
  "Consumer Tech",
  "Marketplace",
  "Climate Tech",
]

const INVESTMENT_TYPES = [
  { id: "equity", label: "Equity" },
  { id: "convertible_note", label: "Convertible Note" },
  { id: "safe", label: "SAFE" },
]

const GEOGRAPHIC_FOCUS = ["North America", "Europe", "Asia", "Latin America", "Africa", "Global"]

export default function InvestorOnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    full_name: "",
    company_name: "",
    title: "",
    bio: "",
    location: "",
    linkedin_url: "",
    website_url: "",
    investment_stage: [] as string[],
    preferred_sectors: [] as string[],
    ticket_size_min: "",
    ticket_size_max: "",
    geographic_focus: [] as string[],
    investment_type: [] as string[],
  })

  const handleCheckboxChange = (field: string, value: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: checked
        ? [...prev[field as keyof typeof prev], value]
        : prev[field as keyof typeof prev].filter((v: string) => v !== value),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const supabase = getSupabaseBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      // Create investor profile
      const { error: profileError } = await supabase.from("investor_profiles").insert({
        user_id: user.id,
        full_name: formData.full_name,
        company_name: formData.company_name || null,
        title: formData.title || null,
        bio: formData.bio || null,
        location: formData.location || null,
        linkedin_url: formData.linkedin_url || null,
        website_url: formData.website_url || null,
        investment_stage: formData.investment_stage,
        preferred_sectors: formData.preferred_sectors,
        ticket_size_min: formData.ticket_size_min ? Number.parseFloat(formData.ticket_size_min) : null,
        ticket_size_max: formData.ticket_size_max ? Number.parseFloat(formData.ticket_size_max) : null,
        geographic_focus: formData.geographic_focus,
        investment_type: formData.investment_type,
      })

      if (profileError) throw profileError

      // Mark onboarding as completed
      const { error: userError } = await supabase.from("users").update({ onboarding_completed: true }).eq("id", user.id)

      if (userError) throw userError

      router.push("/dashboard")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Failed to complete onboarding")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="flex items-center justify-center gap-2 mb-8">
          <TrendingUp className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">Invest Click</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Complete Your Investor Profile</CardTitle>
            <CardDescription>Help us match you with the right startups</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Personal Information</h3>

                <div className="space-y-2">
                  <Label htmlFor="full_name">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company/Fund Name</Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Managing Partner"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell startups about your investment experience..."
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="e.g., San Francisco, CA"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                    <Input
                      id="linkedin_url"
                      type="url"
                      placeholder="https://linkedin.com/in/..."
                      value={formData.linkedin_url}
                      onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website_url">Website URL</Label>
                  <Input
                    id="website_url"
                    type="url"
                    placeholder="https://..."
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  />
                </div>
              </div>

              {/* Investment Preferences */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Investment Preferences</h3>

                <div className="space-y-2">
                  <Label>Investment Stage</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {INVESTMENT_STAGES.map((stage) => (
                      <div key={stage.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`stage-${stage.id}`}
                          checked={formData.investment_stage.includes(stage.id)}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange("investment_stage", stage.id, checked as boolean)
                          }
                        />
                        <Label htmlFor={`stage-${stage.id}`} className="font-normal cursor-pointer">
                          {stage.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Preferred Sectors</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {SECTORS.map((sector) => (
                      <div key={sector} className="flex items-center space-x-2">
                        <Checkbox
                          id={`sector-${sector}`}
                          checked={formData.preferred_sectors.includes(sector)}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange("preferred_sectors", sector, checked as boolean)
                          }
                        />
                        <Label htmlFor={`sector-${sector}`} className="font-normal cursor-pointer">
                          {sector}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ticket_size_min">Minimum Ticket Size ($)</Label>
                    <Input
                      id="ticket_size_min"
                      type="number"
                      placeholder="50000"
                      value={formData.ticket_size_min}
                      onChange={(e) => setFormData({ ...formData, ticket_size_min: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ticket_size_max">Maximum Ticket Size ($)</Label>
                    <Input
                      id="ticket_size_max"
                      type="number"
                      placeholder="500000"
                      value={formData.ticket_size_max}
                      onChange={(e) => setFormData({ ...formData, ticket_size_max: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Geographic Focus</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {GEOGRAPHIC_FOCUS.map((region) => (
                      <div key={region} className="flex items-center space-x-2">
                        <Checkbox
                          id={`region-${region}`}
                          checked={formData.geographic_focus.includes(region)}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange("geographic_focus", region, checked as boolean)
                          }
                        />
                        <Label htmlFor={`region-${region}`} className="font-normal cursor-pointer">
                          {region}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Investment Type</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {INVESTMENT_TYPES.map((type) => (
                      <div key={type.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`type-${type.id}`}
                          checked={formData.investment_type.includes(type.id)}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange("investment_type", type.id, checked as boolean)
                          }
                        />
                        <Label htmlFor={`type-${type.id}`} className="font-normal cursor-pointer">
                          {type.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Completing Profile..." : "Complete Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
