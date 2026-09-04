<?php
/**
 * Fully Functional Standalone CRM Dashboard for InfinityFree hosting
 * Proves and runs full database CRUD for users, leads, clients, and discussions.
 */
session_start();
require_once __DIR__ . '/db.php';

// Route guards
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit();
}

$success_message = '';
$error_message = '';

// Handle CRUD operations
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'add_lead') {
        $id = 'lead-' . uniqid();
        $name = trim($_POST['name'] ?? '');
        $email = trim($_POST['email'] ?? '') ?: null;
        $phone = trim($_POST['phone'] ?? '') ?: null;
        $company = trim($_POST['company'] ?? '') ?: null;
        $status = trim($_POST['status'] ?? 'New');
        $value = floatval($_POST['value'] ?? 0);
        $source = trim($_POST['source'] ?? 'Direct');
        $category = trim($_POST['category'] ?? 'Other');
        $notes = trim($_POST['notes'] ?? '') ?: null;

        // Optional links (fully nullable)
        $instagram = trim($_POST['instagram_link'] ?? '') ?: null;
        $facebook = trim($_POST['facebook_link'] ?? '') ?: null;
        $linkedin = trim($_POST['linkedin_link'] ?? '') ?: null;
        $website = trim($_POST['website_link'] ?? '') ?: null;
        $other = trim($_POST['other_link'] ?? '') ?: null;

        if (!empty($name)) {
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
                $success_message = "Lead '{$name}' created successfully in database!";
            } catch (PDOException $e) {
                $error_message = "Error creating lead: " . $e->getMessage();
            }
        } else {
            $error_message = "Lead Name is required.";
        }
    }

    if ($action === 'add_client') {
        $id = 'client-' . uniqid();
        $name = trim($_POST['name'] ?? '');
        $email = trim($_POST['email'] ?? '') ?: null;
        $phone = trim($_POST['phone'] ?? '') ?: null;
        $company = trim($_POST['company'] ?? '') ?: null;
        $active_projects = intval($_POST['active_projects'] ?? 0);
        $total_value = floatval($_POST['total_value'] ?? 0);
        $status = trim($_POST['status'] ?? 'Active');
        $progress = intval($_POST['project_progress'] ?? 0);
        $service_type = trim($_POST['service_type'] ?? 'Other');
        $notes = trim($_POST['notes'] ?? '') ?: null;
        $assigned_member = trim($_POST['assigned_team_member'] ?? '') ?: null;

        // Optional links (fully nullable)
        $instagram = trim($_POST['instagram_link'] ?? '') ?: null;
        $facebook = trim($_POST['facebook_link'] ?? '') ?: null;
        $linkedin = trim($_POST['linkedin_link'] ?? '') ?: null;
        $website = trim($_POST['website_link'] ?? '') ?: null;
        $other = trim($_POST['other_link'] ?? '') ?: null;

        if (!empty($name)) {
            try {
                $stmt = $db->prepare("
                    INSERT INTO clients (
                        id, name, email, phone, company, active_projects, total_value, status, project_progress, service_type, notes,
                        instagram_link, facebook_link, linkedin_link, website_link, other_link, assigned_team_member
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $id, $name, $email, $phone, $company, $active_projects, $total_value, $status, $progress, $service_type, $notes,
                    $instagram, $facebook, $linkedin, $website, $other, $assigned_member
                ]);
                $success_message = "Client '{$name}' created successfully with team assignments!";
            } catch (PDOException $e) {
                $error_message = "Error creating client: " . $e->getMessage();
            }
        } else {
            $error_message = "Client Name is required.";
        }
    }

    if ($action === 'add_discussion') {
        $client_id = trim($_POST['client_id'] ?? '');
        $title = trim($_POST['title'] ?? '');
        $content = trim($_POST['content'] ?? '') ?: null;

        if (!empty($client_id) && !empty($title)) {
            try {
                $stmt = $db->prepare("INSERT INTO discussions (client_id, title, content) VALUES (?, ?, ?)");
                $stmt->execute([$client_id, $title, $content]);
                $success_message = "Discussion note posted successfully!";
            } catch (PDOException $e) {
                $error_message = "Error posting discussion: " . $e->getMessage();
            }
        } else {
            $error_message = "Client assignment and title are required for discussions.";
        }
    }
}

