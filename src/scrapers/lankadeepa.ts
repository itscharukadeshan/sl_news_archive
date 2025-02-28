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

      const items = await page.evaluate(() => {
        const articles = Array.from(
          document.querySelectorAll(".flex-wr-sb-s.p-t-20.p-b-15.how-bor2.row")
        );
        return articles.map((article) => {
          const linkElement = article.querySelector(
            "a.size-w-8"
          ) as HTMLAnchorElement;
          const titleElement = article.querySelector("h5 a.f1-l-1");
          const summaryElement = article.querySelector("h5 a.f1-s-5");
          const dateElement = article.querySelector(
            ".f1-s-4.cl8.hov-cl10.trans-03.timec"
          );

          const title = titleElement?.textContent?.trim() || "No title";
          const url = linkElement?.href || "";
          const byline =
            summaryElement?.textContent?.trim() || "No summary available";
          const date = dateElement?.textContent?.trim() || "No date available";

          return {
            url,
            title,
            byline,
            timestamp: date,
          };
        });
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
