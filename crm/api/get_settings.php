<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/verify_session.php';

try {
    $stmt = $db->query("SELECT * FROM settings");
    $rows = $stmt->fetchAll();
    
    $settings = [];
    foreach ($rows as $row) {
        $settings[$row['setting_key']] = $row['setting_value'];
    }
    
    // Provide defaults if empty
    if (!isset($settings['portal_url'])) {
        $settings['portal_url'] = 'https://dash.infinityfree.com/accounts';
    }
    if (!isset($settings['preview_url'])) {
        $settings['preview_url'] = 'https://zyqrodigi.site.je';
    }
    if (!isset($settings['redirect_url'])) {
        $settings['redirect_url'] = 'https://zyqrodigi.site.je/thank-you';
    }
    
    echo json_encode($settings);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Failed to retrieve settings: " . $e->getMessage()]);
}
