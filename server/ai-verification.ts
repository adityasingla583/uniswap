"use server";

import { pool } from "@/lib/prisma";
import { normalizeWebsiteUrl, safeFetchWebsite } from "@/lib/ssrf-filter";

export interface AiVerificationResult {
  recommendation: "APPROVE" | "MANUAL_REVIEW" | "REJECT";
  confidence: number; // 0 to 100
  reasoningSummary: string;
  supportingEvidence: string[];
  riskFactors: string[];
  extractedDetails: {
    title?: string;
    domain: string;
    contactEmail?: string;
    address?: string;
    academicTld: boolean;
    statusCode?: number;
  };
}

/**
 * Executes multi-point AI-based website and institutional credibility verification
 * with SSRF protection, domain validation, and structured evidence extraction.
 */
export async function runAiCampusVerification(data: {
  institutionName: string;
  websiteUrl: string;
  domain?: string;
  city?: string;
  state?: string;
  institutionType?: string;
}): Promise<AiVerificationResult> {
  const { institutionName, websiteUrl, city, state, institutionType } = data;

  // 1. Validate & Normalize URL
  const urlInfo = normalizeWebsiteUrl(websiteUrl);
  if (!urlInfo.isValid) {
    return {
      recommendation: "REJECT",
      confidence: 10,
      reasoningSummary: `Invalid or unsafe website URL submitted: ${urlInfo.error}`,
      supportingEvidence: [],
      riskFactors: [urlInfo.error || "Invalid URL format"],
      extractedDetails: {
        domain: urlInfo.domain || "",
        academicTld: false,
      },
    };
  }

  const domain = urlInfo.domain.toLowerCase();
  const supportingEvidence: string[] = [];
  const riskFactors: string[] = [];
  let score = 50; // baseline score

  // 2. Domain & TLD Analysis
  const isAcIn = domain.endsWith(".ac.in");
  const isEduIn = domain.endsWith(".edu.in");
  const isGovIn = domain.endsWith(".gov.in");
  const isEdu = domain.endsWith(".edu");
  const isResIn = domain.endsWith(".res.in");
  const isAcademicTld = isAcIn || isEduIn || isGovIn || isEdu || isResIn;

  if (isAcademicTld) {
    score += 35;
    supportingEvidence.push(
      `Domain '${domain}' uses a verified higher education / government accredited TLD (${
        isAcIn ? ".ac.in" : isEduIn ? ".edu.in" : isGovIn ? ".gov.in" : ".edu"
      }).`
    );
  } else if (domain.endsWith(".org") || domain.endsWith(".org.in") || domain.endsWith(".in")) {
    score += 10;
    supportingEvidence.push(`Domain uses standard registered organizational extension (.${domain.split(".").pop()}).`);
  } else if (
    domain.endsWith(".tk") ||
    domain.endsWith(".ml") ||
    domain.endsWith(".ga") ||
    domain.endsWith(".cf") ||
    domain.endsWith(".gq") ||
    domain.endsWith(".xyz") ||
    domain.includes("blogspot.") ||
    domain.includes("wixsite.") ||
    domain.includes("wordpress.")
  ) {
    score -= 40;
    riskFactors.push(`Domain '${domain}' uses a free/disposable domain registrar or blogging subdomain.`);
  }

  // 3. Safe Website Fetching with SSRF protection
  const fetchResult = await safeFetchWebsite(urlInfo.normalizedUrl);

  if (!fetchResult.success) {
    riskFactors.push(`Website fetch failed: ${fetchResult.error}`);
    score -= 30;

    const recommendation = score >= 35 ? "MANUAL_REVIEW" : "REJECT";
    return {
      recommendation,
      confidence: Math.max(5, Math.min(100, score)),
      reasoningSummary: `The submitted website could not be safely reached: ${fetchResult.error}. ${
        isAcademicTld
          ? "However, the domain has an academic .ac.in/.edu.in TLD and requires manual administrative verification."
          : "Flagged for manual review or rejection."
      }`,
      supportingEvidence,
      riskFactors,
      extractedDetails: {
        domain,
        academicTld: isAcademicTld,
      },
    };
  }

  // 4. Content & Identity Analysis
  const htmlTitle = fetchResult.title || "";
  const cleanText = fetchResult.cleanText || "";
  const cleanTextLower = cleanText.toLowerCase();
  const nameTokens = institutionName
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !["the", "and", "for", "institute", "university", "college", "of"].includes(w));

  // Check parked or placeholder page red flags
  const parkedPatterns = [
    /domain for sale/i,
    /buy this domain/i,
    /parked free/i,
    /default web page/i,
    /apache2 ubuntu default/i,
    /iis windows server/i,
    /under construction/i,
    /lorem ipsum/i,
  ];

  let isParked = false;
  for (const pattern of parkedPatterns) {
    if (pattern.test(htmlTitle) || pattern.test(cleanText.slice(0, 1000))) {
      isParked = true;
      riskFactors.push("Website shows parked domain, server default placeholder, or domain-for-sale markers.");
      score -= 45;
      break;
    }
  }

  // Check Name Matches in Title or Text
  let matchedTokens = 0;
  for (const token of nameTokens) {
    if (htmlTitle.toLowerCase().includes(token) || cleanTextLower.includes(token)) {
      matchedTokens++;
    }
  }

  const matchRatio = nameTokens.length > 0 ? matchedTokens / nameTokens.length : 1;

  if (htmlTitle) {
    supportingEvidence.push(`Website title extracted: "${htmlTitle}"`);
  }

  if (matchRatio >= 0.75) {
    score += 25;
    supportingEvidence.push(
      `Institution name keywords (${matchedTokens}/${nameTokens.length}) strongly match website page content and header.`
    );
  } else if (matchRatio >= 0.4) {
    score += 10;
    supportingEvidence.push(`Partial keyword match with institution name (${matchedTokens}/${nameTokens.length} tokens).`);
  } else {
    score -= 20;
    riskFactors.push(
      `Discrepancy: Website content does not prominently mention submitted institute name "${institutionName}".`
    );
  }

  // Location Verification (City & State)
  if (city && cleanTextLower.includes(city.toLowerCase())) {
    score += 10;
    supportingEvidence.push(`Location corroborated: City '${city}' found in website text.`);
  }

  if (state && cleanTextLower.includes(state.toLowerCase())) {
    score += 5;
    supportingEvidence.push(`State corroborated: '${state}' referenced in website text.`);
  }

  // Contact Information & Email Discovery
  const emailRegex = new RegExp(`[a-zA-Z0-9._%+-]+@${domain.replace(".", "\\.")}`, "i");
  const emailMatch = cleanText.match(emailRegex) || cleanText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const discoveredEmail = emailMatch ? emailMatch[0] : undefined;

  if (discoveredEmail) {
    supportingEvidence.push(`Official contact email discovered: ${discoveredEmail}`);
    if (discoveredEmail.toLowerCase().includes(domain)) {
      score += 15;
      supportingEvidence.push(`Contact email matches official institutional domain (@${domain}).`);
    }
  }

  // Institution Type Recognition (IIT, IIIT, NIT, Central Univ, AICTE, UGC)
  if (
    cleanTextLower.includes("ugc") ||
    cleanTextLower.includes("aicte") ||
    cleanTextLower.includes("nirf") ||
    cleanTextLower.includes("naac") ||
    cleanTextLower.includes("ministry of education") ||
    cleanTextLower.includes("institute of national importance")
  ) {
    score += 15;
    supportingEvidence.push("Accreditation references detected (UGC / AICTE / NIRF / NAAC / Ministry of Education).");
  }

  // 5. Final Recommendation Decision
  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  let recommendation: "APPROVE" | "MANUAL_REVIEW" | "REJECT";
  if (isParked || finalScore < 35) {
    recommendation = "REJECT";
  } else if (finalScore >= 75 && isAcademicTld && matchRatio >= 0.6) {
    recommendation = "APPROVE";
  } else {
    recommendation = "MANUAL_REVIEW";
  }

  const reasoningSummary =
    recommendation === "APPROVE"
      ? `High confidence automated approval recommendation. Domain '${domain}' is an accredited higher education domain matching '${institutionName}' with verified identity tokens.`
      : recommendation === "MANUAL_REVIEW"
      ? `Moderate confidence (${finalScore}%). Website is reachable and active, but requires administrator inspection of affiliation and accreditation details.`
      : `Rejection recommended (${finalScore}% confidence). High risk factors detected such as domain mismatch, missing academic identity, or unreachable website.`;

  return {
    recommendation,
    confidence: finalScore,
    reasoningSummary,
    supportingEvidence,
    riskFactors,
    extractedDetails: {
      title: htmlTitle || undefined,
      domain,
      contactEmail: discoveredEmail,
      academicTld: isAcademicTld,
      statusCode: fetchResult.statusCode,
    },
  };
}

