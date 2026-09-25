/** @format */

import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3001;

/**
 * Comma-separated Browserless endpoints, tried in order.
 * e.g. BROWSERLESS_URL="ws://host1:3222?token=A,ws://host2:3000?token=B"
 */
const BROWSERLESS_URLS: string[] = (process.env.BROWSERLESS_URL || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Legacy single-value export (first endpoint) for compat.
const BROWSERLESS_URL = BROWSERLESS_URLS[0];

export { PORT, BROWSERLESS_URL, BROWSERLESS_URLS };
