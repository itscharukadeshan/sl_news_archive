/** @format */

import { getBaseUrl } from "../services/url";
import { generateChecksum } from "../utils/generateChecksum";
import normalizeTime from "../utils/normalizeTime";
import { withPage } from "../utils/launchBrowser";
import type { ProcessedArticle, RawArticle } from "../types";

const island = async (url: string): Promise<ProcessedArticle[]> => {
  return withPage(async (page) => {
    const baseUrl = getBaseUrl(url) || "";
    const articles: RawArticle[] = [];
    const uniqueUrls = new Set<string>();

    const scrapeArticles = async (): Promise<void> => {
      const pageArticles = await page.evaluate(() => {
        const articlesList: {
          title: string;
          url: string;
          byline: string;
          timestamp: string;
        }[] = [];
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
        await page.waitForSelector("li.mvp-blog-story-wrap", {
          timeout: 5000,
        });
      }
    };

    await page.goto(url, { waitUntil: "networkidle2" });
    await scrapeArticles();
    for (let i = 0; i < 4; i++) {
      await clickMorePosts();
      await scrapeArticles();
    }

    return articles.map(
      (article): ProcessedArticle => {
        const checkSum = generateChecksum(article.title, article.url);
        const isoTimestamp = normalizeTime(article.timestamp);

        return {
          ...article,
          isoTimestamp,
          baseUrl,
          checkSum,
        };
      }
    );
  });
};

export default island;
