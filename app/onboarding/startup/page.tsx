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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { TrendingUp, Upload } from "lucide-react"

const FUNDING_STAGES = [
  { value: "pre_seed", label: "Pre-Seed" },
  { value: "seed", label: "Seed" },
  { value: "series_a", label: "Series A" },
  { value: "series_b", label: "Series B" },
  { value: "series_c", label: "Series C" },
  { value: "growth", label: "Growth" },
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

const BUSINESS_MODELS = [
  { value: "b2b", label: "B2B" },
  { value: "b2c", label: "B2C" },
  { value: "b2b2c", label: "B2B2C" },
  { value: "marketplace", label: "Marketplace" },
]

export default function StartupOnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [uploadingFile, setUploadingFile] = useState(false)

  const [formData, setFormData] = useState({
    company_name: "",
    tagline: "",
    description: "",
    website_url: "",
    linkedin_url: "",
    location: "",
    founded_year: "",
    team_size: "",
    funding_stage: "",
    funding_goal: "",
    current_valuation: "",
    previous_funding: "",
    sector: "",
    business_model: "",
    revenue_model: "",
    monthly_revenue: "",
    monthly_growth_rate: "",
    customer_count: "",
  })

  const [pitchDeck, setPitchDeck] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPitchDeck(e.target.files[0])
    }
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

      // Upload pitch deck if provided
      let pitchDeckUrl = null
      if (pitchDeck) {
        setUploadingFile(true)
        const fileExt = pitchDeck.name.split(".").pop()
        const fileName = `${user.id}/pitch-deck-${Date.now()}.${fileExt}`

        const { error: uploadError, data: uploadData } = await supabase.storage
          .from("documents")
          .upload(fileName, pitchDeck)

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from("documents").getPublicUrl(fileName)

        pitchDeckUrl = publicUrl

        // Save document record
        await supabase.from("documents").insert({
          user_id: user.id,
          document_type: "pitch_deck",
          file_name: pitchDeck.name,
          file_url: pitchDeckUrl,
          file_size: pitchDeck.size,
          mime_type: pitchDeck.type,
        })

        setUploadingFile(false)
      }

      // Create startup profile
      const { error: profileError } = await supabase.from("startup_profiles").insert({
        user_id: user.id,
        company_name: formData.company_name,
        tagline: formData.tagline || null,
        description: formData.description || null,
        website_url: formData.website_url || null,
        linkedin_url: formData.linkedin_url || null,
        location: formData.location || null,
        founded_year: formData.founded_year ? Number.parseInt(formData.founded_year) : null,
        team_size: formData.team_size ? Number.parseInt(formData.team_size) : null,
        funding_stage: formData.funding_stage || null,
        funding_goal: formData.funding_goal ? Number.parseFloat(formData.funding_goal) : null,
        current_valuation: formData.current_valuation ? Number.parseFloat(formData.current_valuation) : null,
        previous_funding: formData.previous_funding ? Number.parseFloat(formData.previous_funding) : null,
        sector: formData.sector || null,
        business_model: formData.business_model || null,
        revenue_model: formData.revenue_model || null,
        monthly_revenue: formData.monthly_revenue ? Number.parseFloat(formData.monthly_revenue) : null,
        monthly_growth_rate: formData.monthly_growth_rate ? Number.parseFloat(formData.monthly_growth_rate) : null,
        customer_count: formData.customer_count ? Number.parseInt(formData.customer_count) : null,
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
      setUploadingFile(false)
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
            <CardTitle className="text-2xl">Complete Your Startup Profile</CardTitle>
            <CardDescription>Help investors discover your company</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Company Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Company Information</h3>

                <div className="space-y-2">
                  <Label htmlFor="company_name">
                    Company Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    placeholder="A brief, catchy description of your company"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Tell investors about your company, product, and vision..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
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

                  <div className="space-y-2">
                    <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                    <Input
                      id="linkedin_url"
                      type="url"
                      placeholder="https://linkedin.com/company/..."
                      value={formData.linkedin_url}
                      onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
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
                    <Label htmlFor="founded_year">Founded Year</Label>
                    <Input
                      id="founded_year"
                      type="number"
                      placeholder="2023"
                      value={formData.founded_year}
                      onChange={(e) => setFormData({ ...formData, founded_year: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="team_size">Team Size</Label>
                    <Input
                      id="team_size"
                      type="number"
                      placeholder="10"
                      value={formData.team_size}
                      onChange={(e) => setFormData({ ...formData, team_size: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Funding Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Funding Details</h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="funding_stage">Funding Stage</Label>
                    <Select
                      value={formData.funding_stage}
                      onValueChange={(value) => setFormData({ ...formData, funding_stage: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent>
                        {FUNDING_STAGES.map((stage) => (
                          <SelectItem key={stage.value} value={stage.value}>
                            {stage.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="funding_goal">Funding Goal ($)</Label>
                    <Input
                      id="funding_goal"
                      type="number"
                      placeholder="1000000"
                      value={formData.funding_goal}
                      onChange={(e) => setFormData({ ...formData, funding_goal: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_valuation">Current Valuation ($)</Label>
                    <Input
                      id="current_valuation"
                      type="number"
                      placeholder="5000000"
                      value={formData.current_valuation}
                      onChange={(e) => setFormData({ ...formData, current_valuation: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="previous_funding">Previous Funding ($)</Label>
                    <Input
                      id="previous_funding"
                      type="number"
                      placeholder="500000"
                      value={formData.previous_funding}
                      onChange={(e) => setFormData({ ...formData, previous_funding: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Business Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Business Details</h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sector">Sector</Label>
                    <Select
                      value={formData.sector}
                      onValueChange={(value) => setFormData({ ...formData, sector: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select sector" />
                      </SelectTrigger>
                      <SelectContent>
                        {SECTORS.map((sector) => (
                          <SelectItem key={sector} value={sector}>
                            {sector}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business_model">Business Model</Label>
                    <Select
                      value={formData.business_model}
                      onValueChange={(value) => setFormData({ ...formData, business_model: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        {BUSINESS_MODELS.map((model) => (
                          <SelectItem key={model.value} value={model.value}>
                            {model.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="revenue_model">Revenue Model</Label>
                  <Input
                    id="revenue_model"
                    placeholder="e.g., Subscription, Transaction fees, Advertising"
                    value={formData.revenue_model}
                    onChange={(e) => setFormData({ ...formData, revenue_model: e.target.value })}
                  />
                </div>
              </div>

              {/* Traction */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Traction</h3>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="monthly_revenue">Monthly Revenue ($)</Label>
                    <Input
                      id="monthly_revenue"
                      type="number"
                      placeholder="50000"
                      value={formData.monthly_revenue}
                      onChange={(e) => setFormData({ ...formData, monthly_revenue: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="monthly_growth_rate">Monthly Growth Rate (%)</Label>
                    <Input
                      id="monthly_growth_rate"
                      type="number"
                      step="0.1"
                      placeholder="15.5"
                      value={formData.monthly_growth_rate}
                      onChange={(e) => setFormData({ ...formData, monthly_growth_rate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customer_count">Customer Count</Label>
                    <Input
                      id="customer_count"
                      type="number"
                      placeholder="1000"
                      value={formData.customer_count}
                      onChange={(e) => setFormData({ ...formData, customer_count: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Pitch Deck Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Pitch Deck (Optional)</h3>
                <div className="space-y-2">
                  <Label htmlFor="pitch_deck">Upload Pitch Deck</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="pitch_deck"
                      type="file"
                      accept=".pdf,.ppt,.pptx"
                      onChange={handleFileChange}
                      className="flex-1"
                    />
                    {pitchDeck && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Upload className="h-4 w-4" />
                        {pitchDeck.name}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading || uploadingFile}>
                {uploadingFile ? "Uploading..." : loading ? "Completing Profile..." : "Complete Profile"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
