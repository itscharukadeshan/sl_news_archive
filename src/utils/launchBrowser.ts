/** @format */

import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { BROWSERLESS_URLS } from "../config";

type ConnectedBrowser = Awaited<ReturnType<typeof puppeteer.connect>>;
type BrowserPage = Awaited<ReturnType<ConnectedBrowser["newPage"]>>;

export const PAGE_GOTO_TIMEOUT_MS = 15000;

// Register stealth exactly once at module load. Calling `puppeteer.use()`
// per-request (as before) stacks duplicate evasions and leaks memory.
let stealthRegistered = false;

function ensureStealth(useStealth: boolean): void {
  if (useStealth && !stealthRegistered) {
    puppeteer.use(StealthPlugin());
    stealthRegistered = true;
  }
}

// Eagerly register for the common case so `launchBrowser(false)` in one
// scraper (island.ts) can't silently disable stealth for the whole process.
ensureStealth(true);

export const launchBrowser = async (
  useStealth = true
): Promise<ConnectedBrowser> => {
  ensureStealth(useStealth);

  if (BROWSERLESS_URLS.length === 0) {
    throw new Error(
      "BROWSERLESS_URL is not set. Add it to your .env (see .env.example)."
    );
  }

  let lastError: unknown = null;
  for (const endpoint of BROWSERLESS_URLS) {
    try {
      return await puppeteer.connect({ browserWSEndpoint: endpoint });
    } catch (error) {
      lastError = error;
      console.error(`Browserless connect failed (${maskToken(endpoint)}), trying next...`);
    }
  }
  throw new Error(
    `All Browserless endpoints unreachable (${BROWSERLESS_URLS.length} tried). Last error: ${lastError}`
  );
};

/** Never log full tokens. */
function maskToken(endpoint: string): string {
  return endpoint.replace(/(token=)[^&]+/i, "$1***");
}

/** Detach from Browserless. `close()` on a connected browser kills the
 *  remote session; `disconnect()` just detaches. Try close, fall back to
 *  disconnect so we never leak a websocket. */
export const closeBrowser = async (browser: ConnectedBrowser): Promise<void> => {
  try {
    await browser.close();
  } catch {
    try {
      browser.disconnect();
    } catch {
      // ignore — nothing left to clean up
    }
  }
};

/**
 * Run `fn` with a fresh page and guarantee cleanup of both page and
 * browser connection, even when navigation or scraping throws.
 * This is the fix for the browser-connection leak: every previous scraper
 * called `launchBrowser()` + `newPage()` without a `finally` close.
 */
export const withPage = async <T>(
  fn: (page: BrowserPage) => Promise<T>,
  opts?: { navigationTimeoutMs?: number }
): Promise<T> => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  try {
    page.setDefaultNavigationTimeout(
      opts?.navigationTimeoutMs ?? PAGE_GOTO_TIMEOUT_MS
    );
    return await fn(page);
  } finally {
    try {
      await page.close();
    } catch {
      // page may already be closed by the remote end
    }
    await closeBrowser(browser);
  }
};
