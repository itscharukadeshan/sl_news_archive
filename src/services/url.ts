/** @format */

function getBaseUrl(url: string): string {
  const parsedUrl = new URL(url);
  return parsedUrl.origin;
}

function getParsedUrl(url: string): URL {
  const parsedUrl = new URL(url);
  return parsedUrl;
}

export { getBaseUrl };
