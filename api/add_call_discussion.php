<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/verify_session.php';

$input = getJsonInput();
if (empty($input)) {
    $input = $_POST;
}

$id = isset($input['id']) ? trim($input['id']) : null;
$clientName = trim($input['clientName'] ?? '');
$callDate = trim($input['callDate'] ?? '');
$duration = trim($input['duration'] ?? '');
$summary = trim($input['summary'] ?? '') ?: null;
$requirements = trim($input['requirements'] ?? '') ?: null;
$followUpActions = trim($input['followUpActions'] ?? '') ?: null;
$notes = trim($input['notes'] ?? '') ?: null;
$status = trim($input['status'] ?? 'Connected');
$clientService = trim($input['clientService'] ?? '') ?: null;

if (empty($clientName) || empty($duration)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Client Name and Duration are required"]);
    exit();
}

if (empty($callDate)) {
    $callDate = date('Y-m-d H:i:s');
}

try {
    if (!empty($id)) {
        // Update existing record
        $stmt = $db->prepare("
            UPDATE call_discussions 
            SET clientName = ?, callDate = ?, duration = ?, summary = ?, requirements = ?, followUpActions = ?, notes = ?, status = ?, clientService = ? 
            WHERE id = ?
        ");
        $stmt->execute([
            $clientName,
            $callDate,
            $duration,
            $summary,
            $requirements,
            $followUpActions,
            $notes,
            $status,
            $clientService,
            $id
        ]);
        
        $savedDisc = [
            "id" => $id,
            "clientName" => $clientName,
            "callDate" => $callDate,
            "duration" => $duration,
            "summary" => $summary,
            "requirements" => $requirements,
            "followUpActions" => $followUpActions,
            "notes" => $notes,
            "status" => $status,
            "clientService" => $clientService
        ];
        
        echo json_encode([
            "success" => true,
            "message" => "Call discussion updated successfully.",
            "callDiscussion" => $savedDisc,
            "discussion" => $savedDisc
        ]);
    } else {
        // Insert new record
        $newId = "disc-call-" . time() . "-" . rand(100, 999);
        $stmt = $db->prepare("
            INSERT INTO call_discussions (id, clientName, callDate, duration, summary, requirements, followUpActions, notes, status, clientService) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $newId,
            $clientName,
            $callDate,
            $duration,
            $summary,
            $requirements,
            $followUpActions,
            $notes,
            $status,
            $clientService
        ]);
        
        $savedDisc = [
            "id" => $newId,
            "clientName" => $clientName,
            "callDate" => $callDate,
            "duration" => $duration,
            "summary" => $summary,
            "requirements" => $requirements,
            "followUpActions" => $followUpActions,
            "notes" => $notes,
            "status" => $status,
            "clientService" => $clientService
        ];
        
        echo json_encode([
            "success" => true,
            "message" => "Call discussion created successfully.",
            "callDiscussion" => $savedDisc,
            "discussion" => $savedDisc
        ]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Database error: " . $e->getMessage()]);
}
