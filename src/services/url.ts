/** @format */

function getBaseUrl(url: string): string {
  const parsedUrl = new URL(url);
  return parsedUrl.origin;
}

export { getBaseUrl };
