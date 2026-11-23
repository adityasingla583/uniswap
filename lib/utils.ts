import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  if (price === 0) return "Free";
  return `\u20B9${Math.round(price).toLocaleString("en-IN")}`;
}

export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Normalizes user-submitted image URLs, converting publicly accessible
 * Google Drive share links into direct CDN image streams.
 */
export function normalizeImageUrl(url: string): string {
  if (!url) return "";
  const trimmed = url.trim();

  // 1. Google Drive share links
  if (
    trimmed.includes("drive.google.com") ||
    trimmed.includes("docs.google.com")
  ) {
    // Extract fileId from /file/d/FILE_ID or id=FILE_ID
    const match =
      trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
      trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);

    if (match && match[1]) {
      const fileId = match[1];
      // Google UserContent CDN serves public images directly with CORS and caching
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
  }

  // 2. Dropbox share links (change ?dl=0 to ?raw=1)
  if (trimmed.includes("dropbox.com") && trimmed.includes("dl=0")) {
    return trimmed.replace("dl=0", "raw=1");
  }

  return trimmed;
}
