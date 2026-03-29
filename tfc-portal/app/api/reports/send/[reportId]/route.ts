import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { requireTeamMember } from "@/lib/auth-helpers";
import { sendReportEmail } from "@/lib/report-emails";

// POST /api/reports/send/[reportId]
export async function POST(
  _req: NextRequest,
  { params }: { params: { reportId: string } }
) {
  const serverSupabase = createServerSupabase();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createSupabaseAdmin();
  const teamCheck = await requireTeamMember(user.email!, admin);
  if (!teamCheck.ok) return teamCheck.response;

  // Fetch the report
  const { data: report, error: reportErr } = await admin
    .from("client_reports")
    .select("*, clients(name, email)")
    .eq("id", params.reportId)
    .single();

  if (reportErr || !report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const client = report.clients as unknown as { name: string; email: string } | null;
  if (!client?.email) {
    return NextResponse.json({ error: "Client email not found" }, { status: 400 });
  }

  // Get signed URL for the report (7 days)
  const { data: signed } = await admin.storage
    .from("reports")
    .createSignedUrl(report.pdf_storage_path, 60 * 60 * 24 * 7);

  if (!signed?.signedUrl) {
    return NextResponse.json({ error: "Could not generate download URL" }, { status: 500 });
  }

  const monthDate = new Date(report.month);
  const monthLabel = monthDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Send email
  try {
    await sendReportEmail({
      to: client.email,
      clientName: client.name,
      monthLabel,
      downloadUrl: signed.signedUrl,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Email failed: ${err instanceof Error ? err.message : "Unknown error"}` },
      { status: 500 }
    );
  }

  // Update sent_at and sent_to
  await admin
    .from("client_reports")
    .update({
      sent_at: new Date().toISOString(),
      sent_to: client.email,
    })
    .eq("id", params.reportId);

  return NextResponse.json({ success: true, sentTo: client.email });
}
