<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/verify_session.php';

try {
    $stmt = $db->query("SELECT * FROM call_history ORDER BY timestamp DESC");
    $calls = $stmt->fetchAll();
    echo json_encode($calls);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Failed to retrieve calls: " . $e->getMessage()]);
}
