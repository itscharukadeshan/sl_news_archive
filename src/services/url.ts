/** @format */

function getBaseUrl(url: string) {
  const parsedUrl = new URL(url);

  const origin = parsedUrl.origin;
  const pathname = parsedUrl.pathname.split("/");

  pathname.pop();

  const baseUrl = `${origin}/${pathname.join("/")}`;

  return baseUrl;
}

export { getBaseUrl };
