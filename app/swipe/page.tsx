import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import SwipeInterface from "@/components/swipe-interface"

export default async function SwipePage() {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Check if user is an investor
  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single()

  if (userData?.role !== "investor") {
    redirect("/dashboard")
  }

  // Get investor profile for filtering
  const { data: investorProfile } = await supabase.from("investor_profiles").select("*").eq("user_id", user.id).single()

  // Get startups that haven't been swiped yet
  const { data: alreadySwiped } = await supabase.from("swipes").select("startup_id").eq("investor_id", user.id)

  const swipedIds = alreadySwiped?.map((s) => s.startup_id) || []

  // Fetch startups (excluding already swiped)
  let query = supabase
    .from("startup_profiles")
    .select("*, user:users!startup_profiles_user_id_fkey(id, email)")
    .order("created_at", { ascending: false })
    .limit(20)

  if (swipedIds.length > 0) {
    query = query.not("user_id", "in", `(${swipedIds.join(",")})`)
  }

  const { data: startups } = await query

  return <SwipeInterface startups={startups || []} investorProfile={investorProfile} />
}
