import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export default async function ProfilePage() {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user role
  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

  // Redirect to role-specific profile edit page
  if (userData?.role === "investor") {
    redirect("/profile/investor")
  } else if (userData?.role === "startup") {
    redirect("/profile/startup")
  }

  return null
}
