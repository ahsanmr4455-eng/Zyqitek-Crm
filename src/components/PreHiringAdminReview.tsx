import React, { useState } from 'react';
import { CandidateAssessment, HiringDecision, TestStatus } from '../types';
import { SERVICE_SCREENING_QUESTIONS } from '../data/screeningQuestions';
import { 
  Briefcase, CheckCircle2, Save, ExternalLink, ArrowLeft, FileText, 
  User, Mail, Phone, Globe, Building2, Clock, DollarSign, HelpCircle, 
  ShieldCheck, Play, Sparkles
} from 'lucide-react';

interface Props {
  candidate: CandidateAssessment;
  onSave: (c: CandidateAssessment) => void;
  onClose: () => void;
  onStartTest?: (c: CandidateAssessment) => void;
  onConvertToTeamMember?: (c: CandidateAssessment) => void;
}

export default function PreHiringAdminReview({ candidate, onSave, onClose, onStartTest, onConvertToTeamMember }: Props) {
  const [testStatus, setTestStatus] = useState<TestStatus>(candidate.testStatus || 'Under Review');
  const [hiringDecision, setHiringDecision] = useState<HiringDecision>(candidate.hiringDecision || 'Keep in Review');
  const [reviewerStatus, setReviewerStatus] = useState(candidate.reviewerStatus || 'Reviewed');
  const [adminNotes, setAdminNotes] = useState(candidate.adminNotes || '');

  // Screening Questions definition for candidate's service
  const screeningDefs = SERVICE_SCREENING_QUESTIONS[candidate.appliedService] 
    || SERVICE_SCREENING_QUESTIONS['Other'] || [];

  const handleSaveEvaluation = () => {
    const updatedCandidate: CandidateAssessment = {
      ...candidate,
      testStatus,
      hiringDecision,
      reviewerStatus,
      adminNotes,
      updatedAt: new Date().toISOString()
    };

    onSave(updatedCandidate);
    onClose();
  };

  const formattedDate = candidate.createdAt 
    ? new Date(candidate.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'N/A';

  return (
    <div className="bg-[var(--crm-card)] rounded-2xl shadow-xs border border-[var(--crm-card-border)] p-6 md:p-8 max-w-5xl mx-auto space-y-6 text-[var(--crm-text)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--crm-card-border)] pb-5">
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose} 
            className="p-2 text-[var(--crm-subtitle)] hover:text-[var(--crm-heading)] bg-[var(--crm-sidebar)] hover:bg-[var(--crm-card-border)] rounded-xl transition-colors cursor-pointer border border-[var(--crm-card-border)]"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                {candidate.appliedService}
              </span>
              <span className="text-[var(--crm-subtitle)]">•</span>
              <span className="text-xs font-medium text-[var(--crm-subtitle)]">
                Submitted {formattedDate}
              </span>
            </div>
            <h3 className="text-lg font-bold text-[var(--crm-heading)] mt-0.5">
              Candidate Application Profile: {candidate.candidateName}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onStartTest && (
            <button
              onClick={() => onStartTest(candidate)}
              className="px-3.5 py-2 bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Play size={14} /> Assign Technical Assessment
            </button>
          )}

          <button
            onClick={handleSaveEvaluation}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-2"
          >
            <Save size={15} /> Save Application Review
          </button>
        </div>
      </div>

      {/* Recruitment Status Pipeline Control */}
      <div className="bg-[var(--crm-sidebar)] p-5 rounded-2xl border border-[var(--crm-card-border)] space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--crm-card-border)] pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Recruitment Stage & Decision</span>
            <h4 className="text-sm font-bold text-[var(--crm-heading)]">Candidate Application Status</h4>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={testStatus}
              onChange={e => setTestStatus(e.target.value as TestStatus)}
              className="px-3.5 py-2 bg-[var(--crm-card)] border border-[var(--crm-card-border)] text-[var(--crm-heading)] rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="Not Started">Applied (New)</option>
              <option value="Under Review">Under Review</option>
              <option value="In Progress">Interview Stage</option>
              <option value="Completed">Practical Task Stage</option>
              <option value="Passed">Selected (Passed)</option>
              <option value="Failed">Rejected (Failed)</option>
            </select>

            <select
              value={hiringDecision}
              onChange={e => setHiringDecision(e.target.value as HiringDecision)}
              className="px-3.5 py-2 bg-[var(--crm-card)] border border-[var(--crm-card-border)] text-[var(--crm-heading)] rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="Keep in Review">Keep in Review</option>
              <option value="Needs Further Interview">Needs Further Interview</option>
              <option value="Hire">Hire Candidate</option>
              <option value="Reject">Reject Candidate</option>
            </select>
          </div>
        </div>

        {/* Basic Contact Info Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-1">
          <div>
            <span className="text-[10px] font-semibold text-[var(--crm-subtitle)] uppercase">Full Name</span>
            <p className="font-bold text-[var(--crm-heading)]">{candidate.candidateName} {candidate.age ? `(${candidate.age} yrs)` : ''}</p>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-[var(--crm-subtitle)] uppercase">Email</span>
            <p className="font-medium text-[var(--crm-heading)]">{candidate.email}</p>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-[var(--crm-subtitle)] uppercase">Phone / WhatsApp</span>
            <p className="font-medium text-[var(--crm-heading)]">{candidate.phone || candidate.whatsapp || 'N/A'}</p>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-[var(--crm-subtitle)] uppercase">Location</span>
            <p className="font-medium text-[var(--crm-heading)]">{candidate.cityCountry || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* GOOGLE FORMS STYLE RESPONSE VIEW */}
      
      {/* 1. Service Screening Questions & Responses */}
      <div className="bg-[var(--crm-card)] p-5 rounded-2xl border border-[var(--crm-card-border)] space-y-4">
        <h4 className="text-xs font-bold text-indigo-400 tracking-wider uppercase flex items-center gap-1.5 border-b border-[var(--crm-card-border)] pb-2">
          <HelpCircle size={14} /> Service Screening Responses ({candidate.appliedService})
        </h4>

        <div className="space-y-3">
          {screeningDefs.map((def, idx) => {
            const ans = candidate.screeningAnswers?.[def.id] || candidate.answers?.[def.id] || 'Not answered';

            return (
              <div key={def.id} className="bg-[var(--crm-sidebar)] p-4 rounded-xl border border-[var(--crm-card-border)] space-y-2">
                <span className="text-xs font-semibold text-[var(--crm-heading)] block leading-snug">
                  <span className="text-indigo-400 font-mono mr-2">{idx + 1}.</span>
                  {def.questionEnglish}
                </span>
                <div className="bg-[var(--crm-card)] p-3 rounded-lg border border-[var(--crm-card-border)] text-xs text-[var(--crm-text)] font-medium leading-relaxed whitespace-pre-wrap">
                  {ans}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Experience & Background */}
      <div className="bg-[var(--crm-card)] p-5 rounded-2xl border border-[var(--crm-card-border)] space-y-4">
        <h4 className="text-xs font-bold text-indigo-400 tracking-wider uppercase flex items-center gap-1.5 border-b border-[var(--crm-card-border)] pb-2">
          <Clock size={14} /> Experience & Technical Background
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-[var(--crm-sidebar)] p-3 rounded-xl border border-[var(--crm-card-border)]">
            <span className="text-[10px] font-semibold text-[var(--crm-subtitle)] uppercase">Years of Experience</span>
            <p className="font-bold text-[var(--crm-heading)] mt-0.5">{candidate.yearsOfExperience || 'N/A'}</p>
          </div>

          <div className="bg-[var(--crm-sidebar)] p-3 rounded-xl border border-[var(--crm-card-border)]">
            <span className="text-[10px] font-semibold text-[var(--crm-subtitle)] uppercase">Worked Professionally?</span>
            <p className="font-bold text-[var(--crm-heading)] mt-0.5">{candidate.hasWorkedProfessionally || 'N/A'}</p>
          </div>

          <div className="bg-[var(--crm-sidebar)] p-3 rounded-xl border border-[var(--crm-card-border)]">
            <span className="text-[10px] font-semibold text-[var(--crm-subtitle)] uppercase">International Clients?</span>
            <p className="font-bold text-[var(--crm-heading)] mt-0.5">{candidate.workedWithInternationalClients || 'N/A'}</p>
          </div>

          <div className="bg-[var(--crm-sidebar)] p-3 rounded-xl border border-[var(--crm-card-border)]">
            <span className="text-[10px] font-semibold text-[var(--crm-subtitle)] uppercase">Remote Experience?</span>
            <p className="font-bold text-[var(--crm-heading)] mt-0.5">{candidate.workedRemotely || 'N/A'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-[var(--crm-sidebar)] p-3.5 rounded-xl border border-[var(--crm-card-border)]">
            <span className="text-[10px] font-semibold text-[var(--crm-subtitle)] uppercase">Software & Tools Used</span>
            <p className="font-medium text-[var(--crm-heading)] mt-1">{candidate.regularTools || 'Not specified'}</p>
          </div>

          <div className="bg-[var(--crm-sidebar)] p-3.5 rounded-xl border border-[var(--crm-card-border)]">
            <span className="text-[10px] font-semibold text-[var(--crm-subtitle)] uppercase">Strongest Core Skill</span>
            <p className="font-medium text-[var(--crm-heading)] mt-1">{candidate.strongestSkill || 'Not specified'}</p>
          </div>
        </div>

        {candidate.experienceDetails && (
          <div className="bg-[var(--crm-sidebar)] p-3.5 rounded-xl border border-[var(--crm-card-border)] text-xs space-y-1">
            <span className="text-[10px] font-semibold text-[var(--crm-subtitle)] uppercase">Experience Summary</span>
            <p className="text-[var(--crm-heading)] leading-relaxed whitespace-pre-wrap">{candidate.experienceDetails}</p>
          </div>
        )}

        {/* Agency Experience Subcard */}
        <div className="bg-[var(--crm-sidebar)]/50 p-4 rounded-xl border border-[var(--crm-card-border)] space-y-2">
          <h5 className="text-xs font-bold text-[var(--crm-heading)] flex items-center gap-1.5">
            <Building2 size={14} className="text-indigo-400" /> Agency History:
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
              candidate.hasAgencyExperience === 'Yes' 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : 'bg-[var(--crm-card)] text-[var(--crm-subtitle)] border border-[var(--crm-card-border)]'
            }`}>
              {candidate.hasAgencyExperience === 'Yes' ? 'Has Agency Experience' : 'No Agency Experience'}
            </span>
          </h5>

          {candidate.hasAgencyExperience === 'Yes' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div>
                <span className="text-[10px] font-semibold text-[var(--crm-subtitle)] uppercase">Agency Name</span>
                <p className="font-semibold text-[var(--crm-heading)]">{candidate.agencyName || 'N/A'}</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-[var(--crm-subtitle)] uppercase">Duration</span>
                <p className="font-semibold text-[var(--crm-heading)]">{candidate.agencyDuration || 'N/A'}</p>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-[var(--crm-subtitle)] uppercase">Role / Responsibilities</span>
                <p className="font-semibold text-[var(--crm-heading)]">{candidate.agencyRole || 'N/A'}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Portfolio & Work Links */}
      <div className="bg-[var(--crm-card)] p-5 rounded-2xl border border-[var(--crm-card-border)] space-y-4">
        <h4 className="text-xs font-bold text-indigo-400 tracking-wider uppercase flex items-center gap-1.5 border-b border-[var(--crm-card-border)] pb-2">
          <Globe size={14} /> Portfolio & Resume Links
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {candidate.portfolioLink && (
            <div className="bg-[var(--crm-sidebar)] p-3 rounded-xl border border-[var(--crm-card-border)] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold text-[var(--crm-subtitle)] uppercase block">Primary Portfolio</span>
                <span className="text-xs font-semibold text-[var(--crm-heading)] truncate block max-w-xs">{candidate.portfolioLink}</span>
              </div>
              <a href={candidate.portfolioLink} target="_blank" rel="noreferrer" className="p-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-lg cursor-pointer">
                <ExternalLink size={14} />
              </a>
            </div>
          )}

          {candidate.googleDriveLink && (
            <div className="bg-[var(--crm-sidebar)] p-3 rounded-xl border border-[var(--crm-card-border)] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold text-[var(--crm-subtitle)] uppercase block">Google Drive Work Assets</span>
                <span className="text-xs font-semibold text-[var(--crm-heading)] truncate block max-w-xs">{candidate.googleDriveLink}</span>
              </div>
              <a href={candidate.googleDriveLink} target="_blank" rel="noreferrer" className="p-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-lg cursor-pointer">
                <ExternalLink size={14} />
              </a>
            </div>
          )}

          {candidate.githubWebsiteLink && (
            <div className="bg-[var(--crm-sidebar)] p-3 rounded-xl border border-[var(--crm-card-border)] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold text-[var(--crm-subtitle)] uppercase block">GitHub / Behance Showcase</span>
                <span className="text-xs font-semibold text-[var(--crm-heading)] truncate block max-w-xs">{candidate.githubWebsiteLink}</span>
              </div>
              <a href={candidate.githubWebsiteLink} target="_blank" rel="noreferrer" className="p-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-lg cursor-pointer">
                <ExternalLink size={14} />
              </a>
            </div>
          )}

          {candidate.cvResumeLink && (
            <div className="bg-[var(--crm-sidebar)] p-3 rounded-xl border border-[var(--crm-card-border)] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold text-[var(--crm-subtitle)] uppercase block">CV / Resume File</span>
                <span className="text-xs font-semibold text-[var(--crm-heading)] truncate block max-w-xs">{candidate.cvResumeLink}</span>
              </div>
              <a href={candidate.cvResumeLink} target="_blank" rel="noreferrer" className="p-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-lg cursor-pointer">
                <ExternalLink size={14} />
              </a>
            </div>
          )}
        </div>

        {candidate.additionalLinks && (
          <div className="bg-[var(--crm-sidebar)] p-3.5 rounded-xl border border-[var(--crm-card-border)] text-xs space-y-1">
            <span className="text-[10px] font-semibold text-[var(--crm-subtitle)] uppercase">Additional Links</span>
            <p className="text-[var(--crm-heading)] font-mono whitespace-pre-wrap">{candidate.additionalLinks}</p>
          </div>
        )}
      </div>

      {/* 4. Availability & Compensation */}
      <div className="bg-[var(--crm-card)] p-5 rounded-2xl border border-[var(--crm-card-border)] space-y-4">
        <h4 className="text-xs font-bold text-indigo-400 tracking-wider uppercase flex items-center gap-1.5 border-b border-[var(--crm-card-border)] pb-2">
          <DollarSign size={14} /> Availability & Compensation Expectations
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-[var(--crm-sidebar)] p-3 rounded-xl border border-[var(--crm-card-border)]">
            <span className="text-[10px] font-semibold text-[var(--crm-subtitle)] uppercase">Work Availability</span>
            <p className="font-bold text-[var(--crm-heading)] mt-0.5">{candidate.availability || 'Full-time'}</p>
          </div>

          <div className="bg-[var(--crm-sidebar)] p-3 rounded-xl border border-[var(--crm-card-border)]">
            <span className="text-[10px] font-semibold text-[var(--crm-subtitle)] uppercase">Start Timeline</span>
            <p className="font-bold text-[var(--crm-heading)] mt-0.5">{candidate.startTimeline || 'Immediately'}</p>
          </div>

          <div className="bg-[var(--crm-sidebar)] p-3 rounded-xl border border-[var(--crm-card-border)]">
            <span className="text-[10px] font-semibold text-[var(--crm-subtitle)] uppercase">Expected Rate / Salary</span>
            <p className="font-bold text-emerald-400 mt-0.5">{candidate.expectedRate || 'Not specified'}</p>
          </div>

          <div className="bg-[var(--crm-sidebar)] p-3 rounded-xl border border-[var(--crm-card-border)]">
            <span className="text-[10px] font-semibold text-[var(--crm-subtitle)] uppercase">Payment Preference</span>
            <p className="font-bold text-[var(--crm-heading)] mt-0.5">{candidate.paymentPreference || 'Monthly'}</p>
          </div>
        </div>

        {candidate.additionalInfo && (
          <div className="bg-[var(--crm-sidebar)] p-3.5 rounded-xl border border-[var(--crm-card-border)] text-xs space-y-1">
            <span className="text-[10px] font-semibold text-[var(--crm-subtitle)] uppercase">Additional Candidate Notes</span>
            <p className="text-[var(--crm-heading)] leading-relaxed whitespace-pre-wrap">{candidate.additionalInfo}</p>
          </div>
        )}
      </div>

      {/* 5. Admin Evaluation & Reviewer Notes */}
      <div className="bg-[var(--crm-card)] p-5 rounded-2xl border border-[var(--crm-card-border)] space-y-3">
        <h4 className="text-xs font-bold text-indigo-400 tracking-wider uppercase flex items-center gap-1.5">
          <FileText size={14} /> Admin Evaluation & Reviewer Notes
        </h4>

        <textarea
          rows={3}
          value={adminNotes}
          onChange={e => setAdminNotes(e.target.value)}
          placeholder="Enter internal admin feedback, screening notes, or interview recommendations..."
          className="w-full p-3 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[var(--crm-heading)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
        />
      </div>

      {/* Footer Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[var(--crm-card-border)]">
        <div>
          {candidate.convertedToTeamMember ? (
            <span className="px-3.5 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 size={16} /> Converted to Active Team Member
            </span>
          ) : onConvertToTeamMember ? (
            <button
              type="button"
              onClick={() => {
                handleSaveEvaluation();
                onConvertToTeamMember(candidate);
              }}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-2"
            >
              <ShieldCheck size={16} /> Convert Candidate to Active Team Member
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-[var(--crm-sidebar)] hover:bg-[var(--crm-card-border)] text-[var(--crm-heading)] rounded-xl text-xs font-bold transition-colors cursor-pointer border border-[var(--crm-card-border)]"
          >
            Close
          </button>
          <button
            onClick={handleSaveEvaluation}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-2"
          >
            <CheckCircle2 size={16} /> Save Review & Update Status
          </button>
        </div>
      </div>
    </div>
  );
}
