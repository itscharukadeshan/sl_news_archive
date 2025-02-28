/** @format */

import { getBaseUrl } from "../services/url";
import { generateChecksum } from "../utils/generateChecksum";
import normalizeTime from "../utils/normalizeTime";
import { launchBrowser } from "../utils/launchBrowser";

const dailyMirror = async (url: string) => {
  const browser = await launchBrowser();
  const page = await browser.newPage();

  try {
    await page.goto(url, {
      waitUntil: "domcontentloaded",
    });

    const articles = await page.evaluate(() => {
      const articleElements = document.querySelectorAll("div.lineg.mb-4");
      const results = Array.from(articleElements).map((article) => {
        const titleElement = article.querySelector(
          'a[href*="dailymirror.lk"] h3.cat_title'
        );
        const urlElement = article.querySelector('a[href*="dailymirror.lk"]');
        const dateElement = article.querySelector(
          "div.timesss h4.text-secondary"
        );
        const bylineElement = article.querySelector("p.text-dark");

        const title = titleElement?.textContent?.trim() || "No title";
        const href = urlElement?.getAttribute("href") || "";
        const timestamp = dateElement?.textContent?.trim() || "No timestamp";
        const byline = bylineElement?.textContent?.trim() || "No byline";

        return {
          title,
          url: href,
          byline,
          timestamp,
        };
      });

      return results;
    });

    const baseUrl = getBaseUrl(url) || "";

    const updatedData = articles.map((article) => {
      const timestamp = article.timestamp as string;
      const checkSum = generateChecksum(article.title, article.url);
      const isoTimestamp = normalizeTime(timestamp);

      return {
        ...article,
        timestamp,
        isoTimestamp,
        baseUrl,
        checkSum,
      };
    });

    await browser.close();
    return updatedData;
  } catch (error) {
    console.error("Error scraping Daily Mirror:", error);
    await browser.close();
    throw error;
  }
};

export default dailyMirror;
