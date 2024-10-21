/** @format */

import puppeteer from "puppeteer";
import { BROWSERLESS_URL } from "../config";

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
        let headline = headlineElement;
        let title: string;

        if (headlineElement?.textContent) {
          title = headlineElement.textContent.trim();
        }

        const linkElement = group.querySelector("a");
        const href = linkElement ? linkElement.getAttribute("href") : null;

        const timestampElement = group.querySelector("p.text-grey-base");
        let timestamp: string = "";

        if (timestampElement?.textContent) {
          timestamp = timestampElement.textContent.trim();
        }

        return { headline, href, timestamp };
      })
  );

  const results = articles.map((article) => ({
    headline: article.headline,
    href: article.href,
    timestamp: article.timestamp,
  }));

  return {
    results,
  };
};

export default theMorning;
