import "./setup";
import test from "node:test";
import assert from "node:assert";
import { pool } from "../lib/prisma";
import {
  submitCampusRequest,
} from "../server/campus-actions";

const hasDb = Boolean(process.env.DATABASE_URL);

test.after(async () => {
  if (hasDb) {
    try {
      await pool.query(`DELETE FROM "CampusRequest" WHERE name LIKE 'TEST_AUTO_%'`);
      await pool.query(`DELETE FROM "Campus" WHERE name LIKE 'TEST_AUTO_%'`);
      await pool.end();
    } catch {
      // ignore
    }
  }
});

test("Campus Workflow: submitCampusRequest rejects names shorter than 3 characters", { skip: !hasDb }, async () => {
  const result = await submitCampusRequest({ name: "AB" });
  assert.strictEqual(result.error, "Please enter a valid institute name (at least 3 characters).");
});

test("Campus Workflow: submitCampusRequest rejects already officially active campus", { skip: !hasDb }, async () => {
  const existing = await pool.query<{ name: string }>(`SELECT name FROM "Campus" LIMIT 1`);
  const activeCampusName = existing.rows[0]?.name || "Indian Institute of Technology, Bombay";
  const result = await submitCampusRequest({ name: activeCampusName });
  assert.ok(result.error && result.error.includes("already registered and active"));
});

test("Campus Workflow: successfully submits unique campus request", { skip: !hasDb }, async () => {
  const uniqueName = `TEST_AUTO_IIIT_${Date.now()}`;
  const result = await submitCampusRequest({
    name: uniqueName,
    city: "TestCity",
    state: "TestState",
    latitude: 25.1234,
    longitude: 82.5678,
    domain: "test.ac.in",
    requesterName: "Test Student",
    requesterEmail: "student@test.ac.in",
  });

  assert.strictEqual(result.success, true);
  assert.ok(result.requestId);

  // Attempting to submit the exact same pending campus again should be rejected
  const dupResult = await submitCampusRequest({
    name: uniqueName,
  });
  assert.ok(dupResult.error && dupResult.error.includes("already exists"));
});
