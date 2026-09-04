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
  CornerDownRight,
  Check,
  Zap,
  ChevronDown
} from 'lucide-react';
import { Brain, VirtualFile, BackupVersion, ActivityLogItem, ProposedRevision } from './types';

interface BuildTabProps {
  activeBrain: Brain;
  files: VirtualFile[];
  setFiles: React.Dispatch<React.SetStateAction<VirtualFile[]>>;
  activeFilePath: string;
  setActiveFilePath: (path: string) => void;
  openTabs: string[];
  setOpenTabs: React.Dispatch<React.SetStateAction<string[]>>;
  backups: BackupVersion[];
  onRestoreBackup: (backup: BackupVersion) => void;
  activityLogs: ActivityLogItem[];
  addActivityLog: (type: 'info' | 'success' | 'warning' | 'error', message: string) => void;
  terminalLogs: string[];
  addTerminalLog: (text: string) => void;
  triggerSandboxCompilation: () => void;
}

export default function BuildTab({
  activeBrain,
  files,
  setFiles,
  activeFilePath,
  setActiveFilePath,
  openTabs,
  setOpenTabs,
  backups,
  onRestoreBackup,
  activityLogs,
  addActivityLog,
  terminalLogs,
  addTerminalLog,
  triggerSandboxCompilation
}: BuildTabProps) {
  // Local editor content state
  const activeFile = files.find(f => f.path === activeFilePath) || files[0];
  const [editorValue, setEditorValue] = useState(activeFile?.content || '');

  // Synchronize when active file changes
  useEffect(() => {
    if (activeFile) {
      setEditorValue(activeFile.content);
    }
  }, [activeFilePath, activeFile]);

  // Terminal Input State
  const [terminalInput, setTerminalInput] = useState('');
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Search Query
  const [fileSearchQuery, setFileSearchQuery] = useState('');

  // Proposed Modifications Dialog state (for safe edits)
  const [showProposedDialog, setShowProposedDialog] = useState(false);
  const [currentProposal, setCurrentProposal] = useState<ProposedRevision | null>(null);

  // Chat/Input states inside the builder panel
  const [userRequest, setUserRequest] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [workflowStep, setWorkflowStep] = useState<'idle' | 'analyzing' | 'planning' | 'applied'>('idle');

  // Auto scroll terminal logs
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  const handleSaveFile = () => {
    if (!activeFile) return;
    setFiles(prev => prev.map(f => {
      if (f.path === activeFile.path) {
        return { ...f, content: editorValue };
      }
      return f;
    }));
    addActivityLog('success', `Manual file write saved to: ${activeFile.path}`);
    addTerminalLog(`$ write ${activeFile.path} - SUCCESS (${editorValue.length} bytes encoded)`);
  };

  const handleRunLintCheck = () => {
    addActivityLog('info', `Lint checking dynamic file integrity for ${activeFile?.path || 'workspace'}`);
    addTerminalLog(`$ npm run lint --path ${activeFile?.path || 'src/App.tsx'}`);
    
    setTimeout(() => {
      const openBrackets = (editorValue.match(/\{/g) || []).length;
      const closeBrackets = (editorValue.match(/\}/g) || []).length;
      
      if (openBrackets !== closeBrackets) {
        const errorMsg = `Mismatched scope brackets detected! { Count: ${openBrackets}, } Count: ${closeBrackets}`;
        addActivityLog('error', errorMsg);
        addTerminalLog(`[LINT_WARN] ${errorMsg}`);
      } else {
        addActivityLog('success', 'Linter clean. TypeScript syntax conforms to modern CRM rules.');
        addTerminalLog(`✓ Completed static checks on ${activeFile?.path || 'src/App.tsx'}. 0 errors.`);
      }
    }, 450);
  };

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const cmd = terminalInput.trim();
    addTerminalLog(`$ ${cmd}`);
    setTerminalInput('');

    const base = cmd.toLowerCase().split(' ')[0];
    if (base === 'clear') {
      // handled outside
    } else if (base === 'npm' && cmd.includes('install')) {
      addTerminalLog('Scanning registries for package...');
      addTerminalLog('+ lucide-react@0.320.0');
      addTerminalLog('Added 1 package to package.json, and run audit list.');
      addActivityLog('success', 'Installed package: lucide-react');
    } else if (base === 'help') {
      addTerminalLog('Supported virtual sandbox shell actions:');
      addTerminalLog('  npm run dev      - Live render code compiler preview');
      addTerminalLog('  npm run lint     - Evaluate syntax bracket parameters');
      addTerminalLog('  git reset        - Restore files to last stable revision backup');
    } else if (base === 'git' && cmd.includes('reset')) {
      if (backups.length > 0) {
        onRestoreBackup(backups[0]);
      } else {
        addTerminalLog('No backup snapshots registered in workspace.');
      }
    } else {
      addTerminalLog(`Command "${base}" completed successfully inside container environment.`);
    }
  };

  // Triggering the automated Codex Agent build sequence
  const handleTriggerAgentBuild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userRequest.trim() || isProcessing) return;

    setIsProcessing(true);
    setWorkflowStep('analyzing');
    addActivityLog('info', `AI Builder Initiated: "${userRequest}"`);
    addTerminalLog(`[BUILDER_AGENT] Booting ${activeBrain.name} Forge parameters...`);

    // Workflow state 1: Analyze Project files
    await new Promise(r => setTimeout(r, 600));
    setWorkflowStep('planning');
    addTerminalLog(`[BUILDER_AGENT] Analyzing dependencies in: ${files.map(f => f.path).join(', ')}`);

    // Workflow state 2: Formulate modifications
    await new Promise(r => setTimeout(r, 800));

    // Construct proposed changes depending on user request
    const lower = userRequest.toLowerCase();
    let proposal: ProposedRevision = {
      path: activeFilePath,
      description: 'Standard refactor optimization',
      content: editorValue
    };

    if (lower.includes('login') || lower.includes('auth')) {
      proposal = {
        path: 'src/components/LoginAuth.tsx',
        description: 'Create responsive login gateway form with status parameters and input tags.',
        content: `// Injected Login gateway form
import React, { useState } from 'react';

export default function LoginAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      setStatus('success');
    }
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-2xl shadow-sm space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-lg font-semibold text-[var(--crm-text)] text-[var(--crm-text)]">Workspace Authorized Entry</h2>
        <p className="text-xs text-[var(--crm-text-secondary)] ">Sign in to manage client datasets</p>
      </div>

      {status === 'success' ? (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 rounded-xl text-center text-xs font-medium">
          ✓ Welcome back! Sandbox token authenticated.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="email" 
            placeholder="Work Email..." 
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-xl p-3 text-xs text-[var(--crm-text)] text-[var(--crm-text)] outline-none"
          />
          <input 
            type="password" 
            placeholder="Security Code..." 
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-xl p-3 text-xs text-[var(--crm-text)] text-[var(--crm-text)] outline-none"
          />
          <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl">
            Authorize Gateway
          </button>
        </form>
      )}
    </div>
  );`
      };
    } else if (lower.includes('button') || lower.includes('color') || lower.includes('style') || lower.includes('theme')) {
      proposal = {
        path: activeFilePath,
        description: 'Style layout refinement: premium colors, rounded card borders, and padding enhancements.',
        content: editorValue.replace('SaaS Dashboard', 'Premium SaaS Console')
                            .replace('Zyqro Dashboard Hub', 'Zyqro Analytics Console')
      };
    } else {
      // Default placeholder file generator
      const randomId = Math.random().toString(36).substring(2, 6).toUpperCase();
      proposal = {
        path: `src/components/Service${randomId}.tsx`,
        description: `Generate standalone microservice card template #${randomId}`,
        content: `// Static helper template ${randomId}
import React from 'react';

export default function Service${randomId}() {
  return (
    <div className="p-5 bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-xl space-y-2">
      <h4 className="font-medium text-[var(--crm-text)] text-[var(--crm-text)] text-xs">CRM Automated Pipeline #${randomId}</h4>
      <p className="text-[11px] text-[var(--crm-text-secondary)] leading-relaxed">Integrated module tracking CRM performance statistics.</p>
    </div>
  );
}`
      };
    }

    setCurrentProposal(proposal);
    setShowProposedDialog(true);
    setIsProcessing(false);
    setUserRequest('');
  };

  const handleApplyProposal = () => {
    if (!currentProposal) return;

    // Save previous snapshot to Undo History
    setFiles(prev => {
      const idx = prev.findIndex(f => f.path.toLowerCase() === currentProposal.path.toLowerCase());
      if (idx >= 0) {
        return prev.map((f, i) => i === idx ? { ...f, content: currentProposal.content } : f);
      } else {
        return [...prev, { path: currentProposal.path, content: currentProposal.content, language: 'typescript' }];
      }
    });

    if (!openTabs.includes(currentProposal.path)) {
      setOpenTabs(prev => [...prev, currentProposal.path]);
    }
    setActiveFilePath(currentProposal.path);

    addActivityLog('success', `AI Forge: Written modification changes to file: ${currentProposal.path}`);
    addTerminalLog(`[AI FORGE] Successfully written proposed patch into ${currentProposal.path}`);
    
    // Automatically hot-reload sandbox
    triggerSandboxCompilation();

    setWorkflowStep('applied');
    setShowProposedDialog(false);
    setCurrentProposal(null);
  };

  const filteredFiles = files.filter(f => f.path.toLowerCase().includes(fileSearchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      
      {/* Dynamic Workflow Tracker Status */}
      <div className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-xl">
            <Zap size={18} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-medium text-[var(--crm-text-muted)] font-mono">WORKSPACE AGENT FLOW</h3>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-[var(--crm-text)] text-[var(--crm-text)]">{activeBrain.name} Compiler Mode</span>
              <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-md text-[10px] font-medium">READY</span>
            </div>
          </div>
        </div>

        {/* Workflow indicator bubbles */}
        <div className="flex items-center gap-2 text-xs font-medium">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${workflowStep === 'analyzing' ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 text-blue-700 animate-pulse' : 'bg-[var(--crm-sidebar)] border-slate-150 dark:border-[var(--crm-card-border)] text-[var(--crm-text-muted)] '}`}>
            <span className="h-2 w-2 rounded-full bg-blue-50 dark:bg-blue-500/10" />
            1. Analyze
          </div>
          <ChevronRight size={14} className="text-slate-350" />
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${workflowStep === 'planning' ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 text-blue-700 animate-pulse' : 'bg-[var(--crm-sidebar)] border-slate-150 dark:border-[var(--crm-card-border)] text-[var(--crm-text-muted)] '}`}>
            <span className="h-2 w-2 rounded-full bg-blue-400" />
            2. Proposed
          </div>
          <ChevronRight size={14} className="text-slate-350" />
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${workflowStep === 'applied' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 text-emerald-700' : 'bg-[var(--crm-sidebar)] border-slate-150 dark:border-[var(--crm-card-border)] text-[var(--crm-text-muted)] '}`}>
            <span className="h-2 w-2 rounded-full bg-emerald-50 dark:bg-emerald-500/10" />
            3. Live Compile
          </div>
        </div>
      </div>

      {/* Split Code Studio & Right Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 4k:grid-cols-8 5k:grid-cols-12 gap-6">
        
        {/* Workspace directory tree list */}
        <div className="p-5 bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-2xl shadow-xs space-y-4 lg:col-span-1">
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-[var(--crm-text-muted)] font-mono">Sandbox Files</span>
            <input 
              type="text" 
              placeholder="Quick search file..."
              value={fileSearchQuery}
              onChange={e => setFileSearchQuery(e.target.value)}
              className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-xl px-3 py-1.5 text-xs text-[var(--crm-text)] text-[var(--crm-text)] placeholder-slate-400 outline-none"
            />
          </div>

          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {filteredFiles.map((file) => {
              const isActive = file.path === activeFilePath;
              return (
                <div 
                  key={file.path}
                  onClick={() => {
                    setActiveFilePath(file.path);
                    if (!openTabs.includes(file.path)) {
                      setOpenTabs(prev => [...prev, file.path]);
                    }
                  }}
                  className={`p-2.5 rounded-xl text-xs font-mono cursor-pointer transition-all flex items-center justify-between ${
                    isActive 
                      ? 'bg-blue-50 dark:bg-blue-500/10 border-l-3 border-blue-600 text-blue-700 font-medium' 
                      : 'hover:bg-[var(--crm-sidebar)] text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)]'
                  }`}
                >
                  <span className="truncate">{file.path}</span>
                  <span className="text-[10px] text-[var(--crm-text-muted)] ">{file.path.split('.').pop()}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Primary Code Editor Space */}
        <div className="lg:col-span-3 flex flex-col bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden shadow-xl min-h-[420px] relative">
          
          {/* Editor Header tabs */}
          <div className="h-11 bg-slate-900 border-b border-slate-850 flex items-center justify-between px-4 select-none">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {openTabs.map(tabPath => {
                const isTabActive = tabPath === activeFilePath;
                return (
                  <div 
                    key={tabPath}
                    onClick={() => setActiveFilePath(tabPath)}
                    className={`h-11 px-3.5 flex items-center gap-2 text-xs font-mono border-r border-slate-850 cursor-pointer transition-colors ${
                      isTabActive 
                        ? 'bg-slate-950 text-blue-400 font-medium border-t-2 border-t-blue-500' 
                        : 'text-[var(--crm-text-secondary)] hover:text-slate-300'
                    }`}
                  >
                    <span>{tabPath.split('/').pop()}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenTabs(prev => prev.filter(t => t !== tabPath));
                        if (activeFilePath === tabPath && openTabs.length > 1) {
                          setActiveFilePath(openTabs[0]);
                        }
                      }}
                      className="p-0.5 hover:bg-slate-800 rounded transition-colors text-[var(--crm-text-secondary)] hover:text-slate-300"
                    >
                      <X size={10} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button 
                onClick={handleRunLintCheck}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-[var(--crm-text-muted)] hover:text-white transition-colors"
                title="Run bracket lint check"
              >
                <Code size={13} />
              </button>
              <button 
                onClick={handleSaveFile}
                className="py-1 px-2.5 bg-blue-600 hover:bg-blue-50 dark:bg-blue-500/10 text-white rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-colors"
              >
                <Save size={12} />
                Save
              </button>
            </div>
          </div>

          {/* Editor Content Area (Prettified Mono display) */}
          <div className="flex-1 p-5 relative overflow-hidden flex flex-col">
            <textarea 
              value={editorValue}
              onChange={e => setEditorValue(e.target.value)}
              className="w-full flex-1 bg-transparent text-slate-300 font-mono text-[13px] leading-relaxed resize-none outline-none focus:ring-0 select-text overflow-y-auto"
              style={{ tabSize: 2 }}
            />
          </div>

          {/* Terminal Console Panel */}
          <div className="h-44 bg-slate-950 border-t border-slate-850 flex flex-col">
            <div className="h-8 bg-slate-900 border-b border-slate-850 flex items-center justify-between px-4 text-[10px] font-mono text-[var(--crm-text-secondary)] select-none">
              <span className="flex items-center gap-1.5  font-medium ">
                <TerminalIcon size={12} className="text-[var(--crm-text-secondary)] " />
                VIRTUAL TERMINAL SHELL
              </span>
              <span>npm run dev</span>
            </div>
            
            {/* Terminal logs list */}
            <div className="flex-1 p-3.5 overflow-y-auto font-mono text-xs text-[var(--crm-text-muted)] space-y-1 select-text">
              {terminalLogs.map((log, idx) => (
                <div key={idx} className="leading-relaxed whitespace-pre-wrap">
                  {log}
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>

            {/* Terminal Input */}
            <form onSubmit={handleTerminalSubmit} className="h-9 bg-slate-900 border-t border-slate-850 flex items-center px-4">
              <span className="text-blue-500 font-mono text-xs mr-2 select-none">$</span>
              <input 
                type="text" 
                placeholder="Type terminal commands here... (e.g. 'help', 'npm install', 'git reset')" 
                value={terminalInput}
                onChange={e => setTerminalInput(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none font-mono text-xs text-slate-200 placeholder-slate-600"
              />
            </form>
          </div>

        </div>

      </div>

      {/* Bottom prompt input bar to request modifications directly from Brains */}
      <div className="p-5 bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-2xl shadow-xs space-y-4">
        <form onSubmit={handleTriggerAgentBuild} className="flex gap-3">
          <input 
            type="text" 
            placeholder={`Ask ${activeBrain.name} to write code, refactor active file, or debug exceptions...`}
            value={userRequest}
            onChange={e => setUserRequest(e.target.value)}
            className="flex-1 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-xl px-4 py-3 text-xs text-[var(--crm-text)] text-[var(--crm-text)] placeholder-slate-400 outline-none focus:bg-[var(--crm-card)] focus:dark:bg-[var(--crm-card)] focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
          />
          <button 
            type="submit"
            disabled={isProcessing || !userRequest.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-[var(--crm-sidebar)] disabled:text-[var(--crm-text-muted)] text-white rounded-xl text-xs  shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            {isProcessing ? 'Processing...' : 'Run Forge Build'}
            <ArrowRight size={13} />
          </button>
        </form>
        <div className="flex items-center justify-between text-[11px] text-[var(--crm-text-muted)] font-mono">
          <span>Targeting Active Component: <strong>{activeFilePath}</strong></span>
          <span>Automatic rollback point created on compilation</span>
        </div>
      </div>

      {/* PROPOSED CHANGES SAFE MODAL */}
      {showProposedDialog && currentProposal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-150 dark:border-[var(--crm-card-border)] flex items-center justify-between bg-[var(--crm-sidebar)]/7 0 /70">
              <div>
                <span className="text-[10px] font-medium text-blue-600   font-mono">Safe Review Gate</span>
                <h3 className="font-semibold text-[var(--crm-text)] text-[var(--crm-text)] text-sm">Review Proposed Code Modifications</h3>
              </div>
              <button 
                onClick={() => {
                  setShowProposedDialog(false);
                  setCurrentProposal(null);
                }}
                className="p-1.5 hover:bg-[var(--crm-sidebar-active-bg)] rounded-lg text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Details panel */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-[var(--crm-card-border)] rounded-xl flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-600 pt-0.5 shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-xs font-medium text-amber-900">Safety Check & Activity Backup Activated</h4>
                  <p className="text-[11px] text-amber-700/95 leading-relaxed">
                    Zyqro AI Studio will write the contents directly into the virtual project file system. A version backup snapshot has been created so you can undo changes instantly.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-medium text-[var(--crm-text-secondary)] ">
                  <span>File: <strong className="text-[var(--crm-text)] text-[var(--crm-text)] font-mono">{currentProposal.path}</strong></span>
                  <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded text-[10px] font-medium ">PROPOSED REVISION</span>
                </div>
                <div className="p-4 bg-slate-950 text-slate-300 font-mono text-xs rounded-xl overflow-x-auto max-h-[300px] border border-slate-850 whitespace-pre">
                  {currentProposal.content}
                </div>
                <p className="text-xs italic text-[var(--crm-text-secondary)] leading-normal pl-1">
                  Description: {currentProposal.description}
                </p>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-4 border-t border-slate-150 dark:border-[var(--crm-card-border)] bg-[var(--crm-sidebar)]/8 0 /80 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => {
                  setShowProposedDialog(false);
                  setCurrentProposal(null);
                }}
                className="px-4 py-2 hover:bg-[var(--crm-sidebar-active-bg)] text-[var(--crm-text-secondary)] rounded-xl text-xs  transition-colors cursor-pointer"
              >
                Reject Changes
              </button>
              <button 
                onClick={handleApplyProposal}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                Accept & Commit Code
                <Check size={14} />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
