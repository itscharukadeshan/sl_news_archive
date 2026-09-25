/** @format */
import { getBaseUrl } from "../services/url";
import { generateChecksum } from "../utils/generateChecksum";
import normalizeTime from "../utils/normalizeTime";
import { withPage } from "../utils/launchBrowser";
import type { ProcessedArticle } from "../types";

const adaderana = async (url: string): Promise<ProcessedArticle[]> => {
  return withPage(async (page) => {
    const resp = await page.goto(url, {
      waitUntil: "domcontentloaded",
    });

    // CloudFront serves HTTP 403 "Request blocked" to datacenter IPs.
    // Fail loudly so archive-all reports it instead of a silent [].
    if (!resp || resp.status() >= 400) {
      throw new Error(
        `adaderana blocked: HTTP ${resp?.status() ?? "unknown"} (site blocks headless/datacenter requests)`
      );
    }

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

    const baseUrl = getBaseUrl(url) || "";

    return articles.map(
      (article): ProcessedArticle => {
        const checkSum = generateChecksum(article.title, article.href);
        const isoTimestamp = normalizeTime(article.timestamp);

        const resolvedUrl =
          baseUrl === "https://sinhala.adaderana.lk" ||
          baseUrl === "https://tamil.adaderana.lk"
            ? `${baseUrl}/${article.href}`
            : article.href;

        return {
          title: article.title,
          url: resolvedUrl,
          byline: article.byline,
          timestamp: article.timestamp,
          isoTimestamp,
          baseUrl,
          checkSum,
        };
      }
    );
  });
};

export default adaderana;
