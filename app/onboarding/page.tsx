import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export default async function OnboardingPage() {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user role
  const { data: userData } = await supabase
    .from("users")
    .select("role, onboarding_completed")
    .eq("id", user.id)
    .single()

  if (!userData) {
    redirect("/login")
  }

  // If already completed, redirect to dashboard
  if (userData.onboarding_completed) {
    redirect("/dashboard")
  }

  // Redirect to role-specific onboarding
  if (userData.role === "investor") {
    redirect("/onboarding/investor")
  } else if (userData.role === "startup") {
    redirect("/onboarding/startup")
  }

  return null
}
