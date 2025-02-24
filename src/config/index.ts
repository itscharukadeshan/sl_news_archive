/** @format */

require("dotenv").config();

const PORT = process.env.PORT || 3001;
const BROWSERLESS_URL = process.env.BROWSERLESS_URL;
const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY;
const FLARESOLVERR_URL = process.env.FLARESOLVERR_URL as string;

export { PORT, BROWSERLESS_URL, BROWSERLESS_API_KEY, FLARESOLVERR_URL };
