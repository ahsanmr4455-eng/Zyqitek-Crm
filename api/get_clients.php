<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/verify_session.php';

try {
    $stmt = $db->query("SELECT * FROM clients ORDER BY company ASC");
    $clients = $stmt->fetchAll();
    echo json_encode($clients);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Failed to retrieve clients: " . $e->getMessage()]);
}
