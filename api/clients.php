<?php
/**
 * Unified Clients API endpoint (supports full CRUD: GET, POST, PUT, DELETE)
 * InfinityFree PHP Compatible
 */
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/verify_session.php';

$method = $_SERVER['REQUEST_METHOD'];

// Handle different request methods
switch ($method) {
    case 'GET':
        // Fetch clients
        if (isset($_GET['id'])) {
            try {
                $stmt = $db->prepare("
                    SELECT c.*, u.username as assigned_team_member_username 
                    FROM clients c 
                    LEFT JOIN users u ON c.assigned_team_member = u.id 
                    WHERE c.id = ? 
                    LIMIT 1
                ");
                $stmt->execute([$_GET['id']]);
                $client = $stmt->fetch();
                if ($client) {
                    echo json_encode(["success" => true, "data" => $client]);
                } else {
                    http_response_code(404);
                    echo json_encode(["success" => false, "error" => "Client not found"]);
                }
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(["success" => false, "error" => "Database error: " . $e->getMessage()]);
            }
        } else {
            try {
                $stmt = $db->query("
                    SELECT c.*, u.username as assigned_team_member_username 
                    FROM clients c 
                    LEFT JOIN users u ON c.assigned_team_member = u.id 
                    ORDER BY c.created_at DESC
                ");
                $clients = $stmt->fetchAll();
                echo json_encode(["success" => true, "data" => $clients]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(["success" => false, "error" => "Database error: " . $e->getMessage()]);
            }
        }
        break;

    case 'POST':
        // Insert or Update Client
        $input = getJsonInput();
        if (empty($input)) {
            $input = $_POST;
        }

        $id = trim($input['id'] ?? '');
        $name = trim($input['name'] ?? '');
        
        $is_update = !empty($id);

        if (empty($name)) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Client name is required"]);
            exit();
        }

        // Set optional/nullable fields
        $email = trim($input['email'] ?? '') ?: null;
        $phone = trim($input['phone'] ?? '') ?: null;
        $company = trim($input['company'] ?? '') ?: null;
        $active_projects = isset($input['active_projects']) ? intval($input['active_projects']) : 0;
        $total_value = isset($input['total_value']) ? floatval($input['total_value']) : 0.00;
        $status = trim($input['status'] ?? 'Active');
        $project_progress = isset($input['project_progress']) ? intval($input['project_progress']) : 0;
        $service_type = trim($input['service_type'] ?? 'Other');
        $notes = trim($input['notes'] ?? '') ?: null;
        $assigned_member = trim($input['assigned_team_member'] ?? '') ?: null;
        
        // Optional links
        $instagram = trim($input['instagram_link'] ?? $input['instagramLink'] ?? '') ?: null;
        $facebook = trim($input['facebook_link'] ?? $input['facebookLink'] ?? '') ?: null;
        $linkedin = trim($input['linkedin_link'] ?? $input['linkedinLink'] ?? '') ?: null;
        $website = trim($input['website_link'] ?? $input['websiteUrl'] ?? '') ?: null;
        $other = trim($input['other_link'] ?? $input['otherLink'] ?? '') ?: null;
        $custom_links = trim($input['customLinks'] ?? $input['custom_links'] ?? '') ?: null;

        if ($is_update) {
            // Perform Update
            try {
                $stmt = $db->prepare("
                    UPDATE clients SET 
                        name = ?, email = ?, phone = ?, company = ?, active_projects = ?, total_value = ?, 
                        status = ?, project_progress = ?, service_type = ?, notes = ?, instagram_link = ?, 
                        facebook_link = ?, linkedin_link = ?, website_link = ?, other_link = ?, customLinks = ?, assigned_team_member = ?
                    WHERE id = ?
                ");
                $stmt->execute([
                    $name, $email, $phone, $company, $active_projects, $total_value,
                    $status, $project_progress, $service_type, $notes, $instagram,
                    $facebook, $linkedin, $website, $other, $custom_links, $assigned_member, $id
                ]);
                echo json_encode(["success" => true, "message" => "Client updated successfully", "id" => $id]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(["success" => false, "error" => "Update failed: " . $e->getMessage()]);
            }
        } else {
            // Perform Insert
            $id = 'client-' . uniqid();
            try {
                $stmt = $db->prepare("
                    INSERT INTO clients (
                        id, name, email, phone, company, active_projects, total_value, status, 
                        project_progress, service_type, notes, instagram_link, facebook_link, 
                        linkedin_link, website_link, other_link, customLinks, assigned_team_member
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $id, $name, $email, $phone, $company, $active_projects, $total_value, $status,
                    $project_progress, $service_type, $notes, $instagram, $facebook,
                    $linkedin, $website, $other, $custom_links, $assigned_member
                ]);
                echo json_encode(["success" => true, "message" => "Client created successfully", "id" => $id]);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(["success" => false, "error" => "Insert failed: " . $e->getMessage()]);
            }
        }
        break;

    case 'PUT':
        // Alternative update handler using PUT
        $input = getJsonInput();
        $id = trim($input['id'] ?? '');
        $name = trim($input['name'] ?? '');

        if (empty($id) || empty($name)) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Client ID and Name are required for update"]);
            exit();
        }

        $email = trim($input['email'] ?? '') ?: null;
        $phone = trim($input['phone'] ?? '') ?: null;
        $company = trim($input['company'] ?? '') ?: null;
        $active_projects = isset($input['active_projects']) ? intval($input['active_projects']) : 0;
        $total_value = isset($input['total_value']) ? floatval($input['total_value']) : 0.00;
        $status = trim($input['status'] ?? 'Active');
        $project_progress = isset($input['project_progress']) ? intval($input['project_progress']) : 0;
        $service_type = trim($input['service_type'] ?? 'Other');
        $notes = trim($input['notes'] ?? '') ?: null;
        $assigned_member = trim($input['assigned_team_member'] ?? '') ?: null;
        
        $instagram = trim($input['instagram_link'] ?? $input['instagramLink'] ?? '') ?: null;
        $facebook = trim($input['facebook_link'] ?? $input['facebookLink'] ?? '') ?: null;
        $linkedin = trim($input['linkedin_link'] ?? $input['linkedinLink'] ?? '') ?: null;
        $website = trim($input['website_link'] ?? $input['websiteUrl'] ?? '') ?: null;
        $other = trim($input['other_link'] ?? $input['otherLink'] ?? '') ?: null;
        $custom_links = trim($input['customLinks'] ?? $input['custom_links'] ?? '') ?: null;

        try {
            $stmt = $db->prepare("
                UPDATE clients SET 
                    name = ?, email = ?, phone = ?, company = ?, active_projects = ?, total_value = ?, 
                    status = ?, project_progress = ?, service_type = ?, notes = ?, instagram_link = ?, 
                    facebook_link = ?, linkedin_link = ?, website_link = ?, other_link = ?, customLinks = ?, assigned_team_member = ?
                WHERE id = ?
            ");
            $stmt->execute([
                $name, $email, $phone, $company, $active_projects, $total_value,
                $status, $project_progress, $service_type, $notes, $instagram,
                $facebook, $linkedin, $website, $other, $custom_links, $assigned_member, $id
            ]);
            echo json_encode(["success" => true, "message" => "Client updated successfully", "id" => $id]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "error" => "Update failed: " . $e->getMessage()]);
        }
        break;

    case 'DELETE':
        // Delete client
        $input = getJsonInput();
        $id = trim($input['id'] ?? $_GET['id'] ?? '');

        if (empty($id)) {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Client ID is required for deletion"]);
            exit();
        }

        try {
            $stmt = $db->prepare("DELETE FROM clients WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(["success" => true, "message" => "Client deleted successfully", "id" => $id]);
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
