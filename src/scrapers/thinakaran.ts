/** @format */
import puppeteer from "puppeteer";
import { BROWSERLESS_URL } from "../config";
// import convertToISO from "../services/time";
import { getBaseUrl } from "../services/url";
const browserWSEndpoint = BROWSERLESS_URL;

const thinakaran = async (url: string) => {
  const browser = await puppeteer.connect({ browserWSEndpoint });
  const page = await browser.newPage();

  const scrapeArticles = async () => {
    return await page.evaluate(() => {
      const articleElements = Array.from(document.querySelectorAll("article"));

      return articleElements.map((article: Element) => {
        const title =
          article.querySelector(".penci-entry-title a")?.textContent || "";
        const href =
          article.querySelector(".penci-entry-title a")?.getAttribute("href") ||
          "";
        const timestamp =
          article.querySelector("time.entry-date")?.getAttribute("datetime") ||
          "";

        return { title, href, timestamp };
      });
    });
  };

  const articles: Array<{
    title: string;
    href: string;
    timestamp: string;
  }> = [];

  try {
    await page.goto(url, { waitUntil: "networkidle2" });

    let totalArticles = 0;
    let noMorePosts = false;

    while (totalArticles < 70 && !noMorePosts) {
      const newArticles = await scrapeArticles();

      newArticles.forEach((article) => {
        if (!articles.some((existing) => existing.title === article.title)) {
          articles.push(article);
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
    console.log("Captured articles so far:", articles);
    return articles;
  } finally {
    await browser.close();
  }

  return articles.slice(0, 70);
};

export default thinakaran;
