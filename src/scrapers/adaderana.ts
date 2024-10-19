/** @format */
import puppeteer from "puppeteer";
import { BROWSERLESS_URL } from "../config";
import moment from "moment";

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

      const byline = (
        story.querySelector("p")?.textContent?.trim() || "No byline"
      )
        .replace(/MORE\.\.+$/, "")
        .trim();

      const timestamp = (
        story.querySelector(".comments span")?.textContent?.trim() ||
        "No timestamp"
      )
        .replace(/^\s*\|/, "")
        .trim();

      return {
        title,
        url: href,
        byline,
        timestamp,
      };
    });

    return results;
  });

  const scrapedData = items;

  const parsedUrl = new URL(url);

  const origin = parsedUrl.origin;
  const pathname = parsedUrl.pathname.split("/");

  pathname.pop();

  const baseUrl = `${origin}/${pathname.join("/")}`;

  const updatedData = scrapedData.map((item) => ({
    ...item,
    baseUrl,
  }));

  return updatedData;
};

export default adaderana;
