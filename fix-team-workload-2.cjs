const fs = require('fs');

let content = fs.readFileSync('src/components/TeamManager.tsx', 'utf8');

content = content.replace(
  /<button \n              onClick=\{\(\) => setActiveTab\('workload'\)\}[\s\S]*?<\/button>/,
  ""
);

// We should also remove the main tab container if 'members' and 'preHiring' are the only ones left, 
// let's just leave the tabs or maybe move preHiring to the top right too.
// "Remove the 'Team Workload & Capacity Planner' from its current prominent/default view. Instead, integrate it as an actionable option, tab, or sub-menu"
// The workload planner is already handled in the top right.
fs.writeFileSync('src/components/TeamManager.tsx', content);

