<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/verify_session.php';

try {
    $stmt = $db->query("SELECT * FROM goals ORDER BY id ASC");
    $goals = $stmt->fetchAll();
    echo json_encode($goals);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Failed to retrieve goals: " . $e->getMessage()]);
}
