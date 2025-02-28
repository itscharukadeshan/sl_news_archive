/** @format */

import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { BROWSERLESS_URL } from "../config";

puppeteer.use(StealthPlugin());

export const launchBrowser = async () => {
  return puppeteer.connect({ browserWSEndpoint: BROWSERLESS_URL });
};
