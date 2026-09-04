// Cloudflare Pages Function: /api/verify-access-code
// Handles access code verification at the edge with CORS, OPTIONS, POST, and GET support

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, HEAD",
      "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token, Cookie",
      "Access-Control-Max-Age": "86400",
    },
  });
};

const normalizeSecret = (val: any): string | null => {
  if (!val || typeof val !== 'string') return null;
  let s = val.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s || null;
};

export const onRequest = async (context: any) => {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return onRequestOptions();
  }

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, HEAD",
    "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token, Cookie",
    "Content-Type": "application/json; charset=utf-8",
  };

  try {
    let body: any = {};
    const url = new URL(request.url);

    if (["POST", "PUT", "PATCH"].includes(request.method)) {
      let bodyText = "";
      try {
        bodyText = await request.clone().text();
      } catch (_e1) {
        try {
          bodyText = await request.text();
        } catch (_e2) {
          bodyText = "";
        }
      }

      if (bodyText) {
        try {
          body = JSON.parse(bodyText);
        } catch (_e) {
          body = {};
          try {
            const params = new URLSearchParams(bodyText);
            for (const [k, v] of params.entries()) {
              body[k] = v;
            }
          } catch (_e2) {}
        }
      }
    }

    const code =
      body?.code ||
      body?.accessCode ||
      body?.access_code ||
      body?.passcode ||
      url.searchParams.get("code") ||
      url.searchParams.get("accessCode") ||
      url.searchParams.get("access_code") ||
      url.searchParams.get("passcode") ||
      "";

    const checkOnly =
      body?.checkOnly !== undefined
        ? Boolean(body.checkOnly)
        : url.searchParams.get("checkOnly") !== null;

    if (checkOnly) {
      return new Response(
        JSON.stringify({ status: "active", success: true, locked: false, lock_remaining_seconds: 0 }),
        { status: 200, headers: corsHeaders }
      );
    }

    const procEnv = typeof process !== 'undefined' ? process.env : undefined;

    // Build candidate valid codes list matching server.ts behavior
    const candidateEnvs = [
      env?.CRM_ACCESS_CODE,
      env?.ACCESS_CODE,
      env?.VITE_CRM_ACCESS_CODE,
      procEnv?.CRM_ACCESS_CODE,
      procEnv?.ACCESS_CODE,
      procEnv?.VITE_CRM_ACCESS_CODE,
    ];

    const validCodes: string[] = [];
    for (const cand of candidateEnvs) {
      const norm = normalizeSecret(cand);
      if (norm && !validCodes.includes(norm)) {
        validCodes.push(norm);
      }
    }

    // Default fallback access code if no secret is explicitly defined
    if (validCodes.length === 0) {
      validCodes.push("Crown5002");
    }

    const cleanCode = typeof code === "string" ? code.trim() : "";

    // Exact match or case-normalized match
    const isCodeMatch = Boolean(
      cleanCode &&
      validCodes.some(v => cleanCode === v || cleanCode.toLowerCase() === v.toLowerCase())
    );

    if (isCodeMatch) {
      return new Response(
        JSON.stringify({ status: "success", success: true }),
        { status: 200, headers: corsHeaders }
      );
    } else {
      return new Response(
        JSON.stringify({ status: "error", success: false, error: "Incorrect access code. Please try again." }),
        { status: 400, headers: corsHeaders }
      );
    }
  } catch (err: any) {
    return new Response(
      JSON.stringify({ status: "error", success: false, error: "Verification processing failed." }),
      { status: 500, headers: corsHeaders }
    );
  }
};

export const onRequestPost = onRequest;
export const onRequestGet = onRequest;
export const onRequestHead = onRequest;

