<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/verify_session.php';

$input = getJsonInput();

$id = $input['id'] ?? '';
$name = $input['name'] ?? '';
$email = $input['email'] ?? '';
$phone = $input['phone'] ?? '';
$company = $input['company'] ?? '';
$status = $input['status'] ?? 'New';
$value = floatval($input['value'] ?? 0);
$source = $input['source'] ?? 'Direct';
$category = $input['category'] ?? 'Other';
$notes = $input['notes'] ?? '';
$instagramLink = $input['instagramLink'] ?? null;
$facebookLink = $input['facebookLink'] ?? null;
$linkedinLink = $input['linkedinLink'] ?? null;
$websiteUrl = $input['websiteUrl'] ?? null;
$otherLink = $input['otherLink'] ?? null;
$smmPlatformName = $input['smmPlatformName'] ?? null;
$smmPlannedPosts = isset($input['smmPlannedPosts']) ? intval($input['smmPlannedPosts']) : 0;
$smmPostingFrequency = $input['smmPostingFrequency'] ?? null;
$smmContentNotes = $input['smmContentNotes'] ?? null;
$smmCampaignRequirements = $input['smmCampaignRequirements'] ?? null;
$assignedTeamMember = $input['assignedTeamMember'] ?? null;
$updatedAt = date('c');

if (empty($id)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Lead ID is required for update"]);
    exit();
}

try {
    $stmt = $db->prepare("UPDATE leads SET name = ?, email = ?, phone = ?, company = ?, status = ?, value = ?, source = ?, category = ?, notes = ?, instagramLink = ?, facebookLink = ?, linkedinLink = ?, websiteUrl = ?, otherLink = ?, smmPlatformName = ?, smmPlannedPosts = ?, smmPostingFrequency = ?, smmContentNotes = ?, smmCampaignRequirements = ?, assignedTeamMember = ?, updatedAt = ? WHERE id = ?");
    $stmt->execute([
        $name,
        $email,
        $phone,
        $company,
        $status,
        $value,
        $source,
        $category,
        $notes,
        $instagramLink,
        $facebookLink,
        $linkedinLink,
        $websiteUrl,
        $otherLink,
        $smmPlatformName,
        $smmPlannedPosts,
        $smmPostingFrequency,
        $smmContentNotes,
        $smmCampaignRequirements,
        $assignedTeamMember,
        $updatedAt,
        $id
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Lead updated successfully",
        "lead" => [
            "id" => $id,
            "name" => $name,
            "email" => $email,
            "phone" => $phone,
            "company" => $company,
            "status" => $status,
            "value" => $value,
            "source" => $source,
            "category" => $category,
            "notes" => $notes,
            "instagramLink" => $instagramLink,
            "facebookLink" => $facebookLink,
            "linkedinLink" => $linkedinLink,
            "websiteUrl" => $websiteUrl,
            "otherLink" => $otherLink,
            "smmPlatformName" => $smmPlatformName,
            "smmPlannedPosts" => $smmPlannedPosts,
            "smmPostingFrequency" => $smmPostingFrequency,
            "smmContentNotes" => $smmContentNotes,
            "smmCampaignRequirements" => $smmCampaignRequirements,
            "assignedTeamMember" => $assignedTeamMember,
            "updatedAt" => $updatedAt
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Failed to update lead: " . $e->getMessage()]);
}
