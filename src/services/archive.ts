/** @format */

import { Urls } from "../constants/Urls";
import adaderana from "../scrapers/adaderana";

export async function archive(url: string) {
  if (
    url === Urls.ADADERANA_ENGLISH ||
    url === Urls.ADADERANA_SINHALA ||
    url === Urls.ADADERANA_TAMIL
  ) {
    return await adaderana(url);
  }
  throw new Error("Invalid URL: check the docs for valid URLs and try again.");
}
