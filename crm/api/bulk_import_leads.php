<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/verify_session.php';

$input = getJsonInput();
$leads = $input['leads'] ?? [];

if (!is_array($leads)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Leads must be an array"]);
    exit();
}

$imported = 0;
$failed = 0;
$duplicates = 0;
$total = count($leads);

try {
    $db->beginTransaction();

    // Fetch existing emails and phones
    $existingQuery = $db->query("SELECT email, phone FROM leads");
    $existingRows = $existingQuery->fetchAll(PDO::FETCH_ASSOC);

    $existingEmails = [];
    $existingPhones = [];
    foreach ($existingRows as $row) {
        if (!empty($row['email'])) {
            $existingEmails[strtolower(trim($row['email']))] = true;
        }
        if (!empty($row['phone'])) {
            $existingPhones[trim($row['phone'])] = true;
        }
    }

    $batchEmails = [];
    $batchPhones = [];

    $stmt = $db->prepare("INSERT INTO leads (
        id, name, email, phone, company, status, value, source, category, notes, country, createdAt, updatedAt,
        instagramLink, facebookLink, linkedinLink, websiteUrl, otherLink,
        smmPlatformName, smmPlannedPosts, smmPostingFrequency, smmContentNotes, smmCampaignRequirements
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

    foreach ($leads as $item) {
        $name = trim($item['name'] ?? '');
        if (empty($name)) {
            $failed++;
            continue;
        }

        $email = strtolower(trim($item['email'] ?? ''));
        $phone = trim($item['phone'] ?? '');

        $isDuplicate = 
            (!empty($email) && isset($existingEmails[$email])) ||
            (!empty($phone) && isset($existingPhones[$phone])) ||
            (!empty($email) && isset($batchEmails[$email])) ||
            (!empty($phone) && isset($batchPhones[$phone]));

        if ($isDuplicate) {
            $duplicates++;
            continue;
        }

        $id = 'lead-' . round(microtime(true) * 1000) . '-' . uniqid();
        $createdAt = $item['createdAt'] ?? date('c');
        $updatedAt = date('c');

        $stmt->execute([
            $id,
            $name,
            !empty($email) ? $email : null,
            !empty($phone) ? $phone : null,
            $item['company'] ?? '',
            $item['status'] ?? 'New',
            floatval($item['value'] ?? 0),
            $item['source'] ?? 'CSV Import',
            $item['category'] ?? 'Other',
            $item['notes'] ?? 'Imported via CSV file.',
            $item['country'] ?? '',
            $createdAt,
            $updatedAt,
            $item['instagramLink'] ?? '',
            $item['facebookLink'] ?? '',
            $item['linkedinLink'] ?? '',
            $item['websiteUrl'] ?? '',
            $item['otherLink'] ?? '',
            $item['smmPlatformName'] ?? '',
            intval($item['smmPlannedPosts'] ?? 0),
            $item['smmPostingFrequency'] ?? '',
            $item['smmContentNotes'] ?? '',
            $item['smmCampaignRequirements'] ?? ''
        ]);

        $imported++;
        if (!empty($email)) $batchEmails[$email] = true;
        if (!empty($phone)) $batchPhones[$phone] = true;
    }

    $db->commit();
    echo json_encode([
        "success" => true,
        "total" => $total,
        "imported" => $imported,
        "failed" => $failed,
        "duplicates" => $duplicates
    ]);

} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Failed to import leads: " . $e->getMessage()]);
}
