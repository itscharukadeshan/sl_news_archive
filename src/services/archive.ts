/** @format */

import path from "path";
import fs from "fs";

import { Urls } from "../constants/Urls";

import ada from "../scrapers/ada";
import adaderana from "../scrapers/adaderana";
import dailyMirror from "../scrapers/dailyMirror";
import economyNext from "../scrapers/economynext";
import island from "../scrapers/island";
import lankadeepa from "../scrapers/lankadeepa";
import tamilMirror from "../scrapers/tamilMirror";
import theMorning from "../scrapers/theMorning";
import thinakaran from "../scrapers/thinakaran";

import { getNameFromUrl } from "./url";
import { saveJsonToFile } from "../utils/saveData";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

async function retryFetch(
  handler: () => Promise<any>,
  retries: number
): Promise<any> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const data = await handler();
      return { success: true, data };
    } catch (error) {
      console.error(`Attempt ${attempt} failed: ${error}`);
      if (attempt === retries) {
        return { success: false, error: error };
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}

export async function archive(url: string) {
  const urlHandlers: { [key: string]: () => Promise<any> } = {
    [Urls.ADADERANA_ENGLISH]: () => adaderana(url),
    [Urls.ADADERANA_SINHALA]: () => adaderana(url),
    [Urls.ADADERANA_TAMIL]: () => adaderana(url),
    [Urls.ARUNA]: () => theMorning(url),
    [Urls.THE_MORNING]: () => theMorning(url),
    [Urls.THAMILAN]: () => theMorning(url),
    [Urls.DAILY_MIRROR]: () => dailyMirror(url),
    [Urls.TAMIL_MIRROR]: () => tamilMirror(url),
    [Urls.ISLAND]: () => island(url),
    [Urls.LANKADEEPA]: () => lankadeepa(url),
    [Urls.ECONOMY_NEXT]: () => economyNext(url),
    [Urls.ADA]: () => ada(url),
    [Urls.THINAKARAN]: () => thinakaran(url),
    [Urls.DINAMINA]: () => thinakaran(url),
  };

  if (urlHandlers[url]) {
    return await urlHandlers[url]();
  } else {
    throw new Error(
      "Invalid URL: check the docs for valid URLs and try again."
    );
  }
}

export async function archiveAll() {
  const results: { [key: string]: any } = {};

  for (const url of Object.values(Urls)) {
    console.log(`Archiving data from URL: ${url}`);
    const formattedUrl = getNameFromUrl(url);
    const result = await retryFetch(() => archive(url), MAX_RETRIES);
    results[formattedUrl] = result;
  }

  const dataDir = path.join(__dirname, "../data");
  const filePath = path.join(dataDir, "archive-all.json");

  fs.mkdirSync(dataDir, { recursive: true });

  await saveJsonToFile(results, filePath);

  return results;
}
