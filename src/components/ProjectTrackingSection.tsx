import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, CheckCircle2, Clock, AlertCircle, FileText, DollarSign, Calendar, Activity, 
  Layers, ChevronRight, ClipboardList, FolderMinus, Briefcase, User, Trash2, Plus,
  Mail, PhoneCall, MessageSquare, LifeBuoy, Star, Building2, Sliders, 
  CreditCard, Info, Pencil, Check, Award, ShieldCheck, ArrowUpRight, Folder, Receipt
} from 'lucide-react';
import { Project, ProjectStatus, ProjectTask, ClientPaymentRecord } from '../types';

interface ProjectTrackingSectionProps {
  project: Project;
  onClose: () => void;
  onDelete?: (projectId: string) => Promise<boolean | void> | void;
  onEdit?: (project: Project) => void;
  onUpdateProject?: (project: Project) => Promise<boolean>;
  discussions?: any[]; 
  teamActivity?: any[];
  teamMembers?: any[];
  clientPayments?: ClientPaymentRecord[];
}

// Reusable sub-components to match CRM Profile system
const SectionHeader = ({ icon, title, subtitle }: { icon: React.ReactNode, title: string, subtitle?: string }) => (
  <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
    <div className="flex items-center gap-2">
      <div className="text-indigo-600">{icon}</div>
      <h5 className="text-[11px] font-semibold text-slate-900 uppercase tracking-wider">{title}</h5>
    </div>
    {subtitle && <span className="text-[9px] text-slate-500 font-medium">{subtitle}</span>}
  </div>
);

