import { getSupabaseBrowserClient } from "./supabase/client"

export async function trackEvent(eventType: string, eventData?: Record<string, any>) {
  try {
    const supabase = getSupabaseBrowserClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    await supabase.from("analytics_events").insert({
      user_id: user.id,
      event_type: eventType,
      event_data: eventData || {},
    })
  } catch (error) {
    console.error("[v0] Error tracking event:", error)
  }
}
