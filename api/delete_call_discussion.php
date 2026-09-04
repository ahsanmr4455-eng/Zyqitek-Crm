<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/verify_session.php';

$input = getJsonInput();
$id = isset($input['id']) ? trim($input['id']) : (isset($_GET['id']) ? trim($_GET['id']) : null);

if (empty($id)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Discussion ID is required for deletion"]);
    exit();
}

try {
    $stmt = $db->prepare("DELETE FROM call_discussions WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(["success" => true, "message" => "Call discussion deleted successfully", "id" => $id]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Database error: " . $e->getMessage()]);
}
