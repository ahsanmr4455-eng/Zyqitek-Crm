<?php
ini_set('display_errors', '0');
error_reporting(0);
/**
 * Zyqro CRM Database Connection File (InfinityFree & Local SQLite Hybrid Dev Stable)
 * Auto-falls back to SQLite locally in sandboxed AI Studio preview when remote MySQL is unreachable.
 */

// Enable CORS and define JSON output headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, X-CSRF-Token");

// Handle preflight CORS OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// =========================================================================
// DATABASE CONFIGURATION
// =========================================================================
define('DB_HOST', 'sql213.infinityfree.com'); 
define('DB_NAME', 'if0_42354648_crm3'); 
define('DB_USER', 'if0_42354648'); 
define('DB_PASSWORD', 'lqVEnBB67d'); 

$isSQLite = false;
try {
    $db = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASSWORD,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );
} catch (PDOException $e) {
    // Outbound port blocked or DB server offline? Fall back gracefully to SQLite
    $isSQLite = true;
    $sqliteFile = __DIR__ . '/db.sqlite';
    try {
        $db = new PDO(
            "sqlite:" . $sqliteFile,
            null,
            null,
            [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]
        );
    } catch (PDOException $sqliteEx) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "error" => "Database connection failed completely. Please contact system administrator."
        ]);
        exit();
    }
}

