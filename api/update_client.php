<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/verify_session.php';

$input = getJsonInput();

$id = $input['id'] ?? '';
$name = $input['name'] ?? '';
$email = $input['email'] ?? '';
$phone = $input['phone'] ?? '';
$company = $input['company'] ?? '';
$activeProjects = intval($input['activeProjects'] ?? 0);
$totalValue = floatval($input['totalValue'] ?? 0);
$status = $input['status'] ?? 'Active';
$projectProgress = intval($input['projectProgress'] ?? 0);
$serviceType = $input['serviceType'] ?? 'Other';
$notes = $input['notes'] ?? '';
$customLinks = $input['customLinks'] ?? '';

if (empty($id)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Client ID is required for update"]);
    exit();
}

try {
    $stmt = $db->prepare("UPDATE clients SET name = ?, email = ?, phone = ?, company = ?, activeProjects = ?, totalValue = ?, status = ?, projectProgress = ?, serviceType = ?, notes = ?, customLinks = ? WHERE id = ?");
    $stmt->execute([
        $name,
        $email,
        $phone,
        $company,
        $activeProjects,
        $totalValue,
        $status,
        $projectProgress,
        $serviceType,
        $notes,
        $customLinks,
        $id
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Client updated successfully"
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Failed to update client: " . $e->getMessage()]);
}
