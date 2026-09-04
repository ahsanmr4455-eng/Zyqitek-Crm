<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/verify_session.php';

try {
    $stmt = $db->query("SELECT id, username, role, fullName FROM users ORDER BY username ASC");
    $users = $stmt->fetchAll();
    echo json_encode($users);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Failed to retrieve users: " . $e->getMessage()]);
}
