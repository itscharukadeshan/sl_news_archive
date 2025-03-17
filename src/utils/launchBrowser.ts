/** @format */

import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { BROWSERLESS_URL } from "../config";

export const launchBrowser = async (useStealth = true) => {
  if (useStealth) {
    puppeteer.use(StealthPlugin());
  }

  return puppeteer.connect({ browserWSEndpoint: BROWSERLESS_URL });
};
