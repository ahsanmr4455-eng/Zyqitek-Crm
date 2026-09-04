const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const orig = content;
      
      // Remove specific dark mode hardcoded colors that conflict with variables
      content = content.replace(/dark:bg-\[#20242B\]\s*/g, '');
      content = content.replace(/dark:bg-\[#1A1D23\]\s*/g, '');
      content = content.replace(/dark:bg-\[#30353D\]\s*/g, '');
      content = content.replace(/dark:border-\[#30353D\]\s*/g, '');
      content = content.replace(/dark:text-\[#F8FAFC\]\s*/g, '');
      content = content.replace(/dark:text-\[#E5E7EB\]\s*/g, '');
      content = content.replace(/dark:text-\[#9CA3AF\]\s*/g, '');
      content = content.replace(/dark:text-\[#6B7280\]\s*/g, '');
      
      // Remove other hardcoded ones like dark:bg-zinc-900/20, hover:dark:bg-...
      content = content.replace(/hover:dark:bg-\[#20242B\]\/50\s*/g, '');
      content = content.replace(/dark:bg-slate-900\/20\s*/g, '');
      
      // Fix bold text globally
      content = content.replace(/font-bold/g, 'font-semibold');
      content = content.replace(/font-extrabold/g, 'font-bold');

      // Also there were cases of `bg-white dark:bg-[#1A1D23]` which we want to use `bg-[var(--crm-card)]`
      // Wait, let's just let global tokens do the job. If there are things like `bg-white`, they're hardcoded.
      
      // Soften accent badge backgrounds for both light and dark. 
      // The CSS file handles the soft badge generation globally now with overrides, so we can leave the classes as `bg-emerald-500/10` etc.
      // But let's fix `text-emerald-700` and `text-rose-700` in dark mode? Actually, they should probably just use `text-emerald-600` or the CSS handles `text-emerald-500` and `400`. 
      
      if (orig !== content) {
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

processDir(path.join(__dirname, 'src'));
console.log("Done fixing theme overrides.");
