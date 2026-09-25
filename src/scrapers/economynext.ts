/** @format */

import { getBaseUrl } from "../services/url";
import { generateChecksum } from "../utils/generateChecksum";
import normalizeTime from "../utils/normalizeTime";
import { withPage } from "../utils/launchBrowser";
import type { ProcessedArticle, RawArticle } from "../types";

const economyNext = async (baseUrl: string): Promise<ProcessedArticle[]> => {
  return withPage(async (page) => {
    const allArticles: ProcessedArticle[] = [];

    for (let i = 1; i <= 2; i++) {
      const url = i === 1 ? baseUrl : `${baseUrl}/page/${i}/`;
      await page.goto(url, { waitUntil: "domcontentloaded" });

      const articles = await page.evaluate(() => {
        const articleElements = document.querySelectorAll(
          ".story-grid-single-story"
        );
        const results = Array.from(articleElements)
          .map((article): RawArticle | null => {
            try {
              const mainLink = article.querySelector("h3.recent-top-header a");
              if (!mainLink) return null;

              const title = mainLink.textContent?.trim() || "No title";
              const href = mainLink.getAttribute("href");
              if (!href) return null;

              const timestampElement = article.querySelector(
                ".article-publish-date"
              );
              const timestamp =
                timestampElement?.textContent?.trim() || "No timestamp";

              const bylineElement = article.querySelector(".top-story-desc p");
              const byline = bylineElement?.textContent?.trim() || "No byline";

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

      const base = getBaseUrl(url) || "";

      const updatedData = articles.map((article): ProcessedArticle => {
        const isoTimestamp = normalizeTime(article.timestamp);
        const checkSum = generateChecksum(article.title, article.url);

        return {
          ...article,
          isoTimestamp,
          baseUrl: base,
          checkSum,
        };
      });

      allArticles.push(...updatedData);
    }

    return allArticles;
  });
};

export default economyNext;
