import React, { useState } from 'react';
import { CandidateAssessment } from '../types';
import { Search, Play, Edit2, Trash2, CheckCircle2, Users, Clock, AlertCircle, FileText, UserCheck, XCircle, Eye } from 'lucide-react';

interface Props {
  candidates: CandidateAssessment[];
  onStartTest: (c: CandidateAssessment) => void;
  onReview: (c: CandidateAssessment) => void;
  onEdit: (c: CandidateAssessment) => void;
  onDelete: (id: string) => void;
}

export default function PreHiringTestingList({ candidates, onStartTest, onReview, onEdit, onDelete }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [deleteCandidateTarget, setDeleteCandidateTarget] = useState<CandidateAssessment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const filtered = candidates.filter(c => {
    const matchesSearch = 
      c.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.appliedService.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === 'All') return matchesSearch;
    if (statusFilter === 'Applied') return matchesSearch && (c.testStatus === 'Not Started' || c.testStatus === 'Under Review');
    if (statusFilter === 'Interview') return matchesSearch && c.testStatus === 'In Progress';
    if (statusFilter === 'Selected') return matchesSearch && (c.testStatus === 'Passed' || c.hiringDecision === 'Hire' || c.convertedToTeamMember);
    if (statusFilter === 'Rejected') return matchesSearch && (c.testStatus === 'Failed' || c.hiringDecision === 'Reject');

    return matchesSearch;
  });

  const totalCount = candidates.length;
  const newCount = candidates.filter(c => c.testStatus === 'Not Started' || c.testStatus === 'Under Review').length;
  const interviewCount = candidates.filter(c => c.testStatus === 'In Progress' || c.hiringDecision === 'Needs Further Interview').length;
  const selectedCount = candidates.filter(c => c.testStatus === 'Passed' || c.hiringDecision === 'Hire' || c.convertedToTeamMember).length;
  const rejectedCount = candidates.filter(c => c.testStatus === 'Failed' || c.hiringDecision === 'Reject').length;

  const confirmDelete = async () => {
    if (!deleteCandidateTarget) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteCandidateTarget.id);
      setDeleteCandidateTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Delete Confirmation Modal */}
      {deleteCandidateTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--crm-card)] border border-[var(--crm-card-border)] p-6 rounded-2xl max-w-md w-full space-y-4 shadow-xl text-[var(--crm-text)]">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 bg-rose-500/10 rounded-xl">
                <Trash2 size={20} />
              </div>
              <h3 className="text-base font-bold text-[var(--crm-heading)]">Delete Candidate Application?</h3>
            </div>
            
            <p className="text-xs text-[var(--crm-subtitle)] leading-relaxed">
              Are you sure you want to permanently delete the application for <strong className="text-[var(--crm-heading)]">{deleteCandidateTarget.candidateName}</strong> ({deleteCandidateTarget.appliedService})? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteCandidateTarget(null)}
                className="px-4 py-2 bg-[var(--crm-sidebar)] hover:bg-[var(--crm-card-border)] text-[var(--crm-heading)] rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-[var(--crm-card-border)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} /> Permanently Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-[var(--crm-card)] p-3.5 rounded-xl border border-[var(--crm-card-border)] shadow-2xs">
          <p className="text-[10px] font-bold text-[var(--crm-text-muted)] uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Total Applicants</span>
            <Users size={14} className="text-indigo-400" />
          </p>
          <p className="text-xl font-bold text-[var(--crm-heading)]">{totalCount}</p>
        </div>

        <div className="bg-[var(--crm-card)] p-3.5 rounded-xl border border-[var(--crm-card-border)] shadow-2xs">
          <p className="text-[10px] font-bold text-[var(--crm-text-muted)] uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Under Review</span>
            <Clock size={14} className="text-amber-400" />
          </p>
          <p className="text-xl font-bold text-amber-400">{newCount}</p>
        </div>

        <div className="bg-[var(--crm-card)] p-3.5 rounded-xl border border-[var(--crm-card-border)] shadow-2xs">
          <p className="text-[10px] font-bold text-[var(--crm-text-muted)] uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Interview Stage</span>
            <FileText size={14} className="text-purple-400" />
          </p>
          <p className="text-xl font-bold text-purple-400">{interviewCount}</p>
        </div>

        <div className="bg-[var(--crm-card)] p-3.5 rounded-xl border border-[var(--crm-card-border)] shadow-2xs">
          <p className="text-[10px] font-bold text-[var(--crm-text-muted)] uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Selected / Hired</span>
            <UserCheck size={14} className="text-emerald-400" />
          </p>
          <p className="text-xl font-bold text-emerald-400">{selectedCount}</p>
        </div>

        <div className="bg-[var(--crm-card)] p-3.5 rounded-xl border border-[var(--crm-card-border)] shadow-2xs">
          <p className="text-[10px] font-bold text-[var(--crm-text-muted)] uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Rejected</span>
            <XCircle size={14} className="text-rose-400" />
          </p>
          <p className="text-xl font-bold text-rose-400">{rejectedCount}</p>
        </div>
      </div>

      {/* Candidate List Table */}
      <div className="bg-[var(--crm-card)] rounded-2xl shadow-xs border border-[var(--crm-card-border)] overflow-hidden">
        <div className="p-4 border-b border-[var(--crm-card-border)] flex flex-col sm:flex-row items-center justify-between gap-3 bg-[var(--crm-card)]">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--crm-subtitle)]" size={14} />
            <input 
              type="text"
              placeholder="Search candidate ID, name, email, service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="All">All Applicant Statuses</option>
              <option value="Applied">Applied / Under Review</option>
              <option value="Interview">Interview Stage</option>
              <option value="Selected">Selected / Hired</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto bg-[var(--crm-card)]">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[var(--crm-sidebar)] border-b border-[var(--crm-card-border)] text-[var(--crm-subtitle)] font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Candidate ID</th>
                <th className="px-4 py-3">Candidate Name</th>
                <th className="px-4 py-3">Applied Service</th>
                <th className="px-4 py-3">Experience</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Applied Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--crm-card-border)]/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[var(--crm-subtitle)] bg-[var(--crm-card)]">
                    No candidate recruitment applications found.
                  </td>
                </tr>
              ) : (
                filtered.map(c => {
                  const formattedDate = c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A';

                  return (
                    <tr key={c.id} className="hover:bg-[var(--crm-sidebar)]/50 bg-[var(--crm-card)] transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-indigo-400">
                        {c.id.substring(0, 10)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-[var(--crm-heading)]">{c.candidateName}</p>
                        <p className="text-[11px] text-[var(--crm-subtitle)]">{c.email}</p>
                      </td>
                      <td className="px-4 py-3 text-[var(--crm-heading)] font-medium">
                        {c.appliedService}
                      </td>
                      <td className="px-4 py-3 text-[var(--crm-heading)] font-medium">
                        {c.yearsOfExperience || '1–2 years'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${
                          c.convertedToTeamMember || c.hiringDecision === 'Hire' || c.testStatus === 'Passed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          c.hiringDecision === 'Reject' || c.testStatus === 'Failed' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          c.testStatus === 'In Progress' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {c.convertedToTeamMember ? 'Converted Member' : (c.hiringDecision || c.testStatus || 'Applied')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--crm-subtitle)] font-mono text-[11px]">
                        {formattedDate}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => onReview(c)}
                            title="Review Application Profile"
                            className="p-1.5 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye size={15} />
                          </button>
                          <button 
                            onClick={() => onStartTest(c)}
                            title="Assign Technical Assessment (Optional)"
                            className="p-1.5 text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors cursor-pointer"
                          >
                            <Play size={15} />
                          </button>
                          <button 
                            onClick={() => onEdit(c)}
                            title="Edit Candidate Application"
                            className="p-1.5 text-[var(--crm-subtitle)] hover:text-[var(--crm-heading)] hover:bg-[var(--crm-sidebar)] rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button 
                            onClick={() => setDeleteCandidateTarget(c)}
                            title="Delete Application Record"
                            className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