// Ensure database table structures exist (Auto-Migration failsafe)
try {
    // 1. Users Table
    $db->exec("CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(100) PRIMARY KEY,
        username VARCHAR(100) UNIQUE,
        password VARCHAR(255),
        role VARCHAR(50) DEFAULT 'Team Member',
        fullName VARCHAR(255) DEFAULT NULL,
        whatsapp VARCHAR(255) DEFAULT NULL,
        email VARCHAR(255) DEFAULT NULL,
        facebookLink VARCHAR(255) DEFAULT NULL,
        instagramLink VARCHAR(255) DEFAULT NULL,
        portfolioLink VARCHAR(255) DEFAULT NULL,
        linkedinLink VARCHAR(255) DEFAULT NULL,
        customLinks TEXT DEFAULT NULL,
        assignedProjectName VARCHAR(255) DEFAULT NULL,
        clientName VARCHAR(255) DEFAULT NULL,
        projectStatus VARCHAR(100) DEFAULT NULL,
        projectDeadline VARCHAR(100) DEFAULT NULL,
        projectProgress INT DEFAULT 0,
        notes TEXT DEFAULT NULL,
        createdAt VARCHAR(100) DEFAULT NULL,
        deletedAt VARCHAR(100) DEFAULT NULL
    )");

    // Seed default administrator if empty
    $stmt = $db->query("SELECT COUNT(*) as count FROM users");
    $userCount = $stmt->fetch();
    if ($userCount['count'] == 0) {
        // 'zyqro87+' hashed securely with BCRYPT ('digital97@-')
        $hashedPassword = password_hash('digital97@-', PASSWORD_BCRYPT);
        $insUser = $db->prepare("INSERT INTO users (id, username, password, role, fullName) VALUES (?, ?, ?, ?, ?)");
        $insUser->execute(['user-1', 'zyqro87+', $hashedPassword, 'Admin', 'Zyqro Administrator']);
    }

    // 2. User Sessions Table
    $db->exec("CREATE TABLE IF NOT EXISTS user_sessions (
        id VARCHAR(100) PRIMARY KEY,
        token VARCHAR(255) UNIQUE,
        username VARCHAR(100),
        role VARCHAR(50),
        csrfToken VARCHAR(255),
        createdAt VARCHAR(100),
        expiresAt VARCHAR(100),
        lastActive VARCHAR(100)
    )");

    // 3. Login Lock / Attempts Tracking Table
    $db->exec("CREATE TABLE IF NOT EXISTS login_attempts (
        ip_address VARCHAR(50) PRIMARY KEY,
        failed_attempts INT DEFAULT 0,
        lock_level INT DEFAULT 0,
        last_failed_login VARCHAR(100) DEFAULT NULL,
        lock_until VARCHAR(100) DEFAULT NULL
    )");

    // Safe migration to add new columns if the table already existed
    try {
        $db->exec("ALTER TABLE login_attempts ADD COLUMN lock_level INT DEFAULT 0");
    } catch (PDOException $ex_alter0) {}
    try {
        $db->exec("ALTER TABLE login_attempts ADD COLUMN last_failed_login VARCHAR(100) DEFAULT NULL");
    } catch (PDOException $ex_alter1) {}
    try {
        $db->exec("ALTER TABLE login_attempts ADD COLUMN lock_until VARCHAR(100) DEFAULT NULL");
    } catch (PDOException $ex_alter2) {}

    // 4. Audit Logs Table
    $db->exec("CREATE TABLE IF NOT EXISTS audit_logs (
        id " . ($isSQLite ? "INTEGER PRIMARY KEY AUTOINCREMENT" : "INT AUTO_INCREMENT PRIMARY KEY") . ",
        username VARCHAR(100),
        attempt_time VARCHAR(100),
        ip_address VARCHAR(50),
        browser TEXT,
        os TEXT,
        status VARCHAR(50),
        details TEXT
    )");

    // 5. Rate Limits Table
    $db->exec("CREATE TABLE IF NOT EXISTS ip_rate_limits (
        ip_address VARCHAR(50),
        endpoint VARCHAR(255),
        request_time INT,
        PRIMARY KEY (ip_address, endpoint, request_time)
    )");

    // 6. Leads Table
    $db->exec("CREATE TABLE IF NOT EXISTS leads (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        company VARCHAR(255),
        status VARCHAR(50) DEFAULT 'New',
        value DECIMAL(15, 2) DEFAULT 0,
        source VARCHAR(100) DEFAULT 'Direct',
        notes TEXT,
        createdAt VARCHAR(100),
        updatedAt VARCHAR(100),
        deletedAt VARCHAR(100) DEFAULT NULL
    )");

    try {
        $db->exec("ALTER TABLE leads ADD COLUMN deletedAt VARCHAR(100) DEFAULT NULL");
    } catch (PDOException $e_col) {
        // Suppress if already exists
    }
    try {
        $db->exec("ALTER TABLE leads ADD COLUMN assignedTeamMember VARCHAR(255) DEFAULT NULL");
    } catch (PDOException $e_col) {}
    try {
        $db->exec("ALTER TABLE leads ADD COLUMN category VARCHAR(255) DEFAULT NULL");
    } catch (PDOException $e_col) {}
    try {
        $db->exec("ALTER TABLE leads ADD COLUMN instagramLink VARCHAR(255) DEFAULT NULL");
    } catch (PDOException $e_col) {}
    try {
        $db->exec("ALTER TABLE leads ADD COLUMN facebookLink VARCHAR(255) DEFAULT NULL");
    } catch (PDOException $e_col) {}
    try {
        $db->exec("ALTER TABLE leads ADD COLUMN linkedinLink VARCHAR(255) DEFAULT NULL");
    } catch (PDOException $e_col) {}
    try {
        $db->exec("ALTER TABLE leads ADD COLUMN websiteUrl VARCHAR(255) DEFAULT NULL");
    } catch (PDOException $e_col) {}
    try {
        $db->exec("ALTER TABLE leads ADD COLUMN otherLink VARCHAR(255) DEFAULT NULL");
    } catch (PDOException $e_col) {}
    try {
        $db->exec("ALTER TABLE leads ADD COLUMN smmPlatformName VARCHAR(255) DEFAULT NULL");
    } catch (PDOException $e_col) {}
    try {
        $db->exec("ALTER TABLE leads ADD COLUMN smmPlannedPosts INT DEFAULT 0");
    } catch (PDOException $e_col) {}
    try {
        $db->exec("ALTER TABLE leads ADD COLUMN smmPostingFrequency VARCHAR(255) DEFAULT NULL");
    } catch (PDOException $e_col) {}
    try {
        $db->exec("ALTER TABLE leads ADD COLUMN smmContentNotes TEXT DEFAULT NULL");
    } catch (PDOException $e_col) {}
    try {
        $db->exec("ALTER TABLE leads ADD COLUMN smmCampaignRequirements TEXT DEFAULT NULL");
    } catch (PDOException $e_col) {}

    // 7. Clients Table
    $db->exec("CREATE TABLE IF NOT EXISTS clients (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        company VARCHAR(255),
        activeProjects INT DEFAULT 0,
        totalValue DECIMAL(15, 2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Active',
        projectProgress INT DEFAULT 0,
        notes TEXT,
        customLinks TEXT DEFAULT NULL
    )");

    // 8. Goals Table
    $db->exec("CREATE TABLE IF NOT EXISTS goals (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        current DECIMAL(15, 2) DEFAULT 0,
        target DECIMAL(15, 2) DEFAULT 0,
        unit VARCHAR(50),
        deadline VARCHAR(100)
    )");

    // 9. Call History Table
    $db->exec("CREATE TABLE IF NOT EXISTS call_history (
        id VARCHAR(100) PRIMARY KEY,
        leadId VARCHAR(100),
        leadName VARCHAR(255),
        duration INT DEFAULT 0,
        status VARCHAR(100),
        notes TEXT,
        timestamp VARCHAR(100)
    )");

    // 10. Settings Table
    $db->exec("CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT
    )");

    $stmtSettings = $db->query("SELECT COUNT(*) as count FROM settings");
    $settingsCount = $stmtSettings->fetch();
    if ($settingsCount['count'] == 0) {
        $insSet = $db->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)");
        $insSet->execute(['portal_url', 'https://dash.infinityfree.com/accounts']);
        $insSet->execute(['preview_url', 'https://zyqrodigi.site.je']);
        $insSet->execute(['redirect_url', 'https://zyqrodigi.site.je/thank-you']);
        $insSet->execute(['redirect_enabled', 'true']);
    }

    // Seed default goals if empty
    $stmtGoals = $db->query("SELECT COUNT(*) as count FROM goals");
    $goalsCount = $stmtGoals->fetch();
    if ($goalsCount['count'] == 0) {
        $insGoal = $db->prepare("INSERT INTO goals (id, title, category, current, target, unit, deadline) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $insGoal->execute(['1', 'Revenue Target', 'Financial', 0, 20000, '$', 'June 30, 2026']);
        $insGoal->execute(['2', 'Leads Target', 'Marketing', 0, 10, 'leads', 'June 30, 2026']);
        $insGoal->execute(['3', 'Onboarded Clients', 'Operations', 0, 5, 'clients', 'June 30, 2026']);
    }

    // 11. Discussions Table
    $db->exec("CREATE TABLE IF NOT EXISTS discussions (
        id " . ($isSQLite ? "INTEGER PRIMARY KEY AUTOINCREMENT" : "INT AUTO_INCREMENT PRIMARY KEY") . ",
        client_id VARCHAR(100),
        title VARCHAR(255),
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // 12. Web Responses Table
    $db->exec("CREATE TABLE IF NOT EXISTS web_responses (
        id " . ($isSQLite ? "INTEGER PRIMARY KEY AUTOINCREMENT" : "INT AUTO_INCREMENT PRIMARY KEY") . ",
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        message TEXT,
        source_page VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Unread',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // 13. Project Tracking Table
    $db->exec("CREATE TABLE IF NOT EXISTS project_tracking (
        client_id VARCHAR(100) PRIMARY KEY,
        project_name VARCHAR(255),
        project_id VARCHAR(100),
        start_date VARCHAR(100),
        expected_delivery_date VARCHAR(100),
        current_status VARCHAR(100) DEFAULT 'Project Received',
        overall_progress INT DEFAULT 0,
        revisions_allowed INT DEFAULT 3,
        revisions_used INT DEFAULT 0,
        delivery_status VARCHAR(100) DEFAULT 'Not Delivered',
        delivery_date VARCHAR(100),
        delivered_by VARCHAR(255),
        final_files TEXT,
        delivery_notes TEXT,
        last_updated VARCHAR(100),
        estimated_time_left VARCHAR(100)
    )");

    // 14. Project Revisions Table
    $db->exec("CREATE TABLE IF NOT EXISTS project_revisions (
        id " . ($isSQLite ? "INTEGER PRIMARY KEY AUTOINCREMENT" : "INT AUTO_INCREMENT PRIMARY KEY") . ",
        client_id VARCHAR(100),
        revision_date VARCHAR(100),
        status VARCHAR(50) DEFAULT 'Pending',
        notes TEXT
    )");

    // 15. Project Reviews Table
    $db->exec("CREATE TABLE IF NOT EXISTS project_reviews (
        client_id VARCHAR(100) PRIMARY KEY,
        rating INT DEFAULT 5,
        message TEXT,
        recommend VARCHAR(50) DEFAULT 'Yes'
    )");

    // 16. Team Table
    $db->exec("CREATE TABLE IF NOT EXISTS team (
        id VARCHAR(100) PRIMARY KEY,
        fullName VARCHAR(255) NOT NULL,
        role VARCHAR(100) DEFAULT NULL,
        whatsapp VARCHAR(100) DEFAULT NULL,
        email VARCHAR(255) DEFAULT NULL,
        facebookLink VARCHAR(255) DEFAULT NULL,
        instagramLink VARCHAR(255) DEFAULT NULL,
        portfolioLink VARCHAR(255) DEFAULT NULL,
        linkedinLink VARCHAR(255) DEFAULT NULL,
        customLinks TEXT DEFAULT NULL,
        assignedProjectName VARCHAR(255) DEFAULT NULL,
        clientName VARCHAR(255) DEFAULT NULL,
        projectStatus VARCHAR(100) DEFAULT 'Not Started',
        projectDeadline VARCHAR(100) DEFAULT NULL,
        projectProgress INT DEFAULT 0,
        notes TEXT DEFAULT NULL,
        country VARCHAR(100) DEFAULT NULL,
        experience VARCHAR(100) DEFAULT NULL,
        softwareKnowledge VARCHAR(100) DEFAULT NULL,
        avatar TEXT DEFAULT NULL,
        createdAt VARCHAR(100) DEFAULT NULL,
        username VARCHAR(100) DEFAULT NULL,
        password VARCHAR(255) DEFAULT NULL
    )");

    // 17. Email Discussions Table
    $db->exec("CREATE TABLE IF NOT EXISTS email_discussions (
        id VARCHAR(100) PRIMARY KEY,
        clientName VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        date VARCHAR(100) NOT NULL,
        direction VARCHAR(50) DEFAULT 'Sent',
        content TEXT DEFAULT NULL,
        notes TEXT DEFAULT NULL,
        followUpStatus VARCHAR(50) DEFAULT 'None',
        attachments TEXT DEFAULT NULL,
        clientService VARCHAR(100) DEFAULT NULL
    )");

    // 18. Call Discussions Table
    $db->exec("CREATE TABLE IF NOT EXISTS call_discussions (
        id VARCHAR(100) PRIMARY KEY,
        clientName VARCHAR(255) NOT NULL,
        callDate VARCHAR(100) NOT NULL,
        duration VARCHAR(50) NOT NULL,
        summary TEXT DEFAULT NULL,
        requirements TEXT DEFAULT NULL,
        followUpActions TEXT DEFAULT NULL,
        notes TEXT DEFAULT NULL,
        status VARCHAR(50) DEFAULT 'Connected',
        clientService VARCHAR(100) DEFAULT NULL
    )");

    // 19. Website Management Table
    $db->exec("CREATE TABLE IF NOT EXISTS website_management (
        id " . ($isSQLite ? "INTEGER PRIMARY KEY AUTOINCREMENT" : "INT AUTO_INCREMENT PRIMARY KEY") . ",
        section_name VARCHAR(255) NOT NULL,
        content_key VARCHAR(255) NOT NULL,
        content_value TEXT DEFAULT NULL,
        updated_by VARCHAR(100) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // 20. Security Settings Table
    $db->exec("CREATE TABLE IF NOT EXISTS security_settings (
        id " . ($isSQLite ? "INTEGER PRIMARY KEY AUTOINCREMENT" : "INT AUTO_INCREMENT PRIMARY KEY") . ",
        security_code VARCHAR(10) NOT NULL DEFAULT '2005'
    )");

    $stmtSec = $db->query("SELECT COUNT(*) as count FROM security_settings");
    $secCount = $stmtSec->fetch();
    if ($secCount['count'] == 0) {
        $db->exec("INSERT INTO security_settings (id, security_code) VALUES (1, '2005')");
    }

    // Add columns dynamically if not exists (non-blocking)
    try { $db->exec("ALTER TABLE users ADD COLUMN linkedinLink VARCHAR(255) DEFAULT NULL"); } catch (Exception $e) {}
    try { $db->exec("ALTER TABLE users ADD COLUMN customLinks TEXT DEFAULT NULL"); } catch (Exception $e) {}
    try { $db->exec("ALTER TABLE team ADD COLUMN linkedinLink VARCHAR(255) DEFAULT NULL"); } catch (Exception $e) {}
    try { $db->exec("ALTER TABLE team ADD COLUMN customLinks TEXT DEFAULT NULL"); } catch (Exception $e) {}
    try { $db->exec("ALTER TABLE clients ADD COLUMN customLinks TEXT DEFAULT NULL"); } catch (Exception $e) {}

} catch (PDOException $exSchema) {
    // Suppress schema errors in production if they arise (like duplicate columns), 
    // but try-catch prevents breaking existing working MySQL DBs.
}

/**
 * HELPER: Read and parse JSON request body
 */
function getJsonInput() {
    $raw = file_get_contents("php://input");
    return json_decode($raw, true) ?: [];
}


/**
 * =========================================================================
 * SQL SCHEMA FOR YOUR phpMyAdmin (Copy & paste into the SQL box on InfinityFree)
 * =========================================================================
 
 CREATE TABLE IF NOT EXISTS users (
   id VARCHAR(100) PRIMARY KEY,
   username VARCHAR(100) UNIQUE DEFAULT NULL,
   password VARCHAR(255) DEFAULT NULL,
   role VARCHAR(50) DEFAULT 'Team Member',
   fullName VARCHAR(255) DEFAULT NULL,
   whatsapp VARCHAR(255) DEFAULT NULL,
   email VARCHAR(255) DEFAULT NULL,
   facebookLink VARCHAR(255) DEFAULT NULL,
   instagramLink VARCHAR(255) DEFAULT NULL,
   portfolioLink VARCHAR(255) DEFAULT NULL,
   assignedProjectName VARCHAR(255) DEFAULT NULL,
   clientName VARCHAR(255) DEFAULT NULL,
   projectStatus VARCHAR(100) DEFAULT NULL,
   projectDeadline VARCHAR(100) DEFAULT NULL,
   projectProgress INT DEFAULT 0,
   notes TEXT DEFAULT NULL,
   createdAt VARCHAR(100) DEFAULT NULL,
   deletedAt VARCHAR(100) DEFAULT NULL
 );

 CREATE TABLE IF NOT EXISTS leads (
   id VARCHAR(100) PRIMARY KEY,
   name VARCHAR(255) NOT NULL,
   email VARCHAR(255),
   phone VARCHAR(50),
   company VARCHAR(255),
   status VARCHAR(50) DEFAULT 'New',
   value DECIMAL(15, 2) DEFAULT 0,
   source VARCHAR(100) DEFAULT 'Direct',
   notes TEXT,
   createdAt VARCHAR(100),
   updatedAt VARCHAR(100)
 );

 CREATE TABLE IF NOT EXISTS clients (
   id VARCHAR(100) PRIMARY KEY,
   name VARCHAR(255) NOT NULL,
   email VARCHAR(255),
   phone VARCHAR(50),
   company VARCHAR(255),
   activeProjects INT DEFAULT 0,
   totalValue DECIMAL(15, 2) DEFAULT 0,
   status VARCHAR(50) DEFAULT 'Active',
   projectProgress INT DEFAULT 0,
   notes TEXT
 );

 CREATE TABLE IF NOT EXISTS goals (
   id VARCHAR(100) PRIMARY KEY,
   title VARCHAR(255) NOT NULL,
   category VARCHAR(100),
   current DECIMAL(15, 2) DEFAULT 0,
   target DECIMAL(15, 2) DEFAULT 0,
   unit VARCHAR(50),
   deadline VARCHAR(100)
 );

 CREATE TABLE IF NOT EXISTS call_history (
   id VARCHAR(100) PRIMARY KEY,
   leadId VARCHAR(100),
   leadName VARCHAR(255),
   duration INT DEFAULT 0,
   status VARCHAR(100),
   notes TEXT,
   timestamp VARCHAR(100)
 );

 /* CREATE TABLE IF NOT EXISTS team_members_merged_with_users ( */
   id VARCHAR(100) PRIMARY KEY,
   fullName VARCHAR(255) NOT NULL,
   role VARCHAR(100),
   whatsapp VARCHAR(100),
   email VARCHAR(255),
   facebookLink VARCHAR(255),
   instagramLink VARCHAR(255),
   portfolioLink VARCHAR(255),
   assignedProjectName VARCHAR(255),
   clientName VARCHAR(255),
   projectStatus VARCHAR(100),
   projectDeadline VARCHAR(100),
   projectProgress INT DEFAULT 0,
   notes TEXT,
   createdAt VARCHAR(100)
 );

 CREATE TABLE IF NOT EXISTS settings (
   setting_key VARCHAR(100) PRIMARY KEY,
   setting_value TEXT
 );

 -- SEED DEFAULT DATA
 INSERT INTO users (id, username, password) VALUES ('user-1', 'zyqro87+', 'digital97@-')
 ON DUPLICATE KEY UPDATE username=VALUES(username), password=VALUES(password);

 INSERT INTO settings (setting_key, setting_value) VALUES ('portal_url', 'https://dash.infinityfree.com/accounts')
 ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);

 INSERT INTO settings (setting_key, setting_value) VALUES ('preview_url', 'https://zyqrodigi.site.je')
 ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);

 INSERT INTO goals (id, title, category, current, target, unit, deadline) VALUES 
 ('1', 'Revenue Target', 'Financial', 0, 20000, '$', 'June 30, 2026'),
 ('2', 'Leads Target', 'Marketing', 0, 10, 'leads', 'June 30, 2026'),
 ('3', 'Onboarded Clients', 'Operations', 0, 5, 'clients', 'June 30, 2026')
 ON DUPLICATE KEY UPDATE title=VALUES(title);
 
*/
