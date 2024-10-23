/** @format */

import { Urls } from "../constants/Urls";
import adaderana from "../scrapers/adaderana";
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
  } else if (url === Urls.THINAKARAN || url === Urls.DINAMINA) {
    return await thinakaran(url);
  } else {
    throw new Error(
      "Invalid URL: check the docs for valid URLs and try again."
    );
  }
}
