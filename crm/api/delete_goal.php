<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/verify_session.php';

$input = getJsonInput();
$id = $input['id'] ?? ($_GET['id'] ?? '');

if (empty($id)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Goal ID is required for deletion"]);
    exit();
}

try {
    $stmt = $db->prepare("DELETE FROM goals WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode([
        "success" => true,
        "message" => "Goal deleted successfully",
        "id" => $id
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Failed to delete goal: " . $e->getMessage()]);
}
