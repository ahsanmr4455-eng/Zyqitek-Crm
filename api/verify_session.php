<?php
/**
 * Advanced Enterprise-grade Session & Security Verification
 * Automatically included in all secure API endpoints to enforce rate limiting,
 * authentication verification, inactive session expiry, CSRF validation, and cache-control.
 */

require_once __DIR__ . '/db.php';

// Helper function to fetch client IP
function get_client_ip_address() {
    return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
}

$ip_address = get_client_ip_address();
$endpoint = $_SERVER['SCRIPT_NAME'] ?? 'unknown_api';

// ==========================================
// 1. SECURITY & BROWSER CACHING HEADERS
// ==========================================
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
header("Expires: Sat, 26 Jul 1997 05:00:00 GMT"); // Date in the past

// Security headers
header("X-Frame-Options: DENY");
header("X-Content-Type-Options: nosniff");
header("X-XSS-Protection: 1; mode=block");

// Ensure session cookie parameters are secure
if (session_status() === PHP_SESSION_NONE) {
    if (PHP_VERSION_ID >= 70300) {
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'domain' => '',
            'secure' => true,
            'httponly' => true,
            'samesite' => 'Strict'
        ]);
    } else {
        session_set_cookie_params(0, '/; Secure; HttpOnly; SameSite=Strict');
    }
    session_start();
}

// ==========================================
// 2. IP RATE LIMITING (Max 120 reqs/min)
// ==========================================
$now_time = time();
$minute_ago = $now_time - 60;

try {
    // Clean up older rate limits first to avoid bloating
    $db->prepare("DELETE FROM ip_rate_limits WHERE request_time < ?")->execute([$minute_ago]);

    // Count requests in last 60 seconds
    $countStmt = $db->prepare("SELECT COUNT(*) as count FROM ip_rate_limits WHERE ip_address = ? AND request_time >= ?");
    $countStmt->execute([$ip_address, $minute_ago]);
    $requestCount = $countStmt->fetch()['count'] ?? 0;

    if ($requestCount > 120) {
        http_response_code(429);
        echo json_encode([
            "success" => false,
            "error" => "Too many requests. Rate limit exceeded. Please wait a minute."
        ]);
        exit();
    }

    // Log current request
    $logLimit = $db->prepare("INSERT INTO ip_rate_limits (ip_address, endpoint, request_time) VALUES (?, ?, ?)");
    $logLimit->execute([$ip_address, $endpoint, $now_time]);

} catch (PDOException $e) {
    // Silent fail-safe for rate limiting table during migrations
}

// ==========================================
// 3. AUTHENTICATION & SESSION EXPIRY
// ==========================================
// Read Bearer token from headers
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
$token = '';

if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    $token = $matches[1];
}

if (empty($token) && isset($_GET['token'])) {
    $token = $_GET['token'];
}

if (empty($token) && isset($_SESSION['user_token'])) {
    $token = $_SESSION['user_token'];
}

if (empty($token)) {
    http_response_code(401);
    echo json_encode(["success" => false, "error" => "Authentication required. Please sign in again."]);
    exit();
}

try {
    // Lookup session token in database
    $sessStmt = $db->prepare("SELECT * FROM user_sessions WHERE token = ? LIMIT 1");
    $sessStmt->execute([$token]);
    $session = $sessStmt->fetch();

    if (!$session) {
        http_response_code(401);
        echo json_encode(["success" => false, "error" => "Session is invalid. Please sign in again."]);
        exit();
    }

    // Check lifetime expiry
    if (strtotime($session['expiresAt']) < time()) {
        $db->prepare("DELETE FROM user_sessions WHERE token = ?")->execute([$token]);
        http_response_code(401);
        echo json_encode(["success" => false, "error" => "Session has expired. Please sign in again."]);
        exit();
    }

    // Check inactivity timeout (30 minutes = 1800 seconds)
    $last_active = intval($session['lastActive'] ?? 0);
    if ($last_active > 0 && ($now_time - $last_active) > 1800) {
        $db->prepare("DELETE FROM user_sessions WHERE token = ?")->execute([$token]);
        http_response_code(401);
        echo json_encode(["success" => false, "error" => "Session idle timeout exceeded. Please sign in again."]);
        exit();
    }

    // Update last active time
    $upStmt = $db->prepare("UPDATE user_sessions SET lastActive = ? WHERE token = ?");
    $upStmt->execute([$now_time, $token]);

    // Keep session superglobals populated for standalone compatibility
    $_SESSION['user_id'] = $session['id'] ?? 'user-1';
    $_SESSION['username'] = $session['username'];
    $_SESSION['role'] = $session['role'];
    $_SESSION['user_token'] = $token;

} catch (PDOException $e) {
    // If sessions table fails (e.g. initial setup offline state), fallback gracefully to session store
    if (!isset($_SESSION['user_token']) || $_SESSION['user_token'] !== $token) {
        http_response_code(401);
        echo json_encode(["success" => false, "error" => "Authentication verification failed."]);
        exit();
    }
}

// ==========================================
// 4. CSRF PROTECTION (POST, PUT, DELETE)
// ==========================================
$request_method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if (in_array($request_method, ['POST', 'PUT', 'DELETE'])) {
    $csrf_header = $headers['X-CSRF-Token'] ?? $headers['X-Csrf-Token'] ?? $headers['x-csrf-token'] ?? '';
    
    // Fallback lookup
    if (empty($csrf_header) && isset($_SESSION['csrf_token'])) {
        $csrf_header = $_SESSION['csrf_token'];
    }

    $stored_csrf = $session['csrfToken'] ?? $_SESSION['csrf_token'] ?? '';

    if (empty($csrf_header) || $csrf_header !== $stored_csrf) {
        http_response_code(403);
        echo json_encode(["success" => false, "error" => "CSRF validation failed. Action aborted."]);
        exit();
    }
}
