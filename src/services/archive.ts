/** @format */

import path from "path";
import fs from "fs";
import pLimit from "p-limit";
import dayjs from "dayjs";

import { Urls } from "../constants/Urls";

import ada from "../scrapers/ada";
import adaderana from "../scrapers/adaderana";
import dailyMirror from "../scrapers/dailyMirror";
import economyNext from "../scrapers/economynext";
import island from "../scrapers/island";
import lankadeepa from "../scrapers/lankadeepa";
import tamilMirror from "../scrapers/tamilMirror";
import theMorning from "../scrapers/theMorning";
import thinakaran from "../scrapers/thinakaran";
import newsWire from "../scrapers/newsWire";
import type { ScraperFn } from "../types";

import { getBaseUrl } from "./url";
import { saveJsonToFile } from "../utils/saveData";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const ARCHIVE_ALL_CONCURRENCY = 4;
/** Cap on-disk history so `data/` doesn't grow forever. */
const MAX_ARCHIVE_FILES = 20;

const VALID_URLS = new Set<string>(Object.values(Urls));

/** Stable result keys matching the sl_news_archive_data repo layout
 *  (archive/<key>/...). Explicit map — never derive from URLs, so renames
 *  can't silently split history into new directories. */
const LEGACY_KEYS: Record<string, string> = {
  [Urls.ADADERANA_SINHALA]: "adaderana-sinhala",
  [Urls.ADADERANA_TAMIL]: "adaderana-tamil",
  [Urls.ADADERANA_ENGLISH]: "adaderana",
  [Urls.ARUNA]: "aruna",
  [Urls.THE_MORNING]: "themorning",
  [Urls.THAMILAN]: "thamilan",
  [Urls.THINAKARAN]: "thinakaran",
  [Urls.DINAMINA]: "dinamina",
  [Urls.DAILY_MIRROR]: "dailymirror",
  [Urls.TAMIL_MIRROR]: "tamilmirror",
  [Urls.LANKADEEPA]: "lankadeepa",
  [Urls.ISLAND]: "island",
  [Urls.ADA]: "ada",
  [Urls.ECONOMY_NEXT]: "economynext",
  [Urls.NEWS_WIRE]: "newswire",
};

function slugForUrl(url: string): string {
  return LEGACY_KEYS[url] ?? url;
}

type FetchSuccess = { success: true; data: unknown };
type FetchFailure = { success: false; error: unknown };
export type FetchResult = FetchSuccess | FetchFailure;

export function isValidArchiveUrl(url: string): boolean {
  return VALID_URLS.has(url);
}

async function retryFetch(
  handler: () => Promise<unknown>,
  retries: number = MAX_RETRIES
): Promise<FetchResult> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const data = await handler();
      return { success: true, data };
    } catch (error) {
      console.error(`Attempt ${attempt} failed: ${error}`);
      if (attempt === retries) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
      // Exponential backoff: 1s, 2s, 4s…
      await new Promise((resolve) =>
        setTimeout(resolve, RETRY_DELAY_MS * 2 ** (attempt - 1))
      );
    }
  }
  // Unreachable, but satisfies TS exhaustiveness.
  return { success: false, error: new Error("Retry loop exited unexpectedly") };
}

const urlHandlers: Record<string, ScraperFn> = {
  [Urls.ADADERANA_ENGLISH]: adaderana,
  [Urls.ADADERANA_SINHALA]: adaderana,
  [Urls.ADADERANA_TAMIL]: adaderana,
  [Urls.ARUNA]: theMorning,
  [Urls.THE_MORNING]: theMorning,
  [Urls.THAMILAN]: theMorning,
  [Urls.DAILY_MIRROR]: dailyMirror,
  [Urls.TAMIL_MIRROR]: tamilMirror,
  [Urls.ISLAND]: island,
  [Urls.LANKADEEPA]: lankadeepa,
  [Urls.ECONOMY_NEXT]: economyNext,
  [Urls.ADA]: ada,
  [Urls.THINAKARAN]: thinakaran,
  [Urls.DINAMINA]: thinakaran,
  [Urls.NEWS_WIRE]: newsWire,
};

export async function archive(url: string) {
  if (!isValidArchiveUrl(url)) {
    throw new Error(
      `Invalid URL: check the docs for valid URLs and try again. Valid URLs: ${[
        ...VALID_URLS,
      ].join(", ")}`
    );
  }

  return await urlHandlers[url](url);
}

function pruneDataDir(dataDir: string): void {
  try {
    const files = fs
      .readdirSync(dataDir)
      .filter((f) => f.startsWith("archive-") && f.endsWith(".json"))
      .map((f) => path.join(dataDir, f))
      .sort();
    const excess = files.length - MAX_ARCHIVE_FILES;
    for (let i = 0; i < excess; i++) {
      fs.unlinkSync(files[i]);
    }
  } catch {
    // best-effort: never fail a scrape because pruning failed
  }
}

// In-flight guard: a second `archiveAll` while one is running gets a 503
// instead of doubling Browserless sessions.
let archiveAllInFlight: Promise<{ [key: string]: FetchResult }> | null = null;

export function isArchiveAllBusy(): boolean {
  return archiveAllInFlight !== null;
}

export async function archiveAll(
  concurrency: number = ARCHIVE_ALL_CONCURRENCY
): Promise<{ [key: string]: FetchResult }> {
  if (archiveAllInFlight) return archiveAllInFlight;

  archiveAllInFlight = (async () => {
    const limit = pLimit(concurrency);

    const tasks = Object.values(Urls).map((url) =>
      limit(async () => {
        const baseUrl = getBaseUrl(url);
        console.log(`Archiving data from URL: ${baseUrl}`);
        const key = slugForUrl(url);
        const result = await retryFetch(() => archive(url), MAX_RETRIES);
        return { key, result } as const;
      })
    );

    const settled = await Promise.all(tasks);

    const results: { [key: string]: FetchResult } = {};
    for (const { key, result } of settled) {
      results[key] = result;
    }

    const dataDir = path.join(__dirname, "../data");
    const timestamp = dayjs().format("YYYY-MM-DD-HH-mm");
    const filePath = path.join(dataDir, `archive-${timestamp}-all.json`);

    fs.mkdirSync(dataDir, { recursive: true });
    await saveJsonToFile(results, filePath);
    pruneDataDir(dataDir);

    return results;
  })();

  try {
    return await archiveAllInFlight;
  } finally {
    archiveAllInFlight = null;
  }
}
