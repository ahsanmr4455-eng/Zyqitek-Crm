import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Mail, Phone, Calendar, Building2, Globe, ExternalLink, 
  User, Briefcase, Clock, FileText, Sliders, ArrowUpRight, 
  Instagram, Facebook, Linkedin, CheckCircle2, MessageCircle, 
  DollarSign, Pencil, Trash2, Copy, Check, Award, Users, 
  Tag, ChevronDown, Plus, Sparkles, Layers, ArrowRight
} from 'lucide-react';
import { Lead, TeamMember, EmailDiscussion, CallDiscussion, ConversationDiscussion } from '../types';

interface LeadProfileCardProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  teamMembers?: TeamMember[];
  emailDiscussions?: EmailDiscussion[];
  callDiscussions?: CallDiscussion[];
  conversationDiscussions?: ConversationDiscussion[];
  onUpdateLead?: (updatedLead: Lead) => void;
  onEdit?: () => void;
  onDelete?: (id: string) => void;
}

export default function LeadProfileCard({
  isOpen,
  onClose,
  lead,
  teamMembers = [],
  emailDiscussions = [],
  callDiscussions = [],
  conversationDiscussions = [],
  onUpdateLead,
  onEdit,
  onDelete
}: LeadProfileCardProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'notes' | 'customFields'>('timeline');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Quick Action Modals
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);

  const [followUpInputDate, setFollowUpInputDate] = useState('');
  const [meetingInputDate, setMeetingInputDate] = useState('');
  const [meetingInputTitle, setMeetingInputTitle] = useState('');
  const [noteInputText, setNoteInputText] = useState('');

  // Status dropdown toggle
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getInitials = (name: string) => {
    if (!name) return 'LD';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr || dateStr === 'N/A' || dateStr.trim() === '') return 'Not available';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

  const rawLeadId = (lead?.id || '').replace(/^lead[-_]?/i, '');
  const leadIdLabel = `LEAD #${rawLeadId ? rawLeadId.toUpperCase() : '001'}`;

  // Find assigned member
  const assignedMember = useMemo(() => {
    if (!lead?.assignedTeamMember) return null;
    return teamMembers.find(t => t.id === lead.assignedTeamMember) || null;
  }, [lead?.assignedTeamMember, teamMembers]);

  // Social Links
  const socialLinks = useMemo(() => {
    const list: Array<{ label: string; url: string; icon: React.ReactNode; color: string }> = [];
    if (lead?.websiteUrl) list.push({ label: 'Website', url: lead.websiteUrl, icon: <Globe size={11} />, color: 'hover:text-blue-500 hover:border-blue-300' });
    if (lead?.linkedinLink) list.push({ label: 'LinkedIn', url: lead.linkedinLink, icon: <Linkedin size={11} />, color: 'hover:text-sky-600 hover:border-sky-300' });
    if (lead?.instagramLink) list.push({ label: 'Instagram', url: lead.instagramLink, icon: <Instagram size={11} />, color: 'hover:text-pink-600 hover:border-pink-300' });
    if (lead?.facebookLink) list.push({ label: 'Facebook', url: lead.facebookLink, icon: <Facebook size={11} />, color: 'hover:text-blue-600 hover:border-blue-300' });
    if (lead?.otherLink) list.push({ label: 'Link', url: lead.otherLink, icon: <ExternalLink size={11} />, color: 'hover:text-indigo-600 hover:border-indigo-300' });
    return list;
  }, [lead]);

  const handleOpenLink = (url?: string) => {
    if (!url) return;
    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  // Discussions and Activity Timeline
  const activityTimeline = useMemo(() => {
    if (!isOpen || !lead) return [];
    const events: Array<{
      id: string;
      type: 'created' | 'discussion' | 'status_change';
      date: string;
      title: string;
      description: string;
      iconType: 'plus' | 'message' | 'stage';
      discussionType?: string;
    }> = [];

    // Matched Discussions
    const nameToMatch = (lead.name || '').toLowerCase();
    const companyToMatch = (lead.company || '').toLowerCase();

    emailDiscussions.filter(disc => 
      (disc.clientName || '').toLowerCase() === nameToMatch ||
      (companyToMatch && (disc.clientName || '').toLowerCase() === companyToMatch)
    ).forEach(email => {
      events.push({
        id: `email-${email.id}`,
        type: 'discussion',
        date: email.date || '',
        title: `Email: ${email.subject || 'Logged Email'}`,
        description: email.content ? (email.content.length > 80 ? email.content.substring(0, 80) + '...' : email.content) : 'No email text content.',
        iconType: 'message',
        discussionType: 'Email'
      });
    });

    callDiscussions.filter(disc => 
      (disc.clientName || '').toLowerCase() === nameToMatch ||
      (companyToMatch && (disc.clientName || '').toLowerCase() === companyToMatch)
    ).forEach(call => {
      events.push({
        id: `call-${call.id}`,
        type: 'discussion',
        date: call.callDate || '',
        title: `Call: ${call.duration ? `(${call.duration})` : 'Connected'}`,
        description: call.summary ? (call.summary.length > 80 ? call.summary.substring(0, 80) + '...' : call.summary) : 'No call logs recorded.',
        iconType: 'message',
        discussionType: 'Call'
      });
    });

    conversationDiscussions.filter(disc => 
      (disc.leadName || '').toLowerCase() === nameToMatch ||
      (companyToMatch && (disc.company || '').toLowerCase() === companyToMatch) ||
      disc.leadId === lead.id
    ).forEach(conv => {
      events.push({
        id: `conv-${conv.id}`,
        type: 'discussion',
        date: conv.date && conv.time ? `${conv.date}T${conv.time}` : conv.date || '',
        title: conv.discussionTitle || 'Conversation Logged',
        description: conv.conversationSummary ? (conv.conversationSummary.length > 80 ? conv.conversationSummary.substring(0, 80) + '...' : conv.conversationSummary) : 'No conversation notes recorded.',
        iconType: 'message',
        discussionType: conv.notes?.startsWith('[') && conv.notes?.includes(']') ? conv.notes.substring(1, conv.notes.indexOf(']')) : 'Conversation'
      });
    });

    // Registered creation event
    events.push({
      id: `create-${lead.id}`,
      type: 'created',
      date: lead.createdAt || new Date().toISOString(),
      title: 'Lead Captured',
      description: `Registered in CRM via ${lead.source || 'Direct Entry'}.`,
      iconType: 'plus',
    });

    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [isOpen, lead, emailDiscussions, callDiscussions, conversationDiscussions]);

  const handleQuickAction = (action: 'call' | 'whatsapp' | 'email') => {
    if (!lead || !onUpdateLead) return;
    const act = lead.leadActivity || {};
    const updatedAct = { ...act };
    if (action === 'call') {
      updatedAct.callStatus = 'Completed';
      updatedAct.totalCalls = (updatedAct.totalCalls || 0) + 1;
      updatedAct.lastContactAt = new Date().toISOString();
    } else if (action === 'whatsapp') {
      updatedAct.whatsappStatus = 'Sent';
      updatedAct.totalWhatsapp = (updatedAct.totalWhatsapp || 0) + 1;
      updatedAct.lastContactAt = new Date().toISOString();
    } else if (action === 'email') {
      updatedAct.emailStatus = 'Sent';
      updatedAct.totalEmails = (updatedAct.totalEmails || 0) + 1;
      updatedAct.lastContactAt = new Date().toISOString();
    }
    updatedAct.lastActivityAt = new Date().toISOString();
    onUpdateLead({
      ...lead,
      leadActivity: updatedAct,
      updatedAt: new Date().toISOString()
    });
  };

  const handleUpdateStatus = (newStatus: Lead['status']) => {
    if (!lead || !onUpdateLead) return;
    setIsStatusDropdownOpen(false);
    onUpdateLead({
      ...lead,
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
  };

  const handleSaveFollowUp = () => {
    if (!lead || !onUpdateLead || !followUpInputDate) return;
    const act = lead.leadActivity || {};
    const updatedAct = {
      ...act,
      followUpStatus: 'Scheduled' as const,
      followUpDate: followUpInputDate,
      lastActivityAt: new Date().toISOString()
    };
    onUpdateLead({
      ...lead,
      status: lead.status === 'New' ? 'Follow Up' : lead.status,
      leadActivity: updatedAct,
      updatedAt: new Date().toISOString()
    });
    setFollowUpInputDate('');
    setShowFollowUpModal(false);
  };

  const handleSaveMeeting = () => {
    if (!lead || !onUpdateLead || !meetingInputDate) return;
    const act = lead.leadActivity || {};
    const updatedAct = {
      ...act,
      meetingStatus: 'Scheduled' as const,
      lastActivityAt: new Date().toISOString(),
      communicationNotes: (act.communicationNotes ? act.communicationNotes + '\n' : '') + `Meeting Scheduled: ${meetingInputTitle || 'Lead Discussion'} on ${meetingInputDate}`
    };
    onUpdateLead({
      ...lead,
      leadActivity: updatedAct,
      updatedAt: new Date().toISOString()
    });
    setMeetingInputDate('');
    setMeetingInputTitle('');
    setShowMeetingModal(false);
  };

  const handleSaveNote = () => {
    if (!lead || !onUpdateLead || !noteInputText.trim()) return;
    const act = lead.leadActivity || {};
    const updatedAct = {
      ...act,
      lastActivityAt: new Date().toISOString(),
      communicationNotes: (act.communicationNotes ? act.communicationNotes + '\n' : '') + `[${new Date().toLocaleDateString()}] ${noteInputText.trim()}`
    };
    onUpdateLead({
      ...lead,
      leadActivity: updatedAct,
      updatedAt: new Date().toISOString()
    });
    setNoteInputText('');
    setShowNoteModal(false);
  };

  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    'New': { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20' },
    'Contacted': { bg: 'bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/20' },
    'Follow Up': { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20' },
    'Qualified': { bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/20' },
    'Proposal': { bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/20' },
    'Converted': { bg: 'bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-500/20' },
    'Closed': { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/20' },
    'Lost': { bg: 'bg-zinc-500/10', text: 'text-zinc-500 dark:text-zinc-400', border: 'border-zinc-500/20' }
  };

  const currentStatusStyle = statusColors[lead?.status || 'New'] || statusColors['New'];

  const customFieldsCount = lead?.customFields ? Object.keys(lead.customFields).filter(k => lead.customFields?.[k] !== '' && lead.customFields?.[k] !== null && lead.customFields?.[k] !== undefined).length : 0;

  if (!isOpen || !lead) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-hidden"
        onClick={onClose}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 8 }}
          transition={{ type: "spring", stiffness: 450, damping: 32 }}
          className="bg-[var(--crm-card)] rounded-2xl shadow-2xl border border-[var(--crm-card-border)] max-w-4xl lg:max-w-5xl 2xl:max-w-6xl 3xl:max-w-7xl 4k:max-w-[2000px] 5k:max-w-[3000px] 3xl:max-w-[1400px] 4k:max-w-[1800px] 5k:max-w-[2400px] w-full overflow-hidden text-[var(--crm-text)] flex flex-col max-h-[92vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 1. Compact Header (Above the Fold) */}
          <div className="px-4 py-3.5 sm:px-5 sm:py-4 border-b border-[var(--crm-card-border)] bg-[var(--crm-card)] flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              {/* Avatar + Title + Identifiers */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-11 w-11 rounded-xl bg-zinc-900 dark:bg-zinc-800 text-white flex items-center justify-center text-sm font-semibold shadow-xs shrink-0 border border-[var(--crm-card-border)]">
                  {getInitials(lead.name)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    {/* Lead ID badge with Copy action */}
                    <button
                      onClick={() => handleCopy(lead.id, 'id')}
                      className="text-[10px] font-mono font-medium px-2 py-0.5 bg-[var(--crm-sidebar)] text-[var(--crm-text-secondary)] rounded-md border border-[var(--crm-card-border)] hover:border-slate-300 dark:hover:border-zinc-700 flex items-center gap-1 transition-all cursor-pointer"
                      title="Click to copy Lead ID"
                    >
                      {copiedField === 'id' ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                      <span>{leadIdLabel}</span>
                    </button>

                    {/* Status Dropdown Trigger */}
                    <div className="relative">
                      <button
                        onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                        className={`text-[10px] font-medium px-2.5 py-0.5 rounded-md border flex items-center gap-1.5 transition-all cursor-pointer ${currentStatusStyle.bg} ${currentStatusStyle.text} ${currentStatusStyle.border}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        <span>{lead.status || 'New'}</span>
                        <ChevronDown size={11} className="opacity-70" />
                      </button>

                      {isStatusDropdownOpen && (
                        <div className="absolute left-0 top-full mt-1 w-36 bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl shadow-xl z-50 py-1 text-xs">
                          {(['New', 'Contacted', 'Follow Up', 'Qualified', 'Proposal', 'Converted', 'Closed', 'Lost'] as Lead['status'][]).map(st => (
                            <button
                              key={st}
                              onClick={() => handleUpdateStatus(st)}
                              className={`w-full text-left px-3 py-1.5 text-[11px] font-medium flex items-center justify-between hover:bg-[var(--crm-sidebar)] transition-colors ${lead.status === st ? 'text-indigo-600 font-semibold' : 'text-[var(--crm-text)]'}`}
                            >
                              <span>{st}</span>
                              {lead.status === st && <Check size={12} />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Priority badge if available */}
                    {lead.priority && (
                      <span className={`text-[9px] font-medium px-2 py-0.5 rounded-md border ${
                        lead.priority === 'High' 
                          ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' 
                          : lead.priority === 'Medium' 
                          ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' 
                          : 'bg-slate-500/10 text-slate-600 border-slate-500/20'
                      }`}>
                        {lead.priority} Priority
                      </span>
                    )}

                    {/* Value Badge */}
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md border border-emerald-500/20 flex items-center gap-0.5">
                      <DollarSign size={10} />
                      {Number(lead.value || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-semibold tracking-tight text-[var(--crm-text)] truncate leading-tight">
                      {lead.name}
                    </h3>
                    {lead.company && (
                      <span className="text-xs text-[var(--crm-subtitle)] truncate flex items-center gap-1 font-normal">
                        <span className="text-slate-300 dark:text-zinc-600">•</span>
                        <Building2 size={11} className="shrink-0 text-[var(--crm-text-secondary)]" />
                        {lead.company}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Close & Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                {onEdit && (
                  <button
                    onClick={onEdit}
                    className="p-1.5 hover:bg-[var(--crm-sidebar)] text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)] rounded-lg transition-colors cursor-pointer"
                    title="Edit Lead"
                  >
                    <Pencil size={15} />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(lead.id)}
                    className="p-1.5 hover:bg-rose-500/10 text-[var(--crm-text-secondary)] hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                    title="Delete Lead"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
                <button 
                  onClick={onClose}
                  className="p-1.5 hover:bg-[var(--crm-sidebar)] rounded-lg text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)] transition-colors cursor-pointer ml-1"
                  title="Close Profile"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Quick Action Bar (Direct one-click communication) */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--crm-card-border)] flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                {lead.phone ? (
                  <>
                    <a
                      href={`tel:${lead.phone}`}
                      onClick={() => handleQuickAction('call')}
                      className="px-2.5 py-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[11px] font-medium rounded-lg flex items-center gap-1.5 hover:bg-zinc-800 transition-colors shadow-2xs"
                    >
                      <Phone size={12} /> Call
                    </a>
                    <a
                      href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => handleQuickAction('whatsapp')}
                      className="px-2.5 py-1 bg-emerald-600 text-white text-[11px] font-medium rounded-lg flex items-center gap-1.5 hover:bg-emerald-700 transition-colors shadow-2xs"
                    >
                      <MessageCircle size={12} /> WhatsApp
                    </a>
                  </>
                ) : (
                  <span className="text-[10px] text-[var(--crm-text-secondary)] italic px-1">No phone added</span>
                )}

                {lead.email ? (
                  <a
                    href={`mailto:${lead.email}`}
                    onClick={() => handleQuickAction('email')}
                    className="px-2.5 py-1 bg-indigo-600 text-white text-[11px] font-medium rounded-lg flex items-center gap-1.5 hover:bg-indigo-700 transition-colors shadow-2xs"
                  >
                    <Mail size={12} /> Email
                  </a>
                ) : (
                  <span className="text-[10px] text-[var(--crm-text-secondary)] italic px-1">No email added</span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowFollowUpModal(true)}
                  className="px-2.5 py-1 bg-[var(--crm-sidebar)] hover:bg-[var(--crm-sidebar-active-bg)] border border-[var(--crm-card-border)] text-[var(--crm-text)] text-[11px] font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Calendar size={12} className="text-indigo-600 dark:text-indigo-400" />
                  <span>Follow-up</span>
                  {lead.leadActivity?.followUpDate && (
                    <span className="text-[9px] text-amber-600 font-semibold bg-amber-500/10 px-1 rounded">
                      {formatDate(lead.leadActivity.followUpDate)}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setShowMeetingModal(true)}
                  className="px-2.5 py-1 bg-[var(--crm-sidebar)] hover:bg-[var(--crm-sidebar-active-bg)] border border-[var(--crm-card-border)] text-[var(--crm-text)] text-[11px] font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Clock size={12} className="text-blue-600 dark:text-blue-400" />
                  <span>Meeting</span>
                </button>

                <button
                  onClick={() => setShowNoteModal(true)}
                  className="px-2.5 py-1 bg-[var(--crm-sidebar)] hover:bg-[var(--crm-sidebar-active-bg)] border border-[var(--crm-card-border)] text-[var(--crm-text)] text-[11px] font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileText size={12} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Log Note</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. Main Content: Compact 2-Column Grid (Information Dense) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
            <div className="grid grid-cols-1 lg:grid-cols-12 3xl:grid-cols-12 4k:grid-cols-12 5k:grid-cols-12 gap-3.5">
              
              {/* LEFT COLUMN: Primary Details & Contact Info (7 cols) */}
              <div className="lg:col-span-7 space-y-3.5">
                
                {/* Card 1: Core Lead & Pipeline Details */}
                <div className="bg-[var(--crm-card)] rounded-xl border border-[var(--crm-card-border)] p-3.5 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-[var(--crm-card-border)] pb-2">
                    <div className="flex items-center gap-2">
                      <Briefcase size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <h4 className="text-xs font-semibold text-[var(--crm-text)]">Lead & Pipeline Overview</h4>
                    </div>
                    <span className="text-[10px] text-[var(--crm-text-secondary)]">
                      Added {formatDate(lead.createdAt)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {/* Service / Category */}
                    <div className="p-2 bg-[var(--crm-sidebar)] rounded-lg border border-[var(--crm-card-border)] space-y-0.5">
                      <span className="text-[9px] font-medium text-[var(--crm-text-secondary)] block">Service / Category</span>
                      <span className="text-xs font-medium text-[var(--crm-text)] truncate block">
                        {lead.category || 'General Service'}
                      </span>
                    </div>

                    {/* Estimated Deal Value */}
                    <div className="p-2 bg-[var(--crm-sidebar)] rounded-lg border border-[var(--crm-card-border)] space-y-0.5">
                      <span className="text-[9px] font-medium text-[var(--crm-text-secondary)] block">Estimated Value</span>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block">
                        ${Number(lead.value || 0).toLocaleString()}
                      </span>
                    </div>

                    {/* Lead Score */}
                    <div className="p-2 bg-[var(--crm-sidebar)] rounded-lg border border-[var(--crm-card-border)] space-y-0.5">
                      <span className="text-[9px] font-medium text-[var(--crm-text-secondary)] block">Lead Score</span>
                      <span className="text-xs font-medium text-[var(--crm-text)] flex items-center gap-1">
                        <Award size={11} className="text-amber-500" />
                        {lead.leadScore ? `${lead.leadScore}/100` : '75/100'}
                      </span>
                    </div>

                    {/* Source */}
                    <div className="p-2 bg-[var(--crm-sidebar)] rounded-lg border border-[var(--crm-card-border)] space-y-0.5">
                      <span className="text-[9px] font-medium text-[var(--crm-text-secondary)] block">Lead Source</span>
                      <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 truncate block">
                        {lead.source || 'Direct Entry'}
                      </span>
                    </div>

                    {/* Assigned Representative */}
                    <div className="p-2 bg-[var(--crm-sidebar)] rounded-lg border border-[var(--crm-card-border)] space-y-0.5 sm:col-span-2">
                      <span className="text-[9px] font-medium text-[var(--crm-text-secondary)] block">Assigned Member</span>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--crm-text)]">
                        <User size={11} className="text-[var(--crm-text-secondary)] shrink-0" />
                        <span className="truncate">{assignedMember ? assignedMember.fullName : 'Unassigned'}</span>
                        {assignedMember?.role && (
                          <span className="text-[9px] text-[var(--crm-subtitle)]">({assignedMember.role})</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2: Contact Information & Channels */}
                <div className="bg-[var(--crm-card)] rounded-xl border border-[var(--crm-card-border)] p-3.5 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-[var(--crm-card-border)] pb-2">
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <h4 className="text-xs font-semibold text-[var(--crm-text)]">Contact & Channels</h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Email */}
                    <div className="p-2 bg-[var(--crm-sidebar)] rounded-lg border border-[var(--crm-card-border)] flex items-center justify-between gap-2">
                      <div className="min-w-0 space-y-0.5">
                        <span className="text-[9px] font-medium text-[var(--crm-text-secondary)] block">Email Address</span>
                        <span className="text-xs font-medium text-[var(--crm-text)] truncate block">
                          {lead.email || 'Not available'}
                        </span>
                      </div>
                      {lead.email && (
                        <button
                          onClick={() => handleCopy(lead.email, 'email')}
                          className="p-1 hover:bg-[var(--crm-card)] text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)] rounded transition-colors shrink-0 cursor-pointer"
                          title="Copy Email"
                        >
                          {copiedField === 'email' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        </button>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="p-2 bg-[var(--crm-sidebar)] rounded-lg border border-[var(--crm-card-border)] flex items-center justify-between gap-2">
                      <div className="min-w-0 space-y-0.5">
                        <span className="text-[9px] font-medium text-[var(--crm-text-secondary)] block">Phone Number</span>
                        <span className="text-xs font-medium text-[var(--crm-text)] truncate block">
                          {lead.phone || 'Not available'}
                        </span>
                      </div>
                      {lead.phone && (
                        <button
                          onClick={() => handleCopy(lead.phone, 'phone')}
                          className="p-1 hover:bg-[var(--crm-card)] text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)] rounded transition-colors shrink-0 cursor-pointer"
                          title="Copy Phone"
                        >
                          {copiedField === 'phone' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        </button>
                      )}
                    </div>

                    {/* Location */}
                    <div className="p-2 bg-[var(--crm-sidebar)] rounded-lg border border-[var(--crm-card-border)] space-y-0.5 sm:col-span-2">
                      <span className="text-[9px] font-medium text-[var(--crm-text-secondary)] block">Location & Region</span>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--crm-text)]">
                        <Globe size={11} className="text-[var(--crm-text-secondary)] shrink-0" />
                        <span>{[lead.city, lead.country].filter(Boolean).join(', ') || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Social / Web Channels */}
                  {socialLinks.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[9px] font-medium text-[var(--crm-text-secondary)] block mb-1.5">Online Presence & Links</span>
                      <div className="flex flex-wrap gap-1.5">
                        {socialLinks.map((link, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleOpenLink(link.url)}
                            className={`px-2.5 py-1 bg-[var(--crm-sidebar)] hover:bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-md text-[11px] font-medium text-[var(--crm-text)] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${link.color}`}
                            title={`Open ${link.label}: ${link.url}`}
                          >
                            {link.icon}
                            <span>{link.label}</span>
                            <ExternalLink size={9} className="opacity-60" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card 3: SMM Campaign Specifications (Only if category is SMM) */}
                {lead.category === 'Social Media Management' && (
                  <div className="bg-indigo-50/40 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20 p-3.5 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-indigo-900 dark:text-indigo-300 text-xs font-semibold">
                      <Sliders size={13} className="text-indigo-600 dark:text-indigo-400" />
                      <span>SMM Campaign Configuration</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      <div className="p-2 bg-[var(--crm-card)] rounded-lg border border-[var(--crm-card-border)]">
                        <span className="text-[9px] text-[var(--crm-text-secondary)] block">Target Platform</span>
                        <span className="font-medium text-[var(--crm-text)]">{lead.smmPlatformName || 'All Platforms'}</span>
                      </div>
                      <div className="p-2 bg-[var(--crm-card)] rounded-lg border border-[var(--crm-card-border)]">
                        <span className="text-[9px] text-[var(--crm-text-secondary)] block">Planned Posts</span>
                        <span className="font-medium text-[var(--crm-text)]">{lead.smmPlannedPosts ? `${lead.smmPlannedPosts} Posts` : 'N/A'}</span>
                      </div>
                      <div className="p-2 bg-[var(--crm-card)] rounded-lg border border-[var(--crm-card-border)]">
                        <span className="text-[9px] text-[var(--crm-text-secondary)] block">Posting Frequency</span>
                        <span className="font-medium text-[var(--crm-text)]">{lead.smmPostingFrequency || 'Standard'}</span>
                      </div>
                    </div>

                    {(lead.smmContentNotes || lead.smmCampaignRequirements) && (
                      <div className="space-y-1.5 pt-1 text-[11px]">
                        {lead.smmContentNotes && (
                          <div className="p-2 bg-[var(--crm-card)] rounded-lg border border-[var(--crm-card-border)]">
                            <span className="text-[9px] font-medium text-[var(--crm-text-secondary)] block">Content Guidelines:</span>
                            <p className="text-[var(--crm-text)] leading-relaxed mt-0.5">{lead.smmContentNotes}</p>
                          </div>
                        )}
                        {lead.smmCampaignRequirements && (
                          <div className="p-2 bg-[var(--crm-card)] rounded-lg border border-[var(--crm-card-border)]">
                            <span className="text-[9px] font-medium text-[var(--crm-text-secondary)] block">Campaign Requirements:</span>
                            <p className="text-[var(--crm-text)] leading-relaxed mt-0.5">{lead.smmCampaignRequirements}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* RIGHT COLUMN: Tabbed Discussions, Notes & Dynamic Fields (5 cols) */}
              <div className="lg:col-span-5 space-y-3.5">
                <div className="bg-[var(--crm-card)] rounded-xl border border-[var(--crm-card-border)] p-3.5 space-y-3 shadow-2xs flex flex-col h-full min-h-[340px]">
                  
                  {/* Tabs Header */}
                  <div className="flex items-center justify-between border-b border-[var(--crm-card-border)] pb-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setActiveTab('timeline')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                          activeTab === 'timeline'
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)] hover:bg-[var(--crm-sidebar)]'
                        }`}
                      >
                        <Clock size={11} />
                        <span>Timeline ({activityTimeline.length})</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('notes')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                          activeTab === 'notes'
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)] hover:bg-[var(--crm-sidebar)]'
                        }`}
                      >
                        <FileText size={11} />
                        <span>Notes</span>
                      </button>

                      {customFieldsCount > 0 && (
                        <button
                          onClick={() => setActiveTab('customFields')}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                            activeTab === 'customFields'
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)] hover:bg-[var(--crm-sidebar)]'
                          }`}
                        >
                          <Sliders size={11} />
                          <span>Fields ({customFieldsCount})</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tab 1: Timeline & Discussions */}
                  {activeTab === 'timeline' && (
                    <div className="space-y-2.5 overflow-y-auto max-h-[300px] pr-1">
                      {activityTimeline.length > 0 ? (
                        activityTimeline.map(event => (
                          <div key={event.id} className="p-2.5 bg-[var(--crm-sidebar)] rounded-lg border border-[var(--crm-card-border)] space-y-1">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="text-[11px] font-medium text-[var(--crm-text)] truncate flex items-center gap-1">
                                {event.discussionType && (
                                  <span className="text-[9px] font-semibold text-indigo-600 dark:text-indigo-400 bg-[var(--crm-card)] px-1.5 py-0.2 rounded border border-[var(--crm-card-border)]">
                                    {event.discussionType}
                                  </span>
                                )}
                                {event.title}
                              </span>
                              <span className="text-[9px] text-[var(--crm-text-secondary)] shrink-0">
                                {formatDate(event.date)}
                              </span>
                            </div>
                            <p className="text-[10px] text-[var(--crm-subtitle)] line-clamp-2 leading-relaxed">
                              {event.description}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-[var(--crm-text-secondary)] space-y-2">
                          <Clock size={24} className="mx-auto opacity-40" />
                          <p className="text-xs">No discussions or activity recorded yet.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 2: Internal Notes */}
                  {activeTab === 'notes' && (
                    <div className="space-y-2.5 overflow-y-auto max-h-[300px] pr-1">
                      {lead.notes ? (
                        <div className="p-3 bg-amber-50/50 dark:bg-amber-500/10 rounded-lg border border-amber-200/60 dark:border-amber-500/20 space-y-1">
                          <span className="text-[9px] font-semibold text-amber-800 dark:text-amber-300 block">Inquiry / Lead Notes</span>
                          <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed italic">
                            "{lead.notes}"
                          </p>
                        </div>
                      ) : null}

                      {lead.leadActivity?.communicationNotes ? (
                        <div className="p-3 bg-[var(--crm-sidebar)] rounded-lg border border-[var(--crm-card-border)] space-y-1">
                          <span className="text-[9px] font-semibold text-[var(--crm-text-secondary)] block">Communication Log</span>
                          <p className="text-xs text-[var(--crm-text)] whitespace-pre-line leading-relaxed">
                            {lead.leadActivity.communicationNotes}
                          </p>
                        </div>
                      ) : null}

                      {!lead.notes && !lead.leadActivity?.communicationNotes && (
                        <div className="text-center py-8 text-[var(--crm-text-secondary)] space-y-2">
                          <FileText size={24} className="mx-auto opacity-40" />
                          <p className="text-xs">No internal notes added for this lead.</p>
                          <button
                            onClick={() => setShowNoteModal(true)}
                            className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg inline-flex items-center gap-1 shadow-2xs hover:bg-indigo-700 transition-colors cursor-pointer"
                          >
                            <Plus size={12} /> Add Note
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 3: Custom Fields (from CSV or custom schema) */}
                  {activeTab === 'customFields' && lead.customFields && (
                    <div className="space-y-2 overflow-y-auto max-h-[300px] pr-1">
                      <div className="grid grid-cols-1 gap-2">
                        {Object.entries(lead.customFields).map(([k, v]) => {
                          if (v === null || v === undefined || v === '') return null;
                          const isUrl = typeof v === 'string' && (v.startsWith('http://') || v.startsWith('https://') || v.startsWith('www.'));
                          return (
                            <div key={k} className="p-2 bg-[var(--crm-sidebar)] rounded-lg border border-[var(--crm-card-border)] space-y-0.5">
                              <span className="text-[9px] font-medium text-[var(--crm-text-secondary)] block">{k}</span>
                              {isUrl ? (
                                <a
                                  href={v.startsWith('http') ? v : `https://${v}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs font-medium text-indigo-600 hover:underline break-all flex items-center gap-1"
                                >
                                  <span className="truncate">{String(v)}</span>
                                  <ExternalLink size={10} className="shrink-0" />
                                </a>
                              ) : (
                                <span className="text-xs font-medium text-[var(--crm-text)] break-words block">{String(v)}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              </div>

            </div>
          </div>

          {/* 3. Modal Footer (Simple & Actionable) */}
          <div className="px-4 py-3 sm:px-5 sm:py-3 border-t border-[var(--crm-card-border)] bg-[var(--crm-sidebar)]/50 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[10px] text-[var(--crm-text-secondary)]">
              <span>Last active: {lead.leadActivity?.lastActivityAt ? formatDate(lead.leadActivity.lastActivityAt) : formatDate(lead.updatedAt)}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer shadow-2xs"
              >
                Close
              </button>
            </div>
          </div>

        </motion.div>

        {/* Floating Sub-Modals for Quick Actions */}
        <AnimatePresence>
          {showFollowUpModal && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4"
              onClick={() => setShowFollowUpModal(false)}
            >
              <div 
                className="bg-[var(--crm-card)] rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-[var(--crm-card-border)] space-y-4 text-[var(--crm-text)]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-[var(--crm-card-border)] pb-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Calendar size={15} className="text-indigo-600" /> Schedule Follow-up
                  </h4>
                  <button onClick={() => setShowFollowUpModal(false)} className="text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)]">
                    <X size={15} />
                  </button>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--crm-text-secondary)] block">Follow-up Date</label>
                  <input
                    type="date"
                    value={followUpInputDate}
                    onChange={(e) => setFollowUpInputDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl text-xs font-medium text-[var(--crm-text)] outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setShowFollowUpModal(false)} className="flex-1 py-1.5 text-xs text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar)] rounded-lg transition-all">Cancel</button>
                  <button onClick={handleSaveFollowUp} className="flex-1 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-all shadow-md">Save</button>
                </div>
              </div>
            </motion.div>
          )}

          {showMeetingModal && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4"
              onClick={() => setShowMeetingModal(false)}
            >
              <div 
                className="bg-[var(--crm-card)] rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-[var(--crm-card-border)] space-y-3.5 text-[var(--crm-text)]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-[var(--crm-card-border)] pb-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Clock size={15} className="text-indigo-600" /> Schedule Meeting
                  </h4>
                  <button onClick={() => setShowMeetingModal(false)} className="text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)]">
                    <X size={15} />
                  </button>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--crm-text-secondary)] block">Topic / Agenda</label>
                  <input
                    type="text"
                    placeholder="Discovery Call"
                    value={meetingInputTitle}
                    onChange={(e) => setMeetingInputTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl text-xs font-medium text-[var(--crm-text)] outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--crm-text-secondary)] block">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={meetingInputDate}
                    onChange={(e) => setMeetingInputDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl text-xs font-medium text-[var(--crm-text)] outline-hidden focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setShowMeetingModal(false)} className="flex-1 py-1.5 text-xs text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar)] rounded-lg transition-all">Cancel</button>
                  <button onClick={handleSaveMeeting} className="flex-1 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-all shadow-md">Schedule</button>
                </div>
              </div>
            </motion.div>
          )}

          {showNoteModal && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4"
              onClick={() => setShowNoteModal(false)}
            >
              <div 
                className="bg-[var(--crm-card)] rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-[var(--crm-card-border)] space-y-3 text-[var(--crm-text)]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-[var(--crm-card-border)] pb-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <FileText size={15} className="text-indigo-600" /> Log Communication Note
                  </h4>
                  <button onClick={() => setShowNoteModal(false)} className="text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)]">
                    <X size={15} />
                  </button>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--crm-text-secondary)] block">Note Content</label>
                  <textarea
                    rows={3}
                    placeholder="Enter discussion summary, customer feedback..."
                    value={noteInputText}
                    onChange={(e) => setNoteInputText(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl text-xs font-medium text-[var(--crm-text)] outline-hidden focus:ring-1 focus:ring-indigo-500 resize-none"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setShowNoteModal(false)} className="flex-1 py-1.5 text-xs text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar)] rounded-lg transition-all">Cancel</button>
                  <button onClick={handleSaveNote} className="flex-1 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-all shadow-md">Save Note</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
