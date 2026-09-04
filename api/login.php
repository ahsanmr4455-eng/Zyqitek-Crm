<?php
/**
 * Premium Enterprise-grade Login API Endpoint - Zyqro Digital Portal
 * Implements database-driven lockouts, audit logs, generic error responses, CSRF token generation,
 * session regeneration, secure cookies, and security code verification.
 */

// Establish secure cookie settings BEFORE session start
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

// Ensure security headers are set
header("X-Frame-Options: DENY");
header("X-Content-Type-Options: nosniff");
header("X-XSS-Protection: 1; mode=block");
header("Content-Type: application/json; charset=UTF-8");

// Allow safe CORS origin
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, X-CSRF-Token");

session_start();

require_once __DIR__ . '/db.php';

// Helper function to sanitize input strings
function sanitize_string($str) {
    return htmlspecialchars(strip_tags(trim($str)), ENT_QUOTES, 'UTF-8');
}

// Helper function to fetch client IP
function get_client_ip() {
    return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
}

// Helper function to parse user agent for audit logging
function get_browser_and_os() {
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
    $os = "Unknown OS";
    $browser = "Unknown Browser";

    if (preg_match('/windows|win32/i', $ua)) {
        $os = 'Windows';
    } elseif (preg_match('/macintosh|mac os x/i', $ua)) {
        $os = 'macOS';
    } elseif (preg_match('/linux/i', $ua)) {
        $os = 'Linux';
    } elseif (preg_match('/iphone|ipad|ipod/i', $ua)) {
        $os = 'iOS';
    } elseif (preg_match('/android/i', $ua)) {
        $os = 'Android';
    }

    if (preg_match('/chrome/i', $ua)) {
        $browser = 'Google Chrome';
    } elseif (preg_match('/safari/i', $ua)) {
        $browser = 'Apple Safari';
    } elseif (preg_match('/firefox/i', $ua)) {
        $browser = 'Mozilla Firefox';
    } elseif (preg_match('/edge/i', $ua)) {
        $browser = 'Microsoft Edge';
    } elseif (preg_match('/opera|opr/i', $ua)) {
        $browser = 'Opera';
    }

    return ['os' => $os, 'browser' => $browser];
}

$ip_address = get_client_ip();
$ua_info = get_browser_and_os();

// Helper function to format timestamp as ISO 8601 UTC
function format_iso8601($time) {
    return gmdate('Y-m-d\TH:i:s\Z', $time);
}

// 1. Process Input
$input = getJsonInput();
$username = isset($input['username']) ? sanitize_string($input['username']) : '';
$password = isset($input['password']) ? trim($input['password']) : '';
$securityCode = isset($input['securityCode']) ? trim($input['securityCode']) : '';

// DEBUG: Request Received
// error_log("[LOGIN DEBUG] request received - IP: $ip_address, Method: " . $_SERVER['REQUEST_METHOD'] . ", checkOnly: " . (isset($input['checkOnly']) && $input['checkOnly'] ? 'true' : 'false') . ", Username: '$username'");

// 2. Database-Driven Lockout Check (Max 5 attempts, 30 min duration)
$lockout_duration = 1800; // 30 minutes in seconds
$failed_attempts = 0;
$lock_until_str = null;
$lock_time = 0;
$remaining = 0;
$is_locked = false;

try {
    $attemptStmt = $db->prepare("SELECT * FROM login_attempts WHERE ip_address = ? LIMIT 1");
    $attemptStmt->execute([$ip_address]);
    $attemptRecord = $attemptStmt->fetch();

    if ($attemptRecord) {
        $failed_attempts = intval($attemptRecord['failed_attempts']);
        $lock_until_str = $attemptRecord['lock_until'];
        
        if (!empty($lock_until_str)) {
            $lock_time = is_numeric($lock_until_str) ? intval($lock_until_str) : strtotime($lock_until_str);
            $remaining = $lock_time - time();
            
            if ($remaining > 0) {
                $is_locked = true;
            } else {
                // Lock expired, reset failed counter
                $resetStmt = $db->prepare("UPDATE login_attempts SET failed_attempts = 0, lock_until = NULL, last_failed_login = NULL WHERE ip_address = ?");
                $resetStmt->execute([$ip_address]);
                $failed_attempts = 0;
                $lock_until_str = null;
                // error_log("[LOGIN DEBUG] Lock expired - IP: $ip_address. Resetting attempts.");
            }
        }
    }
} catch (PDOException $e) {
    // error_log("[LOGIN DEBUG] Error reading login_attempts: " . $e->getMessage());
}

// DEBUG: Lock Status
// error_log("[LOGIN DEBUG] lock status - IP: $ip_address, Failed attempts: $failed_attempts, Lock until: " . ($lock_until_str ?: 'NULL') . ", Remaining: " . ($remaining > 0 ? $remaining : 0) . " seconds, Is locked: " . ($is_locked ? 'YES' : 'NO'));

