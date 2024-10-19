/** @format */
import puppeteer, { Browser, Page } from "puppeteer";
import { BROWSERLESS_URL } from "../config";

const browserWSEndpoint = BROWSERLESS_URL;

const adaderana = async (url: string) => {
  const browser = await puppeteer.connect({ browserWSEndpoint });
  const page = await browser.newPage();
  await page.goto(url, {
    waitUntil: "domcontentloaded",
  });

  const items = await page.evaluate(() => {
    const stories = [...document.querySelectorAll(".story-text")];

    const results = stories.map((story) => {
      const titleElement =
        story.querySelector("h4 a") || story.querySelector("h2 a");
      const title = titleElement?.textContent?.trim() || "No title";
      const href = titleElement?.getAttribute("href") || "";

      const byline =
        story.querySelector("p")?.textContent?.trim() || "No byline";

      const timestamp =
        story.querySelector(".comments span")?.textContent?.trim() ||
        "No timestamp";

      return {
        title,
        href,
        byline,
        timestamp,
      };
    });

    return JSON.stringify(results);
  });
  return JSON.parse(items);
};

export default adaderana;
