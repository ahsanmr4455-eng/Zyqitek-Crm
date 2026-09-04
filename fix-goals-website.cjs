const fs = require('fs');

const fixFile = (path) => {
    let content = fs.readFileSync(path, 'utf8');
    const orig = content;
    
    // Replace card backgrounds
    content = content.replace(/bg-\[var\(--crm-bg\)\] rounded-\[20px\] p-5 border/g, 'bg-[var(--crm-card)] rounded-[24px] p-6 sm:p-8 border');
    
    // Replace icon containers (just making them consistent sizes for now)
    content = content.replace(/h-12 w-12 rounded-2xl bg-\[var\(--crm-card\)\] border border-\[var\(--crm-card-border\)\] text-\[var\(--crm-text\)\]/g, 'h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50');
    content = content.replace(/h-12 w-12 rounded-2xl bg-\[var\(--crm-card\)\] border border-\[var\(--crm-card-border\)\] text-indigo-600/g, 'h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50');
    content = content.replace(/h-12 w-12 rounded-2xl bg-\[var\(--crm-card\)\] border border-\[var\(--crm-card-border\)\] text-emerald-600/g, 'h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50');

    // Also fix the grid to match Dashboard/TeamManager if needed
    // Dashboard: gap-3 sm:gap-4 or gap-4 sm:gap-6
    content = content.replace(/gap-5/g, 'gap-4 sm:gap-6');

    if (orig !== content) {
        fs.writeFileSync(path, content);
        console.log(`Fixed styling in ${path}`);
    }
};

fixFile('src/components/GoalsView.tsx');
fixFile('src/components/WebsiteView.tsx');

