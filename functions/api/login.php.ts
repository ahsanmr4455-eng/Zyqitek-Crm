// Cloudflare Pages Function: /api/login.php

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
    if (request.method === "POST" || request.method === "PUT") {
      try {
        body = await request.json();
      } catch (_e) {
        body = {};
      }
    }

    const checkOnly = body?.checkOnly !== undefined ? body.checkOnly : false;
    if (checkOnly) {
      return new Response(
        JSON.stringify({ status: "active", success: true, locked: false, lock_remaining_seconds: 0 }),
        { status: 200, headers: corsHeaders }
      );
    }

    const username = (body?.username || "").trim().toLowerCase();
    const password = (body?.password || "").trim();
    const securityCode = (body?.securityCode || body?.security_code || "").trim();

    const procEnv = typeof process !== 'undefined' ? process.env : undefined;
    const expectedUser = ((env && env.ADMIN_USERNAME) || procEnv?.ADMIN_USERNAME || "zyqro87").toLowerCase();
    const expectedPass = (env && env.ADMIN_PASSWORD) || procEnv?.ADMIN_PASSWORD || "digital97@-";
    const expectedSecCode = (env && env.ADMIN_SECURITY_CODE) || procEnv?.ADMIN_SECURITY_CODE || "2005";

    const isUserValid = username === expectedUser || username === `${expectedUser}+`;
    const isPassValid = password === expectedPass;
    const isCodeValid = securityCode === expectedSecCode;

    if (username && password && securityCode && isUserValid && isPassValid && isCodeValid) {
      const tempToken = "temp-" + Math.random().toString(36).substring(2) + Date.now().toString(36);
      return new Response(
        JSON.stringify({
          status: "step1_success",
          success: true,
          tempToken,
          message: "Credentials verified. Please proceed to Administrator Verification."
        }),
        { status: 200, headers: corsHeaders }
      );
    } else {
      return new Response(
        JSON.stringify({ status: "error", success: false, error: "Invalid credentials." }),
        { status: 400, headers: corsHeaders }
      );
    }
  } catch (err: any) {
    return new Response(
      JSON.stringify({ status: "error", success: false, error: "Authentication processing failed." }),
      { status: 500, headers: corsHeaders }
    );
  }
};

export const onRequestPost = onRequest;
export const onRequestGet = onRequest;
export const onRequestHead = onRequest;
