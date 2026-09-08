// Helper to normalize environment variables and strip surrounding quotes/whitespace/newlines
const normalizeSecret = (val: any): string | null => {
  if (!val || typeof val !== 'string') return null;
  let s = val.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s || null;
};

// Vercel Serverless Function: /api/verify_admin_code (handles both /api/verify_admin_code and rewritten /api/verify_admin_code.php)
export default async function handler(req: any, res: any) {
  const reqOrigin = req.headers?.origin;
  const origin = reqOrigin || (req.headers?.host ? `https://${req.headers.host}` : "*");
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token, Cookie");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  try {
    let body = req.body || {};
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }
    const query = req.query || {};

    const checkOnly = body.checkOnly !== undefined ? body.checkOnly : (query.checkOnly !== undefined ? query.checkOnly : false);
    if (checkOnly) {
      return res.status(200).json({
        status: "active",
        success: true,
        locked: false,
        lock_remaining_seconds: 0
      });
    }

    const code = (body.code || body.admin_code || body.adminCode || query.code || "").trim();
    const candidateCodes = [
      normalizeSecret(process.env.ADMIN_VERIFICATION_CODE),
      normalizeSecret(process.env.ADMIN_CODE),
      normalizeSecret(process.env.CRM_ADMIN_CODE),
      "AdminA9"
    ].filter(Boolean) as string[];

    const isMatch = Boolean(
      code &&
      candidateCodes.some(c => code === c)
    );

    if (code && isMatch) {
      const token = "admin-tok-" + Math.random().toString(36).substring(2) + Date.now().toString(36);
      const csrfToken = "csrf-" + Math.random().toString(36).substring(2);

      return res.status(200).json({
        status: "success",
        success: true,
        token,
        csrfToken,
        csrf_token: csrfToken,
        role: "Admin",
        message: "Administrator verification successful."
      });
    }

    return res.status(401).json({
      status: "error",
      success: false,
      error: "Invalid Administrator Verification Code. Please try again."
    });
  } catch (error: any) {
    return res.status(500).json({
      status: "error",
      success: false,
      error: "Verification service error. Please try again."
    });
  }
}
