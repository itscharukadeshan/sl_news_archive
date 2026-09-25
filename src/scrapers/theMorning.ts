/** @format */

import { getBaseUrl } from "../services/url";
import { generateChecksum } from "../utils/generateChecksum";
import normalizeTime from "../utils/normalizeTime";
import { withPage } from "../utils/launchBrowser";
import type { ProcessedArticle } from "../types";

const theMorning = async (url: string): Promise<ProcessedArticle[]> => {
  return withPage(async (page) => {
    // networkidle2 never settles on this ad-heavy page (was: nav timeout).
    await page.goto(url, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForSelector("a h2", { timeout: 15000 });

    const closeButtonSelector =
      "button.absolute.-top-8.-right-14.text-black.text-4xl.rounded-full.p-1";
    const closeButtonExists = await page.$(closeButtonSelector);

    if (closeButtonExists) {
      await page.click(closeButtonSelector);
    }

    const articles = await page.$$eval(
      ".flex.flex-col.space-y-2.lg\\:space-y-3",
      (groups) =>
        groups.map((group) => {
          const headlineElement = group.querySelector("a h2");
          let title = "";

          if (headlineElement?.textContent) {
            title = headlineElement.textContent.trim();
          }

          const linkElement = group.querySelector("a");
          const href = linkElement ? linkElement.getAttribute("href") : null;

          const timestampElement = group.querySelector("p.text-grey-base");
          let timestamp = "";

          if (timestampElement?.textContent) {
            timestamp = timestampElement.textContent.trim();
          }

          return { title, href, timestamp };
        })
    );

    const baseUrl = getBaseUrl(url);

    return articles.map(
      (article): ProcessedArticle => {
        const href = article.href ?? "";
        const checkSum = generateChecksum(article.title, href);
        const isoTimestamp = normalizeTime(article.timestamp);
        return {
          title: article.title,
          url: `${baseUrl}${href}`,
          byline: "",
          timestamp: article.timestamp,
          baseUrl,
          checkSum,
          isoTimestamp,
        };
      }
    );
  });
};

export default theMorning;
