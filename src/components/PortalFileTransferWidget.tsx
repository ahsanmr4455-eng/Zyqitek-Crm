import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UploadCloud, 
  DownloadCloud, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RotateCw, 
  FileText, 
  ChevronDown, 
  ChevronUp,
  Clock,
  Sparkles
} from 'lucide-react';
import { formatBytes } from '../lib/fileStorage';

export interface FileTransferItem {
  id: string;
  type: 'upload' | 'download';
  file?: File;
  fileUrl?: string;
  fileName: string;
  totalBytes: number;
  loadedBytes: number;
  progress: number; // 0 - 100
  status: 'waiting' | 'transferring' | 'completed' | 'failed' | 'cancelled';
  errorMessage?: string;
  abortController?: AbortController;
  onRetry?: () => void;
  createdAt: number;
}

interface PortalFileTransferWidgetProps {
  transfers: FileTransferItem[];
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  onDismiss: (id: string) => void;
  onClearCompleted?: () => void;
}

export default function PortalFileTransferWidget({
  transfers,
  onCancel,
  onRetry,
  onDismiss,
  onClearCompleted
}: PortalFileTransferWidgetProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  if (transfers.length === 0) {
    return null;
  }

  const activeTransfers = transfers.filter(t => t.status === 'transferring' || t.status === 'waiting');
  const completedTransfers = transfers.filter(t => t.status === 'completed');
  const failedTransfers = transfers.filter(t => t.status === 'failed' || t.status === 'cancelled');

  const primaryTransfer = activeTransfers[0] || transfers[0];

  return (
    <div className="fixed bottom-5 right-5 z-50 w-full max-w-sm sm:max-w-md pointer-events-auto select-none shadow-2xl">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)]/90 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {activeTransfers.length > 0 ? (
              <div className="relative flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-emerald-400 animate-ping absolute" />
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 relative" />
              </div>
            ) : (
              <CheckCircle2 size={16} className="text-emerald-400" />
            )}
            <span className="text-xs font-medium ">
              {activeTransfers.length > 0
                ? `${activeTransfers[0].type === 'upload' ? 'Uploading' : 'Downloading'} ${activeTransfers.length} file${activeTransfers.length > 1 ? 's' : ''}...`
                : failedTransfers.length > 0 && completedTransfers.length === 0
                ? 'File Transfer Issue'
                : 'Transfers Completed'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {completedTransfers.length > 0 && onClearCompleted && (
              <button
                onClick={onClearCompleted}
                className="text-[10px] text-slate-300 hover:text-white px-2 py-0.5 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 text-slate-300 hover:text-white rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
              title={isCollapsed ? 'Expand' : 'Collapse'}
            >
              {isCollapsed ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>
        </div>

        {/* Primary Circular Progress Meter (when active and not collapsed) */}
        {!isCollapsed && (
          <div className="divide-y divide-slate-100 dark:divide-[#30353D] max-h-[380px] overflow-y-auto">
            {transfers.map((item) => {
              const radius = 24;
              const circumference = 2 * Math.PI * radius;
              const strokeDashoffset = circumference - (item.progress / 100) * circumference;
              
              const isUpload = item.type === 'upload';
              const isFinished = item.status === 'completed';
              const isFailed = item.status === 'failed' || item.status === 'cancelled';
              const isTransferring = item.status === 'transferring';
              const isWaiting = item.status === 'waiting';

              const loadedStr = formatBytes(item.loadedBytes);
              const totalStr = formatBytes(item.totalBytes);

              return (
                <div key={item.id} className="p-4 flex items-center gap-3.5 hover:bg-[var(--crm-sidebar)]/6 hover:bg-[var(--crm-sidebar-active-bg)]/60 /60 transition-colors">
                  {/* Real Circular Progress Meter */}
                  <div className="relative shrink-0 flex items-center justify-center h-14 w-14">
                    {isFinished ? (
                      <div className="h-12 w-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-200">
                        <CheckCircle2 size={24} className="animate-in zoom-in" />
                      </div>
                    ) : isFailed ? (
                      <div className="h-12 w-12 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 flex items-center justify-center border border-rose-200">
                        <AlertCircle size={22} />
                      </div>
                    ) : isWaiting ? (
                      <div className="h-12 w-12 rounded-full bg-[var(--crm-sidebar)] text-[var(--crm-text-muted)] flex items-center justify-center border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)]">
                        <Clock size={20} />
                      </div>
                    ) : (
                      <div className="relative flex items-center justify-center">
                        <svg className="w-14 h-14 -rotate-90 transform" viewBox="0 0 56 56">
                          {/* Background Circle */}
                          <circle
                            cx="28"
                            cy="28"
                            r={radius}
                            className="stroke-slate-200"
                            strokeWidth="3.5"
                            fill="transparent"
                          />
                          {/* Animated Progress Circle */}
                          <circle
                            cx="28"
                            cy="28"
                            r={radius}
                            className={`${isUpload ? 'stroke-emerald-600' : 'stroke-indigo-600'} transition-all duration-200 ease-out`}
                            strokeWidth="3.5"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            fill="transparent"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[11px] font-semibold text-[var(--crm-text)] text-[var(--crm-text)] font-mono tracking-tighter">
                            {Math.round(item.progress)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Transfer Details & Stats */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4 
                        className="text-xs font-medium text-[var(--crm-text)] truncate block max-w-[180px] 2xl:max-w-[300px] 3xl:max-w-[500px] 4k:max-w-none sm:max-w-[220px]"
                        title={item.fileName}
                      >
                        {item.fileName}
                      </h4>
                      <span className="text-[10px] font-medium text-[var(--crm-text-muted)] shrink-0">
                        {isFinished 
                          ? (isUpload ? 'Uploaded' : 'Downloaded') 
                          : isFailed 
                          ? 'Failed' 
                          : isWaiting 
                          ? 'Waiting' 
                          : isUpload 
                          ? 'Uploading...' 
                          : 'Downloading...'}
                      </span>
                    </div>

                    {/* Progress Info & MB calculation */}
                    <div className="text-[11px] font-medium text-[var(--crm-text-secondary)] flex items-center justify-between">
                      <span>
                        {isFinished ? (
                          <span className="font-semibold text-emerald-700">{totalStr}</span>
                        ) : isFailed ? (
                          <span className="text-rose-600 font-semibold text-[10px] line-clamp-1" title={item.errorMessage}>
                            {item.errorMessage || 'Transfer failed'}
                          </span>
                        ) : isWaiting ? (
                          <span className="text-[var(--crm-text-muted)] ">Queued in line ({totalStr})</span>
                        ) : (
                          <span className="text-[var(--crm-text)] font-mono ">
                            {loadedStr} / {totalStr}
                          </span>
                        )}
                      </span>

                      {isTransferring && (
                        <span className="font-mono text-[10px] font-medium text-[var(--crm-text-secondary)] ">
                          {item.progress}% {isUpload ? 'uploaded' : 'downloaded'}
                        </span>
                      )}
                    </div>

                    {/* Compact Linear Track for secondary visual assurance */}
                    {isTransferring && (
                      <div className="w-full bg-[var(--crm-sidebar)] h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-200 ${isUpload ? 'bg-emerald-600' : 'bg-indigo-600'}`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Actions (Cancel / Retry / Dismiss) */}
                  <div className="shrink-0 flex items-center gap-1 pl-1">
                    {isTransferring && (
                      <button
                        onClick={() => onCancel(item.id)}
                        className="px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:bg-rose-500/10 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                        title="Cancel Transfer"
                      >
                        Cancel
                      </button>
                    )}

                    {isFailed && (
                      <button
                        onClick={() => onRetry(item.id)}
                        className="px-2.5 py-1 text-xs font-medium text-[var(--crm-text)] hover:bg-[var(--crm-sidebar-active-bg)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        title="Retry Transfer"
                      >
                        <RotateCw size={11} />
                        <span>Retry</span>
                      </button>
                    )}

                    {(isFinished || isFailed) && (
                      <button
                        onClick={() => onDismiss(item.id)}
                        className="p-1 text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] rounded-md hover:bg-[var(--crm-sidebar-active-bg)] transition-colors cursor-pointer"
                        title="Dismiss"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Collapsed mini view */}
        {isCollapsed && activeTransfers.length > 0 && (
          <div className="p-3 bg-[var(--crm-sidebar)] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <span className="font-medium text-[var(--crm-text)] truncate">{activeTransfers[0].fileName}</span>
              <span className="font-mono text-emerald-700 font-medium">{activeTransfers[0].progress}%</span>
            </div>
            <button
              onClick={() => onCancel(activeTransfers[0].id)}
              className="text-[11px] text-rose-600 font-medium hover:underline cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
