const fs = require('fs');

let content = fs.readFileSync('src/components/TeamManager.tsx', 'utf8');
const orig = content;

// Rebuild the header actions section to fix the mess
content = content.replace(
  /<div className="flex items-center gap-2">[\s\S]*?\{activeTab === 'members' && \(\s*<button/g,
  `<div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => setActiveTab(activeTab === 'workload' ? 'members' : 'workload')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--crm-card)] hover:bg-[var(--crm-sidebar-active-bg)] text-[var(--crm-text)] border border-[var(--crm-card-border)] text-xs font-medium rounded-xl transition-all cursor-pointer shadow-sm active:scale-98"
            >
              {activeTab === 'workload' ? <><Users size={15} /> <span>Back to Team Members</span></> : <><Compass size={15} /> <span>Workload & Capacity Planner</span></>}
            </button>
          {activeTab === 'members' && (
            <button`
);

fs.writeFileSync('src/components/TeamManager.tsx', content);

