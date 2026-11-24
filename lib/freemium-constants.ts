export const DAILY_FREE_MESSAGE_LIMIT = 100;

/**
 * Returns today's date in configured timezone (default: Asia/Kolkata, UTC+5:30)
 * Format: "YYYY-MM-DD"
 */
export function getTodayDateString(timeZone: string = "Asia/Kolkata"): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(new Date());
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}
