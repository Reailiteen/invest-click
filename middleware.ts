import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
          },
        },
      },
    )

    // Protected routes that require authentication
    const protectedRoutes = [
      "/dashboard",
      "/profile",
      "/matches",
      "/swipe",
      "/contracts",
      "/onboarding",
      "/analytics",
      "/notifications",
    ]
    const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

    // Public routes that don't need auth check
    const publicRoutes = ["/", "/login", "/signup"]
    const isPublicRoute = publicRoutes.some((route) => request.nextUrl.pathname === route)

    // Skip auth check for public routes
    if (isPublicRoute) {
      return supabaseResponse
    }

    // Only check auth for protected routes
    if (isProtectedRoute) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        // Redirect to login if accessing protected route without auth
        if (!user) {
          const url = request.nextUrl.clone()
          url.pathname = "/login"
          return NextResponse.redirect(url)
        }
      } catch (error) {
        console.error("[v0] Auth check failed:", error)
        // If auth check fails, redirect to login for protected routes
        const url = request.nextUrl.clone()
        url.pathname = "/login"
        return NextResponse.redirect(url)
      }
    }

    return supabaseResponse
  } catch (error) {
    console.error("[v0] Middleware error:", error)
    // If middleware fails completely, allow the request through
    // This prevents the entire app from breaking
    return supabaseResponse
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
