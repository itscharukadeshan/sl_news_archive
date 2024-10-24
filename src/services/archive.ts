/** @format */

import { Urls } from "../constants/Urls";
import adaderana from "../scrapers/adaderana";
import dailyMirror from "../scrapers/dailyMirror";
import scrapeIsland from "../scrapers/island";
import lankadeepa from "../scrapers/lankadeepa";
import tamilMirror from "../scrapers/tamilMirror";
import theMorning from "../scrapers/theMorning";
import thinakaran from "../scrapers/thinakaran";

export async function archive(url: string) {
  if (
    url === Urls.ADADERANA_ENGLISH ||
    url === Urls.ADADERANA_SINHALA ||
    url === Urls.ADADERANA_TAMIL
  ) {
    return await adaderana(url);
  } else if (
    url === Urls.ARUNA ||
    url === Urls.THE_MORNING ||
    url === Urls.THAMILAN
  ) {
    return await theMorning(url);
  } else if (url === Urls.DAILY_MIRROR) {
    return await dailyMirror(url);
  } else if (url === Urls.TAMIL_MIRROR) {
    return await tamilMirror(url);
  } else if (url === Urls.ISLAND) {
    return await scrapeIsland(url);
  } else if (url === Urls.LANKADEEPA) {
    return await lankadeepa(url);
  } else if (url === Urls.THINAKARAN || url === Urls.DINAMINA) {
    return await thinakaran(url);
  } else {
    throw new Error(
      "Invalid URL: check the docs for valid URLs and try again."
    );
  }
}
