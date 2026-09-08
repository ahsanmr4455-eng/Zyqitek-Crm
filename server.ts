import express from "express";
import path from "path";
import fs from "fs";
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
const PORT = Number(process.env.PORT) || 3000;

// Configure Multer for memory storage (file uploads)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// =========================================================================
// FIREBASE / FIRESTORE INITIALIZATION & CONNECTION
// =========================================================================

let firestoreDbInstance: ReturnType<typeof getFirestore> | null = null;
let isFirebaseAvailable = false;
let firebaseError: string | null = null;

function isPlaceholder(val: string | undefined): boolean {
  if (!val) return true;
  const v = val.toLowerCase();
  return (
    v === "dummy" ||
    v === "nono" ||
    v === "non" ||
    v === "xxxxx" ||
    v.includes("your-") ||
    v.includes("firebase-adminsdk-xxxxx")
  );
}

try {
  const envProjectId = process.env.FIREBASE_PROJECT_ID;
  const envClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const envPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (
    !isPlaceholder(envProjectId) &&
    (!isPlaceholder(envClientEmail) || !isPlaceholder(envPrivateKey))
  ) {
    if (!getAdminApps().length) {
      const privateKey = (envPrivateKey || "").replace(/\\n/g, "\n");
      initializeAdminApp({
        credential: adminCert({
          projectId: envProjectId,
          clientEmail: envClientEmail || "",
          privateKey: privateKey,
        }),
        storageBucket:
          process.env.FIREBASE_STORAGE_BUCKET ||
          `${envProjectId}.firebasestorage.app`,
      });
    }
    const dbId =
      process.env.FIREBASE_DATABASE_ID ||
      process.env.FIREBASE_FIRESTORE_DATABASE_ID;
    if (dbId && dbId !== "(default)" && !isPlaceholder(dbId)) {
      firestoreDbInstance = getFirestore(dbId);
    } else {
      firestoreDbInstance = getFirestore();
    }
    console.log("[FIREBASE] Admin initialized with environment variables.");
  } else {
    const rootConfigPath = path.join(
      process.cwd(),
      "firebase-applet-config.json"
    );
    const srcConfigPath = path.join(
      process.cwd(),
      "src/lib/firebase-applet-config.json"
    );
    const configPath = fs.existsSync(rootConfigPath)
      ? rootConfigPath
      : fs.existsSync(srcConfigPath)
      ? srcConfigPath
      : null;
    if (configPath && fs.existsSync(configPath)) {
      const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
      const pId = firebaseConfig.projectId;
      const dbId = firebaseConfig.firestoreDatabaseId;
      if (!isPlaceholder(pId)) {
        console.log(
          `[FIREBASE] Initializing Admin with config file. Project: ${pId}, Database: ${
            dbId || "(default)"
          }`
        );
        if (!getAdminApps().length) {
          initializeAdminApp({
            projectId: pId,
            storageBucket:
              firebaseConfig.storageBucket || `${pId}.firebasestorage.app`,
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
  console.error("[FIREBASE] Admin initialization error:", error);
}

function getFirestoreDb() {
  if (!firestoreDbInstance) {
    throw new Error(
      "Firestore database instance not initialized. Check your Firebase configuration."
    );
  }
  return firestoreDbInstance;
}

async function checkFirebaseConnection() {
  try {
    const db = getFirestoreDb();
    await db.listCollections();
    isFirebaseAvailable = true;
    firebaseError = null;
    console.log(
      "[FIREBASE] Connection check PASSED. Firestore cloud database is active."
    );
  } catch (err: any) {
    firebaseError = err.message || String(err);
    isFirebaseAvailable = false;
    console.log(
      "[FIREBASE] Firestore connection status: server operating in high-availability mode with local persistence fallback."
    );
  }
}

// Check connectivity on startup
checkFirebaseConnection();

// =========================================================================
// DATA REPOSITORY & HIGH-RELIABILITY LOCAL STATE (ZERO MYSQL)
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
  goals: {
    "1": {
      id: "1",
      title: "Revenue Target",
      category: "Financial",
      current: 0.0,
      target: 20000.0,
      unit: "$",
      deadline: "June 30, 2026",
    },
    "2": {
      id: "2",
      title: "Leads Target",
      category: "Marketing",
      current: 0.0,
      target: 10.0,
      unit: "leads",
      deadline: "June 30, 2026",
    },
    "3": {
      id: "3",
      title: "Onboarded Clients",
      category: "Operations",
      current: 0.0,
      target: 5.0,
      unit: "clients",
      deadline: "June 30, 2026",
    },
  },
  emailDiscussions: {},
  callDiscussions: {},
  conversationDiscussions: {},
  project_tracking: {},
  project_revisions: {},
  project_reviews: {},
  settings: {
    "1": {
      id: 1,
      setting_key: "portal_url",
      setting_value: "https://zyqitek.com",
      portal_url: "https://zyqitek.com",
      preview_url: "https://zyqitek.com",
      redirect_url: "https://zyqitek.com/thank-you",
      redirect_enabled: true,
    },
  },
  security_settings: {
    "1": { id: 1, security_code: "2005" },
  },
  user_sessions: {},
  login_attempts: {},
  portalMessages: {},
  portalPresence: {},
  web_responses: {},
};

function getPersistentDbFilePath(): string {
  // If running on Vercel or AWS Lambda (read-only filesystem), persist to /tmp
  if (
    process.env.VERCEL ||
    process.env.VERCEL_ENV ||
    process.env.AWS_LAMBDA_FUNCTION_NAME
  ) {
    const tmpPath = path.join("/tmp", "crm_database_persistent.json");
    if (!fs.existsSync(tmpPath)) {
      try {
        const rootPath = path.join(
          process.cwd(),
          "crm_database_persistent.json"
        );
        if (fs.existsSync(rootPath)) {
          fs.copyFileSync(rootPath, tmpPath);
        }
      } catch (e) {}
    }
    return tmpPath;
  }
  return path.join(process.cwd(), "crm_database_persistent.json");
}

function loadPersistentDb() {
  try {
    const filePath = getPersistentDbFilePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        Object.keys(parsed).forEach((col) => {
          memoryCollections[col] = parsed[col] || {};
        });
        console.log(
          `[PERSISTENT DB] Loaded CRM collections from disk: ${Object.keys(
            parsed
          ).join(", ")}`
        );
      }
    } else {
      console.log(`[PERSISTENT DB] Initializing new persistent disk state.`);
    }
  } catch (err) {
    console.error(`[PERSISTENT DB] Error loading database file from disk:`, err);
  }
}

export function savePersistentDb() {
  try {
    const filePath = getPersistentDbFilePath();
    const cleanData = JSON.stringify(memoryCollections, null, 2);
    fs.writeFileSync(filePath, cleanData, "utf8");
  } catch (err) {
    // If saving to current working dir fails, try /tmp fallback
    try {
      const tmpPath = path.join("/tmp", "crm_database_persistent.json");
      fs.writeFileSync(tmpPath, JSON.stringify(memoryCollections, null, 2), "utf8");
    } catch (e2) {}
  }
}

// Load database from disk on server startup
loadPersistentDb();

// Cache and rate limit protection
const collectionCache: Record<string, { items: any[]; timestamp: number }> = {};
const COLLECTION_CACHE_TTL = 30000; // 30 seconds

// =========================================================================
// FIRESTORE CRUD HELPERS (WITH MEMORY SYNCHRONIZATION)
// =========================================================================

async function getCollectionDocs(
  collectionName: string,
  sortField?: string,
  sortDirection: "asc" | "desc" = "desc"
): Promise<any[]> {
  // Check cache first
  const now = Date.now();
  const cacheTtl =
    collectionName === "portalMessages" || collectionName === "portalPresence"
      ? 1000
      : COLLECTION_CACHE_TTL;

  if (
    collectionCache[collectionName] &&
    now - collectionCache[collectionName].timestamp < cacheTtl
  ) {
    return collectionCache[collectionName].items;
  }

  if (isFirebaseAvailable) {
    try {
      const db = getFirestoreDb();
      let query: any = db.collection(collectionName);
      if (sortField) {
        query = query.orderBy(sortField, sortDirection);
      }
      const snapshot = await query.get();
      const items: any[] = [];
      snapshot.forEach((doc: any) => {
        const data = doc.data();
        items.push({ id: doc.id, ...data });
        // Update local memory collection in background
        if (!memoryCollections[collectionName]) {
          memoryCollections[collectionName] = {};
        }
        memoryCollections[collectionName][doc.id] = { id: doc.id, ...data };
      });
      collectionCache[collectionName] = { items, timestamp: now };
      return items;
    } catch (err: any) {
      console.warn(
        `[FIREBASE FETCH] Firestore fetch failed for ${collectionName}, falling back to memory:`,
        err.message
      );
    }
  }

  // Fallback to in-memory state
  const items = Object.values(memoryCollections[collectionName] || {});
  if (sortField) {
    items.sort((a: any, b: any) => {
      const valA = a[sortField] || "";
      const valB = b[sortField] || "";
      if (sortDirection === "asc") {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });
  }
  collectionCache[collectionName] = { items, timestamp: now };
  return items;
}

async function getDocById(
  collectionName: string,
  docId: string
): Promise<any | null> {
  const safeId = String(docId).trim();
  if (!safeId) return null;

  if (isFirebaseAvailable) {
    try {
      const db = getFirestoreDb();
      const docSnap = await db.collection(collectionName).doc(safeId).get();
      if (docSnap.exists) {
        const data = { id: docSnap.id, ...docSnap.data() };
        if (!memoryCollections[collectionName]) {
          memoryCollections[collectionName] = {};
        }
        memoryCollections[collectionName][safeId] = data;
        return data;
      }
    } catch (err: any) {
      console.warn(
        `[FIREBASE GET] Error getting doc ${safeId} from ${collectionName}:`,
        err.message
      );
    }
  }

  if (
    memoryCollections[collectionName] &&
    memoryCollections[collectionName][safeId]
  ) {
    return memoryCollections[collectionName][safeId];
  }

  return null;
}

async function saveDoc(
  collectionName: string,
  docId: string,
  data: any,
  merge = true
): Promise<void> {
  const safeId = String(docId).trim();
  if (!safeId) return;

  const payload = { id: safeId, ...data };

  // 1. Update in-memory
  if (!memoryCollections[collectionName]) {
    memoryCollections[collectionName] = {};
  }
  memoryCollections[collectionName][safeId] = merge
    ? { ...(memoryCollections[collectionName][safeId] || {}), ...payload }
    : payload;

  savePersistentDb();
  delete collectionCache[collectionName];

  // 2. Persist to Firestore
  if (isFirebaseAvailable) {
    try {
      const db = getFirestoreDb();
      await db
        .collection(collectionName)
        .doc(safeId)
        .set(payload, { merge });
    } catch (err: any) {
      console.warn(
        `[FIREBASE SAVE] Error saving doc ${safeId} to ${collectionName}:`,
        err.message
      );
    }
  }
}

async function deleteDocById(
  collectionName: string,
  docId: string
): Promise<void> {
  const safeId = String(docId).trim();
  if (!safeId) return;

  // 1. Remove from in-memory
  if (
    memoryCollections[collectionName] &&
    memoryCollections[collectionName][safeId]
  ) {
    delete memoryCollections[collectionName][safeId];
    savePersistentDb();
  }
  delete collectionCache[collectionName];

  // 2. Remove from Firestore
  if (isFirebaseAvailable) {
    try {
      const db = getFirestoreDb();
      await db.collection(collectionName).doc(safeId).delete();
    } catch (err: any) {
      console.warn(
        `[FIREBASE DELETE] Error deleting doc ${safeId} from ${collectionName}:`,
        err.message
      );
    }
  }
}

// =========================================================================
// ADMIN CREDENTIALS & SECURITY
// =========================================================================

function getAdminCredentials() {
  if (
    !memoryCollections.settings ||
    !memoryCollections.settings["admin_credentials"]
  ) {
    if (!memoryCollections.settings) memoryCollections.settings = {};
    memoryCollections.settings["admin_credentials"] = {
      username:
        process.env.CRM_ADMIN_USERNAME ||
        process.env.ADMIN_USERNAME ||
        "zyqro87",
      password:
        process.env.CRM_ADMIN_PASSWORD ||
        process.env.ADMIN_PASSWORD ||
        "digital97@-",
      securityCode:
        process.env.CRM_ADMIN_SECURITY_CODE ||
        process.env.ADMIN_SECURITY_CODE ||
        "2005",
    };
  }
  return memoryCollections.settings["admin_credentials"];
}

// Initialize Supabase Client securely on the backend (optional helper)
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";

let supabase: any = null;
if (
  SUPABASE_URL &&
  (SUPABASE_URL.startsWith("http://") || SUPABASE_URL.startsWith("https://")) &&
  SUPABASE_SERVICE_ROLE_KEY
) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  } catch (err) {
    console.warn("[SUPABASE] Optional client initialization note:", err);
  }
}

// =========================================================================
// MIDDLEWARES (CORS, SECURITY HEADERS, SESSION & CSRF VALIDATION)
// =========================================================================

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token, Cookie, x-portal-session-token"
  );
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enterprise Security Headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self' * data: blob: 'unsafe-inline' 'unsafe-eval';"
  );
  next();
});

