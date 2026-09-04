<?php
/**
 * Unified Web Responses API endpoint (supports CRUD operations)
 * InfinityFree PHP Compatible
 */
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

// Secure all operations EXCEPT public contact form submission POST
if ($method !== 'POST') {
    require_once __DIR__ . '/verify_session.php';
}

// Handle different request methods
switch ($method) {
    case 'GET':
        // Fetch web responses
        if (isset($_GET['id'])) {
            try {
                $stmt = $db->prepare("SELECT * FROM web_responses WHERE id = ? LIMIT 1");
                $stmt->execute([$_GET['id']]);
                $response = $stmt->fetch();
                if ($response) {
                    echo json_encode(["success" => true, "data" => $response]);
                } else {
                    http_response_code(404);
                    echo json_encode(["success" => false, "error" => "Submission response not found"]);
                }
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(["success" => false, "error" => "Database error: " . $e->getMessage()]);
            }
        } else {
            try {
                $stmt = $db->query("SELECT * FROM web_responses ORDER BY created_at DESC");
                $responses = $stmt->fetchAll();
                echo json_encode(["success" => true, "data" => $responses]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(["success" => false, "error" => "Database error: " . $e->getMessage()]);
            }
        }
        break;

    case 'POST':
        // Insert a new web response or update status
        $input = getJsonInput();
        if (empty($input)) {
            $input = $_POST;
        }

        $id = isset($input['id']) ? intval($input['id']) : null;
        $status = trim($input['status'] ?? 'Unread');

        $is_update = !empty($id);

        if ($is_update) {
            // Update status (e.g. mark as Read, Contacted)
            try {
                $stmt = $db->prepare("UPDATE web_responses SET status = ? WHERE id = ?");
                $stmt->execute([$status, $id]);
                echo json_encode(["success" => true, "message" => "Web response updated successfully", "id" => $id]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(["success" => false, "error" => "Update failed: " . $e->getMessage()]);
            }
        } else {
            // New web response insert (usually from contact forms)
            $name = trim($input['name'] ?? '');
            $email = trim($input['email'] ?? '') ?: null;
            $phone = trim($input['phone'] ?? '') ?: null;
            $message = trim($input['message'] ?? '') ?: null;
            $source_page = trim($input['source_page'] ?? $input['sourcePage'] ?? '') ?: null;

            if (empty($name)) {
                http_response_code(400);
                echo json_encode(["success" => false, "error" => "Name field is required"]);
                exit();
            }

            try {
                $stmt = $db->prepare("
                    INSERT INTO web_responses (name, email, phone, message, source_page, status) 
                    VALUES (?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([$name, $email, $phone, $message, $source_page, 'Unread']);
                $new_id = $db->lastInsertId();
                echo json_encode(["success" => true, "message" => "Web response submitted successfully", "id" => $new_id]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(["success" => false, "error" => "Submission failed: " . $e->getMessage()]);
            }
        }
        break;

    case 'PUT':
        // Handle status update via PUT
        $input = getJsonInput();
        $id = isset($input['id']) ? intval($input['id']) : null;
        $status = trim($input['status'] ?? 'Read');

        if (empty($id)) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Web response ID is required for status updates"]);
            exit();
        }

        try {
            $stmt = $db->prepare("UPDATE web_responses SET status = ? WHERE id = ?");
            $stmt->execute([$status, $id]);
            echo json_encode(["success" => true, "message" => "Web response status updated successfully", "id" => $id]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "error" => "Update failed: " . $e->getMessage()]);
        }
        break;

    case 'DELETE':
        // Delete a web response
        $input = getJsonInput();
        $id = isset($input['id']) ? intval($input['id']) : (isset($_GET['id']) ? intval($_GET['id']) : null);

        if (empty($id)) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Web response ID is required for deletion"]);
            exit();
        }

        try {
            $stmt = $db->prepare("DELETE FROM web_responses WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(["success" => true, "message" => "Web response deleted successfully", "id" => $id]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "error" => "Deletion failed: " . $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["success" => false, "error" => "Method not allowed"]);
        break;
}
