import dns from "dns/promises";
import net from "net";

/**
 * Checks whether an IP address is a private, loopback, link-local, or reserved address
 * to prevent Server-Side Request Forgery (SSRF) and cloud metadata access.
 */
export function isPrivateOrReservedIp(ip: string): boolean {
  if (!ip) return true;

  // IPv4 checks
  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
      return true;
    }

    // 127.0.0.0/8 (Loopback)
    if (parts[0] === 127) return true;

    // 10.0.0.0/8 (Private)
    if (parts[0] === 10) return true;

    // 172.16.0.0/12 (Private)
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

    // 192.168.0.0/16 (Private)
    if (parts[0] === 192 && parts[1] === 168) return true;

    // 169.254.0.0/16 (Link-local / AWS & GCP cloud metadata: 169.254.169.254)
    if (parts[0] === 169 && parts[1] === 254) return true;

    // 0.0.0.0/8 (Current network)
    if (parts[0] === 0) return true;

    // 100.64.0.0/10 (Carrier-grade NAT)
    if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) return true;

    // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved)
    if (parts[0] >= 224) return true;

    return false;
  }

  // IPv6 checks
  if (net.isIPv6(ip)) {
    const norm = ip.toLowerCase();
    // ::1 (Loopback)
    if (norm === "::1" || norm === "0:0:0:0:0:0:0:1") return true;
    // :: (Unspecified)
    if (norm === "::" || norm === "0:0:0:0:0:0:0:0") return true;
    // fe80::/10 (Link-local)
    if (norm.startsWith("fe8") || norm.startsWith("fe9") || norm.startsWith("fea") || norm.startsWith("feb")) {
      return true;
    }
    // fc00::/7 (Unique local address / private)
    if (norm.startsWith("fc") || norm.startsWith("fd")) {
      return true;
    }
    // IPv4-mapped IPv6 (::ffff:127.0.0.1)
    if (norm.startsWith("::ffff:")) {
      const ipv4Part = norm.replace("::ffff:", "");
      return isPrivateOrReservedIp(ipv4Part);
    }
    return false;
  }

  return true;
}

/**
 * Normalizes website URL and extracts registered institutional domain safely
 */
export function normalizeWebsiteUrl(rawUrl: string): {
  normalizedUrl: string;
  domain: string;
  isValid: boolean;
  error?: string;
} {
  const trimmed = (rawUrl || "").trim();
  if (!trimmed) {
    return { normalizedUrl: "", domain: "", isValid: false, error: "Website URL cannot be empty." };
  }

  // Reject unsupported protocols like ftp://, file://, gopher://, javascript:
  if (/^[a-z0-9+.-]+:\/\//i.test(trimmed) && !/^https?:\/\//i.test(trimmed)) {
    return {
      normalizedUrl: "",
      domain: "",
      isValid: false,
      error: "Only HTTP and HTTPS protocols are allowed.",
    };
  }

  let withProtocol = trimmed;
  if (!/^https?:\/\//i.test(trimmed)) {
    withProtocol = `https://${trimmed}`;
  }

  try {
    const parsed = new URL(withProtocol);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return {
        normalizedUrl: "",
        domain: "",
        isValid: false,
        error: "Only HTTP and HTTPS protocols are allowed.",
      };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Reject IP addresses directly submitted as institutional website
    if (net.isIP(hostname)) {
      return {
        normalizedUrl: "",
        domain: "",
        isValid: false,
        error: "Raw IP addresses are not permitted as official institutional websites.",
      };
    }

    // Strip 'www.' to extract the base registered domain
    let domain = hostname;
    if (domain.startsWith("www.")) {
      domain = domain.slice(4);
    }

    // Reconstruct clean canonical root URL
    const normalizedUrl = `${parsed.protocol}//${hostname}`;

    return {
      normalizedUrl,
      domain,
      isValid: true,
    };
  } catch {
    return {
      normalizedUrl: "",
      domain: "",
      isValid: false,
      error: "Please enter a valid website URL (e.g. https://iiitkota.ac.in).",
    };
  }
}

/**
 * Safely fetches an external institutional website with strict SSRF protection:
 * - Pre-fetch DNS resolution checking all IP records
 * - Rejection of private, local, and metadata IPs
 * - Strict 7-second timeout
 * - Max 500KB content size limit
 * - Safe manual redirect loop validation
 */
export async function safeFetchWebsite(
  targetUrl: string,
  maxRedirects: number = 3
): Promise<{
  success: boolean;
  error?: string;
  statusCode?: number;
  finalUrl?: string;
  html?: string;
  title?: string;
  metaDescription?: string;
  cleanText?: string;
}> {
  let currentUrl = targetUrl;
  let redirectsCount = 0;

  while (redirectsCount <= maxRedirects) {
    const urlValidation = normalizeWebsiteUrl(currentUrl);
    if (!urlValidation.isValid) {
      return { success: false, error: urlValidation.error || "Invalid URL" };
    }

    const parsed = new URL(urlValidation.normalizedUrl);
    const hostname = parsed.hostname;

    // 1. Pre-fetch DNS lookup to inspect every resolved IP against SSRF list
    try {
      const addresses = await dns.lookup(hostname, { all: true });
      if (!addresses || addresses.length === 0) {
        return { success: false, error: `Could not resolve hostname: ${hostname}` };
      }

      for (const addr of addresses) {
        if (isPrivateOrReservedIp(addr.address)) {
          return {
            success: false,
            error: `Security violation (SSRF): Host ${hostname} resolves to restricted address ${addr.address}`,
          };
        }
      }
    } catch (dnsErr) {
      return { success: false, error: `DNS resolution failed for ${hostname}: ${(dnsErr as Error).message}` };
    }

    // 2. Fetch with timeout and custom headers
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 7000);

      const response = await fetch(currentUrl, {
        signal: controller.signal,
        redirect: "manual", // Handle redirects manually to re-verify destination IPs
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) LocalLoop-Campus-Verifier/1.0",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      clearTimeout(timeout);

      // Handle Redirects
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) {
          return { success: false, error: "Redirect location missing from response" };
        }

        const nextUrl = new URL(location, currentUrl).toString();
        currentUrl = nextUrl;
        redirectsCount++;
        continue;
      }

      if (!response.ok) {
        return {
          success: false,
          statusCode: response.status,
          error: `Website returned HTTP status ${response.status}`,
        };
      }

      // 3. Read body with 500KB size cap
      const rawHtml = await response.text();
      const truncatedHtml = rawHtml.slice(0, 500 * 1024);

      // Extract title
      const titleMatch = truncatedHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : "";

      // Extract meta description
      const metaMatch = truncatedHtml.match(
        /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i
      ) || truncatedHtml.match(
        /<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i
      );
      const metaDescription = metaMatch ? metaMatch[1].trim() : "";

      // Clean HTML tags and scripts for text analysis
      const cleanText = truncatedHtml
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      return {
        success: true,
        statusCode: response.status,
        finalUrl: currentUrl,
        html: truncatedHtml,
        title,
        metaDescription,
        cleanText,
      };
    } catch (fetchErr) {
      const err = fetchErr as Error;
      if (err.name === "AbortError") {
        return { success: false, error: "Website connection timed out (7s limit reached)." };
      }
      return { success: false, error: `Website fetch failed: ${err.message}` };
    }
  }

  return { success: false, error: "Exceeded maximum allowed redirects (3 hops)." };
}
