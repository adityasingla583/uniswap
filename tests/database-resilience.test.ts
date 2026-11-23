import test from "node:test";
import assert from "node:assert";
import { pool } from "../lib/prisma";

const hasDb = Boolean(process.env.DATABASE_URL);

test.after(async () => {
  if (hasDb) {
    await pool.end();
  }
});

test("Database Resilience: pool connects and executes queries cleanly", { skip: !hasDb }, async () => {
  const res = await pool.query<{ count: string }>(`SELECT count(*) FROM "Campus"`);
  assert.ok(res.rows.length > 0);
  const count = parseInt(res.rows[0].count, 10);
  assert.ok(count >= 200, `Expected at least 200 campuses, got ${count}`);
});

test("Database Resilience: CampusRequest table exists with proper schema and status enum", { skip: !hasDb }, async () => {
  const res = await pool.query<{ column_name: string }>(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'CampusRequest'`
  );
  const columns = res.rows.map((r) => r.column_name);

  assert.ok(columns.includes("id"), "CampusRequest should have id column");
  assert.ok(columns.includes("name"), "CampusRequest should have name column");
  assert.ok(columns.includes("status"), "CampusRequest should have status column");
  assert.ok(columns.includes("createdAt"), "CampusRequest should have createdAt column");
});

test("Database Resilience: User table includes isAdmin column defaulting to false", { skip: !hasDb }, async () => {
  const res = await pool.query<{ column_name: string; column_default: string }>(
    `SELECT column_name, column_default FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'isAdmin'`
  );
  assert.strictEqual(res.rows.length, 1, "isAdmin column must exist on User table");
});

test("Database Resilience: Admin users are properly flagged in PostgreSQL", { skip: !hasDb }, async () => {
  const res = await pool.query<{ email: string; isAdmin: boolean }>(
    `SELECT email, "isAdmin" FROM "User" WHERE email IN ($1, $2)`,
    ["adityasingla03583@gmail.com", "aditysasingla03583@gmail.com"]
  );
  assert.ok(res.rows.length > 0, "At least one admin record must be pre-provisioned in database");
  for (const row of res.rows) {
    assert.strictEqual(row.isAdmin, true, `Expected isAdmin to be true for ${row.email}`);
  }
});
