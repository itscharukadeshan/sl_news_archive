/** @format */
import { getBaseUrl } from "../services/url";
import { generateChecksum } from "../utils/generateChecksum";
import normalizeTime from "../utils/normalizeTime";
import { launchBrowser } from "../utils/launchBrowser";

const adaderana = async (url: string) => {
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.goto(url, {
    waitUntil: "domcontentloaded",
  });

  const articles = await page.evaluate(() => {
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
        href,
        byline,
        timestamp,
      };
    });

    return results;
  });

  const scrapedData = articles;

  const baseUrl = getBaseUrl(url) || "";

  const updatedData = scrapedData.map((article) => {
    const timestamp = article.timestamp as string;
    const checkSum = generateChecksum(article.title, article.href);
    const isoTimestamp = normalizeTime(timestamp);

    if (
      baseUrl === "https://sinhala.adaderana.lk" ||
      baseUrl === "https://tamil.adaderana.lk"
    ) {
      const url = `${baseUrl}/${article.href}`;

      return {
        ...article,
        url,
        isoTimestamp,
        baseUrl,
        checkSum,
      };
    }

    return {
      ...article,
      isoTimestamp,
      url: article.href,
      baseUrl,
      checkSum,
    };
  });

  return updatedData;
};

export default adaderana;
