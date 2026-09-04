<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/verify_session.php';

$input = getJsonInput();

$id = $input['id'] ?? ($_GET['id'] ?? '');
$amount = isset($input['amount']) ? floatval($input['amount']) : null;

if (empty($id)) {
    http_response_code(400);
    echo json_encode(["success" => false, "error" => "Goal ID is required"]);
    exit();
}

try {
    if ($amount !== null) {
        // Increment progress operation
        $stmt = $db->prepare("UPDATE goals SET current = current + ? WHERE id = ?");
        $stmt->execute([$amount, $id]);
        
        echo json_encode([
            "success" => true,
            "message" => "Goal progress incremented successfully",
            "id" => $id,
            "increment" => $amount
        ]);
    } else {
        // Regular update operation
        $title = $input['title'] ?? '';
        $category = $input['category'] ?? 'General';
        $current = floatval($input['current'] ?? 0);
        $target = floatval($input['target'] ?? 0);
        $unit = $input['unit'] ?? '';
        $deadline = $input['deadline'] ?? '';

        $stmt = $db->prepare("UPDATE goals SET title = ?, category = ?, current = ?, target = ?, unit = ?, deadline = ? WHERE id = ?");
        $stmt->execute([
            $title,
            $category,
            $current,
            $target,
            $unit,
            $deadline,
            $id
        ]);

        echo json_encode([
            "success" => true,
            "message" => "Goal updated successfully"
        ]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Failed to update goal: " . $e->getMessage()]);
}
