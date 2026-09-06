<?php
/**
 * Unified Discussions API endpoint (supports full CRUD: GET, POST, PUT, DELETE)
 * InfinityFree PHP Compatible
 */
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/verify_session.php';

$method = $_SERVER['REQUEST_METHOD'];

// Handle different request methods
switch ($method) {
    case 'GET':
        // Fetch discussions
        if (isset($_GET['id'])) {
            try {
                $stmt = $db->prepare("
                    SELECT d.*, c.name as client_name, c.company as client_company 
                    FROM discussions d 
                    JOIN clients c ON d.client_id = c.id 
                    WHERE d.id = ? 
                    LIMIT 1
                ");
                $stmt->execute([$_GET['id']]);
                $discussion = $stmt->fetch();
                if ($discussion) {
                    echo json_encode(["success" => true, "data" => $discussion]);
                } else {
                    http_response_code(404);
                    echo json_encode(["success" => false, "error" => "Discussion not found"]);
                }
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(["success" => false, "error" => "Database error: " . $e->getMessage()]);
            }
        } elseif (isset($_GET['client_id'])) {
            try {
                $stmt = $db->prepare("
                    SELECT d.*, c.name as client_name, c.company as client_company 
                    FROM discussions d 
                    JOIN clients c ON d.client_id = c.id 
                    WHERE d.client_id = ? 
                    ORDER BY d.created_at DESC
                ");
                $stmt->execute([$_GET['client_id']]);
                $discussions = $stmt->fetchAll();
                echo json_encode(["success" => true, "data" => $discussions]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(["success" => false, "error" => "Database error: " . $e->getMessage()]);
            }
        } else {
            try {
                $stmt = $db->query("
                    SELECT d.*, c.name as client_name, c.company as client_company 
                    FROM discussions d 
                    JOIN clients c ON d.client_id = c.id 
                    ORDER BY d.created_at DESC
                ");
                $discussions = $stmt->fetchAll();
                echo json_encode(["success" => true, "data" => $discussions]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(["success" => false, "error" => "Database error: " . $e->getMessage()]);
            }
        }
        break;

    case 'POST':
        // Insert or Update Discussion
        $input = getJsonInput();
        if (empty($input)) {
            $input = $_POST;
        }

        $id = isset($input['id']) ? intval($input['id']) : null;
        $client_id = trim($input['client_id'] ?? '');
        $title = trim($input['title'] ?? '');
        $content = trim($input['content'] ?? '') ?: null;

        $is_update = !empty($id);

        if (empty($client_id) || empty($title)) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Client ID and Title are required"]);
            exit();
        }

        if ($is_update) {
            // Perform Update
            try {
                $stmt = $db->prepare("UPDATE discussions SET client_id = ?, title = ?, content = ? WHERE id = ?");
                $stmt->execute([$client_id, $title, $content, $id]);
                echo json_encode(["success" => true, "message" => "Discussion updated successfully", "id" => $id]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(["success" => false, "error" => "Update failed: " . $e->getMessage()]);
            }
        } else {
            // Perform Insert
            try {
                $stmt = $db->prepare("INSERT INTO discussions (client_id, title, content) VALUES (?, ?, ?)");
                $stmt->execute([$client_id, $title, $content]);
                $new_id = $db->lastInsertId();
                echo json_encode(["success" => true, "message" => "Discussion created successfully", "id" => $new_id]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(["success" => false, "error" => "Insert failed: " . $e->getMessage()]);
            }
        }
        break;

    case 'PUT':
        // Alternative handler for PUT update
        $input = getJsonInput();
        $id = isset($input['id']) ? intval($input['id']) : null;
        $client_id = trim($input['client_id'] ?? '');
        $title = trim($input['title'] ?? '');
        $content = trim($input['content'] ?? '') ?: null;

        if (empty($id) || empty($client_id) || empty($title)) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Discussion ID, Client ID, and Title are required for update"]);
            exit();
        }

        try {
            $stmt = $db->prepare("UPDATE discussions SET client_id = ?, title = ?, content = ? WHERE id = ?");
            $stmt->execute([$client_id, $title, $content, $id]);
            echo json_encode(["success" => true, "message" => "Discussion updated successfully", "id" => $id]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "error" => "Update failed: " . $e->getMessage()]);
        }
        break;

    case 'DELETE':
        // Delete discussion
        $input = getJsonInput();
        $id = isset($input['id']) ? intval($input['id']) : (isset($_GET['id']) ? intval($_GET['id']) : null);

        if (empty($id)) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Discussion ID is required for deletion"]);
            exit();
        }

        try {
            $stmt = $db->prepare("DELETE FROM discussions WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(["success" => true, "message" => "Discussion deleted successfully", "id" => $id]);
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
