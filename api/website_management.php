<?php
/**
 * Unified Website Management API endpoint (supports full CRUD)
 * InfinityFree PHP Compatible
 */
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

// Secure all write/edit operations, but allow public website to fetch display items via GET
if ($method !== 'GET') {
    require_once __DIR__ . '/verify_session.php';
}

// Handle different request methods
switch ($method) {
    case 'GET':
        // Fetch website management fields
        if (isset($_GET['section'])) {
            try {
                $stmt = $db->prepare("SELECT * FROM website_management WHERE section_name = ? ORDER BY content_key ASC");
                $stmt->execute([$_GET['section']]);
                $items = $stmt->fetchAll();
                echo json_encode(["success" => true, "data" => $items]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(["success" => false, "error" => "Database error: " . $e->getMessage()]);
            }
        } elseif (isset($_GET['id'])) {
            try {
                $stmt = $db->prepare("SELECT * FROM website_management WHERE id = ? LIMIT 1");
                $stmt->execute([$_GET['id']]);
                $item = $stmt->fetch();
                if ($item) {
                    echo json_encode(["success" => true, "data" => $item]);
                } else {
                    http_response_code(404);
                    echo json_encode(["success" => false, "error" => "Website management record not found"]);
                }
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(["success" => false, "error" => "Database error: " . $e->getMessage()]);
            }
        } else {
            try {
                $stmt = $db->query("SELECT * FROM website_management ORDER BY section_name, content_key ASC");
                $items = $stmt->fetchAll();
                echo json_encode(["success" => true, "data" => $items]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(["success" => false, "error" => "Database error: " . $e->getMessage()]);
            }
        }
        break;

    case 'POST':
        // Insert or Update section content
        $input = getJsonInput();
        if (empty($input)) {
            $input = $_POST;
        }

        $id = isset($input['id']) ? intval($input['id']) : null;
        $section_name = trim($input['section_name'] ?? '');
        $content_key = trim($input['content_key'] ?? '');
        $content_value = trim($input['content_value'] ?? '') ?: null;
        $updated_by = trim($input['updated_by'] ?? $input['userId'] ?? '') ?: null;

        $is_update = !empty($id);

        if (empty($section_name) || empty($content_key)) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Section Name and Content Key are required"]);
            exit();
        }

        if ($is_update) {
            try {
                $stmt = $db->prepare("
                    UPDATE website_management 
                    SET section_name = ?, content_key = ?, content_value = ?, updated_by = ? 
                    WHERE id = ?
                ");
                $stmt->execute([$section_name, $content_key, $content_value, $updated_by, $id]);
                echo json_encode(["success" => true, "message" => "Content updated successfully", "id" => $id]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(["success" => false, "error" => "Update failed: " . $e->getMessage()]);
            }
        } else {
            try {
                // Check if key already exists in section to prevent duplicate errors (upsert)
                $stmt = $db->prepare("SELECT id FROM website_management WHERE section_name = ? AND content_key = ? LIMIT 1");
                $stmt->execute([$section_name, $content_key]);
                $existing = $stmt->fetch();

                if ($existing) {
                    $stmt = $db->prepare("
                        UPDATE website_management 
                        SET content_value = ?, updated_by = ? 
                        WHERE id = ?
                    ");
                    $stmt->execute([$content_value, $updated_by, $existing['id']]);
                    echo json_encode(["success" => true, "message" => "Content updated successfully (upsert)", "id" => $existing['id']]);
                } else {
                    $stmt = $db->prepare("
                        INSERT INTO website_management (section_name, content_key, content_value, updated_by) 
                        VALUES (?, ?, ?, ?)
                    ");
                    $stmt->execute([$section_name, $content_key, $content_value, $updated_by]);
                    $new_id = $db->lastInsertId();
                    echo json_encode(["success" => true, "message" => "Content created successfully", "id" => $new_id]);
                }
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(["success" => false, "error" => "Insert/Upsert failed: " . $e->getMessage()]);
            }
        }
        break;

    case 'DELETE':
        // Delete a content row
        $input = getJsonInput();
        $id = isset($input['id']) ? intval($input['id']) : (isset($_GET['id']) ? intval($_GET['id']) : null);

        if (empty($id)) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Record ID is required for deletion"]);
            exit();
        }

        try {
            $stmt = $db->prepare("DELETE FROM website_management WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(["success" => true, "message" => "Content deleted successfully", "id" => $id]);
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