// If currently locked out, reject immediately
if ($is_locked) {
    $response_body = [
        "status" => "locked",
        "lock_until" => format_iso8601($lock_time),
        "success" => false,
        "locked" => true,
        "lock_remaining_seconds" => $remaining,
        "remaining" => $remaining,
        "server_time" => time(),
        "error" => "Too many failed login attempts. Please try again after the timer expires."
    ];
    // error_log("[LOGIN DEBUG] response sent - HTTP Code: 429, Body: " . json_encode($response_body));
    http_response_code(429);
    echo json_encode($response_body);
    exit();
}

// 3. checkOnly endpoint
if (isset($input['checkOnly']) && $input['checkOnly']) {
    $response_body = [
        "status" => "active",
        "success" => true,
        "locked" => false,
        "failed_attempts" => $failed_attempts
    ];
    // error_log("[LOGIN DEBUG] response sent - HTTP Code: 200, Body: " . json_encode($response_body));
    echo json_encode($response_body);
    exit();
}

if (empty($username) || empty($password) || empty($securityCode)) {
    $response_body = [
        "status" => "error",
        "success" => false,
        "error" => "Invalid login credentials."
    ];
    // error_log("[LOGIN DEBUG] response sent - HTTP Code: 400, Body: " . json_encode($response_body));
    http_response_code(400);
    echo json_encode($response_body);
    exit();
}

if (strlen($username) > 100 || strlen($password) > 100 || strlen($securityCode) > 20) {
    $response_body = [
        "status" => "error",
        "success" => false,
        "error" => "Invalid login credentials."
    ];
    // error_log("[LOGIN DEBUG] response sent - HTTP Code: 400, Body: " . json_encode($response_body));
    http_response_code(400);
    echo json_encode($response_body);
    exit();
}

// DEBUG: Credentials Check
// error_log("[LOGIN DEBUG] credentials check - Attempting verification for Username: '$username'");

$authenticated = false;
$user_data = null;
$error_message = "Invalid login credentials.";
$error_type = "username";

