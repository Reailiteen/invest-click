"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

const INVESTMENT_TYPES = [
  { value: "equity", label: "Equity" },
  { value: "convertible_note", label: "Convertible Note" },
  { value: "safe", label: "SAFE" },
]

export default function NewContractPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const matchId = searchParams.get("match")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [matchData, setMatchData] = useState<any>(null)

  const [formData, setFormData] = useState({
    investment_amount: "",
    valuation: "",
    equity_percentage: "",
    investment_type: "equity",
    additional_terms: "",
  })

  useEffect(() => {
    if (matchId) {
      loadMatchData()
    }
  }, [matchId])

  const loadMatchData = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase
        .from("matches")
        .select(
          `
          *,
          investor:investor_profiles!matches_investor_id_fkey(full_name, company_name),
          startup:startup_profiles!matches_startup_id_fkey(company_name, current_valuation)
        `,
        )
        .eq("id", matchId)
        .single()

      if (error) throw error

      setMatchData(data)

      // Pre-fill valuation if available
      if (data.startup?.current_valuation) {
        setFormData((prev) => ({
          ...prev,
          valuation: data.startup.current_valuation.toString(),
        }))
      }
    } catch (err: any) {
      setError(err.message || "Failed to load match data")
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

      if (!user || !matchId || !matchData) throw new Error("Missing required data")

      // Calculate equity percentage if not provided
      let equityPercentage = formData.equity_percentage ? Number.parseFloat(formData.equity_percentage) : null

      if (!equityPercentage && formData.investment_amount && formData.valuation) {
        equityPercentage = (Number.parseFloat(formData.investment_amount) / Number.parseFloat(formData.valuation)) * 100
      }

      // Create contract
      const { data: contract, error: contractError } = await supabase
        .from("contracts")
        .insert({
          match_id: matchId,
          investor_id: matchData.investor_id,
          startup_id: matchData.startup_id,
          investment_amount: Number.parseFloat(formData.investment_amount),
          valuation: formData.valuation ? Number.parseFloat(formData.valuation) : null,
          equity_percentage: equityPercentage,
          investment_type: formData.investment_type,
          terms: formData.additional_terms ? { notes: formData.additional_terms } : {},
          status: "proposed",
          proposed_by: user.id,
          version: 1,
        })
        .select()
        .single()

      if (contractError) throw contractError

      // Create notification for the other party
      const otherPartyId = user.id === matchData.investor_id ? matchData.startup_id : matchData.investor_id

      await supabase.from("notifications").insert({
        user_id: otherPartyId,
        type: "contract_proposal",
        title: "New Contract Proposal",
        message: `You have received a new contract proposal for $${(Number.parseFloat(formData.investment_amount) / 1000000).toFixed(2)}M`,
        link: `/contracts/${contract.id}`,
      })

      router.push(`/contracts/${contract.id}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || "Failed to create contract")
    } finally {
      setLoading(false)
    }
  }

  if (!matchId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-semibold mb-2">No Match Selected</h3>
            <p className="text-muted-foreground mb-6">Please select a match to create a contract</p>
            <Link href="/matches">
              <Button>View Matches</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

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

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create Contract Proposal</CardTitle>
            <CardDescription>
              {matchData && (
                <>
                  Proposing to{" "}
                  {matchData.startup?.company_name || matchData.investor?.full_name || matchData.investor?.company_name}
                </>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="investment_amount">
                  Investment Amount ($) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="investment_amount"
                  type="number"
                  placeholder="1000000"
                  value={formData.investment_amount}
                  onChange={(e) => setFormData({ ...formData, investment_amount: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">Enter the total investment amount in dollars</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="investment_type">
                  Investment Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.investment_type}
                  onValueChange={(value) => setFormData({ ...formData, investment_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INVESTMENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="valuation">Company Valuation ($)</Label>
                <Input
                  id="valuation"
                  type="number"
                  placeholder="10000000"
                  value={formData.valuation}
                  onChange={(e) => setFormData({ ...formData, valuation: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Pre-money valuation of the company</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="equity_percentage">Equity Percentage (%)</Label>
                <Input
                  id="equity_percentage"
                  type="number"
                  step="0.01"
                  placeholder="10.00"
                  value={formData.equity_percentage}
                  onChange={(e) => setFormData({ ...formData, equity_percentage: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.investment_amount && formData.valuation && !formData.equity_percentage
                    ? `Calculated: ${((Number.parseFloat(formData.investment_amount) / Number.parseFloat(formData.valuation)) * 100).toFixed(2)}%`
                    : "Leave blank to auto-calculate from investment amount and valuation"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additional_terms">Additional Terms</Label>
                <Textarea
                  id="additional_terms"
                  placeholder="Add any additional terms, conditions, or notes..."
                  value={formData.additional_terms}
                  onChange={(e) => setFormData({ ...formData, additional_terms: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h4 className="font-semibold">Summary</h4>
                <div className="text-sm space-y-1">
                  {formData.investment_amount && (
                    <p>
                      Investment:{" "}
                      <span className="font-medium">
                        ${Number.parseFloat(formData.investment_amount).toLocaleString()}
                      </span>
                    </p>
                  )}
                  {formData.valuation && (
                    <p>
                      Valuation:{" "}
                      <span className="font-medium">${Number.parseFloat(formData.valuation).toLocaleString()}</span>
                    </p>
                  )}
                  {(formData.equity_percentage || (formData.investment_amount && formData.valuation)) && (
                    <p>
                      Equity:{" "}
                      <span className="font-medium">
                        {formData.equity_percentage ||
                          (
                            (Number.parseFloat(formData.investment_amount) / Number.parseFloat(formData.valuation)) *
                            100
                          ).toFixed(2)}
                        %
                      </span>
                    </p>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Creating Proposal..." : "Send Proposal"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
