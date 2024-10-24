/** @format */
import puppeteer from "puppeteer";
import { BROWSERLESS_URL } from "../config";
import { getBaseUrl } from "../services/url";
import { generateChecksum } from "../utils/generateChecksum";
import normalizeTime from "../utils/normalizeTime";

const browserWSEndpoint = BROWSERLESS_URL;

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

const ada = async (url: string): Promise<ProcessedArticle[]> => {
  const browser = await puppeteer.connect({ browserWSEndpoint });
  const page = await browser.newPage();

  try {
    await page.goto(url, {
      waitUntil: "domcontentloaded",
    });

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
    console.error("Error scraping ada lk:", error);
    await browser.close();
    throw error;
  }
};

export default ada;
