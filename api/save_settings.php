<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/verify_session.php';

$input = getJsonInput();

$portalUrl = $input['portal_url'] ?? '';
$previewUrl = $input['preview_url'] ?? '';
$redirectUrl = $input['redirect_url'] ?? '';

try {
    $db->beginTransaction();
    
    if (!empty($portalUrl)) {
        $stmt = $db->prepare("REPLACE INTO settings (setting_key, setting_value) VALUES (?, ?)");
        $stmt->execute(['portal_url', $portalUrl]);
    }
    
    if (!empty($previewUrl)) {
        $stmt = $db->prepare("REPLACE INTO settings (setting_key, setting_value) VALUES (?, ?)");
        $stmt->execute(['preview_url', $previewUrl]);
    }

    if (!empty($redirectUrl)) {
        $stmt = $db->prepare("REPLACE INTO settings (setting_key, setting_value) VALUES (?, ?)");
        $stmt->execute(['redirect_url', $redirectUrl]);
    }
    
    $db->commit();
    echo json_encode(["success" => true, "message" => "Settings saved successfully"]);
} catch (PDOException $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Failed to save settings: " . $e->getMessage()]);
}

