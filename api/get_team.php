<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/verify_session.php';

try {
    $stmt = $db->query("SELECT * FROM users WHERE deletedAt IS NULL AND fullName IS NOT NULL ORDER BY fullName ASC");
    $team = $stmt->fetchAll();
    echo json_encode($team);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Failed to retrieve team members: " . $e->getMessage()]);
}
