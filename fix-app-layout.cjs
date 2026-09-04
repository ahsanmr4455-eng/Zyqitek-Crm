const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');
const orig = content;

// Remove max-w-7xl and let it be full width but with padding
content = content.replace(
  /: \`p-3 md:p-4.5 lg:p-6 \$\{activeTab === 'leads' \? 'max-w-\[96%\] lg:max-w-\[98%\]' : 'max-w-7xl'\}\`/g,
  ": `p-4 md:p-6 lg:p-8 max-w-full`"
);

// Another check in case it's formatted differently
content = content.replace(
  /activeTab === 'leads' \? 'max-w-\[96%\] lg:max-w-\[98%\]' : 'max-w-7xl'/g,
  "'max-w-full'"
);

if (orig !== content) {
    fs.writeFileSync('src/App.tsx', content);
    console.log("Updated layout in App.tsx");
} else {
    console.log("No layout changes needed in App.tsx");
}
