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

    if (request.method === "POST" || request.method === "PUT" || request.method === "PATCH") {
      try {
        const text = await request.text();
        if (text) {
          body = JSON.parse(text);
        }
      } catch (_e) {
        body = {};
      }
    }

    const code = body?.code || url.searchParams.get("code") || body?.accessCode || url.searchParams.get("accessCode") || "";
    const checkOnly = body?.checkOnly !== undefined ? body.checkOnly : url.searchParams.get("checkOnly") !== null;

    if (checkOnly) {
      return new Response(
        JSON.stringify({ status: "active", success: true, locked: false, lock_remaining_seconds: 0 }),
        { status: 200, headers: corsHeaders }
      );
    }

    const procEnv = typeof process !== 'undefined' ? process.env : undefined;
    const validAccessCode = (env && env.CRM_ACCESS_CODE) ? env.CRM_ACCESS_CODE : (procEnv?.CRM_ACCESS_CODE || "Crown5002");
    const cleanCode = typeof code === "string" ? code.trim() : "";

    if (cleanCode && cleanCode === validAccessCode) {
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
