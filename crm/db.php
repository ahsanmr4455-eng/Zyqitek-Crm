<?php
/**
 * Standalone InfinityFree CRM Database Connection File
 * Host: sql302.infinityfree.com
 * Database: if0_42335838_zqportal
 * 
 * Secure and fully optimized for hosting environment.
 */

// Enable CORS and define JSON output headers (useful if APIs are queried externally)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database Connection Configuration
define('DB_HOST', 'sql302.infinityfree.com');
define('DB_PORT', '3306');
define('DB_USER', 'if0_42335838');
define('DB_PASS', 'xurkkJ6MFC5VY');
define('DB_NAME', 'if0_42335838_crm3');

try {
    $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $db = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Database connection failed. Please verify your config in crm/db.php. Detail: " . $e->getMessage()
    ]);
    exit();
}

/**
 * Utility to parse JSON request body safely
 */
function getJsonInput() {
    $raw = file_get_contents("php://input");
    return json_decode($raw, true) ?: [];
}
