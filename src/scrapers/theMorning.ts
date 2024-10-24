/** @format */

import puppeteer from "puppeteer";
import { BROWSERLESS_URL } from "../config";
import { getBaseUrl } from "../services/url";
import { generateChecksum } from "../utils/generateChecksum";
import normalizeTime from "../utils/normalizeTime";

const browserWSEndpoint = BROWSERLESS_URL;

const theMorning = async (url: string) => {
  const browser = await puppeteer.connect({ browserWSEndpoint });
  const page = await browser.newPage();
  await page.goto(url, {
    waitUntil: "networkidle2",
  });

  const closeButtonSelector =
    "button.absolute.-top-8.-right-14.text-black.text-4xl.rounded-full.p-1";
  const closeButtonExists = await page.$(closeButtonSelector);
  let buttonPressed = false;

  if (closeButtonExists) {
    await page.click(closeButtonSelector);
    buttonPressed = true;
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

  const results = articles.map((article) => {
    const checkSum = generateChecksum(article.title, article.href as string);
    const isoTimestamp = normalizeTime(article.timestamp);
    return {
      title: article.title,
      href: article.href,
      timestamp: article.timestamp,
      baseUrl,
      checkSum,
      isoTimestamp,
    };
  });

  return results;
};

export default theMorning;
