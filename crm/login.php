<?php
/**
 * Secure CRM Login Page for InfinityFree hosting
 */
session_start();
require_once __DIR__ . '/db.php';

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = trim($_POST['password'] ?? '');

    if (!empty($username) && !empty($password)) {
        try {
            $stmt = $db->prepare("SELECT * FROM users WHERE username = ? LIMIT 1");
            $stmt->execute([$username]);
            $user = $stmt->fetch();

            if ($user) {
                // Verify via bcrypt first, fallback to direct string match for easy defaults
                if (password_verify($password, $user['password']) || $password === $user['password'] || md5($password) === $user['password']) {
                    $_SESSION['user_id'] = $user['id'];
                    $_SESSION['username'] = $user['username'];
                    $_SESSION['role'] = $user['role'] ?? 'Team Member';

                    header("Location: dashboard.php");
                    exit();
                } else {
                    $error = "Incorrect password. Please try again.";
                }
            } else {
                $error = "User not found.";
            }
        } catch (PDOException $e) {
            $error = "Database query error: " . $e->getMessage();
        }
    } else {
        $error = "Please fill in all fields.";
    }
}
?>
<!DOCTYPE html>
<html lang="en" class="h-full bg-slate-50">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zyqro CRM - Portal Login</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
        }
    </style>
</head>
<body class="h-full flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto $w-full sm:max-w-md">
        <!-- Logo / Branding Header -->
        <div class="text-center">
            <span class="text-3xl font-extrabold tracking-tight text-indigo-600">ZYQRO<span class="text-slate-900">CRM</span></span>
            <h2 class="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">Sign in to your CRM portal</h2>
            <p class="mt-2 text-center text-sm text-slate-500">
                InfinityFree Hosted Database Management
            </p>
        </div>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-white py-8 px-4 shadow-xl sm:rounded-xl sm:px-10 border border-slate-100">
            <?php if (!empty($error)): ?>
                <div class="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm" role="alert">
                    <span class="font-semibold">Error:</span> <?php echo htmlspecialchars($error); ?>
                </div>
            <?php endif; ?>

            <form class="space-y-6" action="login.php" method="POST">
                <div>
                    <label for="username" class="block text-xs font-bold uppercase tracking-wider text-slate-500">Username</label>
                    <div class="mt-1">
                        <input id="username" name="username" type="text" required 
                               value="<?php echo htmlspecialchars($username ?? ''); ?>"
                               class="block w-full appearance-none rounded-lg border border-slate-200 px-3 py-2.5 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm bg-slate-50 focus:bg-white transition-all">
                    </div>
                </div>

                <div>
                    <label for="password" class="block text-xs font-bold uppercase tracking-wider text-slate-500">Password</label>
                    <div class="mt-1">
                        <input id="password" name="password" type="password" required 
                               class="block w-full appearance-none rounded-lg border border-slate-200 px-3 py-2.5 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm bg-slate-50 focus:bg-white transition-all">
                    </div>
                </div>

                <div>
                    <button type="submit" 
                            class="flex w-full justify-center rounded-lg border border-transparent bg-indigo-600 py-3 px-4 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all">
                        Sign In
                    </button>
                </div>
            </form>

            <div class="mt-6 border-t border-slate-100 pt-6">
                <div class="text-xs text-slate-400 text-center space-y-1">
                    <p>Database: <span class="font-mono bg-slate-50 px-1 py-0.5 rounded text-indigo-600">if0_42335838_zqportal</span></p>
                    <p>Host: <span class="font-mono bg-slate-50 px-1 py-0.5 rounded">sql302.infinityfree.com</span></p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
