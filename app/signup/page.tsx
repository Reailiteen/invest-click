"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { TrendingUp, Building2, User } from "lucide-react"

type UserRole = "investor" | "startup"

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<"role" | "credentials">("role")
  const [role, setRole] = useState<UserRole | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole)
    setStep("credentials")
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!role) return

    setError("")
    setLoading(true)

    try {
      const supabase = getSupabaseBrowserClient()

      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
        },
      })

      if (authError) throw authError

      if (authData.user) {
        // Create user record with role
        const { error: userError } = await supabase.from("users").insert({
          id: authData.user.id,
          email: authData.user.email!,
          role,
          onboarding_completed: false,
        })

        if (userError) throw userError

        // Redirect to onboarding
        router.push("/onboarding")
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || "Failed to create account")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Invest Click</span>
          </div>
          <CardTitle className="text-2xl text-center">
            {step === "role" ? "Choose Your Role" : "Create Your Account"}
          </CardTitle>
          <CardDescription className="text-center">
            {step === "role"
              ? "Are you an investor or a startup?"
              : `Sign up as ${role === "investor" ? "an investor" : "a startup"}`}
          </CardDescription>
        </CardHeader>

        {step === "role" ? (
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full h-24 flex flex-col gap-2 bg-transparent"
              onClick={() => handleRoleSelect("investor")}
            >
              <Building2 className="h-8 w-8" />
              <div>
                <div className="font-semibold">I'm an Investor</div>
                <div className="text-xs text-muted-foreground">Looking to invest in startups</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="w-full h-24 flex flex-col gap-2 bg-transparent"
              onClick={() => handleRoleSelect("startup")}
            >
              <User className="h-8 w-8" />
              <div>
                <div className="font-semibold">I'm a Startup</div>
                <div className="text-xs text-muted-foreground">Looking for investment</div>
              </div>
            </Button>
          </CardContent>
        ) : (
          <form onSubmit={handleSignup}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setStep("role")} className="w-full">
                ← Change role
              </Button>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Create Account"}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  )
}
