import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, FileText, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"

const statusConfig = {
  draft: { label: "Draft", icon: Clock, variant: "secondary" as const },
  proposed: { label: "Proposed", icon: AlertCircle, variant: "default" as const },
  negotiating: { label: "Negotiating", icon: Clock, variant: "default" as const },
  accepted: { label: "Accepted", icon: CheckCircle, variant: "default" as const },
  rejected: { label: "Rejected", icon: XCircle, variant: "destructive" as const },
  expired: { label: "Expired", icon: XCircle, variant: "secondary" as const },
}

export default async function ContractsPage() {
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

  // Get contracts
  const { data: contracts } = await supabase
    .from("contracts")
    .select(
      `
      *,
      match:matches!contracts_match_id_fkey(
        id,
        investor:investor_profiles!matches_investor_id_fkey(full_name, company_name),
        startup:startup_profiles!matches_startup_id_fkey(company_name)
      )
    `,
    )
    .or(`investor_id.eq.${user.id},startup_id.eq.${user.id}`)
    .order("created_at", { ascending: false })

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
          <h1 className="text-3xl font-bold mb-2">Contracts</h1>
          <p className="text-muted-foreground">Manage your investment deals and negotiations</p>
        </div>

        {!contracts || contracts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No contracts yet</h3>
              <p className="text-muted-foreground mb-6">
                Start negotiating deals with your matches to see contracts here
              </p>
              <Link href="/matches">
                <Button>View Matches</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {contracts.map((contract: any) => {
              const status = statusConfig[contract.status as keyof typeof statusConfig]
              const StatusIcon = status.icon

              return (
                <Card key={contract.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold">
                            {isInvestor
                              ? contract.match?.startup?.company_name
                              : contract.match?.investor?.full_name ||
                                contract.match?.investor?.company_name ||
                                "Investor"}
                          </h3>
                          <Badge variant={status.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div>
                            <div className="text-xs text-muted-foreground">Investment Amount</div>
                            <div className="font-semibold">${(contract.investment_amount / 1000000).toFixed(2)}M</div>
                          </div>

                          {contract.valuation && (
                            <div>
                              <div className="text-xs text-muted-foreground">Valuation</div>
                              <div className="font-semibold">${(contract.valuation / 1000000).toFixed(2)}M</div>
                            </div>
                          )}

                          {contract.equity_percentage && (
                            <div>
                              <div className="text-xs text-muted-foreground">Equity</div>
                              <div className="font-semibold">{contract.equity_percentage}%</div>
                            </div>
                          )}

                          <div>
                            <div className="text-xs text-muted-foreground">Type</div>
                            <div className="font-semibold capitalize">{contract.investment_type.replace("_", " ")}</div>
                          </div>
                        </div>

                        <div className="flex gap-3 mt-4">
                          <Link href={`/contracts/${contract.id}`}>
                            <Button size="sm" variant="outline" className="bg-transparent">
                              View Details
                            </Button>
                          </Link>
                          {contract.status === "proposed" && contract.proposed_by !== user.id && (
                            <Link href={`/contracts/${contract.id}`}>
                              <Button size="sm">Respond</Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
