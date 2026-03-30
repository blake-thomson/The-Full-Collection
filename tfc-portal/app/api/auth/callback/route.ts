import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const portal = searchParams.get("portal") ?? "auto"; // 'client', 'team', or 'auto'
  const origin = req.nextUrl.origin;

  if (!code) {
    const dest = portal === "team" ? "/team/login" : "/login";
    return NextResponse.redirect(new URL(`${dest}?error=missing_code`, origin));
  }

  // We need to track cookies set during exchangeCodeForSession
  const cookieUpdates: { name: string; value: string; options: Record<string, unknown> }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach((c) => cookieUpdates.push(c));
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const dest = portal === "team" ? "/team/login" : "/login";
    return buildRedirect(new URL(`${dest}?error=auth_failed`, origin), cookieUpdates);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    const dest = portal === "team" ? "/team/login" : "/login";
    return buildRedirect(new URL(`${dest}?error=no_email`, origin), cookieUpdates);
  }

  const email = user.email.toLowerCase();

  // Check both tables to route intelligently
  const [{ data: teamMember }, { data: client }] = await Promise.all([
    supabase.from("team_members").select("id").eq("email", email).maybeSingle(),
    supabase.from("clients").select("onboarding_complete").eq("email", email).maybeSingle(),
  ]);

  // Route based on portal hint + what we find in the database
  if (portal === "team") {
    if (teamMember) {
      return buildRedirect(new URL("/team/portal", origin), cookieUpdates);
    }
    if (client) {
      // They're a client, not a team member — redirect to client dashboard
      return buildRedirect(
        new URL(client.onboarding_complete ? "/dashboard" : "/onboarding", origin),
        cookieUpdates
      );
    }
  } else if (portal === "client") {
    if (client) {
      return buildRedirect(
        new URL(client.onboarding_complete ? "/dashboard" : "/onboarding", origin),
        cookieUpdates
      );
    }
    if (teamMember) {
      // They're a team member, not a client — redirect to team portal
      return buildRedirect(new URL("/team/portal", origin), cookieUpdates);
    }
  } else {
    // Auto mode — check both and route to wherever they belong
    if (teamMember) {
      return buildRedirect(new URL("/team/portal", origin), cookieUpdates);
    }
    if (client) {
      return buildRedirect(
        new URL(client.onboarding_complete ? "/dashboard" : "/onboarding", origin),
        cookieUpdates
      );
    }
  }

  // No account found in either table — sign them out and show error
  await supabase.auth.signOut();
  const dest = portal === "team" ? "/team/login" : "/login";
  return buildRedirect(new URL(`${dest}?error=no_account`, origin), cookieUpdates);
}

function buildRedirect(
  url: URL,
  cookies: { name: string; value: string; options: Record<string, unknown> }[]
): NextResponse {
  const response = NextResponse.redirect(url);
  cookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
  });
  return response;
}
