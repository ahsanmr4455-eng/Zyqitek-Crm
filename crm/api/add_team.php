<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/verify_session.php';

$input = getJsonInput();

$id = $input['id'] ?? ('member-' . round(microtime(true) * 1000));
$fullName = $input['fullName'] ?? '';
$role = $input['role'] ?? 'Specialist';
$whatsapp = $input['whatsapp'] ?? '';
$email = $input['email'] ?? '';
$facebookLink = $input['facebookLink'] ?? '';
$instagramLink = $input['instagramLink'] ?? '';
$portfolioLink = $input['portfolioLink'] ?? '';
$linkedinLink = $input['linkedinLink'] ?? '';
$customLinks = $input['customLinks'] ?? '';
$assignedProjectName = $input['assignedProjectName'] ?? '';
$clientName = $input['clientName'] ?? '';
$projectStatus = $input['projectStatus'] ?? 'Unassigned';
$projectDeadline = $input['projectDeadline'] ?? '';
$projectProgress = intval($input['projectProgress'] ?? 0);
$notes = $input['notes'] ?? '';
$createdAt = $input['createdAt'] ?? date('c');

$username = $input['username'] ?? '';
$password = $input['password'] ?? '';

if (empty($fullName)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Team member full name is required"]);
    exit();
}

// Ensure every user has a non-null username and password for real authentication
if (empty($username)) {
    $username = strtolower(preg_replace('/[^A-Za-z0-9]/', '', $fullName)) . rand(10, 99);
}
if (empty($password)) {
    $password = 'digital97@-'; // default safe password
}
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

try {
    $stmt = $db->prepare("INSERT INTO users (id, username, password, fullName, role, whatsapp, email, facebookLink, instagramLink, portfolioLink, linkedinLink, customLinks, assignedProjectName, clientName, projectStatus, projectDeadline, projectProgress, notes, createdAt) 
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $id,
        $username,
        $hashedPassword,
        $fullName,
        $role,
        $whatsapp,
        $email,
        $facebookLink,
        $instagramLink,
        $portfolioLink,
        $linkedinLink,
        $customLinks,
        $assignedProjectName,
        $clientName,
        $projectStatus,
        $projectDeadline,
        $projectProgress,
        $notes,
        $createdAt
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Team member added successfully",
        "member" => [
            "id" => $id,
            "fullName" => $fullName,
            "role" => $role,
            "email" => $email,
            "createdAt" => $createdAt
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Failed to add team member: " . $e->getMessage()]);
}
