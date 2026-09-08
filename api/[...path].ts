import app from "../server";

export default function handler(req: any, res: any) {
  // Catch-all serverless function handler for all subpaths under /api/* on Vercel
  const headers = req.headers || {};
  let targetUrl =
    headers["x-matched-path"] ||
    headers["x-vercel-matched-path"] ||
    headers["x-forwarded-url"] ||
    headers["x-original-url"] ||
    req.url ||
    "";

  // If targetUrl does not start with /api, reconstruct it from req.query.path
  if (!targetUrl.startsWith("/api")) {
    if (req.query && req.query.path) {
      const pathSegments = Array.isArray(req.query.path)
        ? req.query.path.join("/")
        : String(req.query.path);

      // Reconstruct query parameters excluding the 'path' catch-all parameter
      const queryParams = new URLSearchParams();
      for (const [key, value] of Object.entries(req.query)) {
        if (key !== "path") {
          if (Array.isArray(value)) {
            value.forEach((v) => queryParams.append(key, String(v)));
          } else if (value !== undefined) {
            queryParams.append(key, String(value));
          }
        }
      }
      const qs = queryParams.toString();
      targetUrl = `/api/${pathSegments}${qs ? `?${qs}` : ""}`;
    } else if (req.url && !req.url.startsWith("/api")) {
      targetUrl = `/api${req.url.startsWith("/") ? "" : "/"}${req.url}`;
    }
  }

  // Preserve query string if targetUrl is missing it but req.url had it
  if (req.url && req.url.includes("?") && !targetUrl.includes("?")) {
    targetUrl += req.url.substring(req.url.indexOf("?"));
  }

  if (targetUrl) {
    req.url = targetUrl;
  }

  return app(req, res);
}

