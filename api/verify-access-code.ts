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

    const normalizeSecret = (val: any): string | null => {
      if (!val || typeof val !== 'string') return null;
      let s = val.trim();
      if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
        s = s.slice(1, -1).trim();
      }
      return s || null;
    };

    const cleanCode = typeof code === 'string' ? code.trim() : '';
    const candidateEnvs = [
      process.env.CRM_ACCESS_CODE,
      process.env.ACCESS_CODE,
      process.env.VITE_CRM_ACCESS_CODE
    ];
    const validCodes: string[] = [];
    for (const cand of candidateEnvs) {
      const norm = normalizeSecret(cand);
      if (norm && !validCodes.includes(norm)) {
        validCodes.push(norm);
      }
    }
    if (validCodes.length === 0) {
      validCodes.push("Crown5002");
    }

    const isCodeMatch = Boolean(
      cleanCode &&
      validCodes.some(v => cleanCode === v || cleanCode.toLowerCase() === v.toLowerCase())
    );

    if (isCodeMatch) {
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
