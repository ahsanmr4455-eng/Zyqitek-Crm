<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/verify_session.php';

$input = getJsonInput();

$id = $input['id'] ?? '';
$fullName = $input['fullName'] ?? '';
$role = $input['role'] ?? '';
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

$username = $input['username'] ?? '';
$password = $input['password'] ?? '';

if (empty($id)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Team member ID is required for update"]);
    exit();
}

try {
    $sql = "UPDATE users SET 
                fullName = ?, 
                role = ?, 
                whatsapp = ?, 
                email = ?, 
                facebookLink = ?, 
                instagramLink = ?, 
                portfolioLink = ?, 
                linkedinLink = ?,
                customLinks = ?,
                assignedProjectName = ?, 
                clientName = ?, 
                projectStatus = ?, 
                projectDeadline = ?, 
                projectProgress = ?, 
                notes = ?";
    $params = [
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
        $notes
    ];

    if (!empty($username)) {
        $sql .= ", username = ?";
        $params[] = $username;
    }
    if (!empty($password)) {
        $sql .= ", password = ?";
        $params[] = password_hash($password, PASSWORD_DEFAULT);
    }

    $sql .= " WHERE id = ?";
    $params[] = $id;

    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    echo json_encode([
        "success" => true,
        "message" => "Team member updated successfully"
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Failed to update team member: " . $e->getMessage()]);
}
