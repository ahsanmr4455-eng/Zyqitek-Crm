import app from "../server";

export default function handler(req: any, res: any) {
  // Catch-all serverless function handler for /api base path on Vercel
  const headers = req.headers || {};
  let targetUrl =
    headers["x-matched-path"] ||
    headers["x-vercel-matched-path"] ||
    headers["x-forwarded-url"] ||
    headers["x-original-url"] ||
    req.url ||
    "/api";

  if (!targetUrl.startsWith("/api")) {
    targetUrl = `/api${targetUrl.startsWith("/") ? "" : "/"}${targetUrl}`;
  }

  if (targetUrl) {
    req.url = targetUrl;
  }

  return app(req, res);
}


