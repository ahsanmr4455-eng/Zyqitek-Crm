<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/verify_session.php';

$input = getJsonInput();

$id = $input['id'] ?? ('call-' . round(microtime(true) * 1000));
$leadId = $input['leadId'] ?? '';
$leadName = $input['leadName'] ?? '';
$duration = intval($input['duration'] ?? 0);
$status = $input['status'] ?? 'Completed';
$notes = $input['notes'] ?? '';
$timestamp = $input['timestamp'] ?? date('c');

try {
    $stmt = $db->prepare("INSERT INTO call_history (id, leadId, leadName, duration, status, notes, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $id,
        $leadId,
        $leadName,
        $duration,
        $status,
        $notes,
        $timestamp
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Call logged successfully",
        "call" => [
            "id" => $id,
            "leadId" => $leadId,
            "leadName" => $leadName,
            "duration" => $duration,
            "status" => $status,
            "notes" => $notes,
            "timestamp" => $timestamp
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Failed to add call: " . $e->getMessage()]);
}
