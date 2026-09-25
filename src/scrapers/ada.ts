/** @format */

import { withPage } from "../utils/launchBrowser";
import type { ProcessedArticle, RawArticle } from "../types";
import { getBaseUrl } from "../services/url";
import { generateChecksum } from "../utils/generateChecksum";
import normalizeTime from "../utils/normalizeTime";

const ada = async (url: string): Promise<ProcessedArticle[]> => {
  // Slow TTFB headless: default 15s nav timeout flaked in production.
  return withPage(
    async (page) => {
      await page.goto(url, {
        waitUntil: "domcontentloaded",
      });

      // The list shell renders without rows when the site withholds
      // content from headless clients — fail loudly instead of [].
      try {
        await page.waitForSelector(".cat-b-row h5 a", { timeout: 20000 });
      } catch {
        throw new Error(
          "ada: article list did not render (site withholds content from headless clients)"
        );
      }

    const articles = await page.evaluate(() => {
      const articleElements = document.querySelectorAll(
        ".row.bg-white.cat-b-row.mt-3"
      );
      const results = Array.from(articleElements)
        .map((article): RawArticle | null => {
          try {
            const mainLink = article.querySelector("h5 a");
            if (!mainLink) return null;

            const title = mainLink.textContent?.trim() || "No title";
            const href = mainLink.getAttribute("href");
            if (!href) return null;

            const dateElement = article.querySelector("h6") as HTMLElement;
            const timestamp =
              dateElement?.textContent?.trim() || "No timestamp";

            const byline =
              article.querySelector(".cat-b-text")?.textContent?.trim() ||
              "No description";

            return {
              title,
              url: href,
              timestamp,
              byline,
            };
          } catch (error) {
            console.error("Error processing article element:", error);
            return null;
          }
        })
        .filter((article): article is RawArticle => article !== null);

      return results;
    });

    const baseUrl = getBaseUrl(url) || "";

    return articles.map((article) => {
      const isoTimestamp = normalizeTime(article.timestamp);
      const checkSum = generateChecksum(article.title, article.url);

      return {
        ...article,
        isoTimestamp,
        baseUrl,
        checkSum,
      };
    });
    },
    { navigationTimeoutMs: 30000 }
  );
};

export default ada;
