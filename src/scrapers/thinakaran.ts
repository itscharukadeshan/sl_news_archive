/** @format */

import { getBaseUrl } from "../services/url";
import { generateChecksum } from "../utils/generateChecksum";
import normalizeTime from "../utils/normalizeTime";
import { launchBrowser } from "../utils/launchBrowser";

const thinakaran = async (url: string) => {
  const browser = await launchBrowser();
  const page = await browser.newPage();

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

  const articles: Array<{
    title: string;
    url: string;
    timestamp: string;
    checkSum: string;
    baseUrl: string;
    isoTimestamp: string;
  }> = [];

  try {
    await page.goto(url, { waitUntil: "networkidle2" });

    let totalArticles = 0;
    let noMorePosts = false;

    while (totalArticles < 70 && !noMorePosts) {
      const newArticles = await scrapeArticles();

      newArticles.forEach((article) => {
        const checkSum = generateChecksum(article.title, article.url);
        const baseUrl = getBaseUrl(url);

        const isoTimestamp = normalizeTime(article.timestamp);

        if (!articles.some((existing) => existing.checkSum === checkSum)) {
          articles.push({ ...article, checkSum, baseUrl, isoTimestamp });
        }
      });

      totalArticles = articles.length;

      const loadMoreButton = await page.$(".penci-ajax-more-button");

      if (loadMoreButton) {
        const isDisabled = await page.evaluate(
          (btn) => btn.getAttribute("aria-disabled") === "true",
          loadMoreButton
        );

        if (isDisabled) {
          noMorePosts = true;
          break;
        }

        await loadMoreButton.click();
        await page.waitForSelector("article", { timeout: 6000 });
      } else {
        break;
      }
    }
  } catch (error) {
    console.error("Error during scraping:", error);
    return articles;
  } finally {
    await browser.close();
  }

  return articles.slice(0, 70);
};

export default thinakaran;
