export const SITE_URL = "https://shabeghahremanan.ir";
export const SITE_NAME = "باشگاه شب قهرمانان";

export function absoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}
