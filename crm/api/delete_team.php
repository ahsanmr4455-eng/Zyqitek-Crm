<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/verify_session.php';

$input = getJsonInput();
$id = $input['id'] ?? ($_GET['id'] ?? '');
$ids = $input['ids'] ?? [];

if (empty($id) && empty($ids)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Team member ID or IDs are required for deletion"]);
    exit();
}

try {
    $now = date('c');
    if (!empty($ids)) {
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $db->prepare("UPDATE users SET deletedAt = ? WHERE id IN ($placeholders)");
        $stmt->execute(array_merge([$now], $ids));
        
        echo json_encode([
            "success" => true,
            "message" => "Team members deleted successfully in bulk",
            "ids" => $ids
        ]);
    } else {
        $stmt = $db->prepare("UPDATE users SET deletedAt = ? WHERE id = ?");
        $stmt->execute([$now, $id]);

        echo json_encode([
            "success" => true,
            "message" => "Team member deleted successfully",
            "id" => $id
        ]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Failed to delete team member: " . $e->getMessage()]);
}
