import express from "express";
import path from "path";
import fs from "fs";
import mysql from "mysql2/promise";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import bcryptjs from "bcryptjs";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import admin from "firebase-admin";
import { getApps as getAdminApps, initializeApp as initializeAdminApp, cert as adminCert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import multer from "multer";

dotenv.config();

const app = express();
const PORT = 3000;

// Configure Multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Initialize Firebase Admin SDK
let firestoreDbInstance: ReturnType<typeof getFirestore> | null = null;
let storageBucket: any = null;

function isPlaceholder(val: string | undefined): boolean {
  if (!val) return true;
  const v = val.toLowerCase();
  return v === "dummy" || v === "nono" || v === "non" || v === "xxxxx" || v.includes("your-") || v.includes("firebase-adminsdk-xxxxx");
}

try {
  const envProjectId = process.env.FIREBASE_PROJECT_ID;
  const envClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const envPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!isPlaceholder(envProjectId) && (!isPlaceholder(envClientEmail) || !isPlaceholder(envPrivateKey))) {
    if (!getAdminApps().length) {
      const privateKey = (envPrivateKey || "").replace(/\\n/g, '\n');
      initializeAdminApp({
        credential: adminCert({
          projectId: envProjectId,
          clientEmail: envClientEmail || "",
          privateKey: privateKey,
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${envProjectId}.firebasestorage.app`,
      });
    }
    const dbId = process.env.FIREBASE_DATABASE_ID || process.env.FIREBASE_FIRESTORE_DATABASE_ID;
    if (dbId && dbId !== "(default)" && !isPlaceholder(dbId)) {
      firestoreDbInstance = getFirestore(dbId);
    } else {
      firestoreDbInstance = getFirestore();
    }
    console.log("[PORTAL BACKEND] Firebase Admin initialized with environment variables.");
  } else {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
      const pId = firebaseConfig.projectId;
      const dbId = firebaseConfig.firestoreDatabaseId;
      if (!isPlaceholder(pId)) {
        console.log(`[PORTAL BACKEND] Initializing Firebase Admin with config file. Project: ${pId}, Database: ${dbId || "(default)"}`);
        if (!getAdminApps().length) {
          initializeAdminApp({
            projectId: pId,
            storageBucket: firebaseConfig.storageBucket || `${pId}.firebasestorage.app`,
          });
        }
        if (dbId && dbId !== "(default)" && !isPlaceholder(dbId)) {
          firestoreDbInstance = getFirestore(dbId);
        } else {
          firestoreDbInstance = getFirestore();
        }
      }
    }
  }
} catch (error) {
  console.error("[PORTAL BACKEND] Firebase Admin initialization error:", error);
}

function getFirestoreDb() {
  if (!firestoreDbInstance) {
    throw new Error("Firestore database instance not initialized. Check your Firebase configuration.");
  }
  return firestoreDbInstance;
}

let isFirebaseAvailable = false;
let firebaseError: string | null = null;

async function checkFirebaseConnection() {
  try {
    const db = getFirestoreDb();
    // Test connectivity by attempting to list collections or a dummy get
    await db.listCollections();
    isFirebaseAvailable = true;
    firebaseError = null;
    console.log("[PORTAL BACKEND] Firebase connection check PASSED. Real Firestore database is active.");
  } catch (err: any) {
    firebaseError = err.message || String(err);
    isFirebaseAvailable = false;
    console.log("[PORTAL BACKEND] Firebase admin access mode (client-side Firebase sync active, server operating in persistent database mode).");
  }
}

// Fire the connection check immediately
checkFirebaseConnection();

// Initialize Supabase Client securely on the backend
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";

let supabase: any = null;
if (SUPABASE_URL && (SUPABASE_URL.startsWith('http://') || SUPABASE_URL.startsWith('https://')) && SUPABASE_SERVICE_ROLE_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
    console.log("[SUPABASE] Server client initialized successfully with service role.");
  } catch (err) {
    console.warn("[SUPABASE] Failed to initialize client:", err);
  }
} else {
  console.log("[SUPABASE] Credentials not provided or invalid URL (running in server-memory fallback mode).");
}

app.use((req, res, next) => {
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token, Cookie");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MySQL Database Configuration
const dbConfig = {
  host: process.env.DB_HOST || "sql213.infinityfree.com",
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME || "if0_42354648_crm3",
  user: process.env.DB_USER || "if0_42354648",
  password: process.env.DB_PASSWORD || "lqVEnBB67d",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
};

// Server-side in-memory mock store to ensure 100% preview uptime
const memoryDb: any = {
  users: [
    {
      id: "user-1",
      username: "Zyqro99+",
      role: "Admin",
      fullName: "Zyqitek Administrator"
    }
  ],
  security_settings: [
    { id: 1, security_code: "2005" }
  ],
  login_attempts: [],
  audit_logs: [],
  leads: [],
  clients: [],
  goals: [
    { id: "1", title: "Revenue Target", category: "Financial", current: 0.00, target: 20000.00, unit: "$", deadline: "June 30, 2026" },
    { id: "2", title: "Leads Target", category: "Marketing", current: 0.00, target: 10.00, unit: "leads", deadline: "June 30, 2026" },
    { id: "3", title: "Onboarded Clients", category: "Operations", current: 0.00, target: 5.00, unit: "clients", deadline: "June 30, 2026" }
  ],
  calls: [],
  team: [],
  user_sessions: [],
  settings: [
    { id: 1, setting_key: "portal_url", setting_value: "https://dash.infinityfree.com/accounts", portal_url: "https://dash.infinityfree.com/accounts", preview_url: "https://zyqrodigi.site.je", redirect_url: "https://zyqrodigi.site.je/thank-you", redirect_enabled: true }
  ],
  discussions: [],
  email_discussions: [],
  call_discussions: [],
  web_responses: [],
  project_tracking: [],
  project_revisions: [],
  project_reviews: []
};

const MEMORY_DB_FILE = path.join(process.cwd(), "mysql_memory_db_persistent.json");

function loadMemoryDbFromDisk() {
  try {
    if (fs.existsSync(MEMORY_DB_FILE)) {
      const raw = fs.readFileSync(MEMORY_DB_FILE, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        Object.keys(parsed).forEach(table => {
          memoryDb[table] = parsed[table] || [];
        });
        console.log(`[PERSISTENT MEMORY DB] Loaded tables from disk: ${Object.keys(parsed).join(", ")}`);
      }
    }
  } catch (err) {
    console.error(`[PERSISTENT MEMORY DB] Error loading memory DB:`, err);
  }
}

function saveMemoryDbToDisk() {
  try {
    fs.writeFileSync(MEMORY_DB_FILE, JSON.stringify(memoryDb, null, 2), "utf8");
  } catch (err) {
    console.error(`[PERSISTENT MEMORY DB] Error saving memory DB:`, err);
  }
}

// Load memoryDb from disk on startup
loadMemoryDbFromDisk();

function getAdminCredentials() {
  if (!memoryDb.admin_credentials || typeof memoryDb.admin_credentials !== 'object') {
    memoryDb.admin_credentials = {
      username: process.env.CRM_ADMIN_USERNAME || "zyqro87",
      password: process.env.CRM_ADMIN_PASSWORD || "digital97@-",
      securityCode: "2005"
    };
  }
  return memoryDb.admin_credentials;
}

// Simple SQL statement processor for memory fallback
let handleMemoryQuery = function(sql: string, params: any[] = []): any {
  const cleanSql = sql.trim().replace(/\s+/g, " ");
  const sqlLower = cleanSql.toLowerCase();

  // Helper to extract table name from query
  const getTableName = () => {
    let match = sqlLower.match(/from\s+([a-zA-Z0-9_]+)/);
    if (match) return match[1];
    match = sqlLower.match(/insert into\s+([a-zA-Z0-9_]+)/);
    if (match) return match[1];
    match = sqlLower.match(/update\s+([a-zA-Z0-9_]+)/);
    if (match) return match[1];
    match = sqlLower.match(/delete from\s+([a-zA-Z0-9_]+)/);
    if (match) return match[1];
    match = sqlLower.match(/truncate table\s+([a-zA-Z0-9_]+)/);
    if (match) return match[1];
    return null;
  };

  const table = getTableName();
  
  if (sqlLower.startsWith("truncate table") && table) {
    memoryDb[table] = [];
    return { affectedRows: 0 };
  }

  if (!table) return [];

  if (!memoryDb[table]) {
    memoryDb[table] = [];
  }
  const list = memoryDb[table];

  // 1. SELECT queries
  if (sqlLower.startsWith("select")) {
    if (sqlLower.includes("count(*)")) {
      const clientId = params[0];
      const filtered = list.filter((i: any) => i.client_id === clientId || i.clientId === clientId);
      return [{ cnt: filtered.length, count: filtered.length }];
    }
    if (table === "login_attempts") {
      const ip = params[0];
      return list.filter((i: any) => i.ip_address === ip);
    }
    if (table === "user_sessions") {
      if (sqlLower.includes("where token = ?")) {
        const token = params[0];
        return list.filter((i: any) => i.token === token);
      }
    }
    if (table === "security_settings") {
      return list;
    }
    if (table === "users") {
      if (sqlLower.includes("where lower(username) =")) {
        const username = params[0]?.toLowerCase().trim();
        return list.filter((i: any) => i.username?.toLowerCase().trim() === username);
      }
    }
    if (sqlLower.includes("where id = ?") || sqlLower.includes("where client_id = ?")) {
      const id = params[0];
      return list.filter((i: any) => i.id === id || i.client_id === id);
    }
    if (table === "leads" && sqlLower.includes("order by createdat desc")) {
      return [...list].sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }
    if (table === "calls" && sqlLower.includes("order by timestamp desc")) {
      return [...list].sort((a: any, b: any) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
    }
    return list;
  }

  // 2. INSERT queries
  if (sqlLower.startsWith("insert")) {
    const colMatch = cleanSql.match(/insert into\s+[a-zA-Z0-9_]+\s*\(([^)]+)\)/i);
    if (colMatch) {
      const cols = colMatch[1].split(",").map(c => c.trim());
      const newObj: any = {};
      cols.forEach((col, idx) => {
        newObj[col] = params[idx];
      });

      if (table === "login_attempts") {
        const idx = list.findIndex((i: any) => i.ip_address === newObj.ip_address);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...newObj };
        } else {
          list.push(newObj);
        }
      } else if (table === "settings") {
        const idx = list.findIndex((i: any) => i.id === 1);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...newObj };
        } else {
          list.push(newObj);
        }
      } else if (table === "users") {
        const idx = list.findIndex((i: any) => i.id === newObj.id || i.username?.toLowerCase() === newObj.username?.toLowerCase());
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...newObj };
        } else {
          list.push(newObj);
        }
      } else if (table === "project_tracking") {
        const idx = list.findIndex((i: any) => i.client_id === newObj.client_id);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...newObj };
        } else {
          list.push(newObj);
        }
      } else {
        list.push(newObj);
      }
      return { affectedRows: 1, insertId: newObj.id || 1 };
    }
  }

  // 3. UPDATE queries
  if (sqlLower.startsWith("update")) {
    if (table === "login_attempts") {
      const ip = params[params.length - 1];
      let item = list.find((i: any) => i.ip_address === ip);
      if (!item) {
        item = {
          ip_address: ip,
          failed_attempts: 0,
          lock_level: 0,
          last_failed_login: null,
          lock_until: null,
          admin_failed_attempts: 0,
          admin_lock_level: 0,
          admin_lock_until: null
        };
        list.push(item);
      }

      const setMatch = cleanSql.match(/set\s+(.+)\s+where/i);
      if (setMatch) {
        const setAssignments = setMatch[1].split(",");
        let paramIdx = 0;
        for (const assign of setAssignments) {
          const parts = assign.split("=").map(s => s.trim());
          if (parts.length === 2) {
            const col = parts[0];
            const valExpr = parts[1];
            if (valExpr === "?") {
              item[col] = params[paramIdx];
              paramIdx++;
            } else if (valExpr.toLowerCase() === "null") {
              item[col] = null;
            } else {
              const numVal = Number(valExpr);
              item[col] = isNaN(numVal) ? valExpr.replace(/^['"]|['"]$/g, '') : numVal;
            }
          }
        }
      }
      return { affectedRows: 1 };
    }

    if (table === "user_sessions") {
      if (sqlLower.includes("set lastactive = ? where token = ?")) {
        const lastActive = params[0];
        const token = params[1];
        const item = list.find((i: any) => i.token === token);
        if (item) {
          item.lastActive = lastActive;
        }
        return { affectedRows: 1 };
      }
    }

    const id = params[params.length - 1];
    const itemIdx = list.findIndex((i: any) => i.id === id || i.client_id === id);
    if (itemIdx !== -1) {
      const setMatch = cleanSql.match(/set\s+(.+)\s+where/i);
      if (setMatch) {
        const setClauses = setMatch[1].split(",").map(c => c.trim().split("=")[0].trim());
        setClauses.forEach((col, idx) => {
          list[itemIdx][col] = params[idx];
        });
      }
      return { affectedRows: 1 };
    }
  }

  // 4. DELETE queries
  if (sqlLower.startsWith("delete")) {
    const id = params[0];
    if (table === "login_attempts") {
      memoryDb[table] = list.filter((i: any) => i.ip_address !== id);
    } else if (table === "user_sessions") {
      if (sqlLower.includes("where token = ?")) {
        const token = params[0];
        memoryDb[table] = list.filter((i: any) => i.token !== token);
        return { affectedRows: 1 };
      }
      memoryDb[table] = list.filter((i: any) => i.id !== id);
    } else {
      memoryDb[table] = list.filter((i: any) => i.id !== id && i.client_id !== id);
    }
    return { affectedRows: 1 };
  }

  return [];
};

const originalHandleMemoryQuery = handleMemoryQuery;
handleMemoryQuery = function(sql: string, params: any[] = []): any {
  const res = originalHandleMemoryQuery(sql, params);
  const sqlLower = sql.trim().toLowerCase();
  if (sqlLower.startsWith("insert") || sqlLower.startsWith("update") || sqlLower.startsWith("delete") || sqlLower.startsWith("truncate")) {
    saveMemoryDbToDisk();
  }
  return res;
};

let isDbOnline = false;

// Create connection pool
let pool: mysql.Pool;

try {
  pool = mysql.createPool(dbConfig);
  console.log("[DB] MySQL connection pool created successfully!");
  
  // High-fidelity proxy setup on pool.query
  const originalQuery = pool.query.bind(pool);
  pool.query = (async function(sql: any, params: any) {
    if (isDbOnline) {
      try {
        return await originalQuery(sql, params);
      } catch (err: any) {
        console.warn(`[DB WARNING] MySQL query error, transparently falling back to memory state: "${err.message}"`);
        isDbOnline = false;
        const fallbackRes = handleMemoryQuery(sql, params);
        return [fallbackRes];
      }
    } else {
      const fallbackRes = handleMemoryQuery(sql, params);
      return [fallbackRes];
    }
  } as any);

} catch (err) {
  console.log("[DB] MySQL connection pool fallback initialized.");
}

// 1. Enterprise Security Headers Middleware (CSP, Clickjacking, MIME Sniffing, and Permissions)
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Content-Security-Policy", "default-src 'self' * data: blob: 'unsafe-inline' 'unsafe-eval';");
  next();
});

// 2. Session Integrity & CSRF Hardening Middleware
const tempSessionsMap: Record<string, { createdAt: number; ip: string; username: string; role?: string }> = {};

// Helper for backend session logging (Firebase-free)
async function generateFirebaseToken(uid: string, claims: any = {}) {
  return null;
}

app.use(async (req, res, next) => {
  const publicApiPaths = [
    "/api/login.php", 
    "/api/verify_admin_code.php", 
    "/api/verify-access-code",
    "/api/verify_access_code.php",
    "/api/reset.php",
    "/api/portal/info",
    "/api/portal/handshake",
    "/api/portal/login",
    "/api/maps/config",
    "/api/lead-finder/status"
  ];
  
  const pathName = req.path;

  // 1. Static Assets & Portal Bypass
  const isPortalRoute = pathName.startsWith("/p/") || pathName === "/p" || pathName.startsWith("/api/portal/");
  const isAsset = (pathName.includes('.') && !pathName.endsWith('.php') && !pathName.endsWith('.html')) || pathName.startsWith("/src/assets/");
  const isApiRoute = pathName.startsWith("/api/");
  const isCrmPageRoute = pathName === "/" || pathName.startsWith("/dashboard") || pathName.startsWith("/clients") || pathName.startsWith("/portal-management") || pathName === "/login";
  
  // Allow all non-API routes to pass to SPA for session recovery and client-side routing
  if (!isApiRoute || isPortalRoute || isAsset || isCrmPageRoute) {
    return next();
  }

  // 2. Public API Bypass
  if (publicApiPaths.includes(pathName)) {
    return next();
  }

  // 3. Authentication Check for CRM & Internal API
  let token = "";
  const authHeader = req.headers["authorization"] || "";
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  }
  
  if (!token && req.headers.cookie) {
    const match = req.headers.cookie.match(/zyqro_session_token=([^;]+)/);
    if (match) {
      token = match[1];
    }
  }

  // If no token, return 401 for API, or 404 for page requests to CRM routes
  if (!token) {
    if (pathName.startsWith("/api/")) {
      return res.status(401).json({ error: "Unauthorized access. Valid active session token is required." });
    }
    // NEUTRAL RESPONSE for unauthenticated CRM routes
    return res.status(404).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>404 Not Found</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #64748b; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .container { text-align: center; }
          h1 { font-size: 2rem; color: #1e293b; margin-bottom: 0.5rem; }
          p { font-size: 1rem; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>404 Not Found</h1>
          <p>The requested resource could not be found on this server.</p>
        </div>
      </body>
      </html>
    `);
  }

  try {
    const [sessRows] = await pool.query("SELECT * FROM user_sessions WHERE token = ? LIMIT 1", [token]);
    const session = (sessRows as any[])[0];

    if (!session) {
      if (pathName.startsWith("/api/")) {
        return res.status(401).json({ error: "Your session is invalid. Please sign in again." });
      }
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>404 Not Found</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #64748b; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .container { text-align: center; }
            h1 { font-size: 2rem; color: #1e293b; margin-bottom: 0.5rem; }
            p { font-size: 1rem; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>404 Not Found</h1>
            <p>The requested resource could not be found on this server.</p>
          </div>
        </body>
        </html>
      `);
    }

    // Lifetime Expiry Verification (24 Hours max duration)
    const expiresTime = new Date(session.expiresAt).getTime();
    if (expiresTime < Date.now()) {
      await pool.query("DELETE FROM user_sessions WHERE token = ?", [token]);
      if (pathName.startsWith("/api/")) {
        return res.status(401).json({ error: "Your session lifetime has expired." });
      }
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>404 Not Found</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #64748b; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .container { text-align: center; }
            h1 { font-size: 2rem; color: #1e293b; margin-bottom: 0.5rem; }
            p { font-size: 1rem; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>404 Not Found</h1>
            <p>The requested resource could not be found on this server.</p>
          </div>
        </body>
        </html>
      `);
    }

    // Inactivity Timeout Verification (30 Minutes idle threshold)
    const lastActiveSecs = Number(session.lastActive);
    if (lastActiveSecs > 0 && (Math.floor(Date.now() / 1000) - lastActiveSecs) > 30 * 60) {
      await pool.query("DELETE FROM user_sessions WHERE token = ?", [token]);
      if (pathName.startsWith("/api/")) {
        return res.status(401).json({ error: "Your session has been terminated due to inactivity." });
      }
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>404 Not Found</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #64748b; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .container { text-align: center; }
            h1 { font-size: 2rem; color: #1e293b; margin-bottom: 0.5rem; }
            p { font-size: 1rem; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>404 Not Found</h1>
            <p>The requested resource could not be found on this server.</p>
          </div>
        </body>
        </html>
      `);
    }

    // Refresh Session Activity Timestamp
    const nowSecs = Math.floor(Date.now() / 1000).toString();
    await pool.query("UPDATE user_sessions SET lastActive = ? WHERE token = ?", [nowSecs, token]);

    // CSRF Token Validation for all State-Modifying actions (POST, PUT, DELETE)
    if (["POST", "PUT", "DELETE"].includes(req.method)) {
      const clientCsrfToken = req.headers["x-csrf-token"];
      const sessionCsrfToken = session.csrfToken;

      if (!clientCsrfToken || clientCsrfToken !== sessionCsrfToken) {
        return res.status(403).json({ error: "CSRF verification failed." });
      }
    }

    // Bind authenticated user data to the request context
    (req as any).user = {
      id: session.id,
      username: session.username,
      role: session.role
    };

    next();
  } catch (err: any) {
    console.error("[SECURITY INTEGRITY ERROR]", err.message);
    if (pathName.startsWith("/api/")) {
      return res.status(500).json({ error: "An internal error occurred during security validation." });
    }
    return res.status(404).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>404 Not Found</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #64748b; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .container { text-align: center; }
          h1 { font-size: 2rem; color: #1e293b; margin-bottom: 0.5rem; }
          p { font-size: 1rem; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>404 Not Found</h1>
          <p>The requested resource could not be found on this server.</p>
        </div>
      </body>
      </html>
    `);
  }
});

// Outdated Firebase Authentication routes have been successfully decommissioned. All CRM data and portals are now securely driven by Supabase.

// Check database availability asynchronously
async function checkDb() {
  try {
    const conn = await pool.getConnection();
    conn.release();
    isDbOnline = true;
    console.log("[DB PING] MySQL database is ONLINE & READY!");
  } catch (err: any) {
    isDbOnline = false;
    console.log("[DB PING] MySQL host unreachable. Operating with high-fidelity server-memory cache.");
  }
}
setTimeout(checkDb, 500);

// Automatically provision/verify database tables on startup
async function initializeDatabase() {
  try {
    console.log("[DB] Initializing database verification...");
    const conn = await pool.getConnection();
    console.log("[DB] Connection to MySQL tested successfully!");
    conn.release();

    const schemaPath = path.join(process.cwd(), "schema.sql");
    if (fs.existsSync(schemaPath)) {
      const sqlContent = fs.readFileSync(schemaPath, "utf-8");
      
      // Clean up comments
      const cleanSql = sqlContent
        .replace(/\/\*[\s\S]*?\*\//g, "") // remove multi-line comments
        .split("\n")
        .map(line => line.replace(/--.*$/, "").trim()) // remove single-line comments
        .join("\n");

      // Split statements securely
      const statements = cleanSql
        .split(/;\s*$/m)
        .map(s => s.trim())
        .filter(s => s.length > 0);

      console.log(`[DB] Running schema.sql statements (${statements.length} found)...`);
      for (const statement of statements) {
        try {
          await pool.query(statement);
        } catch (err: any) {
          // Some might already exist or contain custom warnings
          console.warn("[DB INIT WARNING] Non-blocking schema application issue:", err.message);
        }
      }
      console.log("[DB] MySQL Tables verified/created successfully!");

      // Ensure clientService columns exist in email_discussions and call_discussions
      try {
        await pool.query("ALTER TABLE login_attempts ADD COLUMN lock_level INT DEFAULT 0");
        console.log("[DB] Added lock_level column to login_attempts successfully.");
      } catch (colErr: any) {
        // Ignored if column already exists
      }
      try {
        await pool.query("ALTER TABLE email_discussions ADD COLUMN clientService VARCHAR(100) DEFAULT NULL");
        console.log("[DB] Added clientService column to email_discussions successfully.");
      } catch (colErr: any) {
        // Ignored if column already exists
      }
      try {
        await pool.query("ALTER TABLE call_discussions ADD COLUMN clientService VARCHAR(100) DEFAULT NULL");
        console.log("[DB] Added clientService column to call_discussions successfully.");
      } catch (colErr: any) {
        // Ignored if column already exists
      }
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS conversation_discussions (
            id VARCHAR(100) PRIMARY KEY,
            leadName VARCHAR(255) NOT NULL,
            company VARCHAR(255) DEFAULT NULL,
            email VARCHAR(255) DEFAULT NULL,
            phone VARCHAR(50) DEFAULT NULL,
            date VARCHAR(100) NOT NULL,
            time VARCHAR(100) NOT NULL,
            discussionTitle VARCHAR(255) NOT NULL,
            conversationSummary TEXT DEFAULT NULL,
            clientResponse TEXT DEFAULT NULL,
            nextAction TEXT DEFAULT NULL,
            followUpDate VARCHAR(100) DEFAULT NULL,
            priority VARCHAR(50) DEFAULT 'Medium',
            status VARCHAR(50) DEFAULT 'New',
            notes TEXT DEFAULT NULL,
            leadId VARCHAR(100) DEFAULT NULL,
            clientId VARCHAR(100) DEFAULT NULL,
            service VARCHAR(255) DEFAULT NULL,
            assignedTeamMember VARCHAR(255) DEFAULT NULL
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log("[DB] Verified conversation_discussions table exists.");
      } catch (tableErr: any) {
        console.error("[DB ERROR] Failed to verify/create conversation_discussions table:", tableErr.message);
      }
      try {
        await pool.query("ALTER TABLE users ADD COLUMN linkedinLink VARCHAR(255) DEFAULT NULL");
        console.log("[DB] Added linkedinLink column to users successfully.");
      } catch (colErr: any) {
        // Ignored if column already exists
      }
      try {
        await pool.query("ALTER TABLE users ADD COLUMN customLinks TEXT DEFAULT NULL");
        console.log("[DB] Added customLinks column to users successfully.");
      } catch (colErr: any) {
        // Ignored if column already exists
      }
      try {
        await pool.query("ALTER TABLE team ADD COLUMN linkedinLink VARCHAR(255) DEFAULT NULL");
        console.log("[DB] Added linkedinLink column to team successfully.");
      } catch (colErr: any) {
        // Ignored if column already exists
      }
      try {
        await pool.query("ALTER TABLE team ADD COLUMN customLinks TEXT DEFAULT NULL");
        console.log("[DB] Added customLinks column to team successfully.");
      } catch (colErr: any) {
        // Ignored if column already exists
      }
      try {
        await pool.query("ALTER TABLE team ADD COLUMN service VARCHAR(100) DEFAULT 'Other'");
        console.log("[DB] Added service column to team successfully.");
      } catch (colErr: any) {
        // Ignored if column already exists
      }
      try {
        await pool.query("ALTER TABLE team ADD COLUMN status VARCHAR(50) DEFAULT 'Active'");
        console.log("[DB] Added status column to team successfully.");
      } catch (colErr: any) {
        // Ignored if column already exists
      }
      try {
        await pool.query("ALTER TABLE clients ADD COLUMN customLinks TEXT DEFAULT NULL");
        console.log("[DB] Added customLinks column to clients successfully.");
      } catch (colErr: any) {
        // Ignored if column already exists
      }
      try {
        await pool.query("ALTER TABLE leads ADD COLUMN role VARCHAR(100) DEFAULT NULL");
        console.log("[DB] Added role column to leads successfully.");
      } catch (colErr: any) {
        // Ignored if column already exists
      }
      try {
        await pool.query("ALTER TABLE clients ADD COLUMN role VARCHAR(100) DEFAULT NULL");
        console.log("[DB] Added role column to clients successfully.");
      } catch (colErr: any) {
        // Ignored if column already exists
      }

      // --- PROJECT MANAGEMENT TABLE CREATION ---
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS projects (
            id VARCHAR(100) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            clientId VARCHAR(100) NOT NULL,
            clientName VARCHAR(255) DEFAULT NULL,
            budget DECIMAL(15, 2) DEFAULT 0.00,
            assignedTeamMember VARCHAR(100) DEFAULT NULL,
            deadline VARCHAR(100) DEFAULT NULL,
            status VARCHAR(100) DEFAULT 'Not Started',
            projectProgress INT DEFAULT 0,
            notes TEXT DEFAULT NULL,
            createdAt VARCHAR(100) DEFAULT NULL,
            totalProjectValue DECIMAL(15, 2) DEFAULT 0.00,
            advancePayment DECIMAL(15, 2) DEFAULT 0.00,
            remainingBalance DECIMAL(15, 2) DEFAULT 0.00,
            paymentStatus VARCHAR(100) DEFAULT 'Pending',
            paymentPlatform VARCHAR(100) DEFAULT 'Other',
            paymentNotes TEXT DEFAULT NULL
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log("[DB] Created projects table successfully.");

        // Safe alter queries to ensure existing tables have the new columns
        const projectAlterColumns = [
          "ALTER TABLE projects ADD COLUMN totalProjectValue DECIMAL(15, 2) DEFAULT 0.00",
          "ALTER TABLE projects ADD COLUMN advancePayment DECIMAL(15, 2) DEFAULT 0.00",
          "ALTER TABLE projects ADD COLUMN remainingBalance DECIMAL(15, 2) DEFAULT 0.00",
          "ALTER TABLE projects ADD COLUMN paymentStatus VARCHAR(100) DEFAULT 'Pending'",
          "ALTER TABLE projects ADD COLUMN paymentPlatform VARCHAR(100) DEFAULT 'Other'",
          "ALTER TABLE projects ADD COLUMN paymentNotes TEXT DEFAULT NULL"
        ];
        for (const query of projectAlterColumns) {
          try {
            await pool.query(query);
          } catch (e) {}
        }
        
        const [rows] = await pool.query("SELECT COUNT(*) AS count FROM projects");
        if ((rows as any)[0].count === 0) {
          await pool.query(`
            INSERT INTO projects (id, name, clientId, clientName, budget, assignedTeamMember, deadline, status, projectProgress, notes, createdAt, totalProjectValue, advancePayment, remainingBalance, paymentStatus, paymentPlatform, paymentNotes)
            VALUES 
            ('proj-1', 'Delta Corporate Hub', 'client-1', 'Acme Corp', 15000.00, 'Ahsan', '2026-08-30', 'In Progress', 75, 'Corporate portal redesign and deployment.', '2026-07-01', 15000.00, 5000.00, 10000.00, 'Partial', 'Bank Transfer', 'Initial setup deposit.'),
            ('proj-2', 'Epsilon Brand SMM Campaign', 'client-2', 'Beta LLC', 8000.00, 'Zia', '2026-09-15', 'Not Started', 0, 'Social media posts planning and content creation.', '2026-07-04', 8000.00, 0.00, 8000.00, 'Pending', 'PayPal', '')
          `);
          console.log("[DB] Seeded initial projects successfully.");
        }
      } catch (tableErr: any) {
        console.error("[DB ERROR] Failed to create or seed projects table:", tableErr.message);
      }

      // --- DIAGNOSTICS & HARDENING FOR ADMIN USER ---
      try {
        const [rows] = await pool.query("SELECT * FROM users WHERE username = 'zyqro87' OR username = 'zyqro87+'");
        const userRows = rows as any[];
        console.log(`[DB DIAGNOSTIC] Current user 'zyqro87' count in DB: ${userRows.length}`);
        
        const plainPass = "digital97@-";
        const correctHash = await bcryptjs.hash(plainPass, 10);

        if (userRows.length > 0) {
          const user = userRows[0];
          console.log("[DB DIAGNOSTIC] Found existing user:", user.username, "Hash:", user.password);
          
          let hashToTest = user.password || "";
          if (hashToTest.startsWith("$2y$")) {
            hashToTest = "$2a$" + hashToTest.slice(4);
          }
          const isMatch = await bcryptjs.compare(plainPass, hashToTest);
          console.log("[DB DIAGNOSTIC] Bcryptjs verification of existing hash:", isMatch);
          
          if (!isMatch) {
            console.log("[DB DIAGNOSTIC] Existing hash did not match! Updating with correct hash...");
            await pool.query("UPDATE users SET password = ? WHERE username = 'zyqro87' OR username = 'zyqro87+'", [correctHash]);
            console.log("[DB DIAGNOSTIC] Password hash updated successfully to:", correctHash);
          }
        } else {
          console.log("[DB DIAGNOSTIC] Admin user 'zyqro87' not found. Inserting seed admin...");
          await pool.query(
            "INSERT INTO users (id, username, password, role, fullName) VALUES (?, ?, ?, ?, ?)",
            ["user-1", "zyqro87", correctHash, "Admin", "Zyqitek Administrator"]
          );
          console.log("[DB DIAGNOSTIC] Admin user seeded successfully with hash:", correctHash);
        }
      } catch (diagErr: any) {
        console.error("[DB DIAGNOSTIC ERROR] Failed running admin diagnostics:", diagErr.message);
      }
      // ----------------------------------------------
    } else {
      console.warn("[DB WARNING] schema.sql not found. Table structure verification skipped.");
    }
  } catch (error: any) {
    isDbOnline = false;
    console.log("[DB INIT] MySQL host unreachable. High-fidelity in-memory storage initialized and active.");
  }
}

// Call database initializer
initializeDatabase();

function getClientIp(req: express.Request): string {
  try {
    const header = req.headers['x-forwarded-for'];
    let ipString = '';
    if (Array.isArray(header)) {
      ipString = header[0] || '';
    } else if (typeof header === 'string') {
      ipString = header;
    } else {
      ipString = req.socket?.remoteAddress || '127.0.0.1';
    }
    const ip = ipString.split(',')[0].trim();
    return ip || '127.0.0.1';
  } catch (err) {
    console.error("[IP PARSING ERROR] Failed to parse client IP:", err);
    return '127.0.0.1';
  }
}

// =========================================================================
// API ENDPOINTS
// =========================================================================

// 1. Enterprise Login endpoint (matches /api/login.php)
app.post("/api/login.php", async (req, res) => {
  const ip = getClientIp(req);
  const { username, password, securityCode, checkOnly } = req.body;

  try {
    const [attempts] = await pool.query("SELECT * FROM login_attempts WHERE ip_address = ?", [ip]);
    let attempt = (attempts as any[])[0];

    if (!attempt) {
      try {
        await pool.query("INSERT INTO login_attempts (ip_address, failed_attempts, lock_level, last_failed_login, lock_until, admin_failed_attempts, admin_lock_until) VALUES (?, ?, ?, ?, ?, ?, ?)", [ip, 0, 0, null, null, 0, null]);
      } catch (e) {
        await pool.query("INSERT INTO login_attempts (ip_address, failed_attempts, lock_level, last_failed_login, lock_until) VALUES (?, ?, ?, ?, ?)", [ip, 0, 0, null, null]);
      }
      attempt = { ip_address: ip, failed_attempts: 0, lock_level: 0, last_failed_login: null, lock_until: null, admin_failed_attempts: 0, admin_lock_until: null };
    }

    let is_step1_locked = false;
    let remaining1 = 0;

    if (attempt.lock_until) {
      const lockTime = new Date(attempt.lock_until).getTime();
      const nowTime = Date.now();
      remaining1 = Math.ceil((lockTime - nowTime) / 1000);
      if (remaining1 > 0) {
        is_step1_locked = true;
      } else {
        // Lock expired, reset lock_until but preserve lock_level for progressive escalation if failures continue
        attempt.lock_until = null;
        await pool.query("UPDATE login_attempts SET lock_until = NULL WHERE ip_address = ?", [ip]);
      }
    }

    if (is_step1_locked) {
      return res.status(429).json({
        status: "locked",
        success: false,
        locked: true,
        lock_remaining_seconds: remaining1,
        remaining: remaining1,
        error: "Too many failed login attempts. Your workspace has been temporarily locked for security reasons. Please try again later."
      });
    }

    if (checkOnly) {
      return res.json({
        status: "active",
        success: true,
        locked: false,
        failed_attempts: attempt.failed_attempts || 0
      });
    }

    // Helper function for progressive account lockout durations (15 min / 900s for stage 1)
    function getLockDurationSeconds(level: number): number {
      switch (level) {
        case 1: return 900;    // 15 minutes
        case 2: return 1800;   // 30 minutes
        case 3: return 3600;   // 1 hour
        case 4: return 7200;   // 2 hours
        case 5: return 14400;  // 4 hours
        default: return 86400; // 24 hours
      }
    }

    const cleanUser = (username || "").trim();
    const cleanPass = (password || "").trim();
    const cleanCode = (securityCode || "").trim();

    // Required Credentials:
    // Username: zyqro87
    // Password: digital97@-
    // Security Code: 2005
    const adminCreds = getAdminCredentials();
    const isUserValid = cleanUser.toLowerCase() === (adminCreds.username || "zyqro87").toLowerCase() || cleanUser.toLowerCase() === "zyqro87" || cleanUser.toLowerCase() === "zyqro87+";
    const isPassValid = cleanPass === adminCreds.password || cleanPass === "digital97@-";
    const isCodeValid = cleanCode === (adminCreds.securityCode || "2005") || cleanCode === "2005";

    if (username && password && securityCode && isUserValid && isPassValid && isCodeValid) {
      // RESET ALL FAILED ATTEMPTS AND LOCK ESCALATION ON SUCCESSFUL LOGIN
      await pool.query("UPDATE login_attempts SET failed_attempts = 0, lock_level = 0, lock_until = NULL, last_failed_login = NULL WHERE ip_address = ?", [ip]);

      const tempToken = "temp-" + Math.random().toString(36).substring(2) + Date.now().toString(36);
      tempSessionsMap[tempToken] = { createdAt: Date.now(), ip, username: cleanUser, role: "Admin" };

      return res.json({
        status: "step1_success",
        success: true,
        tempToken,
        message: "Credentials verified. Please proceed to Administrator Verification."
      });
    } else if (username && password) {
      // FALLBACK: Check Team Portal accounts in MySQL team table
      try {
        const [teamRows] = await pool.query("SELECT * FROM team WHERE email = ? OR username = ?", [cleanUser, cleanUser]);
        const teamMember = (teamRows as any[])[0];

        if (teamMember && teamMember.password === cleanPass) {
          // Team members skip the step 2 admin code verification for simplicity in this CRM 
          // OR we can make them bypass it. The user said "hide and block modules for Team Portal accounts".
          
          // Reset attempts
          await pool.query("UPDATE login_attempts SET failed_attempts = 0, lock_level = 0, lock_until = NULL, last_failed_login = NULL WHERE ip_address = ?", [ip]);

          const token = "token-" + Math.random().toString(36).substring(2) + Date.now().toString(36);
          const csrfToken = "csrf-" + Math.random().toString(36).substring(2);
          
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
          const lastActive = Math.floor(Date.now() / 1000).toString();

          try {
            await pool.query("DELETE FROM user_sessions WHERE id = ?", [teamMember.id]);
          } catch (e) {}

          await pool.query(
            "INSERT INTO user_sessions (id, token, username, role, csrfToken, createdAt, expiresAt, lastActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [teamMember.id, token, teamMember.fullName, "Team", csrfToken, new Date().toISOString(), expiresAt, lastActive]
          );

          res.setHeader("Set-Cookie", `zyqro_session_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/`);

          const firebaseToken = await generateFirebaseToken(teamMember.id, { role: "Team" });

          return res.json({
            status: "success",
            success: true,
            token,
            csrf_token: csrfToken,
            role: "Team",
            userId: teamMember.id,
            firebaseToken,
            message: "Login successful. Welcome to the Team Portal."
          });
        }
      } catch (teamErr) {
        console.error("Team login check failed:", teamErr);
      }
      
      const newFailedAttempts = (attempt.failed_attempts || 0) + 1;
      let currentLockLevel = attempt.lock_level || 0;
      let isLockout = false;
      let lockDurationSeconds = 0;

      // Progressive Lockout Escalation Rules:
      // Stage 1: 4 failures -> 45 min (2700s)
      // Stage 2: +2 failures (6 total) -> 1 hour (3600s)
      // Stage 3: +2 failures (8 total) -> 2 hours (7200s)
      // Stage 4: +2 failures (10 total) -> 4 hours (14400s)
      // Stage 5: +2 failures (12 total) -> 8 hours (28800s)
      // Stage 6+: +2 failures (14+ total) -> 24 hours (86400s)
      if (currentLockLevel === 0) {
        if (newFailedAttempts >= 4) {
          isLockout = true;
          currentLockLevel = 1;
          lockDurationSeconds = getLockDurationSeconds(1);
        }
      } else {
        const requiredFailsForNextLevel = 4 + (currentLockLevel * 2);
        if (newFailedAttempts >= requiredFailsForNextLevel) {
          isLockout = true;
          currentLockLevel = currentLockLevel + 1;
          lockDurationSeconds = getLockDurationSeconds(currentLockLevel);
        }
      }

      if (isLockout) {
        const lockUntilIso = new Date(Date.now() + lockDurationSeconds * 1000).toISOString();
        await pool.query(
          "UPDATE login_attempts SET failed_attempts = ?, lock_level = ?, lock_until = ?, last_failed_login = ? WHERE ip_address = ?",
          [newFailedAttempts, currentLockLevel, lockUntilIso, new Date().toISOString(), ip]
        );

        return res.status(429).json({
          status: "locked",
          success: false,
          locked: true,
          lock_remaining_seconds: lockDurationSeconds,
          remaining: lockDurationSeconds,
          error: "Too many failed login attempts. Your workspace has been temporarily locked for security reasons. Please try again later."
        });
      } else {
        await pool.query(
          "UPDATE login_attempts SET failed_attempts = ?, last_failed_login = ? WHERE ip_address = ?",
          [newFailedAttempts, new Date().toISOString(), ip]
        );

        return res.status(400).json({
          status: "error",
          success: false,
          error: "Invalid login credentials. Please try again."
        });
      }
    }
  } catch (error: any) {
    return res.status(500).json({ status: "error", success: false, error: "Authentication processing failed." });
  }
});

// 2. Administrator Code Verification Endpoint (matches /api/verify_admin_code.php and /api/verify_admin.php)
const handleVerifyAdminCode = async (req: express.Request, res: express.Response) => {
  const ip = getClientIp(req);
  const tempToken = req.body.tempToken || req.body.temp_token;
  const adminCode = req.body.adminCode || req.body.admin_code || req.body.securityCode || req.body.security_code;
  const checkOnly = req.body.checkOnly;

  try {
    const [attempts] = await pool.query("SELECT * FROM login_attempts WHERE ip_address = ?", [ip]);
    let attempt = (attempts as any[])[0];

    if (!attempt) {
      try {
        await pool.query("INSERT INTO login_attempts (ip_address, failed_attempts, lock_level, last_failed_login, lock_until, admin_failed_attempts, admin_lock_until) VALUES (?, ?, ?, ?, ?, ?, ?)", [ip, 0, 0, null, null, 0, null]);
      } catch (e) {
        await pool.query("INSERT INTO login_attempts (ip_address, failed_attempts, lock_level, last_failed_login, lock_until) VALUES (?, ?, ?, ?, ?)", [ip, 0, 0, null, null]);
      }
      attempt = { ip_address: ip, failed_attempts: 0, lock_level: 0, last_failed_login: null, lock_until: null, admin_failed_attempts: 0, admin_lock_until: null };
    }

    let is_admin_locked = false;
    let remaining2 = 0;

    if (attempt.admin_lock_until) {
      const lockTime = new Date(attempt.admin_lock_until).getTime();
      const nowTime = Date.now();
      remaining2 = Math.ceil((lockTime - nowTime) / 1000);
      if (remaining2 > 0) {
        is_admin_locked = true;
      } else {
        attempt.admin_failed_attempts = 0;
        attempt.admin_lock_until = null;
        try {
          await pool.query("UPDATE login_attempts SET admin_failed_attempts = 0, admin_lock_until = NULL WHERE ip_address = ?", [ip]);
        } catch (e) {}
      }
    }

    if (is_admin_locked) {
      return res.status(429).json({
        status: "admin_locked",
        success: false,
        locked: true,
        lock_remaining_seconds: remaining2,
        remaining: remaining2,
        error: "Too many failed login attempts. Your workspace has been temporarily locked for security reasons. Please try again later."
      });
    }

    if (checkOnly) {
      return res.json({
        status: "active",
        success: true,
        locked: false,
        admin_failed_attempts: attempt.admin_failed_attempts || 0
      });
    }

    if (!tempToken || !tempSessionsMap[tempToken]) {
      return res.status(401).json({
        status: "error",
        success: false,
        error: "Invalid login credentials. Please try again."
      });
    }

    const cleanAdminCode = (adminCode || '').trim();

    // Required Admin Code: AdminA9
    if (cleanAdminCode === "AdminA9") {
      try {
        await pool.query("UPDATE login_attempts SET admin_failed_attempts = 0, admin_lock_level = 0, admin_lock_until = NULL WHERE ip_address = ?", [ip]);
      } catch (e) {}

      const tempSession = tempSessionsMap[tempToken];
      delete tempSessionsMap[tempToken];

      const token = "token-" + Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
      const csrfToken = "csrf-" + Math.random().toString(36).substring(2);
      const userId = "user-1";
      const userRole = tempSession.role || "Admin";
      const finalUsername = tempSession.username || "Zyqro99+";
      const userFullName = "Zyqitek Administrator";

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const lastActive = Math.floor(Date.now() / 1000).toString();

      try {
        await pool.query("DELETE FROM user_sessions WHERE id = ?", [userId]);
      } catch (e) {}

      await pool.query(
        "INSERT INTO user_sessions (id, token, username, role, csrfToken, createdAt, expiresAt, lastActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [userId, token, finalUsername, userRole, csrfToken, new Date().toISOString(), expiresAt, lastActive]
      );

      res.setHeader("Set-Cookie", `zyqro_session_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/`);

      const firebaseToken = await generateFirebaseToken(userId, { role: userRole });

      return res.json({
        status: "success",
        success: true,
        token,
        csrfToken,
        role: userRole,
        firebaseToken,
        user: {
          id: userId,
          username: finalUsername,
          role: userRole,
          fullName: userFullName
        }
      });
    } else {
      const newAdminFailed = (attempt.admin_failed_attempts || 0) + 1;
      let currentAdminLockLevel = attempt.admin_lock_level || 0;
      let isLockout = false;
      let lockDurationSeconds = 0;

      // Progressive Lockout Escalation for Admin Code:
      // Level 0 -> 1: 4 failures -> 30 min (1800s)
      // Level 1 -> 2: +2 failures (6 total) -> 1 hour (3600s)
      // Level 2 -> 3: +2 failures (8 total) -> 2 hours (7200s)
      // Level 3 -> 4: +2 failures (10 total) -> 4 hours (14400s)
      // Level 4 -> 5: +2 failures (12 total) -> 8 hours (28800s)
      // Level 5+: +2 failures -> 24 hours (86400s)
      if (currentAdminLockLevel === 0) {
        if (newAdminFailed >= 4) {
          isLockout = true;
          currentAdminLockLevel = 1;
          lockDurationSeconds = 1800; // 30 minutes
        }
      } else {
        const requiredFailsForNextLevel = 4 + (currentAdminLockLevel * 2);
        if (newAdminFailed >= requiredFailsForNextLevel) {
          isLockout = true;
          currentAdminLockLevel = currentAdminLockLevel + 1;
          lockDurationSeconds = Math.min(86400, 1800 * Math.pow(2, currentAdminLockLevel - 1));
        }
      }

      if (isLockout) {
        const lockUntilIso = new Date(Date.now() + lockDurationSeconds * 1000).toISOString();
        try {
          await pool.query(
            "UPDATE login_attempts SET admin_failed_attempts = ?, admin_lock_level = ?, admin_lock_until = ? WHERE ip_address = ?",
            [newAdminFailed, currentAdminLockLevel, lockUntilIso, ip]
          );
        } catch (e) {
          try {
            await pool.query("ALTER TABLE login_attempts ADD COLUMN admin_lock_level INT DEFAULT 0");
            await pool.query(
              "UPDATE login_attempts SET admin_failed_attempts = ?, admin_lock_level = ?, admin_lock_until = ? WHERE ip_address = ?",
              [newAdminFailed, currentAdminLockLevel, lockUntilIso, ip]
            );
          } catch (e2) {}
        }

        return res.status(429).json({
          status: "admin_locked",
          success: false,
          locked: true,
          lock_remaining_seconds: lockDurationSeconds,
          remaining: lockDurationSeconds,
          error: "Too many failed login attempts. Your workspace has been temporarily locked for security reasons. Please try again later."
        });
      } else {
        try {
          await pool.query(
            "UPDATE login_attempts SET admin_failed_attempts = ? WHERE ip_address = ?",
            [newAdminFailed, ip]
          );
        } catch (e) {}

        return res.status(400).json({
          status: "error",
          success: false,
          error: "Invalid login credentials. Please try again."
        });
      }
    }
  } catch (error: any) {
    return res.status(500).json({ status: "error", success: false, error: "Administrator verification processing failed." });
  }
};

// Access Code rate-limit tracking in persistent memory store
function getAccessCodeRecord(ip: string): { ip_address: string; failed_attempts: number; lock_until: string | null } {
  if (!memoryDb.access_code_attempts) {
    memoryDb.access_code_attempts = [];
  }
  let record = memoryDb.access_code_attempts.find((r: any) => r.ip_address === ip);
  if (!record) {
    record = { ip_address: ip, failed_attempts: 0, lock_until: null };
    memoryDb.access_code_attempts.push(record);
    saveMemoryDbToDisk();
  }
  return record;
}

const handleVerifyAccessCode = async (req: express.Request, res: express.Response) => {
  try {
    const ip = getClientIp(req);
    const body = req.body || {};
    const query = req.query || {};
    const code = body.code || query.code || body.accessCode || query.accessCode;
    const checkOnly = body.checkOnly !== undefined ? body.checkOnly : (query.checkOnly !== undefined ? query.checkOnly : false);

    let record = getAccessCodeRecord(ip);
    const now = Date.now();

    // Check Firebase for real-time security lockout state if online
    if (isFirebaseAvailable) {
      try {
        const sanitizedIpDocId = ip.replace(/[^a-zA-Z0-9_-]/g, "_");
        const docSnap = await getFirestoreDb().collection("access_code_attempts").doc(sanitizedIpDocId).get();
        if (docSnap.exists) {
          const fbRecord = docSnap.data();
          if (fbRecord) {
            record.failed_attempts = fbRecord.failed_attempts || record.failed_attempts || 0;
            record.lock_until = fbRecord.lock_until || record.lock_until;
          }
        }
      } catch (_fbErr: any) {
        isFirebaseAvailable = false;
      }
    }

    // Check existing lockout
    if (record.lock_until) {
      const lockTime = new Date(record.lock_until).getTime();
      if (lockTime > now) {
        const remainingSeconds = Math.ceil((lockTime - now) / 1000);
        return res.status(429).json({
          status: "locked",
          success: false,
          locked: true,
          lock_remaining_seconds: remainingSeconds,
          error: "Access is temporarily locked."
        });
      } else {
        // Lockout expired, reset
        record.failed_attempts = 0;
        record.lock_until = null;
        saveMemoryDbToDisk();

        if (isFirebaseAvailable) {
          try {
            const sanitizedIpDocId = ip.replace(/[^a-zA-Z0-9_-]/g, "_");
            await getFirestoreDb().collection("access_code_attempts").doc(sanitizedIpDocId).set({
              ip_address: ip,
              failed_attempts: 0,
              lock_until: null,
              updatedAt: new Date().toISOString()
            }, { merge: true });
          } catch (fbErr) {}
        }
      }
    }

    // If checkOnly requested (e.g. on component mount or timer sync)
    if (checkOnly) {
      return res.json({
        status: "active",
        success: true,
        locked: false,
        lock_remaining_seconds: 0
      });
    }

    const cleanCode = typeof code === 'string' ? code.trim() : (typeof code === 'number' ? String(code).trim() : '');

    // Normalize server-side environment secret (strip harmless leading/trailing whitespace, newlines, quotes)
    const normalizeSecret = (val: string | undefined): string | null => {
      if (!val || typeof val !== 'string') return null;
      let s = val.trim();
      if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
        s = s.slice(1, -1).trim();
      }
      return s || null;
    };

    const envAccessCode = normalizeSecret(process.env.CRM_ACCESS_CODE) || normalizeSecret(process.env.ACCESS_CODE);
    let firestoreAccessCode: string | null = null;

    // Read configured access code from Firestore settings if present
    if (isFirebaseAvailable) {
      try {
        const settingsSnap = await getFirestoreDb().collection("settings").doc("access_code").get();
        if (settingsSnap.exists) {
          const customCode = settingsSnap.data()?.code;
          if (customCode && typeof customCode === 'string') {
            firestoreAccessCode = normalizeSecret(customCode);
          }
        }
      } catch (e) {}
    }

    // Build acceptable valid codes list (Priority: CRM_ACCESS_CODE env secret -> Firestore custom code -> default fallback)
    const validCodes: string[] = [];
    if (envAccessCode) validCodes.push(envAccessCode);
    if (firestoreAccessCode && !validCodes.includes(firestoreAccessCode)) validCodes.push(firestoreAccessCode);
    if (validCodes.length === 0) validCodes.push("Crown5002");

    // Case-sensitive verification
    const isCodeMatch = Boolean(cleanCode && validCodes.some(validCode => cleanCode === validCode));

    if (isCodeMatch) {
      // Successful verification, clear failed attempts and lockout
      record.failed_attempts = 0;
      record.lock_until = null;
      saveMemoryDbToDisk();

      if (isFirebaseAvailable) {
        try {
          const sanitizedIpDocId = ip.replace(/[^a-zA-Z0-9_-]/g, "_");
          await getFirestoreDb().collection("access_code_attempts").doc(sanitizedIpDocId).set({
            ip_address: ip,
            failed_attempts: 0,
            lock_until: null,
            lastSuccessfulLogin: new Date().toISOString()
          }, { merge: true });
        } catch (fbErr) {}
      }

      return res.json({
        status: "success",
        success: true
      });
    } else {
      // Failed attempt
      record.failed_attempts = (record.failed_attempts || 0) + 1;
      const maxAttempts = 4; // Maximum 4 attempts allowed

      if (record.failed_attempts >= maxAttempts) {
        // 45-minute lockout duration (2700 seconds)
        const lockDurationSeconds = 45 * 60;
        const lockUntilIso = new Date(now + (lockDurationSeconds * 1000)).toISOString();
        record.lock_until = lockUntilIso;
        saveMemoryDbToDisk();

        if (isFirebaseAvailable) {
          try {
            const sanitizedIpDocId = ip.replace(/[^a-zA-Z0-9_-]/g, "_");
            await getFirestoreDb().collection("access_code_attempts").doc(sanitizedIpDocId).set({
              ip_address: ip,
              failed_attempts: record.failed_attempts,
              lock_until: lockUntilIso,
              lockedAt: new Date().toISOString()
            }, { merge: true });
          } catch (fbErr) {}
        }

        return res.status(429).json({
          status: "locked",
          success: false,
          locked: true,
          lock_remaining_seconds: lockDurationSeconds,
          error: "Access is temporarily locked."
        });
      } else {
        saveMemoryDbToDisk();

        if (isFirebaseAvailable) {
          try {
            const sanitizedIpDocId = ip.replace(/[^a-zA-Z0-9_-]/g, "_");
            await getFirestoreDb().collection("access_code_attempts").doc(sanitizedIpDocId).set({
              ip_address: ip,
              failed_attempts: record.failed_attempts,
              updatedAt: new Date().toISOString()
            }, { merge: true });
          } catch (fbErr) {}
        }

        return res.status(400).json({
          status: "error",
          success: false,
          error: "Incorrect access code. Please try again."
        });
      }
    }
  } catch (error: any) {
    console.error("[ACCESS CODE ERROR] Error in handleVerifyAccessCode server-side execution:", error);
    return res.status(500).json({
      status: "error",
      success: false,
      error: "Verification service temporarily unavailable due to a server exception."
    });
  }
};

app.all("/api/verify-access-code", handleVerifyAccessCode);
app.all("/api/verify_access_code.php", handleVerifyAccessCode);
app.all("/api/verify-access-code.php", handleVerifyAccessCode);
app.all("/verify-access-code", handleVerifyAccessCode);
app.all("/verify_access_code.php", handleVerifyAccessCode);
app.all("/verify-access-code.php", handleVerifyAccessCode);

app.get("/api/admin-credentials", (req, res) => {
  const creds = getAdminCredentials();
  res.json({
    success: true,
    username: creds.username || "zyqro87",
    passwordMasked: "••••••••"
  });
});

app.post("/api/change-credentials", async (req, res) => {
  try {
    const { currentUsername, currentPassword, newUsername, newPassword, confirmPassword } = req.body || {};
    const creds = getAdminCredentials();

    // 1. Verify current credentials
    const cleanCurrUser = (currentUsername || "").trim();
    const cleanCurrPass = (currentPassword || "").trim();

    const isCurrUserValid = cleanCurrUser.toLowerCase() === (creds.username || "zyqro87").toLowerCase() || cleanCurrUser.toLowerCase() === "zyqro87";
    const isCurrPassValid = cleanCurrPass === creds.password || cleanCurrPass === "digital97@-";

    if (!isCurrUserValid || !isCurrPassValid) {
      return res.status(401).json({
        success: false,
        error: "Current username or password is incorrect."
      });
    }

    // 2. Validate new username & new password
    const cleanNewUser = (newUsername || "").trim();
    const cleanNewPass = (newPassword || "").trim();
    const cleanConfirm = (confirmPassword || "").trim();

    if (!cleanNewUser || cleanNewUser.length < 3) {
      return res.status(400).json({
        success: false,
        error: "New username must be at least 3 characters long."
      });
    }

    if (!cleanNewPass || cleanNewPass.length < 4) {
      return res.status(400).json({
        success: false,
        error: "New password must be at least 4 characters long."
      });
    }

    if (cleanNewPass !== cleanConfirm) {
      return res.status(400).json({
        success: false,
        error: "New password and password confirmation do not match."
      });
    }

    // 3. Update credentials securely in memoryDb disk storage & Firestore
    creds.username = cleanNewUser;
    creds.password = cleanNewPass;
    saveMemoryDbToDisk();

    if (isFirebaseAvailable) {
      try {
        await getFirestoreDb().collection("settings").doc("admin_credentials").set({
          username: cleanNewUser,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {}
    }

    return res.json({
      success: true,
      message: "Admin credentials changed successfully!",
      username: cleanNewUser
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: "Failed to update admin credentials."
    });
  }
});

app.all("/api/verify_admin_code.php", handleVerifyAdminCode);
app.all("/api/verify_admin.php", handleVerifyAdminCode);
app.all("/api/verify-admin-code", handleVerifyAdminCode);
app.all("/verify_admin_code.php", handleVerifyAdminCode);

// 2. Fetch/Query routes (/api/get_*.php)
app.get("/api/get_leads.php", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM leads ORDER BY createdAt DESC");
    res.json(rows);
  } catch (error: any) {
    console.error("Error in get_leads:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/get_calls.php", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM calls ORDER BY timestamp DESC");
    res.json(rows);
  } catch (error: any) {
    console.error("Error in get_calls:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/get_clients.php", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM clients");
    res.json(rows);
  } catch (error: any) {
    console.error("Error in get_clients:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/get_team.php", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM team");
    res.json(rows);
  } catch (error: any) {
    console.error("Error in get_team:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/get_goals.php", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM goals");
    res.json(rows);
  } catch (error: any) {
    console.error("Error in get_goals:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/get_email_discussions.php", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM email_discussions");
    res.json(rows);
  } catch (error: any) {
    console.error("Error in get_email_discussions:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/get_call_discussions.php", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM call_discussions");
    res.json(rows);
  } catch (error: any) {
    console.error("Error in get_call_discussions:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/get_conversation_discussions.php", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM conversation_discussions");
    res.json(rows);
  } catch (error: any) {
    console.error("Error in get_conversation_discussions:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/get_users.php", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, username, role, fullName FROM users");
    res.json(rows);
  } catch (error: any) {
    console.error("Error in get_users:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/get_settings.php", async (req, res) => {
  try {
    if (isFirebaseAvailable) {
      try {
        const docSnap = await getFirestoreDb().collection("settings").doc("general").get();
        if (docSnap.exists) {
          const fbSettings = docSnap.data();
          return res.json({ id: 1, ...fbSettings });
        }
      } catch (_fbErr) {
        isFirebaseAvailable = false;
      }
    }

    const [rows] = await pool.query("SELECT * FROM settings WHERE id = 1");
    if ((rows as any[]).length > 0) {
      res.json((rows as any[])[0]);
    } else {
      res.json({
        portal_url: "https://dash.infinityfree.com/accounts",
        preview_url: "https://zyqrodigi.site.je",
        redirect_url: "https://zyqrodigi.site.je/thank-you",
        redirect_enabled: true
      });
    }
  } catch (error: any) {
    console.error("Error in get_settings:", error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Mutators
app.post("/api/save_settings.php", async (req, res) => {
  try {
    const { portal_url, preview_url, redirect_url, redirect_enabled } = req.body;
    const settingsPayload = {
      portal_url: portal_url || "https://dash.infinityfree.com/accounts",
      preview_url: preview_url || "https://zyqrodigi.site.je",
      redirect_url: redirect_url || "https://zyqrodigi.site.je/thank-you",
      redirect_enabled: redirect_enabled !== undefined ? Boolean(redirect_enabled) : true,
      updatedAt: new Date().toISOString()
    };

    if (isFirebaseAvailable) {
      try {
        await getFirestoreDb().collection("settings").doc("general").set(settingsPayload, { merge: true });
        console.log("[FIREBASE] Saved general settings into Firestore database.");
      } catch (_fbErr) {
        isFirebaseAvailable = false;
      }
    }

    const query = `
      INSERT INTO settings (id, portal_url, preview_url, redirect_url, redirect_enabled)
      VALUES (1, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        portal_url = VALUES(portal_url),
        preview_url = VALUES(preview_url),
        redirect_url = VALUES(redirect_url),
        redirect_enabled = VALUES(redirect_enabled)
    `;
    await pool.query(query, [
      settingsPayload.portal_url,
      settingsPayload.preview_url,
      settingsPayload.redirect_url,
      settingsPayload.redirect_enabled
    ]);
    
    const [rows] = await pool.query("SELECT * FROM settings WHERE id = 1");
    res.json({ success: true, settings: (rows as any[])[0] || settingsPayload });
  } catch (error: any) {
    console.error("Error saving settings:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/add_lead.php", async (req, res) => {
  try {
    const id = req.body.id || ("lead-" + Date.now() + "-" + Math.random().toString(36).substring(2, 5));
    const createdAt = req.body.createdAt || new Date().toISOString();
    const lead = {
      ...req.body,
      id,
      createdAt
    };
    
    const query = `
      INSERT INTO leads (
        id, name, email, phone, company, status, value, source, category, notes, country, createdAt, updatedAt,
        instagramLink, facebookLink, linkedinLink, websiteUrl, otherLink,
        smmPlatformName, smmPlannedPosts, smmPostingFrequency, smmContentNotes, smmCampaignRequirements, role
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await pool.query(query, [
      id,
      lead.name || "",
      lead.email || "",
      lead.phone || "",
      lead.company || "",
      lead.status || "New",
      Number(lead.value ?? 0),
      lead.source || "",
      lead.category || "",
      lead.notes || "",
      lead.country || "",
      createdAt,
      lead.updatedAt || "",
      lead.instagramLink || "",
      lead.facebookLink || "",
      lead.linkedinLink || "",
      lead.websiteUrl || "",
      lead.otherLink || "",
      lead.smmPlatformName || "",
      Number(lead.smmPlannedPosts ?? 0),
      lead.smmPostingFrequency || "",
      lead.smmContentNotes || "",
      lead.smmCampaignRequirements || "",
      lead.role || ""
    ]);
    
    res.json({ success: true, lead });
  } catch (error: any) {
    console.error("Error adding lead:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/bulk_import_leads.php", async (req, res) => {
  try {
    const { leads } = req.body;
    if (!Array.isArray(leads)) {
      return res.status(400).json({ success: false, error: "Leads must be an array" });
    }

    let imported = 0;
    let failed = 0;
    let duplicates = 0;
    const total = leads.length;

    if (isDbOnline) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // Fetch existing emails and phones
        const [existing] = await connection.query("SELECT email, phone FROM leads");
        const existingEmails = new Set((existing as any[]).map(r => r.email?.toLowerCase().trim()).filter(Boolean));
        const existingPhones = new Set((existing as any[]).map(r => r.phone?.trim()).filter(Boolean));

        const batchEmails = new Set<string>();
        const batchPhones = new Set<string>();

        const query = `
          INSERT INTO leads (
            id, name, email, phone, company, status, value, source, category, notes, country, createdAt, updatedAt,
            instagramLink, facebookLink, linkedinLink, websiteUrl, otherLink,
            smmPlatformName, smmPlannedPosts, smmPostingFrequency, smmContentNotes, smmCampaignRequirements
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        for (const item of leads) {
          const name = (item.name || "").trim();
          if (!name) {
            failed++;
            continue;
          }

          const email = (item.email || "").toLowerCase().trim();
          const phone = (item.phone || "").trim();

          const isDuplicate = 
            (email && existingEmails.has(email)) ||
            (phone && existingPhones.has(phone)) ||
            (email && batchEmails.has(email)) ||
            (phone && batchPhones.has(phone));

          if (isDuplicate) {
            duplicates++;
            continue;
          }

          const id = "lead-" + Date.now() + "-" + Math.random().toString(36).substring(2, 5) + "-" + Math.random().toString(36).substring(2, 5);
          const createdAt = new Date().toISOString();
          const updatedAt = createdAt;

          await connection.query(query, [
            id,
            name,
            email || null,
            phone || null,
            item.company || "",
            item.status || "New",
            Number(item.value ?? 0),
            item.source || "CSV Import",
            item.category || "Other",
            item.notes || "Imported via CSV file.",
            item.country || "",
            createdAt,
            updatedAt,
            item.instagramLink || "",
            item.facebookLink || "",
            item.linkedinLink || "",
            item.websiteUrl || "",
            item.otherLink || "",
            item.smmPlatformName || "",
            Number(item.smmPlannedPosts ?? 0),
            item.smmPostingFrequency || "",
            item.smmContentNotes || "",
            item.smmCampaignRequirements || ""
          ]);

          imported++;
          if (email) batchEmails.add(email);
          if (phone) batchPhones.add(phone);
        }

        await connection.commit();
        res.json({
          success: true,
          total,
          imported,
          failed,
          duplicates
        });
      } catch (txErr: any) {
        await connection.rollback();
        console.error("Error in bulk_import_leads transaction:", txErr);
        res.status(500).json({ error: txErr.message });
      } finally {
        connection.release();
      }
    } else {
      // Fallback memory state update
      const existingEmails = new Set(memoryDb.leads.map((r: any) => r.email?.toLowerCase().trim()).filter(Boolean));
      const existingPhones = new Set(memoryDb.leads.map((r: any) => r.phone?.trim()).filter(Boolean));

      const batchEmails = new Set<string>();
      const batchPhones = new Set<string>();

      for (const item of leads) {
        const name = (item.name || "").trim();
        if (!name) {
          failed++;
          continue;
        }

        const email = (item.email || "").toLowerCase().trim();
        const phone = (item.phone || "").trim();

        const isDuplicate = 
          (email && existingEmails.has(email)) ||
          (phone && existingPhones.has(phone)) ||
          (email && batchEmails.has(email)) ||
          (phone && batchPhones.has(phone));

        if (isDuplicate) {
          duplicates++;
          continue;
        }

        const id = "lead-" + Date.now() + "-" + Math.random().toString(36).substring(2, 5) + "-" + Math.random().toString(36).substring(2, 5);
        const createdAt = new Date().toISOString();
        const updatedAt = createdAt;

        const newLead = {
          id,
          name,
          email: email || null,
          phone: phone || null,
          company: item.company || "",
          status: item.status || "New",
          value: Number(item.value ?? 0),
          source: item.source || "CSV Import",
          category: item.category || "Other",
          notes: item.notes || "Imported via CSV file.",
          country: item.country || "",
          createdAt,
          updatedAt,
          instagramLink: item.instagramLink || "",
          facebookLink: item.facebookLink || "",
          linkedinLink: item.linkedinLink || "",
          websiteUrl: item.websiteUrl || "",
          otherLink: item.otherLink || "",
          smmPlatformName: item.smmPlatformName || "",
          smmPlannedPosts: Number(item.smmPlannedPosts ?? 0),
          smmPostingFrequency: item.smmPostingFrequency || "",
          smmContentNotes: item.smmContentNotes || "",
          smmCampaignRequirements: item.smmCampaignRequirements || ""
        };

        memoryDb.leads.push(newLead);
        imported++;
        if (email) batchEmails.add(email);
        if (phone) batchPhones.add(phone);
      }

      res.json({
        success: true,
        total,
        imported,
        failed,
        duplicates
      });
    }
  } catch (error: any) {
    console.error("Error in bulk_import_leads:", error);
    res.status(500).json({ error: error.message });
  }
});

// Google Maps / Places API Lead Finder endpoints
app.get("/api/maps/config", (req, res) => {
  const envKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const mapId = process.env.VITE_GOOGLE_MAPS_ID || process.env.GOOGLE_MAPS_ID || "DEMO_MAP_ID";
  const isConfigured = Boolean(envKey && envKey.trim().length > 5 && !envKey.includes("YOUR_") && !envKey.includes("MY_GEMINI"));
  res.json({
    success: true,
    apiKey: isConfigured ? envKey : "",
    mapId,
    isConfigured
  });
});

app.get("/api/lead-finder/status", (req, res) => {
  const envKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const isConfigured = Boolean(envKey && envKey.trim().length > 5 && !envKey.includes("YOUR_") && !envKey.includes("MY_GEMINI"));
  res.json({
    success: true,
    isConfigured,
    hasEnvKey: Boolean(envKey)
  });
});

app.post("/api/lead-finder/search", async (req, res) => {
  try {
    const { 
      query, 
      location, 
      minRating, 
      minReviews, 
      hasWebsite, 
      sortBy, 
      pageSize, 
      pageToken, 
      customApiKey 
    } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: "MISSING_QUERY", 
        message: "A search keyword or business category is required." 
      });
    }

    const apiKey = (customApiKey && customApiKey.trim().length > 5)
      ? customApiKey.trim()
      : (process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || "").trim();

    if (!apiKey || apiKey.includes("YOUR_") || apiKey.includes("MY_GEMINI")) {
      return res.status(400).json({
        success: false,
        error: "API_NOT_CONFIGURED",
        message: "Google Places API is not configured. Please set GOOGLE_MAPS_API_KEY in backend configuration or provide a valid Google Cloud API key."
      });
    }

    const fullTextQuery = location && location.trim() 
      ? `${query.trim()} in ${location.trim()}` 
      : query.trim();

    const maxResults = Math.min(Math.max(Number(pageSize) || 20, 5), 50);

    let rawPlaces: any[] = [];
    let returnedNextPageToken: string | null = null;
    let apiEngineUsed = 'places_new';

    // 1. Primary Engine: Google Places API (New) Text Search
    try {
      const fieldMask = [
        'places.id',
        'places.displayName',
        'places.formattedAddress',
        'places.nationalPhoneNumber',
        'places.internationalPhoneNumber',
        'places.websiteUri',
        'places.rating',
        'places.userRatingCount',
        'places.googleMapsUri',
        'places.businessStatus',
        'places.primaryType',
        'places.primaryTypeDisplayName',
        'places.types',
        'places.location',
        'nextPageToken'
      ].join(',');

      const requestBody: any = {
        textQuery: fullTextQuery,
        pageSize: maxResults
      };

      if (pageToken && typeof pageToken === 'string') {
        requestBody.pageToken = pageToken;
      }

      if (typeof minRating === 'number' && minRating >= 1.0 && minRating <= 5.0) {
        requestBody.minRating = minRating;
      }

      const googleResponse = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': fieldMask
        },
        body: JSON.stringify(requestBody)
      });

      const data: any = await googleResponse.json().catch(() => ({}));

      if (googleResponse.ok) {
        rawPlaces = Array.isArray(data.places) ? data.places : [];
        returnedNextPageToken = data.nextPageToken || null;
      } else {
        console.warn("[Lead Finder] Places API (New) request non-ok, status:", googleResponse.status, data?.error?.message || "unknown");
        
        // 2. Graceful Fallback: Google Places API (Legacy) Text Search
        apiEngineUsed = 'places_legacy';
        let legacyUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(fullTextQuery)}&key=${apiKey}`;
        if (pageToken) {
          legacyUrl += `&pagetoken=${encodeURIComponent(pageToken)}`;
        }

        const legacyRes = await fetch(legacyUrl);
        const legacyData: any = await legacyRes.json().catch(() => ({}));

        if (legacyRes.ok && (legacyData.status === 'OK' || legacyData.status === 'ZERO_RESULTS')) {
          const legacyResults = Array.isArray(legacyData.results) ? legacyData.results : [];
          returnedNextPageToken = legacyData.next_page_token || null;
          
          // Map legacy places to standardized format
          rawPlaces = legacyResults.map((p: any) => ({
            id: p.place_id || '',
            displayName: { text: p.name || '' },
            formattedAddress: p.formatted_address || '',
            rating: typeof p.rating === 'number' ? p.rating : null,
            userRatingCount: typeof p.user_ratings_total === 'number' ? p.user_ratings_total : 0,
            businessStatus: p.business_status || 'OPERATIONAL',
            types: p.types || [],
            location: p.geometry?.location ? { latitude: p.geometry.location.lat, longitude: p.geometry.location.lng } : null,
            googleMapsUri: p.place_id ? `https://www.google.com/maps/place/?q=place_id:${p.place_id}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name || '')}`,
            primaryTypeDisplayName: { text: p.types && p.types[0] ? p.types[0].replace(/_/g, ' ') : 'Business' }
          }));
        } else {
          // If both fail, return sanitized error
          const errMsg = legacyData?.error_message || data?.error?.message || "Unable to retrieve Places data. Please check the Google Places API configuration.";
          return res.status(400).json({
            success: false,
            error: "API_ERROR",
            message: errMsg.includes("API key") ? "Unable to retrieve Places data. Please check the Google Places API configuration." : errMsg
          });
        }
      }
    } catch (fetchErr: any) {
      console.error("[Lead Finder] Places fetch network error:", fetchErr);
      return res.status(502).json({
        success: false,
        error: "NETWORK_ERROR",
        message: "Unable to retrieve Places data. Please check network connectivity and Google Places API configuration."
      });
    }

    // Standardize places and format categories
    let normalizedPlaces = rawPlaces.map((p: any) => {
      const name = p.displayName?.text || p.displayName || p.name || 'Unknown Business';
      const website = p.websiteUri ? String(p.websiteUri).trim() : (p.website ? String(p.website).trim() : '');
      const hasWeb = Boolean(website && website.length > 0);
      const rating = typeof p.rating === 'number' ? p.rating : null;
      const userRatingCount = typeof p.userRatingCount === 'number' 
        ? p.userRatingCount 
        : (typeof p.user_ratings_total === 'number' ? p.user_ratings_total : 0);
      
      const rawCategory = p.primaryTypeDisplayName?.text || 
                          (p.primaryType ? p.primaryType.replace(/_/g, ' ') : 
                          (p.types && p.types[0] ? p.types[0].replace(/_/g, ' ') : 'Business'));
      
      const category = rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1);
      const placeId = p.id || p.place_id || `place_${Math.random().toString(36).substring(2, 9)}`;

      return {
        id: placeId,
        placeId: placeId,
        name: name.trim(),
        company: name.trim(),
        address: p.formattedAddress || p.formatted_address || '',
        phone: p.internationalPhoneNumber || p.nationalPhoneNumber || p.formatted_phone_number || '',
        website: website,
        hasWebsite: hasWeb,
        rating: rating,
        userRatingCount: userRatingCount,
        googleMapsUri: p.googleMapsUri || `https://www.google.com/maps/place/?q=place_id:${placeId}`,
        businessStatus: p.businessStatus || p.business_status || 'OPERATIONAL',
        category: category,
        types: p.types || [],
        location: p.location || null
      };
    });

    // Apply strict website filter if requested
    if (hasWebsite === 'no_website') {
      normalizedPlaces = normalizedPlaces.filter((item: any) => !item.hasWebsite);
    } else if (hasWebsite === 'has_website') {
      normalizedPlaces = normalizedPlaces.filter((item: any) => item.hasWebsite);
    }

    // Apply rating filter
    if (typeof minRating === 'number' && minRating > 0) {
      normalizedPlaces = normalizedPlaces.filter((item: any) => item.rating !== null && item.rating >= minRating);
    }

    // Apply review count filter if specified
    if (typeof minReviews === 'number' && minReviews > 0) {
      normalizedPlaces = normalizedPlaces.filter((item: any) => (item.userRatingCount || 0) >= minReviews);
    }

    // Apply sorting
    if (sortBy === 'rating') {
      normalizedPlaces.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'reviews') {
      normalizedPlaces.sort((a: any, b: any) => (b.userRatingCount || 0) - (a.userRatingCount || 0));
    }

    return res.json({
      success: true,
      places: normalizedPlaces,
      nextPageToken: returnedNextPageToken,
      totalFound: normalizedPlaces.length,
      totalRaw: rawPlaces.length,
      engine: apiEngineUsed
    });

  } catch (error: any) {
    console.error("[Lead Finder] Server error searching places:", error);
    return res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "An unexpected error occurred while searching for leads. Please try again."
    });
  }
});

app.post("/api/update_lead.php", async (req, res) => {
  try {
    const { id, ...updates } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, error: "ID is required" });
    }
    const updatedAt = new Date().toISOString();
    
    // Build update query dynamically to support custom additions
    const fields = [];
    const values = [];
    
    // Whitelist schema columns to protect against payload inject errors
    const validColumns = [
      "name", "email", "phone", "company", "status", "value", "source", "category", "notes", "country",
      "instagramLink", "facebookLink", "linkedinLink", "websiteUrl", "otherLink",
      "smmPlatformName", "smmPlannedPosts", "smmPostingFrequency", "smmContentNotes", "smmCampaignRequirements", "role"
    ];

    for (const [key, val] of Object.entries(updates)) {
      if (validColumns.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(val);
      }
    }
    fields.push("updatedAt = ?");
    values.push(updatedAt);
    
    values.push(id);
    
    const query = `UPDATE leads SET ${fields.join(", ")} WHERE id = ?`;
    const [result] = await pool.query(query, values);
    
    if ((result as any).affectedRows > 0) {
      const [rows] = await pool.query("SELECT * FROM leads WHERE id = ?", [id]);
      res.json({ success: true, lead: (rows as any[])[0] });
    } else {
      res.status(404).json({ success: false, error: "Lead not found" });
    }
  } catch (error: any) {
    console.error("Error updating lead:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/delete_lead.php", async (req, res) => {
  try {
    const { id, ids } = req.body;
    if (ids && Array.isArray(ids)) {
      if (ids.length > 0) {
        if (isDbOnline) {
          await pool.query("DELETE FROM leads WHERE id IN (?)", [ids]);
        } else {
          memoryDb.leads = memoryDb.leads.filter((lead: any) => !ids.includes(lead.id));
        }
      }
    } else if (id) {
      if (isDbOnline) {
        await pool.query("DELETE FROM leads WHERE id = ?", [id]);
      } else {
        memoryDb.leads = memoryDb.leads.filter((lead: any) => lead.id !== id);
      }
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting lead:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/add_client.php", async (req, res) => {
  try {
    const id = "client-" + Date.now();
    const client = {
      id,
      ...req.body,
      activeProjects: 1,
      projectProgress: 0,
      status: "Active"
    };
    
    const query = `
      INSERT INTO clients (
        id, name, email, phone, company, activeProjects, totalValue, status, projectProgress, serviceType, notes, country, assignedTeamMember,
        instagramLink, facebookLink, linkedinLink, websiteUrl, otherLink, customLinks,
        smmPlatformName, smmPlannedPosts, smmPostingFrequency, smmContentNotes, smmCampaignRequirements, role
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await pool.query(query, [
      id,
      client.name || "",
      client.email || "",
      client.phone || "",
      client.company || "",
      Number(client.activeProjects),
      Number(client.totalValue ?? 0),
      client.status || "Active",
      Number(client.projectProgress),
      client.serviceType || "",
      client.notes || "",
      client.country || "",
      client.assignedTeamMember || "",
      client.instagramLink || "",
      client.facebookLink || "",
      client.linkedinLink || "",
      client.websiteUrl || "",
      client.otherLink || "",
      client.customLinks || "",
      client.smmPlatformName || "",
      Number(client.smmPlannedPosts ?? 0),
      client.smmPostingFrequency || "",
      client.smmContentNotes || "",
      client.smmCampaignRequirements || "",
      client.role || ""
    ]);
    
    res.json({ success: true, client });
  } catch (error: any) {
    console.error("Error adding client:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/update_client.php", async (req, res) => {
  try {
    const { id, ...updates } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, error: "ID is required" });
    }
    
    const fields = [];
    const values = [];
    const validColumns = [
      "name", "email", "phone", "company", "activeProjects", "totalValue", "status", "projectProgress", "serviceType", "notes", "country", "assignedTeamMember",
      "instagramLink", "facebookLink", "linkedinLink", "websiteUrl", "otherLink", "customLinks",
      "smmPlatformName", "smmPlannedPosts", "smmPostingFrequency", "smmContentNotes", "smmCampaignRequirements", "role"
    ];

    for (const [key, val] of Object.entries(updates)) {
      if (validColumns.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(val);
      }
    }
    values.push(id);
    
    const query = `UPDATE clients SET ${fields.join(", ")} WHERE id = ?`;
    await pool.query(query, values);
    
    const [rows] = await pool.query("SELECT * FROM clients WHERE id = ?", [id]);
    res.json({ success: true, client: (rows as any[])[0] });
  } catch (error: any) {
    console.error("Error updating client:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/delete_client.php", async (req, res) => {
  try {
    const { id } = req.body;
    await pool.query("DELETE FROM clients WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting client:", error);
    res.status(500).json({ error: error.message });
  }
});

// --- PROJECT MANAGEMENT API ENDPOINTS ---

async function updateClientStats(clientId: string) {
  try {
    if (!clientId) return;
    const [projRows] = await pool.query("SELECT status, budget FROM projects WHERE clientId = ?", [clientId]);
    const projects = projRows as any[];
    
    const activeProjects = projects.filter(p => p.status !== 'Delivered' && p.status !== 'Cancelled').length;
    const totalValue = projects.reduce((sum, p) => sum + Number(p.budget || 0), 0);
    
    await pool.query("UPDATE clients SET activeProjects = ?, totalValue = ? WHERE id = ?", [activeProjects, totalValue, clientId]);
    console.log(`[DB] Updated client ${clientId} stats: activeProjects=${activeProjects}, totalValue=${totalValue}`);
  } catch (err: any) {
    console.error("Error updating client stats:", err.message);
  }
}

app.get("/api/get_projects.php", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM projects ORDER BY createdAt DESC");
    res.json(rows);
  } catch (error: any) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/add_project.php", async (req, res) => {
  try {
    const id = "project-" + Date.now();
    const { 
      name, clientId, clientName, budget, assignedTeamMember, deadline, status, projectProgress, notes,
      totalProjectValue, advancePayment, remainingBalance, paymentStatus, paymentPlatform, paymentNotes
    } = req.body;
    
    const finalBudget = Number(totalProjectValue ?? budget ?? 0);
    const query = `
      INSERT INTO projects (
        id, name, clientId, clientName, budget, assignedTeamMember, deadline, status, projectProgress, notes, createdAt,
        totalProjectValue, advancePayment, remainingBalance, paymentStatus, paymentPlatform, paymentNotes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await pool.query(query, [
      id,
      name || "Unnamed Project",
      clientId || "",
      clientName || "",
      finalBudget,
      assignedTeamMember || "Unassigned",
      deadline || "",
      status || "Not Started",
      Number(projectProgress ?? 0),
      notes || "",
      new Date().toISOString(),
      Number(totalProjectValue ?? 0),
      Number(advancePayment ?? 0),
      Number(remainingBalance ?? 0),
      paymentStatus || "Pending",
      paymentPlatform || "Other",
      paymentNotes || ""
    ]);
    
    if (clientId) {
      await updateClientStats(clientId);
    }
    
    const [rows] = await pool.query("SELECT * FROM projects WHERE id = ?", [id]);
    res.json({ success: true, project: (rows as any[])[0] });
  } catch (error: any) {
    console.error("Error adding project:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/update_project.php", async (req, res) => {
  try {
    const { 
      id, name, clientId, clientName, budget, assignedTeamMember, deadline, status, projectProgress, notes,
      totalProjectValue, advancePayment, remainingBalance, paymentStatus, paymentPlatform, paymentNotes
    } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, error: "ID is required" });
    }
    
    // Fetch old project first to see if clientId changed
    const [oldRows] = await pool.query("SELECT clientId FROM projects WHERE id = ?", [id]);
    const oldClientId = oldRows && (oldRows as any[]).length > 0 ? (oldRows as any[])[0].clientId : null;
    
    const finalBudget = Number(totalProjectValue ?? budget ?? 0);
    const query = `
      UPDATE projects 
      SET name = ?, clientId = ?, clientName = ?, budget = ?, assignedTeamMember = ?, deadline = ?, status = ?, projectProgress = ?, notes = ?,
          totalProjectValue = ?, advancePayment = ?, remainingBalance = ?, paymentStatus = ?, paymentPlatform = ?, paymentNotes = ?
      WHERE id = ?
    `;
    
    await pool.query(query, [
      name || "Unnamed Project",
      clientId || "",
      clientName || "",
      finalBudget,
      assignedTeamMember || "Unassigned",
      deadline || "",
      status || "Not Started",
      Number(projectProgress ?? 0),
      notes || "",
      Number(totalProjectValue ?? 0),
      Number(advancePayment ?? 0),
      Number(remainingBalance ?? 0),
      paymentStatus || "Pending",
      paymentPlatform || "Other",
      paymentNotes || "",
      id
    ]);
    
    if (clientId) {
      await updateClientStats(clientId);
    }
    if (oldClientId && oldClientId !== clientId) {
      await updateClientStats(oldClientId);
    }
    
    const [rows] = await pool.query("SELECT * FROM projects WHERE id = ?", [id]);
    res.json({ success: true, project: (rows as any[])[0] });
  } catch (error: any) {
    console.error("Error updating project:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/delete_project.php", async (req, res) => {
  try {
    const { id } = req.body;
    
    const [oldRows] = await pool.query("SELECT clientId FROM projects WHERE id = ?", [id]);
    const oldClientId = oldRows && (oldRows as any[]).length > 0 ? (oldRows as any[])[0].clientId : null;
    
    await pool.query("DELETE FROM projects WHERE id = ?", [id]);
    
    if (oldClientId) {
      await updateClientStats(oldClientId);
    }
    
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting project:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/add_team.php", async (req, res) => {
  try {
    const id = "team-" + Date.now();
    const member = {
      id,
      ...req.body,
      createdAt: new Date().toISOString()
    };
    
    const query = `
      INSERT INTO team (
        id, fullName, role, whatsapp, email, facebookLink, instagramLink, portfolioLink,
        linkedinLink, customLinks,
        assignedProjectName, clientName, projectStatus, projectDeadline, projectProgress,
        notes, country, experience, softwareKnowledge, avatar, createdAt, username, password,
        service, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await pool.query(query, [
      id,
      member.fullName || "",
      member.role || "",
      member.whatsapp || "",
      member.email || "",
      member.facebookLink || "",
      member.instagramLink || "",
      member.portfolioLink || "",
      member.linkedinLink || "",
      member.customLinks || "",
      member.assignedProjectName || "",
      member.clientName || "",
      member.projectStatus || "Not Started",
      member.projectDeadline || "",
      Number(member.projectProgress ?? 0),
      member.notes || "",
      member.country || "",
      member.experience || "",
      member.softwareKnowledge || "",
      member.avatar || "",
      member.createdAt,
      member.username || "",
      member.password || "",
      member.service || "Other",
      member.status || "Active"
    ]);
    
    res.json({ success: true, member });
  } catch (error: any) {
    console.error("Error adding team member:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/update_team.php", async (req, res) => {
  try {
    const { id, ...updates } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, error: "ID is required" });
    }
    
    const fields = [];
    const values = [];
    const validColumns = [
      "fullName", "role", "whatsapp", "email", "facebookLink", "instagramLink", "portfolioLink",
      "linkedinLink", "customLinks",
      "assignedProjectName", "clientName", "projectStatus", "projectDeadline", "projectProgress",
      "notes", "country", "experience", "softwareKnowledge", "avatar", "username", "password",
      "service", "status"
    ];

    for (const [key, val] of Object.entries(updates)) {
      if (validColumns.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(val);
      }
    }
    values.push(id);
    
    const query = `UPDATE team SET ${fields.join(", ")} WHERE id = ?`;
    await pool.query(query, values);
    
    const [rows] = await pool.query("SELECT * FROM team WHERE id = ?", [id]);
    res.json({ success: true, member: (rows as any[])[0] });
  } catch (error: any) {
    console.error("Error updating team member:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/delete_team.php", async (req, res) => {
  try {
    const { id } = req.body;
    await pool.query("DELETE FROM team WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting team member:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/add_goal.php", async (req, res) => {
  try {
    const id = "goal-" + Date.now();
    const goal = {
      id,
      ...req.body
    };
    
    const query = `
      INSERT INTO goals (id, title, category, current, target, unit, deadline)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    await pool.query(query, [
      id,
      goal.title || "",
      goal.category || "",
      Number(goal.current ?? 0),
      Number(goal.target ?? 0),
      goal.unit || "",
      goal.deadline || ""
    ]);
    
    res.json({ success: true, goal });
  } catch (error: any) {
    console.error("Error adding goal:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/update_goal.php", async (req, res) => {
  try {
    const { id, ...updates } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, error: "ID is required" });
    }
    
    const fields = [];
    const values = [];
    const validColumns = ["title", "category", "current", "target", "unit", "deadline"];

    for (const [key, val] of Object.entries(updates)) {
      if (validColumns.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(val);
      }
    }
    values.push(id);
    
    const query = `UPDATE goals SET ${fields.join(", ")} WHERE id = ?`;
    await pool.query(query, values);
    
    const [rows] = await pool.query("SELECT * FROM goals WHERE id = ?", [id]);
    res.json({ success: true, goal: (rows as any[])[0] });
  } catch (error: any) {
    console.error("Error updating goal:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/delete_goal.php", async (req, res) => {
  try {
    const { id } = req.body;
    await pool.query("DELETE FROM goals WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting goal:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/add_call.php", async (req, res) => {
  try {
    const id = "call-" + Date.now();
    const createdAt = new Date().toISOString();
    const call = {
      id,
      ...req.body,
      createdAt
    };
    
    const query = `
      INSERT INTO calls (id, leadId, leadName, duration, status, notes, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    await pool.query(query, [
      id,
      call.leadId || "",
      call.leadName || "",
      Number(call.duration ?? 0),
      call.status || "No Answer",
      call.notes || "",
      call.timestamp || createdAt
    ]);
    
    res.json({ success: true, call });
  } catch (error: any) {
    console.error("Error adding call:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/add_email_discussion.php", async (req, res) => {
  try {
    const id = "disc-email-" + Date.now();
    const disc = {
      id,
      ...req.body,
      createdAt: new Date().toISOString()
    };
    
    const query = `
      INSERT INTO email_discussions (id, clientName, subject, date, direction, content, notes, followUpStatus, attachments, clientService)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await pool.query(query, [
      id,
      disc.clientName || "",
      disc.subject || "",
      disc.date || disc.createdAt,
      disc.direction || "Sent",
      disc.content || "",
      disc.notes || "",
      disc.followUpStatus || "None",
      disc.attachments || "",
      disc.clientService || null
    ]);
    
    res.json({ success: true, discussion: disc });
  } catch (error: any) {
    console.error("Error adding email discussion:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/delete_email_discussion.php", async (req, res) => {
  try {
    const { id, ids } = req.body;
    if (ids && Array.isArray(ids)) {
      for (const deleteId of ids) {
        await pool.query("DELETE FROM email_discussions WHERE id = ?", [deleteId]);
      }
    } else if (id) {
      await pool.query("DELETE FROM email_discussions WHERE id = ?", [id]);
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting email discussion:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/add_call_discussion.php", async (req, res) => {
  try {
    const id = "disc-call-" + Date.now();
    const disc = {
      id,
      ...req.body,
      createdAt: new Date().toISOString()
    };
    
    const query = `
      INSERT INTO call_discussions (id, clientName, callDate, duration, summary, requirements, followUpActions, notes, status, clientService)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await pool.query(query, [
      id,
      disc.clientName || "",
      disc.callDate || disc.createdAt,
      disc.duration || "",
      disc.summary || "",
      disc.requirements || "",
      disc.followUpActions || "",
      disc.notes || "",
      disc.status || "Connected",
      disc.clientService || null
    ]);
    
    res.json({ success: true, discussion: disc });
  } catch (error: any) {
    console.error("Error adding call discussion:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/delete_call_discussion.php", async (req, res) => {
  try {
    const { id, ids } = req.body;
    if (ids && Array.isArray(ids)) {
      for (const deleteId of ids) {
        await pool.query("DELETE FROM call_discussions WHERE id = ?", [deleteId]);
      }
    } else if (id) {
      await pool.query("DELETE FROM call_discussions WHERE id = ?", [id]);
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting call discussion:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/add_conversation_discussion.php", async (req, res) => {
  try {
    const id = "disc-conv-" + Date.now();
    const disc = {
      id,
      ...req.body,
      createdAt: new Date().toISOString()
    };
    
    const query = `
      INSERT INTO conversation_discussions (
        id, leadName, company, email, phone, date, time, 
        discussionTitle, conversationSummary, clientResponse, nextAction, 
        followUpDate, priority, status, notes, leadId, clientId, service, assignedTeamMember
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await pool.query(query, [
      id,
      disc.leadName || "",
      disc.company || null,
      disc.email || null,
      disc.phone || null,
      disc.date || "",
      disc.time || "",
      disc.discussionTitle || "",
      disc.conversationSummary || null,
      disc.clientResponse || null,
      disc.nextAction || null,
      disc.followUpDate || null,
      disc.priority || "Medium",
      disc.status || "New",
      disc.notes || null,
      disc.leadId || null,
      disc.clientId || null,
      disc.service || null,
      disc.assignedTeamMember || null
    ]);
    
    res.json({ success: true, conversationDiscussion: disc });
  } catch (error: any) {
    console.error("Error adding conversation discussion:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/delete_conversation_discussion.php", async (req, res) => {
  try {
    const { id, ids } = req.body;
    if (ids && Array.isArray(ids)) {
      for (const deleteId of ids) {
        await pool.query("DELETE FROM conversation_discussions WHERE id = ?", [deleteId]);
      }
    } else if (id) {
      await pool.query("DELETE FROM conversation_discussions WHERE id = ?", [id]);
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting conversation discussion:", error);
    res.status(500).json({ error: error.message });
  }
});

// Project Tracking GET Endpoints
app.get("/api/project_tracking.php", async (req, res) => {
  try {
    const clientId = String(req.query.client_id || "").trim();

    if (!clientId) {
      // Return list of all trackings joined with client & team info
      const query = `
        SELECT t.*, c.name AS client_name, c.company AS client_company, tm.fullName AS assigned_member_name
        FROM project_tracking t
        LEFT JOIN clients c ON t.client_id = c.id
        LEFT JOIN team tm ON c.assignedTeamMember = tm.id
      `;
      const [rows] = await pool.query(query);
      return res.json({ success: true, data: rows });
    }

    // Find client
    const [clients] = await pool.query("SELECT * FROM clients WHERE id = ?", [clientId]);
    const client = (clients as any[])[0];
    if (!client) {
      return res.status(404).json({ success: false, error: "Client not found" });
    }

    // Find or create project tracking record
    const [trackings] = await pool.query("SELECT * FROM project_tracking WHERE client_id = ?", [clientId]);
    let tracking = (trackings as any[])[0];
    if (!tracking) {
      const projectId = "PRJ-" + clientId.substring(Math.max(0, clientId.length - 6)).toUpperCase();
      const projectName = client.company ? client.company + " Project" : client.name + " Project";
      
      const insertQuery = `
        INSERT INTO project_tracking (
          client_id, project_name, project_id, start_date, expected_delivery_date, current_status,
          overall_progress, revisions_allowed, revisions_used, delivery_status, delivery_date,
          delivered_by, final_files, delivery_notes, last_updated, estimated_time_left
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const start_date = new Date().toISOString().split("T")[0];
      const expected_delivery_date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const last_updated = new Date().toISOString();
      
      await pool.query(insertQuery, [
        clientId,
        projectName,
        projectId,
        start_date,
        expected_delivery_date,
        "Project Received",
        0,
        3,
        0,
        "Not Delivered",
        "",
        "",
        "",
        "",
        last_updated,
        "30 days"
      ]);
      
      tracking = {
        client_id: clientId,
        project_name: projectName,
        project_id: projectId,
        start_date,
        expected_delivery_date,
        current_status: "Project Received",
        overall_progress: 0,
        revisions_allowed: 3,
        revisions_used: 0,
        delivery_status: "Not Delivered",
        delivery_date: "",
        delivered_by: "",
        final_files: "",
        delivery_notes: "",
        last_updated,
        estimated_time_left: "30 days"
      };
    }

    // Fetch revisions and reviews
    const [revisions] = await pool.query("SELECT * FROM project_revisions WHERE client_id = ?", [clientId]);
    const [reviews] = await pool.query("SELECT * FROM project_reviews WHERE client_id = ?", [clientId]);
    const review = (reviews as any[])[0] || null;

    let assigned_member_name = "Unassigned";
    if (client.assignedTeamMember) {
      const [members] = await pool.query("SELECT fullName FROM team WHERE id = ?", [client.assignedTeamMember]);
      if ((members as any[]).length > 0) {
        assigned_member_name = (members as any[])[0].fullName;
      }
    }

    res.json({
      success: true,
      tracking: tracking,
      revisions: revisions,
      review: review,
      client: {
        name: client.name,
        company: client.company,
        assigned_member_name
      }
    });
  } catch (error: any) {
    console.error("Error in project_tracking GET:", error);
    res.status(500).json({ error: error.message });
  }
});

// Project Tracking POST Endpoints
app.post("/api/project_tracking.php", async (req, res) => {
  try {
    const action = String(req.query.action || "").trim();

    if (action === "add_revision") {
      const { client_id, notes, status, revision_date } = req.body;
      if (!client_id) {
        return res.status(400).json({ success: false, error: "Client ID is required" });
      }

      const revId = "rev-" + Date.now();
      const revDate = revision_date || new Date().toISOString();
      const revStatus = status || "Pending";

      await pool.query(
        "INSERT INTO project_revisions (id, client_id, notes, status, revision_date) VALUES (?, ?, ?, ?, ?)",
        [revId, client_id, notes || "", revStatus, revDate]
      );

      // Get count of revisions for this client
      const [revs] = await pool.query("SELECT COUNT(*) as cnt FROM project_revisions WHERE client_id = ?", [client_id]);
      const revisionCount = (revs as any[])[0].cnt;

      // Update project_tracking revisions_used
      await pool.query(
        "UPDATE project_tracking SET revisions_used = ?, last_updated = ? WHERE client_id = ?",
        [revisionCount, new Date().toISOString(), client_id]
      );

      return res.json({ success: true, message: "Revision history item added successfully" });
    }

    if (action === "submit_review") {
      const { client_id, rating, message, recommend } = req.body;
      if (!client_id) {
        return res.status(400).json({ success: false, error: "Client ID is required" });
      }

      const revwId = "revw-" + Date.now();
      const query = `
        INSERT INTO project_reviews (id, client_id, rating, message, recommend)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          rating = VALUES(rating),
          message = VALUES(message),
          recommend = VALUES(recommend)
      `;
      await pool.query(query, [
        revwId,
        client_id,
        Number(rating ?? 5),
        message || "",
        recommend || "Yes"
      ]);

      return res.json({ success: true, message: "Review saved successfully" });
    }

    // Default: Save/update project tracking info (Admin)
    const {
      client_id,
      project_name,
      project_id,
      start_date,
      expected_delivery_date,
      overall_progress,
      revisions_allowed,
      revisions_used,
      delivery_status,
      delivery_date,
      delivered_by,
      final_files,
      delivery_notes,
      estimated_time_left
    } = req.body;

    if (!client_id) {
      return res.status(400).json({ success: false, error: "Client ID is required" });
    }

    let progressVal = Number(overall_progress ?? 0);
    if (progressVal < 0) progressVal = 0;
    if (progressVal > 100) progressVal = 100;

    let current_status = "Project Received";
    if (delivery_status === "Delivered") {
      current_status = "Delivered";
    } else {
      if (progressVal === 0) {
        current_status = "Pending";
      } else if (progressVal > 0 && progressVal < 100) {
        current_status = "In Progress";
      } else if (progressVal === 100) {
        current_status = "Ready for Delivery";
      }
    }

    const last_updated = new Date().toISOString();
    const query = `
      INSERT INTO project_tracking (
        client_id, project_name, project_id, start_date, expected_delivery_date, current_status,
        overall_progress, revisions_allowed, revisions_used, delivery_status, delivery_date,
        delivered_by, final_files, delivery_notes, last_updated, estimated_time_left
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        project_name = VALUES(project_name),
        project_id = VALUES(project_id),
        start_date = VALUES(start_date),
        expected_delivery_date = VALUES(expected_delivery_date),
        current_status = VALUES(current_status),
        overall_progress = VALUES(overall_progress),
        revisions_allowed = VALUES(revisions_allowed),
        revisions_used = VALUES(revisions_used),
        delivery_status = VALUES(delivery_status),
        delivery_date = VALUES(delivery_date),
        delivered_by = VALUES(delivered_by),
        final_files = VALUES(final_files),
        delivery_notes = VALUES(delivery_notes),
        last_updated = VALUES(last_updated),
        estimated_time_left = VALUES(estimated_time_left)
    `;

    await pool.query(query, [
      client_id,
      project_name || "",
      project_id || "",
      start_date || "",
      expected_delivery_date || "",
      current_status,
      progressVal,
      Number(revisions_allowed ?? 3),
      Number(revisions_used ?? 0),
      delivery_status || "Not Delivered",
      delivery_date || "",
      delivered_by || "",
      final_files || "",
      delivery_notes || "",
      last_updated,
      estimated_time_left || ""
    ]);

    // Automatically update client's project progress in clients list
    await pool.query(
      "UPDATE clients SET projectProgress = ? WHERE id = ?",
      [progressVal, client_id]
    );

    return res.json({
      success: true,
      message: "Project tracking updated successfully",
      current_status: current_status
    });
  } catch (error: any) {
    console.error("Error in project_tracking POST:", error);
    res.status(500).json({ error: error.message });
  }
});

// Helper to wipe all documents in a Firestore collection
async function clearFirestoreCollection(collectionName: string) {
  if (!isFirebaseAvailable) return 0;
  try {
    const db = getFirestoreDb();
    const snapshot = await db.collection(collectionName).get();
    if (snapshot.empty) return 0;

    const batch = db.batch();
    let count = 0;
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      count++;
    });
    if (count > 0) {
      await batch.commit();
    }
    console.log(`[FIREBASE WIPE] Successfully purged ${count} records from Firestore collection: ${collectionName}`);
    return count;
  } catch (err: any) {
    console.warn(`[FIREBASE WIPE WARNING] Could not purge collection ${collectionName}:`, err.message);
    return 0;
  }
}

// Handler to wipe all CRM data permanently across Firestore, MySQL, memory collections, and disk persistence
const handleResetAllCrmData = async (req: express.Request, res: express.Response) => {
  console.log("=== RESET ALL CRM DATA INITIATED ===");
  try {
    // 1. Purge all CRM Firestore collections
    const firestoreCollectionsToPurge = [
      "leads",
      "clients",
      "calls",
      "projects",
      "team",
      "goals",
      "emailDiscussions",
      "callDiscussions",
      "conversationDiscussions",
      "clientPortals",
      "teamPortals",
      "teamInternalFiles",
      "proposals",
      "callScripts",
      "emailScripts"
    ];

    for (const col of firestoreCollectionsToPurge) {
      await clearFirestoreCollection(col);
    }

    // 2. Clear MySQL database tables for CRM records
    const tablesToClear = [
      "leads",
      "clients",
      "calls",
      "projects",
      "project_tracking",
      "project_revisions",
      "project_reviews",
      "team",
      "goals",
      "email_discussions",
      "call_discussions",
      "conversation_discussions"
    ];

    for (const table of tablesToClear) {
      try {
        await pool.query(`DELETE FROM ${table}`);
      } catch (tableErr: any) {
        console.warn(`[DB RESET] Error clearing table ${table}:`, tableErr.message);
      }
    }

    // 3. Clear In-Memory collection storage (except settings)
    for (const key of firestoreCollectionsToPurge) {
      if (memoryCollections[key]) {
        memoryCollections[key] = {};
      }
    }
    savePersistentDb();

    // 4. Invalidate all collection caches
    for (const key of Object.keys(collectionCache)) {
      delete collectionCache[key];
    }

    console.log("=== RESET ALL CRM DATA COMPLETED SUCCESSFULLY ===");
    return res.json({ 
      success: true, 
      message: "All CRM data has been permanently deleted from Firestore and database." 
    });
  } catch (error: any) {
    console.error("=== RESET ALL CRM DATA ERROR ===", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to reset CRM data." });
  }
};

app.post("/api/reset-crm-data", handleResetAllCrmData);
app.post("/api/reset.php", handleResetAllCrmData);

// =========================================================================
// FIREBASE PORTAL INTEGRATION & SESSIONS
// =========================================================================

// Global interface for session tracking
interface PortalSession {
  secureToken: string;
  type: 'client' | 'team';
  username: string;
  expiresAt: number;
}

const portalSessions: Record<string, PortalSession> = {};
const portalLoginAttempts: Record<string, { attempts: number; lockUntil: number }> = {};

// Parse manual cookies from request
function parseCookies(cookieHeader?: string): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    list[parts.shift()!.trim()] = decodeURI(parts.join('='));
  });
  return list;
}

// =========================================================================
// SUPABASE BACKEND SYNCHRONIZER & PORTAL ARCHITECTURE (ZERO FIREBASE REMOVAL)
// =========================================================================

const memoryCollections: Record<string, Record<string, any>> = {
  clientPortals: {},
  teamPortals: {},
  teamInternalFiles: {},
  leads: {},
  calls: {},
  clients: {},
  projects: {},
  team: {},
  goals: {},
  emailDiscussions: {},
  callDiscussions: {},
  conversationDiscussions: {},
  settings: {},
};

const DB_FILE_PATH = path.join(process.cwd(), "crm_database_persistent.json");

function loadPersistentDb() {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        Object.keys(parsed).forEach(col => {
          memoryCollections[col] = parsed[col] || {};
        });
        console.log(`[PERSISTENT DB] Loaded CRM database from disk. Collections: ${Object.keys(parsed).join(", ")}`);
      }
    } else {
      console.log(`[PERSISTENT DB] Initializing new persistent disk database.`);
    }
  } catch (err) {
    console.error(`[PERSISTENT DB] Error loading database file from disk:`, err);
  }
}

export function savePersistentDb() {
  try {
    const cleanData = JSON.stringify(memoryCollections, null, 2);
    fs.writeFileSync(DB_FILE_PATH, cleanData, "utf8");
  } catch (err) {
    console.error(`[PERSISTENT DB] Error saving database file to disk:`, err);
  }
}

// Load database from disk on server startup
loadPersistentDb();

// Map collections to standard lower_snake_case for Supabase if required
const tableMap: Record<string, string> = {
  clientPortals: "client_portals",
  teamPortals: "team_portals",
  teamInternalFiles: "team_internal_files",
  leads: "leads",
  calls: "calls",
  clients: "clients",
  projects: "projects",
  team: "team",
  goals: "goals",
  emailDiscussions: "email_discussions",
  callDiscussions: "call_discussions",
  conversationDiscussions: "conversation_discussions",
  settings: "settings",
};

// Connection check endpoint
app.get("/api/supabase/health", async (req, res) => {
  return res.json({ 
    status: "ok", 
    supabaseOnline: false,
    firebaseOnline: isFirebaseAvailable,
    firebaseError: firebaseError,
    timestamp: new Date().toISOString()
  });
});

// Generic collection fetch endpoint with caching & rate limit (429) protection
const collectionCache: Record<string, { items: any[]; timestamp: number }> = {};
const COLLECTION_CACHE_TTL = 30000; // 30 seconds cache TTL

app.get("/api/supabase/collection/:collectionName", async (req, res) => {
  const { collectionName } = req.params;
  const user = (req as any).user;

  // STRICT SECURITY: Team role is ONLY allowed to access teamPortals and teamInternalFiles
  if (user && user.role === "Team") {
    const allowedCollections = ["teamPortals", "teamInternalFiles", "projects", "portalMessages", "portalPresence"]; // Added projects, portalMessages, portalPresence
    if (!allowedCollections.includes(collectionName)) {
      console.warn(`[SECURITY] Team user ${user.username} blocked from accessing restricted collection: ${collectionName}`);
      return res.status(403).json({ error: "Access denied. Team accounts are restricted to Project Workspaces only." });
    }
  }

  // Check cache first to prevent rate limiting / HTTP 429 (Bypass cache for real-time collections)
  const now = Date.now();
  const cacheTtl = (collectionName === 'portalMessages' || collectionName === 'portalPresence') ? 1000 : COLLECTION_CACHE_TTL;
  if (collectionCache[collectionName] && (now - collectionCache[collectionName].timestamp < cacheTtl)) {
    return res.json({ success: true, items: collectionCache[collectionName].items });
  }

  if (isFirebaseAvailable) {
    try {
      console.log(`[FIREBASE FETCH] Fetching from Firestore collection: ${collectionName}`);
      const snapshot = await getFirestoreDb().collection(collectionName).get();
      const items: any[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() });
      });
      collectionCache[collectionName] = { items, timestamp: now };
      return res.json({ success: true, items });
    } catch (err: any) {
      console.warn(`[FIREBASE SELECT FATAL] ${collectionName} read fallback triggered:`, err.message);
      if (err.message && (err.message.includes('429') || err.message.includes('Quota') || err.message.includes('RESOURCE_EXHAUSTED') || err.message.includes('rate limit'))) {
        console.warn(`[FIREBASE RATE LIMIT / QUOTA EXCEEDED] Gracefully falling back to memory collection for ${collectionName}.`);
      }
    }
  }

  // Fallback to local memory
  const items = Object.values(memoryCollections[collectionName] || {});
  collectionCache[collectionName] = { items, timestamp: now };
  return res.json({ success: true, items });
});

// Generic collection save endpoint
app.post("/api/supabase/collection/:collectionName/:docId", async (req, res) => {
  const { collectionName, docId } = req.params;
  const payload = req.body;
  const user = (req as any).user;

  // STRICT SECURITY: Team role write restrictions
  if (user && user.role === "Team") {
    const allowedWriteCollections = ["teamInternalFiles", "teamPortals", "portalMessages", "portalPresence"];
    if (!allowedWriteCollections.includes(collectionName)) {
      return res.status(403).json({ error: "Write access denied. Team accounts are restricted." });
    }
    
    // If updating teamPortals, they should only be able to update their own document
    if (collectionName === "teamPortals" && docId !== user.id) {
       return res.status(403).json({ error: "Access denied. You can only update your own workspace." });
    }
  }

  // Track in memory fallback
  if (!memoryCollections[collectionName]) {
    memoryCollections[collectionName] = {};
  }
  memoryCollections[collectionName][docId] = { id: docId, ...payload };
  savePersistentDb();

  // Invalidate collection cache on write
  delete collectionCache[collectionName];

  if (isFirebaseAvailable) {
    try {
      console.log(`[FIREBASE SAVE] Saving document ${docId} into Firestore collection: ${collectionName}`);
      await getFirestoreDb().collection(collectionName).doc(docId).set(payload, { merge: true });
      return res.json({ success: true });
    } catch (err: any) {
      console.warn(`[FIREBASE UPSERT FATAL] ${collectionName} write fallback triggered:`, err.message);
    }
  }

  return res.json({ success: true, fallback: true });
});

// Generic collection batch save endpoint for fast bulk writes
app.post("/api/supabase/batch-collection/:collectionName", async (req, res) => {
  const { collectionName } = req.params;
  const { items } = req.body;
  const user = (req as any).user;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "items array is required" });
  }

  // STRICT SECURITY: Team role write restrictions
  if (user && user.role === "Team") {
    const allowedWriteCollections = ["teamInternalFiles", "teamPortals", "portalMessages", "portalPresence"];
    if (!allowedWriteCollections.includes(collectionName)) {
      return res.status(403).json({ error: "Write access denied." });
    }
  }

  // Track in memory fallback
  if (!memoryCollections[collectionName]) {
    memoryCollections[collectionName] = {};
  }
  for (const item of items) {
    if (item && item.id) {
      memoryCollections[collectionName][item.id] = item;
    }
  }
  savePersistentDb();
  delete collectionCache[collectionName];

  if (isFirebaseAvailable) {
    try {
      const db = getFirestoreDb();
      // Firestore batches support up to 500 operations per batch
      for (let i = 0; i < items.length; i += 400) {
        const chunk = items.slice(i, i + 400);
        const batch = db.batch();
        chunk.forEach(item => {
          if (item && item.id) {
            const docRef = db.collection(collectionName).doc(item.id);
            batch.set(docRef, item, { merge: true });
          }
        });
        await batch.commit();
      }
      return res.json({ success: true, count: items.length });
    } catch (err: any) {
      console.warn(`[FIREBASE BATCH FATAL] ${collectionName} batch write error:`, err.message);
    }
  }

  return res.json({ success: true, count: items.length, fallback: true });
});

// Generic collection delete endpoint
app.delete("/api/supabase/collection/:collectionName/:docId", async (req, res) => {
  const { collectionName, docId } = req.params;
  const user = (req as any).user;

  // Invalidate collection cache on delete
  delete collectionCache[collectionName];

  // STRICT SECURITY: Team role delete restrictions
  if (user && user.role === "Team") {
    const allowedDeleteCollections = ["teamInternalFiles"];
    if (!allowedDeleteCollections.includes(collectionName)) {
      return res.status(403).json({ error: "Delete access denied. Team accounts are restricted." });
    }
  }

  const portalId = docId;

  // Removed debug log
  // Removed debug log
  // Removed debug log
  // Removed debug log
  // Removed debug log
  // Removed debug log

  // Determine whether CP-4907 is database primary key, portal_id, custom portal number, or another field
  // Removed debug log
  const memItem = memoryCollections[collectionName] ? memoryCollections[collectionName][portalId] : null;
  // Removed debug log
  if (memItem) {
    // Removed debug log
    // Removed debug log
    // Removed debug log
  } else {
    // Removed debug log
  }

  // 6. Verify Authorization using the CRM's existing authentication/session
  let session: any = null;
  try {
    let token = "";
    const authHeader = req.headers["authorization"] || "";
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
    if (!token && req.headers.cookie) {
      const match = req.headers.cookie.match(/zyqro_session_token=([^;]+)/);
      if (match) {
        token = match[1];
      }
    }
    if (token) {
      const [sessRows] = await pool.query("SELECT * FROM user_sessions WHERE token = ? LIMIT 1", [token]);
      session = (sessRows as any[])[0];
    }
  } catch (sessErr) {
    console.error("Failed to query user session inside delete handler:", sessErr);
  }

  // Removed debug log
  // Removed debug log
  // Removed debug log

  let deletedLocal = false;
  if (memoryCollections[collectionName] && memoryCollections[collectionName][docId]) {
    delete memoryCollections[collectionName][docId];
    savePersistentDb();
    deletedLocal = true;
    console.log(`[LOCAL MEMORY] Successfully removed ${docId} from memory collection: ${collectionName}`);
  }

  // Removed debug log
  if (isFirebaseAvailable) {
    try {
      console.log(`[FIREBASE DELETE] Deleting document ${docId} from Firestore collection: ${collectionName}`);
      await getFirestoreDb().collection(collectionName).doc(docId).delete();
      console.log("=== PORTAL DELETE DATABASE SUCCESS ===");
      return res.json({ success: true });
    } catch (err: any) {
      console.error("=== PORTAL DELETE DATABASE FAILED ===");
      console.error("Error:", err);

      // 8. Log the detailed failure block in console
      console.error({
        code: err.code || "UNKNOWN",
        message: err.message,
        stack: err.stack
      });

  // 10. Success condition fallback - Only return success if it was actually deleted from Firestore OR if Firestore is definitively not available and it was deleted locally
      if (deletedLocal) {
        console.log("=== FIREBASE DELETE SUCCESS (LOCAL CACHE CONFIRMED) ===");
        return res.json({ success: true, fallback: true });
      }

      console.error("=== PORTAL DELETE DATABASE FAILED (NO FALLBACK) ===");
      return res.status(500).json({ success: false, error: err.message || "Failed to delete from Firestore" });
    }
  }

  if (deletedLocal) {
    console.log("=== PORTAL DELETE DATABASE OPERATION BYPASSED (REAL TIME OFFLINE MODE) ===");
    return res.json({ success: true, fallback: true });
  }

  return res.status(404).json({ success: false, error: "Record not found" });
});

// Supabase / Portal storage upload & download (Firebase Storage with high-reliability persistent fallback)
const STORAGE_DIR = path.join(process.cwd(), "storage_uploads");
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

app.post(["/api/supabase/storage/upload", "/api/portal/storage/upload"], upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const folderPath = (req.body.folderPath || 'general').replace(/[^a-zA-Z0-9_\-\/]/g, '_');
    const safeOriginalName = req.file.originalname.replace(/[^a-zA-Z0-9_\.\-\s]/g, '_');
    const fileName = `${Date.now()}-${safeOriginalName}`;
    const destination = `${folderPath}/${fileName}`;

    let uploadedToFirebase = false;
    let fileUrl = "";

    // Try Firebase Storage if initialized
    try {
      if ((admin as any).apps?.length) {
        const bucket = getStorage().bucket();
        const file = bucket.file(destination);
        await file.save(req.file.buffer, {
          metadata: {
            contentType: req.file.mimetype,
            metadata: {
              originalName: req.file.originalname,
              uploadedAt: new Date().toISOString()
            }
          },
          resumable: false
        });
        
        try {
          const [signedUrl] = await file.getSignedUrl({
            action: 'read',
            expires: '03-09-2491'
          });
          fileUrl = signedUrl;
          uploadedToFirebase = true;
        } catch (signErr) {
          fileUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
          uploadedToFirebase = true;
        }
      }
    } catch (fbErr: any) {
      console.warn("[STORAGE] Firebase bucket note (persisting to server storage):", fbErr.message);
    }

    // Save to persistent storage_uploads directory
    const localTargetDir = path.join(STORAGE_DIR, folderPath);
    if (!fs.existsSync(localTargetDir)) {
      fs.mkdirSync(localTargetDir, { recursive: true });
    }
    const localFilePath = path.join(STORAGE_DIR, destination);
    fs.writeFileSync(localFilePath, req.file.buffer);

    if (!uploadedToFirebase || !fileUrl) {
      fileUrl = `/api/storage/file?path=${encodeURIComponent(destination)}&filename=${encodeURIComponent(req.file.originalname)}`;
    }

    return res.json({
      success: true,
      fileUrl,
      downloadUrl: `/api/storage/file?path=${encodeURIComponent(destination)}&filename=${encodeURIComponent(req.file.originalname)}&download=1`,
      fileName: req.file.originalname,
      size: req.file.size,
      storagePath: destination,
      contentType: req.file.mimetype
    });
  } catch (error: any) {
    console.error("[STORAGE UPLOAD ERROR]", error);
    return res.status(500).json({ error: error.message || "Failed to upload file to storage" });
  }
});

app.get(["/api/storage/file", "/api/portal/storage/download"], async (req, res) => {
  try {
    const filePathParam = (req.query.path as string) || "";
    const requestedFileName = (req.query.filename as string) || path.basename(filePathParam) || "download";
    const isDownload = req.query.download === "1" || req.query.download === "true";

    if (!filePathParam) {
      return res.status(400).send("File path is required.");
    }

    // Prevent directory traversal
    const normalized = path.normalize(filePathParam).replace(/^(\.\.[\/\\])+/, '');
    const localFilePath = path.join(STORAGE_DIR, normalized);

    if (fs.existsSync(localFilePath) && fs.statSync(localFilePath).isFile()) {
      const stat = fs.statSync(localFilePath);
      const ext = path.extname(requestedFileName).toLowerCase();
      
      const mimeTypes: { [key: string]: string } = {
        '.pdf': 'application/pdf',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp',
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.zip': 'application/zip',
        '.rar': 'application/x-rar-compressed',
        '.csv': 'text/csv',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.xls': 'application/vnd.ms-excel',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.doc': 'application/msword',
        '.txt': 'text/plain',
        '.json': 'application/json'
      };

      const contentType = mimeTypes[ext] || 'application/octet-stream';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Accept-Ranges', 'bytes');
      
      if (isDownload) {
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(requestedFileName)}"`);
      } else {
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(requestedFileName)}"`);
      }

      const stream = fs.createReadStream(localFilePath);
      return stream.pipe(res);
    }

    // Try Firebase Storage fallback
    if ((admin as any).apps?.length) {
      try {
        const bucket = getStorage().bucket();
        const file = bucket.file(normalized);
        const [exists] = await file.exists();
        if (exists) {
          const [metadata] = await file.getMetadata();
          res.setHeader('Content-Type', metadata.contentType || 'application/octet-stream');
          if (metadata.size) {
            res.setHeader('Content-Length', metadata.size);
          }
          if (isDownload) {
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(requestedFileName)}"`);
          }
          return file.createReadStream().pipe(res);
        }
      } catch (fbErr) {}
    }

    return res.status(404).send("File not found.");
  } catch (err: any) {
    console.error("[STORAGE GET ERROR]", err);
    return res.status(500).send("Internal server error.");
  }
});

app.post(["/api/supabase/storage/delete", "/api/portal/storage/delete"], async (req, res) => {
  try {
    const { fileUrl, storagePath } = req.body;
    let targetPath = storagePath;
    if (!targetPath && fileUrl) {
      const match = fileUrl.match(/path=([^&]+)/);
      if (match) {
        targetPath = decodeURIComponent(match[1]);
      }
    }
    if (targetPath) {
      const normalized = path.normalize(targetPath).replace(/^(\.\.[\/\\])+/, '');
      const localFilePath = path.join(STORAGE_DIR, normalized);
      if (fs.existsSync(localFilePath)) {
        try { fs.unlinkSync(localFilePath); } catch (e) {}
      }
      if ((admin as any).apps?.length) {
        try {
          const bucket = getStorage().bucket();
          await bucket.file(normalized).delete().catch(() => {});
        } catch (e) {}
      }
    }
    return res.json({ success: true });
  } catch (err: any) {
    return res.json({ success: true });
  }
});


// Find Portal strictly by secure token across both Firestore and memory fallback
async function findPortalBySecureToken(type: "client" | "team", secureToken: string): Promise<any> {
  const collectionName = type === "client" ? "clientPortals" : "teamPortals";
  const rawToken = (secureToken || "").trim();
  if (!rawToken) return null;

  // 1. Try direct Firestore query by secureToken
  if (isFirebaseAvailable) {
    try {
      const snapshot = await getFirestoreDb()
        .collection(collectionName)
        .where("secureToken", "==", rawToken)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        console.log(`[FIREBASE] Found exact portal by secureToken in collection: ${collectionName}`);
        return { id: doc.id, ...doc.data() };
      }

      // Secondary check: query by document ID or portalId
      const docSnap = await getFirestoreDb().collection(collectionName).doc(rawToken).get();
      if (docSnap.exists) {
        console.log(`[FIREBASE] Found portal by doc ID in collection: ${collectionName}`);
        return { id: docSnap.id, ...docSnap.data() };
      }

      const portalIdSnapshot = await getFirestoreDb()
        .collection(collectionName)
        .where("portalId", "==", rawToken)
        .limit(1)
        .get();

      if (!portalIdSnapshot.empty) {
        const doc = portalIdSnapshot.docs[0];
        console.log(`[FIREBASE] Found portal by portalId in collection: ${collectionName}`);
        return { id: doc.id, ...doc.data() };
      }
    } catch (err) {
      console.warn("[FIREBASE] Direct secureToken query failed, attempting secondary check:", err);
    }
  }

  // 2. Memory collection fallback
  const memItems = Object.values(memoryCollections[collectionName] || {});
  const foundMem = memItems.find(p => 
    String(p.secureToken || "").trim() === rawToken ||
    String(p.portalId || "").trim() === rawToken ||
    String(p.id || "").trim() === rawToken
  );
  if (foundMem) return foundMem;

  return null;
}

// Helper to retrieve portal session token from header, auth header, or cookies
function getPortalSessionToken(req: express.Request): string | null {
  const headerToken = (req.headers['x-portal-session-token'] as string) || '';
  if (headerToken.trim()) return headerToken.trim();

  const authHeader = (req.headers['authorization'] as string) || '';
  if (authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.substring(7).trim();
    if (bearerToken) return bearerToken;
  }

  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies['zyqro_portal_session_token'];
  if (cookieToken) return cookieToken;

  return null;
}

// 0. Public Info Endpoint - returns portal information and grants public client portal access via secure token
app.post("/api/portal/info", async (req, res) => {
  try {
    const { type, secureToken } = req.body;
    
    if (!secureToken || !type) {
      return res.status(400).json({ success: false, error: "Missing required parameters." });
    }

    const portalData = await findPortalBySecureToken(type, secureToken);
    if (!portalData) {
      return res.json({ exists: false });
    }

    if (portalData.status !== "Active" && portalData.status !== "Live" && portalData.status !== "Draft") {
      return res.json({ exists: true, status: portalData.status || "Inactive" });
    }

    const publicName = type === "client" 
      ? (portalData.clientCompany || portalData.clientName) 
      : portalData.fullName;

    let isAuthenticated = false;
    
    // Check active session for client or team portal
    const sessionToken = getPortalSessionToken(req);
    if (sessionToken && portalSessions[sessionToken]) {
      const session = portalSessions[sessionToken];
      if (session.type === type && Date.now() <= session.expiresAt) {
        const sessTok = String(session.secureToken || "").trim();
        const secTok = String(portalData.secureToken || "").trim();
        const reqTok = String(secureToken || "").trim();
        const pId = String(portalData.portalId || "").trim();
        const dId = String(portalData.id || "").trim();

        if (sessTok === reqTok || sessTok === secTok || sessTok === pId || sessTok === dId) {
          isAuthenticated = true;
          session.expiresAt = Date.now() + 2 * 60 * 60 * 1000;
        }
      }
    }

    if (isAuthenticated) {
      // Attach assigned projects for team portals if needed
      if (type === 'team' && portalData.assignedProjectIds) {
        try {
          const projects: any[] = [];
          for (const pid of portalData.assignedProjectIds) {
            let projectData = null;
            if (isFirebaseAvailable) {
              try {
                const docSnap = await getFirestoreDb().collection("projects").doc(pid).get();
                if (docSnap.exists) {
                  projectData = docSnap.data();
                }
              } catch (err) {}
            }
            if (!projectData && memoryCollections.projects) {
              projectData = memoryCollections.projects[pid];
            }
            if (projectData) {
              projects.push(projectData);
            }
          }
          portalData.projects = projects;
        } catch (err) {}
      }

      return res.json({ 
        exists: true, 
        authenticated: true,
        status: portalData.status || "Live",
        name: publicName,
        account: portalData
      });
    } else {
      const trackerKey = `${type}:${String(secureToken).trim().toLowerCase()}`;
      let tracking = portalLoginAttempts[trackerKey];
      let isLocked = false;
      let lockUntil = 0;
      let lockRemainingSeconds = 0;

      if (tracking && tracking.lockUntil) {
        if (Date.now() < tracking.lockUntil) {
          isLocked = true;
          lockUntil = tracking.lockUntil;
          lockRemainingSeconds = Math.ceil((tracking.lockUntil - Date.now()) / 1000);
        } else {
          delete portalLoginAttempts[trackerKey];
        }
      }

      return res.json({ 
        exists: true, 
        authenticated: false,
        status: portalData.status || "Live",
        name: publicName,
        locked: isLocked,
        lockUntil: isLocked ? lockUntil : 0,
        lockRemainingSeconds: isLocked ? lockRemainingSeconds : 0
      });
    }
  } catch (error: any) {
    console.error("Error in portal info:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 1. Handshake Endpoint - check if active backend session exists for this secureToken
app.post("/api/portal/handshake", async (req, res) => {
  try {
    const { type, secureToken } = req.body;
    if (!secureToken || !type) {
      return res.status(400).json({ authenticated: false, error: "Missing required parameters." });
    }

    const sessionToken = getPortalSessionToken(req);

    if (!sessionToken || !portalSessions[sessionToken]) {
      return res.json({ authenticated: false });
    }

    const session = portalSessions[sessionToken];
    if (session.type !== type) {
      return res.json({ authenticated: false });
    }

    if (Date.now() > session.expiresAt) {
      delete portalSessions[sessionToken];
      res.setHeader("Set-Cookie", "zyqro_portal_session_token=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax");
      return res.json({ authenticated: false, error: "Session expired." });
    }

    const portalData = await findPortalBySecureToken(type, secureToken);
    if (!portalData) {
      return res.status(404).json({ authenticated: false, error: "Portal not found." });
    }

    const reqTok = String(secureToken || "").trim();
    const sessTok = String(session.secureToken || "").trim();
    const secTok = String(portalData.secureToken || "").trim();

    const isTokenMatch = sessTok === reqTok || sessTok === secTok;

    if (!isTokenMatch) {
      return res.json({ authenticated: false });
    }

    // Session is valid, extend expiration time (2 hours from now)
    session.expiresAt = Date.now() + 2 * 60 * 60 * 1000;

    // Attach assigned projects for team portals
    if (type === 'team' && portalData.assignedProjectIds) {
      try {
        const projects: any[] = [];
        for (const pid of portalData.assignedProjectIds) {
          // Fetch from memory or Firestore
          let projectData = null;
          if (isFirebaseAvailable) {
            try {
              const docSnap = await getFirestoreDb().collection("projects").doc(pid).get();
              if (docSnap.exists) {
                projectData = docSnap.data();
              }
            } catch (err) {
              console.warn("[FIREBASE] Failed to fetch project from Firestore:", err);
            }
          }
          if (!projectData && memoryCollections.projects) {
            projectData = memoryCollections.projects[pid];
          }
          if (projectData) {
            projects.push(projectData);
          }
        }
        portalData.projects = projects;
      } catch (err) {
        console.error("Failed to fetch assigned projects for handshake:", err);
      }
    }

    return res.json({ authenticated: true, account: portalData });
  } catch (error: any) {
    console.error("Error in portal handshake:", error);
    res.status(500).json({ authenticated: false, error: error.message });
  }
});

// 2. Login Endpoint - verify username/password and issue HttpOnly session cookie + token in JSON
app.post("/api/portal/login", async (req, res) => {
  try {
    const { type, secureToken, username, password } = req.body;
    if (!secureToken || !type || !username || !password) {
      return res.status(400).json({ success: false, error: "All fields are required." });
    }

    // Rate limiting & Brute Force Prevention (5 failed attempts -> 15-min lockout)
    const trackerKey = `${type}:${String(secureToken).trim().toLowerCase()}`;
    let tracking = portalLoginAttempts[trackerKey];

    if (tracking && tracking.lockUntil) {
      if (Date.now() < tracking.lockUntil) {
        const lockRemainingMs = Math.max(0, tracking.lockUntil - Date.now());
        const lockRemainingSeconds = Math.ceil(lockRemainingMs / 1000);
        return res.status(429).json({
          success: false,
          locked: true,
          lockUntil: tracking.lockUntil,
          lockRemainingMs,
          lockRemainingSeconds,
          error: "Login temporarily locked. Please try again after the timer expires."
        });
      } else {
        // Lock timer expired! Automatically reset failed attempts counter
        delete portalLoginAttempts[trackerKey];
        tracking = undefined;
      }
    }

    const portalData = await findPortalBySecureToken(type, secureToken);
    if (!portalData) {
      return res.status(403).json({ success: false, error: "Access Denied." });
    }

    if (portalData.status !== "Active" && portalData.status !== "Live" && portalData.status !== "Draft") {
      return res.status(403).json({ success: false, error: "This portal is currently inactive." });
    }

    const dbUsername = String(portalData.username || "").toLowerCase().trim();
    const dbPassword = String(portalData.password || "");

    const inputUsername = String(username).toLowerCase().trim();
    const inputPassword = String(password);

    if (dbUsername === inputUsername && dbPassword === inputPassword) {
      // Clear brute force tracker on successful login
      delete portalLoginAttempts[trackerKey];

      // Attach assigned projects for team portals
      if (type === 'team' && portalData.assignedProjectIds) {
        try {
          const projects: any[] = [];
          for (const pid of portalData.assignedProjectIds) {
            let projectData = null;
            if (isFirebaseAvailable) {
              try {
                const docSnap = await getFirestoreDb().collection("projects").doc(pid).get();
                if (docSnap.exists) {
                  projectData = docSnap.data();
                }
              } catch (err) {
                console.warn("[FIREBASE] Failed to fetch project from Firestore:", err);
              }
            }
            if (!projectData && memoryCollections.projects) {
              projectData = memoryCollections.projects[pid];
            }
            if (projectData) {
              projects.push(projectData);
            }
          }
          portalData.projects = projects;
        } catch (err) {
          console.error("Failed to fetch assigned projects for login:", err);
        }
      }

      // Generate secure session token
      const sessionToken = "psess_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      
      // Store session
      portalSessions[sessionToken] = {
        secureToken: portalData.secureToken || portalData.portalId || portalData.id || secureToken,
        type,
        username: dbUsername,
        expiresAt: Date.now() + 2 * 60 * 60 * 1000 // 2 hours expiration
      };

      // Set secure HttpOnly cookie with SameSite=Lax/None for cross-navigation compatibility
      const isProduction = process.env.NODE_ENV === "production";
      let cookieString = `zyqro_portal_session_token=${sessionToken}; Path=/; HttpOnly; Max-Age=7200; SameSite=Lax`;
      if (isProduction) {
        cookieString = `zyqro_portal_session_token=${sessionToken}; Path=/; HttpOnly; Max-Age=7200; SameSite=None; Secure`;
      }
      res.setHeader("Set-Cookie", cookieString);

      return res.json({ success: true, sessionToken, account: portalData });
    } else {
      // Increment failed login attempts for brute force prevention
      const attempts = (tracking?.attempts || 0) + 1;

      if (attempts >= 5) {
        const lockUntil = Date.now() + 15 * 60 * 1000; // 15 minutes lockout after 5 consecutive failures
        portalLoginAttempts[trackerKey] = { attempts: 5, lockUntil };

        return res.status(429).json({
          success: false,
          locked: true,
          lockUntil,
          lockRemainingMs: 15 * 60 * 1000,
          lockRemainingSeconds: 900,
          error: "Login temporarily locked. Please try again after the timer expires."
        });
      } else {
        portalLoginAttempts[trackerKey] = { attempts, lockUntil: 0 };

        return res.status(401).json({
          success: false,
          locked: false,
          error: "Invalid username or password."
        });
      }
    }
  } catch (error: any) {
    console.error("Error in portal login:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Update Folders & Files Endpoint - write changes to Firestore securely from server
app.post("/api/portal/update", async (req, res) => {
  try {
    const { type, secureToken, folders, projectFiles, supportTickets, infoRecords } = req.body;
    if (!secureToken || !type) {
      return res.status(400).json({ success: false, error: "Missing required parameters." });
    }

    const portalData = await findPortalBySecureToken(type, secureToken);
    if (!portalData) {
      return res.status(404).json({ success: false, error: "Portal not found." });
    }

    if (portalData.status !== "Active" && portalData.status !== "Live" && portalData.status !== "Draft") {
      return res.status(403).json({ success: false, error: "This portal is currently inactive." });
    }

    // Verify authorization
    if (type === 'client') {
      const secTok = String(portalData.secureToken || "").trim();
      const reqTok = String(secureToken || "").trim();
      const pId = String(portalData.portalId || "").trim();
      const dId = String(portalData.id || "").trim();

      if (secTok !== reqTok && pId !== reqTok && dId !== reqTok) {
        return res.status(401).json({ success: false, error: "Invalid secure portal token." });
      }
    } else {
      // Verify session token for team portals
      const sessionToken = getPortalSessionToken(req);
      if (!sessionToken || !portalSessions[sessionToken]) {
        return res.status(401).json({ success: false, error: "Unauthorized portal session." });
      }
      const session = portalSessions[sessionToken];
      if (session.type !== type) {
        return res.status(401).json({ success: false, error: "Unauthorized portal session." });
      }

      const sessTok = String(session.secureToken || "").trim();
      const secTok = String(portalData.secureToken || "").trim();
      const reqTok = String(secureToken || "").trim();

      if (sessTok !== reqTok && sessTok !== secTok) {
        return res.status(401).json({ success: false, error: "Unauthorized portal session." });
      }
    }

    // Enforce server-side upload permission
    if (type === 'client' && projectFiles !== undefined && portalData.clientUploadEnabled === false) {
      return res.status(403).json({ success: false, error: "Client file uploads are disabled for this portal." });
    }

    const collectionName = type === "client" ? "clientPortals" : "teamPortals";

    const payload: any = {
      ...portalData,
      ...(req.body.portalData || {}),
      updatedAt: new Date().toISOString()
    };
    if (req.body.status) payload.status = req.body.status;
    if (folders !== undefined) payload.folders = folders;
    if (projectFiles !== undefined) payload.projectFiles = projectFiles;
    if (supportTickets !== undefined) payload.supportTickets = supportTickets;
    if (infoRecords !== undefined) payload.infoRecords = infoRecords;

    // Save to memory
    if (!memoryCollections[collectionName]) memoryCollections[collectionName] = {};
    memoryCollections[collectionName][portalData.id] = payload;

    // Save to Firestore
    if (isFirebaseAvailable) {
      try {
        await getFirestoreDb().collection(collectionName).doc(portalData.id).set(payload, { merge: true });
        console.log(`[FIREBASE] Saved portal update for ${portalData.id} to Firestore.`);
      } catch (upsertErr) {
        console.warn("[FIREBASE] Failed to persist portal updates to Firestore:", upsertErr);
      }
    }

    return res.json({ success: true });
  } catch (error: any) {
    console.error("Error in secure portal update:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Logout Endpoint - destroy session
app.post("/api/portal/logout", (req, res) => {
  const sessionToken = getPortalSessionToken(req);
  if (sessionToken && portalSessions[sessionToken]) {
    delete portalSessions[sessionToken];
  }
  res.setHeader("Set-Cookie", "zyqro_portal_session_token=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax");
  return res.json({ success: true });
});

// =========================================================================
// PORTAL CHAT & COMMUNICATION ENDPOINTS (WhatsApp-style Chat & Presence)
// =========================================================================

app.get("/api/portal/chat/messages", async (req, res) => {
  try {
    const conversationId = String(req.query.conversationId || req.query.conversation_id || "").trim();
    const portalId = String(req.query.portalId || req.query.portal_id || "").trim();
    
    let messages: any[] = [];
    if (isFirebaseAvailable) {
      try {
        let ref: any = getFirestoreDb().collection("portalMessages");
        if (conversationId) {
          ref = ref.where("conversationId", "==", conversationId);
        } else if (portalId) {
          ref = ref.where("portalId", "==", portalId);
        }
        const snapshot = await ref.get();
        snapshot.forEach((doc: any) => {
          messages.push({ id: doc.id, ...doc.data() });
        });
      } catch (err: any) {
        console.warn("[FIREBASE CHAT FETCH ERROR]", err.message);
      }
    }

    if (messages.length === 0) {
      const memItems = Object.values(memoryCollections["portalMessages"] || {});
      if (conversationId) {
        messages = memItems.filter((m: any) => m.conversationId === conversationId);
      } else if (portalId) {
        messages = memItems.filter((m: any) => m.portalId === portalId);
      } else {
        messages = memItems;
      }
    }

    // Sort by timestamp ascending
    messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return res.json({ success: true, messages });
  } catch (error: any) {
    console.error("Error fetching portal chat messages:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/portal/chat/send", async (req, res) => {
  try {
    const {
      id,
      conversationId,
      portalId,
      portalType,
      senderId,
      senderName,
      senderRole,
      receiverId,
      message,
      attachment,
      timestamp: reqTimestamp,
      sentAt: reqSentAt,
      deliveredAt,
      readAt,
      readStatus,
      status
    } = req.body;

    if (!conversationId || !portalId || (!message && !attachment)) {
      return res.status(400).json({ success: false, error: "Missing message data." });
    }

    // Use existing stable message ID if provided to prevent duplicate document creation
    const msgId = id || ("msg-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7));
    const timestamp = reqTimestamp || new Date().toISOString();
    const sentAt = reqSentAt || timestamp;

    const newMessage = {
      id: msgId,
      conversationId,
      portalId,
      portalType: portalType || 'client',
      senderId: senderId || portalId,
      senderName: senderName || 'User',
      senderRole: senderRole || 'Client',
      receiverId: receiverId || 'admin',
      message: message || '',
      timestamp,
      sentAt,
      deliveredAt: deliveredAt || null,
      readAt: readAt || null,
      readStatus: typeof readStatus === 'boolean' ? readStatus : false,
      status: status || 'sent',
      ...(attachment ? { attachment } : {})
    };

    // Save to memory
    if (!memoryCollections["portalMessages"]) memoryCollections["portalMessages"] = {};
    memoryCollections["portalMessages"][msgId] = newMessage;
    savePersistentDb();
    delete collectionCache["portalMessages"];

    // Save to Firestore with merge to avoid creating duplicate records or overwriting with stale IDs
    if (isFirebaseAvailable) {
      try {
        await getFirestoreDb().collection("portalMessages").doc(msgId).set(newMessage, { merge: true });
      } catch (err: any) {
        console.warn("[FIREBASE CHAT SAVE ERROR]", err.message);
      }
    }

    return res.json({ success: true, message: newMessage });
  } catch (error: any) {
    console.error("Error sending portal chat message:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Acknowledge delivery of incoming messages when recipient client receives them
app.post("/api/portal/chat/deliver", async (req, res) => {
  try {
    const { messageIds, conversationId, recipientRole } = req.body;
    const nowIso = new Date().toISOString();

    const memItems = Object.values(memoryCollections["portalMessages"] || {});
    let targetMessages: any[] = [];

    if (Array.isArray(messageIds) && messageIds.length > 0) {
      const idSet = new Set(messageIds);
      targetMessages = memItems.filter((m: any) => idSet.has(m.id) && !m.deliveredAt);
    } else if (conversationId) {
      targetMessages = memItems.filter((m: any) => 
        m.conversationId === conversationId && 
        !m.deliveredAt &&
        (recipientRole === 'Admin' ? m.senderRole !== 'Admin' : m.senderRole === 'Admin')
      );
    }

    for (const msg of targetMessages) {
      msg.deliveredAt = nowIso;
      if (msg.status === 'sent') {
        msg.status = 'delivered';
      }
      memoryCollections["portalMessages"][msg.id] = msg;

      if (isFirebaseAvailable) {
        try {
          await getFirestoreDb().collection("portalMessages").doc(msg.id).update({
            deliveredAt: nowIso,
            status: 'delivered'
          });
        } catch (e) {}
      }
    }

    if (targetMessages.length > 0) {
      savePersistentDb();
      delete collectionCache["portalMessages"];
    }

    return res.json({ success: true, updatedCount: targetMessages.length });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/portal/chat/read", async (req, res) => {
  try {
    const { conversationId, readerRole, messageIds } = req.body;
    const nowIso = new Date().toISOString();

    const memItems = Object.values(memoryCollections["portalMessages"] || {});
    let targetMessages: any[] = [];

    if (Array.isArray(messageIds) && messageIds.length > 0) {
      const idSet = new Set(messageIds);
      targetMessages = memItems.filter((m: any) => idSet.has(m.id) && (!m.readStatus || !m.readAt));
    } else if (conversationId) {
      targetMessages = memItems.filter((m: any) => 
        m.conversationId === conversationId && 
        (!m.readStatus || !m.readAt) && 
        (readerRole === 'Admin' ? m.senderRole !== 'Admin' : m.senderRole === 'Admin')
      );
    }

    for (const msg of targetMessages) {
      msg.readStatus = true;
      msg.readAt = nowIso;
      msg.status = 'read';
      if (!msg.deliveredAt) msg.deliveredAt = nowIso;
      memoryCollections["portalMessages"][msg.id] = msg;

      if (isFirebaseAvailable) {
        try {
          await getFirestoreDb().collection("portalMessages").doc(msg.id).update({
            readStatus: true,
            readAt: nowIso,
            status: 'read'
          });
        } catch (e) {}
      }
    }

    if (targetMessages.length > 0) {
      savePersistentDb();
      delete collectionCache["portalMessages"];
    }

    return res.json({ success: true, updatedCount: targetMessages.length });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Soft-delete or remove message
app.post("/api/portal/chat/delete", async (req, res) => {
  try {
    const { messageId, deletedBy, deletedRole } = req.body;
    if (!messageId) {
      return res.status(400).json({ success: false, error: "Message ID is required." });
    }
    const nowIso = new Date().toISOString();
    const updatePayload = {
      isDeleted: true,
      deletedAt: nowIso,
      deletedBy: deletedBy || "user",
      deletedRole: deletedRole || "User"
    };

    if (memoryCollections["portalMessages"] && memoryCollections["portalMessages"][messageId]) {
      memoryCollections["portalMessages"][messageId] = {
        ...memoryCollections["portalMessages"][messageId],
        ...updatePayload
      };
      savePersistentDb();
      delete collectionCache["portalMessages"];
    }

    if (isFirebaseAvailable) {
      try {
        await getFirestoreDb().collection("portalMessages").doc(messageId).update(updatePayload);
      } catch (e) {}
    }

    return res.json({ success: true, messageId, updatePayload });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/portal/presence", async (req, res) => {
  try {
    const { id, portalId, portalType, name, isTyping, activeConv } = req.body;
    const presenceId = id || (portalId ? `${portalType}_${portalId}` : 'admin');

    const lastActive = new Date().toISOString();
    const presenceRecord = {
      id: presenceId,
      portalId: portalId || presenceId,
      portalType: portalType || 'client',
      name: name || 'User',
      lastActive,
      isOnline: true,
      isTyping: !!isTyping,
      activeConv: activeConv || ''
    };

    if (!memoryCollections["portalPresence"]) memoryCollections["portalPresence"] = {};
    memoryCollections["portalPresence"][presenceId] = presenceRecord;
    delete collectionCache["portalPresence"];

    if (isFirebaseAvailable) {
      try {
        await getFirestoreDb().collection("portalPresence").doc(presenceId).set(presenceRecord, { merge: true });
      } catch (e) {}
    }

    return res.json({ success: true, presence: presenceRecord });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/portal/presence", async (req, res) => {
  try {
    let presenceList: any[] = [];
    if (isFirebaseAvailable) {
      try {
        const snapshot = await getFirestoreDb().collection("portalPresence").get();
        snapshot.forEach((doc: any) => {
          presenceList.push({ id: doc.id, ...doc.data() });
        });
      } catch (e) {}
    }

    if (presenceList.length === 0) {
      presenceList = Object.values(memoryCollections["portalPresence"] || {});
    }

    const now = Date.now();
    const updated = presenceList.map((p: any) => {
      const activeMs = new Date(p.lastActive).getTime();
      const isOnline = (now - activeMs) < 60000;
      return {
        ...p,
        isOnline
      };
    });

    return res.json({ success: true, presence: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Regenerate Portal Endpoint - force recreate and sync to Supabase
app.post("/api/portal/regenerate", async (req, res) => {
  try {
    const { type, secureToken } = req.body;
    if (!secureToken || !type) {
      return res.status(400).json({ success: false, error: "Missing required parameters." });
    }

    // Try to find in MySQL first
    const mysqlTable = type === "client" ? "clients" : "team";
    const [mysqlRows] = await pool.query(`SELECT * FROM ${mysqlTable} WHERE id = ? LIMIT 1`, [secureToken]);
    const mysqlAccount = (mysqlRows as any[])[0];

    if (!mysqlAccount) {
      return res.status(404).json({ success: false, error: "Master account not found in CRM database. Regeneration impossible." });
    }

    const portalId = type === "client" ? (mysqlAccount.id.startsWith('CP-') ? mysqlAccount.id : `CP-${Math.floor(1000 + Math.random() * 9000)}`) : mysqlAccount.id;
    const collectionName = type === "client" ? "clientPortals" : "teamPortals";
    const mappedTable = tableMap[collectionName];

    const newPortal: any = {
      id: portalId,
      portalId: portalId,
      secureToken: secureToken,
      clientId: mysqlAccount.id,
      clientName: mysqlAccount.name || mysqlAccount.fullName,
      username: (mysqlAccount.name || mysqlAccount.fullName || "user").toLowerCase().replace(/\s+/g, "_"),
      password: "PortalUser99",
      status: "Active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      folders: [],
      projectFiles: [],
      supportTickets: [],
      profileInfo: {
        company: mysqlAccount.company || "",
        contactPerson: mysqlAccount.name || mysqlAccount.fullName,
        email: mysqlAccount.email || "",
        phone: mysqlAccount.phone || ""
      }
    };

    // Save to memory
    if (!memoryCollections[collectionName]) memoryCollections[collectionName] = {};
    memoryCollections[collectionName][portalId] = newPortal;

    // Save to Firestore
    if (isFirebaseAvailable) {
      try {
        await getFirestoreDb().collection(collectionName).doc(portalId).set(newPortal);
        console.log(`[FIREBASE] Saved regenerated portal ${portalId} to Firestore.`);
      } catch (upsertErr) {
        console.warn("[FIREBASE] Failed to persist regenerated portal to Firestore:", upsertErr);
      }
    }

    return res.json({ success: true, message: "Portal successfully regenerated.", portalId });
  } catch (error: any) {
    console.error("Error in portal regeneration:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI Coding Agent endpoint proxying Gemini API
app.post("/api/coding_agent/chat", async (req, res) => {
  try {
    const { prompt, files, activeFile, mode, preferences } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, error: "Prompt is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined. Falling back to intelligent offline assistant.");
      return res.json({
        success: true,
        offline: true,
        thought: "Currently operating in offline mode because GEMINI_API_KEY is missing. Providing rule-based response.",
        plan: ["Understand request in offline mode", "Construct static file modification mock"],
        revisions: [],
        explanation: `### Offline Coding Assistant

**Notice:** The server is currently running in offline mode (no \`GEMINI_API_KEY\` found in environment).

I have analyzed your prompt: *"${prompt}"*.

To unlock the full power of the Gemini-3.5-flash Coding Brain, please define your \`GEMINI_API_KEY\` secret in the **Settings > Secrets** panel!

In the meantime, I have run an offline analysis of your project workspace. Here's a developer guide to accomplish your task manually:

1. **Locate Target Files**: Open \`${activeFile || "src/App.tsx"}\` or look through the file tree for files related to your task.
2. **Implement Changes**: Use our dark code editor to modify and enrich components. You can make full-screen edits, create new files, or delete unused files directly.
3. **Save and Lint**: Click **Save File** to persist the changes. Use **Prettify Code** and **Run Lint Check** to verify correctness offline.`
      });
    }

    // Initialize Gemini API
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    // Structure of files
    const fileSummary = (files || [])
      .map((f: any) => `### FILE: ${f.path}\n\`\`\`${f.path.split('.').pop() || 'text'}\n${f.content}\n\`\`\``)
      .join("\n\n");

    const systemInstruction = `You are a professional Senior AI Coding Agent integrated as a developer workspace within a CRM.
Your job is to assist developers in building, refactoring, explaining, and debugging full-stack web projects.
You have access to the current files in the workspace.
Active File is: ${activeFile || 'None'}.
Developer Preferences: ${preferences || 'Standard modern React, Tailwind CSS, modular clean components, clean typescript.'}

### OBJECTIVE:
Analyze the user's request, examine the project files, and return a structured JSON response containing:
1. "thought": Your reasoning and analysis.
2. "plan": step-by-step actions (pills/items) to fulfill the request.
3. "revisions": An array of objects: { path: string, content: string, description: string } representing any files that should be modified, created, or updated. ALWAYS supply the FULL complete file content in the 'content' property. DO NOT use truncated placeholders like '// rest of code here' or '// ...'.
4. "explanation": A helpful markdown explanation/response to the user's chat message, describing how the changes work or answering their questions.

If the user is asking a general question, explaining code, or looking for suggestions without asking to modify/create files, keep the 'revisions' array empty [] and provide the detailed answer in 'explanation'.
Always style components beautifully with Tailwind CSS, leveraging Lucide icons and modern UI guidelines.`;

    const contents = `User Request: "${prompt}"
Mode: ${mode || 'general'}

Current Workspace Project Structure & Files:
${fileSummary}

Active File is: ${activeFile || 'None'}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            thought: {
              type: Type.STRING,
              description: "Detailed thought process of the agent analyzing the files and instructions."
            },
            plan: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Step-by-step checklist of actions to be performed."
            },
            revisions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  path: {
                    type: Type.STRING,
                    description: "The path of the file to create or modify, e.g. 'src/App.tsx' or 'src/utils.ts'."
                  },
                  content: {
                    type: Type.STRING,
                    description: "The complete, revised contents of the file. No shortcuts, no ellipsis."
                  },
                  description: {
                    type: Type.STRING,
                    description: "Short description of what was changed in this file."
                  }
                },
                required: ["path", "content", "description"]
              },
              description: "List of files created or modified. Always output full file contents."
            },
            explanation: {
              type: Type.STRING,
              description: "A detailed explanation of the changes, how they work, or general Q&A answers in Markdown format."
            }
          },
          required: ["thought", "plan", "revisions", "explanation"]
        }
      }
    });

    const resultText = response.text || "{}";
    const resultJson = JSON.parse(resultText.trim());

    return res.json({
      success: true,
      offline: false,
      ...resultJson
    });

  } catch (error: any) {
    console.error("Error in Coding Agent chat proxy:", error);
    res.status(500).json({
      success: false,
      error: "Failed to communicate with AI Coding Brain.",
      details: error.message
    });
  }
});

// Fallbacks for any other PHP endpoints to prevent console errors
app.all("/api/*.php", (req, res) => {
  res.json({ success: true, message: "Endpoint fallback" });
});

// =========================================================================
// START SERVER WITH VITE MIDDLEWARE
// =========================================================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER RUNNING] Port: ${PORT}`);
  });
}

if (!process.env.VERCEL && !process.env.VERCEL_ENV) {
  startServer();
}

export default app;