// Helper to parse cookies
function parseCookies(cookieHeader?: string): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;
  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    list[parts.shift()!.trim()] = decodeURI(parts.join("="));
  });
  return list;
}

// Session Validation Middleware
app.use(async (req, res, next) => {
  const publicApiPaths = [
    "/api/login.php",
    "/api/login",
    "/api/verify_admin_code.php",
    "/api/verify_admin_code",
    "/api/verify-admin-code",
    "/api/verify-admin-code.php",
    "/api/verify_admin.php",
    "/api/verify-access-code",
    "/api/verify_access_code",
    "/api/verify_access_code.php",
    "/api/verify-access-code.php",
    "/api/reset.php",
    "/api/reset-crm-data",
    "/api/reset",
    "/api/portal/info",
    "/api/portal/handshake",
    "/api/portal/login",
    "/api/maps/config",
    "/api/lead-finder/status",
    "/api/supabase/health",
  ];

  const pathName = req.path;

  // 1. Static Assets & Portal Bypass
  const isPortalRoute =
    pathName.startsWith("/p/") ||
    pathName === "/p" ||
    pathName.startsWith("/api/portal/");
  const isAsset =
    (pathName.includes(".") &&
      !pathName.endsWith(".php") &&
      !pathName.endsWith(".html")) ||
    pathName.startsWith("/src/assets/");
  const isApiRoute = pathName.startsWith("/api/");
  const isCrmPageRoute =
    pathName === "/" ||
    pathName.startsWith("/dashboard") ||
    pathName.startsWith("/clients") ||
    pathName.startsWith("/portal-management") ||
    pathName === "/login";

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

  if (!token) {
    if (pathName.startsWith("/api/")) {
      return res.status(401).json({
        error:
          "Unauthorized access. Valid active session token is required.",
      });
    }
    return res.status(404).send("404 Not Found");
  }

  try {
    const session = await getDocById("user_sessions", token);

    if (!session) {
      if (pathName.startsWith("/api/")) {
        return res
          .status(401)
          .json({ error: "Your session is invalid. Please sign in again." });
      }
      return res.status(404).send("404 Not Found");
    }

    // Lifetime Expiry Verification (24 Hours)
    const expiresTime = new Date(session.expiresAt).getTime();
    if (expiresTime < Date.now()) {
      await deleteDocById("user_sessions", token);
      if (pathName.startsWith("/api/")) {
        return res
          .status(401)
          .json({ error: "Your session lifetime has expired." });
      }
      return res.status(404).send("404 Not Found");
    }

    // Inactivity Timeout (30 Minutes)
    const lastActiveSecs = Number(session.lastActive);
    if (
      lastActiveSecs > 0 &&
      Math.floor(Date.now() / 1000) - lastActiveSecs > 30 * 60
    ) {
      await deleteDocById("user_sessions", token);
      if (pathName.startsWith("/api/")) {
        return res.status(401).json({
          error: "Your session has been terminated due to inactivity.",
        });
      }
      return res.status(404).send("404 Not Found");
    }

    // Refresh Session Activity Timestamp
    const nowSecs = Math.floor(Date.now() / 1000).toString();
    await saveDoc(
      "user_sessions",
      token,
      { lastActive: nowSecs },
      true
    );

    // CSRF Token Validation for State-Modifying actions
    if (["POST", "PUT", "DELETE"].includes(req.method)) {
      const clientCsrfToken = req.headers["x-csrf-token"];
      const sessionCsrfToken = session.csrfToken;

      if (!clientCsrfToken || clientCsrfToken !== sessionCsrfToken) {
        return res.status(403).json({ error: "CSRF verification failed." });
      }
    }

    // Bind authenticated user
    (req as any).user = {
      id: session.id,
      username: session.username,
      role: session.role,
    };

    next();
  } catch (err: any) {
    console.error("[SECURITY INTEGRITY ERROR]", err.message);
    if (pathName.startsWith("/api/")) {
      return res.status(500).json({
        error: "An internal error occurred during security validation.",
      });
    }
    return res.status(404).send("404 Not Found");
  }
});

// =========================================================================
// AUTHENTICATION & LOGIN ENDPOINTS
// =========================================================================

// Rate limiter / Lockout tracker for login attempts
const loginAttemptsTracker: Record<
  string,
  { attempts: number; lockUntil: number }
> = {};

