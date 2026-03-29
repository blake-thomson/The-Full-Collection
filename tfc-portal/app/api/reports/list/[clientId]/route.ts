import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { requireClientAccess } from "@/lib/auth-helpers";

// GET /api/reports/[clientId]
export async function GET(
  _req: NextRequest,
  { params }: { params: { clientId: string } }
) {
  const serverSupabase = createServerSupabase();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createSupabaseAdmin();
  const access = await requireClientAccess(user.email!, params.clientId, admin);
  if (!access.ok) return access.response;

  const { data: reports, error } = await admin
    .from("client_reports")
    .select("*")
    .eq("client_id", params.clientId)
    .order("month", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Generate signed URLs for preview (1 hour)
  const reportsWithUrls = await Promise.all(
    (reports || []).map(async (report) => {
      let previewUrl: string | null = null;
      if (report.pdf_storage_path) {
        const { data: signed } = await admin.storage
          .from("reports")
          .createSignedUrl(report.pdf_storage_path, 60 * 60);
        previewUrl = signed?.signedUrl || null;
      }
      return { ...report, previewUrl };
    })
  );

  return NextResponse.json(reportsWithUrls);
}