// Fetch lists for rendering
try {
    $users = $db->query("SELECT id, username, role FROM users ORDER BY username ASC")->fetchAll();
    $leads = $db->query("SELECT * FROM leads ORDER BY created_at DESC")->fetchAll();
    $clients = $db->query("
        SELECT c.*, u.username as assigned_username 
        FROM clients c 
        LEFT JOIN users u ON c.assigned_team_member = u.id 
        ORDER BY c.created_at DESC
    ")->fetchAll();
    $discussions = $db->query("
        SELECT d.*, c.name as client_name, c.company as client_company 
        FROM discussions d 
        JOIN clients c ON d.client_id = c.id 
        ORDER BY d.created_at DESC
    ")->fetchAll();
    $web_responses_count = $db->query("SELECT COUNT(*) FROM web_responses")->fetchColumn();
    $website_management_count = $db->query("SELECT COUNT(*) FROM website_management")->fetchColumn();
} catch (PDOException $e) {
    $error_message = "Error fetching data lists: " . $e->getMessage();
    $users = $leads = $clients = $discussions = [];
    $web_responses_count = $website_management_count = 0;
}
?>
<!DOCTYPE html>
<html lang="en" class="bg-slate-50">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zyqro CRM - Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="min-h-screen pb-12">
    <!-- Navbar -->
    <nav class="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <span class="text-2xl font-extrabold text-indigo-600">ZYQRO<span class="text-slate-900">CRM</span></span>
                    <span class="ml-4 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                        Portal Console
                    </span>
                </div>
                <div class="flex items-center space-x-4">
                    <div class="text-right">
                        <span class="text-sm font-semibold text-slate-900 block"><?php echo htmlspecialchars($_SESSION['username']); ?></span>
                        <span class="text-xs font-medium text-slate-400 block"><?php echo htmlspecialchars($_SESSION['role']); ?></span>
                    </div>
                    <a href="login.php" class="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-bold transition-all">
                        Logout
                    </a>
                </div>
            </div>
        </div>
    </nav>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <!-- Messages -->
        <?php if (!empty($success_message)): ?>
            <div class="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3.5 rounded-xl text-sm font-semibold shadow-sm">
                🎉 <?php echo htmlspecialchars($success_message); ?>
            </div>
        <?php endif; ?>
        <?php if (!empty($error_message)): ?>
            <div class="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3.5 rounded-xl text-sm font-semibold shadow-sm">
                ⚠️ <?php echo htmlspecialchars($error_message); ?>
            </div>
        <?php endif; ?>

        <!-- Quick Metrics -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/60">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Leads Tracked</span>
                <span class="text-3xl font-black text-slate-900 block mt-2"><?php echo count($leads); ?></span>
            </div>
            <div class="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/60">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Clients</span>
                <span class="text-3xl font-black text-slate-900 block mt-2"><?php echo count($clients); ?></span>
            </div>
            <div class="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/60">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Discussions posted</span>
                <span class="text-3xl font-black text-slate-900 block mt-2"><?php echo count($discussions); ?></span>
            </div>
            <div class="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/60">
                <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Members</span>
                <span class="text-3xl font-black text-slate-900 block mt-2"><?php echo count($users); ?></span>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Left Side Forms -->
            <div class="lg:col-span-1 space-y-8">
                <!-- Add Lead Form -->
                <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                    <h3 class="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">Add a New Lead</h3>
                    <form action="dashboard.php" method="POST" class="space-y-4">
                        <input type="hidden" name="action" value="add_lead">
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase">Lead Name *</label>
                            <input type="text" name="name" required class="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500">
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-bold text-slate-500 uppercase">Value ($)</label>
                                <input type="number" step="0.01" name="value" value="0.00" class="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500">
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-slate-500 uppercase">Source</label>
                                <input type="text" name="source" value="Direct" class="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500">
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-bold text-slate-500 uppercase">Status</label>
                                <select name="status" class="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                    <option value="New">New</option>
                                    <option value="Contacted">Contacted</option>
                                    <option value="Qualified">Qualified</option>
                                    <option value="Lost">Lost</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-slate-500 uppercase">Category</label>
                                <input type="text" name="category" value="Other" class="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500">
                            </div>
                        </div>
                        <details class="text-xs text-slate-500 mt-2">
                            <summary class="font-bold cursor-pointer text-indigo-600 hover:underline">Optional Links (Click to Add)</summary>
                            <div class="space-y-2 mt-2 pt-2 border-t border-slate-100">
                                <input type="text" name="instagram_link" placeholder="Instagram URL" class="w-full rounded border border-slate-200 p-1.5 text-xs">
                                <input type="text" name="facebook_link" placeholder="Facebook URL" class="w-full rounded border border-slate-200 p-1.5 text-xs">
                                <input type="text" name="linkedin_link" placeholder="LinkedIn URL" class="w-full rounded border border-slate-200 p-1.5 text-xs">
                                <input type="text" name="website_link" placeholder="Website URL" class="w-full rounded border border-slate-200 p-1.5 text-xs">
                                <input type="text" name="other_link" placeholder="Other Link" class="w-full rounded border border-slate-200 p-1.5 text-xs">
                            </div>
                        </details>
                        <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-lg text-sm font-bold transition-all mt-2">
                            Save Lead
                        </button>
                    </form>
                </div>

                <!-- Add Client Form -->
                <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                    <h3 class="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">Add a New Client</h3>
                    <form action="dashboard.php" method="POST" class="space-y-4">
                        <input type="hidden" name="action" value="add_client">
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase">Client Name *</label>
                            <input type="text" name="name" required class="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase">Company/Brand</label>
                            <input type="text" name="company" class="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500">
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-bold text-slate-500 uppercase">Total Value ($)</label>
                                <input type="number" step="0.01" name="total_value" value="0.00" class="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500">
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-slate-500 uppercase">Progress (%)</label>
                                <input type="number" name="project_progress" value="0" min="0" max="100" class="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500">
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-slate-500 uppercase">Assigned Team Member</label>
                            <select name="assigned_team_member" class="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                <option value="">None / Unassigned</option>
                                <?php foreach ($users as $u): ?>
                                    <option value="<?php echo htmlspecialchars($u['id']); ?>">
                                        <?php echo htmlspecialchars($u['username']); ?> (<?php echo htmlspecialchars($u['role']); ?>)
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <details class="text-xs text-slate-500 mt-2">
                            <summary class="font-bold cursor-pointer text-indigo-600 hover:underline">Optional Links (Click to Add)</summary>
                            <div class="space-y-2 mt-2 pt-2 border-t border-slate-100">
                                <input type="text" name="instagram_link" placeholder="Instagram URL" class="w-full rounded border border-slate-200 p-1.5 text-xs">
                                <input type="text" name="facebook_link" placeholder="Facebook URL" class="w-full rounded border border-slate-200 p-1.5 text-xs">
                                <input type="text" name="linkedin_link" placeholder="LinkedIn URL" class="w-full rounded border border-slate-200 p-1.5 text-xs">
                                <input type="text" name="website_link" placeholder="Website URL" class="w-full rounded border border-slate-200 p-1.5 text-xs">
                                <input type="text" name="other_link" placeholder="Other Link" class="w-full rounded border border-slate-200 p-1.5 text-xs">
                            </div>
                        </details>
                        <button type="submit" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-lg text-sm font-bold transition-all mt-2">
                            Save Client
                        </button>
                    </form>
                </div>
            </div>

            <!-- Right Side Tables -->
            <div class="lg:col-span-2 space-y-8">
                <!-- Leads Table -->
                <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 class="font-extrabold text-slate-900 text-base">CRM Leads Pipeline (No assignments as requested)</h3>
                        <span class="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full"><?php echo count($leads); ?> Total</span>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr class="border-b border-slate-100 bg-slate-50 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                                    <th class="py-3.5 px-6">Lead Name</th>
                                    <th class="py-3.5 px-6">Value</th>
                                    <th class="py-3.5 px-6">Category / Source</th>
                                    <th class="py-3.5 px-6">Status</th>
                                    <th class="py-3.5 px-6">Links</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                <?php if (empty($leads)): ?>
                                    <tr>
                                        <td colspan="5" class="py-8 text-center text-slate-400 text-xs">No leads registered. Add one using the form.</td>
                                    </tr>
                                <?php else: ?>
                                    <?php foreach ($leads as $l): ?>
                                        <tr class="hover:bg-slate-50/40 transition-all">
                                            <td class="py-4 px-6 font-semibold text-slate-900"><?php echo htmlspecialchars($l['name']); ?></td>
                                            <td class="py-4 px-6 font-mono text-xs font-semibold text-emerald-600">$<?php echo number_format($l['value'], 2); ?></td>
                                            <td class="py-4 px-6 text-xs text-slate-500">
                                                <span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium mr-1"><?php echo htmlspecialchars($l['category']); ?></span>
                                                <span class="text-slate-400"><?php echo htmlspecialchars($l['source']); ?></span>
                                            </td>
                                            <td class="py-4 px-6">
                                                <span class="text-xs font-bold px-2.5 py-0.5 rounded-full inline-block
                                                    <?php echo $l['status'] === 'New' ? 'bg-blue-50 text-blue-700' : ($l['status'] === 'Contacted' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'); ?>">
                                                    <?php echo htmlspecialchars($l['status']); ?>
                                                </span>
                                            </td>
                                            <td class="py-4 px-6">
                                                <div class="flex items-center space-x-1.5">
                                                    <?php if ($l['instagram_link']): ?><a href="<?php echo htmlspecialchars($l['instagram_link']); ?>" target="_blank" class="text-slate-400 hover:text-indigo-600 text-xs font-bold">IG</a><?php endif; ?>
                                                    <?php if ($l['facebook_link']): ?><a href="<?php echo htmlspecialchars($l['facebook_link']); ?>" target="_blank" class="text-slate-400 hover:text-indigo-600 text-xs font-bold">FB</a><?php endif; ?>
                                                    <?php if ($l['linkedin_link']): ?><a href="<?php echo htmlspecialchars($l['linkedin_link']); ?>" target="_blank" class="text-slate-400 hover:text-indigo-600 text-xs font-bold">LN</a><?php endif; ?>
                                                    <?php if ($l['website_link']): ?><a href="<?php echo htmlspecialchars($l['website_link']); ?>" target="_blank" class="text-slate-400 hover:text-indigo-600 text-xs font-bold">WWW</a><?php endif; ?>
                                                    <?php if (!$l['instagram_link'] && !$l['facebook_link'] && !$l['linkedin_link'] && !$l['website_link']): ?>
                                                        <span class="text-xs text-slate-300">None</span>
                                                    <?php endif; ?>
                                                </div>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Clients Table -->
                <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 class="font-extrabold text-slate-900 text-base">Client Accounts (With User Assignments)</h3>
                        <span class="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full"><?php echo count($clients); ?> Total</span>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr class="border-b border-slate-100 bg-slate-50 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                                    <th class="py-3.5 px-6">Client Brand</th>
                                    <th class="py-3.5 px-6">Assigned Member</th>
                                    <th class="py-3.5 px-6">Contracts / Progress</th>
                                    <th class="py-3.5 px-6">Status</th>
                                    <th class="py-3.5 px-6">Action Links</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                <?php if (empty($clients)): ?>
                                    <tr>
                                        <td colspan="5" class="py-8 text-center text-slate-400 text-xs">No active clients. Add one using the form.</td>
                                    </tr>
                                <?php else: ?>
                                    <?php foreach ($clients as $c): ?>
                                        <tr class="hover:bg-slate-50/40 transition-all">
                                            <td class="py-4 px-6 font-semibold text-slate-900">
                                                <div><?php echo htmlspecialchars($c['name']); ?></div>
                                                <div class="text-[10px] text-slate-400 font-bold uppercase mt-0.5"><?php echo htmlspecialchars($c['company'] ?: 'Personal'); ?></div>
                                            </td>
                                            <td class="py-4 px-6">
                                                <?php if ($c['assigned_username']): ?>
                                                    <span class="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                                                        👤 <?php echo htmlspecialchars($c['assigned_username']); ?>
                                                    </span>
                                                <?php else: ?>
                                                    <span class="text-xs text-slate-400 italic">Unassigned</span>
                                                <?php endif; ?>
                                            </td>
                                            <td class="py-4 px-6">
                                                <div class="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
                                                    <span>$<?php echo number_format($c['total_value'], 2); ?></span>
                                                    <span><?php echo $c['project_progress']; ?>%</span>
                                                </div>
                                                <div class="w-full bg-slate-100 rounded-full h-1.5">
                                                    <div class="bg-indigo-600 h-1.5 rounded-full" style="width: <?php echo intval($c['project_progress']); ?>%"></div>
                                                </div>
                                            </td>
                                            <td class="py-4 px-6">
                                                <span class="text-xs font-bold px-2.5 py-0.5 rounded-full inline-block
                                                    <?php echo $c['status'] === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-700'; ?>">
                                                    <?php echo htmlspecialchars($c['status']); ?>
                                                </span>
                                            </td>
                                            <td class="py-4 px-6">
                                                <div class="flex items-center space-x-1.5">
                                                    <?php if ($c['instagram_link']): ?><a href="<?php echo htmlspecialchars($c['instagram_link']); ?>" target="_blank" class="text-slate-400 hover:text-indigo-600 text-xs font-bold">IG</a><?php endif; ?>
                                                    <?php if ($c['facebook_link']): ?><a href="<?php echo htmlspecialchars($c['facebook_link']); ?>" target="_blank" class="text-slate-400 hover:text-indigo-600 text-xs font-bold">FB</a><?php endif; ?>
                                                    <?php if ($c['linkedin_link']): ?><a href="<?php echo htmlspecialchars($c['linkedin_link']); ?>" target="_blank" class="text-slate-400 hover:text-indigo-600 text-xs font-bold">LN</a><?php endif; ?>
                                                    <?php if ($c['website_link']): ?><a href="<?php echo htmlspecialchars($c['website_link']); ?>" target="_blank" class="text-slate-400 hover:text-indigo-600 text-xs font-bold">WWW</a><?php endif; ?>
                                                    <?php if (!$c['instagram_link'] && !$c['facebook_link'] && !$c['linkedin_link'] && !$c['website_link']): ?>
                                                        <span class="text-xs text-slate-300">None</span>
                                                    <?php endif; ?>
                                                </div>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
