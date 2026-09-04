import React, { useState } from 'react';
import { CallScript, EmailScript } from '../types';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  X,
  Mail,
  Phone,
  Eye,
  Calendar
} from 'lucide-react';

interface ScriptsAndTemplatesManagerProps {
  callScripts: CallScript[];
  emailScripts: EmailScript[];
  onAddCallScript: (script: Omit<CallScript, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  onUpdateCallScript: (script: CallScript) => Promise<boolean>;
  onDeleteCallScript: (id: string) => Promise<boolean>;
  onDuplicateCallScript?: (script: CallScript) => Promise<boolean>;
  onAddEmailScript: (script: Omit<EmailScript, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  onUpdateEmailScript: (script: EmailScript) => Promise<boolean>;
  onDeleteEmailScript: (id: string) => Promise<boolean>;
  onDuplicateEmailScript?: (script: EmailScript) => Promise<boolean>;
}

const CALL_CATEGORIES = [
  'Cold Calling',
  'Discovery / Qualification',
  'Objection Handling',
  'Closing / Demo',
  'Follow-up',
  'Custom'
];

const EMAIL_CATEGORIES = [
  'Cold Outreach',
  'Follow-up',
  'Proposal / Quote',
  'Onboarding / Welcome',
  'Re-engagement',
  'Custom'
];

export default function ScriptsAndTemplatesManager({
  callScripts,
  emailScripts,
  onAddCallScript,
  onUpdateCallScript,
  onDeleteCallScript,
  onAddEmailScript,
  onUpdateEmailScript,
  onDeleteEmailScript
}: ScriptsAndTemplatesManagerProps) {
  // Active Tab inside Scripts & Templates
  const [activeTab, setActiveTab] = useState<'call' | 'email'>('call');

  // Search & Category Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modal states for Call Scripts
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [editingCallScript, setEditingCallScript] = useState<CallScript | null>(null);
  const [viewingCallScript, setViewingCallScript] = useState<CallScript | null>(null);
  const [callToDelete, setCallToDelete] = useState<CallScript | null>(null);

  const [callForm, setCallForm] = useState({
    title: '',
    category: 'Discovery / Qualification',
    content: ''
  });

  // Modal states for Email Scripts
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [editingEmailScript, setEditingEmailScript] = useState<EmailScript | null>(null);
  const [viewingEmailScript, setViewingEmailScript] = useState<EmailScript | null>(null);
  const [emailToDelete, setEmailToDelete] = useState<EmailScript | null>(null);

  const [emailForm, setEmailForm] = useState({
    templateName: '',
    subject: '',
    category: 'Cold Outreach',
    body: ''
  });

  const [isSaving, setIsSaving] = useState(false);

  // Filter Call Scripts
  const filteredCallScripts = callScripts.filter(script => {
    const matchesSearch =
      script.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (script.description && script.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      script.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || script.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Filter Email Scripts
  const filteredEmailScripts = emailScripts.filter(script => {
    const matchesSearch =
      script.templateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      script.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      script.body.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || script.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Open Call Script Form
  const handleOpenCallForm = (script?: CallScript) => {
    if (script) {
      setEditingCallScript(script);
      setCallForm({
        title: script.title,
        category: script.category || 'Discovery / Qualification',
        content: script.content
      });
    } else {
      setEditingCallScript(null);
      setCallForm({
        title: '',
        category: 'Discovery / Qualification',
        content: ''
      });
    }
    setIsCallModalOpen(true);
  };

  // Save Call Script
  const handleSaveCallScript = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callForm.title.trim() || !callForm.content.trim()) return;

    setIsSaving(true);
    try {
      if (editingCallScript) {
        await onUpdateCallScript({
          ...editingCallScript,
          title: callForm.title.trim(),
          category: callForm.category,
          content: callForm.content.trim(),
          updatedAt: new Date().toISOString()
        });
      } else {
        await onAddCallScript({
          title: callForm.title.trim(),
          description: '',
          category: callForm.category,
          status: 'Active',
          content: callForm.content.trim()
        });
      }
      setIsCallModalOpen(false);
    } catch (err) {
      console.error('Error saving call script:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Open Email Script Form
  const handleOpenEmailForm = (script?: EmailScript) => {
    if (script) {
      setEditingEmailScript(script);
      setEmailForm({
        templateName: script.templateName,
        subject: script.subject || '',
        category: script.category || 'Cold Outreach',
        body: script.body
      });
    } else {
      setEditingEmailScript(null);
      setEmailForm({
        templateName: '',
        subject: '',
        category: 'Cold Outreach',
        body: ''
      });
    }
    setIsEmailModalOpen(true);
  };

  // Save Email Script
  const handleSaveEmailScript = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailForm.templateName.trim() || !emailForm.subject.trim() || !emailForm.body.trim()) return;

    setIsSaving(true);
    try {
      if (editingEmailScript) {
        await onUpdateEmailScript({
          ...editingEmailScript,
          templateName: emailForm.templateName.trim(),
          subject: emailForm.subject.trim(),
          category: emailForm.category,
          body: emailForm.body.trim(),
          updatedAt: new Date().toISOString()
        });
      } else {
        await onAddEmailScript({
          templateName: emailForm.templateName.trim(),
          subject: emailForm.subject.trim(),
          category: emailForm.category,
          status: 'Active',
          body: emailForm.body.trim()
        });
      }
      setIsEmailModalOpen(false);
    } catch (err) {
      console.error('Error saving email template:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-5">
      {/* Subtabs: [ Call Scripts ] [ Email Scripts ] & Action Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] pb-3">
        <div className="flex items-center gap-1.5 bg-[var(--crm-sidebar)] p-1 rounded-xl border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)]">
          <button
            onClick={() => {
              setActiveTab('call');
              setCategoryFilter('All');
              setSearchTerm('');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'call'
                ? 'bg-[var(--crm-card)] dark:bg-[var(--crm-card)] text-indigo-700 shadow-xs border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)]/80 dark:border-[var(--crm-card-border)]/80'
                : 'text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)] text-[var(--crm-text)]'
            }`}
          >
            <Phone size={14} className={activeTab === 'call' ? 'text-indigo-600' : 'text-[var(--crm-text-muted)] '} />
            <span>Call Scripts</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('email');
              setCategoryFilter('All');
              setSearchTerm('');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'email'
                ? 'bg-[var(--crm-card)] dark:bg-[var(--crm-card)] text-indigo-700 shadow-xs border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)]/80 dark:border-[var(--crm-card-border)]/80'
                : 'text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)] text-[var(--crm-text)]'
            }`}
          >
            <Mail size={14} className={activeTab === 'email' ? 'text-indigo-600' : 'text-[var(--crm-text-muted)] '} />
            <span>Email Scripts</span>
          </button>
        </div>

        {/* Action Button */}
        {activeTab === 'call' ? (
          <button
            onClick={() => handleOpenCallForm()}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition-all cursor-pointer shadow-xs"
          >
            <Plus size={15} />
            <span>Add Call Script</span>
          </button>
        ) : (
          <button
            onClick={() => handleOpenEmailForm()}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition-all cursor-pointer shadow-xs"
          >
            <Plus size={15} />
            <span>Add Email Script</span>
          </button>
        )}
      </div>

      {/* Search & Category Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-[var(--crm-card)] dark:bg-[var(--crm-card)] p-3 rounded-xl border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] shadow-xs">
        <div className="sm:col-span-8 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--crm-text-muted)] " />
          <input
            type="text"
            placeholder={activeTab === 'call' ? 'Search call scripts...' : 'Search email scripts...'}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] rounded-lg text-xs text-[var(--crm-text)] font-medium focus:outline-none focus:border-[var(--crm-primary)] transition-all placeholder-[var(--crm-text-muted)]"
          />
        </div>

        <div className="sm:col-span-4">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-lg text-xs font-medium focus:outline-none focus:border-[var(--crm-primary)] cursor-pointer"
          >
            <option value="All">All Categories</option>
            {(activeTab === 'call' ? CALL_CATEGORIES : EMAIL_CATEGORIES).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* CALL SCRIPTS LIST */}
      {activeTab === 'call' && (
        <>
          {filteredCallScripts.length === 0 ? (
            <div className="text-center py-12 bg-[var(--crm-card)] dark:bg-[var(--crm-card)] rounded-xl border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] p-6 space-y-2">
              <Phone size={24} className="mx-auto text-[var(--crm-text-muted)] " />
              <p className="text-xs text-[var(--crm-subtitle)] ">No call scripts found.</p>
              <button
                onClick={() => handleOpenCallForm()}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:underline cursor-pointer"
              >
                <Plus size={14} /> Add Call Script
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 4k:grid-cols-7 5k:grid-cols-10 gap-4">
              {filteredCallScripts.map(script => (
                <div
                  key={script.id}
                  className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] rounded-xl border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] p-4 hover:border-indigo-300 transition-all shadow-2xs flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    {/* Header: Category & Status */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 border border-indigo-100 rounded text-[10px] font-medium  ">
                        {script.category || 'General'}
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 border border-emerald-200/60 rounded-full text-[10px] font-medium">
                        {script.status || 'Active'}
                      </span>
                    </div>

                    {/* Script Name */}
                    <h4 className="text-sm font-medium text-[var(--crm-text)] text-[var(--crm-text)] line-clamp-1">
                      {script.title}
                    </h4>

                    {/* Short Description */}
                    <p className="text-xs text-[var(--crm-subtitle)] line-clamp-2 leading-relaxed">
                      {script.description || script.content}
                    </p>
                  </div>

                  {/* Footer: Last Updated & Actions */}
                  <div className="pt-3 border-t border-zinc-100 dark:border-[var(--crm-card-border)] flex items-center justify-between text-xs">
                    <span className="text-[10px] text-[var(--crm-text-muted)] flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(script.updatedAt || script.createdAt)}
                    </span>

                    <div className="flex items-center gap-1">
                      {/* View Action */}
                      <button
                        onClick={() => setViewingCallScript(script)}
                        className="px-2 py-1 text-[var(--crm-text-secondary)] hover:text-indigo-600 hover:bg-indigo-50 dark:bg-indigo-500/10 rounded text-xs  flex items-center gap-1 transition-colors cursor-pointer"
                        title="View Script"
                      >
                        <Eye size={13} />
                        <span>View</span>
                      </button>

                      {/* Edit Action */}
                      <button
                        onClick={() => handleOpenCallForm(script)}
                        className="px-2 py-1 text-[var(--crm-text-secondary)] hover:text-indigo-600 hover:bg-indigo-50 dark:bg-indigo-500/10 rounded text-xs  flex items-center gap-1 transition-colors cursor-pointer"
                        title="Edit Script"
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </button>

                      {/* Delete Action */}
                      <button
                        onClick={() => setCallToDelete(script)}
                        className="px-2 py-1 text-[var(--crm-text-muted)] hover:text-rose-600 hover:bg-rose-50 dark:bg-rose-500/10 rounded text-xs  flex items-center gap-1 transition-colors cursor-pointer"
                        title="Delete Script"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* EMAIL SCRIPTS LIST */}
      {activeTab === 'email' && (
        <>
          {filteredEmailScripts.length === 0 ? (
            <div className="text-center py-12 bg-[var(--crm-card)] dark:bg-[var(--crm-card)] rounded-xl border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] p-6 space-y-2">
              <Mail size={24} className="mx-auto text-[var(--crm-text-muted)] " />
              <p className="text-xs text-[var(--crm-subtitle)] ">No email templates found.</p>
              <button
                onClick={() => handleOpenEmailForm()}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:underline cursor-pointer"
              >
                <Plus size={14} /> Add Email Script
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 4k:grid-cols-7 5k:grid-cols-10 gap-4">
              {filteredEmailScripts.map(script => (
                <div
                  key={script.id}
                  className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] rounded-xl border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] p-4 hover:border-indigo-300 transition-all shadow-2xs flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    {/* Header: Category & Status */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 border border-indigo-100 rounded text-[10px] font-medium  ">
                        {script.category || 'General'}
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 border border-emerald-200/60 rounded-full text-[10px] font-medium">
                        {script.status || 'Active'}
                      </span>
                    </div>

                    {/* Template Name */}
                    <h4 className="text-sm font-medium text-[var(--crm-text)] text-[var(--crm-text)] line-clamp-1">
                      {script.templateName}
                    </h4>

                    {/* Short Description (Subject line) */}
                    <p className="text-xs text-indigo-600  line-clamp-1">
                      Subj: {script.subject}
                    </p>

                    {/* Body Preview */}
                    <p className="text-xs text-[var(--crm-subtitle)] line-clamp-2 leading-relaxed">
                      {script.body}
                    </p>
                  </div>

                  {/* Footer: Last Updated & Actions */}
                  <div className="pt-3 border-t border-zinc-100 dark:border-[var(--crm-card-border)] flex items-center justify-between text-xs">
                    <span className="text-[10px] text-[var(--crm-text-muted)] flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(script.updatedAt || script.createdAt)}
                    </span>

                    <div className="flex items-center gap-1">
                      {/* View Action */}
                      <button
                        onClick={() => setViewingEmailScript(script)}
                        className="px-2 py-1 text-[var(--crm-text-secondary)] hover:text-indigo-600 hover:bg-indigo-50 dark:bg-indigo-500/10 rounded text-xs  flex items-center gap-1 transition-colors cursor-pointer"
                        title="View Template"
                      >
                        <Eye size={13} />
                        <span>View</span>
                      </button>

                      {/* Edit Action */}
                      <button
                        onClick={() => handleOpenEmailForm(script)}
                        className="px-2 py-1 text-[var(--crm-text-secondary)] hover:text-indigo-600 hover:bg-indigo-50 dark:bg-indigo-500/10 rounded text-xs  flex items-center gap-1 transition-colors cursor-pointer"
                        title="Edit Template"
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </button>

                      {/* Delete Action */}
                      <button
                        onClick={() => setEmailToDelete(script)}
                        className="px-2 py-1 text-[var(--crm-text-muted)] hover:text-rose-600 hover:bg-rose-50 dark:bg-rose-500/10 rounded text-xs  flex items-center gap-1 transition-colors cursor-pointer"
                        title="Delete Template"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* CALL SCRIPT EDITOR MODAL */}
      {isCallModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg 2xl:max-w-xl 3xl:max-w-2xl 4k:max-w-3xl 5k:max-w-4xl bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-zinc-100 dark:border-[var(--crm-card-border)] flex items-center justify-between bg-[var(--crm-sidebar)] ">
              <h3 className="text-sm font-medium text-[var(--crm-text)] text-[var(--crm-text)]">
                {editingCallScript ? 'Edit Call Script' : 'Add Call Script'}
              </h3>
              <button
                onClick={() => setIsCallModalOpen(false)}
                className="p-1 text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCallScript} className="p-5 space-y-4">
              {/* Script Name */}
              <div>
                <label className="block text-xs font-medium text-[var(--crm-text-secondary)] mb-1">
                  Script Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Discovery Call Pitch"
                  value={callForm.title}
                  onChange={e => setCallForm({ ...callForm, title: e.target.value })}
                  className="w-full p-2.5 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-lg text-xs font-medium text-[var(--crm-text)] text-[var(--crm-text)] focus:bg-[var(--crm-card)] focus:dark:bg-[var(--crm-card)] focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-[var(--crm-text-secondary)] mb-1">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={callForm.category}
                  onChange={e => setCallForm({ ...callForm, category: e.target.value })}
                  className="w-full p-2.5 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-lg text-xs font-medium text-[var(--crm-text)] text-[var(--crm-text)] focus:bg-[var(--crm-card)] focus:dark:bg-[var(--crm-card)] focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  {CALL_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Script Content */}
              <div>
                <label className="block text-xs font-medium text-[var(--crm-text-secondary)] mb-1">
                  Script Content <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={8}
                  placeholder="Enter script content or talking points..."
                  value={callForm.content}
                  onChange={e => setCallForm({ ...callForm, content: e.target.value })}
                  className="w-full p-2.5 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-lg text-xs font-mono text-[var(--crm-text)] text-[var(--crm-text)] focus:bg-[var(--crm-card)] focus:dark:bg-[var(--crm-card)] focus:outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-zinc-100 dark:border-[var(--crm-card-border)]">
                <button
                  type="button"
                  onClick={() => setIsCallModalOpen(false)}
                  className="px-4 py-2 bg-[var(--crm-sidebar)] hover:bg-zinc-200 text-[var(--crm-text-secondary)] rounded-lg text-xs  transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Script'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EMAIL SCRIPT EDITOR MODAL */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg 2xl:max-w-xl 3xl:max-w-2xl 4k:max-w-3xl 5k:max-w-4xl bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-zinc-100 dark:border-[var(--crm-card-border)] flex items-center justify-between bg-[var(--crm-sidebar)] ">
              <h3 className="text-sm font-medium text-[var(--crm-text)] text-[var(--crm-text)]">
                {editingEmailScript ? 'Edit Email Script' : 'Add Email Script'}
              </h3>
              <button
                onClick={() => setIsEmailModalOpen(false)}
                className="p-1 text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEmailScript} className="p-5 space-y-4">
              {/* Template Name */}
              <div>
                <label className="block text-xs font-medium text-[var(--crm-text-secondary)] mb-1">
                  Template Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Initial Cold Outreach"
                  value={emailForm.templateName}
                  onChange={e => setEmailForm({ ...emailForm, templateName: e.target.value })}
                  className="w-full p-2.5 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-lg text-xs font-medium text-[var(--crm-text)] text-[var(--crm-text)] focus:bg-[var(--crm-card)] focus:dark:bg-[var(--crm-card)] focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-medium text-[var(--crm-text-secondary)] mb-1">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={emailForm.category}
                  onChange={e => setEmailForm({ ...emailForm, category: e.target.value })}
                  className="w-full p-2.5 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-lg text-xs font-medium text-[var(--crm-text)] text-[var(--crm-text)] focus:bg-[var(--crm-card)] focus:dark:bg-[var(--crm-card)] focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  {EMAIL_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Email Subject */}
              <div>
                <label className="block text-xs font-medium text-[var(--crm-text-secondary)] mb-1">
                  Email Subject <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Quick question regarding {Company_Name}"
                  value={emailForm.subject}
                  onChange={e => setEmailForm({ ...emailForm, subject: e.target.value })}
                  className="w-full p-2.5 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-lg text-xs font-medium text-[var(--crm-text)] text-[var(--crm-text)] focus:bg-[var(--crm-card)] focus:dark:bg-[var(--crm-card)] focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Email Body */}
              <div>
                <label className="block text-xs font-medium text-[var(--crm-text-secondary)] mb-1">
                  Email Body <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={8}
                  placeholder="Write template email body..."
                  value={emailForm.body}
                  onChange={e => setEmailForm({ ...emailForm, body: e.target.value })}
                  className="w-full p-2.5 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-lg text-xs font-sans text-[var(--crm-text)] text-[var(--crm-text)] focus:bg-[var(--crm-card)] focus:dark:bg-[var(--crm-card)] focus:outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-zinc-100 dark:border-[var(--crm-card-border)]">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="px-4 py-2 bg-[var(--crm-sidebar)] hover:bg-zinc-200 text-[var(--crm-text-secondary)] rounded-lg text-xs  transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW CALL SCRIPT MODAL */}
      {viewingCallScript && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg 2xl:max-w-xl 3xl:max-w-2xl 4k:max-w-3xl 5k:max-w-4xl bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-zinc-100 dark:border-[var(--crm-card-border)] flex items-center justify-between bg-[var(--crm-sidebar)] ">
              <div>
                <h3 className="text-sm font-medium text-[var(--crm-text)] text-[var(--crm-text)]">{viewingCallScript.title}</h3>
                <span className="text-[10px] font-medium text-indigo-700 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded  mt-0.5 inline-block">
                  {viewingCallScript.category}
                </span>
              </div>
              <button onClick={() => setViewingCallScript(null)} className="p-1 text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-[65vh] overflow-y-auto">
              {viewingCallScript.description && (
                <p className="text-xs text-[var(--crm-subtitle)] italic">{viewingCallScript.description}</p>
              )}
              <div className="p-3 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-lg font-mono text-xs text-[var(--crm-text)] leading-relaxed whitespace-pre-wrap">
                {viewingCallScript.content}
              </div>
            </div>

            <div className="p-3 border-t border-zinc-100 dark:border-[var(--crm-card-border)] bg-[var(--crm-sidebar)] flex justify-end">
              <button
                onClick={() => setViewingCallScript(null)}
                className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-[var(--crm-text)] rounded-lg text-xs font-medium transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW EMAIL SCRIPT MODAL */}
      {viewingEmailScript && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg 2xl:max-w-xl 3xl:max-w-2xl 4k:max-w-3xl 5k:max-w-4xl bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-zinc-100 dark:border-[var(--crm-card-border)] flex items-center justify-between bg-[var(--crm-sidebar)] ">
              <div>
                <h3 className="text-sm font-medium text-[var(--crm-text)] text-[var(--crm-text)]">{viewingEmailScript.templateName}</h3>
                <span className="text-[10px] font-medium text-indigo-700 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded  mt-0.5 inline-block">
                  {viewingEmailScript.category}
                </span>
              </div>
              <button onClick={() => setViewingEmailScript(null)} className="p-1 text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-[65vh] overflow-y-auto">
              <div className="p-2.5 bg-indigo-50/60 dark:bg-indigo-500/10 border border-indigo-100 rounded-lg">
                <span className="text-[10px] font-medium text-indigo-500  block">Subject</span>
                <p className="text-xs  text-indigo-900">{viewingEmailScript.subject}</p>
              </div>

              <div className="p-3 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-lg text-xs text-[var(--crm-text)] leading-relaxed whitespace-pre-wrap">
                {viewingEmailScript.body}
              </div>
            </div>

            <div className="p-3 border-t border-zinc-100 dark:border-[var(--crm-card-border)] bg-[var(--crm-sidebar)] flex justify-end">
              <button
                onClick={() => setViewingEmailScript(null)}
                className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-[var(--crm-text)] rounded-lg text-xs font-medium transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODALS */}
      {callToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] rounded-2xl border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] max-w-sm w-full p-5 space-y-3 shadow-2xl">
            <h3 className="text-sm font-medium text-[var(--crm-text)] text-[var(--crm-text)]">Delete Call Script</h3>
            <p className="text-xs text-[var(--crm-subtitle)]">
              Are you sure you want to delete <strong>"{callToDelete.title}"</strong>?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCallToDelete(null)}
                className="px-3 py-1.5 bg-[var(--crm-sidebar)] hover:bg-zinc-200 text-[var(--crm-text-secondary)] rounded-lg text-xs  cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onDeleteCallScript(callToDelete.id);
                  setCallToDelete(null);
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {emailToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] rounded-2xl border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] max-w-sm w-full p-5 space-y-3 shadow-2xl">
            <h3 className="text-sm font-medium text-[var(--crm-text)] text-[var(--crm-text)]">Delete Email Script</h3>
            <p className="text-xs text-[var(--crm-subtitle)]">
              Are you sure you want to delete <strong>"{emailToDelete.templateName}"</strong>?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEmailToDelete(null)}
                className="px-3 py-1.5 bg-[var(--crm-sidebar)] hover:bg-zinc-200 text-[var(--crm-text-secondary)] rounded-lg text-xs  cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onDeleteEmailScript(emailToDelete.id);
                  setEmailToDelete(null);
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
