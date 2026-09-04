import React, { useState } from 'react';
import { 
  Sparkles, 
  Map, 
  Database, 
  Compass, 
  Layers, 
  Clock, 
  CheckCircle, 
  ArrowRight, 
  Plus, 
  CheckSquare, 
  Square,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Brain, VirtualFile, RoadmapItem, ArchitectureNote } from './types';

interface PlanTabProps {
  activeBrain: Brain;
  activeProjectFiles: VirtualFile[];
  onKickoffBuild: (planItems: string[], revisions: any[]) => void;
  isGeneratingPlan: boolean;
  onGeneratePlan: (userRequirements: string) => void;
}

export default function PlanTab({
  activeBrain,
  activeProjectFiles,
  onKickoffBuild,
  isGeneratingPlan,
  onGeneratePlan
}: PlanTabProps) {
  const [requirementsInput, setRequirementsInput] = useState('');
  const [hasPlanGenerated, setHasPlanGenerated] = useState(false);
  
  // Roadmap local states
  const [roadmap, setRoadmap] = useState<RoadmapItem[]>([
    { id: 'step-1', task: 'Analyze workspace dependencies and file paths', status: 'completed', estimatedMinutes: 5 },
    { id: 'step-2', task: 'Design UI structure and state bindings', status: 'pending', estimatedMinutes: 15 },
    { id: 'step-3', task: 'Implement helper utility models and seed mock items', status: 'pending', estimatedMinutes: 10 },
    { id: 'step-4', task: 'Build responsive components & connect to local sandbox state', status: 'pending', estimatedMinutes: 20 },
    { id: 'step-5', task: 'Run static linter validation and hot compile preview', status: 'pending', estimatedMinutes: 5 }
  ]);

  const [dbSuggestions, setDbSuggestions] = useState<{ table: string; columns: string[] }[]>([
    { table: 'users', columns: ['id (UUID, PK)', 'email (VARCHAR, UNIQUE)', 'password_hash (VARCHAR)', 'created_at (TIMESTAMP)'] },
    { table: 'billing_subscriptions', columns: ['id (UUID, PK)', 'user_id (FK)', 'plan_tier (VARCHAR)', 'status (VARCHAR)', 'next_billing (DATE)'] }
  ]);

  const [complexity, setComplexity] = useState<'low' | 'medium' | 'high'>('medium');
  const [proposedFiles, setProposedFiles] = useState<{ path: string; action: 'create' | 'modify' }[]>([
    { path: 'src/App.tsx', action: 'modify' },
    { path: 'src/components/SubscriptionCard.tsx', action: 'create' },
    { path: 'src/utils.ts', action: 'modify' }
  ]);

  const handleToggleRoadmapStep = (id: string) => {
    setRoadmap(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, status: item.status === 'completed' ? 'pending' : 'completed' };
      }
      return item;
    }));
  };

  const handleGenerateClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requirementsInput.trim()) return;

    onGeneratePlan(requirementsInput);
    
    // Auto populate custom smart things for visuals
    setTimeout(() => {
      setHasPlanGenerated(true);
      // Simulate smarter schemas/roadmaps based on some words
      const lower = requirementsInput.toLowerCase();
      if (lower.includes('auth') || lower.includes('login') || lower.includes('security')) {
        setDbSuggestions([
          { table: 'accounts', columns: ['id (UUID, PK)', 'username (VARCHAR)', 'hash_pwd (TEXT)', 'mfa_enabled (BOOLEAN)'] },
          { table: 'login_audits', columns: ['id (INT, PK)', 'account_id (FK)', 'ip_address (VARCHAR)', 'success (BOOL)', 'login_time (TIMESTAMP)'] }
        ]);
        setRoadmap([
          { id: 'r-1', task: 'Audit authentication hooks and password salt workflows', status: 'completed', estimatedMinutes: 8 },
          { id: 'r-2', task: 'Create Account Login interface components', status: 'pending', estimatedMinutes: 15 },
          { id: 'r-3', task: 'Setup token verification interceptors', status: 'pending', estimatedMinutes: 20 },
          { id: 'r-4', task: 'Verify session storage encryption triggers', status: 'pending', estimatedMinutes: 10 }
        ]);
        setComplexity('high');
        setProposedFiles([
          { path: 'src/components/LoginAuth.tsx', action: 'create' },
          { path: 'src/App.tsx', action: 'modify' }
        ]);
      } else if (lower.includes('chart') || lower.includes('dashboard') || lower.includes('analytics')) {
        setDbSuggestions([
          { table: 'analytics_logs', columns: ['id (INTEGER, PK)', 'event_type (VARCHAR)', 'client_id (VARCHAR)', 'payload_json (TEXT)', 'captured_at (TIMESTAMP)'] }
        ]);
        setRoadmap([
          { id: 'r-1', task: 'Load charts UI dependencies inside project manifest', status: 'completed', estimatedMinutes: 5 },
          { id: 'r-2', task: 'Develop visual bar and line chart widgets using responsive elements', status: 'pending', estimatedMinutes: 25 },
          { id: 'r-3', task: 'Connect timeline metric calculations', status: 'pending', estimatedMinutes: 15 }
        ]);
        setComplexity('medium');
        setProposedFiles([
          { path: 'src/components/AnalyticsCharts.tsx', action: 'create' },
          { path: 'src/App.tsx', action: 'modify' }
        ]);
      } else {
        // Standard
        setComplexity('low');
      }
    }, 1500);
  };

  const handleApproveAndStartBuild = () => {
    // Generate dummy revisions mock list to push to build mode based on active settings
    const activeRevisions = proposedFiles.map(pf => {
      if (pf.action === 'create') {
        return {
          path: pf.path,
          description: `Automatically initiated creation of component: ${pf.path}`,
          content: `// Dynamic Boilerplate created by ${activeBrain.name}
import React from 'react';

export default function NewModule() {
  return (
    <div className="p-6 bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-2xl shadow-sm space-y-3">
      <h3 className="text-sm font-medium text-[var(--crm-text)] text-[var(--crm-text)]">New Module Component</h3>
      <p className="text-xs text-[var(--crm-text-secondary)] ">Formulated under plan recommendations.</p>
    </div>
  );
}`
        };
      } else {
        return {
          path: pf.path,
          description: `Plan modification update for ${pf.path}`,
          content: `// Modified module content`
        };
      }
    });

    onKickoffBuild(
      roadmap.map(r => r.task),
      activeRevisions
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Upper active Brain info block */}
      <div className="p-4 bg-blue-50/50 dark:bg-blue-500/10 border border-[var(--crm-card-border)] rounded-2xl flex items-start gap-3.5">
        <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
          <Compass size={20} />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-medium text-blue-900  ">PLANNING ARCHITECT ACTIVE</h3>
            <span className="px-2 py-0.5 bg-blue-600 text-white rounded-full text-[9px] font-semibold ">{activeBrain.name}</span>
          </div>
          <p className="text-xs text-blue-700/80 leading-relaxed">
            Let's blueprint your software structure. State your objective, and we will formulate schemas, file lists, checklists, and complexity profiles before writing single lines of code.
          </p>
        </div>
      </div>

      {/* Main Requirement form */}
      <div className="p-5 bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-2xl shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-medium text-[var(--crm-text-secondary)] mb-2">Describe What You Want to Build</label>
          <textarea 
            rows={3}
            placeholder="e.g. 'Add corporate authentication system with custom logs' or 'Design a client analytics panel with metrics chart'..."
            value={requirementsInput}
            onChange={(e) => setRequirementsInput(e.target.value)}
            className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-xl p-3.5 text-xs text-[var(--crm-text)] text-[var(--crm-text)] placeholder-slate-400 focus:bg-[var(--crm-card)] focus:dark:bg-[var(--crm-card)] focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
          />
        </div>

        <div className="flex justify-between items-center">
          <div className="text-[11px] text-[var(--crm-text-muted)] font-mono">
            Scanning {activeProjectFiles.length} workspace files for planning references
          </div>
          <button 
            onClick={handleGenerateClick}
            disabled={isGeneratingPlan || !requirementsInput.trim()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:disabled:text-[var(--crm-text-muted)] active:bg-blue-800 text-white text-xs  rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            {isGeneratingPlan ? (
              <>
                <Sparkles size={14} className="animate-spin" />
                Architecting System...
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Generate Architecture Plan
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated output displays */}
      {(hasPlanGenerated || isGeneratingPlan) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          
          {/* Column A: Checklist & Roadmap */}
          <div className="p-5 bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[var(--crm-card-border)] pb-3">
              <div className="flex items-center gap-2">
                <Map size={16} className="text-blue-600" />
                <h4 className="font-medium text-[var(--crm-text)] text-[var(--crm-text)] text-xs  ">Proposed Development Roadmap</h4>
              </div>
              <span className="text-[10px] bg-[var(--crm-sidebar)] text-[var(--crm-text-secondary)] font-mono  px-2.5 py-1 rounded-full ">
                {roadmap.filter(r => r.status === 'completed').length}/{roadmap.length} Steps Ready
              </span>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {roadmap.map((step) => (
                <div 
                  key={step.id} 
                  onClick={() => handleToggleRoadmapStep(step.id)}
                  className={`p-3 border rounded-xl flex items-start gap-3 cursor-pointer transition-all ${
                    step.status === 'completed' 
                      ? 'bg-[var(--crm-sidebar)]/7 0 /70 border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] text-[var(--crm-text-secondary)] ' 
                      : 'bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] hover:border-slate-350 text-[var(--crm-text)] text-[var(--crm-text)] hover:shadow-xs'
                  }`}
                >
                  <button className="pt-0.5 shrink-0 transition-all">
                    {step.status === 'completed' ? (
                      <CheckSquare size={16} className="text-blue-600" />
                    ) : (
                      <Square size={16} className="text-slate-300" />
                    )}
                  </button>
                  <div className="space-y-1">
                    <p className={`text-xs font-medium leading-relaxed ${step.status === 'completed' ? 'line-through text-[var(--crm-text-muted)] ' : ''}`}>
                      {step.task}
                    </p>
                    <div className="flex items-center gap-1.5 font-mono text-[9px] text-[var(--crm-text-muted)] ">
                      <Clock size={11} />
                      Est. {step.estimatedMinutes} minutes
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Architecture Details */}
            <div className="bg-[var(--crm-sidebar)]/6 0 /60 border border-slate-150 dark:border-[var(--crm-card-border)] p-4 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between text-xs font-medium text-[var(--crm-text)]">
                <span className="flex items-center gap-1.5">
                  <Layers size={13} className="text-[var(--crm-text-muted)] " />
                  Technical Stack Complexity
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold   ${
                  complexity === 'low' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border border-emerald-100' :
                  complexity === 'medium' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 border border-amber-100' :
                  'bg-rose-50 dark:bg-rose-500/10 text-rose-600 border border-rose-100'
                }`}>
                  {complexity}
                </span>
              </div>
              <p className="text-[11px] text-[var(--crm-text-secondary)] leading-relaxed">
                Database integrations require secure schema migrations. Testing sandbox environment evaluates compilation dynamically before live commit.
              </p>
            </div>
          </div>

          {/* Column B: Schemas & Files Affected */}
          <div className="space-y-6">
            
            {/* Database suggestions */}
            <div className="p-5 bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-2xl shadow-xs space-y-3.5">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-[var(--crm-card-border)] pb-2.5">
                <Database size={16} className="text-blue-600" />
                <h4 className="font-medium text-[var(--crm-text)] text-[var(--crm-text)] text-xs  ">Suggested SQL Table Schema</h4>
              </div>

              <div className="space-y-3">
                {dbSuggestions.map((table, tIdx) => (
                  <div key={tIdx} className="bg-slate-900 rounded-xl p-3.5 font-mono text-xs text-slate-300 space-y-1.5 border border-slate-850">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 font-medium">CREATE TABLE {table.table} (</span>
                      <span className="text-[9px] font-medium text-[var(--crm-text-secondary)] bg-slate-800 px-2 py-0.5 rounded">PostgreSQL</span>
                    </div>
                    <div className="pl-4 space-y-0.5 text-[11px] text-[var(--crm-text-muted)] ">
                      {table.columns.map((col, cIdx) => (
                        <div key={cIdx}>
                          {col}
                          {cIdx < table.columns.length - 1 ? ',' : ''}
                        </div>
                      ))}
                    </div>
                    <span className="text-emerald-400 block font-medium">);</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Affected File structure & Actions */}
            <div className="p-5 bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-2xl shadow-xs space-y-3">
              <h4 className="font-medium text-[var(--crm-text)] text-xs  ">Workspace File Impact List</h4>
              <div className="space-y-2">
                {proposedFiles.map((pf, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-[var(--crm-sidebar)] border border-slate-150 dark:border-[var(--crm-card-border)] rounded-xl">
                    <span className="text-xs font-mono font-medium text-[var(--crm-text)]">{pf.path}</span>
                    <span className={`px-2.5 py-1 text-[9px] font-semibold  rounded-md  border ${
                      pf.action === 'create' 
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-100' 
                        : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 border-blue-100'
                    }`}>
                      {pf.action === 'create' ? 'CREATE FILE' : 'MODIFY FILE'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action Approval Bar */}
              <div className="pt-4 border-t border-slate-100 dark:border-[var(--crm-card-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-xs text-[var(--crm-text-secondary)] ">
                  <AlertCircle size={14} className="text-blue-500" />
                  Requires developer consent to compile
                </div>
                
                <button 
                  onClick={handleApproveAndStartBuild}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-medium rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-xs self-end sm:self-auto"
                >
                  Approve Plan & Initiate Build
                  <ArrowRight size={14} />
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
