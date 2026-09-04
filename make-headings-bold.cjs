const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src', 'components');
const files = fs.readdirSync(componentsDir);

files.forEach(file => {
  if (file.endsWith('.tsx') || file.endsWith('.ts')) {
    const fullPath = path.join(componentsDir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    const orig = content;
    
    // Replace font-semibold with font-bold for h1 and h2 main headings
    // e.g. <h1 className="text-2xl sm:text-3xl font-semibold
    content = content.replace(/(<(h1|h2)[^>]*?className="[^"]*?)font-semibold([^"]*?text-2xl[^"]*?">)/g, '$1font-bold$3');
    content = content.replace(/(<(h1|h2)[^>]*?className="[^"]*?text-2xl[^"]*?)font-semibold([^"]*?">)/g, '$1font-bold$3');
    content = content.replace(/(<(h1|h2)[^>]*?className="[^"]*?text-3xl[^"]*?)font-semibold([^"]*?">)/g, '$1font-bold$3');

    // Make sure we also get TeamManager's heading explicitly if it wasn't caught
    // <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--crm-heading)] leading-tight">
    content = content.replace(/className="text-2xl sm:text-3xl font-semibold/g, 'className="text-2xl sm:text-3xl font-bold');

    if (orig !== content) {
      fs.writeFileSync(fullPath, content);
      console.log(`Updated headings to bold in ${file}`);
    }
  }
});
