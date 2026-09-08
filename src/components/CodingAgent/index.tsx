import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Terminal as TerminalIcon, 
  Play, 
  History, 
  Save, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronRight, 
  Undo2, 
  Trash2, 
  Activity, 
  Plus, 
  Search, 
  X, 
  Eye, 
  Code,
  ArrowRight,
  RefreshCw,
  Clock,
  ExternalLink,
  Check,
  Zap,
  ChevronDown,
  Globe,
  Sliders,
  Database,
  Layers,
  Folder,
  File,
  FolderOpen,
  Upload,
  CornerDownRight,
  HelpCircle,
  FileCode,
  Settings,
  Lock,
  MessageSquare
} from 'lucide-react';
import { VirtualFile, Project, Brain, Template, ProjectMemory, ActivityLogItem, BackupVersion, ProposedRevision } from './types';
import { AI_BRAINS, STATIC_TEMPLATES, INITIAL_PROJECTS } from './mockData';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  brainId?: 'atlas' | 'forge' | 'nova';
  plan?: {
    roadmap: { id: string; task: string; status: 'pending' | 'completed'; estimatedMinutes: number }[];
    dbSuggestions: { table: string; columns: string[] }[];
    complexity: 'low' | 'medium' | 'high';
    proposedFiles: { path: string; action: 'create' | 'modify' }[];
  };
  proposal?: {
    path: string;
    description: string;
    content: string;
    status: 'pending' | 'accepted' | 'rejected';
  };
  statusSteps?: { label: string; status: 'pending' | 'active' | 'done' }[];
}

