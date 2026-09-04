import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Calendar, 
  User, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Download, 
  Star, 
  MessageSquare, 
  FileText, 
  Sparkles, 
  Eye, 
  Lock, 
  ChevronRight,
  RotateCw,
  Award,
  ThumbsUp,
  Sliders,
  AlertCircle,
  RefreshCw,
  Check,
  Shield
} from 'lucide-react';
import { Client } from '../types';

interface ProjectTrackerProps {
  client: Client;
  onClose: () => void;
  onUpdateClientProgress?: (clientId: string, progress: number) => void;
}

// 7 exact stages required by the specifications
const STAGES = [
  'Project Received',
  'Planning',
  'Working',
  'Revision',
  'Quality Check',
  'Ready for Delivery',
  'Delivered'
];

export default function ProjectTracker({ client, onClose, onUpdateClientProgress }: ProjectTrackerProps) {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [enteredCode, setEnteredCode] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [shakeAuth, setShakeAuth] = useState(false);

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredCode.trim() === '2005') {
      setIsAuthorized(true);
      setAuthError(null);
    } else {
      setAuthError('Incorrect Security Code. Access Denied.');
      setShakeAuth(true);
      setTimeout(() => setShakeAuth(false), 500);
    }
  };

  const [isClientMode, setIsClientMode] = useState(false); // Toggle between Admin Control & Client Live View
  const [tracking, setTracking] = useState<any>(null);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [review, setReview] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Form states for Admin Edit
  const [projectName, setProjectName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [status, setStatus] = useState('Project Received');
  const [progress, setProgress] = useState(0);
  const [revisionsAllowed, setRevisionsAllowed] = useState(3);
  const [estimatedTimeLeft, setEstimatedTimeLeft] = useState('');
  
  // Delivery sub-states
  const [deliveryStatus, setDeliveryStatus] = useState('Not Delivered');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveredBy, setDeliveredBy] = useState('');
  const [finalFiles, setFinalFiles] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Form states for adding revision (Admin)
  const [showAddRevision, setShowAddRevision] = useState(false);
  const [newRevisionNotes, setNewRevisionNotes] = useState('');
  const [newRevisionStatus, setNewRevisionStatus] = useState('Pending');

  // Form states for client review (Client View)
  const [showReviewPopup, setShowReviewPopup] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewMessage, setReviewMessage] = useState('');
  const [recommend, setRecommend] = useState('Yes');
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Fetch tracking data from PHP API
  const fetchTrackingData = async () => {
    try {
      setSyncing(true);
      const res = await fetch(`/api/project_tracking.php?client_id=${client.id}`);
      if (!res.ok) throw new Error('Failed to load project tracking data');
      const result = await res.json();
      if (result.success) {
        setTracking(result.tracking);
        setRevisions(result.revisions || []);
        setReview(result.review || null);

        // Populate forms with values fetched directly from the database
        const track = result.tracking || {};
        setProjectName(track.project_name || '');
        setProjectId(track.project_id || '');
        setStartDate(track.start_date || '');
        setExpectedDate(track.expected_delivery_date || '');
        setStatus(track.current_status || 'Project Received');
        setProgress(Number(track.overall_progress || 0));
        setRevisionsAllowed(Number(track.revisions_allowed || 3));
        setEstimatedTimeLeft(track.estimated_time_left || '');
        
        setDeliveryStatus(track.delivery_status || 'Not Delivered');
        setDeliveryDate(track.delivery_date || '');
        setDeliveredBy(track.delivered_by || '');
        setFinalFiles(track.final_files || '');
        setDeliveryNotes(track.delivery_notes || '');
      } else {
        throw new Error(result.error || 'API returned failure');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch tracking details');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchTrackingData();
  }, [client.id]);

  // Automatically update status based on progress values when admin drags slider
  useEffect(() => {
    // Only automatically change status in Admin editing session if deliveryStatus is NOT Delivered
    if (deliveryStatus !== 'Delivered') {
      if (progress === 0) {
        setStatus('Pending');
      } else if (progress > 0 && progress < 100) {
        setStatus('In Progress');
      } else if (progress === 100) {
        setStatus('Ready for Delivery');
      }
    } else {
      setStatus('Delivered');
    }
  }, [progress, deliveryStatus]);

  // Lock body scroll when review modal popup is open
  useEffect(() => {
    if (showReviewPopup) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showReviewPopup]);

  // Handle Admin Update
  const handleSaveTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Formulate payload exactly as required
      const payload = {
        client_id: client.id,
        project_name: projectName,
        project_id: projectId,
        start_date: startDate,
        expected_delivery_date: expectedDate,
        overall_progress: progress,
        revisions_allowed: revisionsAllowed,
        revisions_used: revisions.length,
        delivery_status: deliveryStatus,
        delivery_date: deliveryStatus === 'Delivered' && !deliveryDate ? new Date().toISOString().split('T')[0] : deliveryDate,
        delivered_by: deliveredBy,
        final_files: finalFiles,
        delivery_notes: deliveryNotes,
        estimated_time_left: estimatedTimeLeft
      };

      const res = await fetch('/api/project_tracking.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        if (onUpdateClientProgress) {
          onUpdateClientProgress(client.id, progress);
        }
        await fetchTrackingData();
      } else {
        alert(data.error || 'Failed to save tracking info');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while saving tracking');
    } finally {
      setSaving(false);
    }
  };

  // Handle Add Revision History (Admin)
  const handleAddRevisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRevisionNotes.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/project_tracking.php?action=add_revision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: client.id,
          notes: newRevisionNotes,
          status: newRevisionStatus,
          revision_date: new Date().toISOString()
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewRevisionNotes('');
        setShowAddRevision(false);
        await fetchTrackingData();
      } else {
        alert(data.error || 'Failed to add revision');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Handle Submit Review (Client Portal)
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/project_tracking.php?action=submit_review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: client.id,
          rating: reviewRating,
          message: reviewMessage,
          recommend: recommend
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowReviewPopup(false);
        await fetchTrackingData();
      } else {
        alert(data.error || 'Failed to submit review');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Timeline stage activation math
  // Completed stages should automatically become active.
  const getStageState = (stageName: string, index: number) => {
    // Stage name exact match checks
    const deliveryIsActive = (deliveryStatus === 'Delivered' || status === 'Delivered');
    
    if (stageName === 'Delivered') {
      return deliveryIsActive ? 'completed' : 'pending';
    }
    if (stageName === 'Ready for Delivery') {
      return progress >= 100 ? 'completed' : 'pending';
    }
    if (stageName === 'Quality Check') {
      return progress >= 90 ? 'completed' : progress >= 80 ? 'active' : 'pending';
    }
    if (stageName === 'Revision') {
      return (progress >= 70 || revisions.length > 0) ? 'completed' : progress >= 60 ? 'active' : 'pending';
    }
    if (stageName === 'Working') {
      return progress >= 40 ? 'completed' : progress >= 20 ? 'active' : 'pending';
    }
    if (stageName === 'Planning') {
      return progress >= 15 ? 'completed' : progress >= 5 ? 'active' : 'pending';
    }
    if (stageName === 'Project Received') {
      return 'completed'; // Always active and completed
    }
    
    return 'pending';
  };

  // Star Rating UI helper
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star 
            key={s} 
            size={14} 
            className={`${s <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} 
          />
        ))}
      </div>
    );
  };

  // Show review button condition check:
  // Review becomes available ONLY IF Project Progress = 100% AND Project Status = Delivered
  const isReviewAllowed = progress === 100 && (deliveryStatus === 'Delivered' || status === 'Delivered');

  if (!isAuthorized) {
    return (
      <div id="project-tracker-auth-panel" className="bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-2xl shadow-2xl overflow-hidden text-[var(--crm-text)] font-sans">
        {/* Header section */}
        <div className="p-6 bg-[var(--crm-card)] text-[var(--crm-text)] flex items-center justify-between border-b border-[var(--crm-card-border)]">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-gradient-to-tr from-blue-600 to-sky-500 rounded-xl flex items-center justify-center font-semibold text-white text-lg shadow-lg">
              PT
            </div>
            <div>
              <span className="text-[10px] font-semibold text-indigo-600   block">Admin Control Center</span>
              <h3 className="text-lg font-semibold tracking-tight text-[var(--crm-text)]">{projectName || `${client.company || client.name} Project`}</h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] rounded-lg hover:bg-[var(--crm-sidebar)] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Security verification body */}
        <div className="p-8 md:p-12 max-w-md mx-auto text-center space-y-6">
          <div className="inline-flex h-16 w-16 bg-indigo-500/10 text-indigo-600 rounded-2xl items-center justify-center border border-indigo-500/20 shadow-sm">
            <Lock size={32} />
          </div>
          
          <div className="space-y-2">
            <h4 className="text-base font-semibold text-[var(--crm-text)]">Security Verification Required</h4>
            <p className="text-xs text-[var(--crm-subtitle)] leading-relaxed">
              This section contains sensitive client deliverables, revision history, and administrative CRM controls. Please enter the master security code to unlock.
            </p>
          </div>

          <form onSubmit={handleVerifyCode} className="space-y-4">
            <motion.div
              animate={shakeAuth ? { x: [-10, 10, -10, 10, -5, 5, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="relative"
            >
              <div className="relative flex items-center">
                <span className="absolute left-4 text-[var(--crm-text-muted)]">
                  <Shield size={16} />
                </span>
                <input
                  type="password"
                  placeholder="Enter security code"
                  value={enteredCode}
                  onChange={(e) => {
                    setEnteredCode(e.target.value);
                    setAuthError(null);
                  }}
                  className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl pl-11 pr-4 py-3 text-sm text-[var(--crm-text)] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-center font-mono shadow-xs"
                  autoFocus
                />
              </div>
            </motion.div>

            {authError && (
              <p className="text-xs text-rose-500  animate-pulse">{authError}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-[var(--crm-sidebar)] hover:bg-[var(--crm-sidebar-active-bg)] text-[var(--crm-text-secondary)] text-xs  rounded-xl transition-colors cursor-pointer border border-[var(--crm-card-border)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-medium rounded-xl shadow-lg shadow-indigo-600/10 transition-all cursor-pointer"
              >
                Verify Code
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div id="project-tracker-panel" className="bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-2xl shadow-2xl overflow-hidden text-[var(--crm-text)] font-sans">
      
      {/* Header section with toggle switch */}
      <div className="p-6 bg-[var(--crm-card)] text-[var(--crm-text)] flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[var(--crm-card-border)]">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-gradient-to-tr from-blue-600 to-sky-500 rounded-xl flex items-center justify-center font-semibold text-white text-lg shadow-lg">
            PT
          </div>
          <div>
            <span className="text-[10px] font-semibold text-indigo-600   block">Admin Control Center</span>
            <h3 className="text-lg font-semibold tracking-tight text-[var(--crm-text)]">{projectName || `${client.company || client.name} Project`}</h3>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Refresh button */}
          <button 
            onClick={fetchTrackingData}
            title="Refresh database records"
            className="p-2 text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)] rounded-xl bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] hover:bg-[var(--crm-sidebar-active-bg)] transition-all cursor-pointer"
          >
            <RefreshCw size={15} className={syncing ? "animate-spin text-indigo-600" : ""} />
          </button>

          <button 
            onClick={onClose}
            className="p-2 text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] rounded-lg hover:bg-[var(--crm-sidebar)] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 space-y-6 bg-[var(--crm-sidebar)] animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-20 bg-[var(--crm-card-border)]/50 rounded-xl" />
            <div className="h-20 bg-[var(--crm-card-border)]/50 rounded-xl" />
            <div className="h-20 bg-[var(--crm-card-border)]/50 rounded-xl" />
          </div>
          <div className="h-40 bg-[var(--crm-card-border)]/40 rounded-xl" />
          <div className="h-32 bg-[var(--crm-card-border)]/30 rounded-xl" />
        </div>
      ) : error ? (
        <div className="p-12 text-center space-y-4 bg-[var(--crm-sidebar)] max-w-md mx-auto">
          <AlertCircle className="text-rose-500 mx-auto" size={40} />
          <p className="text-sm  text-[var(--crm-text)]">Database Synchronization Failure</p>
          <p className="text-xs text-[var(--crm-subtitle)] leading-relaxed">{error}</p>
          <button 
            onClick={fetchTrackingData}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-xs shadow-md"
          >
            Retry Sync
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 3xl:grid-cols-12 4k:grid-cols-12 5k:grid-cols-12 bg-[var(--crm-sidebar)]">
          
          {/* Main workspace section */}
          <div className="lg:col-span-8 p-6 lg:p-8 space-y-8 border-r border-[var(--crm-card-border)]">
            
            {/* 1. Real-time Progress Bar Block */}
            <div className="bg-[var(--crm-card)] rounded-2xl border border-[var(--crm-card-border)] p-6 shadow-xs space-y-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-semibold   bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync Active
                </span>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-indigo-600   block">Core Milestone Level</span>
                <h4 className="text-sm font-medium text-[var(--crm-text)] mt-0.5">Project completion indicator</h4>
              </div>

              {/* Glowing horizontal progress bar */}
              <div className="space-y-3">
                <div className="relative h-4 w-full bg-[var(--crm-sidebar)] rounded-full border border-[var(--crm-card-border)] p-[2px] overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-indigo-600 via-blue-500 to-sky-400 rounded-full shadow-xs"
                  />
                </div>
                <div className="flex justify-between items-center text-xs font-medium text-[var(--crm-text-secondary)]">
                  <span className="text-indigo-600">{progress}% Completed</span>
                  <span className="text-[var(--crm-text-muted)]">Remaining Progress: {100 - progress}%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div className="bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] p-3 rounded-xl shadow-xs">
                  <span className="text-[9px] font-medium text-[var(--crm-text-secondary)]   block">Remaining Progress</span>
                  <span className="text-xs font-medium text-[var(--crm-text)] mt-1 block">{100 - progress}%</span>
                </div>
                <div className="bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] p-3 rounded-xl shadow-xs">
                  <span className="text-[9px] font-medium text-[var(--crm-text-secondary)]   block">Revision Level</span>
                  <span className="text-xs font-medium text-[var(--crm-text)] mt-1 block">{revisions.length} requests logged</span>
                </div>
                <div className="bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] p-3 rounded-xl shadow-xs">
                  <span className="text-[9px] font-medium text-[var(--crm-text-secondary)]   block">Remaining Revisions</span>
                  <span className="text-xs font-medium text-[var(--crm-text)] mt-1 block">
                    {Math.max(0, revisionsAllowed - revisions.length)} / {revisionsAllowed}
                  </span>
                </div>
                <div className="bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] p-3 rounded-xl shadow-xs">
                  <span className="text-[9px] font-medium text-[var(--crm-text-secondary)]   block">Estimated time remaining</span>
                  <span className="text-xs font-medium text-indigo-600 mt-1 block">{estimatedTimeLeft || 'Computing...'}</span>
                </div>
              </div>
            </div>

            {/* 2. Interactive Timeline Block */}
            <div className="bg-[var(--crm-card)] rounded-2xl border border-[var(--crm-card-border)] p-6 shadow-xs space-y-6">
              <div>
                <span className="text-[10px] font-semibold text-indigo-600   block">Interactive Workflow Ledger</span>
                <h4 className="text-sm font-medium text-[var(--crm-text)] mt-0.5">Project Status Timeline</h4>
                <p className="text-xs text-[var(--crm-subtitle)] mt-0.5">Workflow stages adapt dynamically as milestones are approved.</p>
              </div>

              {/* Beautiful interactive dynamic timeline nodes */}
              <div className="relative pl-6 md:pl-0 grid grid-cols-1 md:grid-cols-7 gap-4 pt-4 pb-2">
                {/* Connecting lines for desktop */}
                <div className="hidden md:block absolute top-[28px] left-[7%] right-[7%] h-[2px] bg-[var(--crm-card-border)] z-0" />

                {STAGES.map((stage, idx) => {
                  const state = getStageState(stage, idx);
                  const isCompleted = state === 'completed';
                  const isActive = state === 'active';

                  return (
                    <div key={stage} className="relative flex flex-row md:flex-col items-center gap-3 md:gap-2 text-left md:text-center z-10">
                      <motion.div 
                        animate={{
                          scale: isActive ? 1.15 : 1,
                          backgroundColor: isCompleted ? '#4f46e5' : isActive ? '#2563eb' : 'var(--crm-sidebar)',
                          borderColor: isCompleted ? '#4f46e5' : isActive ? '#2563eb' : 'var(--crm-card-border)',
                          boxShadow: isActive ? '0 0 10px rgba(37,99,235,0.2)' : 'none'
                        }}
                        className={`h-8 w-8 rounded-full border-2 flex items-center justify-center font-medium text-xs shrink-0 cursor-default ${
                          isCompleted || isActive ? 'text-white' : 'text-[var(--crm-text-muted)]'
                        }`}
                        title={`${stage} is currently ${state}`}
                      >
                        {isCompleted ? (
                          <Check size={14} className="text-white" />
                        ) : (
                          <span>{idx + 1}</span>
                        )}
                      </motion.div>

                      <div className="md:px-1">
                        <p className={`text-[10px] font-semibold leading-tight tracking-tight  ${
                          isCompleted ? 'text-indigo-600' : isActive ? 'text-blue-600' : 'text-[var(--crm-text-muted)]'
                        }`}>
                          {stage}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Detailed Metadata Cards Grid */}
            <div className="bg-[var(--crm-card)] rounded-2xl border border-[var(--crm-card-border)] p-6 shadow-xs space-y-4">
              <div>
                <span className="text-[10px] font-semibold text-indigo-600   block">Technical Specifications</span>
                <h4 className="text-sm font-medium text-[var(--crm-text)] mt-0.5">Project Tracking Parameters</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 4k:grid-cols-7 5k:grid-cols-10 gap-4 text-xs font-medium text-[var(--crm-text-secondary)]">
                <div className="p-3 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl space-y-1">
                  <span className="text-[9px] text-[var(--crm-text-muted)]  block">PROJECT NAME</span>
                  <p className="text-[var(--crm-text)]  truncate">{projectName || 'Unnamed Project'}</p>
                </div>
                <div className="p-3 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl space-y-1">
                  <span className="text-[9px] text-[var(--crm-text-muted)]  block">PROJECT ID</span>
                  <p className="text-[var(--crm-text)] font-mono ">{projectId || 'N/A'}</p>
                </div>
                <div className="p-3 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl space-y-1">
                  <span className="text-[9px] text-[var(--crm-text-muted)]  block">CURRENT STATUS</span>
                  <p className="text-indigo-600  ">{status}</p>
                </div>
                <div className="p-3 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl space-y-1">
                  <span className="text-[9px] text-[var(--crm-text-muted)]  block">START DATE</span>
                  <p className="text-[var(--crm-text)] ">
                    {startDate ? new Date(startDate).toLocaleDateString() : 'Unconfigured'}
                  </p>
                </div>
                <div className="p-3 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl space-y-1">
                  <span className="text-[9px] text-[var(--crm-text-muted)]  block">EXPECTED DELIVERY</span>
                  <p className="text-[var(--crm-text)] ">
                    {expectedDate ? new Date(expectedDate).toLocaleDateString() : 'Unconfigured'}
                  </p>
                </div>
                <div className="p-3 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl space-y-1">
                  <span className="text-[9px] text-[var(--crm-text-muted)]  block">DELIVERY DATE</span>
                  <p className="text-[var(--crm-text)] ">
                    {deliveryDate ? new Date(deliveryDate).toLocaleDateString() : 'Pending final hand-off'}
                  </p>
                </div>
                <div className="p-3 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl space-y-1">
                  <span className="text-[9px] text-[var(--crm-text-muted)]  block">ASSIGNED TEAM MEMBER</span>
                  <p className="text-[var(--crm-text)] ">{tracking?.assigned_member_name || 'Unassigned lead'}</p>
                </div>
                <div className="p-3 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl space-y-1">
                  <span className="text-[9px] text-[var(--crm-text-muted)]  block">REVISION COUNT</span>
                  <p className="text-[var(--crm-text)] ">{revisions.length} requests processed</p>
                </div>
                <div className="p-3 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl space-y-1">
                  <span className="text-[9px] text-[var(--crm-text-muted)]  block">LAST DATABASE UPDATE</span>
                  <p className="text-blue-600  font-mono text-[11px]">
                    {tracking?.last_updated ? new Date(tracking.last_updated).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* 4. Asset Delivery Details */}
            <div className="bg-slate-950/70 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-5">
              <div className="flex justify-between items-start border-b border-slate-700 pb-3">
                <div>
                  <span className="text-[10px] font-semibold text-indigo-400   block">Handover Hub</span>
                  <h4 className="text-sm font-medium text-white">File Delivery & Notes</h4>
                </div>
                <span className={`px-2.5 py-1 text-[9px] font-semibold rounded-full   ${
                  deliveryStatus === 'Delivered' 
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {deliveryStatus}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                <div className="md:col-span-8 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-xs font-medium text-slate-400">
                    <div>
                      <span className="text-slate-500  text-[9px] block">OFFICIAL DISPATCH DATE</span>
                      <p className="text-slate-200 mt-1">
                        {deliveryDate ? new Date(deliveryDate).toLocaleString() : 'Not dispatched yet'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500  text-[9px] block">DELIVERED BY EXECUTIVE</span>
                      <p className="text-slate-200 mt-1">{deliveredBy || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xs">
                    <span className="text-slate-500  text-[9px] block font-medium">DELIVERY INSTRUCTIONS & SPECIFICATIONS</span>
                    <p className="text-xs text-slate-400 leading-relaxed mt-1.5 italic">
                      "{deliveryNotes || 'No delivery specifications or access keys logged yet.'}"
                    </p>
                  </div>
                </div>

                <div className="md:col-span-4 flex flex-col justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl text-center shadow-xs">
                  <div className="py-2 space-y-1">
                    <FileText className="mx-auto text-indigo-400 mb-1 animate-pulse" size={24} />
                    <span className="text-[9px] font-medium text-slate-500   block">Production Assets Link</span>
                    <p className="text-[10px] text-slate-400 truncate max-w-[150px] 2xl:max-w-[250px] 3xl:max-w-[400px] 4k:max-w-none mx-auto font-mono">
                      {finalFiles || 'Pending secure upload'}
                    </p>
                  </div>

                  {finalFiles ? (
                    <a 
                      href={finalFiles} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Download size={13} />
                      Download Assets
                    </a>
                  ) : (
                    <button 
                      disabled
                      className="w-full py-2 bg-slate-800 text-slate-500  text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-not-allowed border border-slate-700"
                    >
                      <Lock size={12} />
                      Download Locked
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 5. Revision Ledger Section */}
            <div className="bg-[var(--crm-card)] rounded-2xl border border-[var(--crm-card-border)] p-6 shadow-xs space-y-5">
              <div className="flex justify-between items-center border-b border-[var(--crm-card-border)] pb-3">
                <div>
                  <span className="text-[10px] font-semibold text-indigo-600   block">Iterations Ledger</span>
                  <h4 className="text-sm font-medium text-[var(--crm-text)]">Revisions & Requests Registry</h4>
                </div>
                <div className="flex items-center gap-2.5 text-[9px] font-medium text-[var(--crm-text-secondary)] ">
                  <span className="bg-[var(--crm-sidebar)] px-2.5 py-1 rounded-md border border-[var(--crm-card-border)]">Allowed: {revisionsAllowed}</span>
                  <span className="bg-[var(--crm-sidebar)] px-2.5 py-1 rounded-md border border-[var(--crm-card-border)]">Used: {revisions.length}</span>
                  <span className="bg-indigo-500/10 text-indigo-700 px-2.5 py-1 rounded-md border border-indigo-500/20">
                    Remaining: {Math.max(0, revisionsAllowed - revisions.length)}
                  </span>
                </div>
              </div>

              {revisions.length === 0 ? (
                <div className="bg-[var(--crm-sidebar)] rounded-xl p-8 border border-dashed border-[var(--crm-card-border)] text-center">
                  <p className="text-xs  text-[var(--crm-subtitle)]">No revisions requested yet.</p>
                  <p className="text-[10px] text-[var(--crm-text-muted)] mt-1">Iteration briefs will appear here once the work goes to client review.</p>
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[250px] overflow-y-auto pr-1">
                  {revisions.map((rev, index) => (
                    <div key={rev.id || index} className="p-3.5 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl text-xs flex justify-between items-start gap-4 animate-in fade-in duration-200 shadow-xs">
                      <div className="space-y-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="h-5 w-5 bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 rounded-full flex items-center justify-center text-[10px] font-semibold">
                            #{index + 1}
                          </span>
                          <p className=" text-[var(--crm-text)]">Revision requested</p>
                        </div>
                        <p className="text-[var(--crm-subtitle)] leading-relaxed pl-7 italic whitespace-pre-wrap">"{rev.notes}"</p>
                        <p className="text-[9px] text-[var(--crm-text-muted)]  pl-7 mt-1.5">Remaining Revisions: {Math.max(0, revisionsAllowed - (index + 1))}</p>
                      </div>
                      <div className="text-right shrink-0 space-y-1">
                        <span className={`px-2.5 py-0.5 text-[8px] font-semibold rounded-full  ${
                          rev.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20' :
                          rev.status === 'In Progress' ? 'bg-amber-500/10 text-amber-700 border border-amber-500/20' :
                          'bg-indigo-500/10 text-indigo-700 border border-indigo-500/20'
                        }`}>
                          {rev.status}
                        </span>
                        <p className="text-[9px] text-[var(--crm-text-muted)]  block pt-1">{new Date(rev.revision_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right sidebar column */}
          <div className="lg:col-span-4 p-6 lg:p-8 space-y-6 bg-[var(--crm-sidebar)] lg:border-l border-[var(--crm-card-border)]">
            
            {/* 1. Client View Panel (Review controls locked/unlocked) */}
            {isClientMode ? (
              <div className="space-y-6">
                
                {/* Client Review Section with conditional rendering */}
                {isReviewAllowed || review ? (
                  <div className="bg-[var(--crm-card)] rounded-2xl border border-[var(--crm-card-border)] p-5 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 border-b border-[var(--crm-card-border)] pb-3">
                      <div className="p-2 bg-indigo-500/10 text-indigo-600 rounded-xl border border-indigo-500/20">
                        <Award size={18} />
                      </div>
                      <span className="text-[11px] font-semibold  text-[var(--crm-text)] ">Client Service Evaluation</span>
                    </div>

                    {review ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-1.5 text-emerald-700 font-medium text-xs  ">
                          <CheckCircle2 size={14} />
                          Review Registered
                        </div>
                        <div className="space-y-1.5">
                          {renderStars(review.rating)}
                          <p className="text-xs text-[var(--crm-subtitle)] italic leading-relaxed whitespace-pre-wrap">"{review.message}"</p>
                          <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700  mt-1">
                            <ThumbsUp size={12} />
                            Highly Recommended: {review.recommend}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-[var(--crm-subtitle)] leading-relaxed">
                          Your project is ready and delivered! Please share your feedback with our team to close out the task.
                        </p>
                        <button
                          onClick={() => setShowReviewPopup(true)}
                          className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <Sparkles size={14} />
                          Submit Evaluation Review
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  // Strictly hidden if review is not allowed
                  null
                )}

                {/* Client Live Simulation Info Card */}
                <div className="bg-[var(--crm-card)] text-[var(--crm-text-secondary)] rounded-2xl p-5 border border-[var(--crm-card-border)] shadow-xs space-y-3">
                  <h4 className="text-xs font-medium  text-indigo-600 ">Simulated Client Space</h4>
                  <p className="text-[11px] leading-relaxed text-[var(--crm-subtitle)]">
                    You are now viewing the secure workspace exactly as the client sees it. Progress modifications, status dropdowns, and configurations are hidden.
                  </p>
                  <p className="text-[11px] leading-relaxed text-[var(--crm-subtitle)]">
                    To leave a review or register iterations:
                  </p>
                  <ul className="text-[10px] space-y-1 list-disc pl-4 font-medium text-[var(--crm-text-secondary)]">
                    <li>Switch back to Admin Controls</li>
                    <li>Update progress slider to 100%</li>
                    <li>Mark delivery status as Delivered</li>
                    <li>Click save tracking profile</li>
                    <li>Come back here to write a review!</li>
                  </ul>
                </div>

              </div>
            ) : (
              // 2. Admin Editing session
              <div className="space-y-6">
                
                {/* Admin controls form */}
                <form onSubmit={handleSaveTracking} className="bg-[var(--crm-card)] rounded-2xl border border-[var(--crm-card-border)] p-5 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-[var(--crm-card-border)] pb-3">
                    <Sliders size={15} className="text-indigo-600" />
                    <span className="text-[11px] font-semibold  text-[var(--crm-text)] ">Admin Control Center</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-medium text-[var(--crm-text-muted)]  block">Workspace Project Name</label>
                    <input 
                      type="text" 
                      required 
                      value={projectName} 
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="e.g. Corporate Web Redesign"
                      className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-lg px-3 py-2 text-xs font-medium text-[var(--crm-text)] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-medium text-[var(--crm-text-muted)]  block">Project ID</label>
                      <input 
                        type="text" 
                        required 
                        value={projectId} 
                        onChange={(e) => setProjectId(e.target.value)}
                        placeholder="PRJ-101"
                        className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-lg px-3 py-2 text-xs font-medium font-mono text-[var(--crm-text)] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-medium text-[var(--crm-text-muted)]  block">Est. Time Left</label>
                      <input 
                        type="text" 
                        value={estimatedTimeLeft} 
                        onChange={(e) => setEstimatedTimeLeft(e.target.value)}
                        placeholder="e.g. 10 days"
                        className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-lg px-3 py-2 text-xs font-medium text-[var(--crm-text)] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-medium text-[var(--crm-text-muted)]  block">Start Date</label>
                      <input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-lg px-2.5 py-1.5 text-xs font-medium text-[var(--crm-text)] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-medium text-[var(--crm-text-muted)]  block">Expected Delivery</label>
                      <input 
                        type="date" 
                        value={expectedDate} 
                        onChange={(e) => setExpectedDate(e.target.value)}
                        className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-lg px-2.5 py-1.5 text-xs font-medium text-[var(--crm-text)] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 bg-[var(--crm-sidebar)] p-3 rounded-xl border border-[var(--crm-card-border)]">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-medium text-[var(--crm-text-secondary)] ">Project Progress</label>
                      <span className="text-xs font-medium text-indigo-600">{progress}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="100" value={progress}
                      onChange={(e) => setProgress(Number(e.target.value))}
                      className="w-full accent-indigo-600 h-1 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-[var(--crm-text-muted)] pt-1 ">
                      <span>0% Pending</span>
                      <span>100% Ready</span>
                    </div>
                  </div>

                  {/* Dynamic display of status derived automatically in the admin UI as well */}
                  <div className="p-3 bg-[var(--crm-sidebar)] rounded-lg border border-[var(--crm-card-border)] flex justify-between items-center text-xs text-[var(--crm-text-secondary)]">
                    <span className="font-medium">Computed Status:</span>
                    <span className="text-indigo-600 font-semibold  ">{status}</span>
                  </div>

                  <div className="space-y-3.5 border-t border-[var(--crm-card-border)] pt-3">
                    <h5 className="text-[10px] font-semibold  text-indigo-600 ">Delivery Dispatch Panel</h5>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-medium text-[var(--crm-text-muted)]  block">Delivery Status</label>
                        <select
                          value={deliveryStatus}
                          onChange={(e) => setDeliveryStatus(e.target.value)}
                          className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-lg px-2 py-1.5 text-xs font-medium text-[var(--crm-text)] cursor-pointer focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="Not Delivered">Not Delivered</option>
                          <option value="Ready">Ready</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-medium text-[var(--crm-text-muted)]  block">Delivered By</label>
                        <input 
                          type="text" 
                          value={deliveredBy} 
                          onChange={(e) => setDeliveredBy(e.target.value)}
                          placeholder="Team Lead Name"
                          className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-lg px-2 py-1.5 text-xs font-medium text-[var(--crm-text)] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-medium text-[var(--crm-text-muted)]  block">Revisions Allowed</label>
                        <input 
                          type="number" 
                          value={revisionsAllowed} 
                          onChange={(e) => setRevisionsAllowed(Number(e.target.value))}
                          placeholder="3"
                          className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-lg px-2.5 py-1.5 text-xs font-medium text-[var(--crm-text)] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-medium text-[var(--crm-text-muted)]  block">Delivery Date</label>
                        <input 
                          type="date" 
                          value={deliveryDate} 
                          onChange={(e) => setDeliveryDate(e.target.value)}
                          className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-lg px-2 py-1 text-xs font-medium text-[var(--crm-text)] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-medium text-[var(--crm-text-muted)]  block">Final Files URL</label>
                      <input 
                        type="text" 
                        value={finalFiles} 
                        onChange={(e) => setFinalFiles(e.target.value)}
                        placeholder="https://drive.google.com/..."
                        className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-lg px-3 py-2 text-xs font-medium font-mono text-[var(--crm-text)] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-medium text-[var(--crm-text-muted)]  block">Delivery notes & access specs</label>
                      <textarea 
                        rows={2}
                        value={deliveryNotes} 
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                        placeholder="Zip files access passwords or specs..."
                        className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-lg px-3 py-2 text-xs font-medium text-[var(--crm-text)] focus:outline-none leading-relaxed focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      {saving ? 'Saving changes...' : 'Save Tracking Profile'}
                    </button>
                  </div>
                </form>

                {/* Log client revision/iteration form */}
                <div className="bg-[var(--crm-card)] rounded-2xl border border-[var(--crm-card-border)] p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-indigo-600" />
                      <span className="text-[11px] font-semibold  text-[var(--crm-text)] ">Log client iteration</span>
                    </div>
                    <button
                      onClick={() => setShowAddRevision(!showAddRevision)}
                      className="text-[10px] font-medium text-indigo-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      {showAddRevision ? 'Hide' : 'Log Request'}
                    </button>
                  </div>

                  {showAddRevision && (
                    <form onSubmit={handleAddRevisionSubmit} className="space-y-3.5 bg-[var(--crm-sidebar)] p-3.5 rounded-xl border border-[var(--crm-card-border)] animate-in slide-in-from-top-2 duration-200 shadow-xs">
                      <div className="space-y-1.5 text-left">
                        <label className="text-[9px] font-medium text-[var(--crm-text-muted)]  block">Revision Status</label>
                        <select
                          value={newRevisionStatus}
                          onChange={(e) => setNewRevisionStatus(e.target.value)}
                          className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-lg px-2 py-1 text-xs font-medium text-[var(--crm-text)] focus:outline-none cursor-pointer focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label className="text-[9px] font-medium text-[var(--crm-text-muted)]  block">Revision Notes & Feedback</label>
                        <textarea
                          rows={3}
                          required
                          value={newRevisionNotes}
                          onChange={(e) => setNewRevisionNotes(e.target.value)}
                          placeholder="e.g., Update the corporate brand colors to midnight blue and increase padding..."
                          className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-lg px-3 py-2 text-xs font-medium text-[var(--crm-text)] focus:outline-none leading-relaxed focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-[11px] rounded-lg cursor-pointer"
                      >
                        {saving ? 'Logging request...' : 'Log Revision Request'}
                      </button>
                    </form>
                  )}
                </div>

              </div>
            )}

          </div>

        </div>
      )}

      {/* Review Submission Popup Panel */}
      <AnimatePresence>
        {showReviewPopup && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--crm-card)] text-[var(--crm-text)] rounded-2xl shadow-2xl max-w-sm w-full border border-[var(--crm-card-border)] overflow-hidden"
            >
              <div className="p-5 border-b border-[var(--crm-card-border)] bg-[var(--crm-sidebar)] flex justify-between items-center">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Star className="text-amber-400 fill-amber-400" size={18} />
                  <h4 className="text-sm font-medium  tracking-tight text-[var(--crm-text)]">Evaluate Our Service</h4>
                </div>
                <button 
                  onClick={() => setShowReviewPopup(false)}
                  className="text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmitReview} className="p-5 space-y-4">
                
                <div className="space-y-1.5 text-center">
                  <span className="text-[10px] font-medium text-[var(--crm-text-muted)]   block">Star Rating Selection</span>
                  <div className="flex items-center justify-center gap-2 py-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="hover:scale-110 transition-transform cursor-pointer p-0.5"
                      >
                        <Star 
                          size={28} 
                          className={`${
                            star <= (hoverRating !== null ? hoverRating : reviewRating) 
                              ? 'text-amber-400 fill-amber-400' 
                              : 'text-slate-200'
                          }`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium text-[var(--crm-text-muted)]  block">Review message & testimonials</label>
                  <textarea
                    rows={4}
                    required
                    value={reviewMessage}
                    onChange={(e) => setReviewMessage(e.target.value)}
                    placeholder="Tell us what you think of the design quality and project files..."
                    className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 text-xs font-medium text-[var(--crm-text)] focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5 bg-[var(--crm-sidebar)] p-3 rounded-xl border border-[var(--crm-card-border)] flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--crm-text-secondary)]">Recommend our SMM services?</span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--crm-text-secondary)] cursor-pointer">
                      <input 
                        type="radio" 
                        name="recommend" 
                        value="Yes" 
                        checked={recommend === 'Yes'} 
                        onChange={() => setRecommend('Yes')}
                        className="accent-indigo-600"
                      />
                      Yes
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--crm-text-secondary)] cursor-pointer">
                      <input 
                        type="radio" 
                        name="recommend" 
                        value="No" 
                        checked={recommend === 'No'} 
                        onChange={() => setRecommend('No')}
                        className="accent-indigo-600"
                      />
                      No
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-medium text-xs rounded-xl shadow-md cursor-pointer transition-all"
                >
                  {saving ? 'Submitting evaluation...' : 'Submit Review'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
