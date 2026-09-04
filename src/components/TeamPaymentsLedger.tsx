import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DollarSign, User, Calendar, CheckCircle2, Clock, AlertCircle, Edit2, X,
  Coins, TrendingUp, Globe, Landmark, Award, Scissors, PiggyBank, Plus,
  CreditCard, Trash2, Activity, Briefcase
} from 'lucide-react';
import { Project, TeamMember } from '../types';

interface TeamPaymentsLedgerProps {
  projects: Project[];
  teamMembers: TeamMember[];
  onUpdateProject: (updated: Project) => Promise<boolean>;
}

const TEAM_PAYMENT_METHODS = [
  {
    id: 'SadaPay',
    name: 'SadaPay',
    logo: (
      <svg viewBox="0 0 100 100" className="w-5 h-5 select-none shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M34 26C20 34 16 54 26 68C36 82 56 86 70 76C80 68 76 52 66 44C56 36 44 42 38 52" stroke="#16D3B4" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M66 74C80 66 84 46 74 32C64 18 44 14 30 24C20 32 24 48 34 56C44 64 56 58 62 48" stroke="#FF7F63" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    id: 'Payoneer',
    name: 'Payoneer',
    logo: (
      <svg viewBox="0 0 100 100" className="w-5 h-5 select-none shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="payoneerGradTeam" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF4E50" />
            <stop offset="35%" stopColor="#F9D423" />
            <stop offset="70%" stopColor="#20E2D7" />
            <stop offset="100%" stopColor="#B06AB3" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="36" stroke="url(#payoneerGradTeam)" strokeWidth="12" />
      </svg>
    )
  },
  {
    id: 'JazzCash',
    name: 'JazzCash',
    logo: (
      <svg viewBox="0 0 100 100" className="w-5 h-5 select-none shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 50 C30 30, 20 50, 20 70 C20 90, 50 90, 50 50 Z" fill="#FFC107" />
        <path d="M50 50 C70 70, 80 50, 80 30 C80 10, 50 10, 50 50 Z" fill="#E53935" />
      </svg>
    )
  },
  {
    id: 'Easypaisa',
    name: 'Easypaisa',
    logo: (
      <svg viewBox="0 0 100 100" className="w-5 h-5 select-none shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M25 50 C25 20, 85 20, 85 50 C85 65, 75 70, 50 70 C35 70, 25 60, 25 50 Z" stroke="#2D2A3B" strokeWidth="15" />
        <path d="M25 65 C35 85, 65 85, 85 65" stroke="#10B981" strokeWidth="14" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: 'Bank Account',
    name: 'Bank Account',
    logo: (
      <svg viewBox="0 0 100 100" className="w-5 h-5 select-none shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bankGradTeam" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
        </defs>
        <path d="M 18,50 A 32,32 0 0,1 75,23" stroke="url(#bankGradTeam)" strokeWidth="5.5" strokeLinecap="round" />
        <path d="M 75,23 L 61,22 M 75,23 L 74,37" stroke="url(#bankGradTeam)" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 82,50 A 32,32 0 0,1 25,77" stroke="url(#bankGradTeam)" strokeWidth="5.5" strokeLinecap="round" />
        <path d="M 25,77 L 39,78 M 25,77 L 26,63" stroke="url(#bankGradTeam)" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 32,62 H 68 M 36,62 V 46 M 44,62 V 46 M 52,62 V 46 M 60,62 V 46 M 34,46 H 66 M 50,32 L 32,42 L 68,42 Z" stroke="url(#bankGradTeam)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    )
  }
];

export default function TeamPaymentsLedger({ projects, teamMembers, onUpdateProject }: TeamPaymentsLedgerProps) {
  const [viewingPayoutProject, setViewingPayoutProject] = useState<Project | null>(null);

  // Add Payout Form State
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [addTeamMember, setAddTeamMember] = useState('');
  const [addProjectId, setAddProjectId] = useState('');
  const [addSalary, setAddSalary] = useState<number | ''>('');
  const [addBonus, setAddBonus] = useState<number | ''>('');
  const [addDeductions, setAddDeductions] = useState<number | ''>('');
  const [addPaymentDate, setAddPaymentDate] = useState('');
  const [addPaymentPlatform, setAddPaymentPlatform] = useState('SadaPay');
  const [addPaymentNotes, setAddPaymentNotes] = useState('');
  const [showAddPlatformDropdown, setShowAddPlatformDropdown] = useState(false);
  const [saving, setSaving] = useState(false);

  // Financial summary metrics
  const totalSalaryCommitted = projects.reduce((sum, p) => sum + Number(p.teamSalary || 0), 0);
  const totalBonusPaid = projects.reduce((sum, p) => sum + Number(p.teamBonus || 0), 0);
  const totalDeductions = projects.reduce((sum, p) => sum + Number(p.teamDeductions || 0), 0);
  const totalPayoutExpense = totalSalaryCommitted + totalBonusPaid - totalDeductions;

  const handleDeletePayout = async (p: Project) => {
    setSaving(true);
    const updated: Project = {
      ...p,
      teamSalary: undefined,
      teamBonus: undefined,
      teamDeductions: undefined,
      teamPaymentStatus: undefined,
      teamPaymentDate: undefined,
      teamPaymentPlatform: undefined,
      teamPaymentNotes: undefined
    };
    await onUpdateProject(updated);
    setViewingPayoutProject(null);
    setSaving(false);
  };

  const handleAddTeamPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addTeamMember) return;
    if (!addProjectId) return;

    setSaving(true);
    const selectedProject = projects.find(p => p.id === addProjectId);
    if (selectedProject) {
      const updated: Project = {
        ...selectedProject,
        assignedTeamMember: addTeamMember,
        teamSalary: addSalary === '' ? undefined : Number(addSalary),
        teamBonus: addBonus === '' ? undefined : Number(addBonus),
        teamDeductions: addDeductions === '' ? undefined : Number(addDeductions),
        teamPaymentDate: addPaymentDate,
        teamPaymentPlatform: addPaymentPlatform,
        teamPaymentNotes: addPaymentNotes.trim(),
        teamPaymentStatus: 'Paid' // Automatically record as Paid/Committed
      };

      const success = await onUpdateProject(updated);
      if (success) {
        setShowAddPaymentModal(false);
        setAddTeamMember('');
        setAddProjectId('');
        setAddSalary('');
        setAddBonus('');
        setAddDeductions('');
        setAddPaymentDate('');
        setAddPaymentPlatform('SadaPay');
        setAddPaymentNotes('');
      }
    }
    setSaving(false);
  };

  const getPlatformIcon = (platform: string) => {
    const matched = TEAM_PAYMENT_METHODS.find(m => m.id === platform);
    if (matched) return matched.logo;
    return <CreditCard size={12} className="text-[var(--crm-text-secondary)] mr-1.5 inline-block" />;
  };

  return (
    <div className="space-y-6">
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-slate-150 dark:border-[var(--crm-card-border)] rounded-xl p-4 shadow-2xs flex items-center gap-3">
          <div className="h-9 w-9 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-lg flex items-center justify-center border border-indigo-100 shrink-0">
            <User size={16} />
          </div>
          <div>
            <span className="text-[9px] font-medium text-[var(--crm-text-muted)] block">Base Salaries</span>
            <span className="text-base font-medium text-[var(--crm-text)] ">${totalSalaryCommitted.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-slate-150 dark:border-[var(--crm-card-border)] rounded-xl p-4 shadow-2xs flex items-center gap-3">
          <div className="h-9 w-9 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-100 shrink-0">
            <Award size={16} />
          </div>
          <div>
            <span className="text-[9px] font-medium text-[var(--crm-text-muted)] block">Bonus Payouts</span>
            <span className="text-base font-medium text-[var(--crm-text)] ">${totalBonusPaid.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-slate-150 dark:border-[var(--crm-card-border)] rounded-xl p-4 shadow-2xs flex items-center gap-3">
          <div className="h-9 w-9 bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-lg flex items-center justify-center border border-rose-100 shrink-0">
            <Scissors size={16} />
          </div>
          <div>
            <span className="text-[9px] font-medium text-[var(--crm-text-muted)] block">Deductions</span>
            <span className="text-base font-medium text-[var(--crm-text)] ">${totalDeductions.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-slate-150 dark:border-[var(--crm-card-border)] rounded-xl p-4 shadow-2xs flex items-center gap-3">
          <div className="h-9 w-9 bg-indigo-600 text-white rounded-lg flex items-center justify-center shrink-0">
            <PiggyBank size={16} />
          </div>
          <div>
            <span className="text-[9px] font-medium text-[var(--crm-text-muted)] block">Total Net Expense</span>
            <span className="text-base font-semibold text-indigo-700">${totalPayoutExpense.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-slate-150 dark:border-[var(--crm-card-border)] rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4.5 border-b border-slate-100 dark:border-[var(--crm-card-border)] bg-[var(--crm-sidebar)]/5 /50 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xs font-medium text-[var(--crm-text)] ">Team Projects & Salary Ledger</h3>
            <p className="text-[10px] text-[var(--crm-subtitle)] mt-0.5">Manage payouts, track salaries, award bonuses, apply deductions, and specify payout channels.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddPaymentModal(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-50 dark:bg-indigo-500/10 text-white font-medium text-xs rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 hover:scale-102 active:scale-98"
          >
            <Plus size={14} />
            Add Team Payment
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[var(--crm-text)]">
            <thead>
              <tr className="bg-[var(--crm-sidebar)]/7 /70 border-b border-slate-100 dark:border-[var(--crm-card-border)] text-[10px] font-medium text-[var(--crm-text-secondary)] ">
                <th className="py-3 px-4">Assigned Member</th>
                <th className="py-3 px-4">Associated Project</th>
                <th className="py-3 px-4">Base Salary</th>
                <th className="py-3 px-4">Bonus</th>
                <th className="py-3 px-4">Deductions</th>
                <th className="py-3 px-4">Net Payout</th>
                <th className="py-3 px-4">Platform & Notes</th>
                <th className="py-3 px-4">Payout Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[var(--crm-text-muted)] ">
                    No active deliverables or assigned members found. Define a project to populate this ledger.
                  </td>
                </tr>
              ) : (
                projects.map((p) => {
                  const sal = Number(p.teamSalary || 0);
                  const bon = Number(p.teamBonus || 0);
                  const ded = Number(p.teamDeductions || 0);
                  const net = sal + bon - ded;

                  let statusBg = 'bg-[var(--crm-sidebar)] text-[var(--crm-text-secondary)]';
                  if (p.teamPaymentStatus === 'Paid') statusBg = 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 border border-emerald-100';
                  else if (p.teamPaymentStatus === 'Pending') statusBg = 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 border border-amber-100';
                  else statusBg = 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 border border-rose-100';

                  return (
                    <tr key={p.id} className="hover:bg-[var(--crm-sidebar)]/5 dark:hover:bg-[#20242B]/50 /50 transition-colors cursor-pointer" onClick={() => setViewingPayoutProject(p)}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <User size={12} className="text-[var(--crm-text-muted)] " />
                          <span className="font-medium text-[var(--crm-text)] ">{p.assignedTeamMember || 'Unassigned'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-[var(--crm-text)]">{p.name}</div>
                        <div className="text-[9px] text-[var(--crm-text-muted)] ">{p.clientName || 'N/A'}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-[var(--crm-text)] ">${sal.toLocaleString()}</td>
                      <td className="py-3 px-4 font-semibold text-emerald-600">+${bon.toLocaleString()}</td>
                      <td className="py-3 px-4 font-semibold text-rose-600">-${ded.toLocaleString()}</td>
                      <td className="py-3 px-4 font-medium text-indigo-700">${net.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center text-[10px] font-semibold text-[var(--crm-text-secondary)]">
                          {getPlatformIcon(p.teamPaymentPlatform || 'SadaPay')}
                          <span className="ml-1">{p.teamPaymentPlatform || 'SadaPay'}</span>
                        </span>
                        {p.teamPaymentNotes && <div className="text-[9px] text-[var(--crm-text-muted)] mt-0.5 truncate max-w-[120px] 2xl:max-w-[180px] 2xl:max-w-[300px] 3xl:max-w-[500px] 4k:max-w-none 3xl:max-w-[350px] 4k:max-w-none ">{p.teamPaymentNotes}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-semibold  ${statusBg}`}>
                          {p.teamPaymentStatus || 'Unpaid'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setViewingPayoutProject(p); }}
                          className="p-1.5 hover:bg-[var(--crm-sidebar-active-bg)] rounded-lg text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] transition-colors cursor-pointer"
                        >
                          <Activity size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Team Payment Modal */}
      <AnimatePresence>
        {showAddPaymentModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-[var(--crm-card-border)] text-[var(--crm-text)] text-xs"
            >
              <div className="px-5 py-3.5 bg-[var(--crm-sidebar)] border-b border-slate-100 dark:border-[var(--crm-card-border)] flex justify-between items-center">
                <div>
                  <span className="text-[9px] font-medium text-indigo-600   block">Team Operations</span>
                  <h3 className="text-xs font-medium text-[var(--crm-text)] ">Record Team Payment</h3>
                </div>
                <button 
                  onClick={() => setShowAddPaymentModal(false)}
                  className="p-1 text-[var(--crm-text-muted)] hover:text-[var(--crm-text-secondary)] rounded-lg hover:bg-[var(--crm-sidebar-active-bg)] transition-colors cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleAddTeamPaymentSubmit} className="p-5 space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-[var(--crm-text-secondary)] block">Team Member *</label>
                  <select 
                    required
                    value={addTeamMember}
                    onChange={(e) => setAddTeamMember(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs bg-[var(--crm-card)] dark:bg-[var(--crm-card)] text-[var(--crm-text)]  cursor-pointer"
                  >
                    <option value="">Select Team Member</option>
                    {teamMembers.map(t => (
                      <option key={t.id} value={t.fullName}>{t.fullName} ({t.role})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-[var(--crm-text-secondary)] block">Assigned Project *</label>
                  <select 
                    required
                    value={addProjectId}
                    onChange={(e) => setAddProjectId(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs bg-[var(--crm-card)] dark:bg-[var(--crm-card)] text-[var(--crm-text)]  cursor-pointer"
                  >
                    <option value="">Select Project</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-[var(--crm-text-secondary)] block">Base Salary</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-2.5 text-[10px] font-medium text-[var(--crm-text-muted)] ">$</span>
                      <input 
                        type="number"
                        value={addSalary}
                        onChange={(e) => setAddSalary(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full pl-5 pr-1.5 py-1.5 border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs font-medium text-[var(--crm-text)] bg-[var(--crm-card)] dark:bg-[var(--crm-card)]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-[var(--crm-text-secondary)] block">Bonus</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-2.5 text-[10px] font-medium text-[var(--crm-text-muted)] ">$</span>
                      <input 
                        type="number"
                        value={addBonus}
                        onChange={(e) => setAddBonus(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full pl-5 pr-1.5 py-1.5 border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs font-medium text-emerald-600 bg-[var(--crm-card)] dark:bg-[var(--crm-card)]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-[var(--crm-text-secondary)] block">Deductions</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-2.5 text-[10px] font-medium text-[var(--crm-text-muted)] ">$</span>
                      <input 
                        type="number"
                        value={addDeductions}
                        onChange={(e) => setAddDeductions(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full pl-5 pr-1.5 py-1.5 border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs font-medium text-rose-600 bg-[var(--crm-card)] dark:bg-[var(--crm-card)]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-[var(--crm-text-secondary)] block">Payment Date</label>
                    <input 
                      type="date"
                      value={addPaymentDate}
                      onChange={(e) => setAddPaymentDate(e.target.value)}
                      className="w-full px-3 py-1.5 border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs bg-[var(--crm-card)] dark:bg-[var(--crm-card)] text-[var(--crm-text)]  cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1 relative">
                    <label className="text-[10px] font-medium text-[var(--crm-text-secondary)] block">Payout Channel</label>
                    
                    <button
                      type="button"
                      onClick={() => setShowAddPlatformDropdown(!showAddPlatformDropdown)}
                      className="w-full px-3 py-1.5 border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs bg-[var(--crm-card)] dark:bg-[var(--crm-card)] font-semibold text-[var(--crm-text)] flex items-center justify-between cursor-pointer hover:bg-[var(--crm-sidebar)] transition-colors h-[34px] shadow-2xs"
                    >
                      <span>{addPaymentPlatform}</span>
                      {TEAM_PAYMENT_METHODS.find(m => m.id === addPaymentPlatform)?.logo}
                    </button>

                    <AnimatePresence>
                      {showAddPlatformDropdown && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setShowAddPlatformDropdown(false)} />
                          <motion.div 
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="absolute left-0 right-0 mt-1 bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-lg shadow-xl z-40 max-h-48 overflow-y-auto py-1"
                          >
                            {TEAM_PAYMENT_METHODS.map(method => (
                              <button
                                key={method.id}
                                type="button"
                                onClick={() => {
                                  setAddPaymentPlatform(method.id);
                                  setShowAddPlatformDropdown(false);
                                }}
                                className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-indigo-50 dark:bg-indigo-500/10 transition-colors"
                              >
                                <span className="font-medium text-[var(--crm-text)] text-xs">{method.name}</span>
                                <span className="flex-1 border-b border-dotted border-slate-300 dark:border-[var(--crm-card-border)] mx-2" />
                                <span className="shrink-0">{method.logo}</span>
                              </button>
                            ))}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-[var(--crm-text-secondary)] block">Payment Notes</label>
                  <textarea 
                    rows={2}
                    placeholder="Provide details about payout transaction reference, invoice numbers..."
                    value={addPaymentNotes}
                    onChange={(e) => setAddPaymentNotes(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs bg-[var(--crm-card)] dark:bg-[var(--crm-card)] text-[var(--crm-text)]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2.5">
                  <button 
                    type="button"
                    onClick={() => setShowAddPaymentModal(false)}
                    className="px-3.5 py-1.5 bg-[var(--crm-sidebar)] hover:bg-slate-200 text-[var(--crm-text)] text-xs  rounded-lg transition-all border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-50 dark:bg-indigo-500/10 text-white text-xs font-medium rounded-lg transition-all shadow-xs cursor-pointer"
                    disabled={saving}
                  >
                    {saving ? 'Recording...' : 'Record Payment'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payout Details Profile Modal */}
      <AnimatePresence>
        {viewingPayoutProject && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] w-full max-w-lg 2xl:max-w-xl 3xl:max-w-2xl 4k:max-w-3xl 5k:max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] text-[var(--crm-text)] "
            >
              {/* Header profile block */}
              <div className="bg-slate-900 text-white p-6 relative">
                <button 
                  onClick={() => setViewingPayoutProject(null)}
                  className="absolute top-4 right-4 text-[var(--crm-text-muted)] hover:text-white transition-colors cursor-pointer p-1 rounded-full hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
                
                <div className="flex gap-4 items-center">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className="h-16 w-16 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center text-white text-xl font-medium shadow-md border-2 border-[var(--crm-card-border)] select-none"
                  >
                    <User size={28} />
                  </motion.div>
                  <div>
                    <span className={`text-[10px] font-semibold   px-2 py-0.5 rounded-full ${
                      viewingPayoutProject.teamPaymentStatus === 'Paid' ? 'bg-emerald-50 dark:bg-emerald-500/10/20 text-emerald-300' :
                      viewingPayoutProject.teamPaymentStatus === 'Pending' ? 'bg-amber-50 dark:bg-amber-500/10/20 text-amber-300' :
                      'bg-slate-700 text-slate-300'
                    }`}>
                      {viewingPayoutProject.teamPaymentStatus || 'Unpaid'}
                    </span>
                    <h4 className="text-xl font-medium tracking-tight mt-1.5">{viewingPayoutProject.assignedTeamMember || 'Unassigned Member'}</h4>
                    <p className="text-xs text-slate-300 flex items-center gap-1 mt-1">
                      <Briefcase size={12} className="text-indigo-400" /> Project: {viewingPayoutProject.name}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[var(--crm-sidebar)] border border-slate-100 dark:border-[var(--crm-card-border)] rounded-xl p-4">
                    <span className="text-[10px] font-medium text-[var(--crm-text-muted)] block mb-1">Base Salary</span>
                    <span className="text-lg font-semibold text-[var(--crm-text)] ">${Number(viewingPayoutProject.teamSalary || 0).toLocaleString()}</span>
                  </div>
                  <div className="bg-[var(--crm-sidebar)] border border-slate-100 dark:border-[var(--crm-card-border)] rounded-xl p-4">
                    <span className="text-[10px] font-medium text-[var(--crm-text-muted)] block mb-1">Net Payout</span>
                    <span className="text-lg font-semibold text-indigo-600">${(Number(viewingPayoutProject.teamSalary || 0) + Number(viewingPayoutProject.teamBonus || 0) - Number(viewingPayoutProject.teamDeductions || 0)).toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-slate-150 dark:border-[var(--crm-card-border)] rounded-xl p-5 shadow-2xs space-y-4">
                  <h5 className="text-xs font-medium text-[var(--crm-text)] border-b border-slate-100 dark:border-[var(--crm-card-border)] pb-2">Financial Breakdown</h5>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-xs font-medium text-[var(--crm-text-secondary)] ">Bonus</span>
                      <span className="text-sm font-medium text-emerald-600">+${Number(viewingPayoutProject.teamBonus || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-xs font-medium text-[var(--crm-text-secondary)] ">Deductions</span>
                      <span className="text-sm font-medium text-rose-600">-${Number(viewingPayoutProject.teamDeductions || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-slate-150 dark:border-[var(--crm-card-border)] rounded-xl p-5 shadow-2xs space-y-4">
                  <h5 className="text-xs font-medium text-[var(--crm-text)] border-b border-slate-100 dark:border-[var(--crm-card-border)] pb-2">Payment Meta</h5>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-xs font-medium text-[var(--crm-text-secondary)] ">Platform</span>
                      <span className="text-sm font-medium text-[var(--crm-text)] flex items-center gap-1.5">
                        {getPlatformIcon(viewingPayoutProject.teamPaymentPlatform || 'SadaPay')}
                        {viewingPayoutProject.teamPaymentPlatform || 'SadaPay'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-xs font-medium text-[var(--crm-text-secondary)] ">Date</span>
                      <span className="text-sm font-medium text-[var(--crm-text)] ">{viewingPayoutProject.teamPaymentDate || 'Not set'}</span>
                    </div>
                    {viewingPayoutProject.teamPaymentNotes && (
                      <div className="py-2 border-b border-slate-50">
                        <span className="text-xs font-medium text-[var(--crm-text-secondary)] block mb-1">Notes</span>
                        <p className="text-xs  text-[var(--crm-text)] ">{viewingPayoutProject.teamPaymentNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-[var(--crm-sidebar)] border-t border-slate-100 dark:border-[var(--crm-card-border)] flex justify-between items-center shrink-0">
                <button
                  onClick={() => handleDeletePayout(viewingPayoutProject)}
                  className="px-4 py-2 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 text-rose-600 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-2"
                  disabled={saving}
                >
                  <Trash2 size={14} /> {saving ? 'Deleting...' : 'Delete Payout'}
                </button>
                <button
                  onClick={() => setViewingPayoutProject(null)}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-50 dark:bg-indigo-500/10 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-md"
                >
                  Close Profile
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
