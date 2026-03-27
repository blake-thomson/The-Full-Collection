import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import { requireTeamMember } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  const serverSupabase = createServerSupabase();
  const { data: { user } } = await serverSupabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createSupabaseAdmin();
  const access = await requireTeamMember(user.email!, supabase);
  if (!access.ok) return access.response;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  // Validate file type and size
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, WebP, and GIF files are allowed" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File must be under 5MB" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `${user.id}-${Date.now()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
  const avatarUrl = urlData.publicUrl;

  // Update team member's avatar_url
  const { error: updateError } = await supabase
    .from("team_members")
    .update({ avatar_url: avatarUrl })
    .eq("email", user.email!);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ avatar_url: avatarUrl });
}
