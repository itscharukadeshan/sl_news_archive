/** @format */

import { getBaseUrl } from "../services/url";
import { generateChecksum } from "../utils/generateChecksum";
import normalizeTime from "../utils/normalizeTime";
import { launchBrowser } from "../utils/launchBrowser";

interface RawArticle {
  title: string;
  url: string;
  timestamp: string;
  byline: string;
}

interface ProcessedArticle extends RawArticle {
  isoTimestamp: string;
  baseUrl: string;
  checkSum: string;
}

const newsWire = async (url: string): Promise<ProcessedArticle[]> => {
  const browser = await launchBrowser();
  const page = await browser.newPage();

  const allArticles: ProcessedArticle[] = [];

  try {
    const urls = [url, `${url}page/2/`, `${url}page/3/`];

    for (const currentUrl of urls) {
      await page.goto(currentUrl, {
        waitUntil: "domcontentloaded",
      });

      const articles = await page.evaluate(() => {
        const articleElements = [
          ...document.querySelectorAll(".entry-grid-content"),
        ];

        const results = Array.from(articleElements);

        return results.map((card) => {
          const titleElement = card.querySelector(".entry-title a");
          const title = titleElement?.textContent?.trim() || "No title";
          const href = titleElement?.getAttribute("href") || "No link";

          const timeElement = card.querySelector("time");
          const timestamp = timeElement?.getAttribute("datetime") || "No date";
          const readableTime =
            timeElement?.textContent?.trim() || "No timestamp";

          const byline =
            card.querySelector(".entry-summary p")?.textContent?.trim() ||
            "No description";

          const imageContainer = card.previousElementSibling;
          const imageUrl =
            imageContainer
              ?.querySelector("meta[itemprop='url']")
              ?.getAttribute("content") || "No image";

          return {
            title,
            url: href,
            timestamp,
            readableTime,
            byline,
            imageUrl,
          };
        });
      });

      const baseUrl = getBaseUrl(currentUrl) || "";

      const updatedData = articles.map((article): ProcessedArticle => {
        const isoTimestamp = normalizeTime(article.timestamp);
        const checkSum = generateChecksum(article.title, article.url);

        return {
          ...article,
          isoTimestamp,
          baseUrl,
          checkSum,
        };
      });

      allArticles.push(...updatedData);
    }

    await browser.close();
    return allArticles;
  } catch (error) {
    console.error("Error scraping News Wire:", error);
    await browser.close();
    throw error;
  }
};

export default newsWire;
