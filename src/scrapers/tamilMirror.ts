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

const tamilMirror = async (url: string): Promise<ProcessedArticle[]> => {
  const browser = await launchBrowser();
  const page = await browser.newPage();

  try {
    await page.goto(url, {
      waitUntil: "domcontentloaded",
    });

    const articles = await page.evaluate(() => {
      const articleElements = document.querySelectorAll("div.row");
      const results = Array.from(articleElements)
        .map((article): RawArticle | null => {
          try {
            const contentCol = article.querySelector("div.col-md-8");
            if (!contentCol) return null;

            const mainLink = contentCol.querySelector("a");
            if (!mainLink) return null;

            const title =
              mainLink.querySelector("h3.cat-hd-tx")?.textContent?.trim() ||
              "No title";
            const href = mainLink.getAttribute("href");
            if (!href) return null;

            const metaParagraph = mainLink.querySelector("p");
            const timestamp =
              metaParagraph?.querySelector("span.gtime")?.textContent?.trim() ||
              "No timestamp";

            const byline =
              mainLink.querySelector("p.ptext")?.textContent?.trim() ||
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

    await browser.close();
    return updatedData;
  } catch (error) {
    console.error("Error scraping Tamil Mirror:", error);
    await browser.close();
    throw error;
  }
};

export default tamilMirror;
