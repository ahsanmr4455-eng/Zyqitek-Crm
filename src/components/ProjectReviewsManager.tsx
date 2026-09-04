import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Briefcase, 
  Quote, 
  TrendingUp,
  MessageSquare,
  Building2,
  ChevronRight,
  Plus,
  CheckCircle2,
  X,
  Edit2,
  Trash2
} from 'lucide-react';
import { Project, Review, Client } from '../types';

interface ProjectReviewsManagerProps {
  projects: Project[];
  clients: Client[];
  showToast: (msg: string, type?: 'success' | 'error') => void;
  onUpdateProject?: (updatedProject: Project) => Promise<boolean>;
}

export default function ProjectReviewsManager({ projects, clients, showToast, onUpdateProject }: ProjectReviewsManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | 'All'>('All');
  const [clientFilter, setClientFilter] = useState('All');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

  // Form State
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [rating, setRating] = useState<number>(5);
  const [comments, setComments] = useState('');
  const [service, setService] = useState('');
  const [projectStatus, setProjectStatus] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  // Flatten all reviews with project context
  const allReviews = useMemo(() => {
    const reviewsWithContext: (Review & { projectName: string; projectId: string; clientName: string; clientId: string })[] = [];
    
    projects.forEach(project => {
      if (project.reviews && project.reviews.length > 0) {
        project.reviews.forEach(review => {
          reviewsWithContext.push({
            ...review,
            projectName: project.name,
            projectId: project.id,
            clientName: project.clientName || 'Unknown Client',
            clientId: project.clientId
          });
        });
      }
    });

    // Sort by date descending
    return reviewsWithContext.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [projects]);

  const filteredReviews = useMemo(() => {
    return allReviews.filter(rev => {
      const matchesSearch = 
        rev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rev.comments.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rev.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rev.clientName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRating = ratingFilter === 'All' || rev.rating === ratingFilter;
      const matchesClient = clientFilter === 'All' || rev.clientId === clientFilter;

      return matchesSearch && matchesRating && matchesClient;
    });
  }, [allReviews, searchQuery, ratingFilter, clientFilter]);

  const stats = useMemo(() => {
    if (allReviews.length === 0) return { avg: 0, total: 0, fiveStar: 0 };
    const sum = allReviews.reduce((acc, rev) => acc + rev.rating, 0);
    return {
      avg: (sum / allReviews.length).toFixed(1),
      total: allReviews.length,
      fiveStar: allReviews.filter(r => r.rating === 5).length
    };
  }, [allReviews]);

  // Form derived state
  const availableProjects = useMemo(() => {
    if (!selectedClientId) return [];
    return projects.filter(p => p.clientId === selectedClientId);
  }, [selectedClientId, projects]);

  const handleOpenModal = (reviewToEdit?: any) => {
    if (reviewToEdit) {
      setEditingReviewId(reviewToEdit.id);
      setSelectedClientId(reviewToEdit.clientId || '');
      setSelectedProjectId(reviewToEdit.projectId || '');
      setRating(reviewToEdit.rating || 5);
      setComments(reviewToEdit.comments || '');
      setService(reviewToEdit.service || '');
      setProjectStatus(reviewToEdit.projectStatus || '');
      setInternalNotes(reviewToEdit.internalNotes || '');
    } else {
      setEditingReviewId(null);
      setSelectedClientId('');
      setSelectedProjectId('');
      setRating(5);
      setComments('');
      setService('');
      setProjectStatus('');
      setInternalNotes('');
    }
    setShowModal(true);
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !selectedProjectId) {
      showToast('Please select a client and project.', 'error');
      return;
    }
    if (!comments.trim()) {
      showToast('Review feedback is required.', 'error');
      return;
    }

    const targetProject = projects.find(p => p.id === selectedProjectId);
    const targetClient = clients.find(c => c.id === selectedClientId);

    if (!targetProject || !targetClient) {
      showToast('Selected project or client not found.', 'error');
      return;
    }

    let existingReviews = [...(targetProject.reviews || [])];

    if (editingReviewId) {
      const idx = existingReviews.findIndex(r => r.id === editingReviewId);
      if (idx !== -1) {
        existingReviews[idx] = {
          ...existingReviews[idx],
          rating,
          comments,
          service,
          projectStatus,
          internalNotes,
          clientId: selectedClientId,
          projectId: selectedProjectId,
        };
      }
    } else {
      const newReview: Review = {
        id: `REV-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        title: `Review for ${targetProject.name}`,
        date: new Date().toISOString(),
        rating,
        comments,
        service,
        projectStatus,
        internalNotes,
        clientId: selectedClientId,
        projectId: selectedProjectId,
      };
      existingReviews.push(newReview);
    }

    const updatedProject = { ...targetProject, reviews: existingReviews };
    if (onUpdateProject) {
      const success = await onUpdateProject(updatedProject);
      if (success) {
        showToast(editingReviewId ? 'Review updated successfully' : 'Review added successfully', 'success');
        setShowModal(false);
      } else {
        showToast('Failed to save review', 'error');
      }
    }
  };

  const handleDeleteReview = async (reviewId: string, projectId: string) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    const targetProject = projects.find(p => p.id === projectId);
    if (!targetProject) return;

    const updatedReviews = (targetProject.reviews || []).filter(r => r.id !== reviewId);
    const updatedProject = { ...targetProject, reviews: updatedReviews };
    
    if (onUpdateProject) {
      const success = await onUpdateProject(updatedProject);
      if (success) {
        showToast('Review deleted successfully', 'success');
      } else {
        showToast('Failed to delete review', 'error');
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] p-5 rounded-2xl border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600">
            <Star size={24} fill="currentColor" />
          </div>
          <div>
            <p className="text-[10px] text-[var(--crm-subtitle)] uppercase tracking-wider font-semibold">Average Satisfaction</p>
            <p className="text-2xl text-[var(--crm-text)] font-bold mt-1">{stats.avg} <span className="text-xs text-[var(--crm-text-muted)] font-normal">/ 5.0</span></p>
          </div>
        </div>
        
        <div className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] p-5 rounded-2xl border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-[10px] text-[var(--crm-subtitle)] uppercase tracking-wider font-semibold">Total Reviews</p>
            <p className="text-2xl text-[var(--crm-text)] font-bold mt-1">{stats.total}</p>
          </div>
        </div>

        <div className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] p-5 rounded-2xl border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-[10px] text-[var(--crm-subtitle)] uppercase tracking-wider font-semibold">5-Star Experiences</p>
            <p className="text-2xl text-[var(--crm-text)] font-bold mt-1">{stats.fiveStar}</p>
          </div>
        </div>
      </div>

      {/* Filters Bar & Add Button */}
      <div className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] p-4 rounded-xl border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4 w-full md:w-auto flex-1">
          <div className="relative w-full max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--crm-text-muted)]" />
            <input 
              type="text"
              placeholder="Search reviews, projects, or clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all text-[var(--crm-text)]"
            />
          </div>
          <select 
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value === 'All' ? 'All' : Number(e.target.value))}
            className="bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-lg px-3 py-2 text-xs font-medium text-[var(--crm-text)] outline-none"
          >
            <option value="All">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
          <select 
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-lg px-3 py-2 text-xs font-medium text-[var(--crm-text)] outline-none"
          >
            <option value="All">All Clients</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.company || c.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="w-full md:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus size={14} /> Add Review
        </button>
      </div>

      {/* Reviews Grid */}
      {filteredReviews.length === 0 ? (
        <div className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] rounded-xl border border-dashed border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] p-12 text-center">
          <div className="w-12 h-12 bg-[var(--crm-sidebar)] rounded-full flex items-center justify-center mx-auto mb-3 text-[var(--crm-text-muted)]">
            <Quote size={20} />
          </div>
          <h3 className="text-sm font-semibold text-[var(--crm-text)] tracking-tight">No Reviews Found</h3>
          <p className="text-xs text-[var(--crm-subtitle)] max-w-xs mx-auto mt-1">
            Collect feedback from completed projects to showcase your team's excellence here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 4k:grid-cols-7 5k:grid-cols-10 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 4k:grid-cols-8 5k:grid-cols-12 gap-4">
          <AnimatePresence>
            {filteredReviews.map((review, idx) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.05, 0.3) }}
                className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] rounded-xl border border-[var(--crm-card-border)] shadow-sm hover:shadow-md transition-all p-5 flex flex-col group relative"
              >
                {/* Actions */}
                <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(review)} className="p-1.5 text-[var(--crm-text-muted)] hover:text-indigo-600 hover:bg-indigo-500/10 rounded-md transition-colors">
                    <Edit2 size={12} />
                  </button>
                  <button onClick={() => handleDeleteReview(review.id, review.projectId)} className="p-1.5 text-[var(--crm-text-muted)] hover:text-rose-600 hover:bg-rose-500/10 rounded-md transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>

                <div className="flex justify-between items-start mb-3 pr-12">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={12} 
                        fill={i < review.rating ? "#F59E0B" : "none"} 
                        className={i < review.rating ? "text-amber-500" : "text-[var(--crm-card-border)]"} 
                      />
                    ))}
                  </div>
                  <span className="text-[9px] font-medium text-[var(--crm-text-muted)] flex items-center gap-1 uppercase tracking-wider">
                    {new Date(review.date).toLocaleDateString()}
                  </span>
                </div>

                <div className="mb-4 flex-1">
                  <div className="mt-2 text-xs text-[var(--crm-text)] leading-relaxed italic relative">
                    <Quote size={10} className="absolute -left-3.5 -top-1 text-[var(--crm-text-muted)] opacity-30" />
                    "{review.comments}"
                  </div>
                  {review.internalNotes && (
                    <div className="mt-3 p-2 bg-amber-500/5 border border-amber-500/20 rounded-md text-[10px] text-amber-700/80 dark:text-amber-500/80">
                      <strong>Admin Note:</strong> {review.internalNotes}
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-3 border-t border-[var(--crm-card-border)] space-y-1.5">
                  <div className="flex items-center gap-2 text-[10px] font-medium text-[var(--crm-text-secondary)]">
                    <Building2 size={12} className="text-[var(--crm-text-muted)]" />
                    <span className="truncate">{review.clientName}</span>
                    <span className="font-mono text-[8px] text-[var(--crm-text-muted)] bg-[var(--crm-sidebar)] px-1 py-0.5 rounded ml-auto">{review.clientId.substring(0,6)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-medium text-[var(--crm-heading)]">
                    <Briefcase size={12} className="text-[var(--crm-text-muted)]" />
                    <span className="truncate">{review.projectName}</span>
                    <span className="font-mono text-[8px] text-[var(--crm-text-muted)] bg-[var(--crm-sidebar)] px-1 py-0.5 rounded ml-auto">{review.projectId.substring(0,6)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-[var(--crm-card)] rounded-xl shadow-2xl max-w-lg 2xl:max-w-xl 3xl:max-w-2xl 4k:max-w-3xl 5k:max-w-4xl w-full border border-[var(--crm-card-border)] overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-4 border-b border-[var(--crm-card-border)] flex items-center justify-between shrink-0">
              <h3 className="font-semibold text-[var(--crm-heading)] text-sm tracking-tight">{editingReviewId ? 'Edit Review' : 'Add Project Review'}</h3>
              <button onClick={() => setShowModal(false)} className="text-[var(--crm-text-muted)] hover:text-[var(--crm-heading)] transition-colors p-1">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveReview} className="p-5 overflow-y-auto space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--crm-subtitle)] uppercase tracking-wider block">1. Select Client</label>
                <select 
                  required
                  value={selectedClientId} 
                  onChange={(e) => {
                    setSelectedClientId(e.target.value);
                    setSelectedProjectId('');
                  }}
                  className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-lg px-3 py-2 text-xs font-medium text-[var(--crm-text)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">-- Choose Client --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.company || c.name} ({c.id.substring(0,6)})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--crm-subtitle)] uppercase tracking-wider block">2. Select Project</label>
                <select 
                  required
                  disabled={!selectedClientId}
                  value={selectedProjectId} 
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-lg px-3 py-2 text-xs font-medium text-[var(--crm-text)] focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <option value="">-- Choose Project --</option>
                  {availableProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.id.substring(0,6)})</option>
                  ))}
                </select>
                {selectedClientId && availableProjects.length === 0 && (
                  <p className="text-[10px] text-rose-500 mt-1 flex items-center gap-1"><Search size={10} /> No projects found for this client.</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--crm-subtitle)] uppercase tracking-wider block">3. Overall Rating</label>
                <div className="flex gap-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-lg p-2 items-center justify-center">
                  {[1,2,3,4,5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`p-1.5 rounded-md transition-all ${rating >= star ? 'text-amber-500 scale-110' : 'text-[var(--crm-text-muted)] hover:text-amber-400'}`}
                    >
                      <Star size={24} fill={rating >= star ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--crm-subtitle)] uppercase tracking-wider block">4. Review / Feedback</label>
                <textarea 
                  required
                  rows={4}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Client's direct feedback or review text..."
                  className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-lg px-3 py-2 text-xs font-medium text-[var(--crm-text)] focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--crm-subtitle)] uppercase tracking-wider block">Service Delivered</label>
                  <input 
                    type="text"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    placeholder="e.g. Web Dev"
                    className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-lg px-3 py-2 text-xs font-medium text-[var(--crm-text)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--crm-subtitle)] uppercase tracking-wider block">Project Status</label>
                  <input 
                    type="text"
                    value={projectStatus}
                    onChange={(e) => setProjectStatus(e.target.value)}
                    placeholder="e.g. Completed"
                    className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-lg px-3 py-2 text-xs font-medium text-[var(--crm-text)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--crm-subtitle)] uppercase tracking-wider block">Internal Admin Notes (Optional)</label>
                <textarea 
                  rows={2}
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Private notes for the team, not shown to clients..."
                  className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-lg px-3 py-2 text-xs font-medium text-[var(--crm-text)] focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Readonly Identity Block */}
              {selectedClientId && selectedProjectId && (
                <div className="mt-4 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg text-[10px] space-y-1">
                  <p className="text-indigo-700/80 dark:text-indigo-400"><strong>Linking To:</strong></p>
                  <p className="text-[var(--crm-text-secondary)]">Client: {clients.find(c => c.id === selectedClientId)?.name} ({selectedClientId})</p>
                  <p className="text-[var(--crm-text-secondary)]">Project: {projects.find(p => p.id === selectedProjectId)?.name} ({selectedProjectId})</p>
                </div>
              )}
            </form>

            <div className="p-4 border-t border-[var(--crm-card-border)] bg-[var(--crm-sidebar)] flex justify-end gap-3 shrink-0">
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs font-medium text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveReview}
                disabled={!selectedClientId || !selectedProjectId || !comments.trim()}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <CheckCircle2 size={14} /> Save Review
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
