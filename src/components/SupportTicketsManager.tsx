import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Filter, 
  LayoutList, 
  LayoutGrid, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  Eye, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Calendar,
  User,
  Building2,
  Briefcase,
  Paperclip,
  ExternalLink,
  MessageSquare,
  Mail,
  Phone,
  ArrowRight
} from 'lucide-react';
import { SupportTicket, Client, Project, TeamMember } from '../types';

interface SupportTicketsManagerProps {
  tickets: SupportTicket[];
  clients: Client[];
  projects: Project[];
  teamMembers: TeamMember[];
  onAddTicket: (ticket: Omit<SupportTicket, 'id'>) => Promise<boolean>;
  onUpdateTicket: (ticket: SupportTicket) => Promise<boolean>;
  onDeleteTicket: (id: string) => Promise<boolean>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function SupportTicketsManager({
  tickets,
  clients,
  projects,
  teamMembers,
  onAddTicket,
  onUpdateTicket,
  onDeleteTicket,
  showToast
}: SupportTicketsManagerProps) {
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [clientFilter, setClientFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [assignedFilter, setAssignedFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState<SupportTicket | null>(null);
  const [viewingTicket, setViewingTicket] = useState<SupportTicket | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchesSearch = 
        t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.issueTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.projectName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesClient = clientFilter === 'All' || t.clientId === clientFilter;
      const matchesProject = projectFilter === 'All' || t.projectId === projectFilter;
      const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;
      const matchesAssigned = assignedFilter === 'All' || t.assignedTo === assignedFilter;
      const matchesStatus = statusFilter === 'All' || t.status === statusFilter;

      return matchesSearch && matchesClient && matchesProject && matchesPriority && matchesAssigned && matchesStatus;
    });
  }, [tickets, searchQuery, clientFilter, projectFilter, priorityFilter, assignedFilter, statusFilter]);

  const stats = {
    total: tickets.length,
    new: tickets.filter(t => t.status === 'New Request').length,
    inProgress: tickets.filter(t => t.status === 'In Progress').length,
    resolved: tickets.filter(t => t.status === 'Resolved').length
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total Tickets" value={stats.total} icon={<LifeBuoyIcon size={20} />} color="indigo" />
        <MetricCard label="New Requests" value={stats.new} icon={<AlertCircle size={20} />} color="amber" />
        <MetricCard label="In Progress" value={stats.inProgress} icon={<Clock size={20} />} color="blue" />
        <MetricCard label="Resolved" value={stats.resolved} icon={<CheckCircle2 size={20} />} color="emerald" />
      </div>

      {/* Toolbar */}
      <div className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] p-4 rounded-xl border border-slate-100 dark:border-[var(--crm-card-border)] shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--crm-text-muted)] " />
            <input 
              type="text"
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-lg text-sm focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-[var(--crm-sidebar)]/5 /50"
            />
          </div>
          <div className="flex p-1 bg-[var(--crm-sidebar)] rounded-lg shrink-0">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-[var(--crm-card)] dark:bg-[var(--crm-card)] text-indigo-600 shadow-sm' : 'text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)]'}`}
            >
              <LayoutList size={18} />
            </button>
            <button 
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-[var(--crm-card)] dark:bg-[var(--crm-card)] text-indigo-600 shadow-sm' : 'text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)]'}`}
            >
              <LayoutGrid size={18} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <FilterDropdown label="Client" value={clientFilter} onChange={setClientFilter} options={[{id: 'All', name: 'All Clients'}, ...clients.map(c => ({id: c.id, name: c.company || c.name}))]} />
          <FilterDropdown label="Priority" value={priorityFilter} onChange={setPriorityFilter} options={[{id: 'All', name: 'All Priorities'}, {id: 'High', name: 'High'}, {id: 'Medium', name: 'Medium'}, {id: 'Low', name: 'Low'}]} />
          <button 
            onClick={() => {
              setEditingTicket(null);
              setShowFormModal(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-50 dark:bg-indigo-500/10 text-white font-medium text-sm rounded-lg transition-colors flex items-center gap-2 shadow-md shadow-indigo-600/10"
          >
            <Plus size={18} />
            New Ticket
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="min-h-[400px]">
        {viewMode === 'list' ? (
          <TicketList 
            tickets={filteredTickets} 
            onView={setViewingTicket}
            onEdit={setEditingTicket}
            onDelete={setShowDeleteConfirm}
          />
        ) : (
          <TicketKanban 
            tickets={filteredTickets}
            onUpdateStatus={(ticket, newStatus) => onUpdateTicket({...ticket, status: newStatus})}
            onView={setViewingTicket}
          />
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showFormModal && (
          <TicketFormModal 
            ticket={editingTicket}
            clients={clients}
            projects={projects}
            teamMembers={teamMembers}
            onClose={() => setShowFormModal(false)}
            onSave={async (ticketData) => {
              const success = editingTicket 
                ? await onUpdateTicket({...editingTicket, ...ticketData})
                : await onAddTicket({...ticketData, ticketNumber: `TKT-${1001 + tickets.length}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: 'Admin'});
              if (success) setShowFormModal(false);
            }}
          />
        )}

        {viewingTicket && (
          <TicketDetailModal 
            ticket={viewingTicket}
            onClose={() => setViewingTicket(null)}
            onEdit={(t) => {
              setViewingTicket(null);
              setEditingTicket(t);
              setShowFormModal(true);
            }}
          />
        )}

        {showDeleteConfirm && (
          <DeleteConfirmModal 
            onClose={() => setShowDeleteConfirm(null)}
            onConfirm={async () => {
              const success = await onDeleteTicket(showDeleteConfirm);
              if (success) setShowDeleteConfirm(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Sub-components ---

function MetricCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: 'indigo' | 'amber' | 'blue' | 'emerald' }) {
  const colors = {
    indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600',
    amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600',
    blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600',
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600'
  };
  return (
    <div className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] p-5 rounded-2xl border border-slate-100 dark:border-[var(--crm-card-border)] shadow-sm flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-[10px]  text-[var(--crm-subtitle)] ">{label}</p>
        <p className="text-2xl  text-[var(--crm-text)] leading-none mt-1">{value}</p>
      </div>
    </div>
  );
}

function FilterDropdown({ label, value, onChange, options }: { label: string; value: string; onChange: (val: string) => void; options: {id: string; name: string}[] }) {
  return (
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-lg text-xs font-medium text-[var(--crm-text)] outline-hidden cursor-pointer hover:bg-[var(--crm-sidebar-active-bg)] transition-colors"
    >
      {options.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
    </select>
  );
}

function TicketList({ tickets, onView, onEdit, onDelete }: { tickets: SupportTicket[]; onView: (t: SupportTicket) => void; onEdit: (t: SupportTicket) => void; onDelete: (id: string) => void }) {
  if (tickets.length === 0) {
    return (
      <div className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] p-20 rounded-2xl border border-dashed border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] text-center space-y-3">
        <div className="mx-auto w-16 h-16 bg-[var(--crm-sidebar)] rounded-full flex items-center justify-center text-slate-300">
          <LifeBuoyIcon size={32} />
        </div>
        <p className="text-[var(--crm-subtitle)] ">No support tickets yet.</p>
        <p className="text-xs text-[var(--crm-text-muted)] ">Created tickets will appear here as a searchable log.</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] rounded-xl border border-slate-100 dark:border-[var(--crm-card-border)] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--crm-sidebar)]/5 /50 border-b border-slate-100 dark:border-[var(--crm-card-border)] text-[10px] font-medium text-[var(--crm-text-secondary)] ">
              <th className="py-4 px-4">Ticket ID</th>
              <th className="py-4 px-4">Date</th>
              <th className="py-4 px-4">Client & Project</th>
              <th className="py-4 px-4">Issue</th>
              <th className="py-4 px-4">Priority</th>
              <th className="py-4 px-4">Assigned To</th>
              <th className="py-4 px-4">Status</th>
              <th className="py-4 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {tickets.map(t => (
              <tr key={t.id} className="hover:bg-[var(--crm-sidebar)]/5 dark:hover:bg-[#20242B]/50 /50 transition-colors group">
                <td className="py-4 px-4 font-medium text-[var(--crm-text)] text-xs">#{t.ticketNumber}</td>
                <td className="py-4 px-4 text-[var(--crm-text-secondary)] text-[11px] ">
                  {new Date(t.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="py-4 px-4">
                  <div className="font-medium text-[var(--crm-text)] text-[11px]">{t.clientName}</div>
                  <div className="text-[10px] text-[var(--crm-text-secondary)] ">{t.projectName}</div>
                </td>
                <td className="py-4 px-4">
                  <div className="font-medium text-[var(--crm-text)] text-[11px] truncate max-w-[200px] 2xl:max-w-[350px] 3xl:max-w-[600px] 4k:max-w-none">{t.issueTitle}</div>
                  <div className="text-[10px] text-[var(--crm-text-muted)] flex items-center gap-1 mt-0.5">
                    {t.source === 'Email' ? <Mail size={10} /> : t.source === 'WhatsApp' ? <MessageSquare size={10} /> : <Phone size={10} />}
                    {t.source}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <PriorityBadge priority={t.priority} />
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2 text-[11px] font-medium text-[var(--crm-text)]">
                    <div className="w-5 h-5 rounded-full bg-[var(--crm-card-border)] flex items-center justify-center text-[8px] font-semibold shrink-0">
                      {t.assignedMemberName?.split(' ').map(n => n[0]).join('') || 'UN'}
                    </div>
                    <span className="truncate">{t.assignedMemberName || 'Unassigned'}</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <StatusBadge status={t.status} />
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onView(t)} className="p-1.5 hover:bg-[var(--crm-card)] hover:dark:bg-[var(--crm-card)] border border-transparent hover:border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-lg text-[var(--crm-text-muted)] hover:text-indigo-600 transition-all cursor-pointer"><Eye size={14} /></button>
                    <button onClick={() => onEdit(t)} className="p-1.5 hover:bg-[var(--crm-card)] hover:dark:bg-[var(--crm-card)] border border-transparent hover:border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-lg text-[var(--crm-text-muted)] hover:text-amber-600 transition-all cursor-pointer"><Edit2 size={14} /></button>
                    <button onClick={() => onDelete(t.id)} className="p-1.5 hover:bg-[var(--crm-card)] hover:dark:bg-[var(--crm-card)] border border-transparent hover:border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-lg text-[var(--crm-text-muted)] hover:text-rose-600 transition-all cursor-pointer"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TicketKanban({ tickets, onUpdateStatus, onView }: { tickets: SupportTicket[]; onUpdateStatus: (t: SupportTicket, s: SupportTicket['status']) => void; onView: (t: SupportTicket) => void }) {
  const columns: SupportTicket['status'][] = ['New Request', 'In Progress', 'Pending Client Approval', 'Resolved'];
  
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar min-h-[500px]">
      {columns.map(status => (
        <div key={status} className="flex-1 min-w-[280px] bg-[var(--crm-sidebar)]/5 /50 rounded-2xl p-3 border border-slate-100 dark:border-[var(--crm-card-border)] flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h4 className="font-semibold text-[var(--crm-text)] text-[11px]   flex items-center gap-2">
              {status}
              <span className="w-5 h-5 bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-full flex items-center justify-center text-[10px] font-semibold text-indigo-600 shadow-xs">
                {tickets.filter(t => t.status === status).length}
              </span>
            </h4>
          </div>

          <div className="flex-1 space-y-3">
            {tickets.filter(t => t.status === status).map(ticket => (
              <motion.div
                layoutId={ticket.id}
                key={ticket.id}
                onClick={() => onView(ticket)}
                className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] p-4 rounded-xl border border-slate-100 dark:border-[var(--crm-card-border)] shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className={`absolute top-0 left-0 w-1 h-full ${
                  ticket.priority === 'High' ? 'bg-rose-500' : ticket.priority === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />
                
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[9px] font-semibold text-[var(--crm-text-muted)] ">#{ticket.ticketNumber}</span>
                  <PriorityBadge priority={ticket.priority} compact />
                </div>
                
                <h5 className="font-medium text-[var(--crm-text)] text-xs leading-tight mb-2 group-hover:text-indigo-600 transition-colors">{ticket.issueTitle}</h5>
                
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center gap-1.5 text-[10px] text-[var(--crm-text-secondary)] ">
                    <Building2 size={10} className="text-slate-300" /> {ticket.clientName}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-[var(--crm-text-secondary)] ">
                    <Briefcase size={10} className="text-slate-300" /> {ticket.projectName}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-[var(--crm-sidebar)] flex items-center justify-center text-[8px] font-medium text-[var(--crm-text-secondary)] ">
                      {ticket.assignedMemberName?.split(' ').map(n => n[0]).join('') || 'UN'}
                    </div>
                    <span className="text-[10px] font-medium text-[var(--crm-text-secondary)]">{ticket.assignedMemberName || 'Unassigned'}</span>
                  </div>
                  <div className="text-[9px] font-medium text-[var(--crm-text-muted)] ">{new Date(ticket.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PriorityBadge({ priority, compact }: { priority: SupportTicket['priority']; compact?: boolean }) {
  const styles = {
    High: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 border-rose-100',
    Medium: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 border-amber-100',
    Low: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-100'
  };
  return (
    <span className={`px-2 py-0.5 rounded-full font-semibold   border ${styles[priority]} ${compact ? 'text-[8px]' : 'text-[9px]'}`}>
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: SupportTicket['status'] }) {
  const styles = {
    'New Request': 'bg-[var(--crm-sidebar)] text-[var(--crm-text-secondary)] border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)]',
    'In Progress': 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 border-blue-100',
    'Pending Client Approval': 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 border-amber-100',
    'Resolved': 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-100'
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold   border ${styles[status]}`}>
      {status}
    </span>
  );
}

function TicketFormModal({ ticket, clients, projects, teamMembers, onClose, onSave }: { ticket: SupportTicket | null; clients: Client[]; projects: Project[]; teamMembers: TeamMember[]; onClose: () => void; onSave: (data: any) => Promise<void> }) {
  const [formData, setFormData] = useState({
    clientId: ticket?.clientId || '',
    projectId: ticket?.projectId || '',
    issueTitle: ticket?.issueTitle || '',
    description: ticket?.description || '',
    source: ticket?.source || 'WhatsApp',
    priority: ticket?.priority || 'Medium',
    assignedTo: ticket?.assignedTo || '',
    status: ticket?.status || 'New Request',
    resolutionNotes: ticket?.resolutionNotes || '',
    attachments: ticket?.attachments || []
  });

  const availableProjects = useMemo(() => {
    return projects.filter(p => p.clientId === formData.clientId);
  }, [projects, formData.clientId]);

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const client = clients.find(c => c.id === formData.clientId);
    const project = projects.find(p => p.id === formData.projectId);
    const team = teamMembers.find(t => t.id === formData.assignedTo);
    
    await onSave({
      ...formData,
      clientName: client ? (client.company || client.name) : 'Unknown Client',
      projectName: project ? project.name : 'Unknown Project',
      assignedMemberName: team ? team.fullName : 'Unassigned',
      updatedAt: new Date().toISOString()
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] w-full max-w-2xl 3xl:max-w-4xl 4k:max-w-5xl 5k:max-w-7xl rounded-2xl shadow-2xl overflow-hidden relative my-auto"
      >
        <div className="p-6 border-b border-slate-100 dark:border-[var(--crm-card-border)] flex justify-between items-center bg-[var(--crm-sidebar)]/5 /50">
          <div>
            <h3 className="font-semibold text-[var(--crm-text)] text-base  tracking-tight">{ticket ? `Edit Ticket #${ticket.ticketNumber}` : 'Create New Support Ticket'}</h3>
            <p className="text-xs text-[var(--crm-subtitle)] mt-1">Fill in the details to track client requests and maintenance logs.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--crm-card)] hover:dark:bg-[var(--crm-card)] rounded-xl text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] border border-transparent hover:border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] transition-all cursor-pointer"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[var(--crm-text-secondary)] block">Client</label>
              <select 
                required
                value={formData.clientId}
                onChange={(e) => setFormData({...formData, clientId: e.target.value, projectId: ''})}
                className="w-full px-4 py-2.5 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-xl text-sm font-medium text-[var(--crm-text)] outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer"
              >
                <option value="">Select Existing Client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[var(--crm-text-secondary)] block">Project</label>
              <select 
                required
                disabled={!formData.clientId}
                value={formData.projectId}
                onChange={(e) => setFormData({...formData, projectId: e.target.value})}
                className="w-full px-4 py-2.5 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-xl text-sm font-medium text-[var(--crm-text)] outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer disabled:opacity-50"
              >
                <option value="">Select Client's Project</option>
                {availableProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-[var(--crm-text-secondary)] block">Issue Title</label>
            <input 
              required
              type="text"
              placeholder="Short descriptive title of the issue..."
              value={formData.issueTitle}
              onChange={(e) => setFormData({...formData, issueTitle: e.target.value})}
              className="w-full px-4 py-2.5 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-xl text-sm font-medium text-[var(--crm-text)] outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-[var(--crm-text-secondary)] block">Full Description</label>
            <textarea 
              required
              rows={4}
              placeholder="Detailed explanation of the issue or request..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2.5 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-xl text-sm font-medium text-[var(--crm-text)] outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[var(--crm-text-secondary)] block">Source</label>
              <select 
                value={formData.source}
                onChange={(e) => setFormData({...formData, source: e.target.value as any})}
                className="w-full px-4 py-2.5 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-xl text-sm font-medium text-[var(--crm-text)] cursor-pointer"
              >
                <option value="WhatsApp">WhatsApp</option>
                <option value="Email">Email</option>
                <option value="Direct Call">Direct Call</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[var(--crm-text-secondary)] block">Priority</label>
              <select 
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value as any})}
                className="w-full px-4 py-2.5 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-xl text-sm font-medium text-[var(--crm-text)] cursor-pointer"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[var(--crm-text-secondary)] block">Assigned To</label>
              <select 
                required
                value={formData.assignedTo}
                onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
                className="w-full px-4 py-2.5 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-xl text-sm font-medium text-[var(--crm-text)] cursor-pointer"
              >
                <option value="">Select Team Member</option>
                {teamMembers.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[var(--crm-text-secondary)] block">Status</label>
              <select 
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                className="w-full px-4 py-2.5 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-xl text-sm font-medium text-[var(--crm-text)] cursor-pointer"
              >
                <option value="New Request">New Request</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending Client Approval">Pending Client Approval</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
            {formData.status === 'Resolved' && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-[var(--crm-text-secondary)] block">Resolution Notes</label>
                <input 
                  type="text"
                  placeholder="How was it fixed?"
                  value={formData.resolutionNotes}
                  onChange={(e) => setFormData({...formData, resolutionNotes: e.target.value})}
                  className="w-full px-4 py-2.5 bg-emerald-50/50 dark:bg-emerald-500/10 border border-emerald-100 rounded-xl text-sm font-medium text-emerald-900 outline-hidden"
                />
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-[var(--crm-card-border)]">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar)] rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={saving}
              className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-50 dark:bg-indigo-500/10 text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {saving ? 'Saving...' : (ticket ? 'Save Changes' : 'Create Ticket')}
              <ArrowRight size={18} />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function TicketDetailModal({ ticket, onClose, onEdit }: { ticket: SupportTicket; onClose: () => void; onEdit: (t: SupportTicket) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] w-full max-w-lg 2xl:max-w-xl 3xl:max-w-2xl 4k:max-w-3xl 5k:max-w-4xl h-full max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 dark:border-[var(--crm-card-border)] flex justify-between items-center bg-[var(--crm-sidebar)]/5 /50 shrink-0">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-lg font-semibold text-[10px] text-[var(--crm-text-secondary)] ">#{ticket.ticketNumber}</span>
            <StatusBadge status={ticket.status} />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onEdit(ticket)} className="p-2 hover:bg-amber-50 dark:bg-amber-500/10 rounded-xl text-[var(--crm-text-muted)] hover:text-amber-600 border border-transparent hover:border-amber-200 transition-all cursor-pointer"><Edit2 size={18} /></button>
            <button onClick={onClose} className="p-2 hover:bg-[var(--crm-card)] hover:dark:bg-[var(--crm-card)] rounded-xl text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] border border-transparent hover:border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] transition-all cursor-pointer"><X size={18} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-[var(--crm-heading)] leading-tight mb-2 tracking-tight">{ticket.issueTitle}</h2>
            <div className="flex flex-wrap items-center gap-3">
              <PriorityBadge priority={ticket.priority} />
              <div className="flex items-center gap-1.5 text-[10px] text-[var(--crm-text-secondary)] ">
                <Calendar size={12} className="text-[var(--crm-text-muted)] " />
                Created {new Date(ticket.createdAt).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <DetailItem icon={<Building2 size={14} />} label="Client" value={ticket.clientName} />
            <DetailItem icon={<Briefcase size={14} />} label="Project" value={ticket.projectName} />
            <DetailItem icon={<User size={14} />} label="Assigned To" value={ticket.assignedMemberName || 'Unassigned'} />
            <DetailItem icon={<Smartphone size={14} />} label="Source" value={ticket.source} />
          </div>

          <div className="space-y-3">
            <h4 className="text-[11px] font-medium text-[var(--crm-text-secondary)] border-b border-slate-50 pb-2">Description</h4>
            <p className="text-sm text-[var(--crm-subtitle)] leading-relaxed  bg-[var(--crm-sidebar)]/5 /50 p-4 rounded-xl border border-slate-100 dark:border-[var(--crm-card-border)]">{ticket.description}</p>
          </div>

          {ticket.status === 'Resolved' && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold text-[11px]  ">
                <CheckCircle2 size={14} /> Maintenance Record: Resolved
              </div>
              <p className="text-sm text-emerald-800 ">{ticket.resolutionNotes || 'Issue has been successfully resolved.'}</p>
              {ticket.resolvedAt && (
                <p className="text-[10px] text-emerald-600/80 ">Resolution Date: {new Date(ticket.resolvedAt).toLocaleDateString()}</p>
              )}
            </div>
          )}

          <div className="space-y-3">
            <h4 className="text-[11px] font-medium text-[var(--crm-text-secondary)] border-b border-slate-50 pb-2">Attachments</h4>
            {ticket.attachments && ticket.attachments.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {ticket.attachments.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-xl hover:bg-[var(--crm-card)] hover:dark:bg-[var(--crm-card)] hover:border-indigo-200 transition-all group">
                    <Paperclip size={14} className="text-[var(--crm-text-muted)] group-hover:text-indigo-500" />
                    <span className="text-[10px] font-medium text-[var(--crm-text-secondary)] truncate">Attachment #{i+1}</span>
                    <ExternalLink size={10} className="text-slate-300 ml-auto" />
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-[var(--crm-text-muted)] py-4 px-4 border border-dashed border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-xl text-center">No attachments uploaded.</div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-50 bg-[var(--crm-sidebar)]/3 /30 flex items-center justify-between shrink-0">
          <div className="text-[10px] text-[var(--crm-text-muted)] ">
            Last Updated: {new Date(ticket.updatedAt).toLocaleDateString()}
          </div>
          <button onClick={onClose} className="px-5 py-2 text-xs font-medium text-[var(--crm-text-secondary)] bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-xl shadow-xs hover:bg-[var(--crm-sidebar)] transition-all cursor-pointer">Close Panel</button>
        </div>
      </motion.div>
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-[9px] font-semibold text-[var(--crm-text-muted)] ">
        {icon} {label}
      </div>
      <div className="text-xs font-medium text-[var(--crm-text)] ">{value}</div>
    </div>
  );
}

function DeleteConfirmModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => Promise<void> }) {
  const [deleting, setDeleting] = useState(false);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] p-6 rounded-2xl border border-slate-100 dark:border-[var(--crm-card-border)] shadow-2xl max-w-sm w-full space-y-4"
      >
        <div className="flex items-center gap-3 text-rose-600">
          <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-100">
            <Trash2 size={20} />
          </div>
          <h3 className="text-base font-semibold text-[var(--crm-text)]  tracking-tight">Delete Ticket</h3>
        </div>
        <p className="text-xs text-[var(--crm-subtitle)]  leading-relaxed">Are you sure you want to permanently delete this support ticket? This action will remove it from the maintenance log and cannot be undone.</p>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar)] rounded-xl transition-all cursor-pointer">Cancel</button>
          <button 
            onClick={async () => {
              setDeleting(true);
              await onConfirm();
            }} 
            disabled={deleting}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-50 dark:bg-rose-500/10 text-white text-xs font-medium rounded-xl transition-all shadow-lg shadow-rose-600/20 cursor-pointer disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Confirm Deletion'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function LifeBuoyIcon({ size, className }: { size?: number; className?: string }) {
  return <LifeBuoy size={size} className={className} />;
}

function Smartphone({ size, className }: { size?: number; className?: string }) {
  return <SmartphoneIcon size={size} className={className} />;
}

import { Smartphone as SmartphoneIcon, LifeBuoy } from 'lucide-react';