const InfoItem = ({ label, value, icon, highlight = false }: { label: string, value: React.ReactNode, icon?: React.ReactNode, highlight?: boolean }) => (
  <div className={`p-3 rounded-xl border border-slate-200 ${highlight ? 'bg-indigo-50/30 border-indigo-100/50' : 'bg-slate-50'}`}>
    <div className="flex items-center gap-2 mb-1.5">
      {icon && <span className="text-indigo-600/70">{icon}</span>}
      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{label}</span>
    </div>
    <div className={`text-[11px] font-semibold truncate ${highlight ? 'text-indigo-700 ' : 'text-slate-900'}`}>
      {value || <span className="italic opacity-40 font-normal">Not provided</span>}
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const getColors = (s: string) => {
    switch (s) {
      case 'In Progress': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Review':
      case 'Revision': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Completed':
      case 'Delivered': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'On Hold': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'Cancelled': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-zinc-100 text-zinc-600 border-zinc-200';
    }
  };
  const colors = getColors(status);
  return (
    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${colors} uppercase tracking-tight`}>
      {status}
    </span>
  );
};

export default function ProjectTrackingSection({ 
  project, 
  onClose, 
  onDelete, 
  onEdit, 
  onUpdateProject,
  discussions = [], 
  teamActivity = [],
  teamMembers = [],
  clientPayments = []
}: ProjectTrackingSectionProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'financials' | 'discussions' | 'reviews'>('overview');

  // Real-time dynamic payment calculations from ClientPaymentRecord
  const matchingPayments = useMemo(() => {
    const pId = String(project.id);
    const pName = (project.name || '').trim().toLowerCase();
    return (clientPayments || []).filter(cp => {
      if (!cp) return false;
      const matchId = cp.projectId && String(cp.projectId) === pId;
      const matchName = pName && cp.projectName && cp.projectName.trim().toLowerCase() === pName;
      return matchId || matchName;
    });
  }, [clientPayments, project.id, project.name]);

  const totalProjectValue = Number(project.totalProjectValue || project.budget || 0);

  const totalReceived = useMemo(() => {
    if (matchingPayments.length > 0) {
      return matchingPayments.reduce((sum, cp) => sum + Number(cp.totalPaid || cp.advance || 0), 0);
    }
    if (project.paymentStatus === 'Paid' && !project.advancePayment) {
      return totalProjectValue;
    }
    return Number(project.advancePayment || 0);
  }, [matchingPayments, totalProjectValue, project.paymentStatus, project.advancePayment]);

  const outstanding = Math.max(0, totalProjectValue - totalReceived);
  const paymentProgress = totalProjectValue > 0 ? Math.min(100, Math.round((totalReceived / totalProjectValue) * 100)) : (totalReceived > 0 ? 100 : 0);
  const dynamicPaymentStatus = totalProjectValue > 0 && totalReceived >= totalProjectValue ? 'Paid' : (totalReceived > 0 ? 'Partial' : 'Pending');

  // Form states for creating a new review
  const [newRevTitle, setNewRevTitle] = useState('');
  const [newRevRating, setNewRevRating] = useState(5);
  const [newRevComments, setNewRevComments] = useState('');
  const [newRevDate, setNewRevDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [isDeleting, setIsDeleting] = useState(false);

  // Form states for tasks
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState('');

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: ProjectTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      status: 'Pending',
      completed: false,
      priority: newTaskPriority,
      assignedTo: newTaskAssignedTo,
      createdAt: new Date().toISOString()
    };

    const currentTasks = project.tasks || [];
    const updatedTasks = [...currentTasks, newTask];
    
    // Recalculate progress
    const completedCount = updatedTasks.filter(t => t.completed).length;
    const newProgress = Math.round((completedCount / updatedTasks.length) * 100);

    const updatedProject = {
      ...project,
      tasks: updatedTasks,
      projectProgress: newProgress
    };

    if (onUpdateProject) {
      await onUpdateProject(updatedProject);
      setNewTaskTitle('');
    }
  };

  const handleToggleTask = async (taskId: string) => {
    const currentTasks = project.tasks || [];
    const updatedTasks = currentTasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed, status: !t.completed ? 'Completed' : 'Pending' as any } : t
    );

    // Recalculate progress
    const completedCount = updatedTasks.filter(t => t.completed).length;
    const newProgress = Math.round((completedCount / updatedTasks.length) * 100);

    const updatedProject = {
      ...project,
      tasks: updatedTasks,
      projectProgress: newProgress
    };

    if (onUpdateProject) {
      await onUpdateProject(updatedProject);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const currentTasks = project.tasks || [];
    const updatedTasks = currentTasks.filter(t => t.id !== taskId);

    // Recalculate progress
    const completedCount = updatedTasks.filter(t => t.completed).length;
    const newProgress = updatedTasks.length > 0 
      ? Math.round((completedCount / updatedTasks.length) * 100)
      : 0;

    const updatedProject = {
      ...project,
      tasks: updatedTasks,
      projectProgress: newProgress
    };

    if (onUpdateProject) {
      await onUpdateProject(updatedProject);
    }
  };

  const handleAddProjectReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRevTitle.trim()) return;
    const newRev = {
      id: `rev-${Date.now()}`,
      title: newRevTitle.trim(),
      date: newRevDate,
      rating: Number(newRevRating),
      comments: newRevComments.trim()
    };
    const currentReviews = project.reviews || [];
    const updatedReviews = [newRev, ...currentReviews];
    const updatedProject = {
      ...project,
      reviews: updatedReviews
    };
    if (onUpdateProject) {
      await onUpdateProject(updatedProject);
      setNewRevTitle('');
      setNewRevRating(5);
      setNewRevComments('');
    }
  };

  const handleDeleteProjectReview = async (reviewId: string) => {
    const currentReviews = project.reviews || [];
    const updatedReviews = currentReviews.filter(r => r.id !== reviewId);
    const updatedProject = {
      ...project,
      reviews: updatedReviews
    };
    if (onUpdateProject) {
      await onUpdateProject(updatedProject);
    }
  };

  // Compute Client Contact History
  const clientDiscussions = discussions.filter(d => 
    (d.clientName && d.clientName === project.clientName) || 
    (d.clientId && d.clientId === project.clientId)
  ).sort((a, b) => new Date(b.date || b.callDate || b.timestamp).getTime() - new Date(a.date || a.callDate || a.timestamp).getTime());

  const tasks = project.tasks || [];
  const progress = tasks.length > 0 
    ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)
    : (project.projectProgress || project.progress || 0);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl lg:max-w-5xl 2xl:max-w-6xl 3xl:max-w-7xl 4k:max-w-[2000px] 5k:max-w-[3000px] 3xl:max-w-[1400px] 4k:max-w-[1800px] 5k:max-w-[2400px] md:w-11/12 w-full overflow-hidden text-slate-900 flex flex-col max-h-[95vh]"
      >
        {/* 1. Header (Identity Block) */}
        <div className="p-8 bg-white border-b border-slate-200 relative shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 transition-colors p-2 rounded-full hover:bg-slate-50 cursor-pointer"
          >
            <X size={20} />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
              <Folder size={36} className="opacity-90" />
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-600 uppercase tracking-widest border border-slate-200">{project.id || 'PROJECT RECORD'}</span>
                <StatusBadge status={project.status} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 truncate mb-2.5">{project.name}</h2>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1.5"><Building2 size={14} className="text-slate-400"/> {project.clientName}</span>
                <span className="flex items-center gap-1.5"><Briefcase size={14} className="text-slate-400"/> {project.service || 'General Service'}</span>
                <span className="flex items-center gap-1.5 text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-md"><CheckCircle2 size={14}/> {progress}% Complete</span>
              </div>
            </div>
          </div>

          <div className="flex gap-8 mt-8 overflow-x-auto no-scrollbar border-t border-slate-100 pt-5">
            {([
              { id: 'overview', label: 'Overview', icon: <Info size={14}/> },
              { id: 'tasks', label: 'Tasks', icon: <CheckCircle2 size={14}/> },
              { id: 'financials', label: 'Financials', icon: <CreditCard size={14}/> },
              { id: 'discussions', label: 'Discussions', icon: <MessageSquare size={14}/> },
              { id: 'reviews', label: 'Reviews', icon: <Award size={14}/> }
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider pb-3 relative transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab.icon} {tab.label}
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="projectTabActive" 
                    className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-indigo-600 rounded-full" 
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Content Area */}
        <div className="p-6 overflow-y-auto bg-slate-50 relative">
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Left Column: Project Identity & Client Info */}
                <div className="space-y-6">
                  {/* Project Details Section */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
                    <SectionHeader icon={<Info size={14}/>} title="Project Details" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <InfoItem label="Service Type" value={project.service} icon={<Briefcase size={12}/>} highlight />
                      <InfoItem label="Start Date" value={project.startDate} icon={<Calendar size={12}/>} />
                      <InfoItem label="Expected Delivery" value={project.expectedDeliveryDate} icon={<Clock size={12}/>} />
                      <InfoItem label="Priority" value={project.priority} icon={<AlertCircle size={12}/>} />
                    </div>
                  </div>

                  {/* Client Info Section */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
                    <SectionHeader icon={<Building2 size={14}/>} title="Client Information" />
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
                        {project.clientName?.charAt(0) || 'C'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-900 truncate">{project.clientName}</p>
                        <p className="text-[9px] text-slate-500 font-medium">Linked Client Record</p>
                      </div>
                      <button className="ml-auto p-1.5 hover:bg-white rounded-lg text-indigo-600 transition-colors">
                        <ArrowUpRight size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center gap-2 p-2 px-3 rounded-lg bg-slate-50/50 text-[10px] text-slate-600 font-medium">
                        <Mail size={12} className="text-slate-500" /> No email on record
                      </div>
                    </div>
                  </div>

                  {/* Assigned Team Section */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
                    <SectionHeader icon={<User size={14}/>} title="Team & Assignment" />
                    <InfoItem 
                      label="Assigned Lead" 
                      value={project.assignedTeamMember} 
                      icon={<ShieldCheck size={12}/>} 
                      highlight 
                    />
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <p className="text-[9px] font-bold text-slate-500 uppercase mb-2">Team Notes</p>
                      <p className="text-[10px] text-slate-600 leading-relaxed italic">
                        No team-specific briefing notes provided.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Column: Progress & Deadlines */}
                <div className="space-y-6">
                  {/* Progress Section */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
                    <SectionHeader icon={<Activity size={14}/>} title="Project Progress" subtitle={`${progress}% Completed`} />
                    <div className="space-y-3">
                      <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-200">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          className="h-full bg-indigo-600 rounded-full"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <InfoItem label="Status" value={project.status} icon={<CheckCircle2 size={12}/>} />
                        <InfoItem label="Milestone" value={project.currentStage || 'Planning'} icon={<Layers size={12}/>} />
                      </div>
                    </div>
                  </div>

                  {/* Deadline Section */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
                    <SectionHeader icon={<Clock size={14}/>} title="Deadline Status" />
                    {(() => {
                      const isCompleted = project.status === 'Completed' || project.status === 'Delivered';
                      const now = new Date();
                      const deadlineDate = project.deadline ? new Date(project.deadline) : null;
                      const isOverdue = deadlineDate && !isCompleted && (deadlineDate.getTime() < now.getTime());
                      
                      return (
                        <div className={`p-4 rounded-xl border ${isOverdue ? 'bg-rose-50/50 border-rose-100 text-rose-700' : 'bg-indigo-50/50 border-indigo-100 text-indigo-700'}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar size={16} />
                            <span className="text-xs font-bold uppercase tracking-wider">{project.deadline || 'NO DEADLINE SET'}</span>
                          </div>
                          <p className="text-[10px] font-medium opacity-80">
                            {isOverdue ? 'This project has exceeded its target deadline.' : isCompleted ? 'Project completed successfully.' : 'Project is currently tracking towards deadline.'}
                          </p>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Notes Section */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
                    <SectionHeader icon={<ClipboardList size={14}/>} title="Notes & Requirements" />
                    <div className="max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                      <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-200">
                        <p className="text-[11px] text-slate-600 whitespace-pre-wrap leading-relaxed">
                          {project.notes || 'No project notes or requirements listed.'}
                        </p>
                      </div>
                      {project.internalNotes && (
                        <div className="mt-3 bg-amber-50/50 border border-amber-100 p-3 rounded-xl">
                          <p className="text-[9px] font-bold text-amber-700 uppercase mb-1">Internal Admin Notes</p>
                          <p className="text-[10px] text-amber-900/80 leading-relaxed italic">{project.internalNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 4k:grid-cols-7 5k:grid-cols-10 gap-6">
                {/* Task List */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                    <SectionHeader 
                      icon={<CheckCircle2 size={14}/>} 
                      title="Project Tasks" 
                      subtitle={`${(project.tasks || []).filter(t => t.completed).length} of ${(project.tasks || []).length} completed`}
                    />
                    
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                      {(!project.tasks || project.tasks.length === 0) ? (
                        <div className="p-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                          <ClipboardList className="mx-auto text-slate-500 opacity-20 mb-2" size={32} />
                          <p className="text-xs text-slate-500 italic">No tasks created for this project yet.</p>
                        </div>
                      ) : (
                        project.tasks.map((task) => (
                          <div 
                            key={task.id}
                            className={`group flex items-center gap-3 p-3 rounded-xl border transition-all ${
                              task.completed 
                                ? 'bg-emerald-50/30 border-emerald-100/50 opacity-75' 
                                : 'bg-white border-slate-200 hover:border-indigo-200'
                            }`}
                          >
                            <button 
                              onClick={() => handleToggleTask(task.id)}
                              className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                                task.completed 
                                  ? 'bg-emerald-500 border-emerald-500 text-white' 
                                  : 'bg-white border-zinc-300 hover:border-indigo-500'
                              }`}
                            >
                              {task.completed && <Check size={12} />}
                            </button>
                            
                            <div className="flex-1 min-w-0">
                              <p className={`text-[11px] font-semibold truncate ${task.completed ? 'text-emerald-700 line-through' : 'text-slate-900'}`}>
                                {task.title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`text-[8px] font-bold uppercase tracking-tighter px-1.5 py-0.5 rounded ${
                                  task.priority === 'High' ? 'bg-rose-50 text-rose-600' :
                                  task.priority === 'Medium' ? 'bg-amber-50 text-amber-600' :
                                  'bg-slate-50 text-slate-600'
                                }`}>
                                  {task.priority}
                                </span>
                                {task.assignedTo && (
                                  <span className="text-[8px] text-slate-500 font-medium flex items-center gap-1">
                                    <User size={8}/> {task.assignedTo}
                                  </span>
                                )}
                              </div>
                            </div>

                            <button 
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Add Task Sidebar */}
                <div className="space-y-6">
                  <form onSubmit={handleAddTask} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
                    <SectionHeader icon={<Plus size={14}/>} title="Add New Task" />
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Task Title</label>
                        <input 
                          type="text" 
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          placeholder="What needs to be done?"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-medium focus:border-indigo-500 outline-none transition-all"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Priority</label>
                          <select 
                            value={newTaskPriority}
                            onChange={(e) => setNewTaskPriority(e.target.value as any)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-[11px] font-medium outline-none"
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Assignee</label>
                          <select 
                            value={newTaskAssignedTo}
                            onChange={(e) => setNewTaskAssignedTo(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-[11px] font-medium outline-none"
                          >
                            <option value="">Unassigned</option>
                            {teamMembers.map((m: any) => (
                              <option key={m.id} value={m.fullName}>{m.fullName}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <button 
                        type="submit"
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all uppercase tracking-widest cursor-pointer"
                      >
                        Create Task
                      </button>
                    </div>
                  </form>

                  <div className="bg-indigo-600 rounded-2xl p-5 text-white shadow-xl shadow-indigo-600/20">
                    <p className="text-[9px] font-bold uppercase tracking-widest opacity-80 mb-1">Task Progress</p>
                    <div className="flex items-end justify-between mb-2">
                      <h3 className="text-2xl font-bold">{progress}%</h3>
                      <span className="text-[10px] font-bold opacity-80 mb-1">AUTOMATIC</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-white rounded-full"
                      />
                    </div>
                    <p className="text-[10px] mt-3 opacity-80 leading-relaxed italic">
                      Progress is calculated automatically based on the ratio of completed tasks to total tasks.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'financials' && (
              <div className="space-y-6">
                {/* 4-Metric Compact Financial Summary */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                    <div className="flex items-center gap-2 mb-1.5">
                      <CreditCard size={14} className="text-indigo-600" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Project Value</span>
                    </div>
                    <div className="text-xl font-bold text-slate-900">
                      ${totalProjectValue.toLocaleString()}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 font-medium">Total agreed contract</p>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Check size={14} className="text-emerald-600" />
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Received</span>
                    </div>
                    <div className="text-xl font-bold text-emerald-700 ">
                      ${totalReceived.toLocaleString()}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 font-medium">{matchingPayments.length} recorded transaction{matchingPayments.length === 1 ? '' : 's'}</p>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                    <div className="flex items-center gap-2 mb-1.5">
                      <DollarSign size={14} className="text-amber-600" />
                      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Outstanding</span>
                    </div>
                    <div className="text-xl font-bold text-amber-700 ">
                      ${outstanding.toLocaleString()}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 font-medium">Remaining balance due</p>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Activity size={14} className="text-indigo-600" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment Progress</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                        dynamicPaymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        dynamicPaymentStatus === 'Partial' ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {dynamicPaymentStatus}
                      </span>
                    </div>
                    <div className="text-xl font-bold text-slate-900 mb-2">
                      {paymentProgress}%
                    </div>
                    <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-200">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${paymentProgress}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className={`h-full rounded-full ${
                          paymentProgress >= 100 ? 'bg-emerald-500' : paymentProgress > 0 ? 'bg-indigo-600' : 'bg-slate-300'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Real Payment History / Ledger Table */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                  <SectionHeader 
                    icon={<Receipt size={14} />} 
                    title="Payment History & Transactions" 
                    subtitle={`${matchingPayments.length} logged record${matchingPayments.length === 1 ? '' : 's'}`}
                  />

                  {matchingPayments.length > 0 ? (
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[9px] uppercase tracking-wider">
                              <th className="p-3">Payment Date</th>
                              <th className="p-3">Amount</th>
                              <th className="p-3">Type</th>
                              <th className="p-3">Platform / Method</th>
                              <th className="p-3">Transaction / Ref ID</th>
                              <th className="p-3">Notes</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 font-medium text-slate-600">
                            {matchingPayments.map((record) => (
                              <tr key={record.id} className="hover:bg-[var(--crm-sidebar-active-bg)] transition-colors">
                                <td className="p-3 font-mono text-slate-500">
                                  {record.paymentDates?.[0] || (record.createdAt ? new Date(record.createdAt).toLocaleDateString() : '—')}
                                </td>
                                <td className="p-3 font-semibold text-slate-900 font-mono">
                                  ${(record.totalPaid || record.advance || 0).toLocaleString()}
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border ${
                                    (record.paymentType === 'Advance' || record.advance > 0) ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                    (record.paymentType === 'Final Payment' || (record.notes && record.notes.toLowerCase().includes('final'))) ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                    (record.paymentType === 'Milestone') ? 'bg-cyan-50 text-cyan-700 border-cyan-200' :
                                    'bg-slate-50 text-slate-600 border-slate-200'
                                  }`}>
                                    {record.paymentType || (record.advance > 0 ? 'Advance' : (record.notes?.toLowerCase().includes('final') ? 'Final Payment' : 'Milestone'))}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <span className="inline-flex items-center gap-1.5 font-medium">
                                    <span>{record.paymentPlatform || 'Direct'}</span>
                                  </span>
                                </td>
                                <td className="p-3 font-mono text-[10px] text-slate-500">
                                  {record.transactionId || '—'}
                                </td>
                                <td className="p-3 max-w-xs truncate text-slate-500">
                                  {record.notes || '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                      <DollarSign className="mx-auto text-slate-500 opacity-30 mb-2" size={28} />
                      <p className="text-xs font-medium text-slate-900">No payment transactions recorded for this project yet</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Record client payments under the <b>Payments</b> tab to track advance, milestone, or final settlements.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'discussions' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
                  <SectionHeader icon={<MessageSquare size={14}/>} title="Client Communication History" subtitle={`${clientDiscussions.length} records`} />
                  <div className="space-y-4">
                    {clientDiscussions.length > 0 ? (
                      clientDiscussions.map((disc, idx) => (
                        <div key={idx} className="flex gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                          <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                            {disc.type === 'Email' ? <Mail size={16}/> : disc.type === 'Call' ? <PhoneCall size={16}/> : <MessageSquare size={16}/>}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-slate-900">{disc.subject || disc.title || 'Discussion Record'}</p>
                            <p className="text-[9px] text-slate-500 font-medium mb-1">{disc.date || disc.callDate || new Date(disc.timestamp).toLocaleDateString()}</p>
                            <p className="text-[10px] text-slate-600 line-clamp-2 leading-relaxed italic">
                              {disc.content || disc.summary || disc.conversationSummary || 'No details logged.'}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        <MessageSquare className="mx-auto text-slate-500 opacity-20 mb-2" size={32} />
                        <p className="text-xs text-slate-500 italic">No discussion history found for this project.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
                    <SectionHeader icon={<Award size={14}/>} title="Project Feedback" />
                    {(!project.reviews || project.reviews.length === 0) ? (
                      <div className="p-6 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-[11px] text-slate-500 italic">No reviews recorded yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {project.reviews.map((rev) => (
                          <div key={rev.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl group relative">
                            <button
                              onClick={() => handleDeleteProjectReview(rev.id)}
                              className="absolute top-2 right-2 p-1 text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-50 rounded-md"
                            >
                              <Trash2 size={12} />
                            </button>
                            <div className="flex justify-between items-center mb-1">
                              <h6 className="text-[11px] font-bold text-slate-900">{rev.title}</h6>
                              <span className="text-[9px] text-slate-500 font-medium">{rev.date}</span>
                            </div>
                            <div className="flex gap-0.5 mb-2">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} size={10} fill={i < rev.rating ? "#F59E0B" : "none"} className={i < rev.rating ? "text-amber-500" : "text-zinc-300"} />
                              ))}
                            </div>
                            <p className="text-[10px] text-slate-600 italic leading-relaxed">"{rev.comments}"</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <form onSubmit={handleAddProjectReview} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
                    <SectionHeader icon={<Pencil size={14}/>} title="Add New Review" />
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Title</label>
                        <input
                          type="text"
                          placeholder="Review title"
                          value={newRevTitle}
                          onChange={(e) => setNewRevTitle(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-medium focus:border-indigo-500 outline-none transition-all"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Date</label>
                          <input
                            type="date"
                            value={newRevDate}
                            onChange={(e) => setNewRevDate(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-medium focus:border-indigo-500 outline-none"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase">Rating</label>
                          <select
                            value={newRevRating}
                            onChange={(e) => setNewRevRating(Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-medium focus:border-indigo-500 outline-none"
                          >
                            <option value="5">5 Stars</option>
                            <option value="4">4 Stars</option>
                            <option value="3">3 Stars</option>
                            <option value="2">2 Stars</option>
                            <option value="1">1 Star</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Comments</label>
                        <textarea
                          placeholder="Client feedback..."
                          rows={3}
                          value={newRevComments}
                          onChange={(e) => setNewRevComments(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-medium focus:border-indigo-500 outline-none resize-none"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all uppercase tracking-widest cursor-pointer"
                      >
                        Save Review
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* 3. Footer (Actions) */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3">
          <div className="flex gap-2">
            <button 
              onClick={() => onEdit?.(project)}
              className="p-2 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 transition-all cursor-pointer"
              title="Edit Project"
            >
              <Pencil size={18} />
            </button>
            <button 
              disabled={isDeleting}
              onClick={async () => {
                if (window.confirm('Are you sure you want to delete this project?')) {
                  setIsDeleting(true);
                  try {
                    if (onDelete && project.id) {
                      const result = await onDelete(project.id);
                      if (result !== false) {
                        onClose();
                      }
                    }
                  } catch (err) {
                    console.error("Failed to delete", err);
                  } finally {
                    setIsDeleting(false);
                  }
                }
              }}
              className={`p-2 border border-transparent rounded-xl transition-all cursor-pointer ${isDeleting ? 'opacity-50 cursor-not-allowed bg-rose-500/10 text-rose-600' : 'hover:bg-rose-50 hover:border-rose-100 text-zinc-300 hover:text-rose-600'}`}
              title="Delete Project"
            >
              {isDeleting ? <span className="text-xs font-semibold px-1">...</span> : <Trash2 size={18} />}
            </button>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-md hover:bg-zinc-800 cursor-pointer"
            >
              Close Record
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
