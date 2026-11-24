import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

const SCHEMA_VERSION = "v9-freemium-verification-2026-11-24";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
  schemaVersion: string | undefined;
};

// Reset cached client if schema has been regenerated
if (globalForPrisma.schemaVersion !== SCHEMA_VERSION) {
  if (globalForPrisma.prisma) {
    try {
      globalForPrisma.prisma.$disconnect();
    } catch {
      // ignore
    }
  }
  globalForPrisma.prisma = undefined;
  globalForPrisma.schemaVersion = SCHEMA_VERSION;
}

const pool =
  globalForPrisma.pool ??
  new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 20000,
    ssl: connectionString?.includes("supabase.co") ? { rejectUnauthorized: false } : undefined,
    keepAlive: true,
  });
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

export { pool };

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}
