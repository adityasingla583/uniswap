import "./setup";
import test from "node:test";
import assert from "node:assert";
import { isPrivateOrReservedIp, normalizeWebsiteUrl } from "../lib/ssrf-filter";
import { runAiCampusVerification } from "../server/ai-verification";

test("SSRF Filter: strictly blocks local loopback IPs", () => {
  assert.strictEqual(isPrivateOrReservedIp("127.0.0.1"), true);
  assert.strictEqual(isPrivateOrReservedIp("127.255.255.255"), true);
  assert.strictEqual(isPrivateOrReservedIp("::1"), true);
});

test("SSRF Filter: strictly blocks RFC-1918 private IP subnets", () => {
  assert.strictEqual(isPrivateOrReservedIp("10.0.0.1"), true);
  assert.strictEqual(isPrivateOrReservedIp("10.254.1.1"), true);
  assert.strictEqual(isPrivateOrReservedIp("172.16.0.1"), true);
  assert.strictEqual(isPrivateOrReservedIp("172.31.255.254"), true);
  assert.strictEqual(isPrivateOrReservedIp("192.168.1.1"), true);
  assert.strictEqual(isPrivateOrReservedIp("192.168.0.254"), true);
});

test("SSRF Filter: strictly blocks Cloud Metadata and Link-Local IPs", () => {
  // AWS / Azure / GCP Metadata IP
  assert.strictEqual(isPrivateOrReservedIp("169.254.169.254"), true);
  assert.strictEqual(isPrivateOrReservedIp("169.254.1.1"), true);
  assert.strictEqual(isPrivateOrReservedIp("fe80::1"), true);
});

test("SSRF Filter: allows public routable IP addresses", () => {
  assert.strictEqual(isPrivateOrReservedIp("8.8.8.8"), false);
  assert.strictEqual(isPrivateOrReservedIp("1.1.1.1"), false);
  assert.strictEqual(isPrivateOrReservedIp("14.139.241.1"), false);
});

test("URL Normalizer: extracts registered domain and formats canonical URL", () => {
  const r1 = normalizeWebsiteUrl("http://www.iiitkota.ac.in/about-us?lang=en#contact");
  assert.strictEqual(r1.isValid, true);
  assert.strictEqual(r1.domain, "iiitkota.ac.in");
  assert.strictEqual(r1.normalizedUrl, "http://www.iiitkota.ac.in");

  const r2 = normalizeWebsiteUrl("iitb.ac.in");
  assert.strictEqual(r2.isValid, true);
  assert.strictEqual(r2.domain, "iitb.ac.in");
  assert.strictEqual(r2.normalizedUrl, "https://iitb.ac.in");
});

test("URL Normalizer: rejects raw IP addresses and invalid schemes", () => {
  const r1 = normalizeWebsiteUrl("http://192.168.1.10/admin");
  assert.strictEqual(r1.isValid, false);

  const r2 = normalizeWebsiteUrl("ftp://campus.ac.in");
  assert.strictEqual(r2.isValid, false);
});

test("AI Verification: rejects disposable domain registrars (.tk, .ml)", async () => {
  const result = await runAiCampusVerification({
    institutionName: "Fake Technology College",
    websiteUrl: "https://fakecampus.tk",
  });

  assert.strictEqual(result.recommendation, "REJECT");
  assert.ok(result.riskFactors.some((f) => f.includes("free/disposable domain")));
});
