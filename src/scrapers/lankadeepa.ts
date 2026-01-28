/** @format */

import { generateChecksum } from "../utils/generateChecksum";
import normalizeTime from "../utils/normalizeTime";
import { launchBrowser } from "../utils/launchBrowser";

const lankadeepa = async (baseUrl: string) => {
  try {
    const browser = await launchBrowser();
    const page = await browser.newPage();

    const allItems = [];

    for (let i = 0; i < 3; i++) {
      const pageNumber = i * 30;
      await page.goto(`${baseUrl}/${pageNumber}`, {
        waitUntil: "domcontentloaded",
      });

      await page.waitForSelector("article, .cat-list-text", { timeout: 10000 });

      const items = await page.evaluate(() => {
        const results: {
          url: string;
          title: string;
          byline: string;
          timestamp: string;
        }[] = [];

        document
          .querySelectorAll("article.cat-lead-story")
          .forEach((article) => {
            const linkElement = article.querySelector("a") as HTMLAnchorElement;
            const titleElement = article.querySelector("h2.cat-lead-title");
            const summaryElement = article.querySelector("p.cat-lead-teaser");
            const dateElement = article.querySelector(".story-meta span");

            results.push({
              url: linkElement?.href || "",
              title: titleElement?.textContent?.trim() || "No title",
              byline:
                summaryElement?.textContent?.trim() || "No summary available",
              timestamp:
                dateElement?.textContent?.trim() || "No date available",
            });
          });

        document.querySelectorAll(".cat-list-text").forEach((block) => {
          const linkElement = block.querySelector("a") as HTMLAnchorElement;
          const titleElement = block.querySelector("h3.cat-item-title");
          const summaryElement = block.querySelector("p.cat-item-teaser");
          const dateElement = block.querySelector(".story-meta span");

          results.push({
            url: linkElement?.href || "",
            title: titleElement?.textContent?.trim() || "No title",
            byline:
              summaryElement?.textContent?.trim() || "No summary available",
            timestamp: dateElement?.textContent?.trim() || "No date available",
          });
        });

        return results.filter((item) => item.title);
      });

      allItems.push(...items);
    }

    const updatedData = allItems.map((article) => {
      const checkSum = generateChecksum(article.title, article.url);
      const isoTimestamp = normalizeTime(article.timestamp || "No timestamp");

      return {
        ...article,
        isoTimestamp,
        baseUrl,
        checkSum,
      };
    });

    return updatedData;
  } catch (error) {
    console.log(error);
  }
};

export default lankadeepa;
