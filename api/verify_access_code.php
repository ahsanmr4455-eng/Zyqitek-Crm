<?php
// Secure Server-Side Access Code Verification Handler
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, HEAD");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token, Cookie");
header("Access-Control-Max-Age: 86400");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit(0);
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$code = $_POST['code'] ?? $_GET['code'] ?? $input['code'] ?? $input['accessCode'] ?? $_POST['accessCode'] ?? $_GET['accessCode'] ?? '';
$checkOnly = isset($_GET['checkOnly']) ? filter_var($_GET['checkOnly'], FILTER_VALIDATE_BOOLEAN) : (isset($input['checkOnly']) ? filter_var($input['checkOnly'], FILTER_VALIDATE_BOOLEAN) : false);

if ($checkOnly) {
    echo json_encode([
        "status" => "active",
        "success" => true,
        "locked" => false,
        "lock_remaining_seconds" => 0
    ]);
    exit(0);
}

$envCode = getenv('CRM_ACCESS_CODE');
$validAccessCode = ($envCode && trim($envCode) !== '') ? trim($envCode) : 'Crown5002';
$cleanCode = trim((string)$code);

if ($cleanCode !== '' && $cleanCode === $validAccessCode) {
    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "success" => true
    ]);
} else {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "success" => false,
        "error" => "Incorrect access code. Please try again."
    ]);
}
exit(0);
