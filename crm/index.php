<?php
/**
 * InfinityFree CRM Entry Portal
 */
session_start();

// If user is already logged in, redirect to dashboard. Otherwise, redirect to login page.
if (isset($_SESSION['user_id'])) {
    header("Location: dashboard.php");
    exit();
} else {
    header("Location: login.php");
    exit();
}
