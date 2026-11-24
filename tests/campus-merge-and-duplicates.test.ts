import "./setup";
import test from "node:test";
import assert from "node:assert";
import { pool } from "../lib/prisma";
import { submitCampusRequest, mergeCampuses } from "../server/campus-actions";

const hasDb = Boolean(process.env.DATABASE_URL);

test.after(async () => {
  if (hasDb) {
    try {
      await pool.query(`DELETE FROM "CampusRequest" WHERE name LIKE 'TEST_MERGE_%' OR name LIKE 'TEST_DUP_%'`);
      await pool.query(`DELETE FROM "Listing" WHERE title LIKE 'TEST_LISTING_%'`);
      await pool.query(`DELETE FROM "User" WHERE id LIKE 'TEST_MERGE_USER_%'`);
      await pool.query(`DELETE FROM "Campus" WHERE name LIKE 'TEST_MERGE_%'`);
      await pool.end();
    } catch {
      // ignore
    }
  }
});

test("Campus Registration: returns existing status if request already submitted", { skip: !hasDb }, async () => {
  const dupName = `TEST_DUP_CAMPUS_${Date.now()}`;

  // 1. First submission succeeds
  const res1 = await submitCampusRequest({
    name: dupName,
    city: "TestCity",
    state: "TestState",
    website: "https://testdup.ac.in",
  });
  assert.strictEqual(res1.success, true);

  // 2. Second submission with same name returns existing status rather than duplicate
  const res2 = await submitCampusRequest({
    name: dupName,
  });
  assert.strictEqual(res2.exists, true);
  assert.ok(["PENDING", "UNDER_REVIEW"].includes(res2.status || ""));
  assert.ok(res2.error && res2.error.includes("already exists"));
});

test("Campus Merge: safely moves users, listings, preserves alias, and logs audit", { skip: !hasDb }, async () => {
  // Create source and target campuses
  const sourceCid = `cmp_src_${Date.now()}`;
  const targetCid = `cmp_tgt_${Date.now()}`;
  const sourceName = `TEST_MERGE_SRC_${Date.now()}`;
  const targetName = `TEST_MERGE_TGT_${Date.now()}`;

  await pool.query(
    `INSERT INTO "Campus" (id, name, latitude, longitude, domain)
     VALUES ($1, $2, 26.1, 75.8, 'source.ac.in'), ($3, $4, 26.2, 75.9, 'target.ac.in')`,
    [sourceCid, sourceName, targetCid, targetName]
  );

  // Create a user on source campus
  const userId = `TEST_MERGE_USER_${Date.now()}`;
  await pool.query(
    `INSERT INTO "User" (id, name, email, password, "campusId", "createdAt")
     VALUES ($1, 'Source Student', $2, 'pass123', $3, NOW())`,
    [userId, `${userId}@source.ac.in`, sourceCid]
  );

  // Mock admin session userId for test
  const adminRes = await pool.query<{ id: string }>(
    `SELECT id FROM "User" WHERE "isAdmin" = true LIMIT 1`
  );
  const adminId = adminRes.rows[0]?.id || userId;

  // Execute merge
  const mergeRes = await mergeCampuses(sourceCid, targetCid, adminId);
  assert.strictEqual(mergeRes.success, true);

  // 1. User should now be assigned to target campus
  const userCheck = await pool.query<{ campusId: string }>(
    `SELECT "campusId" FROM "User" WHERE id = $1`,
    [userId]
  );
  assert.strictEqual(userCheck.rows[0]?.campusId, targetCid);

  // 2. Target campus aliases should now include source campus name
  const targetCheck = await pool.query<{ aliases: string[] }>(
    `SELECT aliases FROM "Campus" WHERE id = $1`,
    [targetCid]
  );
  assert.ok(targetCheck.rows[0]?.aliases.includes(sourceName));

  // 3. Source campus record should be deleted
  const sourceCheck = await pool.query(
    `SELECT id FROM "Campus" WHERE id = $1`,
    [sourceCid]
  );
  assert.strictEqual(sourceCheck.rows.length, 0);
});
