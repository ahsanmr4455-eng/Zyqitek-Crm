import React, { useState } from 'react';
import { PreHiringQuestion, QuestionDifficulty, QuestionType } from '../types';
import { PRE_HIRING_SERVICES, INITIAL_QUESTION_BANK } from '../data/questionBank';
import { Search, Plus, Edit2, Trash2, Copy, CheckCircle2, XCircle, Brain, Filter, ShieldCheck, RefreshCw } from 'lucide-react';
import { generateUniqueId } from '../utils';

interface Props {
  questions: PreHiringQuestion[];
  onSave: (q: PreHiringQuestion) => void;
  onDelete: (id: string) => void;
}

export default function PreHiringQuestionBank({ questions, onSave, onDelete }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterService, setFilterService] = useState('All');
  const [filterDifficulty, setFilterDifficulty] = useState('All');
  const [editingQuestion, setEditingQuestion] = useState<PreHiringQuestion | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<PreHiringQuestion>>({});
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSeedQuestions = async () => {
    if (!window.confirm(`This will populate the question bank with default technical assessment questions (${INITIAL_QUESTION_BANK.length} total questions). Proceed?`)) return;
    
    setIsSeeding(true);
    try {
      for (const q of INITIAL_QUESTION_BANK) {
        const newQ: PreHiringQuestion = {
          id: generateUniqueId('q_seed'),
          service: q.service || PRE_HIRING_SERVICES[0],
          difficulty: (q.difficulty as QuestionDifficulty) || 'Basic',
          type: (q.type as QuestionType) || 'Short Answer',
          question: q.question || '',
          options: q.options,
          correctAnswer: q.correctAnswer,
          expectedAnswer: q.expectedAnswer,
          evaluationNotes: q.evaluationNotes,
          instructions: q.instructions,
          points: q.points || (q.difficulty === 'Basic' ? 1 : q.difficulty === 'Intermediate' ? 2 : q.difficulty === 'Advanced' ? 3 : 4),
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        onSave(newQ);
      }
      alert('Default question bank synchronized successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to seed questions.');
    } finally {
      setIsSeeding(false);
    }
  };

  const filtered = questions.filter(q => {
    const matchSearch = q.question.toLowerCase().includes(searchTerm.toLowerCase());
    const matchService = filterService === 'All' || q.service === filterService;
    const matchDiff = filterDifficulty === 'All' || q.difficulty === filterDifficulty || (filterDifficulty === 'Pro' && q.difficulty === 'Professional');
    return matchSearch && matchService && matchDiff;
  });

  const handleEdit = (q: PreHiringQuestion) => {
    setEditingQuestion(q);
    setFormData({ ...q });
    setIsAdding(true);
  };

  const handleDuplicate = (q: PreHiringQuestion) => {
    const dupQ: PreHiringQuestion = {
      ...q,
      id: generateUniqueId('q_dup'),
      question: `${q.question} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    onSave(dupQ);
  };

  const handleAddNew = () => {
    setEditingQuestion(null);
    setFormData({
      service: filterService !== 'All' ? filterService : PRE_HIRING_SERVICES[0],
      difficulty: 'Basic',
      type: 'Multiple Choice',
      points: 1,
      isActive: true,
      options: ['', '', '', '']
    });
    setIsAdding(true);
  };

  const handleSave = () => {
    if (!formData.question || !formData.service) {
      return alert("Question text and Service category are required.");
    }
    
    const defaultPts = formData.difficulty === 'Basic' ? 1 : formData.difficulty === 'Intermediate' ? 2 : formData.difficulty === 'Advanced' ? 3 : 4;

    const newQ: PreHiringQuestion = {
      ...(editingQuestion || {
        id: generateUniqueId('q_manual'),
        createdAt: new Date().toISOString()
      }),
      service: formData.service || PRE_HIRING_SERVICES[0],
      skillCategory: formData.skillCategory,
      difficulty: (formData.difficulty as QuestionDifficulty) || 'Basic',
      type: (formData.type as QuestionType) || 'Short Answer',
      question: formData.question,
      questionRomanUrdu: formData.questionRomanUrdu,
      options: formData.type === 'Multiple Choice' ? formData.options?.filter(o => o.trim().length > 0) : undefined,
      optionsRomanUrdu: formData.type === 'Multiple Choice' ? formData.optionsRomanUrdu?.filter(o => o && o.trim().length > 0) : undefined,
      correctAnswer: formData.correctAnswer,
      expectedAnswer: formData.expectedAnswer,
      explanationRomanUrdu: formData.explanationRomanUrdu,
      evaluationNotes: formData.evaluationNotes,
      instructions: formData.instructions,
      points: Number(formData.points) || defaultPts,
      isActive: formData.isActive ?? true,
      updatedAt: new Date().toISOString()
    };
    
    onSave(newQ);
    setIsAdding(false);
    setEditingQuestion(null);
  };

  if (isAdding) {
    return (
      <div className="bg-[var(--crm-card)] rounded-2xl shadow-xs border border-[var(--crm-card-border)] p-6 md:p-8 max-w-3xl mx-auto space-y-6">
        <div className="border-b border-[var(--crm-card-border)] pb-4">
          <h3 className="text-lg font-semibold text-[var(--crm-heading)]">
            {editingQuestion ? 'Edit Interview Question' : 'Create New Assessment Question'}
          </h3>
          <p className="text-xs text-[var(--crm-subtitle)] mt-0.5">
            Define question attributes, rubric answers, and evaluation scoring.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--crm-text)] mb-1">
              Service Domain *
            </label>
            <select 
              value={formData.service} 
              onChange={e => setFormData({...formData, service: e.target.value})} 
              className="w-full px-3 py-2 bg-[var(--crm-card)] border border-[var(--crm-card-border)] text-[var(--crm-heading)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none font-semibold"
            >
              {PRE_HIRING_SERVICES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--crm-text)] mb-1">
              Difficulty Level *
            </label>
            <select 
              value={formData.difficulty} 
              onChange={e => {
                const diff = e.target.value as QuestionDifficulty;
                const pts = diff === 'Basic' ? 1 : diff === 'Intermediate' ? 2 : diff === 'Advanced' ? 3 : 4;
                setFormData({...formData, difficulty: diff, points: pts});
              }} 
              className="w-full px-3 py-2 bg-[var(--crm-card)] border border-[var(--crm-card-border)] text-[var(--crm-heading)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none font-semibold"
            >
              <option value="Basic">Level 1 — Basic (1 Pt)</option>
              <option value="Intermediate">Level 2 — Intermediate (2 Pts)</option>
              <option value="Advanced">Level 3 — Advanced (3 Pts)</option>
              <option value="Pro">Level 4 — Pro (4 Pts)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--crm-text)] mb-1">
              Question Format *
            </label>
            <select 
              value={formData.type} 
              onChange={e => setFormData({...formData, type: e.target.value as QuestionType})} 
              className="w-full px-3 py-2 bg-[var(--crm-card)] border border-[var(--crm-card-border)] text-[var(--crm-heading)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none font-semibold"
            >
              <option value="Multiple Choice">Multiple Choice (MCQ)</option>
              <option value="Short Answer">Short Answer</option>
              <option value="Scenario">Scenario-Based</option>
              <option value="Problem Solving">Problem Solving</option>
              <option value="Technical">Technical Execution</option>
              <option value="Practical">Practical File/Link Task</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--crm-text)] mb-1">
              Question Points Value
            </label>
            <input 
              type="number" 
              min="1" 
              max="10" 
              value={formData.points} 
              onChange={e => setFormData({...formData, points: Number(e.target.value)})} 
              className="w-full px-3 py-2 bg-[var(--crm-card)] border border-[var(--crm-card-border)] text-[var(--crm-heading)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none font-semibold" 
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-[var(--crm-text)] mb-1">
              Question Text (English) *
            </label>
            <textarea 
              rows={3} 
              value={formData.question || ''} 
              onChange={e => setFormData({...formData, question: e.target.value})} 
              placeholder="e.g. What is the difference between raster and vector graphics, and when would you use each?"
              className="w-full p-3 bg-[var(--crm-card)] border border-[var(--crm-card-border)] text-[var(--crm-heading)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed font-medium"
            ></textarea>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-indigo-400 mb-1">
              Question Text (Roman Urdu Translation)
            </label>
            <textarea 
              rows={2} 
              value={formData.questionRomanUrdu || ''} 
              onChange={e => setFormData({...formData, questionRomanUrdu: e.target.value})} 
              placeholder="e.g. Raster aur vector graphics mein kya farq hai, aur aap inko kab istemal karenge?"
              className="w-full p-3 bg-[var(--crm-card)] border border-indigo-500/20 text-[var(--crm-heading)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed font-medium"
            ></textarea>
          </div>

          {/* Multiple Choice Options */}
          {formData.type === 'Multiple Choice' && (
            <div className="md:col-span-2 space-y-3 bg-[var(--crm-card)] p-4 rounded-xl border border-[var(--crm-card-border)]">
              <label className="block text-xs font-semibold text-[var(--crm-heading)]">Multiple Choice Options (English & Roman Urdu)</label>
              {(formData.options || ['', '', '', '']).map((opt, i) => (
                <div key={i} className="space-y-1 bg-[var(--crm-sidebar)] p-3 rounded-xl border border-[var(--crm-card-border)]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[var(--crm-text-secondary)] font-semibold w-4">
                      {String.fromCharCode(65 + i)}.
                    </span>
                    <input
                      type="text"
                      value={opt}
                      onChange={e => {
                        const newOpts = [...(formData.options || ['', '', '', ''])];
                        newOpts[i] = e.target.value;
                        setFormData({ ...formData, options: newOpts });
                      }}
                      placeholder={`Option ${i + 1} (English)`}
                      className="flex-1 px-3 py-1.5 bg-[var(--crm-card)] border border-[var(--crm-card-border)] text-[var(--crm-heading)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, correctAnswer: opt })}
                      className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg border transition-all cursor-pointer ${
                        formData.correctAnswer === opt && opt.trim() !== ''
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-[var(--crm-card)] text-[var(--crm-text-secondary)] border-[var(--crm-card-border)] hover:text-[var(--crm-heading)]'
                      }`}
                    >
                      {formData.correctAnswer === opt && opt.trim() !== '' ? '✓ Correct Answer' : 'Set Correct'}
                    </button>
                  </div>
                  <div className="pl-6">
                    <input
                      type="text"
                      value={formData.optionsRomanUrdu?.[i] || ''}
                      onChange={e => {
                        const newRomanOpts = [...(formData.optionsRomanUrdu || ['', '', '', ''])];
                        newRomanOpts[i] = e.target.value;
                        setFormData({ ...formData, optionsRomanUrdu: newRomanOpts });
                      }}
                      placeholder={`Option ${i + 1} (Roman Urdu Translation)`}
                      className="w-full px-3 py-1 bg-[var(--crm-card)] border border-indigo-500/20 text-indigo-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Expected Answer / Rubric Reference */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-[var(--crm-text)] mb-1">
              Expected Answer / Key Concepts (For Admin Evaluators)
            </label>
            <textarea
              rows={3}
              value={formData.expectedAnswer || ''}
              onChange={e => setFormData({ ...formData, expectedAnswer: e.target.value })}
              placeholder="Outline the expected keywords, core technical principles, or solution structure evaluators should check for..."
              className="w-full p-3 bg-[var(--crm-card)] border border-[var(--crm-card-border)] text-[var(--crm-heading)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed font-medium"
            ></textarea>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-indigo-400 mb-1">
              Answer Explanation (Roman Urdu)
            </label>
            <textarea
              rows={2}
              value={formData.explanationRomanUrdu || ''}
              onChange={e => setFormData({ ...formData, explanationRomanUrdu: e.target.value })}
              placeholder="Roman Urdu explanation for candidates reviewing their results..."
              className="w-full p-3 bg-[var(--crm-card)] border border-indigo-500/20 text-[var(--crm-heading)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed font-medium"
            ></textarea>
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-xs text-[var(--crm-text)] cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive ?? true}
                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-semibold text-[var(--crm-heading)]">Enable Question in Active Bank</span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--crm-card-border)]">
          <button
            type="button"
            onClick={() => { setIsAdding(false); setEditingQuestion(null); }}
            className="px-4 py-2 bg-[var(--crm-card)] border border-[var(--crm-card-border)] text-[var(--crm-heading)] rounded-xl text-xs font-semibold hover:bg-[var(--crm-card)] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle2 size={16} /> Save Question
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Question Bank Top Bar */}
      <div className="bg-[var(--crm-card)] p-5 rounded-2xl shadow-sm border border-[var(--crm-card-border)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-[var(--crm-heading)] flex items-center gap-2">
            <Brain size={18} className="text-indigo-400" /> Technical Assessment Question Bank
          </h3>
          <p className="text-xs text-[var(--crm-subtitle)] mt-0.5">
            {filtered.length} of {questions.length} questions displayed.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {questions.length === 0 && (
            <button
              onClick={handleSeedQuestions}
              disabled={isSeeding}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw size={14} className={isSeeding ? 'animate-spin' : ''} />
              {isSeeding ? 'Syncing...' : 'Sync Default 240 Questions'}
            </button>
          )}

          <button
            onClick={handleAddNew}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={14} /> Add New Question
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[var(--crm-card)] p-4 rounded-2xl border border-[var(--crm-card-border)]">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-2.5 text-[var(--crm-text-secondary)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search questions by keyword..."
            className="w-full pl-9 pr-3 py-2 bg-[var(--crm-card)] border border-[var(--crm-card-border)] text-[var(--crm-heading)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-[var(--crm-text-muted)]"
          />
        </div>

        <div>
          <select
            value={filterService}
            onChange={e => setFilterService(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--crm-card)] border border-[var(--crm-card-border)] text-[var(--crm-heading)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none font-semibold"
          >
            <option value="All">All Services ({questions.length})</option>
            {PRE_HIRING_SERVICES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={filterDifficulty}
            onChange={e => setFilterDifficulty(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--crm-card)] border border-[var(--crm-card-border)] text-[var(--crm-heading)] rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none font-semibold"
          >
            <option value="All">All Difficulty Levels</option>
            <option value="Basic">Level 1 — Basic</option>
            <option value="Intermediate">Level 2 — Intermediate</option>
            <option value="Advanced">Level 3 — Advanced</option>
            <option value="Pro">Level 4 — Pro</option>
          </select>
        </div>
      </div>

      {/* Question Cards List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-[var(--crm-card)] rounded-2xl p-12 text-center border border-[var(--crm-card-border)] space-y-3">
            <p className="text-xs text-[var(--crm-subtitle)] font-semibold">
              No questions found matching your filter criteria.
            </p>
            {questions.length === 0 && (
              <button
                onClick={handleSeedQuestions}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Populate 240 Default Service Questions
              </button>
            )}
          </div>
        ) : (
          filtered.map((q, idx) => (
            <div
              key={q.id || idx}
              className="bg-[var(--crm-card)] p-4 sm:p-5 rounded-2xl border border-[var(--crm-card-border)] hover:border-indigo-500/30 transition-all space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--crm-card-border)] pb-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-[var(--crm-text-secondary)]">#{idx + 1}</span>
                  <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                    {q.service}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
                    q.difficulty === 'Basic' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    q.difficulty === 'Intermediate' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    q.difficulty === 'Advanced' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                    'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    {q.difficulty}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--crm-card)] text-[var(--crm-text)] border border-[var(--crm-card-border)]">
                    {q.type}
                  </span>
                  <span className="text-xs font-semibold text-[var(--crm-text-secondary)]">
                    {q.points || 1} {q.points === 1 ? 'pt' : 'pts'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDuplicate(q)}
                    className="p-1.5 text-[var(--crm-text-secondary)] hover:text-indigo-400 hover:bg-[var(--crm-card)] rounded-lg transition-colors cursor-pointer"
                    title="Duplicate Question"
                  >
                    <Copy size={15} />
                  </button>
                  <button
                    onClick={() => handleEdit(q)}
                    className="p-1.5 text-[var(--crm-text-secondary)] hover:text-indigo-400 hover:bg-[var(--crm-card)] rounded-lg transition-colors cursor-pointer"
                    title="Edit Question"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => onDelete(q.id)}
                    className="p-1.5 text-[var(--crm-text-secondary)] hover:text-rose-400 hover:bg-[var(--crm-card)] rounded-lg transition-colors cursor-pointer"
                    title="Delete Question"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <p className="text-xs font-semibold text-[var(--crm-heading)] leading-relaxed">
                {q.question}
              </p>

              {q.type === 'Multiple Choice' && q.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {q.options.map((opt, i) => (
                    <div
                      key={i}
                      className={`px-3 py-1.5 rounded-xl border text-[11px] font-semibold ${
                        q.correctAnswer === opt
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-semibold'
                          : 'bg-[var(--crm-sidebar)] border-[var(--crm-card-border)] text-[var(--crm-text)]'
                      }`}
                    >
                      <span className="font-mono opacity-60 mr-1.5">{String.fromCharCode(65 + i)}.</span>
                      {opt}
                      {q.correctAnswer === opt && <span className="ml-1 text-[10px]">✓</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
