<?php
/**
 * Unified Leads API endpoint (supports full CRUD: GET, POST, PUT, DELETE)
 * InfinityFree PHP Compatible
 */
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/verify_session.php';

$method = $_SERVER['REQUEST_METHOD'];

// Handle different request methods
switch ($method) {
    case 'GET':
        // Fetch leads
        if (isset($_GET['id'])) {
            try {
                $stmt = $db->prepare("SELECT * FROM leads WHERE id = ? AND deletedAt IS NULL LIMIT 1");
                $stmt->execute([$_GET['id']]);
                $lead = $stmt->fetch();
                if ($lead) {
                    echo json_encode(["success" => true, "data" => $lead]);
                } else {
                    http_response_code(404);
                    echo json_encode(["success" => false, "error" => "Lead not found"]);
                }
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(["success" => false, "error" => "Database error: " . $e->getMessage()]);
            }
        } else {
            try {
                $stmt = $db->query("SELECT * FROM leads WHERE deletedAt IS NULL ORDER BY created_at DESC");
                $leads = $stmt->fetchAll();
                echo json_encode(["success" => true, "data" => $leads]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(["success" => false, "error" => "Database error: " . $e->getMessage()]);
            }
        }
        break;

    case 'POST':
        // Insert or Update Lead (Supports both raw JSON and normal POST payloads)
        $input = getJsonInput();
        if (empty($input)) {
            $input = $_POST;
        }

        $id = trim($input['id'] ?? '');
        $name = trim($input['name'] ?? '');
        
        // Check if updating or inserting
        $is_update = !empty($id);

        if (empty($name)) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Lead name is required"]);
            exit();
        }

        // Set optional/nullable fields
        $email = trim($input['email'] ?? '') ?: null;
        $phone = trim($input['phone'] ?? '') ?: null;
        $company = trim($input['company'] ?? '') ?: null;
        $status = trim($input['status'] ?? 'New');
        $value = isset($input['value']) ? floatval($input['value']) : 0.00;
        $source = trim($input['source'] ?? 'Direct');
        $category = trim($input['category'] ?? 'Other');
        $notes = trim($input['notes'] ?? '') ?: null;
        
        // Optional links
        $instagram = trim($input['instagram_link'] ?? $input['instagramLink'] ?? '') ?: null;
        $facebook = trim($input['facebook_link'] ?? $input['facebookLink'] ?? '') ?: null;
        $linkedin = trim($input['linkedin_link'] ?? $input['linkedinLink'] ?? '') ?: null;
        $website = trim($input['website_link'] ?? $input['website_link'] ?? '') ?: null;
        $other = trim($input['other_link'] ?? $input['otherLink'] ?? '') ?: null;

        if ($is_update) {
            // Perform Update
            try {
                $stmt = $db->prepare("
                    UPDATE leads SET 
                        name = ?, email = ?, phone = ?, company = ?, status = ?, value = ?, 
                        source = ?, category = ?, notes = ?, instagram_link = ?, 
                        facebook_link = ?, linkedin_link = ?, website_link = ?, other_link = ?
                    WHERE id = ?
                ");
                $stmt->execute([
                    $name, $email, $phone, $company, $status, $value, 
                    $source, $category, $notes, $instagram, 
                    $facebook, $linkedin, $website, $other, $id
                ]);
                echo json_encode(["success" => true, "message" => "Lead updated successfully", "id" => $id]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(["success" => false, "error" => "Update failed: " . $e->getMessage()]);
            }
        } else {
            // Perform Insert
            $id = 'lead-' . uniqid();
            try {
                $stmt = $db->prepare("
                    INSERT INTO leads (
                        id, name, email, phone, company, status, value, source, category, notes, 
                        instagram_link, facebook_link, linkedin_link, website_link, other_link
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $id, $name, $email, $phone, $company, $status, $value, $source, $category, $notes,
                    $instagram, $facebook, $linkedin, $website, $other
                ]);
                echo json_encode(["success" => true, "message" => "Lead created successfully", "id" => $id]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(["success" => false, "error" => "Insert failed: " . $e->getMessage()]);
            }
        }
        break;

    case 'PUT':
        // Alternative method for updates using PUT
        $input = getJsonInput();
        $id = trim($input['id'] ?? '');
        $name = trim($input['name'] ?? '');

        if (empty($id) || empty($name)) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Lead ID and Name are required for update"]);
            exit();
        }

        $email = trim($input['email'] ?? '') ?: null;
        $phone = trim($input['phone'] ?? '') ?: null;
        $company = trim($input['company'] ?? '') ?: null;
        $status = trim($input['status'] ?? 'New');
        $value = isset($input['value']) ? floatval($input['value']) : 0.00;
        $source = trim($input['source'] ?? 'Direct');
        $category = trim($input['category'] ?? 'Other');
        $notes = trim($input['notes'] ?? '') ?: null;
        
        $instagram = trim($input['instagram_link'] ?? $input['instagramLink'] ?? '') ?: null;
        $facebook = trim($input['facebook_link'] ?? $input['facebookLink'] ?? '') ?: null;
        $linkedin = trim($input['linkedin_link'] ?? $input['linkedinLink'] ?? '') ?: null;
        $website = trim($input['website_link'] ?? $input['website_link'] ?? '') ?: null;
        $other = trim($input['other_link'] ?? $input['otherLink'] ?? '') ?: null;

        try {
            $stmt = $db->prepare("
                UPDATE leads SET 
                    name = ?, email = ?, phone = ?, company = ?, status = ?, value = ?, 
                    source = ?, category = ?, notes = ?, instagram_link = ?, 
                    facebook_link = ?, linkedin_link = ?, website_link = ?, other_link = ?
                WHERE id = ?
            ");
            $stmt->execute([
                $name, $email, $phone, $company, $status, $value, 
                $source, $category, $notes, $instagram, 
                $facebook, $linkedin, $website, $other, $id
            ]);
            echo json_encode(["success" => true, "message" => "Lead updated successfully", "id" => $id]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "error" => "Update failed: " . $e->getMessage()]);
        }
        break;

    case 'DELETE':
        // Delete lead
        $input = getJsonInput();
        $id = trim($input['id'] ?? $_GET['id'] ?? '');

        if (empty($id)) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Lead ID is required for deletion"]);
            exit();
        }

        try {
            $stmt = $db->prepare("UPDATE leads SET deletedAt = ? WHERE id = ?");
            $stmt->execute([date('c'), $id]);
            echo json_encode(["success" => true, "message" => "Lead soft deleted successfully", "id" => $id]);
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
