import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { requireTeamMember } from "@/lib/auth-helpers";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

const BUCKET = "reports";

async function ensureBucket(admin: ReturnType<typeof createSupabaseAdmin>) {
  const { data: buckets } = await admin.storage.listBuckets();
  if (!buckets?.find((b) => b.name === BUCKET)) {
    await admin.storage.createBucket(BUCKET, { public: false });
  }
}

// POST /api/reports/generate
export async function POST(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createSupabaseAdmin();
  const teamCheck = await requireTeamMember(user.email!, admin);
  if (!teamCheck.ok) return teamCheck.response;

  const body = await req.json();
  const { clientId, month } = body;

  if (!clientId || !month) {
    return NextResponse.json(
      { error: "clientId and month (YYYY-MM-DD) are required" },
      { status: 400 }
    );
  }

  // 1. Fetch client info
  const { data: client, error: clientErr } = await admin
    .from("clients")
    .select("id, name, email, onboarding_data")
    .eq("id", clientId)
    .single();

  if (clientErr || !client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // 2. Calculate month range
  const monthStart = new Date(month);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);

  // 3. Fetch posted scheduled_posts + joined kanban_cards for titles
  const { data: posts } = await admin
    .from("scheduled_posts")
    .select("id, platform, caption, posted_at, scheduled_for, card_id, kanban_cards(title)")
    .eq("client_id", clientId)
    .eq("status", "posted")
    .gte("scheduled_for", monthStart.toISOString())
    .lt("scheduled_for", monthEnd.toISOString());

  const postedPosts = posts || [];

  // 4. Fetch post_metrics for those posts
  const postIds = postedPosts.map((p) => p.id);
  let metrics: Array<{
    scheduled_post_id: string;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    reach: number;
    impressions: number;
    follower_growth: number;
  }> = [];

  if (postIds.length > 0) {
    const { data: metricsData } = await admin
      .from("post_metrics")
      .select("*")
      .in("scheduled_post_id", postIds);
    metrics = metricsData || [];
  }

  // 5. Aggregate metrics
  const totalViews = metrics.reduce((s, m) => s + (m.views || 0), 0);
  const totalLikes = metrics.reduce((s, m) => s + (m.likes || 0), 0);
  const totalShares = metrics.reduce((s, m) => s + (m.shares || 0), 0);
  const totalComments = metrics.reduce((s, m) => s + (m.comments || 0), 0);
  const totalSaves = metrics.reduce((s, m) => s + (m.saves || 0), 0);
  const totalFollowerGrowth = metrics.reduce((s, m) => s + (m.follower_growth || 0), 0);

  // Find top performing post by views
  let topPost = { title: "N/A", views: 0 };
  if (metrics.length > 0) {
    const topMetric = metrics.reduce((best, m) =>
      (m.views || 0) > best.views ? { ...m, views: m.views || 0 } : best,
      { scheduled_post_id: "", views: 0 } as { scheduled_post_id: string; views: number }
    );
    const matchingPost = postedPosts.find((p) => p.id === topMetric.scheduled_post_id);
    const cardData = matchingPost?.kanban_cards as unknown as { title: string } | null;
    topPost = {
      title: cardData?.title || matchingPost?.caption || "Untitled",
      views: topMetric.views,
    };
  }

  const industry =
    (client.onboarding_data as Record<string, unknown>)?.industry ||
    (client.onboarding_data as Record<string, unknown>)?.niche ||
    "general";

  const monthLabel = monthStart.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // 6. Call Anthropic for executive summary
  let summary = "";
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `You are a content strategist writing a monthly performance report for a client.
Client: ${client.name}, Industry: ${industry}
This month they published ${postedPosts.length} pieces of content.
Total views: ${totalViews}, Total likes: ${totalLikes}, Total shares: ${totalShares}
Top performing post: "${topPost.title}" with ${topPost.views} views
Write a professional 200-word executive summary of this month's content performance.
Be specific, reference actual numbers, and end with 1-2 strategic recommendations for next month.`,
        },
      ],
    });
    const block = message.content[0];
    summary = block.type === "text" ? block.text : "";
  } catch {
    summary = `${client.name} published ${postedPosts.length} pieces of content in ${monthLabel}. Total views: ${totalViews}. Total likes: ${totalLikes}. Total shares: ${totalShares}. Top performing post: "${topPost.title}" with ${topPost.views} views.`;
  }

  // 7. Build metrics snapshot
  const metricsSnapshot = {
    totalPosts: postedPosts.length,
    totalViews,
    totalLikes,
    totalShares,
    totalComments,
    totalSaves,
    totalFollowerGrowth,
    topPost,
    summary,
    posts: postedPosts.map((p) => {
      const cardData = p.kanban_cards as unknown as { title: string } | null;
      return {
        title: cardData?.title || p.caption || "Untitled",
        platform: p.platform,
        date: p.posted_at || p.scheduled_for,
      };
    }),
  };

  // 8. Generate HTML report as PDF-ready content
  const htmlContent = buildReportHTML({
    clientName: client.name,
    monthLabel,
    summary,
    metrics: metricsSnapshot,
  });

  // 9. Upload HTML as a file to Supabase Storage (will serve as the report)
  await ensureBucket(admin);
  const storagePath = `${clientId}/${month}.html`;

  const { error: uploadErr } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, new Blob([htmlContent], { type: "text/html" }), {
      upsert: true,
      contentType: "text/html",
    });

  if (uploadErr) {
    return NextResponse.json({ error: `Upload failed: ${uploadErr.message}` }, { status: 500 });
  }

  // 10. Create/update client_reports record
  const { data: report, error: reportErr } = await admin
    .from("client_reports")
    .upsert(
      {
        client_id: clientId,
        month,
        generated_at: new Date().toISOString(),
        pdf_storage_path: storagePath,
        metrics_snapshot: metricsSnapshot,
      },
      { onConflict: "client_id,month" }
    )
    .select()
    .single();

  if (reportErr) {
    return NextResponse.json({ error: reportErr.message }, { status: 500 });
  }

  // 11. Get signed URL (7 days)
  const { data: signed } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 60 * 60 * 24 * 7);

  return NextResponse.json({
    id: report.id,
    pdfUrl: signed?.signedUrl || null,
  });
}

