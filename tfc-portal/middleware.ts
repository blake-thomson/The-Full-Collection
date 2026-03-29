import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
        sameSite: "lax" as const,
        secure: true,
      },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // Public pages — no auth required
  const publicPaths = ["/login", "/team/login", "/team/setup", "/team/accept", "/checkout", "/reset-password", "/setup"];
  if (publicPaths.some((p) => path.startsWith(p))) {
    return supabaseResponse;
  }

  // API routes — handled by the routes themselves
  if (path.startsWith("/api/")) {
    return supabaseResponse;
  }

  // Protected pages — redirect to login if not authenticated
  if (!user) {
    const loginUrl = path.startsWith("/team/")
      ? new URL("/team/login", request.url)
      : new URL("/login", request.url);
    const redirect = NextResponse.redirect(loginUrl);
    // Carry over any cookie updates from the session refresh attempt
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirect.cookies.set(cookie.name, cookie.value);
    });
    return redirect;
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
