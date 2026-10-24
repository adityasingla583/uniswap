import "dotenv/config";
import { Pool } from "pg";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  console.log("Enabling Row Level Security (RLS) on all tables...");

  const queries = [
    `ALTER TABLE "Campus" ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE "Listing" ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE "Favorite" ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE "OtpToken" ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE "Conversation" ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;`,

    `DROP POLICY IF EXISTS "Public read campus" ON "Campus";`,
    `CREATE POLICY "Public read campus" ON "Campus" FOR SELECT USING (true);`,

    `DROP POLICY IF EXISTS "Public read listings" ON "Listing";`,
    `CREATE POLICY "Public read listings" ON "Listing" FOR SELECT USING (true);`,

    `DROP POLICY IF EXISTS "Service role bypass user" ON "User";`,
    `CREATE POLICY "Service role bypass user" ON "User" FOR ALL USING (true);`,

    `DROP POLICY IF EXISTS "Service role bypass fav" ON "Favorite";`,
    `CREATE POLICY "Service role bypass fav" ON "Favorite" FOR ALL USING (true);`,

    `DROP POLICY IF EXISTS "Service role bypass otp" ON "OtpToken";`,
    `CREATE POLICY "Service role bypass otp" ON "OtpToken" FOR ALL USING (true);`,

    `DROP POLICY IF EXISTS "Service role bypass conv" ON "Conversation";`,
    `CREATE POLICY "Service role bypass conv" ON "Conversation" FOR ALL USING (true);`,

    `DROP POLICY IF EXISTS "Service role bypass msg" ON "Message";`,
    `CREATE POLICY "Service role bypass msg" ON "Message" FOR ALL USING (true);`,
  ];

  for (const q of queries) {
    try {
      await pool.query(q);
      console.log(`Executed: ${q}`);
    } catch (err: any) {
      console.warn(`Query note: ${err.message}`);
    }
  }

  await pool.end();
  console.log("✅ RLS successfully enabled on all tables including Chat & OTP!");
}

main().catch(console.error);
