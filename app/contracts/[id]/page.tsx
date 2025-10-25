"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { ArrowLeft, CheckCircle, XCircle, Edit, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"

const statusConfig = {
  draft: { label: "Draft", icon: Clock, variant: "secondary" as const, color: "text-muted-foreground" },
  proposed: { label: "Proposed", icon: AlertCircle, variant: "default" as const, color: "text-blue-600" },
  negotiating: { label: "Negotiating", icon: Clock, variant: "default" as const, color: "text-yellow-600" },
  accepted: { label: "Accepted", icon: CheckCircle, variant: "default" as const, color: "text-green-600" },
  rejected: { label: "Rejected", icon: XCircle, variant: "destructive" as const, color: "text-red-600" },
  expired: { label: "Expired", icon: XCircle, variant: "secondary" as const, color: "text-muted-foreground" },
}

export default function ContractDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [contract, setContract] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState("")
  const [isEditing, setIsEditing] = useState(false)

  const [counterOffer, setCounterOffer] = useState({
    investment_amount: "",
    valuation: "",
    equity_percentage: "",
    comment: "",
  })

  useEffect(() => {
    loadContract()
  }, [params.id])

  const loadContract = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      setCurrentUser(user)

      const { data, error } = await supabase
        .from("contracts")
        .select(
          `
          *,
          match:matches!contracts_match_id_fkey(
            id,
            investor:investor_profiles!matches_investor_id_fkey(full_name, company_name),
            startup:startup_profiles!matches_startup_id_fkey(company_name)
          ),
          history:contract_history(*)
        `,
        )
        .eq("id", params.id)
        .single()

      if (error) throw error

      setContract(data)

      // Pre-fill counter offer with current values
      setCounterOffer({
        investment_amount: data.investment_amount.toString(),
        valuation: data.valuation?.toString() || "",
        equity_percentage: data.equity_percentage?.toString() || "",
        comment: "",
      })
    } catch (err: any) {
      setError(err.message || "Failed to load contract")
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    setActionLoading(true)
    setError("")

    try {
      const supabase = getSupabaseBrowserClient()

      const { error: updateError } = await supabase.from("contracts").update({ status: "accepted" }).eq("id", params.id)

      if (updateError) throw updateError

      // Create notification
      const otherPartyId = currentUser.id === contract.investor_id ? contract.startup_id : contract.investor_id

      await supabase.from("notifications").insert({
        user_id: otherPartyId,
        type: "contract_update",
        title: "Contract Accepted!",
        message: "Your contract proposal has been accepted",
        link: `/contracts/${params.id}`,
      })

      await loadContract()
    } catch (err: any) {
      setError(err.message || "Failed to accept contract")
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    setActionLoading(true)
    setError("")

    try {
      const supabase = getSupabaseBrowserClient()

      const { error: updateError } = await supabase.from("contracts").update({ status: "rejected" }).eq("id", params.id)

      if (updateError) throw updateError

      // Create notification
      const otherPartyId = currentUser.id === contract.investor_id ? contract.startup_id : contract.investor_id

      await supabase.from("notifications").insert({
        user_id: otherPartyId,
        type: "contract_update",
        title: "Contract Rejected",
        message: "Your contract proposal has been rejected",
        link: `/contracts/${params.id}`,
      })

      await loadContract()
    } catch (err: any) {
      setError(err.message || "Failed to reject contract")
    } finally {
      setActionLoading(false)
    }
  }

  const handleCounterOffer = async () => {
    setActionLoading(true)
    setError("")

    try {
      const supabase = getSupabaseBrowserClient()

      // Calculate equity if not provided
      let equityPercentage = counterOffer.equity_percentage ? Number.parseFloat(counterOffer.equity_percentage) : null

      if (!equityPercentage && counterOffer.investment_amount && counterOffer.valuation) {
        equityPercentage =
          (Number.parseFloat(counterOffer.investment_amount) / Number.parseFloat(counterOffer.valuation)) * 100
      }

      // Record changes in history
      const changes = {
        investment_amount: {
          old: contract.investment_amount,
          new: Number.parseFloat(counterOffer.investment_amount),
        },
        valuation: {
          old: contract.valuation,
          new: counterOffer.valuation ? Number.parseFloat(counterOffer.valuation) : null,
        },
        equity_percentage: {
          old: contract.equity_percentage,
          new: equityPercentage,
        },
      }

      await supabase.from("contract_history").insert({
        contract_id: params.id,
        changed_by: currentUser.id,
        changes,
        comment: counterOffer.comment || null,
      })

      // Update contract
      const { error: updateError } = await supabase
        .from("contracts")
        .update({
          investment_amount: Number.parseFloat(counterOffer.investment_amount),
          valuation: counterOffer.valuation ? Number.parseFloat(counterOffer.valuation) : null,
          equity_percentage: equityPercentage,
          status: "negotiating",
          version: contract.version + 1,
        })
        .eq("id", params.id)

      if (updateError) throw updateError

      // Create notification
      const otherPartyId = currentUser.id === contract.investor_id ? contract.startup_id : contract.investor_id

      await supabase.from("notifications").insert({
        user_id: otherPartyId,
        type: "contract_update",
        title: "Counter Offer Received",
        message: "A counter offer has been made on your contract proposal",
        link: `/contracts/${params.id}`,
      })

      setIsEditing(false)
      await loadContract()
    } catch (err: any) {
      setError(err.message || "Failed to submit counter offer")
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <p>Loading contract...</p>
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-semibold mb-2">Contract Not Found</h3>
            <p className="text-muted-foreground mb-6">The contract you're looking for doesn't exist</p>
            <Link href="/contracts">
              <Button>View All Contracts</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const status = statusConfig[contract.status as keyof typeof statusConfig]
  const StatusIcon = status.icon
  const isInvestor = currentUser?.id === contract.investor_id
  const canRespond = contract.status === "proposed" && contract.proposed_by !== currentUser?.id
  const canNegotiate = contract.status === "negotiating" || canRespond

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/contracts" className="flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Contracts</span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">
                      Contract with{" "}
                      {isInvestor
                        ? contract.match?.startup?.company_name
                        : contract.match?.investor?.full_name || contract.match?.investor?.company_name}
                    </CardTitle>
                    <CardDescription>Version {contract.version}</CardDescription>
                  </div>
                  <Badge variant={status.variant} className="gap-1">
                    <StatusIcon className="h-3 w-3" />
                    {status.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Contract Terms */}
                <div>
                  <h3 className="font-semibold mb-4">Contract Terms</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Investment Amount</div>
                      <div className="text-2xl font-bold">${(contract.investment_amount / 1000000).toFixed(2)}M</div>
                    </div>

                    {contract.valuation && (
                      <div className="p-4 border rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Valuation</div>
                        <div className="text-2xl font-bold">${(contract.valuation / 1000000).toFixed(2)}M</div>
                      </div>
                    )}

                    {contract.equity_percentage && (
                      <div className="p-4 border rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Equity</div>
                        <div className="text-2xl font-bold">{contract.equity_percentage.toFixed(2)}%</div>
                      </div>
                    )}

                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Investment Type</div>
                      <div className="text-lg font-semibold capitalize">
                        {contract.investment_type.replace("_", " ")}
                      </div>
                    </div>
                  </div>
                </div>

                {contract.terms?.notes && (
                  <div>
                    <h3 className="font-semibold mb-2">Additional Terms</h3>
                    <p className="text-muted-foreground">{contract.terms.notes}</p>
                  </div>
                )}

                <Separator />

                {/* Counter Offer Form */}
                {isEditing && canNegotiate && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                    <h3 className="font-semibold">Make Counter Offer</h3>

                    <div className="space-y-2">
                      <Label htmlFor="counter_investment_amount">Investment Amount ($)</Label>
                      <Input
                        id="counter_investment_amount"
                        type="number"
                        value={counterOffer.investment_amount}
                        onChange={(e) => setCounterOffer({ ...counterOffer, investment_amount: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="counter_valuation">Valuation ($)</Label>
                      <Input
                        id="counter_valuation"
                        type="number"
                        value={counterOffer.valuation}
                        onChange={(e) => setCounterOffer({ ...counterOffer, valuation: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="counter_equity">Equity Percentage (%)</Label>
                      <Input
                        id="counter_equity"
                        type="number"
                        step="0.01"
                        value={counterOffer.equity_percentage}
                        onChange={(e) => setCounterOffer({ ...counterOffer, equity_percentage: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="counter_comment">Comment</Label>
                      <Textarea
                        id="counter_comment"
                        placeholder="Explain your counter offer..."
                        value={counterOffer.comment}
                        onChange={(e) => setCounterOffer({ ...counterOffer, comment: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleCounterOffer} disabled={actionLoading}>
                        {actionLoading ? "Submitting..." : "Submit Counter Offer"}
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)} disabled={actionLoading}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Negotiation History */}
                {contract.history && contract.history.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-4">Negotiation History</h3>
                    <div className="space-y-3">
                      {contract.history.map((entry: any) => (
                        <div key={entry.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                              {entry.changed_by === contract.investor_id ? "Investor" : "Startup"} made changes
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(entry.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {entry.comment && <p className="text-sm text-muted-foreground mb-2">{entry.comment}</p>}
                          <div className="text-xs space-y-1">
                            {entry.changes.investment_amount && (
                              <p>
                                Investment: ${(entry.changes.investment_amount.old / 1000000).toFixed(2)}M → $
                                {(entry.changes.investment_amount.new / 1000000).toFixed(2)}M
                              </p>
                            )}
                            {entry.changes.valuation && (
                              <p>
                                Valuation: ${(entry.changes.valuation.old / 1000000).toFixed(2)}M → $
                                {(entry.changes.valuation.new / 1000000).toFixed(2)}M
                              </p>
                            )}
                            {entry.changes.equity_percentage && (
                              <p>
                                Equity: {entry.changes.equity_percentage.old?.toFixed(2)}% →{" "}
                                {entry.changes.equity_percentage.new?.toFixed(2)}%
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {contract.status === "accepted" && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>This contract has been accepted by both parties.</AlertDescription>
                  </Alert>
                )}

                {contract.status === "rejected" && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>This contract has been rejected.</AlertDescription>
                  </Alert>
                )}

                {canRespond && (
                  <>
                    <Button className="w-full gap-2" onClick={handleAccept} disabled={actionLoading}>
                      <CheckCircle className="h-4 w-4" />
                      Accept Contract
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full gap-2 bg-transparent"
                      onClick={() => setIsEditing(true)}
                      disabled={actionLoading || isEditing}
                    >
                      <Edit className="h-4 w-4" />
                      Counter Offer
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full gap-2"
                      onClick={handleReject}
                      disabled={actionLoading}
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  </>
                )}

                {contract.status === "negotiating" && !isEditing && (
                  <Button
                    variant="outline"
                    className="w-full gap-2 bg-transparent"
                    onClick={() => setIsEditing(true)}
                    disabled={actionLoading}
                  >
                    <Edit className="h-4 w-4" />
                    Make Counter Offer
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contract Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Created</div>
                  <div className="font-medium">{new Date(contract.created_at).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Last Updated</div>
                  <div className="font-medium">{new Date(contract.updated_at).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Version</div>
                  <div className="font-medium">{contract.version}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
