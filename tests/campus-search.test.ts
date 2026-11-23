import test from "node:test";
import assert from "node:assert";

/**
 * Acronym & synonym search logic tested identically to app/components/campus-combobox.tsx
 */
function matchesCampusSearch(campusName: string, query: string): boolean {
  const norm = campusName.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return true;
  if (norm.includes(q)) return true;

  // IIIT acronym matching
  if (
    (q === "iiit" || q.startsWith("iiit ")) &&
    (norm.includes("indian institute of information technology") || norm.includes("iiit"))
  ) {
    const rest = q.replace(/^iiit\s*/, "");
    return !rest || norm.includes(rest);
  }

  // IIT acronym matching
  if (
    (q === "iit" || q.startsWith("iit ")) &&
    (norm.includes("indian institute of technology") || norm.includes("iit"))
  ) {
    const rest = q.replace(/^iit\s*/, "");
    return !rest || norm.includes(rest);
  }

  // NIT acronym matching
  if (
    (q === "nit" || q.startsWith("nit ")) &&
    (norm.includes("national institute of technology") || norm.includes("nit"))
  ) {
    const rest = q.replace(/^nit\s*/, "");
    return !rest || norm.includes(rest);
  }

  return false;
}

test("Campus Search: matches direct substring", () => {
  assert.strictEqual(matchesCampusSearch("Indian Institute of Technology Bombay", "bombay"), true);
  assert.strictEqual(matchesCampusSearch("Delhi Technological University", "delhi"), true);
  assert.strictEqual(matchesCampusSearch("Birla Institute of Technology and Science, Pilani", "pilani"), true);
});

test("Campus Search: matches IIIT acronym expansions", () => {
  const iiitKota = "Indian Institute of Information Technology, Kota";
  const iiitAllahabad = "Indian Institute of Information Technology, Allahabad";
  const iitDelhi = "Indian Institute of Technology Delhi";

  assert.strictEqual(matchesCampusSearch(iiitKota, "iiit"), true);
  assert.strictEqual(matchesCampusSearch(iiitKota, "iiit kota"), true);
  assert.strictEqual(matchesCampusSearch(iiitAllahabad, "iiit allahabad"), true);

  // IIIT query should not accidentally match IIT Delhi
  assert.strictEqual(matchesCampusSearch(iitDelhi, "iiit"), false);
});

test("Campus Search: matches NIT acronym expansions", () => {
  const nitTrichy = "National Institute of Technology, Tiruchirappalli";
  assert.strictEqual(matchesCampusSearch(nitTrichy, "nit"), true);
  assert.strictEqual(matchesCampusSearch(nitTrichy, "nit tiruchirappalli"), true);
});

test("Campus Search: returns false when no match", () => {
  assert.strictEqual(matchesCampusSearch("Stanford University", "iiit"), false);
  assert.strictEqual(matchesCampusSearch("Harvard University", "delhi"), false);
});
