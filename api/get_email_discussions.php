<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/verify_session.php';

try {
    $stmt = $db->query("SELECT * FROM email_discussions ORDER BY date DESC");
    $discussions = $stmt->fetchAll();
    echo json_encode($discussions);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Failed to retrieve email discussions: " . $e->getMessage()]);
}
