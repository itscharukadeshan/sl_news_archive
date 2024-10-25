/** @format */

function getBaseUrl(url: string): string {
  const parsedUrl = new URL(url);
  return parsedUrl.origin;
}

function getParsedUrl(url: string): URL {
  const parsedUrl = new URL(url);
  return parsedUrl;
}

function getNameFromUrl(url: string): string {
  const regex =
    /https?:\/\/(?:www\.)?(?:([a-z]+)\.)?([a-z-]+)\.([a-z]{2,})(?:\.[a-z]{2,})?(?:\/.*)?/i;

  const match = url.match(regex);

  if (match) {
    const subdomain = match[1] ? match[1].toLowerCase() : "";
    const domain = match[2].toLowerCase();
    return subdomain ? `${domain}-${subdomain}` : domain;
  }

  return url;
}

export { getBaseUrl, getNameFromUrl };
