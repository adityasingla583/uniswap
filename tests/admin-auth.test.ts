import test from "node:test";
import assert from "node:assert";

/**
 * Pure authorization check helper matching the platform logic in server/campus-actions.ts
 */
export function isUserAuthorizedAsAdmin(user: { email?: string | null; isAdmin?: boolean } | null | undefined): boolean {
  if (!user) return false;
  const emailLower = (user.email || "").trim().toLowerCase();
  return (
    user.isAdmin === true ||
    emailLower === "adityasingla03583@gmail.com" ||
    emailLower === "aditysasingla03583@gmail.com"
  );
}

test("Admin Auth: rejects unauthenticated session or null user", () => {
  assert.strictEqual(isUserAuthorizedAsAdmin(null), false);
  assert.strictEqual(isUserAuthorizedAsAdmin(undefined), false);
});

test("Admin Auth: authorizes primary owner email regardless of case", () => {
  assert.strictEqual(
    isUserAuthorizedAsAdmin({ email: "adityasingla03583@gmail.com", isAdmin: false }),
    true
  );
  assert.strictEqual(
    isUserAuthorizedAsAdmin({ email: "ADITYASINGLA03583@GMAIL.COM", isAdmin: false }),
    true
  );
});

test("Admin Auth: authorizes secondary owner email typo variant", () => {
  assert.strictEqual(
    isUserAuthorizedAsAdmin({ email: "aditysasingla03583@gmail.com", isAdmin: false }),
    true
  );
});

test("Admin Auth: authorizes any user with isAdmin=true flag", () => {
  assert.strictEqual(
    isUserAuthorizedAsAdmin({ email: "campus.lead@iiitkota.ac.in", isAdmin: true }),
    true
  );
});

test("Admin Auth: strictly rejects normal campus students without admin role", () => {
  assert.strictEqual(
    isUserAuthorizedAsAdmin({ email: "student@iiitkota.ac.in", isAdmin: false }),
    false
  );
  assert.strictEqual(
    isUserAuthorizedAsAdmin({ email: "randomuser@gmail.com", isAdmin: false }),
    false
  );
  assert.strictEqual(
    isUserAuthorizedAsAdmin({ email: "", isAdmin: false }),
    false
  );
});
