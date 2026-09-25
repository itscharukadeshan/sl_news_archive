/** @format */

import { getBaseUrl } from "../services/url";
import { generateChecksum } from "../utils/generateChecksum";
import normalizeTime from "../utils/normalizeTime";
import { withPage } from "../utils/launchBrowser";
import type { ProcessedArticle } from "../types";

const MAX_LOAD_MORE_CLICKS = 6;

const thinakaran = async (url: string): Promise<ProcessedArticle[]> => {
  const articles: ProcessedArticle[] = [];

  await withPage(async (page) => {
    const scrapeArticles = async () => {
      return await page.evaluate(() => {
        const articleElements = Array.from(document.querySelectorAll("article"));

        return articleElements.map((article: Element) => {
          const title =
            article.querySelector(".penci-entry-title a")?.textContent || "";
          const url =
            article.querySelector(".penci-entry-title a")?.getAttribute("href") ||
            "";
          const timestamp =
            article.querySelector("time.entry-date")?.getAttribute("datetime") ||
            "";

          return { title, url, timestamp };
        });
      });
    };

    const collect = async (): Promise<void> => {
      const fresh = await scrapeArticles();
      for (const article of fresh) {
        const checkSum = generateChecksum(article.title, article.url);
        if (!articles.some((existing) => existing.checkSum === checkSum)) {
          articles.push({
            ...article,
            byline: "",
            checkSum,
            baseUrl: getBaseUrl(url),
            isoTimestamp: normalizeTime(article.timestamp),
          });
        }
      }
    };

    await page.goto(url, { waitUntil: "domcontentloaded" });
    try {
      await page.waitForSelector("article", { timeout: 15000 });
    } catch {
      return; // nothing rendered — return whatever (empty) we have
    }
    await collect();

    // The old loop clicked as fast as `waitForSelector("article")` resolved
    // (instantly — articles always exist), hammering the page until the
    // target crashed (TargetCloseError). Now: wait for the count to grow,
    // and bail with partial results on any hiccup.
    for (let i = 0; i < MAX_LOAD_MORE_CLICKS && articles.length < 70; i++) {
      try {
        const loadMoreButton = await page.$(".penci-ajax-more-button");
        if (!loadMoreButton) break;

        const isDisabled = await page.evaluate(
          (btn) => btn.getAttribute("aria-disabled") === "true",
          loadMoreButton
        );
        if (isDisabled) break;

        const prev = articles.length;
        await loadMoreButton.click();
        await page.waitForFunction(
          (p: number) => document.querySelectorAll("article").length > p,
          { timeout: 8000 },
          prev
        );
        await collect();
      } catch {
        break;
      }
    }
  });

  return articles.slice(0, 70);
};

export default thinakaran;
