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
  "YYYY/MM/DD",
  "YYYY-MM-DDTHH:mm:ssZ",
  "HH:mm:ss",
  "MM-DD-YYYY HH:mm",
  "DD/MM/YYYY HH:mm",
  "MMMM D, YYYY h:mm a",
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

  // Relative times: "5 minutes ago", "2 hours ago", "3 days ago"
  if (/ago/i.test(trimmed)) {
    const match = trimmed.match(/(\d+)\s*(minute|hour|day|week|month|year)s?/i);
    if (!match) return null;
    const amount = parseInt(match[1], 10);
    const unitRaw = match[2].toLowerCase();
    const unit =
      unitRaw.startsWith("minute") ? "minute"
      : unitRaw.startsWith("hour") ? "hour"
      : unitRaw.startsWith("day") ? "day"
      : unitRaw.startsWith("week") ? "week"
      : unitRaw.startsWith("month") ? "month"
      : "year";
    return dayjs().tz(TIMEZONE).subtract(amount, unit).format();
  }

  // Try strict custom formats first, then loose/ISO parse in-zone.
  for (const fmt of FORMATS) {
    const d = dayjs.tz(trimmed, fmt, TIMEZONE);
    if (d.isValid()) return (d as dayjs.Dayjs).tz(TIMEZONE).format();
  }
  const loose = dayjs.tz(trimmed, TIMEZONE);
  if (loose.isValid()) return (loose as dayjs.Dayjs).tz(TIMEZONE).format();

  return null;
};

export default normalizeTime;
