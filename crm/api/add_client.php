<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/verify_session.php';

$input = getJsonInput();

$id = $input['id'] ?? ('client-' . round(microtime(true) * 1000));
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

if (empty($company)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Client company is required"]);
    exit();
}

try {
    $stmt = $db->prepare("INSERT INTO clients (id, name, email, phone, company, activeProjects, totalValue, status, projectProgress, serviceType, notes, customLinks) 
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $id,
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
        $customLinks
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Client added successfully",
        "client" => [
            "id" => $id,
            "name" => $name,
            "email" => $email,
            "phone" => $phone,
            "company" => $company,
            "activeProjects" => $activeProjects,
            "totalValue" => $totalValue,
            "status" => $status,
            "projectProgress" => $projectProgress,
            "serviceType" => $serviceType,
            "notes" => $notes
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Failed to add client: " . $e->getMessage()]);
}
