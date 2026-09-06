<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/verify_session.php';

$input = getJsonInput();

$id = $input['id'] ?? ('goal-' . round(microtime(true) * 1000));
$title = $input['title'] ?? '';
$category = $input['category'] ?? 'General';
$current = floatval($input['current'] ?? 0);
$target = floatval($input['target'] ?? 0);
$unit = $input['unit'] ?? '';
$deadline = $input['deadline'] ?? '';

if (empty($title)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Goal title is required"]);
    exit();
}

try {
    $stmt = $db->prepare("INSERT INTO goals (id, title, category, current, target, unit, deadline) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $id,
        $title,
        $category,
        $current,
        $target,
        $unit,
        $deadline
    ]);

    echo json_encode([
        "success" => true,
        "message" => "Goal created successfully",
        "goal" => [
            "id" => $id,
            "title" => $title,
            "category" => $category,
            "current" => $current,
            "target" => $target,
            "unit" => $unit,
            "deadline" => $deadline
        ]
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Failed to create goal: " . $e->getMessage()]);
}
