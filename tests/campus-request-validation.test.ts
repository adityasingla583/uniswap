import test from "node:test";
import assert from "node:assert";

/**
 * Validation logic matching submitCampusRequest
 */
function validateCampusRequest(input: {
  name: string;
  latitude?: number;
  longitude?: number;
}) {
  const trimmed = input.name ? input.name.trim() : "";
  if (!trimmed || trimmed.length < 3) {
    return { valid: false, error: "Please enter a valid institute name (at least 3 characters)." };
  }

  const lat = typeof input.latitude === "number" && !isNaN(input.latitude) ? input.latitude : 20.5937;
  const lng = typeof input.longitude === "number" && !isNaN(input.longitude) ? input.longitude : 78.9629;

  if (lat < -90 || lat > 90) {
    return { valid: false, error: "Latitude must be between -90 and 90." };
  }

  if (lng < -180 || lng > 180) {
    return { valid: false, error: "Longitude must be between -180 and 180." };
  }

  return { valid: true, name: trimmed, latitude: lat, longitude: lng };
}

test("Campus Request Validation: rejects empty or whitespace-only name", () => {
  const res1 = validateCampusRequest({ name: "" });
  assert.strictEqual(res1.valid, false);

  const res2 = validateCampusRequest({ name: "   " });
  assert.strictEqual(res2.valid, false);
});

test("Campus Request Validation: rejects names shorter than 3 characters", () => {
  const res = validateCampusRequest({ name: "II" });
  assert.strictEqual(res.valid, false);
});

test("Campus Request Validation: defaults coordinates to India center if omitted", () => {
  const res = validateCampusRequest({ name: "New Institute of Science" });
  assert.strictEqual(res.valid, true);
  if (res.valid) {
    assert.strictEqual(res.latitude, 20.5937);
    assert.strictEqual(res.longitude, 78.9629);
  }
});

test("Campus Request Validation: preserves valid coordinates when provided", () => {
  const res = validateCampusRequest({
    name: "IIIT Dharwad",
    latitude: 15.3929,
    longitude: 75.0253,
  });
  assert.strictEqual(res.valid, true);
  if (res.valid) {
    assert.strictEqual(res.latitude, 15.3929);
    assert.strictEqual(res.longitude, 75.0253);
  }
});
