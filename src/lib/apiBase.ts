/**
 * Backend origin for API calls and server-served media. Unlike the website,
 * the app has no same-origin /api rewrite (its WebView origin is
 * https://localhost), so this is always an absolute origin. The default is the
 * PROD API on AWS; set VITE_API_URL to test against DEV.
 */
function resolveApiOrigin(): string {
  const raw = (
    (import.meta.env.VITE_API_URL as string | undefined) ||
    "https://mkrkiditq5.execute-api.eu-west-2.amazonaws.com"
  ).trim();
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("VITE_API_URL must be a valid absolute URL.");
  }

  const local = ["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname);
  if ((url.protocol !== "https:" && !(local && url.protocol === "http:")) ||
      url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error(
      "VITE_API_URL must be an HTTPS origin with no credentials, path, query, or fragment.",
    );
  }
  return url.origin;
}

export const API_BASE_URL = resolveApiOrigin();
