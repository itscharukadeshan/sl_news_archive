/** @format */
import { getBaseUrl } from "../services/url";
import { generateChecksum } from "../utils/generateChecksum";
import normalizeTime from "../utils/normalizeTime";
import { withPage } from "../utils/launchBrowser";
import type { ProcessedArticle } from "../types";

interface RawCard {
  href: string;
  title: string;
  summary: string;
  timeText: string;
  imageUrl: string;
}

/** Pages per run (user choice: first 2–3 pages). Exported for testing. */
export const MAX_PAGES = 3;

export function buildPageUrl(inputUrl: string, page: number): string {
  const parsed = new URL(inputUrl);
  parsed.searchParams.set("page", String(page));
  return parsed.toString();
}

/** Next.js flight payload embeds exact `publishedAt` per article id.
 *  Parse `\"id\":\"<id>\" ... \"publishedAt\":\"<iso>\"` pairs so the
 *  timestamp is exact instead of rounded from "11m ago". */
export function extractPublishedAtMap(html: string): Map<string, string> {
  const map = new Map<string, string>();
  const idRe = /\\"id\\":\\"([A-Za-z0-9]+)\\"/g;
  let m: RegExpExecArray | null;
  while ((m = idRe.exec(html)) !== null) {
    const id = m[1];
    if (map.has(id)) continue;
    const window = html.slice(m.index, m.index + 3000);
    const pub = window.match(/\\"publishedAt\\":\\"([^"\\]+)\\"/);
    if (pub) map.set(id, pub[1]);
  }
  // Fallback for unescaped JSON (if Next ever emits it raw).
  const rawRe = /"id":"([A-Za-z0-9]+)"/g;
  while ((m = rawRe.exec(html)) !== null) {
    const id = m[1];
    if (map.has(id)) continue;
    const window = html.slice(m.index, m.index + 3000);
    const pub = window.match(/"publishedAt":"([^"]+)"/);
    if (pub) map.set(id, pub[1]);
  }
  return map;
}

export function decodeNextImage(src: string): string {
  if (!src) return "";
  if (src.startsWith("/_next/image")) {
    try {
      const dummy = new URL(src, "https://placeholder.local");
      const inner = dummy.searchParams.get("url");
      if (inner) return decodeURIComponent(inner);
    } catch {
      return src;
    }
  }
  return src;
}

const CARD_ANCHOR = 'article a[href^="/news/"]';

const adaderana = async (url: string): Promise<ProcessedArticle[]> => {
  return withPage(async (page) => {
    const baseUrl = getBaseUrl(url) || "";
    const seen = new Map<string, ProcessedArticle>();

    const readCards = async (): Promise<{
      cards: RawCard[];
      pubMap: Map<string, string>;
    }> => {
      await page.waitForSelector(CARD_ANCHOR, { timeout: 15000 });
      const cards = await page.evaluate((): RawCard[] => {
        const anchors = [
          ...document.querySelectorAll('article a[href^="/news/"]'),
        ] as HTMLAnchorElement[];
        return anchors.map((a) => {
          const href = a.getAttribute("href")?.trim() || "";
          const paras = [...a.querySelectorAll("p")];
          const title =
            paras[0]?.textContent?.trim() ||
            (a.querySelector("img")?.getAttribute("alt")?.trim() ?? "") ||
            "No title";
          const summary = paras
            .slice(1)
            .map((p) => p.textContent?.trim() || "")
            .filter(Boolean)
            .join(" ")
            .trim();
          const text = a.textContent || "";
          const timeMatch = text.match(
            /(\d+\s*(?:s|m|h|d|seconds?|minutes?|hours?|days?|weeks?|months?|years?)\s*ago|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}[^|]*)/i
          );
          const timeText = (timeMatch?.[1] || "").trim();
          const img =
            a.querySelector("img")?.getAttribute("src")?.trim() || "";
          return { href, title, summary, timeText, imageUrl: img };
        });
      });
      const html = await page.content();
      return { cards, pubMap: extractPublishedAtMap(html) };
    };

    const merge = (cards: RawCard[], pubMap: Map<string, string>): number => {
      let fresh = 0;
      for (const card of cards) {
        if (!card.href) continue;
        const resolvedUrl = `${baseUrl}${card.href}`;
        if (seen.has(resolvedUrl)) continue;
        const id = card.href.split("/").filter(Boolean).pop() || "";
        const exactIso = (id && pubMap.get(id)) || "";
        const isoTimestamp = exactIso || normalizeTime(card.timeText);
        // Per mapping choice: timestamp carries the ISO value when known.
        const timestamp = exactIso || isoTimestamp || card.timeText;
        const checkSum = generateChecksum(card.title, resolvedUrl);
        seen.set(resolvedUrl, {
          title: card.title,
          url: resolvedUrl,
          byline: card.summary,
          timestamp,
          isoTimestamp,
          baseUrl,
          checkSum,
          imageUrl: decodeNextImage(card.imageUrl) || undefined,
        });
        fresh++;
      }
      return fresh;
    };

    // SSR sometimes ignores ?page= (English re-renders page 1), while the
    // pager links trigger the real client-side fetch. Fall back to clicking
    // the pager when a direct load yields nothing new.
    const clickPager = async (
      pageNum: number,
      prevFirst: string
    ): Promise<boolean> => {
      const clicked = await page.evaluate(
        (num: number): string | null => {
          const anchors = [
            ...document.querySelectorAll('a[href*="page="]'),
          ] as HTMLAnchorElement[];
          const target =
            anchors.find(
              (a) =>
                (a.textContent || "").trim() === String(num) &&
                (a.getAttribute("href") || "").includes(`page=${num}`)
            ) ??
            anchors.find((a) =>
              (a.getAttribute("href") || "").includes(`page=${num}&`)
            );
          if (!target) return null;
          target.scrollIntoView();
          target.click();
          return target.getAttribute("href");
        },
        pageNum
      );
      if (!clicked) return false;
      try {
        await page.waitForFunction(
          (prev: string): boolean => {
            const a = document.querySelector(
              'article a[href^="/news/"]'
            ) as HTMLAnchorElement | null;
            return !!a && (a.getAttribute("href") || "") !== prev;
          },
          { timeout: 12000 },
          prevFirst
        );
      } catch {
        // Re-read anyway; merge() decides by fresh count.
      }
      return true;
    };

    for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
      const pageUrl = buildPageUrl(url, pageNum);
      const resp = await page.goto(pageUrl, {
        waitUntil: "domcontentloaded",
      });

      if (!resp || resp.status() >= 400) {
        throw new Error(
          `adaderana blocked: HTTP ${resp?.status() ?? "unknown"} for ${pageUrl}`
        );
      }

      let read;
      try {
        read = await readCards();
      } catch {
        // No cards on this page — past the end of pagination.
        break;
      }
      let fresh = merge(read.cards, read.pubMap);

      if (fresh === 0 && pageNum > 1) {
        if (await clickPager(pageNum, read.cards[0]?.href ?? "")) {
          try {
            read = await readCards();
            fresh = merge(read.cards, read.pubMap);
          } catch {
            // keep fresh = 0 -> break below
          }
        }
      }
      // If a page yields no new articles, further pages will repeat/stop.
      if (fresh === 0) break;
    }

    if (seen.size === 0) {
      throw new Error(
        `adaderana: no articles found for ${url} (selector '${CARD_ANCHOR}' empty after ${MAX_PAGES} page(s))`
      );
    }

    return [...seen.values()];
  });
};

export default adaderana;
