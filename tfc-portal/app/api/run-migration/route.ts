import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  // One-time migration: change date columns to timestamptz
  // Uses the Supabase database connection string from env
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!dbUrl) {
    // Fallback: use supabase project connection with service role
    // Supabase exposes POSTGRES_URL or we construct it
    return NextResponse.json({
      error: "No DATABASE_URL or POSTGRES_URL env var. Add one to Vercel.",
      hint: "Go to Supabase Dashboard > Settings > Database > Connection string (URI) and add it as DATABASE_URL in Vercel env vars",
    }, { status: 500 });
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  try {
    // Check current types first
    const check = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'kanban_cards'
      AND column_name IN ('shoot_date', 'edit_deadline', 'publish_date')
    `);

    const currentTypes = check.rows;
    const alreadyMigrated = currentTypes.every(
      (r: { data_type: string }) => r.data_type.includes("timestamp")
    );

    if (alreadyMigrated) {
      await pool.end();
      return NextResponse.json({ message: "Already migrated", types: currentTypes });
    }

    // Run the migration
    await pool.query(`
      ALTER TABLE kanban_cards
        ALTER COLUMN shoot_date TYPE timestamptz USING shoot_date::timestamptz,
        ALTER COLUMN edit_deadline TYPE timestamptz USING edit_deadline::timestamptz,
        ALTER COLUMN publish_date TYPE timestamptz USING publish_date::timestamptz;
    `);

    // Verify
    const verify = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'kanban_cards'
      AND column_name IN ('shoot_date', 'edit_deadline', 'publish_date')
    `);

    await pool.end();
    return NextResponse.json({ success: true, types: verify.rows });
  } catch (err: unknown) {
    await pool.end().catch(() => {});
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
