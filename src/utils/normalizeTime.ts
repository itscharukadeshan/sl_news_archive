/** @format */

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

const TIMEZONE = "Asia/Colombo";

const FORMATS = [
  "YYYY-MM-DD",
  "DD-MM-YYYY",
  "MM/DD/YYYY",
  "MMMM D, YYYY",
  "MMM D, YYYY",
  "YYYY/MM/DD",
  "YYYY-MM-DDTHH:mm:ssZ",
  "HH:mm:ss",
  "MM-DD-YYYY HH:mm",
  "DD/MM/YYYY HH:mm",
  "MMMM D, YYYY h:mm a",
  "MMMM D, YYYY hh:mm A",
  "MMM D, YYYY h:mm A",
  "MMM D, YYYY hh:mm A",
  "MMM DD, YYYY HH:mm",
  "MMM D, YYYY HH:mm",
];

const MISSING = new Set(["", "no title", "no timestamp", "no date", "no date available"]);

/**
 * Parse a source timestamp into an ISO string in Asia/Colombo.
 * Returns `null` for missing/unparseable input instead of silently
 * substituting "now" (the old moment fallback masked broken selectors).
 */
const normalizeTime = (input: string): string | null => {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed || MISSING.has(trimmed.toLowerCase())) return null;

  // Relative times: "5 minutes ago", "2 hours ago", "3 days ago",
  // plus short Next.js forms: "11m ago", "35m ago", "2h ago", "10s ago", "3d ago"
  if (/ago/i.test(trimmed)) {
    const longMatch = trimmed.match(
      /(\d+)\s*(second|minute|hour|day|week|month|year)s?/i
    );
    const shortMatch = trimmed.match(/(\d+)\s*([smhd])\b/i);
    const match = longMatch ?? shortMatch;
    if (!match) return null;
    const amount = parseInt(match[1], 10);
    const unitRaw = match[2].toLowerCase();
    const unit =
      unitRaw.startsWith("s") ? "second"
      : unitRaw.startsWith("minute") || unitRaw === "m" ? "minute"
      : unitRaw.startsWith("hour") || unitRaw === "h" ? "hour"
      : unitRaw.startsWith("day") || unitRaw === "d" ? "day"
      : unitRaw.startsWith("week") ? "week"
      : unitRaw.startsWith("month") ? "month"
      : "year";
    return dayjs().tz(TIMEZONE).subtract(amount, unit).format();
  }

  // Non-strict dayjs parsing accepts garbage ("Sep 25, 2026" as
  // YYYY-MM-DD -> year 2028), so strict-validate the shape first and
  // only then interpret the wall time in-zone.
  for (const fmt of FORMATS) {
    if (!dayjs(trimmed, fmt, true).isValid()) continue;
    const d = dayjs.tz(trimmed, fmt, TIMEZONE);
    if (d.isValid()) return (d as dayjs.Dayjs).tz(TIMEZONE).format();
  }
  const loose = dayjs.tz(trimmed, TIMEZONE);
  if (loose.isValid()) return (loose as dayjs.Dayjs).tz(TIMEZONE).format();

  return null;
};

export default normalizeTime;