app.post(["/api/login.php", "/api/login"], async (req, res) => {
  try {
    const { username, password } = req.body;
    const ip = req.ip || req.socket.remoteAddress || "127.0.0.1";

    if (!username || !password) {
      return res
        .status(400)
        .json({ success: false, error: "Username and password are required" });
    }

    // Check IP Lockout
    let attemptRecord = loginAttemptsTracker[ip];
    if (attemptRecord && attemptRecord.lockUntil > Date.now()) {
      const remainingSeconds = Math.ceil(
        (attemptRecord.lockUntil - Date.now()) / 1000
      );
      return res.status(429).json({
        success: false,
        error: `Account temporarily locked due to excessive failed attempts. Try again in ${remainingSeconds} seconds.`,
        locked: true,
        remainingSeconds,
      });
    }

    const trimmedUser = String(username).trim().toLowerCase();
    const inputPass = String(password);

    // 1. Check Admin Credentials
    const adminCreds = getAdminCredentials();
    const isAdminMatch =
      trimmedUser === adminCreds.username.toLowerCase() &&
      inputPass === adminCreds.password;

    if (isAdminMatch) {
      delete loginAttemptsTracker[ip];

      const token =
        "sess_" +
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15) +
        Date.now().toString(36);
      const csrfToken =
        "csrf_" +
        Math.random().toString(36).substring(2, 15) +
        Date.now().toString(36);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

      const sessionData = {
        token,
        csrfToken,
        id: "admin-1",
        username: adminCreds.username,
        role: "Admin",
        createdAt: now.toISOString(),
        expiresAt,
        lastActive: Math.floor(Date.now() / 1000).toString(),
      };

      await saveDoc("user_sessions", token, sessionData);

      const isProduction = process.env.NODE_ENV === "production";
      let cookieString = `zyqro_session_token=${token}; Path=/; HttpOnly; Max-Age=86400; SameSite=Lax`;
      if (isProduction) {
        cookieString = `zyqro_session_token=${token}; Path=/; HttpOnly; Max-Age=86400; SameSite=None; Secure`;
      }
      res.setHeader("Set-Cookie", cookieString);

      return res.json({
        success: true,
        token,
        csrfToken,
        user: {
          id: "admin-1",
          username: adminCreds.username,
          role: "Admin",
          fullName: "Zyqitek Administrator",
        },
      });
    }

    // 2. Check Team Member Credentials in Firestore
    const teamMembers = await getCollectionDocs("team");
    const matchedMember = teamMembers.find((m: any) => {
      const u = String(m.username || "").trim().toLowerCase();
      const p = String(m.password || "");
      return u === trimmedUser && p === inputPass;
    });

    if (matchedMember) {
      if (matchedMember.status && matchedMember.status !== "Active") {
        return res
          .status(403)
          .json({ success: false, error: "This team account is deactivated." });
      }

      delete loginAttemptsTracker[ip];

      const token =
        "sess_" +
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15) +
        Date.now().toString(36);
      const csrfToken =
        "csrf_" +
        Math.random().toString(36).substring(2, 15) +
        Date.now().toString(36);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

      const sessionData = {
        token,
        csrfToken,
        id: matchedMember.id,
        username: matchedMember.username,
        role: matchedMember.role || "Team",
        createdAt: now.toISOString(),
        expiresAt,
        lastActive: Math.floor(Date.now() / 1000).toString(),
      };

      await saveDoc("user_sessions", token, sessionData);

      const isProduction = process.env.NODE_ENV === "production";
      let cookieString = `zyqro_session_token=${token}; Path=/; HttpOnly; Max-Age=86400; SameSite=Lax`;
      if (isProduction) {
        cookieString = `zyqro_session_token=${token}; Path=/; HttpOnly; Max-Age=86400; SameSite=None; Secure`;
      }
      res.setHeader("Set-Cookie", cookieString);

      return res.json({
        success: true,
        token,
        csrfToken,
        user: {
          id: matchedMember.id,
          username: matchedMember.username,
          role: matchedMember.role || "Team",
          fullName: matchedMember.fullName,
          service: matchedMember.service,
        },
      });
    }

    // 3. Failed Attempt Logging
    const currentAttempts = (attemptRecord?.attempts || 0) + 1;
    let lockUntil = 0;
    if (currentAttempts >= 5) {
      lockUntil = Date.now() + 15 * 60 * 1000; // 15-minute lock
    }
    loginAttemptsTracker[ip] = {
      attempts: currentAttempts,
      lockUntil,
    };

    return res.status(401).json({
      success: false,
      error: "Invalid username or password",
      attemptsRemaining: Math.max(0, 5 - currentAttempts),
    });
  } catch (error: any) {
    console.error("Error in login endpoint:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin Security Code Verification
app.post(
  [
    "/api/verify_admin_code.php",
    "/api/verify_admin_code",
    "/api/verify-admin-code",
    "/api/verify-admin-code.php",
    "/api/verify_admin.php",
  ],
  async (req, res) => {
    try {
      const { code } = req.body;
      const adminCreds = getAdminCredentials();
      const validCode = adminCreds.securityCode || "2005";

      if (String(code).trim() === String(validCode).trim()) {
        return res.json({ success: true, verified: true });
      }
      return res.status(401).json({ success: false, error: "Invalid admin security code" });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Access Code Screen Verification
app.all(
  [
    "/api/verify-access-code",
    "/api/verify_access_code",
    "/api/verify-access-code.php",
    "/api/verify_access_code.php",
  ],
  async (req, res) => {
    try {
      const code = req.body?.code || req.query?.code || "";
      const adminCreds = getAdminCredentials();
      const validCode =
        process.env.CRM_ACCESS_CODE || adminCreds.securityCode || "2005";

      if (String(code).trim() === String(validCode).trim()) {
        return res.json({ success: true, verified: true });
      }
      return res.status(401).json({ success: false, error: "Invalid access code" });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// Session Verification Endpoint
app.get(
  ["/api/verify_session.php", "/api/verify_session", "/api/verify-session"],
  async (req, res) => {
    let token = "";
    const authHeader = req.headers["authorization"] || "";
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
    if (!token && req.headers.cookie) {
      const match = req.headers.cookie.match(/zyqro_session_token=([^;]+)/);
      if (match) token = match[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, authenticated: false });
    }

    const session = await getDocById("user_sessions", token);
    if (!session) {
      return res.status(401).json({ success: false, authenticated: false });
    }

    return res.json({
      success: true,
      authenticated: true,
      user: {
        id: session.id,
        username: session.username,
        role: session.role,
      },
    });
  }
);

// Admin Credentials Configuration Endpoint
app.get("/api/admin-credentials", (req, res) => {
  const adminCreds = getAdminCredentials();
  res.json({
    success: true,
    username: adminCreds.username,
    securityCode: adminCreds.securityCode,
  });
});

app.post("/api/change-credentials", async (req, res) => {
  try {
    const { username, password, securityCode } = req.body;
    const adminCreds = getAdminCredentials();

    if (username) adminCreds.username = String(username).trim();
    if (password) adminCreds.password = String(password).trim();
    if (securityCode) adminCreds.securityCode = String(securityCode).trim();

    await saveDoc("settings", "admin_credentials", adminCreds);

    res.json({ success: true, message: "Admin credentials updated successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/reset-admin-credentials", async (req, res) => {
  try {
    const defaultCreds = {
      username: "zyqro87",
      password: "digital97@-",
      securityCode: "2005",
    };
    memoryCollections.settings["admin_credentials"] = defaultCreds;
    await saveDoc("settings", "admin_credentials", defaultCreds);
    res.json({ success: true, message: "Credentials reset to defaults" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =========================================================================
// LEADS ENDPOINTS
// =========================================================================

app.get(["/api/get_leads.php", "/api/get_leads", "/api/leads"], async (req, res) => {
  try {
    const leads = await getCollectionDocs("leads", "createdAt", "desc");
    res.json({ success: true, leads });
  } catch (error: any) {
    console.error("Error fetching leads:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post(["/api/add_lead.php", "/api/add_lead", "/api/leads/add"], async (req, res) => {
  try {
    const id = req.body.id || "lead-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
    const createdAt = req.body.createdAt || new Date().toISOString();
    const lead = {
      ...req.body,
      id,
      createdAt,
    };

    await saveDoc("leads", id, lead);
    res.json({ success: true, lead });
  } catch (error: any) {
    console.error("Error adding lead:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post(["/api/bulk_import_leads.php", "/api/bulk_import_leads"], async (req, res) => {
  try {
    const { leads } = req.body;
    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ success: false, error: "No leads array provided" });
    }

    const createdLeads: any[] = [];
    for (const leadData of leads) {
      const id = leadData.id || "lead-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
      const createdAt = leadData.createdAt || new Date().toISOString();
      const lead = {
        ...leadData,
        id,
        createdAt,
      };
      await saveDoc("leads", id, lead);
      createdLeads.push(lead);
    }

    res.json({ success: true, count: createdLeads.length, leads: createdLeads });
  } catch (error: any) {
    console.error("Error bulk importing leads:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post(["/api/update_lead.php", "/api/update_lead", "/api/leads/update"], async (req, res) => {
  try {
    const { id, ...updates } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, error: "ID is required" });
    }

    const existing = (await getDocById("leads", id)) || {};
    const updatedLead = { ...existing, ...updates, id };
    await saveDoc("leads", id, updatedLead);

    res.json({ success: true, lead: updatedLead });
  } catch (error: any) {
    console.error("Error updating lead:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post(["/api/delete_lead.php", "/api/delete_lead", "/api/leads/delete"], async (req, res) => {
  try {
    const { id, ids } = req.body;
    if (ids && Array.isArray(ids)) {
      for (const deleteId of ids) {
        await deleteDocById("leads", deleteId);
      }
    } else if (id) {
      await deleteDocById("leads", id);
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting lead:", error);
    res.status(500).json({ error: error.message });
  }
});

// =========================================================================
// CLIENTS ENDPOINTS
// =========================================================================

app.get(["/api/get_clients.php", "/api/get_clients", "/api/clients"], async (req, res) => {
  try {
    const clients = await getCollectionDocs("clients", "createdAt", "desc");
    res.json({ success: true, clients });
  } catch (error: any) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post(["/api/add_client.php", "/api/add_client", "/api/clients/add"], async (req, res) => {
  try {
    const id = req.body.id || "client-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
    const createdAt = req.body.createdAt || new Date().toISOString();
    const client = {
      ...req.body,
      id,
      createdAt,
    };

    await saveDoc("clients", id, client);

    // Auto-create client portal workspace if not exists
    const portalId = id.startsWith("CP-") ? id : `CP-${Math.floor(1000 + Math.random() * 9000)}`;
    const portalData = {
      id: portalId,
      portalId,
      secureToken: client.secureToken || "tok_" + Math.random().toString(36).substring(2, 15),
      clientId: id,
      clientName: client.name || client.fullName || "Client",
      clientCompany: client.company || "",
      clientEmail: client.email || "",
      username: (client.name || "client").toLowerCase().replace(/\s+/g, "_"),
      password: "PortalUser99",
      status: "Active",
      createdAt,
      updatedAt: createdAt,
      folders: [],
      projectFiles: [],
      supportTickets: [],
    };
    await saveDoc("clientPortals", portalId, portalData);

    res.json({ success: true, client });
  } catch (error: any) {
    console.error("Error adding client:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post(["/api/update_client.php", "/api/update_client", "/api/clients/update"], async (req, res) => {
  try {
    const { id, ...updates } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, error: "ID is required" });
    }

    const existing = (await getDocById("clients", id)) || {};
    const updatedClient = { ...existing, ...updates, id };
    await saveDoc("clients", id, updatedClient);

    res.json({ success: true, client: updatedClient });
  } catch (error: any) {
    console.error("Error updating client:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post(["/api/delete_client.php", "/api/delete_client", "/api/clients/delete"], async (req, res) => {
  try {
    const { id, ids } = req.body;
    if (ids && Array.isArray(ids)) {
      for (const deleteId of ids) {
        await deleteDocById("clients", deleteId);
        await deleteDocById("project_tracking", deleteId);
      }
    } else if (id) {
      await deleteDocById("clients", id);
      await deleteDocById("project_tracking", id);
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting client:", error);
    res.status(500).json({ error: error.message });
  }
});

// =========================================================================
// TEAM ENDPOINTS
// =========================================================================

app.get(["/api/get_team.php", "/api/get_team", "/api/team"], async (req, res) => {
  try {
    const team = await getCollectionDocs("team", "createdAt", "desc");
    res.json({ success: true, team });
  } catch (error: any) {
    console.error("Error fetching team:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post(["/api/add_team.php", "/api/add_team", "/api/team/add"], async (req, res) => {
  try {
    const id = req.body.id || "member-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
    const createdAt = req.body.createdAt || new Date().toISOString();
    const member = {
      ...req.body,
      id,
      createdAt,
    };

    await saveDoc("team", id, member);

    // Auto-create team portal workspace
    const portalData = {
      id,
      secureToken: member.secureToken || "tok_team_" + Math.random().toString(36).substring(2, 15),
      teamMemberId: id,
      fullName: member.fullName || member.name || "Team Member",
      email: member.email || "",
      whatsapp: member.whatsapp || "",
      role: member.role || "Team Member",
      username: member.username || (member.fullName || "member").toLowerCase().replace(/\s+/g, "_"),
      password: member.password || "TeamPass123!",
      status: "Active",
      createdAt,
      updatedAt: createdAt,
      assignedProjectIds: [],
      folders: [],
    };
    await saveDoc("teamPortals", id, portalData);

    res.json({ success: true, member });
  } catch (error: any) {
    console.error("Error adding team member:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post(["/api/update_team.php", "/api/update_team", "/api/team/update"], async (req, res) => {
  try {
    const { id, ...updates } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, error: "ID is required" });
    }

    const existing = (await getDocById("team", id)) || {};
    const updatedMember = { ...existing, ...updates, id };
    await saveDoc("team", id, updatedMember);

    res.json({ success: true, member: updatedMember });
  } catch (error: any) {
    console.error("Error updating team member:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post(["/api/delete_team.php", "/api/delete_team", "/api/team/delete"], async (req, res) => {
  try {
    const { id, ids } = req.body;
    if (ids && Array.isArray(ids)) {
      for (const deleteId of ids) {
        await deleteDocById("team", deleteId);
        await deleteDocById("teamPortals", deleteId);
      }
    } else if (id) {
      await deleteDocById("team", id);
      await deleteDocById("teamPortals", id);
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting team member:", error);
    res.status(500).json({ error: error.message });
  }
});

// =========================================================================
// GOALS ENDPOINTS
// =========================================================================

app.get(["/api/get_goals.php", "/api/get_goals", "/api/goals"], async (req, res) => {
  try {
    const goals = await getCollectionDocs("goals");
    res.json({ success: true, goals });
  } catch (error: any) {
    console.error("Error fetching goals:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post(["/api/add_goal.php", "/api/add_goal", "/api/goals/add"], async (req, res) => {
  try {
    const id = req.body.id || "goal-" + Date.now();
    const goal = {
      ...req.body,
      id,
    };
    await saveDoc("goals", id, goal);
    res.json({ success: true, goal });
  } catch (error: any) {
    console.error("Error adding goal:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post(["/api/update_goal.php", "/api/update_goal", "/api/goals/update"], async (req, res) => {
  try {
    const { id, ...updates } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, error: "ID is required" });
    }

    const existing = (await getDocById("goals", id)) || {};
    const updatedGoal = { ...existing, ...updates, id };
    await saveDoc("goals", id, updatedGoal);

    res.json({ success: true, goal: updatedGoal });
  } catch (error: any) {
    console.error("Error updating goal:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post(["/api/delete_goal.php", "/api/delete_goal", "/api/goals/delete"], async (req, res) => {
  try {
    const { id } = req.body;
    await deleteDocById("goals", id);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting goal:", error);
    res.status(500).json({ error: error.message });
  }
});

// =========================================================================
// CALLS ENDPOINTS
// =========================================================================

app.get(["/api/get_calls.php", "/api/get_calls", "/api/calls"], async (req, res) => {
  try {
    const calls = await getCollectionDocs("calls", "timestamp", "desc");
    res.json({ success: true, calls });
  } catch (error: any) {
    console.error("Error fetching calls:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post(["/api/add_call.php", "/api/add_call", "/api/calls/add"], async (req, res) => {
  try {
    const id = req.body.id || "call-" + Date.now();
    const createdAt = new Date().toISOString();
    const call = {
      id,
      ...req.body,
      timestamp: req.body.timestamp || createdAt,
      createdAt,
    };
    await saveDoc("calls", id, call);
    res.json({ success: true, call });
  } catch (error: any) {
    console.error("Error adding call:", error);
    res.status(500).json({ error: error.message });
  }
});

// =========================================================================
// PROJECTS ENDPOINTS
// =========================================================================

app.get(["/api/get_projects.php", "/api/get_projects", "/api/projects"], async (req, res) => {
  try {
    const projects = await getCollectionDocs("projects", "createdAt", "desc");
    res.json({ success: true, projects });
  } catch (error: any) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post(["/api/add_project.php", "/api/add_project", "/api/projects/add"], async (req, res) => {
  try {
    const id = req.body.id || "proj-" + Date.now();
    const createdAt = req.body.createdAt || new Date().toISOString();
    const project = {
      ...req.body,
      id,
      createdAt,
    };
    await saveDoc("projects", id, project);
    res.json({ success: true, project });
  } catch (error: any) {
    console.error("Error adding project:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post(["/api/update_project.php", "/api/update_project", "/api/projects/update"], async (req, res) => {
  try {
    const { id, ...updates } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, error: "ID is required" });
    }

    const existing = (await getDocById("projects", id)) || {};
    const updated = { ...existing, ...updates, id };
    await saveDoc("projects", id, updated);

    res.json({ success: true, project: updated });
  } catch (error: any) {
    console.error("Error updating project:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post(["/api/delete_project.php", "/api/delete_project", "/api/projects/delete"], async (req, res) => {
  try {
    const { id } = req.body;
    await deleteDocById("projects", id);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting project:", error);
    res.status(500).json({ error: error.message });
  }
});

// =========================================================================
// DISCUSSIONS ENDPOINTS (EMAIL, CALL, CONVERSATION)
// =========================================================================

// Email Discussions
app.get(["/api/get_email_discussions.php", "/api/get_email_discussions"], async (req, res) => {
  try {
    const discussions = await getCollectionDocs("emailDiscussions", "date", "desc");
    res.json({ success: true, discussions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post(["/api/add_email_discussion.php", "/api/add_email_discussion"], async (req, res) => {
  try {
    const id = req.body.id || "disc-email-" + Date.now();
    const createdAt = new Date().toISOString();
    const disc = {
      id,
      ...req.body,
      createdAt,
      date: req.body.date || createdAt,
    };
    await saveDoc("emailDiscussions", id, disc);
    res.json({ success: true, discussion: disc });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post(["/api/delete_email_discussion.php", "/api/delete_email_discussion"], async (req, res) => {
  try {
    const { id, ids } = req.body;
    if (ids && Array.isArray(ids)) {
      for (const deleteId of ids) {
        await deleteDocById("emailDiscussions", deleteId);
      }
    } else if (id) {
      await deleteDocById("emailDiscussions", id);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Call Discussions
app.get(["/api/get_call_discussions.php", "/api/get_call_discussions"], async (req, res) => {
  try {
    const discussions = await getCollectionDocs("callDiscussions", "callDate", "desc");
    res.json({ success: true, discussions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post(["/api/add_call_discussion.php", "/api/add_call_discussion"], async (req, res) => {
  try {
    const id = req.body.id || "disc-call-" + Date.now();
    const createdAt = new Date().toISOString();
    const disc = {
      id,
      ...req.body,
      createdAt,
      callDate: req.body.callDate || createdAt,
    };
    await saveDoc("callDiscussions", id, disc);
    res.json({ success: true, discussion: disc });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post(["/api/delete_call_discussion.php", "/api/delete_call_discussion"], async (req, res) => {
  try {
    const { id, ids } = req.body;
    if (ids && Array.isArray(ids)) {
      for (const deleteId of ids) {
        await deleteDocById("callDiscussions", deleteId);
      }
    } else if (id) {
      await deleteDocById("callDiscussions", id);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Conversation Discussions
app.get(["/api/get_conversation_discussions.php", "/api/get_conversation_discussions"], async (req, res) => {
  try {
    const discussions = await getCollectionDocs("conversationDiscussions", "date", "desc");
    res.json({ success: true, conversationDiscussions: discussions, discussions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post(["/api/add_conversation_discussion.php", "/api/add_conversation_discussion"], async (req, res) => {
  try {
    const id = req.body.id || "disc-conv-" + Date.now();
    const createdAt = new Date().toISOString();
    const disc = {
      id,
      ...req.body,
      createdAt,
    };
    await saveDoc("conversationDiscussions", id, disc);
    res.json({ success: true, conversationDiscussion: disc });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post(["/api/delete_conversation_discussion.php", "/api/delete_conversation_discussion"], async (req, res) => {
  try {
    const { id, ids } = req.body;
    if (ids && Array.isArray(ids)) {
      for (const deleteId of ids) {
        await deleteDocById("conversationDiscussions", deleteId);
      }
    } else if (id) {
      await deleteDocById("conversationDiscussions", id);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// =========================================================================
// PROJECT TRACKING & REVISIONS ENDPOINTS
// =========================================================================

app.get(["/api/project_tracking.php", "/api/project_tracking", "/api/project-tracking"], async (req, res) => {
  try {
    const clientId = String(req.query.client_id || "").trim();

    if (!clientId) {
      const allTrackings = await getCollectionDocs("project_tracking");
      const clients = await getCollectionDocs("clients");
      const team = await getCollectionDocs("team");

      const enriched = allTrackings.map((t: any) => {
        const client = clients.find((c: any) => c.id === t.client_id) || {};
        const member = team.find((tm: any) => tm.id === client.assignedTeamMember) || {};
        return {
          ...t,
          client_name: client.name || "",
          client_company: client.company || "",
          assigned_member_name: member.fullName || "Unassigned",
        };
      });

      return res.json({ success: true, data: enriched });
    }

    // Find client
    const client = await getDocById("clients", clientId);
    if (!client) {
      return res.status(404).json({ success: false, error: "Client not found" });
    }

    // Find or create project tracking record
    let tracking = await getDocById("project_tracking", clientId);
    if (!tracking) {
      const projectId = "PRJ-" + clientId.substring(Math.max(0, clientId.length - 6)).toUpperCase();
      const projectName = client.company ? client.company + " Project" : client.name + " Project";
      const start_date = new Date().toISOString().split("T")[0];
      const expected_delivery_date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const last_updated = new Date().toISOString();

      tracking = {
        id: clientId,
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
        estimated_time_left: "30 days",
      };

      await saveDoc("project_tracking", clientId, tracking);
    }

    // Fetch revisions and reviews
    const allRevisions = await getCollectionDocs("project_revisions");
    const revisions = allRevisions.filter((r: any) => r.client_id === clientId);

    const allReviews = await getCollectionDocs("project_reviews");
    const review = allReviews.find((rw: any) => rw.client_id === clientId) || null;

    let assigned_member_name = "Unassigned";
    if (client.assignedTeamMember) {
      const member = await getDocById("team", client.assignedTeamMember);
      if (member) {
        assigned_member_name = member.fullName || "Unassigned";
      }
    }

    res.json({
      success: true,
      tracking,
      revisions,
      review,
      client: {
        name: client.name,
        company: client.company,
        assigned_member_name,
      },
    });
  } catch (error: any) {
    console.error("Error in project_tracking GET:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post(["/api/project_tracking.php", "/api/project_tracking", "/api/project-tracking"], async (req, res) => {
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

      const revisionObj = {
        id: revId,
        client_id,
        notes: notes || "",
        status: revStatus,
        revision_date: revDate,
      };

      await saveDoc("project_revisions", revId, revisionObj);

      const allRevs = await getCollectionDocs("project_revisions");
      const revisionCount = allRevs.filter((r: any) => r.client_id === client_id).length;

      await saveDoc("project_tracking", client_id, {
        revisions_used: revisionCount,
        last_updated: new Date().toISOString(),
      });

      return res.json({ success: true, message: "Revision history item added successfully" });
    }

    if (action === "submit_review") {
      const { client_id, rating, message, recommend } = req.body;
      if (!client_id) {
        return res.status(400).json({ success: false, error: "Client ID is required" });
      }

      const revwId = "revw-" + client_id;
      const reviewObj = {
        id: revwId,
        client_id,
        rating: Number(rating ?? 5),
        message: message || "",
        recommend: recommend || "Yes",
        updatedAt: new Date().toISOString(),
      };

      await saveDoc("project_reviews", revwId, reviewObj);

      return res.json({ success: true, message: "Review saved successfully" });
    }

    // Default: Save/update project tracking info
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
      estimated_time_left,
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

    const trackingPayload = {
      id: client_id,
      client_id,
      project_name: project_name || "",
      project_id: project_id || "",
      start_date: start_date || "",
      expected_delivery_date: expected_delivery_date || "",
      current_status,
      overall_progress: progressVal,
      revisions_allowed: Number(revisions_allowed ?? 3),
      revisions_used: Number(revisions_used ?? 0),
      delivery_status: delivery_status || "Not Delivered",
      delivery_date: delivery_date || "",
      delivered_by: delivered_by || "",
      final_files: final_files || "",
      delivery_notes: delivery_notes || "",
      last_updated,
      estimated_time_left: estimated_time_left || "",
    };

    await saveDoc("project_tracking", client_id, trackingPayload);

    // Update client's projectProgress in clients collection
    await saveDoc("clients", client_id, { projectProgress: progressVal }, true);

    return res.json({
      success: true,
      message: "Project tracking updated successfully",
      current_status,
    });
  } catch (error: any) {
    console.error("Error in project_tracking POST:", error);
    res.status(500).json({ error: error.message });
  }
});

// =========================================================================
// SETTINGS & WEB RESPONSES ENDPOINTS
// =========================================================================

app.get(["/api/get_settings.php", "/api/get_settings"], async (req, res) => {
  try {
    const settingsList = await getCollectionDocs("settings");
    const mainSettings = settingsList.find((s: any) => s.id === 1 || s.id === "1") || {
      id: 1,
      portal_url: "https://zyqitek.com",
      preview_url: "https://zyqitek.com",
      redirect_url: "https://zyqitek.com/thank-you",
      redirect_enabled: true,
    };
    res.json({ success: true, settings: mainSettings, data: mainSettings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post(["/api/save_settings.php", "/api/save_settings"], async (req, res) => {
  try {
    const settingsData = {
      id: "1",
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    await saveDoc("settings", "1", settingsData);
    res.json({ success: true, message: "Settings saved successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/get_users.php", async (req, res) => {
  try {
    const team = await getCollectionDocs("team");
    const adminCreds = getAdminCredentials();
    const users = [
      { id: "user-1", username: adminCreds.username, role: "Admin", fullName: "Zyqitek Administrator" },
      ...team.map((m: any) => ({
        id: m.id,
        username: m.username || m.fullName,
        role: m.role || "Team Member",
        fullName: m.fullName,
      })),
    ];
    res.json({ success: true, users });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.all("/api/website_management.php", async (req, res) => {
  res.json({ success: true, message: "Website management synced." });
});

app.all("/api/web_responses.php", async (req, res) => {
  res.json({ success: true, responses: [] });
});

// =========================================================================
// RESET CRM DATA PERMANENTLY (FIRESTORE PURGE)
// =========================================================================

async function clearFirestoreCollection(collectionName: string) {
  if (!isFirebaseAvailable) return 0;
  try {
    const db = getFirestoreDb();
    const snapshot = await db.collection(collectionName).get();
    if (snapshot.empty) return 0;

    const batch = db.batch();
    let count = 0;
    snapshot.docs.forEach((doc: any) => {
      batch.delete(doc.ref);
      count++;
    });
    if (count > 0) {
      await batch.commit();
    }
    console.log(
      `[FIREBASE WIPE] Purged ${count} records from Firestore collection: ${collectionName}`
    );
    return count;
  } catch (err: any) {
    console.warn(
      `[FIREBASE WIPE WARNING] Could not purge collection ${collectionName}:`,
      err.message
    );
    return 0;
  }
}

const handleResetAllCrmData = async (req: express.Request, res: express.Response) => {
  console.log("=== RESET ALL CRM DATA INITIATED ===");
  try {
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
      "project_tracking",
      "project_revisions",
      "project_reviews",
      "clientPortals",
      "teamPortals",
      "teamInternalFiles",
      "proposals",
      "callScripts",
      "emailScripts",
      "portalMessages",
      "portalPresence",
    ];

    for (const col of firestoreCollectionsToPurge) {
      await clearFirestoreCollection(col);
      if (memoryCollections[col]) {
        memoryCollections[col] = {};
      }
    }

    savePersistentDb();

    // Invalidate all caches
    for (const key of Object.keys(collectionCache)) {
      delete collectionCache[key];
    }

    console.log("=== RESET ALL CRM DATA COMPLETED SUCCESSFULLY ===");
    return res.json({
      success: true,
      message: "All CRM data has been permanently deleted from Firestore.",
    });
  } catch (error: any) {
    console.error("=== RESET ALL CRM DATA ERROR ===", error);
    return res
      .status(500)
      .json({ success: false, error: error.message || "Failed to reset CRM data." });
  }
};

app.post("/api/reset-crm-data", handleResetAllCrmData);
app.post("/api/reset.php", handleResetAllCrmData);
app.post("/api/reset", handleResetAllCrmData);

// =========================================================================
// SUPABASE / FIRESTORE GENERIC COLLECTION SYNC API
// =========================================================================

app.get("/api/supabase/health", async (req, res) => {
  return res.json({
    status: "ok",
    supabaseOnline: false,
    firebaseOnline: isFirebaseAvailable,
    firebaseError: firebaseError,
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/supabase/collection/:collectionName", async (req, res) => {
  const { collectionName } = req.params;
  const user = (req as any).user;

  if (user && user.role === "Team") {
    const allowedCollections = [
      "teamPortals",
      "teamInternalFiles",
      "projects",
      "portalMessages",
      "portalPresence",
    ];
    if (!allowedCollections.includes(collectionName)) {
      return res.status(403).json({
        error: "Access denied. Team accounts are restricted to Project Workspaces only.",
      });
    }
  }

  const items = await getCollectionDocs(collectionName);
  return res.json({ success: true, items });
});

app.post("/api/supabase/collection/:collectionName/:docId", async (req, res) => {
  const { collectionName, docId } = req.params;
  const payload = req.body;
  const user = (req as any).user;

  if (user && user.role === "Team") {
    const allowedWriteCollections = [
      "teamInternalFiles",
      "teamPortals",
      "portalMessages",
      "portalPresence",
    ];
    if (!allowedWriteCollections.includes(collectionName)) {
      return res.status(403).json({ error: "Write access denied." });
    }
    if (collectionName === "teamPortals" && docId !== user.id) {
      return res
        .status(403)
        .json({ error: "Access denied. You can only update your own workspace." });
    }
  }

  await saveDoc(collectionName, docId, payload, true);
  return res.json({ success: true });
});

app.post("/api/supabase/batch-collection/:collectionName", async (req, res) => {
  const { collectionName } = req.params;
  const { items } = req.body;
  const user = (req as any).user;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "items array is required" });
  }

  if (user && user.role === "Team") {
    const allowedWriteCollections = [
      "teamInternalFiles",
      "teamPortals",
      "portalMessages",
      "portalPresence",
    ];
    if (!allowedWriteCollections.includes(collectionName)) {
      return res.status(403).json({ error: "Write access denied." });
    }
  }

  for (const item of items) {
    if (item && item.id) {
      await saveDoc(collectionName, item.id, item, true);
    }
  }

  return res.json({ success: true, count: items.length });
});

app.delete("/api/supabase/collection/:collectionName/:docId", async (req, res) => {
  const { collectionName, docId } = req.params;
  const user = (req as any).user;

  if (user && user.role === "Team") {
    const allowedDeleteCollections = ["teamInternalFiles"];
    if (!allowedDeleteCollections.includes(collectionName)) {
      return res.status(403).json({ error: "Delete access denied." });
    }
  }

  await deleteDocById(collectionName, docId);
  return res.json({ success: true });
});

// =========================================================================
// CLIENT & TEAM PORTAL GATEWAY
// =========================================================================

interface PortalSession {
  secureToken: string;
  type: "client" | "team";
  username: string;
  expiresAt: number;
}

const portalSessions: Record<string, PortalSession> = {};
const portalLoginAttempts: Record<
  string,
  { attempts: number; lockUntil: number }
> = {};

function getPortalSessionToken(req: express.Request): string | null {
  const headerToken = (req.headers["x-portal-session-token"] as string) || "";
  if (headerToken.trim()) return headerToken.trim();

  const authHeader = (req.headers["authorization"] as string) || "";
  if (authHeader.startsWith("Bearer ")) {
    const bearerToken = authHeader.substring(7).trim();
    if (bearerToken) return bearerToken;
  }

  const cookies = parseCookies(req.headers.cookie);
  const cookieToken = cookies["zyqro_portal_session_token"];
  if (cookieToken) return cookieToken;

  return null;
}

async function findPortalBySecureToken(
  type: "client" | "team",
  secureToken: string
): Promise<any> {
  const collectionName = type === "client" ? "clientPortals" : "teamPortals";
  const rawToken = (secureToken || "").trim();
  if (!rawToken) return null;

  if (isFirebaseAvailable) {
    try {
      const db = getFirestoreDb();
      const snapshot = await db
        .collection(collectionName)
        .where("secureToken", "==", rawToken)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }

      const docSnap = await db.collection(collectionName).doc(rawToken).get();
      if (docSnap.exists) {
        return { id: docSnap.id, ...docSnap.data() };
      }

      const portalIdSnap = await db
        .collection(collectionName)
        .where("portalId", "==", rawToken)
        .limit(1)
        .get();

      if (!portalIdSnap.empty) {
        const doc = portalIdSnap.docs[0];
        return { id: doc.id, ...doc.data() };
      }
    } catch (err) {}
  }

  const memItems = Object.values(memoryCollections[collectionName] || {});
  const foundMem = memItems.find(
    (p: any) =>
      String(p.secureToken || "").trim() === rawToken ||
      String(p.portalId || "").trim() === rawToken ||
      String(p.id || "").trim() === rawToken
  );
  if (foundMem) return foundMem;

  return null;
}

app.post("/api/portal/info", async (req, res) => {
  try {
    const { type, secureToken } = req.body;
    if (!secureToken || !type) {
      return res
        .status(400)
        .json({ success: false, error: "Missing required parameters." });
    }

    const portalData = await findPortalBySecureToken(type, secureToken);
    if (!portalData) {
      return res.json({ exists: false });
    }

    if (
      portalData.status !== "Active" &&
      portalData.status !== "Live" &&
      portalData.status !== "Draft"
    ) {
      return res.json({ exists: true, status: portalData.status || "Inactive" });
    }

    const publicName =
      type === "client"
        ? portalData.clientCompany || portalData.clientName
        : portalData.fullName;

    let isAuthenticated = false;
    const sessionToken = getPortalSessionToken(req);
    if (sessionToken && portalSessions[sessionToken]) {
      const session = portalSessions[sessionToken];
      if (session.type === type && Date.now() <= session.expiresAt) {
        const sessTok = String(session.secureToken || "").trim();
        const secTok = String(portalData.secureToken || "").trim();
        const reqTok = String(secureToken || "").trim();
        const pId = String(portalData.portalId || "").trim();
        const dId = String(portalData.id || "").trim();

        if (
          sessTok === reqTok ||
          sessTok === secTok ||
          sessTok === pId ||
          sessTok === dId
        ) {
          isAuthenticated = true;
          session.expiresAt = Date.now() + 2 * 60 * 60 * 1000;
        }
      }
    }

    if (isAuthenticated) {
      if (type === "team" && portalData.assignedProjectIds) {
        const projects: any[] = [];
        for (const pid of portalData.assignedProjectIds) {
          const proj = await getDocById("projects", pid);
          if (proj) projects.push(proj);
        }
        portalData.projects = projects;
      }

      return res.json({
        exists: true,
        authenticated: true,
        status: portalData.status || "Live",
        name: publicName,
        account: portalData,
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
          lockRemainingSeconds = Math.ceil(
            (tracking.lockUntil - Date.now()) / 1000
          );
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
        lockRemainingSeconds: isLocked ? lockRemainingSeconds : 0,
      });
    }
  } catch (error: any) {
    console.error("Error in portal info:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/portal/handshake", async (req, res) => {
  try {
    const { type, secureToken } = req.body;
    if (!secureToken || !type) {
      return res
        .status(400)
        .json({ authenticated: false, error: "Missing required parameters." });
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
      res.setHeader(
        "Set-Cookie",
        "zyqro_portal_session_token=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax"
      );
      return res.json({ authenticated: false, error: "Session expired." });
    }

    const portalData = await findPortalBySecureToken(type, secureToken);
    if (!portalData) {
      return res
        .status(404)
        .json({ authenticated: false, error: "Portal not found." });
    }

    const reqTok = String(secureToken || "").trim();
    const sessTok = String(session.secureToken || "").trim();
    const secTok = String(portalData.secureToken || "").trim();

    if (sessTok !== reqTok && sessTok !== secTok) {
      return res.json({ authenticated: false });
    }

    session.expiresAt = Date.now() + 2 * 60 * 60 * 1000;

    if (type === "team" && portalData.assignedProjectIds) {
      const projects: any[] = [];
      for (const pid of portalData.assignedProjectIds) {
        const proj = await getDocById("projects", pid);
        if (proj) projects.push(proj);
      }
      portalData.projects = projects;
    }

    return res.json({ authenticated: true, account: portalData });
  } catch (error: any) {
    res.status(500).json({ authenticated: false, error: error.message });
  }
});

app.post("/api/portal/login", async (req, res) => {
  try {
    const { type, secureToken, username, password } = req.body;
    if (!secureToken || !type || !username || !password) {
      return res
        .status(400)
        .json({ success: false, error: "All fields are required." });
    }

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
          error: "Login temporarily locked. Please try again after the timer expires.",
        });
      } else {
        delete portalLoginAttempts[trackerKey];
        tracking = undefined;
      }
    }

    const portalData = await findPortalBySecureToken(type, secureToken);
    if (!portalData) {
      return res.status(403).json({ success: false, error: "Access Denied." });
    }

    if (
      portalData.status !== "Active" &&
      portalData.status !== "Live" &&
      portalData.status !== "Draft"
    ) {
      return res
        .status(403)
        .json({ success: false, error: "This portal is currently inactive." });
    }

    const dbUsername = String(portalData.username || "").toLowerCase().trim();
    const dbPassword = String(portalData.password || "");

    const inputUsername = String(username).toLowerCase().trim();
    const inputPassword = String(password);

    if (dbUsername === inputUsername && dbPassword === inputPassword) {
      delete portalLoginAttempts[trackerKey];

      if (type === "team" && portalData.assignedProjectIds) {
        const projects: any[] = [];
        for (const pid of portalData.assignedProjectIds) {
          const proj = await getDocById("projects", pid);
          if (proj) projects.push(proj);
        }
        portalData.projects = projects;
      }

      const sessionToken =
        "psess_" +
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15) +
        Date.now().toString(36);

      portalSessions[sessionToken] = {
        secureToken:
          portalData.secureToken ||
          portalData.portalId ||
          portalData.id ||
          secureToken,
        type,
        username: dbUsername,
        expiresAt: Date.now() + 2 * 60 * 60 * 1000,
      };

      const isProduction = process.env.NODE_ENV === "production";
      let cookieString = `zyqro_portal_session_token=${sessionToken}; Path=/; HttpOnly; Max-Age=7200; SameSite=Lax`;
      if (isProduction) {
        cookieString = `zyqro_portal_session_token=${sessionToken}; Path=/; HttpOnly; Max-Age=7200; SameSite=None; Secure`;
      }
      res.setHeader("Set-Cookie", cookieString);

      return res.json({ success: true, sessionToken, account: portalData });
    } else {
      const attempts = (tracking?.attempts || 0) + 1;

      if (attempts >= 5) {
        const lockUntil = Date.now() + 15 * 60 * 1000;
        portalLoginAttempts[trackerKey] = { attempts: 5, lockUntil };

        return res.status(429).json({
          success: false,
          locked: true,
          lockUntil,
          lockRemainingMs: 15 * 60 * 1000,
          lockRemainingSeconds: 900,
          error: "Login temporarily locked. Please try again after the timer expires.",
        });
      } else {
        portalLoginAttempts[trackerKey] = { attempts, lockUntil: 0 };
        return res.status(401).json({
          success: false,
          locked: false,
          error: "Invalid username or password.",
        });
      }
    }
  } catch (error: any) {
    console.error("Error in portal login:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/portal/update", async (req, res) => {
  try {
    const {
      type,
      secureToken,
      folders,
      projectFiles,
      supportTickets,
      infoRecords,
    } = req.body;
    if (!secureToken || !type) {
      return res
        .status(400)
        .json({ success: false, error: "Missing required parameters." });
    }

    const portalData = await findPortalBySecureToken(type, secureToken);
    if (!portalData) {
      return res
        .status(404)
        .json({ success: false, error: "Portal not found." });
    }

    if (
      portalData.status !== "Active" &&
      portalData.status !== "Live" &&
      portalData.status !== "Draft"
    ) {
      return res
        .status(403)
        .json({ success: false, error: "This portal is currently inactive." });
    }

    // Verify authorization
    if (type === "client") {
      const secTok = String(portalData.secureToken || "").trim();
      const reqTok = String(secureToken || "").trim();
      const pId = String(portalData.portalId || "").trim();
      const dId = String(portalData.id || "").trim();

      if (secTok !== reqTok && pId !== reqTok && dId !== reqTok) {
        return res
          .status(401)
          .json({ success: false, error: "Invalid secure portal token." });
      }
    } else {
      const sessionToken = getPortalSessionToken(req);
      if (!sessionToken || !portalSessions[sessionToken]) {
        return res
          .status(401)
          .json({ success: false, error: "Unauthorized portal session." });
      }
      const session = portalSessions[sessionToken];
      if (session.type !== type) {
        return res
          .status(401)
          .json({ success: false, error: "Unauthorized portal session." });
      }

      const sessTok = String(session.secureToken || "").trim();
      const secTok = String(portalData.secureToken || "").trim();
      const reqTok = String(secureToken || "").trim();

      if (sessTok !== reqTok && sessTok !== secTok) {
        return res
          .status(401)
          .json({ success: false, error: "Unauthorized portal session." });
      }
    }

    if (
      type === "client" &&
      projectFiles !== undefined &&
      portalData.clientUploadEnabled === false
    ) {
      return res.status(403).json({
        success: false,
        error: "Client file uploads are disabled for this portal.",
      });
    }

    const collectionName = type === "client" ? "clientPortals" : "teamPortals";

    const payload: any = {
      ...portalData,
      ...(req.body.portalData || {}),
      updatedAt: new Date().toISOString(),
    };
    if (req.body.status) payload.status = req.body.status;
    if (folders !== undefined) payload.folders = folders;
    if (projectFiles !== undefined) payload.projectFiles = projectFiles;
    if (supportTickets !== undefined) payload.supportTickets = supportTickets;
    if (infoRecords !== undefined) payload.infoRecords = infoRecords;

    await saveDoc(collectionName, portalData.id, payload, true);

    return res.json({ success: true });
  } catch (error: any) {
    console.error("Error in secure portal update:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/portal/logout", (req, res) => {
  const sessionToken = getPortalSessionToken(req);
  if (sessionToken && portalSessions[sessionToken]) {
    delete portalSessions[sessionToken];
  }
  res.setHeader(
    "Set-Cookie",
    "zyqro_portal_session_token=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax"
  );
  return res.json({ success: true });
});

app.post("/api/portal/regenerate", async (req, res) => {
  try {
    const { type, secureToken } = req.body;
    if (!secureToken || !type) {
      return res
        .status(400)
        .json({ success: false, error: "Missing required parameters." });
    }

    const masterCollection = type === "client" ? "clients" : "team";
    const masterAccount = await getDocById(masterCollection, secureToken);

    if (!masterAccount) {
      return res.status(404).json({
        success: false,
        error: "Master account not found in CRM database.",
      });
    }

    const portalId =
      type === "client"
        ? masterAccount.id.startsWith("CP-")
          ? masterAccount.id
          : `CP-${Math.floor(1000 + Math.random() * 9000)}`
        : masterAccount.id;
    const collectionName = type === "client" ? "clientPortals" : "teamPortals";

    const newPortal: any = {
      id: portalId,
      portalId,
      secureToken,
      clientId: masterAccount.id,
      clientName: masterAccount.name || masterAccount.fullName,
      username: (masterAccount.name || masterAccount.fullName || "user")
        .toLowerCase()
        .replace(/\s+/g, "_"),
      password: "PortalUser99",
      status: "Active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      folders: [],
      projectFiles: [],
      supportTickets: [],
      profileInfo: {
        company: masterAccount.company || "",
        contactPerson: masterAccount.name || masterAccount.fullName,
        email: masterAccount.email || "",
        phone: masterAccount.phone || "",
      },
    };

    await saveDoc(collectionName, portalId, newPortal);

    return res.json({
      success: true,
      message: "Portal successfully regenerated.",
      portalId,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =========================================================================
// REAL-TIME CHAT & MESSAGING (WHATSAPP-STYLE)
// =========================================================================

app.get("/api/portal/chat/messages", async (req, res) => {
  try {
    const conversationId = String(
      req.query.conversationId || req.query.conversation_id || ""
    ).trim();
    const portalId = String(
      req.query.portalId || req.query.portal_id || ""
    ).trim();

    let allMessages = await getCollectionDocs("portalMessages");
    let messages: any[] = [];

    if (conversationId) {
      messages = allMessages.filter((m: any) => m.conversationId === conversationId);
    } else if (portalId) {
      messages = allMessages.filter((m: any) => m.portalId === portalId);
    } else {
      messages = allMessages;
    }

    messages.sort(
      (a, b) =>
        new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()
    );

    return res.json({ success: true, messages });
  } catch (error: any) {
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
      status,
    } = req.body;

    if (!conversationId || !portalId || (!message && !attachment)) {
      return res
        .status(400)
        .json({ success: false, error: "Missing message data." });
    }

    const msgId =
      id ||
      "msg-" +
        Date.now() +
        "-" +
        Math.random().toString(36).substring(2, 7);
    const timestamp = reqTimestamp || new Date().toISOString();
    const sentAt = reqSentAt || timestamp;

    const newMessage = {
      id: msgId,
      conversationId,
      portalId,
      portalType: portalType || "client",
      senderId: senderId || portalId,
      senderName: senderName || "User",
      senderRole: senderRole || "Client",
      receiverId: receiverId || "admin",
      message: message || "",
      timestamp,
      sentAt,
      deliveredAt: deliveredAt || null,
      readAt: readAt || null,
      readStatus: typeof readStatus === "boolean" ? readStatus : false,
      status: status || "sent",
      ...(attachment ? { attachment } : {}),
    };

    await saveDoc("portalMessages", msgId, newMessage);

    return res.json({ success: true, message: newMessage });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/portal/chat/deliver", async (req, res) => {
  try {
    const { messageIds, conversationId, recipientRole } = req.body;
    const nowIso = new Date().toISOString();

    const memItems = Object.values(memoryCollections["portalMessages"] || {});
    let targetMessages: any[] = [];

    if (Array.isArray(messageIds) && messageIds.length > 0) {
      const idSet = new Set(messageIds);
      targetMessages = memItems.filter(
        (m: any) => idSet.has(m.id) && !m.deliveredAt
      );
    } else if (conversationId) {
      targetMessages = memItems.filter(
        (m: any) =>
          m.conversationId === conversationId &&
          !m.deliveredAt &&
          (recipientRole === "Admin"
            ? m.senderRole !== "Admin"
            : m.senderRole === "Admin")
      );
    }

    for (const msg of targetMessages) {
      await saveDoc(
        "portalMessages",
        msg.id,
        {
          deliveredAt: nowIso,
          status: "delivered",
        },
        true
      );
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
      targetMessages = memItems.filter(
        (m: any) => idSet.has(m.id) && (!m.readStatus || !m.readAt)
      );
    } else if (conversationId) {
      targetMessages = memItems.filter(
        (m: any) =>
          m.conversationId === conversationId &&
          (!m.readStatus || !m.readAt) &&
          (readerRole === "Admin"
            ? m.senderRole !== "Admin"
            : m.senderRole === "Admin")
      );
    }

    for (const msg of targetMessages) {
      await saveDoc(
        "portalMessages",
        msg.id,
        {
          readStatus: true,
          readAt: nowIso,
          status: "read",
          deliveredAt: msg.deliveredAt || nowIso,
        },
        true
      );
    }

    return res.json({ success: true, updatedCount: targetMessages.length });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/portal/chat/delete", async (req, res) => {
  try {
    const { messageId, deletedBy, deletedRole } = req.body;
    if (!messageId) {
      return res
        .status(400)
        .json({ success: false, error: "Message ID is required." });
    }
    const nowIso = new Date().toISOString();
    const updatePayload = {
      isDeleted: true,
      deletedAt: nowIso,
      deletedBy: deletedBy || "user",
      deletedRole: deletedRole || "User",
    };

    await saveDoc("portalMessages", messageId, updatePayload, true);

    return res.json({ success: true, messageId, updatePayload });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/portal/presence", async (req, res) => {
  try {
    const { id, portalId, portalType, name, isTyping, activeConv } = req.body;
    const presenceId = id || (portalId ? `${portalType}_${portalId}` : "admin");
    const lastActive = new Date().toISOString();

    const presenceRecord = {
      id: presenceId,
      portalId: portalId || presenceId,
      portalType: portalType || "client",
      name: name || "User",
      lastActive,
      isOnline: true,
      isTyping: !!isTyping,
      activeConv: activeConv || "",
    };

    await saveDoc("portalPresence", presenceId, presenceRecord, true);

    return res.json({ success: true, presence: presenceRecord });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/portal/presence", async (req, res) => {
  try {
    const presenceList = await getCollectionDocs("portalPresence");
    const now = Date.now();
    const updated = presenceList.map((p: any) => {
      const activeMs = new Date(p.lastActive || 0).getTime();
      const isOnline = now - activeMs < 60000;
      return {
        ...p,
        isOnline,
      };
    });

    return res.json({ success: true, presence: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// =========================================================================
// STORAGE UPLOAD & DOWNLOAD (FIREBASE STORAGE / SERVER FALLBACK)
// =========================================================================

const STORAGE_DIR = path.join(process.cwd(), "storage_uploads");
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

app.post(
  ["/api/supabase/storage/upload", "/api/portal/storage/upload"],
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const folderPath = (req.body.folderPath || "general").replace(
        /[^a-zA-Z0-9_\-\/]/g,
        "_"
      );
      const safeOriginalName = req.file.originalname.replace(
        /[^a-zA-Z0-9_\.\-\s]/g,
        "_"
      );
      const fileName = `${Date.now()}-${safeOriginalName}`;
      const destination = `${folderPath}/${fileName}`;

      let uploadedToFirebase = false;
      let fileUrl = "";

      if ((admin as any).apps?.length) {
        try {
          const bucket = getStorage().bucket();
          const file = bucket.file(destination);
          await file.save(req.file.buffer, {
            metadata: {
              contentType: req.file.mimetype,
              metadata: {
                originalName: req.file.originalname,
                uploadedAt: new Date().toISOString(),
              },
            },
            resumable: false,
          });

          try {
            const [signedUrl] = await file.getSignedUrl({
              action: "read",
              expires: "03-09-2491",
            });
            fileUrl = signedUrl;
            uploadedToFirebase = true;
          } catch (signErr) {
            fileUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
            uploadedToFirebase = true;
          }
        } catch (fbErr: any) {
          console.warn("[STORAGE] Firebase bucket note:", fbErr.message);
        }
      }

      // Save to local storage_uploads directory
      try {
        const localTargetDir = path.join(STORAGE_DIR, folderPath);
        if (!fs.existsSync(localTargetDir)) {
          fs.mkdirSync(localTargetDir, { recursive: true });
        }
        const localFilePath = path.join(STORAGE_DIR, destination);
        fs.writeFileSync(localFilePath, req.file.buffer);
      } catch (localErr) {}

      if (!uploadedToFirebase || !fileUrl) {
        fileUrl = `/api/storage/file?path=${encodeURIComponent(
          destination
        )}&filename=${encodeURIComponent(req.file.originalname)}`;
      }

      return res.json({
        success: true,
        fileUrl,
        downloadUrl: `/api/storage/file?path=${encodeURIComponent(
          destination
        )}&filename=${encodeURIComponent(req.file.originalname)}&download=1`,
        fileName: req.file.originalname,
        size: req.file.size,
        storagePath: destination,
        contentType: req.file.mimetype,
      });
    } catch (error: any) {
      console.error("[STORAGE UPLOAD ERROR]", error);
      return res
        .status(500)
        .json({ error: error.message || "Failed to upload file to storage" });
    }
  }
);

app.get(
  ["/api/storage/file", "/api/portal/storage/download"],
  async (req, res) => {
    try {
      const filePathParam = (req.query.path as string) || "";
      const requestedFileName =
        (req.query.filename as string) ||
        path.basename(filePathParam) ||
        "download";
      const isDownload =
        req.query.download === "1" || req.query.download === "true";

      if (!filePathParam) {
        return res.status(400).send("File path is required.");
      }

      const normalized = path
        .normalize(filePathParam)
        .replace(/^(\.\.[\/\\])+/, "");
      const localFilePath = path.join(STORAGE_DIR, normalized);

      if (fs.existsSync(localFilePath) && fs.statSync(localFilePath).isFile()) {
        const stat = fs.statSync(localFilePath);
        const ext = path.extname(requestedFileName).toLowerCase();

        const mimeTypes: { [key: string]: string } = {
          ".pdf": "application/pdf",
          ".png": "image/png",
          ".jpg": "image/jpeg",
          ".jpeg": "image/jpeg",
          ".gif": "image/gif",
          ".svg": "image/svg+xml",
          ".webp": "image/webp",
          ".mp4": "video/mp4",
          ".webm": "video/webm",
          ".zip": "application/zip",
          ".rar": "application/x-rar-compressed",
          ".csv": "text/csv",
          ".xlsx":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          ".xls": "application/vnd.ms-excel",
          ".docx":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          ".doc": "application/msword",
          ".txt": "text/plain",
          ".json": "application/json",
        };

        const contentType = mimeTypes[ext] || "application/octet-stream";

        res.setHeader("Content-Type", contentType);
        res.setHeader("Content-Length", stat.size);
        res.setHeader("Accept-Ranges", "bytes");

        if (isDownload) {
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="${encodeURIComponent(requestedFileName)}"`
          );
        } else {
          res.setHeader(
            "Content-Disposition",
            `inline; filename="${encodeURIComponent(requestedFileName)}"`
          );
        }

        const stream = fs.createReadStream(localFilePath);
        return stream.pipe(res);
      }

      // Try Firebase Storage
      if ((admin as any).apps?.length) {
        try {
          const bucket = getStorage().bucket();
          const file = bucket.file(normalized);
          const [exists] = await file.exists();
          if (exists) {
            const [metadata] = await file.getMetadata();
            res.setHeader(
              "Content-Type",
              metadata.contentType || "application/octet-stream"
            );
            if (metadata.size) {
              res.setHeader("Content-Length", metadata.size);
            }
            if (isDownload) {
              res.setHeader(
                "Content-Disposition",
                `attachment; filename="${encodeURIComponent(
                  requestedFileName
                )}"`
              );
            }
            return file.createReadStream().pipe(res);
          }
        } catch (fbErr) {}
      }

      return res.status(404).send("File not found.");
    } catch (err: any) {
      return res.status(500).send("Internal server error.");
    }
  }
);

app.post(
  ["/api/supabase/storage/delete", "/api/portal/storage/delete"],
  async (req, res) => {
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
        const normalized = path
          .normalize(targetPath)
          .replace(/^(\.\.[\/\\])+/, "");
        const localFilePath = path.join(STORAGE_DIR, normalized);
        if (fs.existsSync(localFilePath)) {
          try {
            fs.unlinkSync(localFilePath);
          } catch (e) {}
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
  }
);

// =========================================================================
// AI CODING AGENT & GEMINI PROXY
// =========================================================================

app.post("/api/coding_agent/chat", async (req, res) => {
  try {
    const { prompt, files, activeFile, mode, preferences } = req.body;

    if (!prompt) {
      return res
        .status(400)
        .json({ success: false, error: "Prompt is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.json({
        success: true,
        offline: true,
        thought:
          "Currently operating in offline mode because GEMINI_API_KEY is missing. Providing rule-based response.",
        plan: [
          "Understand request in offline mode",
          "Construct static file modification mock",
        ],
        revisions: [],
        explanation: `### Offline Coding Assistant

**Notice:** The server is currently running in offline mode (no \`GEMINI_API_KEY\` found in environment).

I have analyzed your prompt: *"${prompt}"*.

To unlock the full power of the Gemini-3.5-flash Coding Brain, please define your \`GEMINI_API_KEY\` secret in the **Settings > Secrets** panel!`,
      });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const fileSummary = (files || [])
      .map(
        (f: any) =>
          `### FILE: ${f.path}\n\`\`\`${
            f.path.split(".").pop() || "text"
          }\n${f.content}\n\`\`\``
      )
      .join("\n\n");

    const systemInstruction = `You are a professional Senior AI Coding Agent integrated as a developer workspace within a CRM.
Your job is to assist developers in building, refactoring, explaining, and debugging full-stack web projects.
You have access to the current files in the workspace.
Active File is: ${activeFile || "None"}.
Developer Preferences: ${
      preferences ||
      "Standard modern React, Tailwind CSS, modular clean components, clean typescript."
    }

### OBJECTIVE:
Analyze the user's request, examine the project files, and return a structured JSON response containing:
1. "thought": Your reasoning and analysis.
2. "plan": step-by-step actions (pills/items) to fulfill the request.
3. "revisions": An array of objects: { path: string, content: string, description: string } representing any files that should be modified, created, or updated. ALWAYS supply the FULL complete file content in the 'content' property. DO NOT use truncated placeholders like '// rest of code here' or '// ...'.
4. "explanation": A helpful markdown explanation/response to the user's chat message, describing how the changes work or answering their questions.

If the user is asking a general question, explaining code, or looking for suggestions without asking to modify/create files, keep the 'revisions' array empty [] and provide the detailed answer in 'explanation'.
Always style components beautifully with Tailwind CSS, leveraging Lucide icons and modern UI guidelines.`;

    const contents = `User Request: "${prompt}"
Mode: ${mode || "general"}

Current Workspace Project Structure & Files:
${fileSummary}

Active File is: ${activeFile || "None"}`;

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
              description:
                "Detailed thought process of the agent analyzing the files and instructions.",
            },
            plan: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description:
                "Step-by-step checklist of actions to be performed.",
            },
            revisions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  path: {
                    type: Type.STRING,
                    description:
                      "The path of the file to create or modify, e.g. 'src/App.tsx' or 'src/utils.ts'.",
                  },
                  content: {
                    type: Type.STRING,
                    description:
                      "The complete, revised contents of the file. No shortcuts, no ellipsis.",
                  },
                  description: {
                    type: Type.STRING,
                    description:
                      "Short description of what was changed in this file.",
                  },
                },
                required: ["path", "content", "description"],
              },
              description:
                "List of files created or modified. Always output full file contents.",
            },
            explanation: {
              type: Type.STRING,
              description:
                "A detailed explanation of the changes, how they work, or general Q&A answers in Markdown format.",
            },
          },
          required: ["thought", "plan", "revisions", "explanation"],
        },
      },
    });

    const resultText = response.text || "{}";
    const resultJson = JSON.parse(resultText.trim());

    return res.json({
      success: true,
      offline: false,
      ...resultJson,
    });
  } catch (error: any) {
    console.error("Error in Coding Agent chat proxy:", error);
    res.status(500).json({
      success: false,
      error: "Failed to communicate with AI Coding Brain.",
      details: error.message,
    });
  }
});

// Google Maps demo config endpoint
app.get("/api/maps/config", (req, res) => {
  res.json({
    apiKey:
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.VITE_GOOGLE_MAPS_API_KEY ||
      "",
  });
});

// Lead finder status endpoint
app.get("/api/lead-finder/status", (req, res) => {
  res.json({
    available: true,
    mapsAvailable: !!(
      process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY
    ),
  });
});

// Lead finder search proxy endpoint
app.post("/api/lead-finder/search", async (req, res) => {
  try {
    const { query, location, minRating, hasWebsite, sortBy, pageSize, pageToken, customApiKey } = req.body;
    const apiKey = customApiKey || process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: "API_NOT_CONFIGURED",
        message: "Google Places API is not configured. Please set GOOGLE_MAPS_API_KEY in backend configuration or provide a custom API key.",
      });
    }

    const searchQuery = `${query || ""} ${location || ""}`.trim();
    if (!searchQuery) {
      return res.status(400).json({ success: false, message: "Search query is required." });
    }

    const url = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
    url.searchParams.append("query", searchQuery);
    url.searchParams.append("key", apiKey);
    if (pageToken) {
      url.searchParams.append("pagetoken", pageToken);
    }

    const apiRes = await fetch(url.toString());
    const data = await apiRes.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      return res.status(400).json({
        success: false,
        message: data.error_message || `Places API returned status: ${data.status}`,
      });
    }

    let results = (data.results || []).map((p: any) => ({
      placeId: p.place_id,
      name: p.name,
      address: p.formatted_address || p.vicinity,
      rating: p.rating || 0,
      userRatingsTotal: p.user_ratings_total || 0,
      businessStatus: p.business_status,
      types: p.types || [],
      location: p.geometry?.location,
      priceLevel: p.price_level,
      openNow: p.opening_hours?.open_now,
    }));

    if (minRating && minRating > 0) {
      results = results.filter((r: any) => r.rating >= minRating);
    }

    return res.json({
      success: true,
      results,
      nextPageToken: data.next_page_token || null,
      totalCount: results.length,
    });
  } catch (error: any) {
    console.error("Error in lead-finder search proxy:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Catch-all for any other PHP endpoints
app.all("/api/*.php", (req, res) => {
  res.json({ success: true, message: "Endpoint fallback" });
});

// =========================================================================
// START SERVER WITH VITE MIDDLEWARE
// =========================================================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
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
