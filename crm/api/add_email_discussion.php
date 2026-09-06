<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/verify_session.php';

$input = getJsonInput();
if (empty($input)) {
    $input = $_POST;
}

$id = isset($input['id']) ? trim($input['id']) : null;
$clientName = trim($input['clientName'] ?? '');
$subject = trim($input['subject'] ?? '');
$date = trim($input['date'] ?? '');
$direction = trim($input['direction'] ?? 'Sent');
$content = trim($input['content'] ?? '') ?: null;
$notes = trim($input['notes'] ?? '') ?: null;
$followUpStatus = trim($input['followUpStatus'] ?? 'None');
$attachments = trim($input['attachments'] ?? '') ?: null;
$clientService = trim($input['clientService'] ?? '') ?: null;

if (empty($clientName) || empty($subject)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Client Name and Subject are required"]);
    exit();
}

if (empty($date)) {
    $date = date('Y-m-d H:i:s');
}

try {
    if (!empty($id)) {
        // Update existing record
        $stmt = $db->prepare("
            UPDATE email_discussions 
            SET clientName = ?, subject = ?, date = ?, direction = ?, content = ?, notes = ?, followUpStatus = ?, attachments = ?, clientService = ? 
            WHERE id = ?
        ");
        $stmt->execute([
            $clientName,
            $subject,
            $date,
            $direction,
            $content,
            $notes,
            $followUpStatus,
            $attachments,
            $clientService,
            $id
        ]);
        
        $savedDisc = [
            "id" => $id,
            "clientName" => $clientName,
            "subject" => $subject,
            "date" => $date,
            "direction" => $direction,
            "content" => $content,
            "notes" => $notes,
            "followUpStatus" => $followUpStatus,
            "attachments" => $attachments,
            "clientService" => $clientService
        ];
        
        echo json_encode([
            "success" => true,
            "message" => "Email discussion updated successfully.",
            "emailDiscussion" => $savedDisc,
            "discussion" => $savedDisc
        ]);
    } else {
        // Insert new record
        $newId = "disc-email-" . time() . "-" . rand(100, 999);
        $stmt = $db->prepare("
            INSERT INTO email_discussions (id, clientName, subject, date, direction, content, notes, followUpStatus, attachments, clientService) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $newId,
            $clientName,
            $subject,
            $date,
            $direction,
            $content,
            $notes,
            $followUpStatus,
            $attachments,
            $clientService
        ]);
        
        $savedDisc = [
            "id" => $newId,
            "clientName" => $clientName,
            "subject" => $subject,
            "date" => $date,
            "direction" => $direction,
            "content" => $content,
            "notes" => $notes,
            "followUpStatus" => $followUpStatus,
            "attachments" => $attachments,
            "clientService" => $clientService
        ];
        
        echo json_encode([
            "success" => true,
            "message" => "Email discussion created successfully.",
            "emailDiscussion" => $savedDisc,
            "discussion" => $savedDisc
        ]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Database error: " . $e->getMessage()]);
}
