/** @format */

import { getBaseUrl } from "../services/url";
import { generateChecksum } from "../utils/generateChecksum";
import normalizeTime from "../utils/normalizeTime";
import { launchBrowser } from "../utils/launchBrowser";

interface Article {
  title: string;
  url: string;
  timestamp: string;
  byline: string;
  checkSum?: string;
}

const island = async (url: string): Promise<Article[]> => {
  const browser = await launchBrowser(false);
  const page = await browser.newPage();
  const baseUrl = getBaseUrl(url) || "";
  const articles: Article[] = [];
  const uniqueUrls = new Set<string>();

  const scrapeArticles = async (): Promise<void> => {
    const pageArticles = await page.evaluate(() => {
      const articlesList: Article[] = [];
      const articleElements = document.querySelectorAll<HTMLElement>(
        "li.mvp-blog-story-wrap"
      );

      articleElements.forEach((article) => {
        const linkElement = article.querySelector<HTMLAnchorElement>("a");
        if (!linkElement) return;

        const url = linkElement.href;
        const titleElement = article.querySelector<HTMLElement>("h2");
        if (!titleElement || !url) return;

        const title = titleElement.textContent?.trim() ?? "";

        const timeElement =
          article.querySelector<HTMLElement>("span.mvp-cd-date");

        const time = timeElement?.textContent?.trim() ?? "";

        const descriptionElement = article.querySelector<HTMLElement>(
          "div.mvp-blog-story-text p"
        );
        const byline = descriptionElement?.textContent?.trim() ?? "";

        if (title && url) {
          articlesList.push({
            title,
            url,
            byline,
            timestamp: time,
          });
        }
      });

      return articlesList;
    });

    pageArticles.forEach((article) => {
      if (!uniqueUrls.has(article.url)) {
        uniqueUrls.add(article.url);
        articles.push(article);
      }
    });
  };

  const clickMorePosts = async (): Promise<void> => {
    const morePostsButton = await page.$("a.mvp-inf-more-but");
    if (morePostsButton) {
      await morePostsButton.click();
      await page.waitForNetworkIdle();
      await page.waitForSelector("li.mvp-blog-story-wrap", { timeout: 5000 });
    }
  };

  try {
    await page.goto(url, { waitUntil: "networkidle2" });
    await scrapeArticles();
    for (let i = 0; i < 4; i++) {
      await clickMorePosts();
      await scrapeArticles();
    }

    const updatedData = articles.map((article) => {
      const checkSum = generateChecksum(article.title, article.url);
      const isoTimestamp = normalizeTime(article.timestamp);

      return {
        ...article,
        isoTimestamp,
        baseUrl,
        checkSum,
      };
    });

    return updatedData;
  } catch (error) {
    console.error("Error during scraping:", error);
    return articles;
  } finally {
    await page.close();
  }
};

export default island;
