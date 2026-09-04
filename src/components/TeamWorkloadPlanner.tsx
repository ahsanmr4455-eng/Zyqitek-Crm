import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  Users, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  X, 
  ChevronDown, 
  User, 
  Save,
  Building2,
  FileText
} from 'lucide-react';
import { TeamMember, Project, Client } from '../types';

interface TeamWorkloadPlannerProps {
  teamMembers: TeamMember[];
  clients: Client[];
  projects: Project[];
  tasks: any[];
  onUpdateTeamMember: (member: TeamMember) => Promise<boolean>;
  onUpdateProject: (project: Project) => Promise<boolean>;
  onOpenProfile: (member: TeamMember) => void;
}

export default function TeamWorkloadPlanner({
  teamMembers,
  clients,
  projects,
  onUpdateTeamMember,
  onUpdateProject,
  onOpenProfile
}: TeamWorkloadPlannerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  
  const [assigningMember, setAssigningMember] = useState<TeamMember | null>(null);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Filtered list
  const filteredMembers = useMemo(() => {
    return teamMembers.filter(m => {
      const matchesSearch = m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           m.role.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || m.workloadStatus === statusFilter;
      const matchesRole = roleFilter === 'All' || m.role === roleFilter;
      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [teamMembers, searchTerm, statusFilter, roleFilter]);

  // Capacity stats
  const stats = useMemo(() => {
    return {
      available: teamMembers.filter(m => m.workloadStatus === 'Available').length,
      atCapacity: teamMembers.filter(m => m.workloadStatus === 'At Capacity').length,
      overloaded: teamMembers.filter(m => m.workloadStatus === 'Overloaded').length,
    };
  }, [teamMembers]);

  // Unique roles for filter
  const roles = useMemo(() => {
    const r = new Set(teamMembers.map(m => m.role));
    return Array.from(r).sort();
  }, [teamMembers]);

  const handleStatusChange = async (member: TeamMember, newStatus: TeamMember['workloadStatus']) => {
    await onUpdateTeamMember({
      ...member,
      workloadStatus: newStatus
    });
  };

  const handleNotesChange = async (member: TeamMember, notes: string) => {
    await onUpdateTeamMember({
      ...member,
      capacityNotes: notes
    });
  };

  const handleAssignProject = async () => {
    if (!assigningMember || !selectedProjectId) return;
    setIsAssigning(true);
    const project = projects.find(p => p.id === selectedProjectId);
    if (project) {
      await onUpdateProject({
        ...project,
        assignedTeamMemberId: assigningMember.id,
        assignedTeamMember: assigningMember.fullName
      });
    }
    setIsAssigning(false);
    setAssigningMember(null);
    setSelectedClientId('');
    setSelectedProjectId('');
  };

  const availableProjectsForClient = useMemo(() => {
    if (!selectedClientId) return [];
    return projects.filter(p => p.clientId === selectedClientId);
  }, [projects, selectedClientId]);

  return (
    <div className="space-y-6">
      {/* 1. Global Capacity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CapacityCard 
          label="Available" 
          value={stats.available} 
          icon={<User size={20} />} 
          color="emerald" 
          description="Members marked Available"
        />
        <CapacityCard 
          label="At Capacity" 
          value={stats.atCapacity} 
          icon={<Clock size={20} />} 
          color="amber" 
          description="Members marked At Capacity"
        />
        <CapacityCard 
          label="Overloaded" 
          value={stats.overloaded} 
          icon={<AlertCircle size={20} />} 
          color="rose" 
          description="Members marked Overloaded"
        />
      </div>

      {/* 2. Controls */}
      <div className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] p-4 rounded-xl border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--crm-text-muted)] " />
          <input 
            type="text"
            placeholder="Search team member..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-[var(--crm-text-muted)] ">Status:</span>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--crm-text)] outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="Available">Available</option>
              <option value="At Capacity">At Capacity</option>
              <option value="Overloaded">Overloaded</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-[var(--crm-text-muted)] ">Role:</span>
            <select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--crm-text)] outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="All">All Roles</option>
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Team Member Workload List */}
      <div className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] rounded-2xl border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-[var(--crm-sidebar)] border-b border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)]">
                <th className="py-4 px-6 text-[10px] font-semibold text-[var(--crm-text-muted)] ">Team Member</th>
                <th className="py-4 px-4 text-[10px] font-semibold text-[var(--crm-text-muted)] ">Workload Status</th>
                <th className="py-4 px-4 text-[10px] font-semibold text-[var(--crm-text-muted)] ">Active Assignments</th>
                <th className="py-4 px-4 text-[10px] font-semibold text-[var(--crm-text-muted)] ">Capacity Notes</th>
                <th className="py-4 px-6 text-right text-[10px] font-semibold text-[var(--crm-text-muted)] ">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-[#30353D]">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[var(--crm-text-muted)] text-sm  italic">
                    {teamMembers.length === 0 ? "No team members available." : "No team members match your filters."}
                  </td>
                </tr>
              ) : (
                filteredMembers.map(member => (
                  <tr key={member.id} className="hover:bg-[var(--crm-sidebar)]/5 dark:hover:bg-[#20242B]/50 /50 transition-colors">
                    {/* Profile */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div 
                          className="cursor-pointer group"
                          onClick={() => onOpenProfile(member)}
                        >
                          {member.avatar && !member.avatar.includes('/_/upload') ? (
                            <img src={member.avatar} alt={member.fullName} className="h-10 w-10 rounded-xl object-cover border border-zinc-100 dark:border-[var(--crm-card-border)] shadow-xs group-hover:ring-2 group-hover:ring-indigo-500/30 transition-all" />
                          ) : (
                            <div className="h-10 w-10 rounded-xl bg-zinc-900 text-white font-semibold flex items-center justify-center text-[10px] shadow-xs group-hover:ring-2 group-hover:ring-indigo-500/30 transition-all">
                              {member.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 
                            className="text-sm font-medium text-[var(--crm-text)] cursor-pointer hover:text-indigo-600 transition-colors"
                            onClick={() => onOpenProfile(member)}
                          >
                            {member.fullName}
                          </h4>
                          <p className="text-[10px]  text-[var(--crm-text-muted)] tracking-tight">{member.role} • {member.service}</p>
                        </div>
                      </div>
                    </td>

                    {/* Workload Status */}
                    <td className="py-4 px-4">
                      <select 
                        value={member.workloadStatus || 'Available'}
                        onChange={(e) => handleStatusChange(member, e.target.value as any)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold   outline-hidden border transition-all cursor-pointer ${
                          member.workloadStatus === 'Available' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 border-emerald-100' :
                          member.workloadStatus === 'At Capacity' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 border-amber-100' :
                          member.workloadStatus === 'Overloaded' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 border-rose-100' :
                          'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 border-emerald-100'
                        }`}
                      >
                        <option value="Available">Available</option>
                        <option value="At Capacity">At Capacity</option>
                        <option value="Overloaded">Overloaded</option>
                      </select>
                    </td>

                    {/* Active Assignments */}
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1.5 max-w-[300px]">
                        <ActiveAssignments memberId={member.id} projects={projects} />
                      </div>
                    </td>

                    {/* Capacity Notes */}
                    <td className="py-4 px-4">
                      <textarea 
                        placeholder="Add manual notes (e.g. On leave next Monday)"
                        value={member.capacityNotes || ''}
                        onChange={(e) => handleNotesChange(member, e.target.value)}
                        className="w-full min-h-[60px] bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-xl p-2 text-xs font-medium text-[var(--crm-text-secondary)] outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 resize-none"
                      />
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <button 
                        onClick={() => setAssigningMember(member)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-50 dark:bg-indigo-500/10 text-white text-[10px] font-semibold   rounded-xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                      >
                        <Plus size={14} /> Assign Project
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Assign Project Modal */}
      <AnimatePresence>
        {assigningMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-100 dark:border-[var(--crm-card-border)] flex justify-between items-center bg-[var(--crm-sidebar)]/5 dark:bg-zinc-900/20 /50">
                <div>
                  <h3 className="font-semibold text-[var(--crm-text)] text-base  tracking-tight">Assign Project</h3>
                  <p className="text-xs text-[var(--crm-subtitle)] mt-1">Assign an existing project to {assigningMember.fullName}</p>
                </div>
                <button onClick={() => setAssigningMember(null)} className="p-2 hover:bg-[var(--crm-card)] hover:dark:bg-[var(--crm-card)] rounded-xl text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] transition-all cursor-pointer"><X size={20} /></button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-[var(--crm-text-muted)] block">Select Client</label>
                  <select 
                    value={selectedClientId}
                    onChange={(e) => {
                      setSelectedClientId(e.target.value);
                      setSelectedProjectId('');
                    }}
                    className="w-full px-4 py-2.5 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-xl text-sm font-medium text-[var(--crm-text)] outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    <option value="">Select a Client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-[var(--crm-text-muted)] block">Select Project</label>
                  <select 
                    disabled={!selectedClientId}
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-xl text-sm font-medium text-[var(--crm-text)] outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <option value="">Select a Project</option>
                    {availableProjectsForClient.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.assignedTeamMember ? `(Assigned: ${p.assignedTeamMember})` : '(Unassigned)'}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedProjectId && (() => {
                  const p = projects.find(x => x.id === selectedProjectId);
                  if (p?.assignedTeamMemberId && p.assignedTeamMemberId !== assigningMember.id) {
                    return (
                      <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 rounded-xl flex items-start gap-2">
                        <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-amber-700 ">This project is currently assigned to <strong>{p.assignedTeamMember}</strong>. Saving will reassign it.</p>
                      </div>
                    );
                  }
                  return null;
                })()}

                <div className="pt-4 flex gap-3">
                  <button 
                    onClick={() => setAssigningMember(null)}
                    className="flex-1 py-2.5 text-sm font-medium text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar)] rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    disabled={!selectedProjectId || isAssigning}
                    onClick={handleAssignProject}
                    className="flex-2 py-2.5 bg-indigo-600 hover:bg-indigo-50 dark:bg-indigo-500/10 text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                  >
                    {isAssigning ? 'Saving...' : 'Confirm Assignment'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CapacityCard({ label, value, icon, color, description }: { label: string; value: number; icon: React.ReactNode; color: 'emerald' | 'amber' | 'rose'; description: string }) {
  const styles = {
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-100 shadow-emerald-500/5',
    amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 border-amber-100 shadow-amber-500/5',
    rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 border-rose-100 shadow-rose-500/5'
  };

  return (
    <div className={`bg-[var(--crm-card)] dark:bg-[var(--crm-card)] p-5 rounded-2xl border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] shadow-sm transition-all hover:shadow-md`}>
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl border ${styles[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-[10px]  text-[var(--crm-text-muted)] leading-none mb-1">{label}</p>
          <p className="text-3xl  text-[var(--crm-text)] leading-none">{value}</p>
        </div>
      </div>
      <p className="text-[10px]  text-[var(--crm-text-muted)] mt-3 flex items-center gap-1">
        <AlertCircle size={10} /> {description}
      </p>
    </div>
  );
}

function ActiveAssignments({ memberId, projects }: { memberId: string; projects: Project[] }) {
  const assignedProjects = useMemo(() => {
    return projects.filter(p => p.assignedTeamMemberId === memberId);
  }, [projects, memberId]);

  if (assignedProjects.length === 0) {
    return <span className="text-[10px] font-medium text-zinc-300 italic">No active assignments.</span>;
  }

  return (
    <>
      {assignedProjects.map(p => (
        <React.Fragment key={p.id}>
          {/* Project Tag */}
          <div className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 rounded-md text-[9px] font-semibold text-indigo-700 flex items-center gap-1.5 group cursor-default">
            <Building2 size={10} className="text-indigo-400" />
            {p.name}
          </div>
          
          {/* Task Tags if any */}
          {p.tasks && p.tasks.length > 0 && p.tasks.map((t: any, i: number) => (
            <div key={`${p.id}-task-${i}`} className="px-2 py-0.5 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-md text-[9px] font-medium text-[var(--crm-text-secondary)] flex items-center gap-1.5 italic">
              <CheckCircle2 size={10} className="text-slate-300" />
              {t.text || t.name}
            </div>
          ))}
        </React.Fragment>
      ))}
    </>
  );
}