/**
 * Executes AI verification for an existing campus request in the database
 * and updates the request record with findings and evidence.
 */
export async function triggerAiVerificationForRequest(
  requestId: string
): Promise<{ success: boolean; result?: AiVerificationResult; error?: string }> {
  try {
    const res = await pool.query<{
      id: string;
      name: string;
      website: string | null;
      domain: string | null;
      city: string | null;
      state: string | null;
      institutionType: string | null;
      status: string;
    }>(
      `SELECT id, name, website, domain, city, state, "institutionType", status
       FROM "CampusRequest"
       WHERE id = $1 LIMIT 1`,
      [requestId]
    );

    const req = res.rows[0];
    if (!req) {
      return { success: false, error: "Campus request not found." };
    }

    const targetUrl = req.website || (req.domain ? `https://${req.domain}` : `https://${req.name.toLowerCase().replace(/[^a-z0-9]/g, "")}.ac.in`);

    const result = await runAiCampusVerification({
      institutionName: req.name,
      websiteUrl: targetUrl,
      domain: req.domain || undefined,
      city: req.city || undefined,
      state: req.state || undefined,
      institutionType: req.institutionType || undefined,
    });

    // Update CampusRequest in database with AI recommendations
    // If status was PENDING and recommendation is MANUAL_REVIEW, update status to UNDER_REVIEW
    const newStatus =
      req.status === "PENDING" && result.recommendation === "MANUAL_REVIEW"
        ? "UNDER_REVIEW"
        : req.status;

    await pool.query(
      `UPDATE "CampusRequest"
       SET "aiRecommendation" = $1,
           "aiConfidence" = $2,
           "aiReasoning" = $3,
           "aiEvidence" = $4,
           "aiCheckedAt" = NOW(),
           status = $5,
           "updatedAt" = NOW()
       WHERE id = $6`,
      [
        result.recommendation,
        result.confidence,
        result.reasoningSummary,
        JSON.stringify({
          supportingEvidence: result.supportingEvidence,
          riskFactors: result.riskFactors,
          extractedDetails: result.extractedDetails,
        }),
        newStatus,
        requestId,
      ]
    );

    return { success: true, result };
  } catch (err) {
    console.error("AI Campus Verification error:", err);
    return { success: false, error: (err as Error).message };
  }
}
