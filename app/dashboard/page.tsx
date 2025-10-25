import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export default async function DashboardPage() {
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

  // Redirect to onboarding if not completed
  if (userData && !userData.onboarding_completed) {
    redirect("/onboarding")
  }

  // Redirect to role-specific dashboard
  if (userData?.role === "investor") {
    redirect("/dashboard/investor")
  } else if (userData?.role === "startup") {
    redirect("/dashboard/startup")
  }

  return null
}