export default function CodingAgent() {
  // --- Navigation & View Mode State ---
  // Left Sidebar switches the active screen inside the center/right workspace
  const [activeSidebarTab, setActiveSidebarTab] = useState<'chat' | 'projects' | 'templates' | 'brains' | 'history' | 'settings'>('chat');
  
  // Center Panel Toggle: 'plan' (Atlas Brain) vs 'build' (Forge/Nova Brain)
  const [activeMode, setActiveMode] = useState<'plan' | 'build'>('plan');

  // --- Workspace Project State ---
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [activeProjectId, setActiveProjectId] = useState<string>('proj-demo-saas');

  const currentProject = projects.find(p => p.id === activeProjectId) || projects[0];
  const [files, setFiles] = useState<VirtualFile[]>(currentProject.files);

  // Sync files back to project when changed
  useEffect(() => {
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return { ...p, files };
      }
      return p;
    }));
  }, [files, activeProjectId]);

  // Sync files state when loading another project
  useEffect(() => {
    const proj = projects.find(p => p.id === activeProjectId);
    if (proj) {
      setFiles(proj.files);
      if (proj.files.length > 0) {
        setActiveFilePath(proj.files[0].path);
        setOpenTabs(proj.files.slice(0, 3).map(f => f.path));
      }
    }
  }, [activeProjectId]);

  // --- Right Panel Tab Navigation ---
  const [rightPanelTab, setRightPanelTab] = useState<'preview' | 'code' | 'files' | 'terminal'>('preview');

  // --- Active Code Editor State ---
  const [activeFilePath, setActiveFilePath] = useState<string>('src/App.tsx');
  const [openTabs, setOpenTabs] = useState<string[]>(['src/App.tsx', 'index.html']);
  const activeFile = files.find(f => f.path === activeFilePath) || files[0] || { path: 'src/App.tsx', content: '', language: 'typescript' };
  const [editorValue, setEditorValue] = useState(activeFile.content);

  // Sync editorValue when active file changes
  useEffect(() => {
    if (activeFile) {
      setEditorValue(activeFile.content);
    }
  }, [activeFilePath, activeFile]);

  // --- AI Brain Configuration ---
  const [selectedBrainId, setSelectedBrainId] = useState<'atlas' | 'forge' | 'nova'>('atlas');
  const activeBrain = AI_BRAINS.find(b => b.id === selectedBrainId) || AI_BRAINS[0];

  // Auto-switch brains based on active mode for standard behavior
  useEffect(() => {
    if (activeMode === 'plan') {
      setSelectedBrainId('atlas');
    } else {
      setSelectedBrainId('forge');
    }
  }, [activeMode]);

  // --- Virtual Project Memory ---
  const [projectMemory, setProjectMemory] = useState<ProjectMemory>({
    projectStructure: 'SaaS Multi-tier Client Billing Core (React, Tailwind)',
    previousDecisions: [
      'Utilize standard client side sandbox compiler modules',
      'Leverage Tailwind CSS directly for widget borders',
      'Inject lightweight reactive states into App context'
    ],
    codingStandards: 'Prettier aligned, strict named type imports, Lucide icon declarations.',
    architectureNotes: [
      { title: 'Data Cache Schema', content: 'Stores billing logs inside temporary local state arrays.' },
      { title: 'Tailwind Presets', content: 'Leverage font-sans for typography with neutral slate backgrounds.' }
    ]
  });

  // --- Backup Snapshot Revisions ---
  const [backups, setBackups] = useState<BackupVersion[]>([
    {
      id: 'snap-initial',
      timestamp: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      description: 'Preloaded Billing Platform core snapshot',
      filesSnapshot: INITIAL_PROJECTS[0].files
    }
  ]);

  // --- Activity System Logs ---
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([
    { id: 'act-1', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), type: 'system', message: 'Zyqro AI Studio workspace initialized.' },
    { id: 'act-2', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), type: 'info', message: 'Standard SaaS Client billing template loaded.' }
  ]);

  const addActivityLog = (type: 'info' | 'success' | 'warning' | 'error', message: string) => {
    setActivityLogs(prev => [
      {
        id: `act-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type,
        message
      },
      ...prev
    ]);
  };

  // --- Virtual Shell Terminal State ---
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'Zyqro Dev Shell v1.2.0 (Dynamic Compilation Active)',
    'Running node sandbox compiler...',
    'Vite local sandbox server active.',
    'Type "help" to display supported commands.',
    ''
  ]);
  const [terminalInput, setTerminalInput] = useState('');
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const addTerminalLog = (text: string) => {
    setTerminalLogs(prev => [...prev, text]);
  };

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  // --- Dynamic Live Browser Sandbox compilation ---
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeReloadKey, setIframeReloadKey] = useState(0);

  const triggerSandboxCompilation = () => {
    if (!iframeRef.current) return;
    
    const indexHtmlFile = files.find(f => f.path === 'index.html') || { content: `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-[var(--crm-sidebar)] text-[var(--crm-text)]"><div id="root"></div></body></html>` };
    const appTsxFile = files.find(f => f.path === 'src/App.tsx') || { content: `export default function App() { return <div class="p-4">Empty App</div>; }` };
    const cssFile = files.find(f => f.path === 'src/index.css') || { content: '' };

    const srcDoc = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Zyqro Live Preview compiler</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  
  <style>
    body { font-family: 'Inter', sans-serif; background-color: #f8fafc; }
    ${cssFile.content}
  </style>
</head>
<body class="p-4 bg-[var(--crm-sidebar)] text-[var(--crm-text)] text-[var(--crm-text)]">
  <div id="root"></div>

  <script type="text/babel">
    try {
      // Clean standard import strings to run directly in browser under Babel
      ${appTsxFile.content.replace(/import\s+.*from\s+['"].*['"];?/g, '')}

      if (typeof App !== 'undefined') {
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
      } else {
        document.getElementById('root').innerHTML = \`
          <div class="p-6 text-center text-[var(--crm-text-muted)] text-xs">
            No default 'App' component found. Verify App.tsx has: export default function App()
          </div>
        \`;
      }
    } catch (err) {
      document.getElementById('root').innerHTML = \`
        <div class="p-5 border border-red-100 bg-red-50 text-red-800 rounded-xl space-y-2">
          <p class="font-medium text-xs">Dynamic Compiler Error</p>
          <pre class="text-[10px] text-red-600 overflow-auto whitespace-pre-wrap font-mono">\${err.message}</pre>
        </div>
      \`;
    }
  </script>
</body>
</html>
    `;
    iframeRef.current.srcdoc = srcDoc;
  };

  useEffect(() => {
    triggerSandboxCompilation();
  }, [files, iframeReloadKey]);

  // --- AI Chat History State ---
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'ai',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      brainId: 'atlas',
      text: `Hello! I am the **${activeBrain.name}**. I've synchronized with your workspace project **${currentProject.name}**.\n\nDescribe what you would like to build or modify. In **Plan Mode**, I will map out comprehensive technical roadmaps and database schemas. In **Build Mode**, I will write, debug, and compile production-ready code directly into your files.`
    }
  ]);
  const [chatInputValue, setChatInputValue] = useState('');
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');

  // --- Modal Forms state ---
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectStack, setNewProjectStack] = useState('React + TypeScript + Tailwind CSS');

  // --- New File state ---
  const [showCreateFilePrompt, setShowCreateFilePrompt] = useState(false);
  const [newFilePath, setNewFilePath] = useState('');

  // --- File System Search state ---
  const [fileFilter, setFileFilter] = useState('');

  // --- Settings states ---
  const [apiKeyMock, setApiKeyMock] = useState('sk-proj-••••••••••••••••••••');
  const [customStandards, setCustomStandards] = useState(projectMemory.codingStandards);

  // --- Handler Actions ---

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const newId = `proj-${Date.now()}`;
    const newProj: Project = {
      id: newId,
      name: newProjectName.trim(),
      description: newProjectDesc.trim() || 'Custom user created workspace.',
      techStack: newProjectStack,
      createdAt: new Date().toISOString().split('T')[0],
      files: [
        {
          path: 'src/App.tsx',
          language: 'typescript',
          content: `// Workspace: ${newProjectName}\nimport React from 'react';\n\nexport default function App() {\n  return (\n    <div className="p-8 text-center space-y-4 bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-2xl max-w-sm mx-auto my-12 shadow-sm">\n      <h2 className="text-sm font-semibold text-[var(--crm-text)] text-[var(--crm-text)]">${newProjectName}</h2>\n      <p className="text-xs text-[var(--crm-text-secondary)] ">${newProjectDesc || 'Created inside Zyqro AI Studio.'}</p>\n      <button className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">Explore</button>\n    </div>\n  );\n}`
        },
        {
          path: 'index.html',
          language: 'html',
          content: `<!DOCTYPE html>\n<html>\n<head>\n  <script src="https://cdn.tailwindcss.com"></script>\n</head>\n<body class="bg-[var(--crm-sidebar)] text-[var(--crm-text)]">\n  <div id="root"></div>\n</body>\n</html>`
        }
      ]
    };

    setProjects(prev => [...prev, newProj]);
    setActiveProjectId(newId);
    setShowCreateProjectModal(false);
    setNewProjectName('');
    setNewProjectDesc('');
    
    addActivityLog('success', `Created new workspace: "${newProj.name}"`);
    setActiveSidebarTab('chat');
    setActiveMode('plan');

    // Add notification to chat
    setChatMessages(prev => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        brainId: 'atlas',
        text: `I've initialized the workspace for **${newProj.name}**! State what you would like to build first so we can generate an architecture plan.`
      }
    ]);
  };

  const handleCloneTemplate = (template: Template) => {
    const newId = `proj-${Date.now()}`;
    const newProj: Project = {
      id: newId,
      name: `Clone of ${template.name}`,
      description: template.description,
      techStack: template.techStack,
      createdAt: new Date().toISOString().split('T')[0],
      files: JSON.parse(JSON.stringify(template.files))
    };

    setProjects(prev => [...prev, newProj]);
    setActiveProjectId(newId);
    addActivityLog('success', `Cloned design template: "${template.name}"`);
    setActiveSidebarTab('chat');
    setActiveMode('build');

    setChatMessages(prev => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        brainId: 'nova',
        text: `Successfully cloned the template **${template.name}**. I loaded the active codebase. Toggle to the **Code** tab on the right to edit files, or ask me to perform automated modifications!`
      }
    ]);
  };

  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilePath.trim()) return;

    const path = newFilePath.trim();
    if (files.some(f => f.path.toLowerCase() === path.toLowerCase())) {
      addActivityLog('error', `File path already exists: ${path}`);
      return;
    }

    const extension = path.split('.').pop() || 'tsx';
    let lang = 'typescript';
    if (extension === 'html') lang = 'html';
    if (extension === 'css') lang = 'css';
    if (extension === 'json') lang = 'json';

    const newFile: VirtualFile = {
      path,
      language: lang,
      content: `// Workspace Module: ${path}\nimport React from 'react';\n\nexport default function Module() {\n  return (\n    <div className="p-4 bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border rounded-xl">\n      <p className="text-xs text-[var(--crm-text-secondary)] ">Module generated: ${path}</p>\n    </div>\n  );\n}`
    };

    setFiles(prev => [...prev, newFile]);
    setActiveFilePath(path);
    if (!openTabs.includes(path)) {
      setOpenTabs(prev => [...prev, path]);
    }
    setRightPanelTab('code');
    setShowCreateFilePrompt(false);
    setNewFilePath('');
    addActivityLog('success', `Created file path: ${path}`);
    addTerminalLog(`$ create ${path} - SUCCESS`);
  };

  const handleSaveActiveFile = () => {
    setFiles(prev => prev.map(f => {
      if (f.path === activeFilePath) {
        return { ...f, content: editorValue };
      }
      return f;
    }));
    addActivityLog('success', `Saved manual modifications to: ${activeFilePath}`);
    addTerminalLog(`$ write ${activeFilePath} - SUCCESS (${editorValue.length} bytes encoded)`);
    triggerSandboxCompilation();
  };

  const handleLinterValidation = () => {
    addActivityLog('info', `Running static validation on ${activeFilePath}`);
    addTerminalLog(`$ tsc --noEmit --path ${activeFilePath}`);
    
    setTimeout(() => {
      const openBrackets = (editorValue.match(/\{/g) || []).length;
      const closeBrackets = (editorValue.match(/\}/g) || []).length;
      
      if (openBrackets !== closeBrackets) {
        const mismatch = Math.abs(openBrackets - closeBrackets);
        addActivityLog('error', `Syntax Validation Failed: ${mismatch} unmatched scope brackets detected!`);
        addTerminalLog(`[LINT_WARN] Mismatched curly braces inside ${activeFilePath}. Open: ${openBrackets}, Close: ${closeBrackets}`);
        addTerminalLog(`✗ Compilation failed with 1 syntax warning.`);
      } else {
        addActivityLog('success', `Linter clean. 0 syntax warnings for ${activeFilePath}`);
        addTerminalLog(`✓ Validation complete on ${activeFilePath}. Compilation parameters green.`);
      }
    }, 400);
  };

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const cmd = terminalInput.trim();
    addTerminalLog(`$ ${cmd}`);
    setTerminalInput('');

    const base = cmd.toLowerCase().split(' ')[0];
    if (base === 'clear') {
      setTerminalLogs([]);
    } else if (base === 'npm' && cmd.includes('install')) {
      const pkg = cmd.split('install ')[1] || 'lucide-react';
      addTerminalLog(`Scanning NPM registry for package: ${pkg}...`);
      setTimeout(() => {
        addTerminalLog(`+ ${pkg}@latest`);
        addTerminalLog(`Added dependency reference to package.json`);
        addActivityLog('success', `Successfully installed module: ${pkg}`);
      }, 500);
    } else if (base === 'git' && cmd.includes('reset')) {
      if (backups.length > 0) {
        setFiles(backups[0].filesSnapshot);
        addActivityLog('warning', `Reverted project to checkpoint: ${backups[0].description}`);
        addTerminalLog(`[GIT] Restored project snapshot: ${backups[0].id}`);
      } else {
        addTerminalLog(`No revision snapshots found.`);
      }
    } else if (base === 'help') {
      addTerminalLog('Supported virtual terminal actions:');
      addTerminalLog('  npm run dev       - Starts Vite compiler and hot reloads');
      addTerminalLog('  npm run lint      - Runs strict syntax validation check');
      addTerminalLog('  npm install <pkg> - Adds mock module dependencies');
      addTerminalLog('  git reset         - Restores workspace to last backup point');
      addTerminalLog('  clear             - Clears terminal terminal logs');
    } else {
      addTerminalLog(`Command "${base}" evaluated successfully within isolated sandbox container.`);
    }
  };

  // --- AI Code Engine Trigger ---
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputValue.trim() || isAiResponding) return;

    const requestText = chatInputValue.trim();
    setChatInputValue('');
    setIsAiResponding(true);

    // 1. Append user message to thread
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: requestText
    };
    setChatMessages(prev => [...prev, userMsg]);

    // 2. Mock AI Agent Thinking Workflow
    const aiResponseId = `msg-${Date.now() + 1}`;
    
    // Insert a thinking message
    const thinkingMsg: ChatMessage = {
      id: aiResponseId,
      sender: 'ai',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      brainId: selectedBrainId,
      text: "Scanning workspace files and calculating changes...",
      statusSteps: [
        { label: 'Scanning codebase files', status: 'active' },
        { label: 'Formulating code patch', status: 'pending' },
        { label: 'Analyzing bracket matches', status: 'pending' }
      ]
    };
    setChatMessages(prev => [...prev, thinkingMsg]);

    // Step 1: Scan
    await new Promise(r => setTimeout(r, 600));
    setChatMessages(prev => prev.map(m => {
      if (m.id === aiResponseId) {
        return {
          ...m,
          statusSteps: [
            { label: 'Scanning codebase files', status: 'done' },
            { label: 'Formulating code patch', status: 'active' },
            { label: 'Analyzing bracket matches', status: 'pending' }
          ]
        };
      }
      return m;
    }));

    // Step 2: Formulate
    await new Promise(r => setTimeout(r, 800));
    setChatMessages(prev => prev.map(m => {
      if (m.id === aiResponseId) {
        return {
          ...m,
          statusSteps: [
            { label: 'Scanning codebase files', status: 'done' },
            { label: 'Formulating code patch', status: 'done' },
            { label: 'Analyzing bracket matches', status: 'active' }
          ]
        };
      }
      return m;
    }));

    // Step 3: Complete & output based on mode
    await new Promise(r => setTimeout(r, 600));

    const lower = requestText.toLowerCase();

    if (activeMode === 'plan') {
      // PLAN MODE: ATLAS brain generates architecture details
      let roadmap = [
        { id: 'r-1', task: 'Review file structure for analytics references', status: 'completed' as const, estimatedMinutes: 5 },
        { id: 'r-2', task: 'Design relational schemas for capture logs', status: 'pending' as const, estimatedMinutes: 10 },
        { id: 'r-3', task: 'Create interactive custom dashboard component', status: 'pending' as const, estimatedMinutes: 20 },
        { id: 'r-4', task: 'Verify compilation integrity and preview sandbox', status: 'pending' as const, estimatedMinutes: 5 }
      ];
      let dbSuggestions = [
        { table: 'analytics_events', columns: ['id (UUID, PK)', 'event_type (VARCHAR)', 'payload (JSONB)', 'created_at (TIMESTAMP)'] }
      ];
      let proposedFiles = [
        { path: 'src/components/SaaSCharts.tsx', action: 'create' as const },
        { path: 'src/App.tsx', action: 'modify' as const }
      ];
      let complexity: 'low' | 'medium' | 'high' = 'medium';

      if (lower.includes('auth') || lower.includes('login') || lower.includes('security')) {
        roadmap = [
          { id: 'r-1', task: 'Analyze gateway auth paths', status: 'completed' as const, estimatedMinutes: 5 },
          { id: 'r-2', task: 'Design relational tables for security logs', status: 'pending' as const, estimatedMinutes: 15 },
          { id: 'r-3', task: 'Incorporate responsive login card gateway layout', status: 'pending' as const, estimatedMinutes: 15 },
          { id: 'r-4', task: 'Audit bracket validation hooks', status: 'pending' as const, estimatedMinutes: 5 }
        ];
        dbSuggestions = [
          { table: 'authorized_profiles', columns: ['id (UUID, PK)', 'email (VARCHAR, UNIQUE)', 'hashed_pass (VARCHAR)', 'last_login (TIMESTAMP)'] },
          { table: 'security_audits', columns: ['id (SERIAL, PK)', 'profile_id (FK)', 'ip_origin (VARCHAR)', 'timestamp (TIME)'] }
        ];
        proposedFiles = [
          { path: 'src/components/LoginAuth.tsx', action: 'create' as const },
          { path: 'src/App.tsx', action: 'modify' as const }
        ];
        complexity = 'high';
      }

      setChatMessages(prev => prev.map(m => {
        if (m.id === aiResponseId) {
          return {
            ...m,
            text: `I have completed the system architecture design based on your requirement: **"${requestText}"**.\n\nReview the proposed technical roadmap, PostgreSQL schemas, and target workspace files below. When you are ready, click **Approve & Initiate Build** to proceed into code generation!`,
            statusSteps: undefined,
            plan: {
              roadmap,
              dbSuggestions,
              proposedFiles,
              complexity
            }
          };
        }
        return m;
      }));
      addActivityLog('info', `Generated system design blueprint for requirement: "${requestText}"`);
    } else {
      // BUILD MODE: FORGE/NOVA writes actual code
      let path = activeFilePath;
      let description = 'Optimize layout colors and spacing structure';
      let content = editorValue;

      if (lower.includes('login') || lower.includes('auth')) {
        path = 'src/components/LoginAuth.tsx';
        description = 'Generate secure authorized login card template with email inputs and mock validation';
        content = `// Authorized Login Gateway Component
import React, { useState } from 'react';

export default function LoginAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [welcome, setWelcome] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setWelcome(true);
    }, 800);
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-2xl shadow-sm space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-sm font-semibold text-[var(--crm-text)] text-[var(--crm-text)]  ">Zyqro Security</h2>
        <p className="text-xs text-[var(--crm-text-secondary)] ">Sign in to initialize secure sandbox token</p>
      </div>

      {welcome ? (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 rounded-xl text-center text-xs font-medium border border-emerald-100">
          ✓ Gateway Verified. Welcome back!
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-medium text-[var(--crm-text-muted)] ">Work Email</label>
            <input 
              type="email" 
              placeholder="name@company.com" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-xl px-3 py-2.5 text-xs text-[var(--crm-text)] text-[var(--crm-text)] outline-none"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-medium text-[var(--crm-text-muted)] ">Security Code</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-xl px-3 py-2.5 text-xs text-[var(--crm-text)] text-[var(--crm-text)] outline-none"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-white font-medium text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            {loading ? 'Authenticating...' : 'Authorize Secure Gateway'}
          </button>
        </form>
      )}
    </div>
  );
}`;
      } else {
        // General UI card
        const cmpName = `Widget_${Math.floor(Math.random() * 900 + 100)}`;
        path = `src/components/${cmpName}.tsx`;
        description = `Create beautiful interactive ${cmpName} component for SaaS workspace analytics.`;
        content = `// Dynamic SaaS Analytics Widget
import React, { useState } from 'react';

export default function ${cmpName}() {
  const [clicks, setClicks] = useState(0);

  return (
    <div className="p-6 bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-2xl shadow-xs space-y-4 max-w-sm mx-auto">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-sm text-[var(--crm-text)] text-[var(--crm-text)]">Dynamic Metric KPI</h3>
        <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 text-[9px] font-medium  rounded">Active</span>
      </div>
      <p className="text-xs text-[var(--crm-text-secondary)] leading-relaxed">
        This component is compiled on-the-fly and rendered directly inside the sandboxed preview environment.
      </p>
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs font-mono text-[var(--crm-text-muted)] ">Interactions: {clicks}</span>
        <button 
          onClick={() => setClicks(c => c + 1)}
          className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors"
        >
          Increment Log
        </button>
      </div>
    </div>
  );
}`;
      }

      setChatMessages(prev => prev.map(m => {
        if (m.id === aiResponseId) {
          return {
            ...m,
            text: `I have constructed a highly optimized code patch for **${path}** based on your instructions.\n\nVerify the details of this generated react script below. Click **Accept & Commit Code** to merge this change directly into your workspace files.`,
            statusSteps: undefined,
            proposal: {
              path,
              description,
              content,
              status: 'pending'
            }
          };
        }
        return m;
      }));
      addActivityLog('info', `Constructed code optimization patch for ${path}`);
    }

    setIsAiResponding(false);
  };

  const handleApprovePlan = (proposedFiles: { path: string; action: 'create' | 'modify' }[]) => {
    // Transition from Plan mode to Build mode
    addActivityLog('success', 'Plan Approved: Transitioning workspace to Build mode.');
    addTerminalLog('--- Architecture Approved ---');
    proposedFiles.forEach((f, idx) => {
      addTerminalLog(`  [BLUEPRINT ${idx+1}] Prepare to ${f.action} file: ${f.path}`);
    });

    // Populate preloaded boilerplate revisions inside a new Chat builder message
    setActiveMode('build');
    
    // Auto-create code generators in build thread
    const newFilesList = proposedFiles.map(pf => {
      return {
        path: pf.path,
        content: `// Boilerplate component built from Atlas blueprint
import React from 'react';

export default function Module() {
  return (
    <div className="p-8 text-center bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-2xl max-w-sm mx-auto shadow-sm space-y-3">
      <h3 className="text-xs font-medium text-[var(--crm-text)] text-[var(--crm-text)]  ">Atlas Sandbox Module</h3>
      <p className="text-xs text-[var(--crm-text-secondary)] ">Constructed dynamically inside path: ${pf.path}</p>
    </div>
  );
}`,
        description: `Automated boilerplate creation for blueprint: ${pf.path}`
      };
    });

    const activeId = newFilesList[0];
    
    setChatMessages(prev => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        brainId: 'forge',
        text: `Welcome to **Build Mode**. Based on our approved plan, here is the boilerplate code patch for **${activeId.path}**.\n\nAccept and commit to write the file, or write your custom description below.`,
        proposal: {
          path: activeId.path,
          description: activeId.description,
          content: activeId.content,
          status: 'pending'
        }
      }
    ]);
  };

  const handleAcceptProposal = (msgId: string, proposal: { path: string; content: string }) => {
    // 1. Write the file
    setFiles(prev => {
      const idx = prev.findIndex(f => f.path.toLowerCase() === proposal.path.toLowerCase());
      if (idx >= 0) {
        return prev.map((f, i) => i === idx ? { ...f, content: proposal.content } : f);
      } else {
        return [...prev, { path: proposal.path, content: proposal.content, language: 'typescript' }];
      }
    });

    // 2. Open tab & load file
    if (!openTabs.includes(proposal.path)) {
      setOpenTabs(prev => [...prev, proposal.path]);
    }
    setActiveFilePath(proposal.path);
    setRightPanelTab('code');

    // 3. Create Undo Rollback Backup
    const backupId = `snap-${Date.now().toString().slice(-4)}`;
    const newBackup: BackupVersion = {
      id: backupId,
      timestamp: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      description: `Auto backup point prior to committing code in: ${proposal.path}`,
      filesSnapshot: files
    };
    setBackups(prev => [newBackup, ...prev]);

    // 4. Update chat message status
    setChatMessages(prev => prev.map(m => {
      if (m.id === msgId && m.proposal) {
        return {
          ...m,
          proposal: {
            ...m.proposal,
            status: 'accepted'
          }
        };
      }
      return m;
    }));

    addActivityLog('success', `Committed code changes written to: ${proposal.path}`);
    addTerminalLog(`[AI_COMMIT] Successfully applied patch code into ${proposal.path}`);
    
    // Trigger live sandbox reload
    triggerSandboxCompilation();
  };

  const handleRejectProposal = (msgId: string) => {
    setChatMessages(prev => prev.map(m => {
      if (m.id === msgId && m.proposal) {
        return {
          ...m,
          proposal: {
            ...m.proposal,
            status: 'rejected'
          }
        };
      }
      return m;
    }));
    addActivityLog('warning', 'Proposed code patch rejected by user.');
    addTerminalLog(`[AI_FORGE] Patch revision rejected.`);
  };

  const handleRestoreBackup = (b: BackupVersion) => {
    setFiles(b.filesSnapshot);
    addActivityLog('warning', `Reverted project files back to snapshot: "${b.description}"`);
    addTerminalLog(`[REVISION] Reverted workspace back to: ${b.id}`);
    triggerSandboxCompilation();
  };

  // Filter virtual files for files panel tree view
  const filteredFilesList = files.filter(f => f.path.toLowerCase().includes(fileFilter.toLowerCase()));

  // Filter messages in search
  const filteredMessages = chatMessages.filter(m => m.text.toLowerCase().includes(chatSearchQuery.toLowerCase()));

  return (
    <div className="bg-[#F8FAFC] min-h-screen text-[#0F172A] font-sans antialiased p-0 flex flex-col h-screen overflow-hidden">
      
      {/* 1. Header Branded HUD Bar */}
      <header className="h-14 bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border-b border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] px-6 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-xs">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium   text-[var(--crm-text-muted)] ">Zyqro AI Studio</span>
              <span className="h-1.5 w-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-full animate-pulse" />
            </div>
            <h1 className="text-sm font-semibold text-[var(--crm-text)] text-[var(--crm-text)] leading-none">Enterprise Developer Agent v2</h1>
          </div>
        </div>

        {/* Workspace Quick-Jump */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-lg flex items-center gap-2">
            <FolderOpen size={13} className="text-blue-600" />
            <strong className="text-xs font-medium text-[var(--crm-text)]">{currentProject.name}</strong>
          </div>
          <button 
            onClick={() => setShowCreateProjectModal(true)}
            className="p-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
            title="Create New Project"
          >
            <Plus size={14} />
          </button>
        </div>
      </header>

      {/* 2. Primary Three-Column Split Screen Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ================= COLUMN 1: LEFT SIDEBAR ================= */}
        <aside className="w-60 bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border-r border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] flex flex-col shrink-0 select-none">
          
          {/* Logo Brand / Workspace actions */}
          <div className="p-4 border-b border-slate-100 dark:border-[var(--crm-card-border)]">
            <button 
              onClick={() => setShowCreateProjectModal(true)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus size={14} />
              New Project
            </button>
          </div>

          {/* Navigation Links */}
          <div className="p-3 flex-1 space-y-1 overflow-y-auto">
            <span className="px-3 text-[10px] font-medium text-[var(--crm-text-muted)] font-mono block mb-2">Workspace</span>

            <button 
              onClick={() => setActiveSidebarTab('chat')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${
                activeSidebarTab === 'chat' 
                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700' 
                  : 'text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar)] hover:text-[var(--crm-text)]'
              }`}
            >
              <MessageSquare size={14} className={activeSidebarTab === 'chat' ? 'text-blue-600' : 'text-[var(--crm-text-muted)] '} />
              AI Chat Workspace
            </button>

            <button 
              onClick={() => setActiveSidebarTab('projects')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                activeSidebarTab === 'projects' 
                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700' 
                  : 'text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar)] hover:text-[var(--crm-text)]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Folder size={14} className={activeSidebarTab === 'projects' ? 'text-blue-600' : 'text-[var(--crm-text-muted)] '} />
                Projects
              </span>
              <span className="bg-[var(--crm-sidebar)] text-[var(--crm-text-secondary)] font-mono text-[10px] px-1.5 py-0.5 rounded-md ">{projects.length}</span>
            </button>

            <button 
              onClick={() => setActiveSidebarTab('templates')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${
                activeSidebarTab === 'templates' 
                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700' 
                  : 'text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar)] hover:text-[var(--crm-text)]'
              }`}
            >
              <Globe size={14} className={activeSidebarTab === 'templates' ? 'text-blue-600' : 'text-[var(--crm-text-muted)] '} />
              Templates Directory
            </button>

            <button 
              onClick={() => setActiveSidebarTab('brains')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${
                activeSidebarTab === 'brains' 
                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700' 
                  : 'text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar)] hover:text-[var(--crm-text)]'
              }`}
            >
              <Sparkles size={14} className={activeSidebarTab === 'brains' ? 'text-blue-600' : 'text-[var(--crm-text-muted)] '} />
              AI Brains Config
            </button>

            <button 
              onClick={() => setActiveSidebarTab('history')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                activeSidebarTab === 'history' 
                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700' 
                  : 'text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar)] hover:text-[var(--crm-text)]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <History size={14} className={activeSidebarTab === 'history' ? 'text-blue-600' : 'text-[var(--crm-text-muted)] '} />
                Snapshot History
              </span>
              <span className="bg-amber-50 dark:bg-amber-500/10 text-amber-600 font-mono text-[9px] px-1.5 py-0.5 rounded-md font-medium">{backups.length}</span>
            </button>

            <button 
              onClick={() => setActiveSidebarTab('settings')}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${
                activeSidebarTab === 'settings' 
                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700' 
                  : 'text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar)] hover:text-[var(--crm-text)]'
              }`}
            >
              <Settings size={14} className={activeSidebarTab === 'settings' ? 'text-blue-600' : 'text-[var(--crm-text-muted)] '} />
              Settings & Rules
            </button>
          </div>

          {/* Quick Memory Summary block */}
          <div className="p-4 border-t border-slate-100 dark:border-[var(--crm-card-border)] bg-[var(--crm-sidebar)]/5 0 bg-[var(--crm-sidebar)]/50 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-[var(--crm-text-muted)] font-mono">Workspace Rules</span>
              <span className="h-1.5 w-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10" />
            </div>
            <p className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-slate-150 dark:border-[var(--crm-card-border)] p-2 rounded-lg text-[10px] text-[var(--crm-text-secondary)] font-mono leading-normal leading-relaxed truncate-2">
              {projectMemory.codingStandards}
            </p>
          </div>
        </aside>

        {/* ================= COLUMN 2: CENTER PANEL (AI CHAT WORKSPACE / CONFIGS) ================= */}
        <main className="flex-1 flex flex-col bg-[var(--crm-card)] dark:bg-[var(--crm-card)] overflow-hidden border-r border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)]">
          
          {/* Top Panel bar: Current Context & Toggles */}
          <div className="h-12 border-b border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] px-5 flex items-center justify-between shrink-0 select-none bg-[var(--crm-sidebar)]/5 0 bg-[var(--crm-sidebar)]/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[var(--crm-text-muted)] font-mono ">Context:</span>
              <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 text-xs font-medium rounded-md">
                {activeBrain.name}
              </span>
            </div>

            {/* Plan / Build Toggle */}
            <div className="flex bg-[var(--crm-sidebar)] p-1 rounded-xl border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)]">
              <button 
                onClick={() => setActiveMode('plan')}
                className={`px-3 py-1 text-[11px] font-semibold   rounded-lg transition-all cursor-pointer ${
                  activeMode === 'plan' 
                    ? 'bg-[var(--crm-card)] dark:bg-[var(--crm-card)] text-blue-600 shadow-xs' 
                    : 'text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)] text-[var(--crm-text)]'
                }`}
              >
                Plan Mode
              </button>
              <button 
                onClick={() => setActiveMode('build')}
                className={`px-3 py-1 text-[11px] font-semibold   rounded-lg transition-all cursor-pointer ${
                  activeMode === 'build' 
                    ? 'bg-[var(--crm-card)] dark:bg-[var(--crm-card)] text-blue-600 shadow-xs' 
                    : 'text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)] text-[var(--crm-text)]'
                }`}
              >
                Build Mode
              </button>
            </div>
          </div>

          {/* Dynamic Content Display */}
          <div className="flex-1 overflow-hidden relative flex flex-col">
            
            {/* SCREEN 1: CORE CHAT WORKSPACE */}
            {activeSidebarTab === 'chat' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                
                {/* Search Bar inside Chat thread */}
                <div className="h-10 bg-[var(--crm-sidebar)]/3 0 /30 border-b border-slate-100 dark:border-[var(--crm-card-border)] flex items-center px-5 shrink-0 justify-between">
                  <div className="flex items-center gap-2 flex-1 max-w-xs">
                    <Search size={12} className="text-[var(--crm-text-muted)] " />
                    <input 
                      type="text" 
                      placeholder="Search chat messages..."
                      value={chatSearchQuery}
                      onChange={e => setChatSearchQuery(e.target.value)}
                      className="bg-transparent border-none text-xs outline-none text-[var(--crm-text)] placeholder-slate-400 w-full"
                    />
                  </div>
                  <span className="text-[10px] text-[var(--crm-text-muted)] font-mono">{chatMessages.length} Messages logged</span>
                </div>

                {/* Messages feed area */}
                <div className="flex-1 p-5 overflow-y-auto space-y-6 select-text">
                  {filteredMessages.map((msg, mIdx) => (
                    <div 
                      key={msg.id} 
                      className={`flex gap-3.5 max-w-[90%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                    >
                      {/* Avatar */}
                      <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                        msg.sender === 'user' 
                          ? 'bg-slate-200 text-[var(--crm-text)] font-medium text-xs' 
                          : 'bg-blue-600 text-white'
                      }`}>
                        {msg.sender === 'user' ? 'U' : <Sparkles size={14} />}
                      </div>

                      {/* Msg Body */}
                      <div className="space-y-2">
                        <div className={`p-4 rounded-2xl ${
                          msg.sender === 'user' 
                            ? 'bg-slate-150 text-[var(--crm-text)] text-[var(--crm-text)] font-medium text-xs rounded-tr-none' 
                            : 'bg-[var(--crm-sidebar)] border border-slate-150 dark:border-[var(--crm-card-border)] text-[var(--crm-text)] text-[var(--crm-text)] text-xs leading-relaxed rounded-tl-none space-y-3'
                        }`}>
                          <div className="flex items-center gap-1.5 text-[9px] font-mono text-[var(--crm-text-muted)] select-none pb-1">
                            <span>{msg.sender === 'user' ? 'Developer' : `${msg.brainId?.toUpperCase()} AI Agent`}</span>
                            <span>•</span>
                            <span>{msg.timestamp}</span>
                          </div>
                          
                          <p className="whitespace-pre-wrap">{msg.text}</p>

                          {/* Dynamic Action / Thinking Process indicator */}
                          {msg.statusSteps && (
                            <div className="mt-3 pt-3 border-t border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] space-y-1.5">
                              {msg.statusSteps.map((step, sIdx) => (
                                <div key={sIdx} className="flex items-center gap-2 text-[11px]">
                                  {step.status === 'done' && <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />}
                                  {step.status === 'active' && <RefreshCw size={12} className="text-blue-500 animate-spin shrink-0" />}
                                  {step.status === 'pending' && <Clock size={12} className="text-slate-350 shrink-0" />}
                                  <span className={step.status === 'done' ? 'text-[var(--crm-text-secondary)] line-through' : step.status === 'active' ? 'text-blue-600 font-medium' : 'text-[var(--crm-text-muted)] '}>
                                    {step.label}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Plan Roadmap Presentation Block */}
                          {msg.plan && (
                            <div className="mt-4 pt-4 border-t border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] space-y-4">
                              
                              {/* Roadmap list */}
                              <div className="space-y-2">
                                <span className="text-[10px] font-semibold text-[var(--crm-text-muted)] block font-mono">Proposed Roadmap</span>
                                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                  {msg.plan.roadmap.map((step) => (
                                    <div key={step.id} className="p-2.5 bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-lg flex items-start gap-2 text-[11px]">
                                      <CheckCircle2 size={13} className={step.status === 'completed' ? 'text-emerald-500 mt-0.5' : 'text-slate-300 mt-0.5'} />
                                      <div className="flex-1">
                                        <p className={`font-semibold ${step.status === 'completed' ? 'text-[var(--crm-text-muted)] line-through' : 'text-[var(--crm-text)]'}`}>{step.task}</p>
                                        <span className="text-[9px] text-[var(--crm-text-muted)] font-mono">Est: {step.estimatedMinutes} mins</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Complexity Index */}
                              <div className="flex items-center justify-between bg-[var(--crm-sidebar)] p-2 rounded-lg text-[10px] font-mono select-none">
                                <span className="text-[var(--crm-text-secondary)] ">ARCHITECTURE COMPLEXITY</span>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-semibold  ${
                                  msg.plan.complexity === 'low' ? 'bg-emerald-100 text-emerald-700' :
                                  msg.plan.complexity === 'medium' ? 'bg-amber-100 text-amber-700' :
                                  'bg-rose-100 text-rose-700'
                                }`}>
                                  {msg.plan.complexity}
                                </span>
                              </div>

                              {/* Schema Table code visual block */}
                              {msg.plan.dbSuggestions && msg.plan.dbSuggestions.length > 0 && (
                                <div className="space-y-2">
                                  <span className="text-[10px] font-semibold text-[var(--crm-text-muted)] block font-mono">Relational Schemas</span>
                                  <div className="p-3 bg-slate-900 rounded-xl font-mono text-[10px] text-slate-300 border border-slate-800 space-y-1">
                                    <div className="flex justify-between text-[var(--crm-text-secondary)] text-[9px] border-b border-slate-800 pb-1 mb-1">
                                      <span>CREATE TABLE {msg.plan.dbSuggestions[0].table} (</span>
                                      <span>PostgreSQL</span>
                                    </div>
                                    {msg.plan.dbSuggestions[0].columns.map((col, cIdx) => (
                                      <div key={cIdx} className="pl-4">
                                        {col}{cIdx < msg.plan.dbSuggestions[0].columns.length - 1 ? ',' : ''}
                                      </div>
                                    ))}
                                    <span>);</span>
                                  </div>
                                </div>
                              )}

                              {/* File changes checklist */}
                              <div className="space-y-2">
                                <span className="text-[10px] font-semibold text-[var(--crm-text-muted)] block font-mono">Affected Files</span>
                                <div className="space-y-1">
                                  {msg.plan.proposedFiles.map((pf, pfIdx) => (
                                    <div key={pfIdx} className="flex items-center justify-between text-[11px] font-mono text-[var(--crm-text-secondary)] bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] p-2 rounded-lg">
                                      <span>{pf.path}</span>
                                      <span className={`text-[9px] px-1.5 py-0.2 rounded-sm font-medium  ${pf.action === 'create' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border border-emerald-100' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 border border-blue-100'}`}>
                                        {pf.action}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Approve action bar */}
                              <div className="pt-3 border-t border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] flex justify-end">
                                <button 
                                  onClick={() => handleApprovePlan(msg.plan!.proposedFiles)}
                                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                                >
                                  Approve & Initiate Build
                                  <ArrowRight size={13} />
                                </button>
                              </div>

                            </div>
                          )}

                          {/* Code Proposal Presentation Block */}
                          {msg.proposal && (
                            <div className="mt-4 pt-4 border-t border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] space-y-3">
                              <div className="flex items-center justify-between text-[11px] font-mono select-none">
                                <span className="text-[var(--crm-text-secondary)] ">File target: <strong className="text-[var(--crm-text)] text-[var(--crm-text)]">{msg.proposal.path}</strong></span>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-medium ${
                                  msg.proposal.status === 'accepted' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' :
                                  msg.proposal.status === 'rejected' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600' :
                                  'bg-amber-50 dark:bg-amber-500/10 text-amber-600'
                                }`}>
                                  {msg.proposal.status.toUpperCase()}
                                </span>
                              </div>

                              <div className="relative">
                                <div className="bg-slate-950 p-4 rounded-xl font-mono text-[11px] text-slate-300 border border-slate-850 overflow-x-auto max-h-48 whitespace-pre">
                                  {msg.proposal.content}
                                </div>
                              </div>

                              <p className="text-[10px] text-[var(--crm-text-muted)] italic">Description: {msg.proposal.description}</p>

                              {/* Proposal Interactive decision buttons */}
                              {msg.proposal.status === 'pending' && (
                                <div className="pt-3 border-t border-slate-100 dark:border-[var(--crm-card-border)] flex justify-end gap-2.5">
                                  <button 
                                    onClick={() => handleRejectProposal(msg.id)}
                                    className="px-3 py-1.5 border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar)] rounded-lg text-xs  cursor-pointer"
                                  >
                                    Reject Patch
                                  </button>
                                  <button 
                                    onClick={() => handleAcceptProposal(msg.id, msg.proposal!)}
                                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 cursor-pointer"
                                  >
                                    Accept & Commit Code
                                    <Check size={12} />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom dynamic chat input console */}
                <div className="p-4 border-t border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] bg-[var(--crm-sidebar)]/5 0 bg-[var(--crm-sidebar)]/50 space-y-3">
                  <form onSubmit={handleChatSubmit} className="flex gap-3">
                    <textarea 
                      rows={2}
                      placeholder={`Describe what you want to build... (Active Brain: ${activeBrain.name})`}
                      value={chatInputValue}
                      onChange={e => setChatInputValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleChatSubmit(e);
                        }
                      }}
                      className="flex-1 bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-xl px-4 py-2.5 text-xs text-[var(--crm-text)] text-[var(--crm-text)] placeholder-slate-400 outline-none resize-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                    />
                    <div className="flex flex-col justify-end">
                      <button 
                        type="submit"
                        disabled={isAiResponding || !chatInputValue.trim()}
                        className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:disabled:text-[var(--crm-text-muted)] text-white rounded-xl text-xs  flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                      >
                        <span>Build</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </form>
                  
                  {/* Action row helpers */}
                  <div className="flex items-center justify-between text-[11px] text-[var(--crm-text-muted)] select-none">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => {
                          setChatInputValue("Implement fully responsive account settings interface with profile fields");
                        }}
                        className="hover:text-[var(--crm-text-secondary)] underline cursor-pointer"
                      >
                        e.g. "Create Login gateway"
                      </button>
                      <span>|</span>
                      <span>Press Enter to Submit</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        type="button"
                        onClick={handleLinterValidation}
                        className="px-2.5 py-1 bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] hover:bg-[var(--crm-sidebar)] rounded-lg text-[var(--crm-text-secondary)] cursor-pointer"
                        title="Check linter diagnostics"
                      >
                        Run Lint
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* SCREEN 2: PROJECTS DIRECTORY OVERLAY */}
            {activeSidebarTab === 'projects' && (
              <div className="p-6 overflow-y-auto space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-[var(--crm-card-border)] pb-3">
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--crm-text)] text-[var(--crm-text)]  ">Workspace Directory</h2>
                    <p className="text-xs text-[var(--crm-text-secondary)] ">Pick any project workspace container to load its virtual files.</p>
                  </div>
                  <button 
                    onClick={() => setShowCreateProjectModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium transition-colors cursor-pointer"
                  >
                    New Project
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {projects.map((proj) => {
                    const isSelected = proj.id === activeProjectId;
                    return (
                      <div 
                        key={proj.id} 
                        onClick={() => {
                          setActiveProjectId(proj.id);
                          setActiveSidebarTab('chat');
                        }}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[140px] ${
                          isSelected 
                            ? 'bg-blue-50/50 dark:bg-blue-500/10 border-blue-500 shadow-xs ring-1 ring-blue-500' 
                            : 'bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] hover:border-slate-300 dark:border-[var(--crm-card-border)]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-medium font-mono text-[var(--crm-text-muted)] ">{proj.techStack}</span>
                            {isSelected && <span className="h-2 w-2 rounded-full bg-blue-600" />}
                          </div>
                          <h3 className="font-semibold text-[var(--crm-text)] text-[var(--crm-text)] text-sm mt-2">{proj.name}</h3>
                          <p className="text-xs text-[var(--crm-text-secondary)] mt-1 line-clamp-2 leading-relaxed">{proj.description}</p>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-[var(--crm-text-muted)] font-mono mt-4 pt-3 border-t border-slate-100 dark:border-[var(--crm-card-border)]">
                          <span>Created: {proj.createdAt}</span>
                          <span className="font-medium text-blue-600 flex items-center gap-1 ">
                            {proj.files.length} Files
                            <ChevronRight size={11} />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SCREEN 3: TEMPLATES DIRECTORY */}
            {activeSidebarTab === 'templates' && (
              <div className="p-6 overflow-y-auto space-y-6">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--crm-text)] text-[var(--crm-text)]  ">Design Templates Directory</h2>
                  <p className="text-xs text-[var(--crm-text-secondary)] ">Pick modular mock boilerplates to clone as fresh active projects.</p>
                </div>

                <div className="space-y-4">
                  {STATIC_TEMPLATES.map(temp => (
                    <div key={temp.id} className="p-5 bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-2xl hover:shadow-xs transition-shadow flex items-start gap-4">
                      <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-xl">
                        <Globe size={18} />
                      </div>
                      <div className="space-y-3 flex-1">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-[var(--crm-text)] text-[var(--crm-text)] text-sm">{temp.name}</h3>
                          <span className="text-[10px] font-medium font-mono bg-[var(--crm-sidebar)] text-[var(--crm-text-secondary)] px-2.5 py-0.5 rounded-md ">{temp.techStack}</span>
                        </div>
                        <p className="text-xs text-[var(--crm-text-secondary)] leading-relaxed">{temp.description}</p>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[var(--crm-card-border)] text-xs text-[var(--crm-text-muted)] ">
                          <span>Total source files: {temp.files.length}</span>
                          <button 
                            onClick={() => handleCloneTemplate(temp)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium transition-colors cursor-pointer"
                          >
                            Clone Template
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SCREEN 4: AI BRAINS CONFIG */}
            {activeSidebarTab === 'brains' && (
              <div className="p-6 overflow-y-auto space-y-6">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--crm-text)] text-[var(--crm-text)]  ">AI Brain Selector</h2>
                  <p className="text-xs text-[var(--crm-text-secondary)] ">Select active LLM reasoning engines to fine-tune compilation outputs.</p>
                </div>

                <div className="space-y-4">
                  {AI_BRAINS.map(brain => {
                    const isSelected = brain.id === selectedBrainId;
                    return (
                      <div 
                        key={brain.id}
                        onClick={() => {
                          setSelectedBrainId(brain.id);
                          addActivityLog('info', `Switched active brain system to: ${brain.name}`);
                        }}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start gap-4 ${
                          isSelected 
                            ? 'bg-blue-50/40 dark:bg-blue-500/10 border-blue-500' 
                            : 'bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] hover:border-slate-300 dark:border-[var(--crm-card-border)]'
                        }`}
                      >
                        <div className={`p-3 rounded-xl shrink-0 ${isSelected ? 'bg-blue-600 text-white' : 'bg-[var(--crm-sidebar)] text-[var(--crm-text-secondary)] '}`}>
                          <Sparkles size={18} />
                        </div>

                        <div className="space-y-2 flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-[var(--crm-text)] text-[var(--crm-text)] text-sm">{brain.name}</h3>
                              <p className="text-xs text-blue-600  font-mono">{brain.role}</p>
                            </div>
                            {isSelected && (
                              <span className="px-3 py-1 bg-blue-600 text-white font-semibold text-[9px]   rounded-full">Selected Engine</span>
                            )}
                          </div>

                          <p className="text-xs text-[var(--crm-text-secondary)] leading-relaxed">{brain.description}</p>
                          
                          <div className="flex flex-wrap gap-1.5 pt-1.5">
                            {brain.features.map((feat, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-slate-150 text-[10px] text-[var(--crm-text-secondary)] rounded-md font-mono">
                                {feat}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SCREEN 5: SNAPSHOT REVISIONS */}
            {activeSidebarTab === 'history' && (
              <div className="p-6 overflow-y-auto space-y-6">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--crm-text)] text-[var(--crm-text)]  ">Backup Snapshot Checkpoints</h2>
                  <p className="text-xs text-[var(--crm-text-secondary)] ">Access local rollbacks. Roll back code modification errors on compile failures.</p>
                </div>

                <div className="space-y-3">
                  {backups.map(b => (
                    <div key={b.id} className="p-4 bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-2xl flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-medium text-[var(--crm-text-secondary)] bg-[var(--crm-sidebar)] px-2 py-0.5 rounded-md">{b.id}</span>
                          <span className="text-xs text-[var(--crm-text-muted)] font-mono">{b.timestamp}</span>
                        </div>
                        <h4 className="font-medium text-[var(--crm-text)] text-xs leading-snug">{b.description}</h4>
                        <span className="text-[10px] text-[var(--crm-text-muted)] block font-mono">Snapshot captures {b.filesSnapshot.length} files</span>
                      </div>

                      <button 
                        onClick={() => handleRestoreBackup(b)}
                        className="px-4 py-2 border border-blue-200 text-blue-600 hover:bg-blue-50 dark:bg-blue-500/10 rounded-xl text-xs font-medium transition-colors cursor-pointer shrink-0"
                      >
                        Restore State
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SCREEN 6: SETTINGS */}
            {activeSidebarTab === 'settings' && (
              <div className="p-6 overflow-y-auto space-y-6">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--crm-text)] text-[var(--crm-text)]  ">Workspace Preferences</h2>
                  <p className="text-xs text-[var(--crm-text-secondary)] ">Configure standard coding rules and server secrets safely.</p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-[var(--crm-text-secondary)] ">Gemini API Token Proxy</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--crm-text-muted)] " />
                      <input 
                        type="password" 
                        value={apiKeyMock}
                        className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[var(--crm-text)] text-[var(--crm-text)] select-all cursor-not-allowed"
                        placeholder="Secure credential managed server-side"
                        disabled
                      />
                    </div>
                    <span className="text-[10px] text-[var(--crm-text-muted)] block pl-1">
                      * API secrets are managed server-side inside the .env secrets vault.
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-[var(--crm-text-secondary)] ">Project Memory Coding Standards</label>
                    <textarea 
                      rows={3}
                      value={customStandards}
                      onChange={e => {
                        setCustomStandards(e.target.value);
                        setProjectMemory(prev => ({ ...prev, codingStandards: e.target.value }));
                      }}
                      className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-xl p-3 text-xs text-[var(--crm-text)] text-[var(--crm-text)] outline-none focus:bg-[var(--crm-card)] focus:dark:bg-[var(--crm-card)] focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div className="p-4 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-xl flex items-start gap-3">
                    <AlertTriangle size={16} className="text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-[var(--crm-text-secondary)] leading-normal">
                      The dynamic sandbox utilizes CDN compilers. Static validation parameters verify curly bracket scope bounds to shield you from infinite loop exceptions.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>

        {/* ================= COLUMN 3: RIGHT PANEL (LIVE PREVIEW WORKSPACE) ================= */}
        <section className="w-[450px] bg-[var(--crm-sidebar)] border-l border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] flex flex-col shrink-0 overflow-hidden">
          
          {/* Header tabs navigation list */}
          <div className="h-12 bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border-b border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] flex items-center px-2 shrink-0 select-none justify-between">
            <div className="flex gap-1">
              <button 
                onClick={() => setRightPanelTab('preview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  rightPanelTab === 'preview' ? 'bg-[var(--crm-sidebar)] text-[var(--crm-text)] text-[var(--crm-text)]' : 'text-[var(--crm-text-muted)] hover:text-[var(--crm-text)]'
                }`}
              >
                Preview
              </button>
              <button 
                onClick={() => setRightPanelTab('code')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  rightPanelTab === 'code' ? 'bg-[var(--crm-sidebar)] text-[var(--crm-text)] text-[var(--crm-text)]' : 'text-[var(--crm-text-muted)] hover:text-[var(--crm-text)]'
                }`}
              >
                Code
              </button>
              <button 
                onClick={() => setRightPanelTab('files')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  rightPanelTab === 'files' ? 'bg-[var(--crm-sidebar)] text-[var(--crm-text)] text-[var(--crm-text)]' : 'text-[var(--crm-text-muted)] hover:text-[var(--crm-text)]'
                }`}
              >
                Files
              </button>
              <button 
                onClick={() => setRightPanelTab('terminal')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  rightPanelTab === 'terminal' ? 'bg-[var(--crm-sidebar)] text-[var(--crm-text)] text-[var(--crm-text)]' : 'text-[var(--crm-text-muted)] hover:text-[var(--crm-text)]'
                }`}
              >
                Terminal
              </button>
            </div>

            {/* Quick Actions per right panel tab */}
            <div className="flex gap-1 pr-1">
              {rightPanelTab === 'preview' && (
                <button 
                  onClick={() => setIframeReloadKey(k => k + 1)}
                  className="p-1.5 hover:bg-[var(--crm-sidebar-active-bg)] text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)] text-[var(--crm-text)] rounded transition-colors cursor-pointer"
                  title="Reload compiler"
                >
                  <RefreshCw size={13} />
                </button>
              )}
              {rightPanelTab === 'code' && (
                <div className="flex items-center gap-1">
                  <button 
                    onClick={handleLinterValidation}
                    className="p-1.5 hover:bg-[var(--crm-sidebar-active-bg)] text-[var(--crm-text-secondary)] rounded transition-colors cursor-pointer"
                    title="Validate syntax"
                  >
                    <Code size={13} />
                  </button>
                  <button 
                    onClick={handleSaveActiveFile}
                    className="p-1.5 hover:bg-[var(--crm-sidebar-active-bg)] text-blue-600 rounded transition-colors cursor-pointer"
                    title="Save current file"
                  >
                    <Save size={13} />
                  </button>
                </div>
              )}
              {rightPanelTab === 'files' && (
                <button 
                  onClick={() => setShowCreateFilePrompt(true)}
                  className="p-1.5 hover:bg-[var(--crm-sidebar-active-bg)] text-blue-600 rounded transition-colors cursor-pointer"
                  title="Add new file"
                >
                  <Plus size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Tab contents area */}
          <div className="flex-1 overflow-hidden relative flex flex-col">
            
            {/* SUB-VIEW 1: LIVE PREVIEW BROWSER */}
            {rightPanelTab === 'preview' && (
              <div className="flex-1 flex flex-col bg-[var(--crm-card)] dark:bg-[var(--crm-card)] overflow-hidden">
                {/* Browser Address bar Chrome styling */}
                <div className="h-9 bg-slate-100/80 border-b border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] px-4 flex items-center gap-2 select-none shrink-0">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-slate-300" />
                    <span className="h-2 w-2 rounded-full bg-slate-300" />
                    <span className="h-2 w-2 rounded-full bg-slate-300" />
                  </div>
                  
                  {/* Address input bar */}
                  <div className="flex-1 bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-lg px-2 py-0.5 text-[10px] text-[var(--crm-text-muted)] font-mono flex items-center justify-between">
                    <div className="flex items-center gap-1 overflow-hidden truncate">
                      <Lock size={9} className="text-emerald-500 shrink-0" />
                      <span className="truncate">https://localhost:3000/</span>
                    </div>
                    <button onClick={() => setIframeReloadKey(k => k + 1)}>
                      <RefreshCw size={8} className="text-slate-350 hover:text-[var(--crm-text-secondary)] " />
                    </button>
                  </div>
                </div>

                {/* Viewport frame */}
                <div className="flex-1 bg-[var(--crm-card)] dark:bg-[var(--crm-card)] relative">
                  <iframe 
                    ref={iframeRef}
                    title="Zyqro Live preview"
                    className="w-full h-full border-none bg-[var(--crm-card)] dark:bg-[var(--crm-card)]"
                    sandbox="allow-scripts allow-modals"
                  />
                </div>
              </div>
            )}

            {/* SUB-VIEW 2: CODE EDITOR */}
            {rightPanelTab === 'code' && (
              <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden text-slate-300 relative font-mono text-xs">
                {/* Editor Tab indicator info */}
                <div className="h-8 bg-slate-900 border-b border-slate-850 px-4 flex items-center justify-between text-[10px] text-[var(--crm-text-secondary)] select-none shrink-0">
                  <span className="truncate">Editing: <strong>{activeFilePath}</strong></span>
                  <button 
                    onClick={handleSaveActiveFile}
                    className="text-blue-400 hover:text-blue-300 font-medium  "
                  >
                    Save Changes
                  </button>
                </div>

                {/* Editable space */}
                <div className="flex-1 p-4 overflow-y-auto flex">
                  {/* Mock line numbers for aesthetic feeling */}
                  <div className="w-8 select-none text-[var(--crm-text-secondary)] text-right pr-3 border-r border-slate-850 mr-3 text-[11px] leading-relaxed">
                    {Array.from({ length: Math.max(15, (editorValue.match(/\n/g) || []).length + 2) }).map((_, idx) => (
                      <div key={idx}>{idx + 1}</div>
                    ))}
                  </div>
                  
                  <textarea 
                    value={editorValue}
                    onChange={e => setEditorValue(e.target.value)}
                    className="flex-1 bg-transparent text-slate-200 outline-none border-none p-0 resize-none font-mono text-[11px] leading-relaxed select-text min-h-full"
                    style={{ tabSize: 2 }}
                  />
                </div>
              </div>
            )}

            {/* SUB-VIEW 3: FILES TREE */}
            {rightPanelTab === 'files' && (
              <div className="flex-1 flex flex-col bg-[var(--crm-card)] dark:bg-[var(--crm-card)] overflow-hidden p-4 space-y-3">
                {/* Search / Filter input */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-lg px-2 py-1 flex items-center gap-1.5">
                    <Search size={12} className="text-[var(--crm-text-muted)] " />
                    <input 
                      type="text" 
                      placeholder="Filter files..." 
                      value={fileFilter}
                      onChange={e => setFileFilter(e.target.value)}
                      className="bg-transparent border-none text-[11px] outline-none text-[var(--crm-text)] w-full"
                    />
                  </div>
                  <button 
                    onClick={() => setShowCreateFilePrompt(true)}
                    className="p-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 border border-blue-100 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                    title="Add file"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Files list */}
                <div className="flex-1 overflow-y-auto space-y-1">
                  {filteredFilesList.map(file => {
                    const isActive = file.path === activeFilePath;
                    const parts = file.path.split('/');
                    const name = parts.pop() || '';
                    const folder = parts.join('/');
                    
                    return (
                      <div 
                        key={file.path}
                        onClick={() => {
                          setActiveFilePath(file.path);
                          if (!openTabs.includes(file.path)) {
                            setOpenTabs(prev => [...prev, file.path]);
                          }
                          setRightPanelTab('code');
                        }}
                        className={`p-2 rounded-lg cursor-pointer transition-colors flex items-center justify-between text-xs font-mono ${
                          isActive ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 font-medium' : 'hover:bg-[var(--crm-sidebar)] text-[var(--crm-text-secondary)]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {folder ? (
                            <Folder size={13} className="text-[var(--crm-text-muted)] shrink-0" />
                          ) : (
                            <FileCode size={13} className="text-blue-500 shrink-0" />
                          )}
                          <div className="truncate">
                            <span>{name}</span>
                            {folder && <span className="text-[10px] text-[var(--crm-text-muted)] ml-1.5">in {folder}</span>}
                          </div>
                        </div>
                        <span className="text-[9px] text-[var(--crm-text-muted)] font-mono">{file.path.split('.').pop()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SUB-VIEW 4: VIRTUAL TERMINAL */}
            {rightPanelTab === 'terminal' && (
              <div className="flex-1 flex flex-col bg-slate-950 text-slate-300 font-mono text-xs overflow-hidden select-text">
                {/* Console list output */}
                <div className="flex-1 p-4 overflow-y-auto space-y-1">
                  {terminalLogs.map((log, idx) => (
                    <div key={idx} className="whitespace-pre-wrap leading-relaxed text-[11px] text-[var(--crm-text-muted)] ">
                      {log}
                    </div>
                  ))}
                  <div ref={terminalEndRef} />
                </div>

                {/* Simulated Console Command Entry */}
                <form onSubmit={handleTerminalSubmit} className="h-9 bg-slate-900 border-t border-slate-850 flex items-center px-4 shrink-0 select-none">
                  <span className="text-blue-500 mr-2">$</span>
                  <input 
                    type="text" 
                    placeholder="Type console command... (e.g. 'help', 'npm run lint', 'clear')" 
                    value={terminalInput}
                    onChange={e => setTerminalInput(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none font-mono text-[11px] text-slate-200 placeholder-slate-600"
                  />
                </form>
              </div>
            )}

          </div>
        </section>

      </div>

      {/* 3. Bottom Status Bar HUD */}
      <footer className="h-8 bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border-t border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] px-5 flex items-center justify-between text-[11px] font-mono text-[var(--crm-text-secondary)] shrink-0 select-none">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
            <span className="h-1.5 w-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-full shadow-[0_0_4px_#10b981]" />
            ✓ Built successfully
          </span>
          <span>|</span>
          <span className="flex items-center gap-1.5 text-[var(--crm-text-secondary)] ">
            <Activity size={12} className="text-blue-500 animate-pulse" />
            Sandbox server: Online (Port 3000)
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span>Error count: <strong className="text-[var(--crm-text)]">0</strong></span>
          <span>|</span>
          <span>Host: <strong className="text-[var(--crm-text)]">localhost</strong></span>
        </div>
      </footer>

      {/* MODAL 1: INITIATE NEW PROJECT */}
      {showCreateProjectModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
            
            <div className="p-5 border-b border-slate-150 dark:border-[var(--crm-card-border)] flex items-center justify-between bg-[var(--crm-sidebar)]/7 0 /70">
              <div>
                <span className="text-[10px] font-medium text-blue-600   font-mono">Workspace Creator</span>
                <h3 className="font-semibold text-[var(--crm-text)] text-[var(--crm-text)] text-sm">Initiate New Project Sandbox</h3>
              </div>
              <button 
                onClick={() => setShowCreateProjectModal(false)}
                className="p-1.5 hover:bg-[var(--crm-sidebar-active-bg)] rounded-lg text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[var(--crm-text-secondary)] ">Project Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Acme Subscription Engine..." 
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-xl px-3 py-2 text-xs text-[var(--crm-text)] text-[var(--crm-text)] placeholder-slate-400 outline-none focus:bg-[var(--crm-card)] focus:dark:bg-[var(--crm-card)] focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[var(--crm-text-secondary)] ">Description</label>
                <textarea 
                  rows={2}
                  placeholder="Briefly describe the software objectives..." 
                  value={newProjectDesc}
                  onChange={e => setNewProjectDesc(e.target.value)}
                  className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-xl p-3 text-xs text-[var(--crm-text)] text-[var(--crm-text)] placeholder-slate-400 outline-none focus:bg-[var(--crm-card)] focus:dark:bg-[var(--crm-card)] focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[var(--crm-text-secondary)] ">Primary Stack Configuration</label>
                <select 
                  value={newProjectStack}
                  onChange={e => setNewProjectStack(e.target.value)}
                  className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-xl px-3 py-2 text-xs text-[var(--crm-text)] text-[var(--crm-text)] outline-none"
                >
                  <option value="React + TypeScript + Tailwind CSS">React + TypeScript + Tailwind CSS</option>
                  <option value="Node.js + Express">Node.js + Express</option>
                  <option value="Python + SQLite">Python + SQLite</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-150 dark:border-[var(--crm-card-border)] bg-[var(--crm-sidebar)]/8 0 /80 -mx-5 -mb-5 p-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setShowCreateProjectModal(false)}
                  className="px-4 py-2 hover:bg-[var(--crm-sidebar-active-bg)] text-[var(--crm-text-secondary)] rounded-xl text-xs  transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium shadow-xs transition-colors cursor-pointer"
                >
                  Create Sandbox Project
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL 2: NEW FILE DIALOG */}
      {showCreateFilePrompt && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-2xl w-full max-w-sm shadow-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-[var(--crm-card-border)] flex items-center justify-between bg-[var(--crm-sidebar)]/7 0 /70">
              <h3 className="font-semibold text-[var(--crm-text)] text-[var(--crm-text)] text-xs  ">New File Creator</h3>
              <button onClick={() => setShowCreateFilePrompt(false)}>
                <X size={14} className="text-[var(--crm-text-muted)] hover:text-[var(--crm-text)]" />
              </button>
            </div>
            
            <form onSubmit={handleCreateFile} className="p-4 space-y-3">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-medium text-[var(--crm-text-muted)] font-mono">Relative File Path</label>
                <input 
                  type="text" 
                  placeholder="e.g. src/components/ActivePanel.tsx"
                  value={newFilePath}
                  onChange={e => setNewFilePath(e.target.value)}
                  className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-xl px-3 py-2 text-xs text-[var(--crm-text)] text-[var(--crm-text)] outline-none focus:bg-[var(--crm-card)] focus:dark:bg-[var(--crm-card)]"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowCreateFilePrompt(false)}
                  className="px-3 py-1.5 hover:bg-[var(--crm-sidebar-active-bg)] rounded-lg text-xs font-medium text-[var(--crm-text-secondary)]"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-xs cursor-pointer"
                >
                  Create File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
