/** @format */
import crypto from "crypto";

export const generateChecksum = (title: string, href: string): string => {
  const normalizedTitle = title.trim().toLowerCase();
  const normalizedHref = href.trim().toLowerCase();

  const hash = crypto.createHash("sha256");
  hash.update(`${normalizedTitle}${normalizedHref}`);

  return hash.digest("hex");
};
