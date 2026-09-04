<?php
/**
 * Unified Authentication API endpoint
 * InfinityFree PHP Compatible
 */
require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        $input = getJsonInput();
        if (empty($input)) {
            $input = $_POST;
        }

        $action = trim($input['action'] ?? '');

        if ($action === 'login') {
            $username = trim($input['username'] ?? '');
            $password = trim($input['password'] ?? '');

            if (empty($username) || empty($password)) {
                http_response_code(400);
                echo json_encode(["success" => false, "error" => "Username and password are required"]);
                exit();
            }

            try {
                // Fetch user from database
                $stmt = $db->prepare("SELECT * FROM users WHERE username = ? LIMIT 1");
                $stmt->execute([$username]);
                $user = $stmt->fetch();

                if ($user && password_verify($password, $user['password'])) {
                    // Password matches! Generate random safe tokens
                    $token = bin2hex(random_bytes(32));
                    $csrfToken = bin2hex(random_bytes(24));
                    $expires_at = date('Y-m-d H:i:s', strtotime('+4 hours'));

                    // Store session (optional if sessions table is present, or just return token for stateful storage)
                    try {
                        $sessStmt = $db->prepare("
                            INSERT INTO user_sessions (id, token, username, role, csrfToken, createdAt, expiresAt) 
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        ");
                        $sessId = 'sess-' . uniqid();
                        $sessStmt->execute([
                            $sessId, $token, $username, $user['role'], $csrfToken, date('Y-m-d H:i:s'), $expires_at
                        ]);
                    } catch (PDOException $ex) {
                        // If sessions table does not exist yet or fails, we still allow stateless token authentication
                    }

                    echo json_encode([
                        "success" => true,
                        "token" => $token,
                        "csrfToken" => $csrfToken,
                        "user" => [
                            "id" => $user['id'],
                            "username" => $user['username'],
                            "role" => $user['role']
                        ]
                    ]);
                } else {
                    http_response_code(401);
                    echo json_encode(["success" => false, "error" => "Invalid username or password"]);
                }
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(["success" => false, "error" => "Database error: " . $e->getMessage()]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["success" => false, "error" => "Invalid action specified"]);
        }
        break;

    case 'GET':
        // Check session or token validity
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        $token = '';

        if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            $token = $matches[1];
        }

        if (empty($token) && isset($_GET['token'])) {
            $token = $_GET['token'];
        }

        // Use unified advanced session verification to handle expiry, inactivity, and rate-limiting
        require_once __DIR__ . '/verify_session.php';

        try {
            // If verify_session passes, session is active and valid. Let's fetch the latest user info
            $userStmt = $db->prepare("SELECT id, username, role FROM users WHERE username = ? LIMIT 1");
            $userStmt->execute([$_SESSION['username']]);
            $user = $userStmt->fetch();

            if ($user) {
                echo json_encode([
                    "success" => true,
                    "user" => $user,
                    "csrfToken" => $_SESSION['csrf_token'] ?? ''
                ]);
            } else {
                http_response_code(401);
                echo json_encode(["success" => false, "error" => "User associated with session not found"]);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "error" => "Auth verification failed: " . $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["success" => false, "error" => "Method not allowed"]);
        break;
}
