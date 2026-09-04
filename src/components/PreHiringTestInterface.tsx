import React, { useState, useEffect } from 'react';
import { CandidateAssessment, PreHiringQuestion } from '../types';
import { ArrowLeft, Save, CheckCircle2, ChevronRight, ChevronLeft, Upload, FileText, Send, Sparkles, Award, Clock } from 'lucide-react';

interface Props {
  candidate: CandidateAssessment;
  onSave: (c: CandidateAssessment) => void;
  onComplete: (c: CandidateAssessment) => void;
  onExit: () => void;
}

export default function PreHiringTestInterface({ candidate, onSave, onComplete, onExit }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(candidate.answers || {});
  const [practicalLink, setPracticalLink] = useState(candidate.practicalSubmissionLink || '');
  const [practicalNotes, setPracticalNotes] = useState(candidate.practicalSubmissionNotes || '');
  const [isStarted, setIsStarted] = useState(
    candidate.testStatus === 'In Progress' || 
    candidate.testStatus === 'Completed' || 
    candidate.testStatus === 'Under Review'
  );
  const [isSubmitted, setIsSubmitted] = useState(
    candidate.testStatus === 'Completed' || 
    candidate.testStatus === 'Under Review' ||
    candidate.testStatus === 'Passed' ||
    candidate.testStatus === 'Failed'
  );

  // Countdown timer state (in seconds)
  const timeLimitSeconds = (candidate.timeLimitMinutes || 0) * 60;
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    if (timeLimitSeconds <= 0) return 0;
    if (candidate.startedAt) {
      const elapsedSec = Math.floor((new Date().getTime() - new Date(candidate.startedAt).getTime()) / 1000);
      return Math.max(0, timeLimitSeconds - elapsedSec);
    }
    return timeLimitSeconds;
  });

  const questions = candidate.assignedQuestions || [];
  const totalSteps = questions.length + (candidate.practicalTaskEnabled ? 1 : 0);
  const isPracticalStep = currentIdx === questions.length;
  const currentQuestion: PreHiringQuestion | undefined = questions[currentIdx];

  useEffect(() => {
    if (!isStarted && candidate.testStatus === 'Not Started') {
      onSave({
        ...candidate,
        testStatus: 'In Progress',
        startedAt: new Date().toISOString()
      });
      setIsStarted(true);
    }
  }, []);

  // Timer interval effect
  useEffect(() => {
    if (timeLimitSeconds <= 0 || isSubmitted) return;

    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-submit assessment when timer reaches 0
          handleCompleteAssessment();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLimitSeconds, isSubmitted]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainderSecs = secs % 60;
    return `${mins}:${remainderSecs < 10 ? '0' : ''}${remainderSecs}`;
  };

  const handleNext = () => {
    if (currentIdx < totalSteps - 1) {
      setCurrentIdx(i => i + 1);
      handleSaveProgress();
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(i => i - 1);
    }
  };

  const handleSaveProgress = () => {
    onSave({
      ...candidate,
      answers,
      practicalSubmissionLink: practicalLink,
      practicalSubmissionNotes: practicalNotes,
      updatedAt: new Date().toISOString()
    });
  };

  const handleCompleteAssessment = () => {
    // Compute preliminary scores for Objective Multiple Choice questions
    let totalEarned = 0;
    const scoresMap: Record<string, number> = { ...(candidate.scores || {}) };

    const breakdown = {
      basic: { earned: 0, max: 0 },
      intermediate: { earned: 0, max: 0 },
      advanced: { earned: 0, max: 0 },
      pro: { earned: 0, max: 0 }
    };

    questions.forEach(q => {
      const qPts = q.points || 1;
      const qDiff = (q.difficulty === 'Professional' ? 'Pro' : q.difficulty) as 'Basic' | 'Intermediate' | 'Advanced' | 'Pro';
      
      const key = qDiff.toLowerCase() as keyof typeof breakdown;
      if (breakdown[key]) {
        breakdown[key].max += qPts;
      }

      // Auto-score Multiple Choice
      if (q.type === 'Multiple Choice' && q.correctAnswer) {
        const candidateAns = answers[q.id];
        if (candidateAns && candidateAns.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
          scoresMap[q.id] = qPts;
          totalEarned += qPts;
          if (breakdown[key]) breakdown[key].earned += qPts;
        } else {
          scoresMap[q.id] = 0;
        }
      } else {
        // Subjective questions start with existing score or 0 pending admin review
        const existingScore = scoresMap[q.id] || 0;
        totalEarned += existingScore;
        if (breakdown[key]) breakdown[key].earned += existingScore;
      }
    });

    const maxScore = candidate.maxScore || questions.reduce((acc, q) => acc + (q.points || 1), 0) || 1;
    const pct = Math.round((totalEarned / maxScore) * 100);

    const updatedCandidate: CandidateAssessment = {
      ...candidate,
      answers,
      scores: scoresMap,
      totalScore: totalEarned,
      maxScore,
      percentage: pct,
      levelBreakdown: breakdown,
      practicalSubmissionLink: practicalLink,
      practicalSubmissionNotes: practicalNotes,
      testStatus: 'Under Review',
      reviewerStatus: 'Pending Admin Review',
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setIsSubmitted(true);
    onComplete(updatedCandidate);
  };

  // ASCII/Visual Progress bar block builder e.g., ██████████░░░░░░░░
  const getProgressBarText = () => {
    const totalBlocks = 16;
    const currentStepNum = Math.min(currentIdx + 1, totalSteps);
    const filledCount = Math.round((currentStepNum / totalBlocks) * totalBlocks) || 1;
    const emptyCount = Math.max(0, totalBlocks - filledCount);
    return '█'.repeat(filledCount) + '░'.repeat(emptyCount);
  };

  const progressPercentage = Math.round(((currentIdx + 1) / totalSteps) * 100);

  if (questions.length === 0 && !candidate.practicalTaskEnabled) {
    return (
      <div className="bg-[var(--crm-card)] rounded-2xl p-8 text-center border border-[var(--crm-card-border)] max-w-lg 2xl:max-w-xl 3xl:max-w-2xl 4k:max-w-3xl 5k:max-w-4xl mx-auto my-12 space-y-4">
        <p className="text-[var(--crm-subtitle)] font-medium text-sm">
          No assessment questions found for this candidate.
        </p>
        <button 
          onClick={onExit} 
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
        >
          Return to Candidate List
        </button>
      </div>
    );
  }

  // Completion view
  if (isSubmitted) {
    const maxScore = candidate.maxScore || 20;
    const pct = candidate.percentage || 0;

    return (
      <div className="bg-[var(--crm-card)] rounded-2xl shadow-xs border border-[var(--crm-card-border)] max-w-2xl 3xl:max-w-4xl 4k:max-w-5xl 5k:max-w-7xl mx-auto p-8 my-6 space-y-6">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
            <Award size={32} />
          </div>
          <h3 className="text-xl font-semibold text-[var(--crm-heading)]">
            Assessment Submitted
          </h3>
          <p className="text-xs text-[var(--crm-subtitle)] max-w-md mx-auto">
            Thank you, <strong className="text-[var(--crm-heading)]">{candidate.candidateName}</strong>. Your technical responses have been recorded and sent for administrative review.
          </p>
        </div>

        {/* Results Card */}
        <div className="bg-[var(--crm-bg)] rounded-2xl border border-[var(--crm-card-border)] p-6 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-[var(--crm-text-secondary)] font-semibold">Service</span>
              <span className="text-xs font-semibold text-[var(--crm-heading)]">{candidate.appliedService}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-[var(--crm-text-secondary)] font-semibold">Claimed Level</span>
              <span className="text-xs font-semibold text-[var(--crm-heading)]">{candidate.experienceLevel}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-[var(--crm-text-secondary)] font-semibold">Questions Completed</span>
              <span className="text-xs font-semibold text-[var(--crm-heading)]">{questions.length} / {questions.length}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-[var(--crm-text-secondary)] font-semibold">Review Status</span>
              <span className="text-xs font-semibold text-amber-400">Pending Admin Review</span>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--crm-card-border)] flex items-center justify-between">
            <div>
              <span className="text-xs text-[var(--crm-subtitle)] font-semibold">Objective Points Earned:</span>
              <p className="text-lg font-semibold text-indigo-400">
                {candidate.totalScore} / {maxScore} <span className="text-xs font-normal text-[var(--crm-text-secondary)]">({pct}%)</span>
              </p>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-semibold inline-block">
                Evaluation Pending
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={onExit}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            Back to Assessment List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--crm-card)] rounded-2xl shadow-xs border border-[var(--crm-card-border)] min-h-[620px] flex flex-col max-w-4xl 2xl:max-w-5xl 3xl:max-w-7xl 3xl:max-w-[1600px] 4k:max-w-[2200px] 5k:max-w-[3400px] 4k:max-w-[1600px] 5k:max-w-[2400px] mx-auto">
      {/* Test Top Navigation Header */}
      <div className="p-4 sm:p-5 border-b border-[var(--crm-card-border)] bg-[var(--crm-sidebar)] rounded-t-2xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={onExit} 
              className="p-1.5 text-[var(--crm-text)] hover:text-[var(--crm-heading)] hover:bg-[var(--crm-card)] rounded-xl transition-colors cursor-pointer border border-transparent hover:border-[var(--crm-card-border)]"
              title="Exit Assessment"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  {candidate.appliedService}
                </span>
                <span className="text-[var(--crm-text-muted)]">•</span>
                <span className="text-xs font-semibold text-[var(--crm-text)]">
                  {candidate.experienceLevel}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-[var(--crm-heading)] mt-0.5">
                Candidate: {candidate.candidateName}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-[var(--crm-subtitle)] self-end sm:self-auto">
            {timeLimitSeconds > 0 && (
              <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-mono font-semibold ${
                secondsRemaining < 300 
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse' 
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                <Clock size={14} />
                <span>Time: {formatTime(secondsRemaining)}</span>
              </div>
            )}

            <span className="font-mono text-indigo-400 font-semibold text-sm">
              Question {currentIdx + 1} of {totalSteps}
            </span>
            <button 
              onClick={handleSaveProgress} 
              className="px-3 py-1.5 bg-[var(--crm-card)] border border-[var(--crm-card-border)] hover:border-indigo-500 text-[var(--crm-heading)] rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs font-semibold"
            >
              <Save size={14} className="text-indigo-400" /> Save Progress
            </button>
          </div>
        </div>

        {/* Visual Progress Bar Component */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-[var(--crm-text-secondary)] font-mono">
            <span>PROGRESS: {progressPercentage}%</span>
            <span className="tracking-widest hidden sm:inline">{getProgressBarText()}</span>
          </div>
          <div className="w-full bg-[var(--crm-card)] h-2 rounded-full overflow-hidden border border-[var(--crm-card-border)]">
            <div 
              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Question Body Area */}
      <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-[var(--crm-bg)]">
        {!isPracticalStep && currentQuestion && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Badges for Level and Type */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--crm-card-border)] pb-3">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
                  currentQuestion.difficulty === 'Basic' 
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                  currentQuestion.difficulty === 'Intermediate' 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  currentQuestion.difficulty === 'Advanced' 
                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                    'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}>
                  Level {currentQuestion.difficulty === 'Basic' ? '1 — Basic' : currentQuestion.difficulty === 'Intermediate' ? '2 — Intermediate' : currentQuestion.difficulty === 'Advanced' ? '3 — Advanced' : '4 — Pro'}
                </span>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--crm-card)] text-[var(--crm-text)] border border-[var(--crm-card-border)]">
                  {currentQuestion.type}
                </span>
              </div>

              <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                {currentQuestion.points || 1} {currentQuestion.points === 1 ? 'Point' : 'Points'}
              </span>
            </div>

            {/* Question Text */}
            <div className="space-y-2">
              <h4 className="text-base md:text-lg font-semibold text-[var(--crm-heading)] leading-relaxed">
                {currentQuestion.question}
              </h4>
              {currentQuestion.questionRomanUrdu && (candidate.languagePreference === 'Bilingual' || candidate.languagePreference === 'Roman Urdu') && (
                <p className="text-xs font-medium text-indigo-400/90 bg-indigo-500/5 px-3 py-2 rounded-lg border border-indigo-500/10 flex items-center gap-2">
                  <span className="font-semibold text-[10px] uppercase tracking-wide bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">Roman Urdu</span>
                  {currentQuestion.questionRomanUrdu}
                </p>
              )}
              {currentQuestion.instructions && (
                <p className="text-xs text-indigo-200 italic bg-[var(--crm-card)] p-3 rounded-xl border border-[var(--crm-card-border)]">
                  Note: {currentQuestion.instructions}
                </p>
              )}
            </div>

            {/* Answer Controls tailored to Question Type */}
            <div className="pt-2">
              {currentQuestion.type === 'Multiple Choice' ? (
                <div className="space-y-2.5">
                  {currentQuestion.options?.map((opt, i) => {
                    const isSelected = answers[currentQuestion.id] === opt;
                    const romanUrduOpt = currentQuestion.optionsRomanUrdu?.[i];

                    return (
                      <label 
                        key={i} 
                        className={`flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-indigo-500/10 border-indigo-500 text-[var(--crm-heading)] font-semibold shadow-2xs' 
                            : 'bg-[var(--crm-sidebar)] border-[var(--crm-card-border)] text-[var(--crm-text)] hover:text-[var(--crm-heading)] hover:border-indigo-500'
                        }`}
                      >
                        <input 
                          type="radio" 
                          name={`q-${currentQuestion.id}`}
                          value={opt}
                          checked={isSelected}
                          onChange={() => setAnswers({...answers, [currentQuestion.id]: opt})}
                          className="text-indigo-500 focus:ring-indigo-500 h-4 w-4 shrink-0 mt-0.5"
                        />
                        <div className="flex-1 text-xs leading-normal space-y-0.5">
                          <div>{opt}</div>
                          {romanUrduOpt && (candidate.languagePreference === 'Bilingual' || candidate.languagePreference === 'Roman Urdu') && (
                            <div className="text-[11px] text-indigo-300/80 font-normal">
                              {romanUrduOpt}
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              ) : currentQuestion.type === 'Short Answer' ? (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[var(--crm-text)]">Your Answer:</label>
                  <input 
                    type="text"
                    value={answers[currentQuestion.id] || ''}
                    onChange={e => setAnswers({...answers, [currentQuestion.id]: e.target.value})}
                    className="w-full px-4 py-3 bg-[var(--crm-card)] border border-[var(--crm-card-border)] text-[var(--crm-heading)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Type a concise response..."
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[var(--crm-text)]">Your Solution & Analysis:</label>
                  <textarea 
                    rows={8}
                    value={answers[currentQuestion.id] || ''}
                    onChange={e => setAnswers({...answers, [currentQuestion.id]: e.target.value})}
                    className="w-full p-4 bg-[var(--crm-card)] border border-[var(--crm-card-border)] text-[var(--crm-heading)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
                    placeholder="Type your structured explanation, step-by-step problem-solving workflow, or scenario diagnosis..."
                  ></textarea>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Practical Submission Step */}
        {isPracticalStep && candidate.practicalTaskEnabled && (
          <div className="max-w-2xl 3xl:max-w-4xl 4k:max-w-5xl 5k:max-w-7xl mx-auto space-y-6 bg-[var(--crm-card)]">
            <div className="bg-[var(--crm-card)] p-6 rounded-2xl border border-[var(--crm-card-border)] space-y-4">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-indigo-400" />
                <h4 className="text-base font-semibold text-[var(--crm-heading)]">
                  Practical Task & Portfolio Deliverable
                </h4>
              </div>
              <p className="text-xs text-[var(--crm-subtitle)] leading-relaxed">
                Please attach or link any external work sample, video export, design file (Figma/Behance), code repository, or campaign asset related to this assessment.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--crm-text)] mb-1">
                    Work Deliverable / Portfolio Link (Google Drive, Figma, GitHub, Dropbox)
                  </label>
                  <input 
                    type="url"
                    value={practicalLink}
                    onChange={e => setPracticalLink(e.target.value)}
                    placeholder="https://drive.google.com/file/d/..."
                    className="w-full px-4 py-2.5 bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] text-[var(--crm-heading)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--crm-text)] mb-1">
                    Deliverable Notes / Context for Evaluator
                  </label>
                  <textarea 
                    rows={4}
                    value={practicalNotes}
                    onChange={e => setPracticalNotes(e.target.value)}
                    placeholder="Provide any context, software tools used, key constraints, or access permissions for your file link..."
                    className="w-full p-3 bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] text-[var(--crm-heading)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation Bar */}
      <div className="p-4 sm:p-5 border-t border-[var(--crm-card-border)] bg-[var(--crm-sidebar)] rounded-b-2xl flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentIdx === 0}
          className={`px-4 py-2 bg-[var(--crm-card)] border border-[var(--crm-card-border)] text-[var(--crm-heading)] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
            currentIdx === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[var(--crm-card)]'
          }`}
        >
          <ChevronLeft size={16} /> Previous
        </button>

        <div className="flex items-center gap-2">
          {currentIdx < totalSteps - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCompleteAssessment}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Send size={15} /> Submit Assessment
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
