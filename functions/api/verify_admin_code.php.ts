// Cloudflare Pages Function: /api/verify_admin_code.php

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

    const adminCode = (body?.admin_code || body?.adminCode || "").trim();
    const procEnv = typeof process !== 'undefined' ? process.env : undefined;
    const validAdminCode = (env && env.ADMIN_CODE) ? env.ADMIN_CODE : (procEnv?.ADMIN_CODE || "AdminA9");

    if (adminCode && adminCode === validAdminCode) {
      const token = "token-" + Math.random().toString(36).substring(2) + Date.now().toString(36);
      const csrfToken = "csrf-" + Math.random().toString(36).substring(2);

      return new Response(
        JSON.stringify({
          status: "success",
          success: true,
          token,
          csrfToken,
          role: "Admin",
          user: {
            id: "user-1",
            username: "Zyqro99+",
            role: "Admin",
            fullName: "Zyqitek Administrator"
          }
        }),
        { status: 200, headers: corsHeaders }
      );
    } else {
      return new Response(
        JSON.stringify({ status: "error", success: false, error: "Invalid login credentials. Please try again." }),
        { status: 400, headers: corsHeaders }
      );
    }
  } catch (err: any) {
    return new Response(
      JSON.stringify({ status: "error", success: false, error: "Administrator verification processing failed." }),
      { status: 500, headers: corsHeaders }
    );
  }
};

export const onRequestPost = onRequest;
export const onRequestGet = onRequest;
export const onRequestHead = onRequest;
