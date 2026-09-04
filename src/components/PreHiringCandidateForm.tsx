import React, { useState } from 'react';
import { CandidateAssessment, CandidateExperience } from '../types';
import { PRE_HIRING_SERVICES } from '../data/questionBank';
import { SERVICE_SCREENING_QUESTIONS, ScreeningQuestionDef } from '../data/screeningQuestions';
import { generateUniqueId } from '../utils';
import { User, Mail, Phone, Globe, FileText, CheckCircle2, Building2, Briefcase, Link2, DollarSign, Clock, HelpCircle, Layers } from 'lucide-react';

interface Props {
  candidate: CandidateAssessment | null;
  onSave: (c: CandidateAssessment) => void;
  onCancel: () => void;
}

export default function PreHiringCandidateForm({ candidate, onSave, onCancel }: Props) {
  const [formData, setFormData] = useState({
    // Service First
    appliedService: candidate?.appliedService || PRE_HIRING_SERVICES[0],
    customServiceName: candidate?.customServiceName || '',

    // Basic Info
    candidateName: candidate?.candidateName || '',
    age: candidate?.age || '',
    email: candidate?.email || '',
    phone: candidate?.phone || '',
    whatsapp: candidate?.whatsapp || '',
    cityCountry: candidate?.cityCountry || '',

    // Experience
    yearsOfExperience: candidate?.yearsOfExperience || '1–2 years',
    hasWorkedProfessionally: candidate?.hasWorkedProfessionally || 'Yes',
    workedWithInternationalClients: candidate?.workedWithInternationalClients || 'No',
    workedRemotely: candidate?.workedRemotely || 'Yes',
    currentlyEmployed: candidate?.currentlyEmployed || 'No',
    regularTools: candidate?.regularTools || '',
    strongestSkill: candidate?.strongestSkill || '',
    comfortWithRevisions: candidate?.comfortWithRevisions || 'Extremely Comfortable',
    experienceDetails: candidate?.experienceDetails || '',

    // Agency Experience
    hasAgencyExperience: candidate?.hasAgencyExperience || 'No',
    agencyName: candidate?.agencyName || '',
    agencyDuration: candidate?.agencyDuration || '',
    agencyRole: candidate?.agencyRole || '',

    // Service Screening Answers
    screeningAnswers: candidate?.screeningAnswers || {},

    // Links & Portfolio
    portfolioLink: candidate?.portfolioLink || '',
    googleDriveLink: candidate?.googleDriveLink || '',
    behanceLink: candidate?.behanceLink || '',
    githubWebsiteLink: candidate?.githubWebsiteLink || '',
    cvResumeLink: candidate?.cvResumeLink || '',
    additionalLinks: candidate?.additionalLinks || '',

    // Availability & Compensation
    availability: candidate?.availability || 'Full-time',
    startTimeline: candidate?.startTimeline || 'Immediately',
    expectedRate: candidate?.expectedRate || '',
    paymentPreference: candidate?.paymentPreference || 'Monthly',

    // Additional Info
    additionalInfo: candidate?.additionalInfo || '',
    notes: candidate?.notes || ''
  });

  const activeServiceKey = formData.appliedService;
  const currentScreeningQuestions: ScreeningQuestionDef[] = SERVICE_SCREENING_QUESTIONS[activeServiceKey] 
    || SERVICE_SCREENING_QUESTIONS['Other'] || [];

  const handleScreeningAnswerChange = (questionId: string, answer: string) => {
    setFormData(prev => ({
      ...prev,
      screeningAnswers: {
        ...prev.screeningAnswers,
        [questionId]: answer
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalServiceName = formData.appliedService === 'Other' 
      ? (formData.customServiceName || 'Other Custom Service') 
      : formData.appliedService;

    const newCandidate: CandidateAssessment = {
      ...(candidate || {
        id: generateUniqueId('cand_app'),
        testStatus: 'Under Review',
        reviewerStatus: 'Pending Admin Review',
        answers: {},
        scores: {},
        totalScore: 0,
        maxScore: 0,
        percentage: 0,
        assignedQuestions: [],
        practicalTaskEnabled: false,
        createdAt: new Date().toISOString()
      }),
      candidateName: formData.candidateName,
      age: formData.age,
      email: formData.email,
      phone: formData.phone,
      whatsapp: formData.whatsapp,
      cityCountry: formData.cityCountry,
      appliedService: finalServiceName,
      customServiceName: formData.appliedService === 'Other' ? formData.customServiceName : undefined,
      experienceLevel: 'Intermediate' as CandidateExperience,
      languagePreference: 'English',
      yearsOfExperience: formData.yearsOfExperience,

      // Screening
      hasWorkedProfessionally: formData.hasWorkedProfessionally as 'Yes' | 'No',
      workedWithInternationalClients: formData.workedWithInternationalClients as 'Yes' | 'No',
      workedRemotely: formData.workedRemotely as 'Yes' | 'No',
      currentlyEmployed: formData.currentlyEmployed as 'Yes' | 'No',
      regularTools: formData.regularTools,
      strongestSkill: formData.strongestSkill,
      comfortWithRevisions: formData.comfortWithRevisions,
      experienceDetails: formData.experienceDetails,

      // Agency
      hasAgencyExperience: formData.hasAgencyExperience as 'Yes' | 'No',
      agencyName: formData.agencyName,
      agencyDuration: formData.agencyDuration,
      agencyRole: formData.agencyRole,

      // Responses
      screeningAnswers: formData.screeningAnswers,

      // Links
      portfolioLink: formData.portfolioLink,
      googleDriveLink: formData.googleDriveLink,
      behanceLink: formData.behanceLink,
      githubWebsiteLink: formData.githubWebsiteLink,
      cvResumeLink: formData.cvResumeLink,
      additionalLinks: formData.additionalLinks,

      // Availability & Pay
      availability: formData.availability,
      startTimeline: formData.startTimeline,
      expectedRate: formData.expectedRate,
      paymentPreference: formData.paymentPreference,
      additionalInfo: formData.additionalInfo,

      notes: formData.notes,
      updatedAt: new Date().toISOString()
    };

    onSave(newCandidate);
  };

  return (
    <div className="bg-[var(--crm-card)] rounded-2xl shadow-xs border border-[var(--crm-card-border)] p-6 md:p-8 max-w-4xl mx-auto space-y-6 text-[var(--crm-text)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--crm-card-border)] pb-4">
        <div>
          <h3 className="text-lg font-bold text-[var(--crm-heading)] flex items-center gap-2">
            <Briefcase size={20} className="text-indigo-400" />
            {candidate ? 'Edit Candidate Application' : 'New Candidate Screening Application'}
          </h3>
          <p className="text-xs text-[var(--crm-subtitle)] mt-0.5">
            English candidate screening form. Select a service first to automatically load relevant screening questions.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* STEP 1: SERVICE SELECTION FIRST */}
        <div className="bg-[var(--crm-sidebar)]/60 p-5 rounded-2xl border border-[var(--crm-card-border)] space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-indigo-400 tracking-wider uppercase flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
              Step 1: Select Service First *
            </h4>
            <span className="text-[10px] font-mono text-[var(--crm-subtitle)] bg-[var(--crm-card)] px-2.5 py-1 rounded-lg border border-[var(--crm-card-border)]">
              Service Drives Questions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--crm-heading)] mb-1.5">
                Target Service Role *
              </label>
              <select 
                value={formData.appliedService} 
                onChange={e => {
                  const newService = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    appliedService: newService,
                    // Reset screening answers if service changed
                    screeningAnswers: {}
                  }));
                }} 
                className="w-full px-3.5 py-2.5 bg-[var(--crm-card)] border border-[var(--crm-card-border)] text-[var(--crm-heading)] rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none shadow-2xs"
              >
                {PRE_HIRING_SERVICES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {formData.appliedService === 'Other' && (
              <div>
                <label className="block text-xs font-semibold text-[var(--crm-heading)] mb-1.5">
                  Custom Service Name *
                </label>
                <input 
                  required 
                  type="text" 
                  value={formData.customServiceName} 
                  onChange={e => setFormData({...formData, customServiceName: e.target.value})} 
                  placeholder="e.g. 3D Animation & Modeling"
                  className="w-full px-3.5 py-2.5 bg-[var(--crm-card)] border border-[var(--crm-card-border)] text-[var(--crm-heading)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none shadow-2xs" 
                />
              </div>
            )}
          </div>
        </div>

        {/* STEP 2: DYNAMIC SERVICE SCREENING QUESTIONS */}
        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between border-b border-[var(--crm-card-border)] pb-2">
            <h4 className="text-xs font-bold text-indigo-400 tracking-wider uppercase flex items-center gap-2">
              <HelpCircle size={14} />
              Step 2: Service Screening Questions ({formData.appliedService === 'Other' ? (formData.customServiceName || 'Custom Service') : formData.appliedService})
            </h4>
            <span className="text-[10px] text-[var(--crm-subtitle)] bg-[var(--crm-sidebar)] px-2.5 py-1 rounded-lg border border-[var(--crm-card-border)] font-mono">
              {currentScreeningQuestions.length} Questions
            </span>
          </div>

          <div className="space-y-4">
            {currentScreeningQuestions.map((q, idx) => {
              const currentVal = formData.screeningAnswers[q.id] || '';

              return (
                <div key={q.id} className="bg-[var(--crm-sidebar)]/40 p-4 rounded-xl border border-[var(--crm-card-border)] space-y-2.5">
                  <label className="block text-xs font-semibold text-[var(--crm-heading)] leading-snug">
                    <span className="text-indigo-400 mr-2 font-mono">{idx + 1}.</span>
                    {q.questionEnglish}
                  </label>

                  {q.type === 'select' ? (
                    <select
                      value={currentVal}
                      onChange={e => handleScreeningAnswerChange(q.id, e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--crm-card)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="">Select an answer option...</option>
                      {q.optionsEnglish?.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : q.type === 'textarea' ? (
                    <textarea
                      rows={3}
                      value={currentVal}
                      onChange={e => handleScreeningAnswerChange(q.id, e.target.value)}
                      placeholder={q.placeholderEnglish || 'Enter your detailed answer...'}
                      className="w-full p-3 bg-[var(--crm-card)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none resize-y"
                    />
                  ) : (
                    <input
                      type="text"
                      value={currentVal}
                      onChange={e => handleScreeningAnswerChange(q.id, e.target.value)}
                      placeholder={q.placeholderEnglish || 'Enter your response...'}
                      className="w-full px-3 py-2 bg-[var(--crm-card)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* STEP 3: BASIC CANDIDATE CONTACT INFORMATION */}
        <div className="space-y-4 pt-3 border-t border-[var(--crm-card-border)]">
          <h4 className="text-xs font-bold text-indigo-400 tracking-wider uppercase flex items-center gap-1.5">
            <User size={14} />
            Step 3: Basic Candidate Contact Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--crm-subtitle)] mb-1">
                Full Name *
              </label>
              <input 
                required 
                type="text" 
                value={formData.candidateName} 
                onChange={e => setFormData({...formData, candidateName: e.target.value})} 
                placeholder="e.g. Alex Rivera"
                className="w-full px-3 py-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--crm-subtitle)] mb-1">
                Age
              </label>
              <input 
                type="text" 
                value={formData.age} 
                onChange={e => setFormData({...formData, age: e.target.value})} 
                placeholder="e.g. 25"
                className="w-full px-3 py-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--crm-subtitle)] mb-1">
                Email Address *
              </label>
              <input 
                required 
                type="email" 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                placeholder="candidate@example.com"
                className="w-full px-3 py-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--crm-subtitle)] mb-1">
                Phone Number *
              </label>
              <input 
                required
                type="text" 
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})} 
                placeholder="+1 555 123 4567"
                className="w-full px-3 py-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--crm-subtitle)] mb-1">
                WhatsApp Number
              </label>
              <input 
                type="text" 
                value={formData.whatsapp} 
                onChange={e => setFormData({...formData, whatsapp: e.target.value})} 
                placeholder="+1 555 123 4567"
                className="w-full px-3 py-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--crm-subtitle)] mb-1">
                City & Country
              </label>
              <input 
                type="text" 
                value={formData.cityCountry} 
                onChange={e => setFormData({...formData, cityCountry: e.target.value})} 
                placeholder="e.g. New York, USA"
                className="w-full px-3 py-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
            </div>
          </div>
        </div>

        {/* STEP 4: EXPERIENCE & GENERAL BACKGROUND */}
        <div className="space-y-4 pt-3 border-t border-[var(--crm-card-border)]">
          <h4 className="text-xs font-bold text-indigo-400 tracking-wider uppercase flex items-center gap-1.5">
            <Clock size={14} />
            Step 4: Experience & Background Questions
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--crm-subtitle)] mb-1">
                Years of Experience *
              </label>
              <select
                value={formData.yearsOfExperience}
                onChange={e => setFormData({...formData, yearsOfExperience: e.target.value})}
                className="w-full px-3 py-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="No professional experience">No professional experience</option>
                <option value="Less than 1 year">Less than 1 year</option>
                <option value="1–2 years">1–2 years</option>
                <option value="2–3 years">2–3 years</option>
                <option value="3–5 years">3–5 years</option>
                <option value="5+ years">5+ years</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--crm-subtitle)] mb-1">
                Worked Professionally Before?
              </label>
              <select
                value={formData.hasWorkedProfessionally}
                onChange={e => setFormData({...formData, hasWorkedProfessionally: e.target.value as 'Yes' | 'No'})}
                className="w-full px-3 py-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--crm-subtitle)] mb-1">
                Worked with International Clients?
              </label>
              <select
                value={formData.workedWithInternationalClients}
                onChange={e => setFormData({...formData, workedWithInternationalClients: e.target.value as 'Yes' | 'No'})}
                className="w-full px-3 py-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--crm-subtitle)] mb-1">
                Worked Remotely Before?
              </label>
              <select
                value={formData.workedRemotely}
                onChange={e => setFormData({...formData, workedRemotely: e.target.value as 'Yes' | 'No'})}
                className="w-full px-3 py-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--crm-subtitle)] mb-1">
                Currently Employed Elsewhere?
              </label>
              <select
                value={formData.currentlyEmployed}
                onChange={e => setFormData({...formData, currentlyEmployed: e.target.value as 'Yes' | 'No'})}
                className="w-full px-3 py-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--crm-subtitle)] mb-1">
                Comfort with Revisions & Feedback?
              </label>
              <select
                value={formData.comfortWithRevisions}
                onChange={e => setFormData({...formData, comfortWithRevisions: e.target.value})}
                className="w-full px-3 py-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="Extremely Comfortable">Extremely Comfortable</option>
                <option value="Very Comfortable">Very Comfortable</option>
                <option value="Comfortable">Comfortable</option>
                <option value="Less Comfortable">Less Comfortable</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-[var(--crm-subtitle)] mb-1">
                Regular Software & Tools Used
              </label>
              <input 
                type="text" 
                value={formData.regularTools} 
                onChange={e => setFormData({...formData, regularTools: e.target.value})} 
                placeholder="e.g. Premiere Pro, After Effects, Figma, Photoshop"
                className="w-full px-3 py-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--crm-subtitle)] mb-1">
                Strongest Core Skill
              </label>
              <input 
                type="text" 
                value={formData.strongestSkill} 
                onChange={e => setFormData({...formData, strongestSkill: e.target.value})} 
                placeholder="e.g. High Retention Video Hooks / Color Grading"
                className="w-full px-3 py-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--crm-subtitle)] mb-1">
              Brief Experience Summary / Overview
            </label>
            <textarea 
              rows={2}
              value={formData.experienceDetails} 
              onChange={e => setFormData({...formData, experienceDetails: e.target.value})} 
              placeholder="Describe key past projects, client types, and professional highlights..."
              className="w-full p-3 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none resize-y" 
            />
          </div>
        </div>

        {/* STEP 5: AGENCY EXPERIENCE HISTORY */}
        <div className="space-y-4 pt-3 border-t border-[var(--crm-card-border)]">
          <h4 className="text-xs font-bold text-indigo-400 tracking-wider uppercase flex items-center gap-1.5">
            <Building2 size={14} />
            Step 5: Agency Experience History
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--crm-subtitle)] mb-1">
                Worked with an agency before?
              </label>
              <select
                value={formData.hasAgencyExperience}
                onChange={e => setFormData({...formData, hasAgencyExperience: e.target.value as 'Yes' | 'No'})}
                className="w-full px-3 py-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            {formData.hasAgencyExperience === 'Yes' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-[var(--crm-subtitle)] mb-1">
                    Agency Name
                  </label>
                  <input 
                    type="text" 
                    value={formData.agencyName} 
                    onChange={e => setFormData({...formData, agencyName: e.target.value})} 
                    placeholder="e.g. MediaFlow Studio"
                    className="w-full px-3 py-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--crm-subtitle)] mb-1">
                    Duration / Period
                  </label>
                  <input 
                    type="text" 
                    value={formData.agencyDuration} 
                    onChange={e => setFormData({...formData, agencyDuration: e.target.value})} 
                    placeholder="e.g. 1 Year / 6 Months"
                    className="w-full px-3 py-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--crm-subtitle)] mb-1">
                    Role & Responsibilities
                  </label>
                  <input 
                    type="text" 
                    value={formData.agencyRole} 
                    onChange={e => setFormData({...formData, agencyRole: e.target.value})} 
                    placeholder="e.g. Lead Video Editor"
                    className="w-full px-3 py-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none" 
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* STEP 6: PORTFOLIO & WORK LINKS */}
        <div className="space-y-4 pt-3 border-t border-[var(--crm-card-border)]">
          <h4 className="text-xs font-bold text-indigo-400 tracking-wider uppercase flex items-center gap-1.5">
            <Link2 size={14} />
            Step 6: Portfolio & Work Links
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--crm-subtitle)] mb-1">
                Portfolio / Primary Work Link
              </label>
              <input 
                type="url" 
                value={formData.portfolioLink} 
                onChange={e => setFormData({...formData, portfolioLink: e.target.value})} 
                placeholder="https://behance.net/username or portfolio website"
                className="w-full px-3 py-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--crm-subtitle)] mb-1">
                Google Drive Link (Work Assets / Samples)
              </label>
              <input 
                type="url" 
                value={formData.googleDriveLink} 
                onChange={e => setFormData({...formData, googleDriveLink: e.target.value})} 
                placeholder="https://drive.google.com/drive/folders/..."
                className="w-full px-3 py-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--crm-subtitle)] mb-1">
                GitHub / Behance / Dribbble Link
              </label>
              <input 
                type="url" 
                value={formData.githubWebsiteLink} 
                onChange={e => setFormData({...formData, githubWebsiteLink: e.target.value})} 
                placeholder="https://github.com/username or behance.net"
                className="w-full px-3 py-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--crm-subtitle)] mb-1">
                CV / Resume Link
              </label>
              <input 
                type="url" 
                value={formData.cvResumeLink} 
                onChange={e => setFormData({...formData, cvResumeLink: e.target.value})} 
                placeholder="https://linkedin.com/in/username or drive link"
                className="w-full px-3 py-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--crm-subtitle)] mb-1">
              Additional Reference Links
            </label>
            <textarea 
              rows={2}
              value={formData.additionalLinks} 
              onChange={e => setFormData({...formData, additionalLinks: e.target.value})} 
              placeholder="One link per line..."
              className="w-full p-2.5 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none resize-y" 
            />
          </div>
        </div>

        {/* STEP 7: AVAILABILITY & COMPENSATION */}
        <div className="space-y-4 pt-3 border-t border-[var(--crm-card-border)]">
          <h4 className="text-xs font-bold text-indigo-400 tracking-wider uppercase flex items-center gap-1.5">
            <DollarSign size={14} />
            Step 7: Availability & Compensation Expectation
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--crm-subtitle)] mb-1">
                Work Availability
              </label>
              <select
                value={formData.availability}
                onChange={e => setFormData({...formData, availability: e.target.value})}
                className="w-full px-3 py-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Freelance">Freelance</option>
                <option value="Contract">Contract</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--crm-subtitle)] mb-1">
                Start Timeline
              </label>
              <select
                value={formData.startTimeline}
                onChange={e => setFormData({...formData, startTimeline: e.target.value})}
                className="w-full px-3 py-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="Immediately">Immediately</option>
                <option value="Within 1 week">Within 1 week</option>
                <option value="Within 2 weeks">Within 2 weeks</option>
                <option value="1 month notice">1 month notice</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--crm-subtitle)] mb-1">
                Expected Salary / Rate
              </label>
              <input 
                type="text" 
                value={formData.expectedRate} 
                onChange={e => setFormData({...formData, expectedRate: e.target.value})} 
                placeholder="e.g. $500/month or $20/hr"
                className="w-full px-3 py-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--crm-subtitle)] mb-1">
                Payment Preference
              </label>
              <select
                value={formData.paymentPreference}
                onChange={e => setFormData({...formData, paymentPreference: e.target.value})}
                className="w-full px-3 py-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="Monthly">Monthly</option>
                <option value="Per Project">Per Project</option>
                <option value="Hourly">Hourly</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* STEP 8: ADDITIONAL NOTES */}
        <div className="space-y-2 pt-3 border-t border-[var(--crm-card-border)]">
          <label className="block text-xs font-semibold text-[var(--crm-subtitle)]">
            Is there anything else relevant you would like Admin to know?
          </label>
          <textarea 
            rows={2}
            value={formData.additionalInfo} 
            onChange={e => setFormData({...formData, additionalInfo: e.target.value})} 
            placeholder="Add any additional notes or work details..."
            className="w-full p-3 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none resize-y" 
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--crm-card-border)]">
          <button 
            type="button" 
            onClick={onCancel} 
            className="px-4 py-2.5 bg-[var(--crm-card)] hover:bg-[var(--crm-card)] border border-[var(--crm-card-border)] text-[var(--crm-heading)] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-2"
          >
            <CheckCircle2 size={16} />
            {candidate ? 'Update Application' : 'Submit Candidate Application'}
          </button>
        </div>
      </form>
    </div>
  );
}
