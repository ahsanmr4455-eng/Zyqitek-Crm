import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, Clock, Search, Filter, Plus, ChevronDown, ChevronUp, Edit2, Trash2, X, AlertCircle, FileText, Upload, Brain, ArrowLeft, MoreVertical, Play, Eye
} from 'lucide-react';
import { 
  PreHiringQuestion, CandidateAssessment, QuestionDifficulty, QuestionType, TestStatus, HiringDecision, CandidateExperience
} from '../types';
import { saveToFirestore, getCollectionOnce, deleteFromFirestore } from '../lib/firebaseSync';
import { generateUniqueId } from '../utils';
import PreHiringTestingList from './PreHiringTestingList';
import PreHiringCandidateForm from './PreHiringCandidateForm';
import PreHiringTestInterface from './PreHiringTestInterface';
import PreHiringAdminReview from './PreHiringAdminReview';
import PreHiringQuestionBank from './PreHiringQuestionBank';

export default function PreHiringTestingManager() {
  const [candidates, setCandidates] = useState<CandidateAssessment[]>([]);
  const [questions, setQuestions] = useState<PreHiringQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [view, setView] = useState<'list' | 'createCandidate' | 'testing' | 'adminReview' | 'questionBank'>('list');
  const [activeCandidate, setActiveCandidate] = useState<CandidateAssessment | null>(null);

  // Load data
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [cands, qs] = await Promise.all([
        getCollectionOnce<CandidateAssessment>('preHiringCandidates'),
        getCollectionOnce<PreHiringQuestion>('preHiringQuestions')
      ]);
      
      const loadedCandidates = cands || [];
      const loadedQuestions = qs || [];
      
      setCandidates(loadedCandidates);
      setQuestions(loadedQuestions);
    } catch (err) {
      console.error("Failed to load recruitment data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveCandidate = async (candidate: CandidateAssessment) => {
    try {
      await saveToFirestore('preHiringCandidates', candidate.id, candidate);
      setCandidates(prev => {
        const idx = prev.findIndex(c => c.id === candidate.id);
        if (idx >= 0) {
          const newArr = [...prev];
          newArr[idx] = candidate;
          return newArr;
        }
        return [...prev, candidate];
      });
      if (activeCandidate?.id === candidate.id) {
        setActiveCandidate(candidate);
      }
    } catch (err) {
      console.error("Failed to save candidate:", err);
      alert("Failed to save candidate application.");
    }
  };

  const handleDeleteCandidate = async (id: string) => {
    try {
      const success = await deleteFromFirestore('preHiringCandidates', id);
      if (success) {
        setCandidates(prev => prev.filter(c => c.id !== id));
        if (activeCandidate?.id === id) {
          setView('list');
          setActiveCandidate(null);
        }
      } else {
        // Fallback filter
        setCandidates(prev => prev.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete candidate:", err);
      // Ensure UI updates cleanly
      setCandidates(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleSaveQuestion = async (q: PreHiringQuestion) => {
    try {
      await saveToFirestore('preHiringQuestions', q.id, q);
      setQuestions(prev => {
        const idx = prev.findIndex(x => x.id === q.id);
        if (idx >= 0) {
          const newArr = [...prev];
          newArr[idx] = q;
          return newArr;
        }
        return [...prev, q];
      });
    } catch (err) {
      console.error(err);
      alert("Failed to save question");
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await deleteFromFirestore('preHiringQuestions', id);
      setQuestions(prev => prev.filter(q => q.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete question");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--crm-card)] rounded-2xl shadow-xs border border-[var(--crm-card-border)] p-5">
        <div>
          <h2 className="text-xl font-bold text-[var(--crm-heading)] flex items-center gap-2">
            <Brain size={20} className="text-indigo-400" />
            Candidate Applications & Recruitment
          </h2>
          <p className="text-sm text-[var(--crm-subtitle)] font-normal italic mt-1">
            Screen applicants, review service screening questions, and manage candidate recruitment.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {view !== 'list' && (
            <button 
              onClick={() => {
                setView('list');
                setActiveCandidate(null);
              }}
              className="px-3.5 py-2 bg-[var(--crm-sidebar)] hover:bg-[var(--crm-card)] text-[var(--crm-text)] text-xs font-medium rounded-xl transition-all border border-[var(--crm-card-border)] flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft size={14} /> Back to Applicants
            </button>
          )}
          {view === 'list' && (
            <>
              <button 
                onClick={() => setView('questionBank')}
                className="px-3.5 py-2 bg-[var(--crm-sidebar)] hover:bg-[var(--crm-card)] text-[var(--crm-text)] text-xs font-medium rounded-xl transition-all border border-[var(--crm-card-border)] flex items-center gap-1.5 cursor-pointer"
              >
                <FileText size={14} /> Assessment Question Bank
              </button>
              <button 
                onClick={() => {
                  setActiveCandidate(null);
                  setView('createCandidate');
                }}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer font-semibold"
              >
                <Plus size={15} /> + New Candidate
              </button>
            </>
          )}
        </div>
      </div>

      {view === 'list' && (
        <PreHiringTestingList 
          candidates={candidates}
          onStartTest={(cand) => {
            setActiveCandidate(cand);
            setView('testing');
          }}
          onReview={(cand) => {
            setActiveCandidate(cand);
            setView('adminReview');
          }}
          onEdit={(cand) => {
            setActiveCandidate(cand);
            setView('createCandidate');
          }}
          onDelete={handleDeleteCandidate}
        />
      )}

      {view === 'createCandidate' && (
        <PreHiringCandidateForm 
          candidate={activeCandidate}
          onSave={(cand) => {
            handleSaveCandidate(cand);
            setView('list');
          }}
          onCancel={() => setView('list')}
        />
      )}

      {view === 'testing' && activeCandidate && (
        <PreHiringTestInterface 
          candidate={activeCandidate}
          onSave={handleSaveCandidate}
          onComplete={(cand) => {
            handleSaveCandidate(cand);
            setView('list');
          }}
          onExit={() => setView('list')}
        />
      )}

      {view === 'adminReview' && activeCandidate && (
        <PreHiringAdminReview 
          candidate={activeCandidate}
          onSave={(cand) => {
            handleSaveCandidate(cand);
            setView('list');
          }}
          onClose={() => setView('list')}
          onConvertToTeamMember={async (cand) => {
            try {
              const teamMemberId = generateUniqueId('tm');
              const newTeamMember = {
                id: teamMemberId,
                name: cand.candidateName,
                email: cand.email,
                phone: cand.phone || '',
                role: cand.appliedService,
                category: 'Internal',
                status: 'Active',
                joinDate: new Date().toISOString().split('T')[0],
                notes: `Converted from Candidate Recruitment Application (${cand.appliedService})`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };

              await saveToFirestore('teamMembers', teamMemberId, newTeamMember);

              const updatedCand: CandidateAssessment = {
                ...cand,
                convertedToTeamMember: true,
                convertedTeamMemberId: teamMemberId,
                hiringDecision: 'Hire',
                testStatus: 'Passed',
                updatedAt: new Date().toISOString()
              };

              await handleSaveCandidate(updatedCand);
              alert(`Candidate ${cand.candidateName} has been successfully converted to an active Team Member!`);
              setView('list');
            } catch (err) {
              console.error('Failed to convert candidate to team member:', err);
              alert('Failed to convert candidate to team member. Please try again.');
            }
          }}
        />
      )}

      {view === 'questionBank' && (
        <PreHiringQuestionBank 
          questions={questions}
          onSave={handleSaveQuestion}
          onDelete={handleDeleteQuestion}
        />
      )}
    </div>
  );
}
