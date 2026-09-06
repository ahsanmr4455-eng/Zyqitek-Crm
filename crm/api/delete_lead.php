<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/verify_session.php';

$input = getJsonInput();
$id = $input['id'] ?? ($_GET['id'] ?? '');
$ids = $input['ids'] ?? [];

if (empty($id) && empty($ids)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Lead ID or IDs are required for deletion"]);
    exit();
}

$now_str = date('c');

try {
    if (!empty($ids)) {
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $db->prepare("UPDATE leads SET deletedAt = ? WHERE id IN ($placeholders)");
        $params = array_merge([$now_str], $ids);
        $stmt->execute($params);
        
        echo json_encode([
            "success" => true,
            "message" => "Leads soft deleted successfully in bulk",
            "ids" => $ids
        ]);
    } else {
        $stmt = $db->prepare("UPDATE leads SET deletedAt = ? WHERE id = ?");
        $stmt->execute([$now_str, $id]);

        echo json_encode([
            "success" => true,
            "message" => "Lead soft deleted successfully",
            "id" => $id
        ]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Failed to delete lead: " . $e->getMessage()]);
}