// ── Build branded HTML report ────────────────────────────────
function buildReportHTML({
  clientName,
  monthLabel,
  summary,
  metrics,
}: {
  clientName: string;
  monthLabel: string;
  summary: string;
  metrics: {
    totalPosts: number;
    totalViews: number;
    totalLikes: number;
    totalShares: number;
    totalFollowerGrowth: number;
    posts: Array<{ title: string; platform: string; date: string }>;
  };
}) {
  const postRows = metrics.posts
    .map(
      (p) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #252525;color:#F0EDE6;font-size:14px;">${p.title}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #252525;color:#A8A49C;font-size:14px;text-transform:capitalize;">${p.platform}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #252525;color:#A8A49C;font-size:14px;">${new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${clientName} — ${monthLabel} Report</title>
<style>
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .page-break { page-break-before: always; } }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#0A0A0A; color:#F0EDE6; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
  .page { min-height:100vh; padding:60px 40px; display:flex; flex-direction:column; }
  .brand { color:#E02020; font-weight:800; font-size:14px; letter-spacing:0.28em; text-transform:uppercase; }
</style>
</head>
<body>

<!-- Page 1: Cover -->
<div class="page" style="justify-content:center;align-items:center;text-align:center;">
  <p class="brand" style="margin-bottom:40px;">THE FULL COLLECTION</p>
  <h1 style="font-size:42px;font-weight:700;margin-bottom:16px;color:#F0EDE6;">${clientName}</h1>
  <p style="font-size:22px;color:#A8A49C;margin-bottom:8px;">${monthLabel}</p>
  <p style="font-size:16px;color:#5A5652;">Monthly Performance Report</p>
</div>

<!-- Page 2: Executive Summary -->
<div class="page page-break">
  <p class="brand" style="margin-bottom:32px;">THE FULL COLLECTION</p>
  <h2 style="font-size:28px;margin-bottom:24px;color:#F0EDE6;">Executive Summary</h2>
  <div style="background:#111111;border:1px solid #252525;border-radius:16px;padding:32px;line-height:1.8;color:#A8A49C;font-size:15px;">
    ${summary.split("\n").map((line) => `<p style="margin-bottom:12px;">${line}</p>`).join("")}
  </div>
</div>

<!-- Page 3: Key Metrics -->
<div class="page page-break">
  <p class="brand" style="margin-bottom:32px;">THE FULL COLLECTION</p>
  <h2 style="font-size:28px;margin-bottom:24px;color:#F0EDE6;">Key Metrics</h2>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
    ${[
      { label: "Total Views", value: metrics.totalViews.toLocaleString() },
      { label: "Total Likes", value: metrics.totalLikes.toLocaleString() },
      { label: "Total Shares", value: metrics.totalShares.toLocaleString() },
      { label: "Follower Growth", value: (metrics.totalFollowerGrowth >= 0 ? "+" : "") + metrics.totalFollowerGrowth.toLocaleString() },
    ]
      .map(
        (m) => `
    <div style="background:#111111;border:1px solid #252525;border-radius:16px;padding:32px;text-align:center;">
      <p style="font-size:36px;font-weight:700;color:#F0EDE6;margin-bottom:8px;">${m.value}</p>
      <p style="font-size:13px;color:#5A5652;text-transform:uppercase;letter-spacing:0.08em;">${m.label}</p>
    </div>`
      )
      .join("")}
  </div>
</div>

<!-- Page 4: Content Published -->
<div class="page page-break">
  <p class="brand" style="margin-bottom:32px;">THE FULL COLLECTION</p>
  <h2 style="font-size:28px;margin-bottom:24px;color:#F0EDE6;">Content Published</h2>
  ${
    metrics.posts.length > 0
      ? `<table style="width:100%;border-collapse:collapse;">
    <thead>
      <tr style="border-bottom:2px solid #252525;">
        <th style="text-align:left;padding:10px 12px;color:#5A5652;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;">Title</th>
        <th style="text-align:left;padding:10px 12px;color:#5A5652;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;">Platform</th>
        <th style="text-align:left;padding:10px 12px;color:#5A5652;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;">Date</th>
      </tr>
    </thead>
    <tbody>${postRows}</tbody>
  </table>`
      : `<p style="color:#5A5652;font-size:15px;">No content was published this month.</p>`
  }
</div>

<!-- Page 5: Footer -->
<div class="page page-break" style="justify-content:center;align-items:center;text-align:center;">
  <p class="brand" style="margin-bottom:16px;">THE FULL COLLECTION</p>
  <p style="color:#5A5652;font-size:14px;">Produced by The Full Collection</p>
  <p style="color:#5A5652;font-size:12px;margin-top:8px;">thefullcollection.com</p>
</div>

</body>
</html>`;
}