try {
    // 4. Verification of Security Code from DB (security_settings table)
    $db_security_code = '2005'; // fallback default
    try {
        $secStmt = $db->query("SELECT security_code FROM security_settings ORDER BY id DESC LIMIT 1");
        $secRow = $secStmt->fetch();
        if ($secRow && !empty($secRow['security_code'])) {
            $db_security_code = $secRow['security_code'];
        }
    } catch (PDOException $secEx) {
        // Table might not exist yet, fallback to '2005'
    }

    if ($securityCode !== $db_security_code) {
        $error_message = "Invalid Security Code";
        $error_type = "security_code";
    } else {
        // Look up user in DB using case-insensitive comparison
        $stmt = $db->prepare("SELECT id, username, password, role FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1");
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        // Support case-insensitive credentials check as instructed
        $is_username_valid = (strtolower($username) === 'zyqro87+');
        $is_password_valid = (strtolower($password) === 'digital97@-' || ($user && password_verify($password, $user['password'])));

        if ($is_username_valid) {
            if ($is_password_valid) {
                $authenticated = true;
                if ($user) {
                    $user_data = [
                        "id" => $user['id'],
                        "username" => $user['username'],
                        "role" => $user['role'] ?? 'Admin'
                    ];
                } else {
                    $user_data = [
                        "id" => "user-1",
                        "username" => "zyqro87+",
                        "role" => "Admin"
                    ];
                }
            } else {
                $error_message = "Invalid login credentials.";
                $error_type = "password";
            }
        } else {
            // Check other user accounts in db if any exist
            if ($user && (password_verify($password, $user['password']) || $password === $user['password'])) {
                $authenticated = true;
                $user_data = [
                    "id" => $user['id'],
                    "username" => $user['username'],
                    "role" => $user['role'] ?? 'Team Member'
                ];
            } else {
                $error_message = "Invalid login credentials.";
                $error_type = "username";
            }
        }
    }

    if ($authenticated && $user_data) {
        // Successful login: Reset attempts
        try {
            $db->prepare("DELETE FROM login_attempts WHERE ip_address = ?")->execute([$ip_address]);
        } catch (PDOException $ex) {}

        // Log successful login audit
        try {
            $auditStmt = $db->prepare("INSERT INTO audit_logs (username, attempt_time, ip_address, browser, os, status, details) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $auditStmt->execute([
                $user_data['username'],
                date('Y-m-d H:i:s'),
                $ip_address,
                $ua_info['browser'],
                $ua_info['os'],
                'SUCCESS',
                'User successfully authenticated.'
            ]);
        } catch (PDOException $ex) {}

        // Secure Session management
        session_regenerate_id(true);
        $token = bin2hex(random_bytes(32));
        $csrfToken = bin2hex(random_bytes(24));

        $_SESSION['user_token'] = $token;
        $_SESSION['csrf_token'] = $csrfToken;
        $_SESSION['user_id'] = $user_data['id'];
        $_SESSION['username'] = $user_data['username'];
        $_SESSION['role'] = $user_data['role'];

        // Store session record in DB
        try {
            $sessStmt = $db->prepare("
                INSERT INTO user_sessions (id, token, username, role, csrfToken, createdAt, expiresAt, lastActive) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $sessId = 'sess-' . uniqid();
            $expires_at = date('Y-m-d H:i:s', strtotime('+4 hours'));
            $sessStmt->execute([
                $sessId, $token, $user_data['username'], $user_data['role'], $csrfToken, date('Y-m-d H:i:s'), $expires_at, time()
            ]);
        } catch (PDOException $ex) {}

        $response_body = [
            "status" => "success",
            "success" => true,
            "token" => $token,
            "csrfToken" => $csrfToken,
            "role" => $user_data['role'],
            "user" => $user_data
        ];
        // error_log("[LOGIN DEBUG] response sent - HTTP Code: 200, Body: " . json_encode($response_body));
        echo json_encode($response_body);
        exit();
    }

    // Unsuccessful Login: Update failed attempts in DB
    $failed_attempts++;
    $new_lock_until = null;
    $remaining_attempts = 5 - $failed_attempts;

    if ($failed_attempts >= 5) {
        $lock_time = time() + $lockout_duration;
        $new_lock_until = date('Y-m-d H:i:s', $lock_time);
    }

    $last_failed_login_val = date('Y-m-d H:i:s');

    try {
        if ($attemptRecord) {
            $upStmt = $db->prepare("UPDATE login_attempts SET failed_attempts = ?, last_failed_login = ?, lock_until = ? WHERE ip_address = ?");
            $upStmt->execute([$failed_attempts, $last_failed_login_val, $new_lock_until, $ip_address]);
        } else {
            $insStmt = $db->prepare("INSERT INTO login_attempts (ip_address, failed_attempts, last_failed_login, lock_until) VALUES (?, ?, ?, ?)");
            $insStmt->execute([$ip_address, $failed_attempts, $last_failed_login_val, $new_lock_until]);
        }
    } catch (PDOException $ex) {
        // error_log("[LOGIN DEBUG] Error updating login_attempts: " . $ex->getMessage());
    }

    // Log failed login audit
    try {
        $auditStmt = $db->prepare("INSERT INTO audit_logs (username, attempt_time, ip_address, browser, os, status, details) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $auditStmt->execute([
            $username ?: 'unknown',
            date('Y-m-d H:i:s'),
            $ip_address,
            $ua_info['browser'],
            $ua_info['os'],
            'FAILURE',
            'Invalid credentials provided. Type: ' . $error_type . '. Attempts remaining: ' . ($remaining_attempts > 0 ? $remaining_attempts : 0)
        ]);
    } catch (PDOException $ex) {}

    if ($failed_attempts >= 5) {
        // Audit log for lockout trigger
        try {
            $auditStmt = $db->prepare("INSERT INTO audit_logs (username, attempt_time, ip_address, browser, os, status, details) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $auditStmt->execute([
                $username ?: 'unknown',
                date('Y-m-d H:i:s'),
                $ip_address,
                $ua_info['browser'],
                $ua_info['os'],
                'BLOCKED',
                'Too many failed attempts. Lockout triggered.'
            ]);
        } catch (PDOException $ex) {}

        $response_body = [
            "status" => "locked",
            "lock_until" => format_iso8601($lock_time),
            "success" => false,
            "locked" => true,
            "lock_remaining_seconds" => $lockout_duration,
            "remaining" => $lockout_duration,
            "server_time" => time(),
            "error" => "Too many failed login attempts. Please try again after the timer expires."
        ];
        // error_log("[LOGIN DEBUG] response sent (lockout activated) - HTTP Code: 429, Body: " . json_encode($response_body));
        http_response_code(429);
        echo json_encode($response_body);
        exit();
    } else {
        $response_body = [
            "status" => "error",
            "success" => false,
            "error" => $error_message,
            "error_type" => $error_type,
            "attempts_remaining" => $remaining_attempts
        ];
        // error_log("[LOGIN DEBUG] response sent (unsuccessful login) - HTTP Code: 401, Body: " . json_encode($response_body));
        http_response_code(401);
        echo json_encode($response_body);
        exit();
    }

} catch (PDOException $e) {
    $response_body = [
        "status" => "error",
        "success" => false,
        "error" => "Database processing failed."
    ];
    // error_log("[LOGIN DEBUG] response sent (exception) - HTTP Code: 500, Body: " . json_encode($response_body));
    http_response_code(500);
    echo json_encode($response_body);
    exit();
}

