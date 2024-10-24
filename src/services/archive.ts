/** @format */

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
