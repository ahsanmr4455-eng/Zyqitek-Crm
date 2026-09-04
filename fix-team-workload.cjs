const fs = require('fs');

let content = fs.readFileSync('src/components/TeamManager.tsx', 'utf8');
const orig = content;

// Remove the tab button for workload
content = content.replace(
  /<button\s+onClick=\{\(\) => setActiveTab\('workload'\)\}[\s\S]*?<\/button>/,
  ""
);

// We'll add a state for `showWorkloadModal` or `showWorkloadPlanner`
// Let's add the button to the header instead.
content = content.replace(
  /<button \n              id="btn-add-team-member"/,
  `<button 
              onClick={() => setActiveTab('workload')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--crm-sidebar)] hover:bg-[var(--crm-sidebar-active-bg)] text-[var(--crm-text)] border border-[var(--crm-card-border)] text-xs font-medium rounded-xl transition-all cursor-pointer shadow-sm active:scale-98"
            >
              <Compass size={15} /> <span>Workload Planner</span>
            </button>
            <button 
              id="btn-add-team-member"`
);

// Since we're still using activeTab === 'workload', we don't need a new state, just the button moved.
// Wait, if activeTab is 'workload', then the 'members' tab will be unselected, but there is no 'workload' tab. 
// Let's add a "Back to Members" button inside the workload planner, or just let them click "Team Members" tab.
// Actually, if we just move the button to the top right, they can still click "Team Members" tab to go back.
// But wait, the "Add Team Member" button is only shown if activeTab === 'members'. So if activeTab === 'workload', the workload planner button and add member button disappear.
content = content.replace(
  /\{activeTab === 'members' && \(\s*<button/,
  `<button 
              onClick={() => setActiveTab(activeTab === 'workload' ? 'members' : 'workload')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--crm-sidebar)] hover:bg-[var(--crm-sidebar-active-bg)] text-[var(--crm-text)] border border-[var(--crm-card-border)] text-xs font-medium rounded-xl transition-all cursor-pointer shadow-sm active:scale-98"
            >
              {activeTab === 'workload' ? <><Users size={15} /> <span>Back to Team</span></> : <><Compass size={15} /> <span>Workload Planner</span></>}
            </button>
            {activeTab === 'members' && (
            <button`
);

if (orig !== content) {
    fs.writeFileSync('src/components/TeamManager.tsx', content);
    console.log("Updated TeamManager workload button");
}

