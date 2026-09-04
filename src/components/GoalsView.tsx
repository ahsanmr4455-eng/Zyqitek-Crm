import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Clock, Plus, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { Goal } from '../types';

interface GoalsViewProps {
  goals: Goal[];
  onAddGoal: (newGoal: Omit<Goal, 'id'>) => Promise<boolean>;
  onIncrementGoal: (id: string, amount: number) => Promise<boolean>;
  onDeleteGoal: (id: string) => void;
}

export default function GoalsView({ goals, onAddGoal, onIncrementGoal, onDeleteGoal }: GoalsViewProps) {
  // Goal Form Fields
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Financial');
  const [newDescription, setNewDescription] = useState('');
  const [newTarget, setNewTarget] = useState(10);
  const [newCurrent, setNewCurrent] = useState(0);
  const [newUnit, setNewUnit] = useState('units');
  const [newStartDate, setNewStartDate] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newPriority, setNewPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [newStatus, setNewStatus] = useState('In Progress');
  const [newNotes, setNewNotes] = useState('');

  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTrackingId, setIsTrackingId] = useState<string | null>(null);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);

  // Manage body scroll lock
  React.useEffect(() => {
    const isAnyModalOpen = showAddGoalModal || !!goalToDelete;
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showAddGoalModal, goalToDelete]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsSaving(true);

    try {
      const success = await onAddGoal({
        title: newTitle,
        category: newCategory,
        description: newDescription,
        target: Number(newTarget) || 0,
        current: Number(newCurrent) || 0,
        unit: newUnit || 'units',
        startDate: newStartDate,
        deadline: newDeadline || 'June 30, 2026',
        priority: newPriority,
        status: newStatus,
        notes: newNotes,
      });

      if (success) {
        // Reset states
        setNewTitle('');
        setNewCategory('Financial');
        setNewDescription('');
        setNewTarget(10);
        setNewCurrent(0);
        setNewUnit('units');
        setNewStartDate('');
        setNewDeadline('');
        setNewPriority('Medium');
        setNewStatus('In Progress');
        setNewNotes('');
        setShowAddGoalModal(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'High':
        return 'text-rose-600 bg-rose-500/10 border-rose-500/20';
      case 'Low':
        return 'text-[var(--crm-text-muted)] bg-[var(--crm-sidebar)] border-[var(--crm-card-border)]';
      default:
        return 'text-amber-600 bg-amber-500/10 border-amber-500/20';
    }
  };

  return (
    <div id="goals-view" className="space-y-6 text-[var(--crm-text)] select-none pb-12">
      {/* 1. Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[30px] sm:text-[32px] font-bold tracking-tight !text-white text-white font-structure leading-[1.2] section-main-heading">Goals</h1>
          <p className="!text-white text-white text-sm font-normal italic mt-1 section-sub-heading">
            Establish operational targets, track progress milestones, and monitor fulfillment.
          </p>
        </div>
        <div>
          <button
            id="btn-add-goal"
            onClick={() => setShowAddGoalModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--crm-card)] hover:bg-[var(--crm-sidebar)] text-[var(--crm-text)] text-sm font-medium rounded-xl transition-all cursor-pointer border border-[var(--crm-card-border)] shadow-sm hover:shadow-md active:scale-98"
          >
            <Plus size={16} /> Add Goal
          </button>
        </div>
      </div>

      {/* 2. Dashboard Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 4k:grid-cols-8 5k:grid-cols-12 gap-4 sm:gap-6">
        {/* Total Goals */}
        <div className="bg-[var(--crm-card)] rounded-[24px] p-6 sm:p-8 border border-[var(--crm-card-border)] shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-[var(--crm-card-border)] flex items-center justify-center shrink-0 shadow-sm">
            <Target size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px]  text-[var(--crm-text-muted)]   leading-none mb-1.5">
              Total Goals
            </p>
            <p className="text-2xl  text-[var(--crm-text)] leading-none">
              {goals.length}
            </p>
          </div>
        </div>

        {/* Active Targets */}
        <div className="bg-[var(--crm-card)] rounded-[24px] p-6 sm:p-8 border border-[var(--crm-card-border)] shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-[var(--crm-card-border)] flex items-center justify-center shrink-0 shadow-sm">
            <Clock size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px]  text-[var(--crm-text-muted)]   leading-none mb-1.5">
              Active Targets
            </p>
            <p className="text-2xl  text-[var(--crm-text)] leading-none">
              {goals.filter(g => g.status !== 'Completed' && (g.target <= 0 || g.current < g.target)).length}
            </p>
          </div>
        </div>

        {/* Completed Goals */}
        <div className="bg-[var(--crm-card)] rounded-[24px] p-6 sm:p-8 border border-[var(--crm-card-border)] shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-[var(--crm-card-border)] flex items-center justify-center shrink-0 shadow-sm">
            <Target size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px]  text-[var(--crm-text-muted)]   leading-none mb-1.5">
              Completed
            </p>
            <p className="text-2xl  text-[var(--crm-text)] leading-none">
              {goals.filter(g => g.status === 'Completed' || (g.target > 0 && g.current >= g.target)).length}
            </p>
          </div>
        </div>

        {/* High Priority */}
        <div className="bg-[var(--crm-card)] rounded-[24px] p-6 sm:p-8 border border-[var(--crm-card-border)] shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="h-12 w-12 rounded-2xl bg-[var(--crm-card)] border border-[var(--crm-card-border)] text-rose-600 flex items-center justify-center shrink-0 shadow-sm">
            <AlertCircle size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px]  text-[var(--crm-text-muted)]   leading-none mb-1.5">
              High Priority
            </p>
            <p className="text-2xl  text-[var(--crm-text)] leading-none">
              {goals.filter(g => g.priority === 'High').length}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Main Data Card: Goals Grid */}
      <div className="bg-[var(--crm-bg)] rounded-[24px] border-none shadow-sm overflow-hidden p-6">
        {goals.length === 0 ? (
          <div className="py-16 text-center text-[var(--crm-text-muted)]  text-xs flex flex-col items-center justify-center space-y-3 max-w-md mx-auto">
            <div className="p-3.5 bg-[var(--crm-card)] rounded-2xl text-[var(--crm-text-muted)] border border-[var(--crm-card-border)] shadow-xs">
              <Target size={30} />
            </div>
            <div>
              <h4 className="text-sm font-medium text-[var(--crm-text)]">No active targets found</h4>
              <p className="text-xs text-[#f5f4f4] mt-1 max-w-xs ">
                Get started by defining high-impact goals to coordinate team focus.
              </p>
            </div>
            <button
              onClick={() => setShowAddGoalModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--crm-card)] hover:bg-[var(--crm-sidebar)] text-[var(--crm-text)] border border-[var(--crm-card-border)] text-xs font-medium rounded-xl transition-all cursor-pointer shadow-xs hover:shadow-md active:scale-98 mt-2"
            >
              <Plus size={14} /> Add Your First Goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {goals.map((goal, idx) => {
              const pct = goal.target > 0 ? Math.min(Math.round((goal.current / goal.target) * 100), 100) : 0;
              return (
                <motion.div 
                  key={goal.id} 
                  id={`goal-item-${goal.id}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.04 }}
                  className="bg-[var(--crm-sidebar)] rounded-2xl border border-[var(--crm-card-border)] p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Goal Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <span className="text-[9px] font-medium  text-indigo-600 bg-indigo-500/10 px-2.5 py-0.5 rounded-full  border border-indigo-500/20">
                            {goal.category}
                          </span>
                          {goal.priority && (
                            <span className={`text-[9px] font-medium  px-2.5 py-0.5 rounded-full  border ${getPriorityColor(goal.priority)}`}>
                              {goal.priority} Priority
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-medium text-[var(--crm-text)] leading-snug mt-2 group-hover:text-[var(--crm-text)]">{goal.title}</h3>
                        {goal.description && (
                          <p className="text-xs text-[var(--crm-text-muted)] line-clamp-2 mt-1 ">{goal.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          disabled={isTrackingId !== null}
                          onClick={async () => {
                            setIsTrackingId(goal.id);
                            try {
                              const step = goal.target > 100 ? 10 : 1;
                              await onIncrementGoal(goal.id, step);
                            } catch (err) {
                              console.error(err);
                            } finally {
                              setIsTrackingId(null);
                            }
                          }}
                          className="px-2.5 py-1.5 text-[10px] font-medium text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors cursor-pointer border border-emerald-500/20 flex items-center gap-1 disabled:opacity-50"
                        >
                          {isTrackingId === goal.id ? (
                            <div className="animate-spin h-3 w-3 border-2 border-emerald-600 border-t-transparent rounded-full" />
                          ) : (
                            <span>+ Progress</span>
                          )}
                        </button>
                        <button
                          onClick={() => setGoalToDelete(goal)}
                          className="p-1.5 text-[var(--crm-text-muted)] hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Delete Goal"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Deadline & Dates */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 text-[11px] text-[var(--crm-text-muted)] ">
                      {goal.startDate && (
                        <span className="flex items-center gap-1">
                          <Calendar size={12} className="text-[var(--crm-text-muted)]" /> Start: {goal.startDate}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock size={12} className="text-[var(--crm-text-muted)]" /> Target Date: {goal.deadline || 'June 30, 2026'}
                      </span>
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  <div className="mt-6 pt-5 border-t border-[var(--crm-card-border)] space-y-2">
                    <div className="flex justify-between text-xs text-[var(--crm-text-secondary)] font-medium">
                      <span>
                        Current: {goal.unit === '$' ? `$${goal.current}` : `${goal.current} ${goal.unit}`}
                      </span>
                      <span>
                        Target: {goal.unit === '$' ? `$${goal.target}` : `${goal.target} ${goal.unit}`}
                      </span>
                    </div>

                    <div className="w-full bg-[var(--crm-sidebar)] h-2 rounded-full overflow-hidden border border-[var(--crm-card-border)]">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.65, ease: "easeOut" }}
                        className="h-full bg-indigo-600 rounded-full"
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-medium">
                      <span className="text-[var(--crm-text-muted)]  ">
                        Status: <strong className="text-[var(--crm-text)]">{goal.status || (pct === 100 ? 'Achieved' : 'In Progress')}</strong>
                      </span>
                      <span className="text-indigo-600 font-semibold">{pct}% COMPLETE</span>
                    </div>

                    {goal.notes && (
                      <div className="bg-[var(--crm-sidebar)] p-2.5 rounded-xl border border-[var(--crm-card-border)] text-[10px] text-[var(--crm-text-muted)]  mt-3 italic line-clamp-1">
                        Note: {goal.notes}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Global Add Goal Modal */}
      <AnimatePresence>
        {showAddGoalModal && (
          <div className="fixed inset-0 z-50 bg-[var(--crm-bg)]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--crm-card)] rounded-[24px] shadow-2xl border border-[var(--crm-card-border)] max-w-lg 2xl:max-w-xl 3xl:max-w-2xl 4k:max-w-3xl 5k:max-w-4xl w-full overflow-hidden my-8 text-[var(--crm-text)] flex flex-col"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-[var(--crm-card-border)] flex items-center justify-between bg-[var(--crm-sidebar)]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-600 shadow-xs">
                    <Target size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold tracking-tight text-[var(--crm-text)]">Add Goal</h3>
                    <p className="text-[11px] text-[var(--crm-text-muted)] ">Establish a target milestone and performance metrics</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAddGoalModal(false)}
                  className="text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] cursor-pointer p-1.5 hover:bg-[var(--crm-sidebar-active-bg)] rounded-xl transition-colors"
                >
                  <Plus size={18} className="rotate-45" />
                </button>
              </div>

              {/* Modal Scroll Container */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-[var(--crm-text-secondary)]">
                
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-[var(--crm-text-muted)]   block">Goal Title *</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Expand Q3 SMM Retainers"
                    className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-600 font-medium text-xs text-[var(--crm-text)] placeholder-[var(--crm-text-muted)]"
                    required
                  />
                </div>

                {/* Category & Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-medium text-[var(--crm-text-muted)]   block">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-600 font-medium text-xs text-[var(--crm-text)] cursor-pointer"
                    >
                      <option value="Financial">Financial</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Operations">Operations</option>
                      <option value="Calling">Calling</option>
                      <option value="Client Acquisition">Client Acquisition</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-medium text-[var(--crm-text-muted)]   block">Priority</label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as any)}
                      className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-600 font-medium text-xs text-[var(--crm-text)] cursor-pointer"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-[var(--crm-text-muted)]   block">Description</label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Short summary of the purpose and objectives..."
                    rows={2}
                    className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-600 font-medium text-xs text-[var(--crm-text)] placeholder-[var(--crm-text-muted)] resize-none"
                  />
                </div>

                {/* Progress, Target, and Unit */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-medium text-[var(--crm-text-muted)]   block">Current Progress</label>
                    <input
                      type="number"
                      value={newCurrent}
                      onChange={(e) => setNewCurrent(Number(e.target.value))}
                      className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-600 font-medium text-xs text-[var(--crm-text)]"
                      min="0"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-medium text-[var(--crm-text-muted)]   block">Target Value *</label>
                    <input
                      type="number"
                      value={newTarget}
                      onChange={(e) => setNewTarget(Number(e.target.value))}
                      className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-600 font-medium text-xs text-[var(--crm-text)]"
                      min="1"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-medium text-[var(--crm-text-muted)]   block">Unit *</label>
                    <input
                      type="text"
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value)}
                      placeholder="e.g. $, accounts, calls"
                      className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-600 font-medium text-xs text-[var(--crm-text)]"
                      required
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-medium text-[var(--crm-text-muted)]   block">Start Date</label>
                    <input
                      type="date"
                      value={newStartDate}
                      onChange={(e) => setNewStartDate(e.target.value)}
                      className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-600 font-medium text-xs text-[var(--crm-text)]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-medium text-[var(--crm-text-muted)]   block">Deadline *</label>
                    <input
                      type="date"
                      value={newDeadline}
                      onChange={(e) => setNewDeadline(e.target.value)}
                      className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-600 font-medium text-xs text-[var(--crm-text)]"
                      required
                    />
                  </div>
                </div>

                {/* Status & Notes */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-medium text-[var(--crm-text-muted)]   block">Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-600 font-medium text-xs text-[var(--crm-text)] cursor-pointer"
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-medium text-[var(--crm-text-muted)]   block">Notes</label>
                    <input
                      type="text"
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      placeholder="e.g. Budget authorized by management"
                      className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-600 font-medium text-xs text-[var(--crm-text)]"
                    />
                  </div>
                </div>

                {/* Submit / Action Buttons */}
                <div className="flex justify-end items-center gap-3 pt-5 border-t border-[var(--crm-card-border)]">
                  <button
                    type="button"
                    onClick={() => setShowAddGoalModal(false)}
                    className="px-4 py-2 bg-[var(--crm-sidebar)] hover:bg-[var(--crm-sidebar-active-bg)] text-[var(--crm-text-secondary)] text-xs  rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 shadow-sm"
                  >
                    {isSaving ? 'Creating...' : 'Create Goal'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {goalToDelete && (
          <div className="fixed inset-0 z-50 bg-[var(--crm-bg)]/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--crm-card)] rounded-[24px] shadow-2xl border border-[var(--crm-card-border)] max-w-sm w-full overflow-hidden text-[var(--crm-text)]"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 text-rose-600">
                  <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20">
                    <AlertCircle size={22} />
                  </div>
                  <h3 className="text-base font-medium tracking-tight text-[var(--crm-text)]">Delete Goal</h3>
                </div>
                <p className="text-xs text-[var(--crm-text-muted)] leading-relaxed ">
                  Are you sure you want to permanently delete goal <strong className="text-[var(--crm-text)] font-medium">"{goalToDelete.title}"</strong>? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setGoalToDelete(null)}
                    className="px-4 py-2 bg-[var(--crm-sidebar)] hover:bg-[var(--crm-sidebar-active-bg)] text-[var(--crm-text-secondary)] text-xs  rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteGoal(goalToDelete.id);
                      setGoalToDelete(null);
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-xl transition-colors cursor-pointer shadow-sm"
                  >
                    Delete Goal
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