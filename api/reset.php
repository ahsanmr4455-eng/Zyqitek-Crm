<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/verify_session.php';

// Secure check: Only admins can perform database resets
if (($_SESSION['role'] ?? '') !== 'admin') {
    http_response_code(403);
    echo json_encode(["success" => false, "error" => "Access denied. Administrator privileges required."]);
    exit();
}

try {
    $db->beginTransaction();

    // 1. Clear tables (DELETE FROM is compatible with both MySQL and SQLite)
    $db->exec("DELETE FROM leads");
    $db->exec("DELETE FROM clients");
    $db->exec("DELETE FROM call_history");
    $db->exec("DELETE FROM users WHERE id LIKE 'member-%' OR id LIKE 'team-%'");
    $db->exec("DELETE FROM goals");
    $db->exec("DELETE FROM settings");

    // 2. Re-seed default settings (REPLACE INTO is portable)
    $stmt = $db->prepare("REPLACE INTO settings (setting_key, setting_value) VALUES (?, ?)");
    $stmt->execute(['portal_url', 'https://dash.infinityfree.com/accounts']);
    $stmt->execute(['preview_url', 'https://zyqrodigi.site.je']);

    // 3. Re-seed default goals
    $stmtGoal = $db->prepare("INSERT INTO goals (id, title, category, current, target, unit, deadline) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmtGoal->execute(['1', 'Revenue Target', 'Financial', 0, 20000, '$', 'June 30, 2026']);
    $stmtGoal->execute(['2', 'Leads Target', 'Marketing', 0, 10, 'leads', 'June 30, 2026']);
    $stmtGoal->execute(['3', 'Onboarded Clients', 'Operations', 0, 5, 'clients', 'June 30, 2026']);

    $db->commit();
    echo json_encode(["success" => true, "message" => "Database reset to clean default seeds successfully."]);
} catch (PDOException $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Database reset failed: " . $e->getMessage()]);
}

