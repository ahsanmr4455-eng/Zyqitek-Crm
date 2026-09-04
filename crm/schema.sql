-- =========================================================================
-- ZYQRO DIGITAL ENTERPRISE CRM DATABASE SCHEMA
-- Target System: MySQL / MariaDB (phpMyAdmin direct import compatible)
-- Database Name: if0_42335838_crm3
-- Generated: 2026-07-06
-- =========================================================================

CREATE DATABASE IF NOT EXISTS if0_42335838_crm3;
USE if0_42335838_crm3;

-- Disable foreign key checks for safe schema teardown & recreation
SET FOREIGN_KEY_CHECKS = 0;

-- Drop obsolete or unused tables if present (Safe Clean Build)
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS calendar_events;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS file_uploads;
DROP TABLE IF EXISTS attachments;
DROP TABLE IF EXISTS security_settings;

-- 1. USERS TABLE (Handles Authentication & PHP Team Member Sync)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(100) PRIMARY KEY,
  username VARCHAR(100) UNIQUE DEFAULT NULL,
  password VARCHAR(255) DEFAULT NULL, -- BCrypt password hash (alias: password_hash)
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. TEAM MEMBERS TABLE (Handles Node.js team endpoint)
CREATE TABLE IF NOT EXISTS team (
  id VARCHAR(100) PRIMARY KEY,
  fullName VARCHAR(255) NOT NULL,
  role VARCHAR(100) DEFAULT NULL,
  whatsapp VARCHAR(100) DEFAULT NULL,
  email VARCHAR(255) DEFAULT NULL,
  facebookLink VARCHAR(255) DEFAULT NULL,
  instagramLink VARCHAR(255) DEFAULT NULL,
  portfolioLink VARCHAR(255) DEFAULT NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. USER SESSIONS TABLE
CREATE TABLE IF NOT EXISTS user_sessions (
  id VARCHAR(100) PRIMARY KEY,
  token VARCHAR(255) UNIQUE DEFAULT NULL,
  username VARCHAR(100) DEFAULT NULL,
  role VARCHAR(50) DEFAULT NULL,
  csrfToken VARCHAR(255) DEFAULT NULL,
  createdAt VARCHAR(100) DEFAULT NULL,
  expiresAt VARCHAR(100) DEFAULT NULL,
  lastActive VARCHAR(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. LOGIN ATTEMPTS / RATE LOCKOUTS TABLE (Supports both ip and ip_address queries)
CREATE TABLE IF NOT EXISTS login_attempts (
  ip_address VARCHAR(50) PRIMARY KEY,
  failed_attempts INT DEFAULT 0,
  last_failed_login VARCHAR(100) DEFAULT NULL,
  lock_until VARCHAR(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(100) PRIMARY KEY,
  username VARCHAR(100) DEFAULT NULL,
  attempt_time VARCHAR(100) DEFAULT NULL,
  ip_address VARCHAR(50) DEFAULT NULL,
  browser TEXT DEFAULT NULL,
  os TEXT DEFAULT NULL,
  status VARCHAR(50) DEFAULT NULL,
  details TEXT DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. IP RATE LIMITS TABLE
CREATE TABLE IF NOT EXISTS ip_rate_limits (
  ip_address VARCHAR(50) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  request_time INT NOT NULL,
  PRIMARY KEY (ip_address, endpoint, request_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. LEADS TABLE
CREATE TABLE IF NOT EXISTS leads (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) DEFAULT NULL,
  phone VARCHAR(50) DEFAULT NULL,
  company VARCHAR(255) DEFAULT NULL,
  status VARCHAR(50) DEFAULT 'New',
  value DECIMAL(15, 2) DEFAULT 0.00,
  source VARCHAR(100) DEFAULT 'Direct',
  category VARCHAR(100) DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  country VARCHAR(100) DEFAULT NULL,
  createdAt VARCHAR(100) DEFAULT NULL,
  updatedAt VARCHAR(100) DEFAULT NULL,
  deletedAt VARCHAR(100) DEFAULT NULL,
  instagramLink VARCHAR(255) DEFAULT NULL,
  instagram_link VARCHAR(255) GENERATED ALWAYS AS (instagramLink) STORED,
  facebookLink VARCHAR(255) DEFAULT NULL,
  facebook_link VARCHAR(255) GENERATED ALWAYS AS (facebookLink) STORED,
  linkedinLink VARCHAR(255) DEFAULT NULL,
  linkedin_link VARCHAR(255) GENERATED ALWAYS AS (linkedinLink) STORED,
  websiteUrl VARCHAR(255) DEFAULT NULL,
  website_link VARCHAR(255) GENERATED ALWAYS AS (websiteUrl) STORED,
  otherLink VARCHAR(255) DEFAULT NULL,
  other_link VARCHAR(255) GENERATED ALWAYS AS (otherLink) STORED,
  smmPlatformName VARCHAR(255) DEFAULT NULL,
  smmPlannedPosts INT DEFAULT 0,
  smmPostingFrequency VARCHAR(100) DEFAULT NULL,
  smmContentNotes TEXT DEFAULT NULL,
  smmCampaignRequirements TEXT DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. CLIENTS TABLE
CREATE TABLE IF NOT EXISTS clients (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) DEFAULT NULL,
  phone VARCHAR(50) DEFAULT NULL,
  company VARCHAR(255) DEFAULT NULL,
  activeProjects INT DEFAULT 0,
  active_projects INT GENERATED ALWAYS AS (activeProjects) STORED,
  totalValue DECIMAL(15, 2) DEFAULT 0.00,
  total_value DECIMAL(15, 2) GENERATED ALWAYS AS (totalValue) STORED,
  status VARCHAR(50) DEFAULT 'Active',
  projectProgress INT DEFAULT 0,
  project_progress INT GENERATED ALWAYS AS (projectProgress) STORED,
  serviceType VARCHAR(100) DEFAULT NULL,
  service_type VARCHAR(100) GENERATED ALWAYS AS (serviceType) STORED,
  notes TEXT DEFAULT NULL,
  country VARCHAR(100) DEFAULT NULL,
  assignedTeamMember VARCHAR(100) DEFAULT NULL,
  assigned_team_member VARCHAR(100) GENERATED ALWAYS AS (assignedTeamMember) STORED,
  instagramLink VARCHAR(255) DEFAULT NULL,
  instagram_link VARCHAR(255) GENERATED ALWAYS AS (instagramLink) STORED,
  facebookLink VARCHAR(255) DEFAULT NULL,
  facebook_link VARCHAR(255) GENERATED ALWAYS AS (facebookLink) STORED,
  linkedinLink VARCHAR(255) DEFAULT NULL,
  linkedin_link VARCHAR(255) GENERATED ALWAYS AS (linkedinLink) STORED,
  websiteUrl VARCHAR(255) DEFAULT NULL,
  website_link VARCHAR(255) GENERATED ALWAYS AS (websiteUrl) STORED,
  otherLink VARCHAR(255) DEFAULT NULL,
  other_link VARCHAR(255) GENERATED ALWAYS AS (otherLink) STORED,
  smmPlatformName VARCHAR(255) DEFAULT NULL,
  smmPlannedPosts INT DEFAULT 0,
  smmPostingFrequency VARCHAR(100) DEFAULT NULL,
  smmContentNotes TEXT DEFAULT NULL,
  smmCampaignRequirements TEXT DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. GOALS TABLE
CREATE TABLE IF NOT EXISTS goals (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT NULL,
  current DECIMAL(15, 2) DEFAULT 0.00,
  target DECIMAL(15, 2) DEFAULT 0.00,
  unit VARCHAR(50) DEFAULT NULL,
  deadline VARCHAR(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. CALL HISTORY TABLE (PHP usage fallback)
CREATE TABLE IF NOT EXISTS call_history (
  id VARCHAR(100) PRIMARY KEY,
  leadId VARCHAR(100) DEFAULT NULL,
  leadName VARCHAR(255) DEFAULT NULL,
  duration INT DEFAULT 0,
  status VARCHAR(100) DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  timestamp VARCHAR(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. CALLS TABLE (Node.js usage fallback)
CREATE TABLE IF NOT EXISTS calls (
  id VARCHAR(100) PRIMARY KEY,
  leadId VARCHAR(100) DEFAULT NULL,
  leadName VARCHAR(255) DEFAULT NULL,
  duration INT DEFAULT 0,
  status VARCHAR(100) DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  timestamp VARCHAR(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. SETTINGS TABLE (Unified structure supporting row selection)
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE DEFAULT NULL,
  setting_value TEXT DEFAULT NULL,
  portal_url VARCHAR(500) DEFAULT 'https://dash.infinityfree.com/accounts',
  preview_url VARCHAR(500) DEFAULT 'https://zyqrodigi.site.je',
  redirect_url VARCHAR(500) DEFAULT 'https://zyqrodigi.site.je/thank-you',
  redirect_enabled BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. CLIENT DISCUSSIONS TABLE (PHP Backend)
CREATE TABLE IF NOT EXISTS discussions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id VARCHAR(100) DEFAULT NULL,
  title VARCHAR(255) DEFAULT NULL,
  content TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. EMAIL DISCUSSIONS TABLE (Node.js/React Interface)
CREATE TABLE IF NOT EXISTS email_discussions (
  id VARCHAR(100) PRIMARY KEY,
  clientName VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  date VARCHAR(100) NOT NULL,
  direction VARCHAR(50) DEFAULT 'Sent',
  content TEXT DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  followUpStatus VARCHAR(50) DEFAULT 'None',
  attachments TEXT DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. CALL DISCUSSIONS TABLE (Node.js/React Interface)
CREATE TABLE IF NOT EXISTS call_discussions (
  id VARCHAR(100) PRIMARY KEY,
  clientName VARCHAR(255) NOT NULL,
  callDate VARCHAR(100) NOT NULL,
  duration VARCHAR(50) NOT NULL,
  summary TEXT DEFAULT NULL,
  requirements TEXT DEFAULT NULL,
  followUpActions TEXT DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  status VARCHAR(50) DEFAULT 'Connected'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. WEB RESPONSES TABLE (Lead inquiries form submissions)
CREATE TABLE IF NOT EXISTS web_responses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) DEFAULT NULL,
  phone VARCHAR(50) DEFAULT NULL,
  message TEXT DEFAULT NULL,
  source_page VARCHAR(255) DEFAULT NULL,
  status VARCHAR(50) DEFAULT 'Unread',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. PROJECT TRACKING TABLE
CREATE TABLE IF NOT EXISTS project_tracking (
  client_id VARCHAR(100) PRIMARY KEY,
  project_name VARCHAR(255) DEFAULT NULL,
  project_id VARCHAR(100) DEFAULT NULL,
  start_date VARCHAR(100) DEFAULT NULL,
  expected_delivery_date VARCHAR(100) DEFAULT NULL,
  current_status VARCHAR(100) DEFAULT 'Project Received',
  overall_progress INT DEFAULT 0,
  revisions_allowed INT DEFAULT 3,
  revisions_used INT DEFAULT 0,
  delivery_status VARCHAR(100) DEFAULT 'Not Delivered',
  delivery_date VARCHAR(100) DEFAULT NULL,
  delivered_by VARCHAR(255) DEFAULT NULL,
  final_files TEXT DEFAULT NULL,
  delivery_notes TEXT DEFAULT NULL,
  last_updated VARCHAR(100) DEFAULT NULL,
  estimated_time_left VARCHAR(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. PROJECT REVISIONS TABLE
CREATE TABLE IF NOT EXISTS project_revisions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id VARCHAR(100) DEFAULT NULL,
  revision_date VARCHAR(100) DEFAULT NULL,
  status VARCHAR(50) DEFAULT 'Pending',
  notes TEXT DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. PROJECT REVIEWS TABLE
CREATE TABLE IF NOT EXISTS project_reviews (
  client_id VARCHAR(100) PRIMARY KEY,
  rating INT DEFAULT 5,
  message TEXT DEFAULT NULL,
  recommend VARCHAR(50) DEFAULT 'Yes'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. WEBSITE CONFIG/MANAGEMENT TABLE
CREATE TABLE IF NOT EXISTS website_management (
  id INT AUTO_INCREMENT PRIMARY KEY,
  section_name VARCHAR(255) NOT NULL,
  content_key VARCHAR(255) NOT NULL,
  content_value TEXT DEFAULT NULL,
  updated_by VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21. SECURITY SETTINGS TABLE (CRM-wide validation)
CREATE TABLE IF NOT EXISTS security_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  security_code VARCHAR(10) NOT NULL DEFAULT '2005',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- =========================================================================
-- SEED DEFAULT DATA
-- =========================================================================

-- Seed default administrator account (Password: 'digital781')
INSERT INTO users (id, username, password, role, fullName) 
VALUES ('user-1', 'zyqro87', '$2b$10$kRu9HuF2isdTot4jCt7P/utzBDJaojoG0Q5pIcjSPRVXyahU7BMlq', 'Admin', 'Zyqro Administrator')
ON DUPLICATE KEY UPDATE password=VALUES(password), role=VALUES(role), fullName=VALUES(fullName);

-- Seed default application settings
INSERT INTO settings (id, setting_key, setting_value, portal_url, preview_url, redirect_url, redirect_enabled) 
VALUES (1, 'portal_url', 'https://dash.infinityfree.com/accounts', 'https://dash.infinityfree.com/accounts', 'https://zyqrodigi.site.je', 'https://zyqrodigi.site.je/thank-you', TRUE)
ON DUPLICATE KEY UPDATE portal_url=VALUES(portal_url);

-- Seed default goals
INSERT INTO goals (id, title, category, current, target, unit, deadline) VALUES 
('1', 'Revenue Target', 'Financial', 0.00, 20000.00, '$', 'June 30, 2026'),
('2', 'Leads Target', 'Marketing', 0.00, 10.00, 'leads', 'June 30, 2026'),
('3', 'Onboarded Clients', 'Operations', 0.00, 5.00, 'clients', 'June 30, 2026')
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- Seed default security settings
INSERT INTO security_settings (id, security_code) 
VALUES (1, '2005')
ON DUPLICATE KEY UPDATE security_code=VALUES(security_code);
