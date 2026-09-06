<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/verify_session.php';

$input = getJsonInput();
$id = $input['id'] ?? ($_GET['id'] ?? '');
$ids = $input['ids'] ?? [];

if (empty($id) && empty($ids)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Client ID or IDs are required for deletion"]);
    exit();
}

try {
    if (!empty($ids)) {
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $db->prepare("DELETE FROM clients WHERE id IN ($placeholders)");
        $stmt->execute($ids);
        
        echo json_encode([
            "success" => true,
            "message" => "Clients deleted successfully in bulk",
            "ids" => $ids
        ]);
    } else {
        $stmt = $db->prepare("DELETE FROM clients WHERE id = ?");
        $stmt->execute([$id]);

        echo json_encode([
            "success" => true,
            "message" => "Client deleted successfully",
            "id" => $id
        ]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Failed to delete client: " . $e->getMessage()]);
}
