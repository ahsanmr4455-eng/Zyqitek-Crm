// Vercel Serverless Function: /api/verify-access-code
export default async function handler(req: any, res: any) {
  // CORS & Preflight headers
  const origin = req.headers?.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token, Cookie");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  try {
    const body = req.body || {};
    const query = req.query || {};
    const code = body.code || query.code || body.accessCode || query.accessCode;
    const checkOnly = body.checkOnly !== undefined ? body.checkOnly : (query.checkOnly !== undefined ? query.checkOnly : false);

    if (checkOnly) {
      return res.status(200).json({
        status: "active",
        success: true,
        locked: false,
        lock_remaining_seconds: 0
      });
    }

    const cleanCode = typeof code === 'string' ? code.trim() : '';
    const validAccessCode = process.env.CRM_ACCESS_CODE || "Crown5002";

    if (cleanCode && cleanCode === validAccessCode) {
      return res.status(200).json({
        status: "success",
        success: true
      });
    } else {
      return res.status(400).json({
        status: "error",
        success: false,
        error: "Incorrect access code. Please try again."
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      success: false,
      error: "Verification service temporarily unavailable due to a server exception."
    });
  }
}
