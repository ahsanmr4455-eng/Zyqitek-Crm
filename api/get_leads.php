<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/verify_session.php';

try {
    $stmt = $db->query("SELECT * FROM leads WHERE deletedAt IS NULL ORDER BY createdAt DESC");
    $leads = $stmt->fetchAll();
    echo json_encode($leads);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Failed to retrieve leads: " . $e->getMessage()]);
}
