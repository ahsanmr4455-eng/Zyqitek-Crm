<?php
/**
 * Project Tracking API Endpoint
 * Handles GET (fetch tracking + revisions + reviews)
 * and POST (updates for tracking, adding revisions, submitting reviews)
 * InfinityFree PHP Compatible
 */
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$client_id = $_GET['client_id'] ?? '';

// Secure all admin operations, but allow clients to view their own tracking page using their client_id
$is_public_client_view = ($method === 'GET' && !empty($client_id));

if (!$is_public_client_view) {
    require_once __DIR__ . '/verify_session.php';
}

if ($method === 'GET') {
    $client_id = $_GET['client_id'] ?? '';
    if (empty($client_id)) {
        // Fetch all tracking records joined with clients
        try {
            $stmt = $db->query("
                SELECT t.*, c.name as client_name, c.company as client_company, u.fullName as assigned_member_name
                FROM project_tracking t
                JOIN clients c ON t.client_id = c.id
                LEFT JOIN users u ON c.assigned_team_member = u.id
                ORDER BY c.name ASC
            ");
            $records = $stmt->fetchAll();
            echo json_encode(["success" => true, "data" => $records]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "error" => $e->getMessage()]);
        }
        exit();
    }

    try {
        // Fetch client name and check if client exists
        $cStmt = $db->prepare("SELECT c.name, c.company, c.assigned_team_member, u.fullName as assigned_member_name 
                               FROM clients c 
                               LEFT JOIN users u ON c.assigned_team_member = u.id 
                               WHERE c.id = ? LIMIT 1");
        $cStmt->execute([$client_id]);
        $client = $cStmt->fetch();

        if (!$client) {
            http_response_code(404);
            echo json_encode(["success" => false, "error" => "Client not found"]);
            exit();
        }

        // Fetch tracking info
        $tStmt = $db->prepare("SELECT * FROM project_tracking WHERE client_id = ? LIMIT 1");
        $tStmt->execute([$client_id]);
        $tracking = $tStmt->fetch();

        // If tracking info doesn't exist, seed a default tracking row
        if (!$tracking) {
            $project_id = 'PRJ-' . strtoupper(substr($client_id, -6));
            $project_name = $client['company'] ? $client['company'] . " Project" : $client['name'] . " Project";
            
            $ins = $db->prepare("
                INSERT INTO project_tracking (
                    client_id, project_name, project_id, start_date, expected_delivery_date,
                    current_status, overall_progress, revisions_allowed, revisions_used,
                    delivery_status, last_updated, estimated_time_left
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $start_date = date('Y-m-d');
            $expected = date('Y-m-d', strtotime('+30 days'));
            $last_updated = date('Y-m-d H:i:s');
            
            $ins->execute([
                $client_id,
                $project_name,
                $project_id,
                $start_date,
                $expected,
                'Project Received',
                0,
                3,
                0,
                'Not Delivered',
                $last_updated,
                '30 days'
            ]);

            // Re-fetch
            $tStmt->execute([$client_id]);
            $tracking = $tStmt->fetch();
        }

        // Fetch revision history
        $revStmt = $db->prepare("SELECT * FROM project_revisions WHERE client_id = ? ORDER BY id DESC");
        $revStmt->execute([$client_id]);
        $revisions = $revStmt->fetchAll();

        // Fetch review if exists
        $revwStmt = $db->prepare("SELECT * FROM project_reviews WHERE client_id = ? LIMIT 1");
        $revwStmt->execute([$client_id]);
        $review = $revwStmt->fetch();

        echo json_encode([
            "success" => true,
            "tracking" => $tracking,
            "revisions" => $revisions,
            "review" => $review,
            "client" => [
                "name" => $client['name'],
                "company" => $client['company'],
                "assigned_member_name" => $client['assigned_member_name'] ?? 'Unassigned'
            ]
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
    exit();
}

if ($method === 'POST') {
    $input = getJsonInput();

    if ($action === 'add_revision') {
        $client_id = trim($input['client_id'] ?? '');
        $status = trim($input['status'] ?? 'Pending');
        $notes = trim($input['notes'] ?? '');
        $revision_date = trim($input['revision_date'] ?? date('Y-m-d H:i:s'));

        if (empty($client_id)) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Client ID is required"]);
            exit();
        }

        try {
            $db->beginTransaction();

            // Insert into project_revisions
            $stmt = $db->prepare("INSERT INTO project_revisions (client_id, revision_date, status, notes) VALUES (?, ?, ?, ?)");
            $stmt->execute([$client_id, $revision_date, $status, $notes]);

            // Increment revisions_used in project_tracking
            $upd = $db->prepare("UPDATE project_tracking SET revisions_used = revisions_used + 1, last_updated = ? WHERE client_id = ?");
            $upd->execute([date('Y-m-d H:i:s'), $client_id]);

            $db->commit();
            echo json_encode(["success" => true, "message" => "Revision history item added successfully"]);
        } catch (PDOException $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            http_response_code(500);
            echo json_encode(["success" => false, "error" => $e->getMessage()]);
        }
        exit();
    }

    if ($action === 'submit_review') {
        $client_id = trim($input['client_id'] ?? '');
        $rating = intval($input['rating'] ?? 5);
        $message = trim($input['message'] ?? '');
        $recommend = trim($input['recommend'] ?? 'Yes');

        if (empty($client_id)) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Client ID is required"]);
            exit();
        }

        try {
            // Portable check-and-upsert for project_reviews
            $chk = $db->prepare("SELECT 1 FROM project_reviews WHERE client_id = ? LIMIT 1");
            $chk->execute([$client_id]);
            if ($chk->fetch()) {
                $stmt = $db->prepare("UPDATE project_reviews SET rating = ?, message = ?, recommend = ? WHERE client_id = ?");
                $stmt->execute([$rating, $message, $recommend, $client_id]);
            } else {
                $stmt = $db->prepare("INSERT INTO project_reviews (client_id, rating, message, recommend) VALUES (?, ?, ?, ?)");
                $stmt->execute([$client_id, $rating, $message, $recommend]);
            }

            echo json_encode(["success" => true, "message" => "Review saved successfully"]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "error" => $e->getMessage()]);
        }
        exit();
    }

    // Default: Admin project tracking save/update
    $client_id = trim($input['client_id'] ?? '');
    $project_name = trim($input['project_name'] ?? '');
    $project_id = trim($input['project_id'] ?? '');
    $start_date = trim($input['start_date'] ?? '');
    $expected_delivery_date = trim($input['expected_delivery_date'] ?? '');
    $overall_progress = intval($input['overall_progress'] ?? 0);
    $revisions_allowed = intval($input['revisions_allowed'] ?? 3);
    $revisions_used = intval($input['revisions_used'] ?? 0);
    $delivery_status = trim($input['delivery_status'] ?? 'Not Delivered');
    $delivery_date = trim($input['delivery_date'] ?? '');
    $delivered_by = trim($input['delivered_by'] ?? '');
    $final_files = trim($input['final_files'] ?? '');
    $delivery_notes = trim($input['delivery_notes'] ?? '');
    $estimated_time_left = trim($input['estimated_time_left'] ?? '');

    // Force progress to be strictly within 0% -> 100%
    if ($overall_progress < 0) $overall_progress = 0;
    if ($overall_progress > 100) $overall_progress = 100;

    // Automatically change status based on progress and delivery_status
    if ($delivery_status === 'Delivered') {
        $current_status = 'Delivered';
    } else {
        if ($overall_progress === 0) {
            $current_status = 'Pending';
        } elseif ($overall_progress > 0 && $overall_progress < 100) {
            $current_status = 'In Progress';
        } elseif ($overall_progress === 100) {
            $current_status = 'Ready for Delivery';
        }
    }

    if (empty($client_id)) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Client ID is required"]);
        exit();
    }

    try {
        $last_updated = date('Y-m-d H:i:s');

        // Portable check-and-upsert for project_tracking
        $chk = $db->prepare("SELECT 1 FROM project_tracking WHERE client_id = ? LIMIT 1");
        $chk->execute([$client_id]);
        if ($chk->fetch()) {
            $stmt = $db->prepare("
                UPDATE project_tracking SET
                    project_name = ?,
                    project_id = ?,
                    start_date = ?,
                    expected_delivery_date = ?,
                    current_status = ?,
                    overall_progress = ?,
                    revisions_allowed = ?,
                    revisions_used = ?,
                    delivery_status = ?,
                    delivery_date = ?,
                    delivered_by = ?,
                    final_files = ?,
                    delivery_notes = ?,
                    last_updated = ?,
                    estimated_time_left = ?
                WHERE client_id = ?
            ");
            $stmt->execute([
                $project_name,
                $project_id,
                $start_date,
                $expected_delivery_date,
                $current_status,
                $overall_progress,
                $revisions_allowed,
                $revisions_used,
                $delivery_status,
                $delivery_date,
                $delivered_by,
                $final_files,
                $delivery_notes,
                $last_updated,
                $estimated_time_left,
                $client_id
            ]);
        } else {
            $stmt = $db->prepare("
                INSERT INTO project_tracking (
                    client_id, project_name, project_id, start_date, expected_delivery_date,
                    current_status, overall_progress, revisions_allowed, revisions_used,
                    delivery_status, delivery_date, delivered_by, final_files, delivery_notes,
                    last_updated, estimated_time_left
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $client_id,
                $project_name,
                $project_id,
                $start_date,
                $expected_delivery_date,
                $current_status,
                $overall_progress,
                $revisions_allowed,
                $revisions_used,
                $delivery_status,
                $delivery_date,
                $delivered_by,
                $final_files,
                $delivery_notes,
                $last_updated,
                $estimated_time_left
            ]);
        }

        // Automatically update client's project progress in clients table to keep things perfectly synchronized!
        $updClient = $db->prepare("UPDATE clients SET projectProgress = ? WHERE id = ?");
        $updClient->execute([$overall_progress, $client_id]);

        echo json_encode(["success" => true, "message" => "Project tracking updated successfully", "current_status" => $current_status]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
    exit();
}
