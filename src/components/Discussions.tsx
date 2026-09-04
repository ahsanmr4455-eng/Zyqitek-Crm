import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Phone, 
  MessageSquare, 
  Plus, 
  Search, 
  Trash2, 
  User, 
  Clock, 
  Calendar, 
  X, 
  Loader2, 
  Briefcase, 
  Paperclip, 
  Tag, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  FileText, Video,
  MessageCircle,
  Download,
  UploadCloud,
  FileArchive,
  Image,
  ChevronRight
} from 'lucide-react';
import { 
  Lead, 
  Client, 
  Project, 
  TeamMember, 
  EmailDiscussion, 
  CallDiscussion, 
  ConversationDiscussion,
  CallScript,
  EmailScript,
  Meeting,
  ChatAttachment
} from '../types';
import ScriptsAndTemplatesManager from './ScriptsAndTemplatesManager';
import { uploadPortalFile, deletePortalFile, formatBytes } from '../lib/fileStorage';

// Platform configuration with icons and styling for Discussions module
const PLATFORM_CONFIGS: Record<string, { label: string; bg: string; text: string; border: string; icon: React.ReactNode }> = {
  whatsapp: {
    label: 'WhatsApp',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/20',
    icon: (
      <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.943-.708-1.798 0-.855.448-1.275.608-1.449.16-.174.348-.217.464-.217.116 0 .232.002.333.007.107.005.25-.041.391.297.145.348.493 1.202.536 1.289.043.087.072.188.014.304-.058.116-.087.188-.174.289l-.261.304c-.087.101-.179.212-.077.387.102.174.455.751.977 1.216.671.597 1.237.781 1.411.868.174.087.275.072.377-.043.101-.116.435-.507.551-.681.116-.174.232-.145.391-.087.16.058 1.014.478 1.188.565.174.087.289.13.333.203.043.072.043.419-.101.824z"/>
      </svg>
    )
  },
  messenger: {
    label: 'Messenger',
    bg: 'bg-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/20',
    icon: (
      <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
        <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.91 1.45 5.518 3.712 7.202V22l3.38-1.856c.928.257 1.91.397 2.908.397 5.523 0 10-4.145 10-9.258C22 6.145 17.523 2 12 2zm1.192 12.433l-2.56-2.731-4.996 2.731 5.495-5.834 2.56 2.731 4.996-2.731-5.495 5.834z"/>
      </svg>
    )
  },
  instagram: {
    label: 'Instagram',
    bg: 'bg-pink-500/10',
    text: 'text-pink-600 dark:text-pink-400',
    border: 'border-pink-500/20',
    icon: (
      <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    )
  },
  telegram: {
    label: 'Telegram',
    bg: 'bg-sky-500/10',
    text: 'text-sky-600 dark:text-sky-400',
    border: 'border-sky-500/20',
    icon: (
      <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
        <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.562 8.161c-.18.717-.962 4.084-1.362 5.487-.168.59-.387.788-.598.807-.46.042-.81-.303-1.256-.595-.697-.457-1.091-.741-1.767-1.187-.781-.515-.275-.798.17-1.261.117-.121 2.148-1.969 2.187-2.136.005-.021.01-.1-.034-.139-.044-.04-.108-.026-.155-.015-.066.015-1.127.717-3.18 2.103-.301.207-.573.308-.817.302-.268-.006-.785-.152-1.168-.277-.47-.153-.844-.234-.811-.494.017-.136.198-.276.543-.42 2.132-.928 3.555-1.539 4.269-1.832 2.032-.835 2.454-.98 2.73-.985.061 0 .198.014.287.087.075.062.096.146.105.205.011.077.025.25-.014.509z"/>
      </svg>
    )
  },
  sms: {
    label: 'SMS',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/20',
    icon: <MessageSquare size={13} className="shrink-0" />
  },
  website_chat: {
    label: 'Website Chat',
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-500/20',
    icon: <MessageCircle size={13} className="shrink-0" />
  },
  other: {
    label: 'Other',
    bg: 'bg-slate-500/10',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-500/20',
    icon: <MessageSquare size={13} className="shrink-0" />
  }
};

function PlatformBadge({ platform }: { platform?: string }) {
  if (!platform) return null;
  const key = platform.toLowerCase();
  const config = PLATFORM_CONFIGS[key] || {
    label: platform,
    bg: 'bg-slate-500/10',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-500/20',
    icon: <MessageSquare size={13} />
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${config.bg} ${config.text} ${config.border}`}>
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
}

interface DiscussionsProps {
  leads: Lead[];
  clients: Client[];
  projects?: Project[];
  teamMembers?: TeamMember[];
  emailDiscussions: EmailDiscussion[];
  callDiscussions: CallDiscussion[];
  conversationDiscussions: ConversationDiscussion[];
  meetings?: Meeting[];
  callScripts: CallScript[];
  emailScripts: EmailScript[];
  onAddEmailDiscussion: (disc: Omit<EmailDiscussion, 'id'>) => Promise<boolean>;
  onDeleteEmailDiscussion: (id: string) => void;
  onDeleteMultipleEmails: (ids: string[]) => void;
  onAddCallDiscussion: (disc: Omit<CallDiscussion, 'id'>) => Promise<boolean>;
  onDeleteCallDiscussion: (id: string) => void;
  onDeleteMultipleCalls: (ids: string[]) => void;
  onAddConversationDiscussion: (disc: Omit<ConversationDiscussion, 'id'>) => Promise<boolean>;
  onDeleteConversationDiscussion: (id: string) => void;
  onDeleteMultipleConversations: (ids: string[]) => void;
  onAddMeeting?: (meeting: Omit<Meeting, 'id'>) => Promise<boolean>;
  onUpdateMeeting?: (meeting: Meeting) => Promise<boolean>;
  onDeleteMeeting?: (id: string) => void;
  onAddCallScript: (script: Omit<CallScript, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  onUpdateCallScript: (script: CallScript) => Promise<boolean>;
  onDeleteCallScript: (id: string) => Promise<boolean>;
  onDuplicateCallScript: (script: CallScript) => Promise<boolean>;
  onAddEmailScript: (script: Omit<EmailScript, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  onUpdateEmailScript: (script: EmailScript) => Promise<boolean>;
  onDeleteEmailScript: (id: string) => Promise<boolean>;
  onDuplicateEmailScript: (script: EmailScript) => Promise<boolean>;
  prefill?: any;
  onClearPrefill: () => void;
}

export default function Discussions({
  leads,
  clients,
  projects = [],
  teamMembers = [],
  emailDiscussions,
  callDiscussions,
  conversationDiscussions,
  meetings = [],
  callScripts,
  emailScripts,
  onAddEmailDiscussion,
  onDeleteEmailDiscussion,
  onAddCallDiscussion,
  onDeleteCallDiscussion,
  onAddConversationDiscussion,
  onDeleteConversationDiscussion,
  onAddMeeting,
  onUpdateMeeting,
  onDeleteMeeting,
  onAddCallScript,
  onUpdateCallScript,
  onDeleteCallScript,
  onDuplicateCallScript,
  onAddEmailScript,
  onUpdateEmailScript,
  onDeleteEmailScript,
  onDuplicateEmailScript,
  prefill,
  onClearPrefill
}: DiscussionsProps) {
  const [activeTab, setActiveTab] = useState<'records' | 'scripts'>('records');
  const [activeSubTab, setActiveSubTab] = useState<'emails' | 'calls' | 'conversations' | 'meetings'>('emails');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal & Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [recordType, setRecordType] = useState<'email' | 'call' | 'conversation' | 'meeting'>('email');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Selected Record for Detail View Modal
  const [viewingRecord, setViewingRecord] = useState<{
    type: 'email' | 'call' | 'conversation' | 'meeting';
    data: EmailDiscussion | CallDiscussion | ConversationDiscussion | Meeting;
  } | null>(null);

  // Relationship Selection state
  const [selectedEntityKey, setSelectedEntityKey] = useState<string>(''); // e.g. "client-123" or "lead-456"
  const [contactType, setContactType] = useState<'client' | 'lead' | ''>(''); // Required: Ask "Who is this record for?" first
  const [entitySearchQuery, setEntitySearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedAssignedMember, setSelectedAssignedMember] = useState<string>('');

  // Common Form Fields
  const [contactName, setContactName] = useState('');
  const [contactCompany, setContactCompany] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [recordTime, setRecordTime] = useState(new Date().toTimeString().slice(0, 5));

  // Email Fields
  const [emailSubject, setEmailSubject] = useState('');
  const [emailDirection, setEmailDirection] = useState<'Sent' | 'Received'>('Sent');
  const [emailContent, setEmailContent] = useState('');
  const [emailNotes, setEmailNotes] = useState('');
  const [emailFollowUpStatus, setEmailFollowUpStatus] = useState<'Needs Follow-up' | 'Pending Client' | 'Closed' | 'None'>('None');
  const [emailAttachments, setEmailAttachments] = useState('');

  // Call Fields
  const [callDuration, setCallDuration] = useState('15 mins');
  const [callSummary, setCallSummary] = useState('');
  const [callRequirements, setCallRequirements] = useState('');
  const [callFollowUpActions, setCallFollowUpActions] = useState('');
  const [callNotes, setCallNotes] = useState('');
  const [callStatus, setCallStatus] = useState<'Connected' | 'No Answer' | 'Busy' | 'Voicemail'>('Connected');

  // Conversation Fields
  const [conversationPlatform, setConversationPlatform] = useState<'whatsapp' | 'messenger' | 'instagram' | 'telegram' | 'sms' | 'website_chat' | 'other' | ''>('');
  const [conversationTitle, setConversationTitle] = useState('');
  const [conversationSummary, setConversationSummary] = useState('');
  const [clientResponse, setClientResponse] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [conversationStatus, setConversationStatus] = useState<'New' | 'Open' | 'Pending' | 'Closed' | 'In Progress' | 'Pending Response'>('Open');
  const [conversationNotes, setConversationNotes] = useState('');

  // Chat Attachments for Conversations
  const [uploadedAttachments, setUploadedAttachments] = useState<ChatAttachment[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [attachmentProgress, setAttachmentProgress] = useState(0);

  // Meeting Fields
  const [meetingPlatform, setMeetingPlatform] = useState<'Zoom' | 'Google Meet' | 'Microsoft Teams' | 'Other'>('Google Meet');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [meetingStatus, setMeetingStatus] = useState<'Booked' | 'Completed' | 'Cancelled'>('Booked');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingDuration, setMeetingDuration] = useState('30 mins');
  const [meetingNotes, setMeetingNotes] = useState('');

  // Filtered lists for entity selection
  const filteredLeadsList = useMemo(() => {
    if (!entitySearchQuery.trim()) return leads;
    const q = entitySearchQuery.toLowerCase();
    return leads.filter(l => 
      (l.name || '').toLowerCase().includes(q) ||
      (l.company || '').toLowerCase().includes(q) ||
      (l.email || '').toLowerCase().includes(q)
    );
  }, [leads, entitySearchQuery]);

  const filteredClientsList = useMemo(() => {
    if (!entitySearchQuery.trim()) return clients;
    const q = entitySearchQuery.toLowerCase();
    return clients.filter(c => 
      (c.name || '').toLowerCase().includes(q) ||
      (c.company || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    );
  }, [clients, entitySearchQuery]);

  // Handle prefill if passed
  useEffect(() => {
    if (prefill) {
      if (prefill.clientName || prefill.leadName) {
        setContactName(prefill.clientName || prefill.leadName || '');
      }
      if (prefill.company) setContactCompany(prefill.company);
      if (prefill.email) setContactEmail(prefill.email);
      if (prefill.phone) setContactPhone(prefill.phone);
      if (prefill.clientId) {
        setSelectedEntityKey(`client-${prefill.clientId}`);
        setContactType('client');
      }
      else if (prefill.leadId) {
        setSelectedEntityKey(`lead-${prefill.leadId}`);
        setContactType('lead');
      }
      
      if (prefill.type === 'email') setRecordType('email');
      else if (prefill.type === 'call') setRecordType('call');
      else if (prefill.type === 'conversation') setRecordType('conversation');

      setShowAddModal(true);
      onClearPrefill();
    }
  }, [prefill, onClearPrefill]);

  // Handle Entity Selection Change
  const handleEntityChange = (key: string) => {
    setSelectedEntityKey(key);
    if (!key) {
      setContactName('');
      setContactCompany('');
      setContactEmail('');
      setContactPhone('');
      return;
    }
    if (key.startsWith('client-')) {
      const clientId = key.replace('client-', '');
      const client = clients.find(c => c.id === clientId);
      if (client) {
        setContactName(client.company || client.name);
        setContactCompany(client.company || '');
        setContactEmail(client.email || '');
        setContactPhone(client.phone || '');
        if (client.assignedTeamMember) setSelectedAssignedMember(client.assignedTeamMember);
      }
    } else if (key.startsWith('lead-')) {
      const leadId = key.replace('lead-', '');
      const lead = leads.find(l => l.id === leadId);
      if (lead) {
        setContactName(lead.name);
        setContactCompany(lead.company || '');
        setContactEmail(lead.email || '');
        setContactPhone(lead.phone || '');
        if (lead.assignedTeamMember) setSelectedAssignedMember(lead.assignedTeamMember);
      }
    }
  };

  // Reset Form
  const resetForm = () => {
    setFormError('');
    setSelectedEntityKey('');
    setContactType(''); // Reset to require choice
    setEntitySearchQuery('');
    setSelectedProjectId('');
    setSelectedAssignedMember('');
    setContactName('');
    setContactCompany('');
    setContactEmail('');
    setContactPhone('');
    setRecordDate(new Date().toISOString().split('T')[0]);
    setRecordTime(new Date().toTimeString().slice(0, 5));

    setEmailSubject('');
    setEmailDirection('Sent');
    setEmailContent('');
    setEmailNotes('');
    setEmailFollowUpStatus('None');
    setEmailAttachments('');

    setCallDuration('15 mins');
    setCallSummary('');
    setCallRequirements('');
    setCallFollowUpActions('');
    setCallNotes('');
    setCallStatus('Connected');

    setConversationPlatform('');
    setConversationTitle('');
    setConversationSummary('');
    setClientResponse('');
    setNextAction('');
    setFollowUpRequired(false);
    setFollowUpDate('');
    setPriority('Medium');
    setConversationStatus('Open');
    setConversationNotes('');
    setUploadedAttachments([]);

    setMeetingPlatform('Google Meet');
    setMeetingUrl('');
    setMeetingStatus('Booked');
    setMeetingTitle('');
    setMeetingDuration('30 mins');
    setMeetingNotes('');
  };

  const handleOpenAddModal = () => {
    resetForm();
    if (activeSubTab === 'emails') setRecordType('email');
    else if (activeSubTab === 'calls') setRecordType('call');
    else if (activeSubTab === 'conversations') setRecordType('conversation');
    else if (activeSubTab === 'meetings') setRecordType('meeting');
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    resetForm();
  };

  const handleUploadAttachment = async (file: File) => {
    setIsUploadingAttachment(true);
    setAttachmentProgress(0);
    try {
      const res = await uploadPortalFile(file, `discussions/attachments/${Date.now()}`, (pct) => {
        setAttachmentProgress(pct);
      });
      const newAttachment: ChatAttachment = {
        name: res.fileName,
        size: res.size,
        fileType: file.type || file.name.split('.').pop() || 'document',
        fileUrl: res.downloadUrl || res.fileUrl,
        storagePath: res.storagePath
      };
      setUploadedAttachments(prev => [...prev, newAttachment]);
    } catch (error: any) {
      console.error(error);
      alert('Failed to upload attachment: ' + error.message);
    } finally {
      setIsUploadingAttachment(false);
      setAttachmentProgress(0);
    }
  };

  // Submit Handler with Strict Validation & Single-Submit Guard
  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    setFormError('');

    // Step 1: Enforce "Who is this record for?" (Lead or Client selection)
    if (!contactType) {
      setFormError('Please select whether this record is for a Lead or a Client.');
      return;
    }

    // Step 2: Enforce selecting an actual existing Lead or Client
    if (!selectedEntityKey) {
      if (contactType === 'lead') {
        setFormError('Please select a lead from the CRM database.');
      } else {
        setFormError('Please select a client from the CRM database.');
      }
      return;
    }

    // Determine Entity IDs
    let clientId: string | undefined = undefined;
    let leadId: string | undefined = undefined;
    if (selectedEntityKey.startsWith('client-')) {
      clientId = selectedEntityKey.replace('client-', '');
    } else if (selectedEntityKey.startsWith('lead-')) {
      leadId = selectedEntityKey.replace('lead-', '');
    }

    if (!clientId && !leadId) {
      setFormError('Please select a valid Lead or Client from the database.');
      return;
    }

    setIsSaving(true);

    try {
      if (recordType === 'email') {
        if (!emailSubject.trim()) {
          setFormError('Please enter an email subject.');
          setIsSaving(false);
          return;
        }
        if (!emailContent.trim()) {
          setFormError('Please enter email content or summary.');
          setIsSaving(false);
          return;
        }

        const newEmail: Omit<EmailDiscussion, 'id'> = {
          clientName: contactName.trim() || 'General Inquiry',
          subject: emailSubject.trim(),
          date: `${recordDate}T${recordTime}:00`,
          direction: emailDirection,
          content: emailContent.trim(),
          notes: emailNotes.trim(),
          followUpStatus: emailFollowUpStatus,
          attachments: emailAttachments.trim(),
          clientService: selectedProjectId ? projects.find(p => p.id === selectedProjectId)?.name : undefined,
          clientId,
          leadId,
          projectId: selectedProjectId || undefined,
          assignedTeamMember: selectedAssignedMember || undefined,
          followUpRequired,
          followUpDate: followUpRequired && followUpDate ? followUpDate : undefined
        };

        const success = await onAddEmailDiscussion(newEmail);
        if (success) {
          setShowAddModal(false);
          resetForm();
          setActiveTab('records');
          setActiveSubTab('emails');
        } else {
          setFormError('Failed to save email record to database.');
        }
      } else if (recordType === 'call') {
        if (!callSummary.trim()) {
          setFormError('Please enter call summary notes.');
          setIsSaving(false);
          return;
        }

        const newCall: Omit<CallDiscussion, 'id'> = {
          clientName: contactName.trim() || 'Client Call',
          callDate: `${recordDate}T${recordTime}:00`,
          duration: callDuration.trim() || '15 mins',
          summary: callSummary.trim(),
          requirements: callRequirements.trim(),
          followUpActions: callFollowUpActions.trim(),
          notes: callNotes.trim(),
          status: callStatus,
          clientService: selectedProjectId ? projects.find(p => p.id === selectedProjectId)?.name : undefined,
          clientId,
          leadId,
          projectId: selectedProjectId || undefined,
          assignedTeamMember: selectedAssignedMember || undefined,
          followUpRequired,
          followUpDate: followUpRequired && followUpDate ? followUpDate : undefined
        };

        const success = await onAddCallDiscussion(newCall);
        if (success) {
          setShowAddModal(false);
          resetForm();
          setActiveTab('records');
          setActiveSubTab('calls');
        } else {
          setFormError('Failed to save call record to database.');
        }
      } else if (recordType === 'conversation') {
        if (!conversationPlatform) {
          setFormError('Please select a communication platform (e.g., WhatsApp, Messenger, Instagram, etc.).');
          setIsSaving(false);
          return;
        }
        if (!conversationTitle.trim()) {
          setFormError('Please enter a conversation title.');
          setIsSaving(false);
          return;
        }
        if (!conversationSummary.trim()) {
          setFormError('Please enter conversation summary/details.');
          setIsSaving(false);
          return;
        }

        const newConversation: Omit<ConversationDiscussion, 'id'> = {
          leadName: contactName.trim() || 'Contact Conversation',
          clientName: contactType === 'client' ? contactName.trim() : undefined,
          company: contactCompany.trim(),
          email: contactEmail.trim(),
          phone: contactPhone.trim(),
          date: recordDate,
          time: recordTime,
          platform: conversationPlatform,
          discussionTitle: conversationTitle.trim(),
          conversationSummary: conversationSummary.trim(),
          clientResponse: clientResponse.trim(),
          nextAction: nextAction.trim(),
          followUpRequired,
          followUpDate: followUpRequired && followUpDate ? followUpDate : undefined,
          priority: priority,
          status: conversationStatus,
          notes: conversationNotes.trim(),
          clientId,
          leadId,
          assignedTeamMember: selectedAssignedMember || undefined,
          service: selectedProjectId ? projects.find(p => p.id === selectedProjectId)?.name : undefined,
          attachments: uploadedAttachments
        };

        const success = await onAddConversationDiscussion(newConversation);
        if (success) {
          setShowAddModal(false);
          resetForm();
          setActiveTab('records');
          setActiveSubTab('conversations');
        } else {
          setFormError('Failed to save conversation record to database.');
        }
      } else if (recordType === 'meeting') {
        if (!meetingTitle.trim()) {
          setFormError('Please enter a meeting title.');
          setIsSaving(false);
          return;
        }
        if (meetingUrl && !/^https?:\/\//i.test(meetingUrl)) {
          setFormError('Please enter a valid URL (starting with http:// or https://)');
          setIsSaving(false);
          return;
        }

        const newMeeting: Omit<Meeting, 'id'> = {
          clientId,
          leadId,
          clientName: contactName || 'Contact',
          platform: meetingPlatform,
          url: meetingUrl.trim(),
          date: recordDate,
          time: recordTime,
          status: meetingStatus,
          title: meetingTitle.trim(),
          notes: meetingNotes.trim(),
          duration: meetingDuration.trim(),
          assignedTeamMember: selectedAssignedMember || undefined,
          followUpRequired,
          followUpDate: followUpRequired && followUpDate ? followUpDate : undefined
        };

        if (onAddMeeting) {
          const success = await onAddMeeting(newMeeting);
          if (success) {
            setShowAddModal(false);
            resetForm();
            setActiveTab('records');
            setActiveSubTab('meetings');
          } else {
            setFormError('Failed to schedule meeting.');
          }
        }
      }
    } catch (err: any) {
      console.error("Error saving record:", err);
      setFormError(err?.message || 'An unexpected error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter Logic
  const filteredMeetings = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return meetings;
    return meetings.filter(m => 
      m.clientName.toLowerCase().includes(q) ||
      (m.title && m.title.toLowerCase().includes(q)) ||
      m.platform.toLowerCase().includes(q)
    );
  }, [meetings, searchQuery]);
  const filteredEmails = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return emailDiscussions;
    return emailDiscussions.filter(e => 
      e.subject.toLowerCase().includes(q) ||
      e.clientName.toLowerCase().includes(q) ||
      (e.content && e.content.toLowerCase().includes(q)) ||
      (e.notes && e.notes.toLowerCase().includes(q))
    );
  }, [emailDiscussions, searchQuery]);

  const filteredCalls = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return callDiscussions;
    return callDiscussions.filter(c => 
      c.clientName.toLowerCase().includes(q) ||
      c.summary.toLowerCase().includes(q) ||
      (c.requirements && c.requirements.toLowerCase().includes(q)) ||
      (c.notes && c.notes.toLowerCase().includes(q))
    );
  }, [callDiscussions, searchQuery]);

  const filteredConversations = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return conversationDiscussions;
    return conversationDiscussions.filter(c => 
      (c.leadName || c.company || '').toLowerCase().includes(q) ||
      c.discussionTitle.toLowerCase().includes(q) ||
      (c.conversationSummary && c.conversationSummary.toLowerCase().includes(q)) ||
      (c.clientResponse && c.clientResponse.toLowerCase().includes(q))
    );
  }, [conversationDiscussions, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[30px] sm:text-[32px] font-bold tracking-tight !text-white text-white font-structure leading-[1.2] section-main-heading">Discussions</h1>
          <p className="!text-white text-white text-sm font-normal italic mt-1 section-sub-heading">Manage client communications, call logs, meeting notes, and response scripts.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-[var(--crm-sidebar)] p-1 rounded-xl border border-[var(--crm-card-border)] flex">
            <button
              onClick={() => setActiveTab('records')}
              className={`px-4 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                activeTab === 'records' 
                  ? 'bg-[var(--crm-card)] text-[var(--crm-text)] shadow-xs font-bold' 
                  : 'text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)] font-medium'
              }`}
            >
              Records
            </button>
            <button
              onClick={() => setActiveTab('scripts')}
              className={`px-4 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                activeTab === 'scripts' 
                  ? 'bg-[var(--crm-card)] text-[var(--crm-text)] shadow-xs font-bold' 
                  : 'text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)] font-medium'
              }`}
            >
              Scripts & Templates
            </button>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="bg-[var(--crm-primary)] hover:bg-[var(--crm-primary-hover)] text-white px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Plus size={15} />
            <span>Add Record</span>
          </button>
        </div>
      </div>

      {activeTab === 'records' ? (
        /* Main Records List Container */
        <div className="bg-[var(--crm-card)] rounded-2xl border border-[var(--crm-card-border)] shadow-xs overflow-hidden flex flex-col min-h-[550px]">
          {/* Navigation & Search Bar */}
          <div className="px-6 py-4 border-b border-[var(--crm-card-border)] bg-[var(--crm-sidebar)] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex gap-2 p-1 bg-[var(--crm-card)] rounded-xl border border-[var(--crm-card-border)] w-fit">
              <button
                onClick={() => setActiveSubTab('emails')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeSubTab === 'emails' 
                    ? 'bg-[var(--crm-primary)] text-white shadow-xs font-semibold' 
                    : 'text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar-active-bg)] hover:text-[var(--crm-text)]'
                }`}
              >
                <Mail size={14} />
                <span>Emails ({emailDiscussions.length})</span>
              </button>
              <button
                onClick={() => setActiveSubTab('calls')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeSubTab === 'calls' 
                    ? 'bg-[var(--crm-primary)] text-white shadow-xs font-semibold' 
                    : 'text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar-active-bg)] hover:text-[var(--crm-text)]'
                }`}
              >
                <Phone size={14} />
                <span>Calls ({callDiscussions.length})</span>
              </button>
              <button
                onClick={() => setActiveSubTab('conversations')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeSubTab === 'conversations' 
                    ? 'bg-[var(--crm-primary)] text-white shadow-xs font-semibold' 
                    : 'text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar-active-bg)] hover:text-[var(--crm-text)]'
                }`}
              >
                <MessageSquare size={14} />
                <span>Conversations ({conversationDiscussions.length})</span>
              </button>
              <button
                onClick={() => setActiveSubTab('meetings')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  activeSubTab === 'meetings' 
                    ? 'bg-[var(--crm-primary)] text-white shadow-xs font-semibold' 
                    : 'text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar-active-bg)] hover:text-[var(--crm-text)]'
                }`}
              >
                <Video size={14} />
                <span>Meetings ({meetings.length})</span>
              </button>
            </div>

            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--crm-text-muted)]" size={15} />
              <input
                type="text"
                placeholder="Search records by client, subject, or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--crm-primary)]/20 transition-all placeholder-[var(--crm-text-muted)]"
              />
            </div>
          </div>

          {/* Records List Content */}
          <div className="flex-1 overflow-y-auto">
            {activeSubTab === 'emails' && (
              <div className="divide-y divide-[var(--crm-card-border)]">
                {filteredEmails.length > 0 ? (
                  filteredEmails.map(email => (
                    <div 
                      key={email.id} 
                      onClick={() => setViewingRecord({ type: 'email', data: email })}
                      className="p-4 hover:bg-[var(--crm-sidebar-active-bg)] transition-colors group cursor-pointer flex items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0 border border-indigo-500/20 shadow-xs">
                          <Mail size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm text-[var(--crm-text)]">{email.subject}</h3>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                              email.direction === 'Sent' 
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                                : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            }`}>
                              {email.direction}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--crm-subtitle)] mt-1">
                            {email.direction === 'Sent' ? 'Sent to' : 'Received from'}:{' '}
                            <span className="font-medium text-[var(--crm-text)]">{email.clientName}</span>
                            {email.clientService && <span className="ml-2 text-[var(--crm-text-muted)]">• {email.clientService}</span>}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-[11px] text-[var(--crm-text-muted)]">
                            <span className="flex items-center gap-1">
                              <Calendar size={11} />
                              {new Date(email.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            {email.assignedTeamMember && (
                              <span className="flex items-center gap-1">
                                <User size={11} />
                                {email.assignedTeamMember}
                              </span>
                            )}
                            {email.followUpStatus && email.followUpStatus !== 'None' && (
                              <span className="px-2 py-0.5 rounded bg-[var(--crm-sidebar)] text-[10px] border border-[var(--crm-card-border)]">
                                Follow-up: {email.followUpStatus}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setViewingRecord({ type: 'email', data: email }); }}
                          className="p-2 text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] hover:bg-[var(--crm-sidebar)] rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDeleteEmailDiscussion(email.id); }}
                          className="p-2 text-[var(--crm-text-muted)] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                          title="Delete Email"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Mail size={44} className="text-[var(--crm-text-muted)] mb-3 opacity-30" />
                    <p className="text-[var(--crm-subtitle)] font-medium text-sm">No email records found</p>
                    <p className="text-[var(--crm-text-muted)] text-xs mt-1">Click "Add Record" to log a new email interaction.</p>
                  </div>
                )}
              </div>
            )}

            {activeSubTab === 'calls' && (
              <div className="divide-y divide-[var(--crm-card-border)]">
                {filteredCalls.length > 0 ? (
                  filteredCalls.map(call => (
                    <div 
                      key={call.id} 
                      onClick={() => setViewingRecord({ type: 'call', data: call })}
                      className="p-4 hover:bg-[var(--crm-sidebar-active-bg)] transition-colors group cursor-pointer flex items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0 border border-blue-500/20 shadow-xs">
                          <Phone size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm text-[var(--crm-text)]">Call with {call.clientName}</h3>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                              {call.status || 'Connected'}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--crm-subtitle)] mt-1 line-clamp-1 max-w-xl 2xl:max-w-2xl 3xl:max-w-3xl 4k:max-w-5xl 5k:max-w-6xl">{call.summary}</p>
                          <div className="flex items-center gap-4 mt-2 text-[11px] text-[var(--crm-text-muted)]">
                            <span className="flex items-center gap-1">
                              <Clock size={11} />
                              {call.duration}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={11} />
                              {new Date(call.callDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            {call.assignedTeamMember && (
                              <span className="flex items-center gap-1">
                                <User size={11} />
                                {call.assignedTeamMember}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setViewingRecord({ type: 'call', data: call }); }}
                          className="p-2 text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] hover:bg-[var(--crm-sidebar)] rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDeleteCallDiscussion(call.id); }}
                          className="p-2 text-[var(--crm-text-muted)] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                          title="Delete Call"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Phone size={44} className="text-[var(--crm-text-muted)] mb-3 opacity-30" />
                    <p className="text-[var(--crm-subtitle)] font-medium text-sm">No call records found</p>
                    <p className="text-[var(--crm-text-muted)] text-xs mt-1">Click "Add Record" to log a new call summary.</p>
                  </div>
                )}
              </div>
            )}

            {activeSubTab === 'conversations' && (
              <div className="divide-y divide-[var(--crm-card-border)]">
                {filteredConversations.length > 0 ? (
                  filteredConversations.map(conv => (
                    <div 
                      key={conv.id} 
                      onClick={() => setViewingRecord({ type: 'conversation', data: conv })}
                      className="p-4 hover:bg-[var(--crm-sidebar-active-bg)] transition-colors group cursor-pointer flex items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0 border border-emerald-500/20 shadow-xs">
                          <MessageSquare size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm text-[var(--crm-text)]">{conv.discussionTitle}</h3>
                            <PlatformBadge platform={conv.platform} />
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              {conv.status || 'Open'}
                            </span>
                            {conv.priority && (
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                conv.priority === 'High' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                conv.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                'bg-slate-500/10 text-slate-500 border-slate-500/20'
                              }`}>
                                {conv.priority}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[var(--crm-subtitle)] mt-1">
                            Contact: <span className="font-medium text-[var(--crm-text)]">{conv.leadName || conv.company || 'Client'}</span>
                            {conv.company && <span className="ml-1 text-[var(--crm-text-muted)]">({conv.company})</span>}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-[11px] text-[var(--crm-text-muted)]">
                            <span className="flex items-center gap-1">
                              <Calendar size={11} />
                              {conv.date}
                            </span>
                            {conv.assignedTeamMember && (
                              <span className="flex items-center gap-1">
                                <User size={11} />
                                {conv.assignedTeamMember}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setViewingRecord({ type: 'conversation', data: conv }); }}
                          className="p-2 text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] hover:bg-[var(--crm-sidebar)] rounded-lg transition-all"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onDeleteConversationDiscussion(conv.id); }}
                          className="p-2 text-[var(--crm-text-muted)] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                          title="Delete Conversation"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <MessageSquare size={44} className="text-[var(--crm-text-muted)] mb-3 opacity-30" />
                    <p className="text-[var(--crm-subtitle)] font-medium text-sm">No conversation records found</p>
                    <p className="text-[var(--crm-text-muted)] text-xs mt-1">Click "Add Record" to log a conversation.</p>
                  </div>
                )}
              </div>
            )}

            {activeSubTab === 'meetings' && (() => {
              const today = new Date().toISOString().split('T')[0];
              const upcomingMeetings = filteredMeetings.filter(m => m.date >= today && m.status !== 'Cancelled').sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
              const pastMeetings = filteredMeetings.filter(m => m.date < today || m.status === 'Cancelled').sort((a, b) => b.date.localeCompare(a.date));

              return (
                <div className="space-y-6 max-w-4xl 2xl:max-w-5xl 3xl:max-w-7xl 3xl:max-w-[1600px] 4k:max-w-[2200px] 5k:max-w-[3400px] 4k:max-w-[1600px] 5k:max-w-[2400px] max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredMeetings.length > 0 ? (
                    <>
                      {upcomingMeetings.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-[var(--crm-text-muted)] uppercase tracking-wider px-1">Upcoming Meetings</h4>
                          {upcomingMeetings.map((meeting) => (
                            <div key={meeting.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-[var(--crm-sidebar)] border border-transparent hover:border-[var(--crm-card-border)] transition-all cursor-pointer">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 shrink-0 border border-purple-500/20 shadow-xs">
                                  <Video size={18} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-sm text-[var(--crm-text)]">{meeting.title || 'Meeting'}</h3>
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                      meeting.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                      meeting.status === 'Cancelled' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                      'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                    }`}>
                                      {meeting.status}
                                    </span>
                                  </div>
                                  <p className="text-xs text-[var(--crm-subtitle)] mt-1">
                                    With: <span className="font-medium text-[var(--crm-text)]">{meeting.clientName}</span>
                                    <span className="ml-2 text-[var(--crm-text-muted)]">• {meeting.platform}</span>
                                  </p>
                                  <div className="flex items-center gap-4 mt-2 text-[11px] text-[var(--crm-text-muted)]">
                                    <span className="flex items-center gap-1 font-medium text-amber-500">
                                      <Calendar size={11} />
                                      {new Date(meeting.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at {meeting.time}
                                    </span>
                                    {meeting.duration && (
                                      <span className="flex items-center gap-1">
                                        <Clock size={11} />
                                        {meeting.duration}
                                      </span>
                                    )}
                                    {meeting.assignedTeamMember && (
                                      <span className="flex items-center gap-1">
                                        <User size={11} />
                                        {meeting.assignedTeamMember}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {meeting.url && meeting.url.length > 0 && (
                                  <a 
                                    href={meeting.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="px-3 py-1.5 bg-[var(--crm-primary)] hover:bg-opacity-90 text-white rounded-lg text-xs font-medium transition-all shadow-xs mr-2"
                                  >
                                    Join URL
                                  </a>
                                )}
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setViewingRecord({ type: 'meeting', data: meeting }); }}
                                  className="p-2 text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] hover:bg-[var(--crm-sidebar)] rounded-lg transition-all"
                                  title="View Details"
                                >
                                  <Eye size={16} />
                                </button>
                                {onDeleteMeeting && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); onDeleteMeeting(meeting.id); }}
                                    className="p-2 text-[var(--crm-text-muted)] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                    title="Delete Meeting"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {pastMeetings.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-[var(--crm-text-muted)] uppercase tracking-wider px-1">Past & Cancelled</h4>
                          {pastMeetings.map((meeting) => (
                            <div key={meeting.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-[var(--crm-sidebar)] border border-transparent hover:border-[var(--crm-card-border)] transition-all cursor-pointer opacity-80 hover:opacity-100">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-[var(--crm-sidebar)] flex items-center justify-center text-[var(--crm-text-muted)] shrink-0 border border-[var(--crm-card-border)] shadow-xs">
                                  <Video size={18} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-sm text-[var(--crm-text)]">{meeting.title || 'Meeting'}</h3>
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                      meeting.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                      meeting.status === 'Cancelled' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                      'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                    }`}>
                                      {meeting.status}
                                    </span>
                                  </div>
                                  <p className="text-xs text-[var(--crm-subtitle)] mt-1">
                                    With: <span className="font-medium text-[var(--crm-text)]">{meeting.clientName}</span>
                                    <span className="ml-2 text-[var(--crm-text-muted)]">• {meeting.platform}</span>
                                  </p>
                                  <div className="flex items-center gap-4 mt-2 text-[11px] text-[var(--crm-text-muted)]">
                                    <span className="flex items-center gap-1">
                                      <Calendar size={11} />
                                      {new Date(meeting.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at {meeting.time}
                                    </span>
                                    {meeting.duration && (
                                      <span className="flex items-center gap-1">
                                        <Clock size={11} />
                                        {meeting.duration}
                                      </span>
                                    )}
                                    {meeting.assignedTeamMember && (
                                      <span className="flex items-center gap-1">
                                        <User size={11} />
                                        {meeting.assignedTeamMember}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setViewingRecord({ type: 'meeting', data: meeting }); }}
                                  className="p-2 text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] hover:bg-[var(--crm-sidebar)] rounded-lg transition-all"
                                  title="View Details"
                                >
                                  <Eye size={16} />
                                </button>
                                {onDeleteMeeting && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); onDeleteMeeting(meeting.id); }}
                                    className="p-2 text-[var(--crm-text-muted)] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                    title="Delete Meeting"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <Video size={44} className="text-[var(--crm-text-muted)] mb-3 opacity-30" />
                      <p className="text-[var(--crm-subtitle)] font-medium text-sm">No meeting records found</p>
                      <p className="text-[var(--crm-text-muted)] text-xs mt-1">Click "Add Record" to schedule a meeting.</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      ) : (
        /* Scripts & Templates Tab */
        <ScriptsAndTemplatesManager
          callScripts={callScripts}
          emailScripts={emailScripts}
          onAddCallScript={onAddCallScript}
          onUpdateCallScript={onUpdateCallScript}
          onDeleteCallScript={onDeleteCallScript}
          onDuplicateCallScript={onDuplicateCallScript}
          onAddEmailScript={onAddEmailScript}
          onUpdateEmailScript={onUpdateEmailScript}
          onDeleteEmailScript={onDeleteEmailScript}
          onDuplicateEmailScript={onDuplicateEmailScript}
        />
      )}

      {/* ========================================================= */}
      {/* ADD RECORD FORM MODAL (Global CRM Form Styling) */}
      {/* ========================================================= */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-2xl max-w-2xl 3xl:max-w-4xl 4k:max-w-5xl 5k:max-w-7xl w-full shadow-2xl overflow-hidden my-8"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-[var(--crm-card-border)] flex items-center justify-between bg-[var(--crm-sidebar)]">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--crm-heading)]">Add Communication Record</h2>
                  <p className="text-xs text-[var(--crm-subtitle)]">Log an email, call, or discussion with a client or lead.</p>
                </div>
                <button 
                  onClick={handleCloseAddModal}
                  className="p-1.5 text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] rounded-lg hover:bg-[var(--crm-sidebar-active-bg)] transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSaveRecord} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                {formError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs font-medium flex items-center gap-2">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* RECORD TYPE SELECTOR */}
                <div>
                  <label className="block text-xs font-medium text-[var(--crm-text-secondary)] mb-2">
                    Record Type <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2 p-1 bg-[var(--crm-sidebar)] rounded-xl border border-[var(--crm-card-border)]">
                    <button
                      type="button"
                      onClick={() => setRecordType('email')}
                      className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        recordType === 'email'
                          ? 'bg-[var(--crm-primary)] text-white shadow-xs font-semibold'
                          : 'text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)]'
                      }`}
                    >
                      <Mail size={14} />
                      <span>Email</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRecordType('call')}
                      className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        recordType === 'call'
                          ? 'bg-[var(--crm-primary)] text-white shadow-xs font-semibold'
                          : 'text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)]'
                      }`}
                    >
                      <Phone size={14} />
                      <span>Call Log</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRecordType('conversation')}
                      className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        recordType === 'conversation'
                          ? 'bg-[var(--crm-primary)] text-white shadow-xs font-semibold'
                          : 'text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)]'
                      }`}
                    >
                      <MessageSquare size={14} />
                      <span>Conversation</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRecordType('meeting')}
                      className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        recordType === 'meeting'
                          ? 'bg-[var(--crm-primary)] text-white shadow-xs font-semibold'
                          : 'text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)]'
                      }`}
                    >
                      <Video size={14} />
                      <span>Meeting</span>
                    </button>
                  </div>
                </div>

                {/* STEP 1: ENTITY SELECTION ("Who is this record for?") */}
                <div className="p-4 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--crm-primary)]">
                      1. Who is this record for? <span className="text-rose-500">*</span>
                    </label>
                    {selectedEntityKey && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        <CheckCircle2 size={12} />
                        Entity Linked
                      </span>
                    )}
                  </div>

                  {/* Toggle: Lead vs Client */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-[var(--crm-card)] rounded-xl border border-[var(--crm-card-border)]">
                    <button
                      type="button"
                      onClick={() => { setContactType('client'); setSelectedEntityKey(''); setContactName(''); setContactCompany(''); setContactEmail(''); setContactPhone(''); setEntitySearchQuery(''); }}
                      className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        contactType === 'client'
                          ? 'bg-[var(--crm-primary)] text-white shadow-xs'
                          : 'text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)]'
                      }`}
                    >
                      <span>Client</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setContactType('lead'); setSelectedEntityKey(''); setContactName(''); setContactCompany(''); setContactEmail(''); setContactPhone(''); setEntitySearchQuery(''); }}
                      className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        contactType === 'lead'
                          ? 'bg-[var(--crm-primary)] text-white shadow-xs'
                          : 'text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)]'
                      }`}
                    >
                      <span>Lead</span>
                    </button>
                  </div>

                  {/* Search and Select Entity */}
                  {contactType ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--crm-text-muted)]" />
                        <input
                          type="text"
                          placeholder={`Filter ${contactType === 'client' ? 'clients' : 'leads'} by name, company or email...`}
                          value={entitySearchQuery}
                          onChange={(e) => setEntitySearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-1.5 bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[var(--crm-primary)]/20"
                        />
                      </div>

                      <select
                        value={selectedEntityKey}
                        onChange={(e) => handleEntityChange(e.target.value)}
                        className="w-full bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--crm-primary)]/20 cursor-pointer font-medium"
                        required
                      >
                        <option value="">-- Select {contactType === 'client' ? 'Client' : 'Lead'} Record --</option>
                        {contactType === 'client' ? (
                          filteredClientsList.map(c => (
                            <option key={`client-${c.id}`} value={`client-${c.id}`}>
                              {c.company ? `${c.company} (${c.name || 'Client'})` : c.name} {c.email ? `- ${c.email}` : ''}
                            </option>
                          ))
                        ) : (
                          filteredLeadsList.map(l => (
                            <option key={`lead-${l.id}`} value={`lead-${l.id}`}>
                              {l.name} {l.company ? `(${l.company})` : ''} {l.email ? `- ${l.email}` : ''}
                            </option>
                          ))
                        )}
                      </select>

                      {/* Display summary badge of selected record */}
                      {selectedEntityKey && (
                        <div className="p-3 bg-[var(--crm-card)] rounded-xl border border-[var(--crm-card-border)] text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[var(--crm-text)]">{contactName || 'Selected Entity'}</span>
                            <span className="text-[10px] text-[var(--crm-text-muted)] uppercase tracking-wider font-semibold">
                              ID: {selectedEntityKey}
                            </span>
                          </div>
                          {(contactCompany || contactEmail || contactPhone) && (
                            <div className="text-[11px] text-[var(--crm-subtitle)] flex flex-wrap gap-x-3 gap-y-1">
                              {contactCompany && <span>Co: {contactCompany}</span>}
                              {contactEmail && <span>Email: {contactEmail}</span>}
                              {contactPhone && <span>Phone: {contactPhone}</span>}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--crm-subtitle)] italic">
                      Please select whether this communication record belongs to a Lead or a Client.
                    </p>
                  )}
                </div>

                {/* STEP 2: RECORD METADATA & PROJECT */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Related Project */}
                  <div>
                    <label className="block text-xs font-medium text-[var(--crm-text-secondary)] mb-1">
                      Related Project
                    </label>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      className="w-full bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--crm-primary)]/20 cursor-pointer"
                    >
                      <option value="">-- No Specific Project --</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.clientName || 'General'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Assigned Team Member */}
                  <div>
                    <label className="block text-xs font-medium text-[var(--crm-text-secondary)] mb-1">
                      Assigned Team Member
                    </label>
                    <select
                      value={selectedAssignedMember}
                      onChange={(e) => setSelectedAssignedMember(e.target.value)}
                      className="w-full bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--crm-primary)]/20 cursor-pointer"
                    >
                      <option value="">-- Assign Member --</option>
                      {teamMembers.map(tm => (
                        <option key={tm.id} value={tm.fullName}>
                          {tm.fullName} ({tm.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date & Time */}
                  <div>
                    <label className="block text-xs font-medium text-[var(--crm-text-secondary)] mb-1">
                      Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={recordDate}
                      onChange={(e) => setRecordDate(e.target.value)}
                      className="w-full bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--crm-primary)]/20"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--crm-text-secondary)] mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      value={recordTime}
                      onChange={(e) => setRecordTime(e.target.value)}
                      className="w-full bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--crm-primary)]/20"
                    />
                  </div>
                </div>

                {/* DYNAMIC FIELDS: EMAIL */}
                {recordType === 'email' && (
                  <div className="space-y-4 pt-2 border-t border-[var(--crm-card-border)]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[var(--crm-text-secondary)] mb-1">
                          Subject <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Project Update & Proposal Review"
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          className="w-full bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--crm-primary)]/20"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[var(--crm-text-secondary)] mb-1">
                          Email Direction
                        </label>
                        <select
                          value={emailDirection}
                          onChange={(e) => setEmailDirection(e.target.value as any)}
                          className="w-full bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--crm-primary)]/20 cursor-pointer"
                        >
                          <option value="Sent">Sent to Client</option>
                          <option value="Received">Received from Client</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[var(--crm-text-secondary)] mb-1">
                          Follow-up Status
                        </label>
                        <select
                          value={emailFollowUpStatus}
                          onChange={(e) => setEmailFollowUpStatus(e.target.value as any)}
                          className="w-full bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--crm-primary)]/20 cursor-pointer"
                        >
                          <option value="None">None</option>
                          <option value="Needs Follow-up">Needs Follow-up</option>
                          <option value="Pending Client">Pending Client Response</option>
                          <option value="Closed">Closed / Completed</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[var(--crm-text-secondary)] mb-1">
                          Attachments (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Invoice_102.pdf, Proposal.docx"
                          value={emailAttachments}
                          onChange={(e) => setEmailAttachments(e.target.value)}
                          className="w-full bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--crm-primary)]/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[var(--crm-text-secondary)] mb-1">
                        Email Content / Summary <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Paste or summarize the main email body content..."
                        value={emailContent}
                        onChange={(e) => setEmailContent(e.target.value)}
                        className="w-full bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--crm-primary)]/20 resize-y"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[var(--crm-text-secondary)] mb-1">
                        Internal Notes
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Internal team notes regarding this email..."
                        value={emailNotes}
                        onChange={(e) => setEmailNotes(e.target.value)}
                        className="w-full bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--crm-primary)]/20 resize-y"
                      />
                    </div>
                  </div>
                )}

                {/* DYNAMIC FIELDS: CALL */}
                {recordType === 'call' && (
                  <div className="space-y-4 pt-2 border-t border-[var(--crm-card-border)]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[var(--crm-text-secondary)] mb-1">
                          Call Duration
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 15 mins, 45 mins"
                          value={callDuration}
                          onChange={(e) => setCallDuration(e.target.value)}
                          className="w-full bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--crm-primary)]/20"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[var(--crm-text-secondary)] mb-1">
                          Call Outcome / Status
                        </label>
                        <select
                          value={callStatus}
                          onChange={(e) => setCallStatus(e.target.value as any)}
                          className="w-full bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--crm-primary)]/20 cursor-pointer"
                        >
                          <option value="Connected">Connected & Discussed</option>
                          <option value="No Answer">No Answer / Missed</option>
                          <option value="Busy">Line Busy</option>
                          <option value="Voicemail">Left Voicemail</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[var(--crm-text-secondary)] mb-1">
                        Call Summary & Discussion Points <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Summarize the key outcomes and topics discussed during the call..."
                        value={callSummary}
                        onChange={(e) => setCallSummary(e.target.value)}
                        className="w-full bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--crm-primary)]/20 resize-y"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[var(--crm-text-secondary)] mb-1">
                          Client Requirements Mentioned
                        </label>
                        <textarea
                          rows={2}
                          placeholder="e.g. Requested revised timeline and quote for SMM..."
                          value={callRequirements}
                          onChange={(e) => setCallRequirements(e.target.value)}
                          className="w-full bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--crm-primary)]/20 resize-y"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[var(--crm-text-secondary)] mb-1">
                          Follow-up Actions Required
                        </label>
                        <textarea
                          rows={2}
                          placeholder="e.g. Send proposal document by Thursday..."
                          value={callFollowUpActions}
                          onChange={(e) => setCallFollowUpActions(e.target.value)}
                          className="w-full bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--crm-primary)]/20 resize-y"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* DYNAMIC FIELDS: CONVERSATION */}
                {recordType === 'conversation' && (
                  <div className="space-y-4 pt-2 border-t border-[var(--crm-card-border)]">
                    {/* REQUIRED PLATFORM FIELD */}
                    <div>
                      <label className="block text-xs font-bold text-[var(--crm-text)] mb-1.5 flex items-center justify-between">
                        <span>Communication Platform <span className="text-rose-500">*</span></span>
                        <span className="text-[10px] text-[var(--crm-text-muted)] font-normal">REQUIRED FOR CONVERSATIONS</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {Object.entries(PLATFORM_CONFIGS).map(([key, cfg]) => {
                          const isSelected = conversationPlatform === key;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setConversationPlatform(key as any)}
                              className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                                isSelected 
                                  ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-2 ring-[var(--crm-primary)]/30 font-bold shadow-xs` 
                                  : 'bg-[var(--crm-input-bg)] border-[var(--crm-card-border)] text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)] hover:border-[var(--crm-text-muted)]'
                              }`}
                            >
                              <span className="shrink-0">{cfg.icon}</span>
                              <span className="truncate">{cfg.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-3">
                        <label className="block text-xs font-medium text-[var(--crm-text-secondary)] mb-1">
                          Discussion Title <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. WhatsApp Consultation re: Website Redesign"
                          value={conversationTitle}
                          onChange={(e) => setConversationTitle(e.target.value)}
                          className="w-full bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--crm-primary)]/20"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[var(--crm-text-secondary)] mb-1">
                          Priority
                        </label>
                        <select
                          value={priority}
                          onChange={(e) => setPriority(e.target.value as any)}
                          className="w-full bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--crm-primary)]/20 cursor-pointer"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[var(--crm-text-secondary)] mb-1">
                          Status
                        </label>
                        <select
                          value={conversationStatus}
                          onChange={(e) => setConversationStatus(e.target.value as any)}
                          className="w-full bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--crm-primary)]/20 cursor-pointer"
                        >
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Pending Response">Pending Response</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[var(--crm-text-secondary)] mb-1">
                          Follow-up Date
                        </label>
                        <input
                          type="date"
                          value={followUpDate}
                          onChange={(e) => setFollowUpDate(e.target.value)}
                          className="w-full bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--crm-primary)]/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[var(--crm-text-secondary)] mb-1">
                        Conversation Summary <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Enter conversation notes or key points exchanged..."
                        value={conversationSummary}
                        onChange={(e) => setConversationSummary(e.target.value)}
                        className="w-full bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--crm-primary)]/20 resize-y"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[var(--crm-text-secondary)] mb-1">
                          Client Response / Feedback
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Client's response or specific feedback..."
                          value={clientResponse}
                          onChange={(e) => setClientResponse(e.target.value)}
                          className="w-full bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--crm-primary)]/20 resize-y"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[var(--crm-text-secondary)] mb-1">
                          Next Action Required
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Action steps needed..."
                          value={nextAction}
                          onChange={(e) => setNextAction(e.target.value)}
                          className="w-full bg-[var(--crm-input-bg)] border border(--crm-card-border)] text-[var(--crm-text)] rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--crm-primary)]/20 resize-y"
                        />
                      </div>
                    </div>

                    {/* Chat Attachments Upload Section */}
                    <div className="space-y-2 pt-2 border-t border-[var(--crm-card-border)]">
                      <label className="block text-xs font-semibold text-[var(--crm-text)] flex items-center gap-1.5">
                        <Paperclip size={14} className="text-[var(--crm-primary)]" />
                        <span>Chat Attachments (Screenshots, Wireframes, Documents)</span>
                      </label>
                      
                      {/* Dropzone / Upload button */}
                      <div className="flex items-center gap-4">
                        <label className="flex-1 flex flex-col items-center justify-center border border-dashed border-[var(--crm-card-border)] rounded-2xl p-4 bg-[var(--crm-sidebar)] hover:bg-[var(--crm-sidebar-active-bg)] transition-all cursor-pointer group">
                          <input 
                            type="file" 
                            multiple 
                            className="hidden" 
                            onChange={(e) => {
                              if (e.target.files) {
                                Array.from(e.target.files).forEach(file => handleUploadAttachment(file));
                              }
                            }}
                          />
                          <UploadCloud size={24} className="text-[var(--crm-text-muted)] group-hover:text-[var(--crm-primary)] transition-colors mb-1.5" />
                          <span className="text-xs font-semibold text-[var(--crm-text)]">Click to attach files</span>
                          <span className="text-[10px] text-[var(--crm-text-muted)] mt-0.5">Drag-and-drop also supported</span>
                        </label>
                      </div>

                      {/* Progress bar */}
                      {isUploadingAttachment && (
                        <div className="space-y-1 bg-[var(--crm-sidebar)] p-3 rounded-xl border border-[var(--crm-card-border)]">
                          <div className="flex justify-between text-[11px] font-semibold text-[var(--crm-text-secondary)]">
                            <span className="flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Uploading attachment...</span>
                            <span>{attachmentProgress}%</span>
                          </div>
                          <div className="w-full bg-[var(--crm-card-border)] h-1.5 rounded-full overflow-hidden">
                            <div className="bg-[var(--crm-primary)] h-full transition-all duration-150" style={{ width: `${attachmentProgress}%` }}></div>
                          </div>
                        </div>
                      )}

                      {/* Display Uploaded Attachments */}
                      {uploadedAttachments.length > 0 && (
                        <div className="grid grid-cols-1 gap-2 mt-2">
                          {uploadedAttachments.map((att, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2.5 bg-[var(--crm-card)] rounded-xl border border-[var(--crm-card-border)] text-xs">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                  {att.fileType.startsWith('image/') ? <Image size={14} /> : <FileText size={14} />}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-[var(--crm-text)] truncate">{att.name}</p>
                                  <p className="text-[10px] text-[var(--crm-text-muted)]">{att.size}</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setUploadedAttachments(prev => prev.filter((_, i) => i !== idx))}
                                className="p-1.5 text-[var(--crm-text-muted)] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                                title="Remove Attachment"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* MEETING FIELDS */}
                {recordType === 'meeting' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[var(--crm-text-secondary)] mb-1">
                          Meeting Title
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Discovery Call"
                          value={meetingTitle}
                          onChange={(e) => setMeetingTitle(e.target.value)}
                          className="w-full bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--crm-primary)]/20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--crm-text-secondary)] mb-1">
                          Status
                        </label>
                        <select
                          value={meetingStatus}
                          onChange={(e) => setMeetingStatus(e.target.value as any)}
                          className="w-full bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--crm-primary)]/20"
                        >
                          <option value="Booked">Booked</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[var(--crm-text-secondary)] mb-1">
                          Platform
                        </label>
                        <select
                          value={meetingPlatform}
                          onChange={(e) => setMeetingPlatform(e.target.value as any)}
                          className="w-full bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--crm-primary)]/20"
                        >
                          <option value="Google Meet">Google Meet</option>
                          <option value="Zoom">Zoom</option>
                          <option value="Microsoft Teams">Microsoft Teams</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--crm-text-secondary)] mb-1">
                          Duration
                        </label>
                        <select
                          value={meetingDuration}
                          onChange={(e) => setMeetingDuration(e.target.value)}
                          className="w-full bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--crm-primary)]/20"
                        >
                          <option value="15 mins">15 mins</option>
                          <option value="30 mins">30 mins</option>
                          <option value="45 mins">45 mins</option>
                          <option value="1 hour">1 hour</option>
                          <option value="1.5 hours">1.5 hours</option>
                          <option value="2 hours+">2 hours+</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[var(--crm-text-secondary)] mb-1">
                        Meeting URL <span className="text-[var(--crm-text-muted)]">(Optional)</span>
                      </label>
                      <input
                        type="url"
                        placeholder="https://meet.google.com/..."
                        value={meetingUrl}
                        onChange={(e) => setMeetingUrl(e.target.value)}
                        className="w-full bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--crm-primary)]/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[var(--crm-text-secondary)] mb-1">
                        Meeting Notes
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Agenda or notes for this meeting..."
                        value={meetingNotes}
                        onChange={(e) => setMeetingNotes(e.target.value)}
                        className="w-full bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--crm-primary)]/20 resize-y"
                      />
                    </div>
                  </div>
                )}

                {/* Modal Footer Actions */}
                <div className="pt-4 border-t border-[var(--crm-card-border)] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseAddModal}
                    disabled={isSaving}
                    className="px-4 py-2 rounded-xl text-xs font-medium bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[var(--crm-text)] hover:bg-[var(--crm-sidebar-active-bg)] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl text-xs font-medium bg-[var(--crm-primary)] hover:bg-[var(--crm-primary-hover)] text-white flex items-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={15} />
                        <span>Save Record</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* RECORD DETAIL VIEW MODAL */}
      {/* ========================================================= */}
      <AnimatePresence>
        {viewingRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-2xl max-w-xl 2xl:max-w-2xl 3xl:max-w-3xl 4k:max-w-5xl 5k:max-w-6xl w-full shadow-2xl overflow-hidden my-8"
            >
              <div className="px-6 py-4 border-b border-[var(--crm-card-border)] flex items-center justify-between bg-[var(--crm-sidebar)]">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl text-white ${
                    viewingRecord.type === 'email' ? 'bg-indigo-600' :
                    viewingRecord.type === 'call' ? 'bg-blue-600' : 'bg-emerald-600'
                  }`}>
                    {viewingRecord.type === 'email' && <Mail size={16} />}
                    {viewingRecord.type === 'call' && <Phone size={16} />}
                    {viewingRecord.type === 'conversation' && <MessageSquare size={16} />}
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-[var(--crm-heading)] capitalize">
                      {viewingRecord.type} Details
                    </h2>
                    <p className="text-xs text-[var(--crm-subtitle)]">
                      {(viewingRecord.data as any).clientName || (viewingRecord.data as any).leadName || (viewingRecord.data as any).company || 'Record Overview'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingRecord(null)}
                  className="p-1.5 text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] rounded-lg hover:bg-[var(--crm-sidebar-active-bg)] transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
                {viewingRecord.type === 'email' && (() => {
                  const data = viewingRecord.data as EmailDiscussion;
                  return (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-semibold text-[var(--crm-text-muted)] tracking-wider">Subject</span>
                        <h3 className="text-sm font-semibold text-[var(--crm-text)]">{data.subject}</h3>
                      </div>

                      <div className="grid grid-cols-2 gap-3 p-3 bg-[var(--crm-sidebar)] rounded-xl border border-[var(--crm-card-border)]">
                        <div>
                          <span className="text-[10px] text-[var(--crm-text-muted)]">Contact</span>
                          <p className="font-medium text-[var(--crm-text)]">{data.clientName}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--crm-text-muted)]">Direction</span>
                          <p className="font-medium text-[var(--crm-text)]">{data.direction}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--crm-text-muted)]">Date</span>
                          <p className="font-medium text-[var(--crm-text)]">{new Date(data.date).toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--crm-text-muted)]">Assigned To</span>
                          <p className="font-medium text-[var(--crm-text)]">{data.assignedTeamMember || 'Unassigned'}</p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-semibold text-[var(--crm-text-muted)] tracking-wider">Email Content</span>
                        <div className="p-3 bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] rounded-xl text-[var(--crm-text)] whitespace-pre-wrap leading-relaxed">
                          {data.content}
                        </div>
                      </div>

                      {data.notes && (
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-semibold text-[var(--crm-text-muted)] tracking-wider">Internal Notes</span>
                          <p className="p-3 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl text-[var(--crm-subtitle)]">
                            {data.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {viewingRecord.type === 'call' && (() => {
                  const data = viewingRecord.data as CallDiscussion;
                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3 p-3 bg-[var(--crm-sidebar)] rounded-xl border border-[var(--crm-card-border)]">
                        <div>
                          <span className="text-[10px] text-[var(--crm-text-muted)]">Contact</span>
                          <p className="font-medium text-[var(--crm-text)]">{data.clientName}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--crm-text-muted)]">Duration</span>
                          <p className="font-medium text-[var(--crm-text)]">{data.duration}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--crm-text-muted)]">Call Date</span>
                          <p className="font-medium text-[var(--crm-text)]">{new Date(data.callDate).toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--crm-text-muted)]">Status</span>
                          <p className="font-medium text-[var(--crm-text)]">{data.status}</p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-semibold text-[var(--crm-text-muted)] tracking-wider">Call Summary</span>
                        <div className="p-3 bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] rounded-xl text-[var(--crm-text)] whitespace-pre-wrap leading-relaxed">
                          {data.summary}
                        </div>
                      </div>

                      {data.requirements && (
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-semibold text-[var(--crm-text-muted)] tracking-wider">Requirements Discussed</span>
                          <p className="p-3 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl text-[var(--crm-subtitle)]">
                            {data.requirements}
                          </p>
                        </div>
                      )}

                      {data.followUpActions && (
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-semibold text-[var(--crm-text-muted)] tracking-wider">Follow-up Actions</span>
                          <p className="p-3 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl text-[var(--crm-subtitle)]">
                            {data.followUpActions}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {viewingRecord.type === 'conversation' && (() => {
                  const data = viewingRecord.data as ConversationDiscussion;
                  return (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-semibold text-[var(--crm-text-muted)] tracking-wider">Title</span>
                        <h3 className="text-sm font-semibold text-[var(--crm-text)]">{data.discussionTitle}</h3>
                      </div>

                      <div className="grid grid-cols-2 gap-3 p-3 bg-[var(--crm-sidebar)] rounded-xl border border-[var(--crm-card-border)]">
                        <div>
                          <span className="text-[10px] text-[var(--crm-text-muted)]">Contact</span>
                          <p className="font-medium text-[var(--crm-text)]">{data.leadName}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--crm-text-muted)]">Status</span>
                          <p className="font-medium text-[var(--crm-text)]">{data.status}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--crm-text-muted)]">Date & Time</span>
                          <p className="font-medium text-[var(--crm-text)]">{data.date} {data.time}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--crm-text-muted)]">Priority</span>
                          <p className="font-medium text-[var(--crm-text)]">{data.priority}</p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-semibold text-[var(--crm-text-muted)] tracking-wider">Summary</span>
                        <div className="p-3 bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] rounded-xl text-[var(--crm-text)] whitespace-pre-wrap leading-relaxed">
                          {data.conversationSummary}
                        </div>
                      </div>

                      {data.clientResponse && (
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-semibold text-[var(--crm-text-muted)] tracking-wider">Client Response</span>
                          <p className="p-3 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl text-[var(--crm-subtitle)]">
                            {data.clientResponse}
                          </p>
                        </div>
                      )}

                      {data.attachments && data.attachments.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[10px] uppercase font-semibold text-[var(--crm-text-muted)] tracking-wider">Attachments</span>
                          <div className="grid grid-cols-1 gap-2">
                            {data.attachments.map((att, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2.5 bg-[var(--crm-sidebar)] rounded-xl border border-[var(--crm-card-border)] text-xs">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                    {att.fileType?.startsWith('image/') ? <Image size={14} /> : <FileText size={14} />}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-[var(--crm-text)] truncate">{att.name}</p>
                                    <p className="text-[10px] text-[var(--crm-text-muted)]">{att.size}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {att.fileType?.startsWith('image/') && (
                                    <a 
                                      href={att.fileUrl} 
                                      target="_blank" 
                                      referrerPolicy="no-referrer"
                                      className="p-1.5 text-[var(--crm-text-muted)] hover:text-[var(--crm-primary)] hover:bg-[var(--crm-card)] rounded-lg transition-all"
                                      title="Preview"
                                    >
                                      <Eye size={14} />
                                    </a>
                                  )}
                                  <a 
                                    href={att.fileUrl} 
                                    download={att.name}
                                    className="p-1.5 text-[var(--crm-text-muted)] hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all"
                                    title="Download"
                                  >
                                    <Download size={14} />
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {viewingRecord.type === 'meeting' && (() => {
                  const data = viewingRecord.data as Meeting;
                  return (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-semibold text-[var(--crm-text-muted)] tracking-wider">Title</span>
                        <h3 className="text-sm font-semibold text-[var(--crm-text)]">{data.title || 'Meeting'}</h3>
                      </div>

                      <div className="grid grid-cols-2 gap-3 p-3 bg-[var(--crm-sidebar)] rounded-xl border border-[var(--crm-card-border)]">
                        <div>
                          <span className="text-[10px] text-[var(--crm-text-muted)]">Contact</span>
                          <p className="font-medium text-[var(--crm-text)]">{data.clientName}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--crm-text-muted)]">Status</span>
                          <p className="font-medium text-[var(--crm-text)]">{data.status}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--crm-text-muted)]">Platform</span>
                          <p className="font-medium text-[var(--crm-text)]">{data.platform}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--crm-text-muted)]">Duration</span>
                          <p className="font-medium text-[var(--crm-text)]">{data.duration}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--crm-text-muted)]">Date</span>
                          <p className="font-medium text-[var(--crm-text)]">{new Date(data.date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-[var(--crm-text-muted)]">Time</span>
                          <p className="font-medium text-[var(--crm-text)]">{data.time}</p>
                        </div>
                      </div>

                      {data.url && (
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-semibold text-[var(--crm-text-muted)] tracking-wider">Meeting URL</span>
                          <p className="p-3 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl text-[var(--crm-primary)]">
                            <a href={data.url} target="_blank" rel="noreferrer" className="hover:underline">{data.url}</a>
                          </p>
                        </div>
                      )}

                      {data.notes && (
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-semibold text-[var(--crm-text-muted)] tracking-wider">Notes</span>
                          <div className="p-3 bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] rounded-xl text-[var(--crm-text)] whitespace-pre-wrap leading-relaxed">
                            {data.notes}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="p-4 border-t border-[var(--crm-card-border)] bg-[var(--crm-sidebar)] flex justify-end">
                <button
                  onClick={() => setViewingRecord(null)}
                  className="px-4 py-2 bg-[var(--crm-card)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl text-xs font-medium hover:bg-[var(--crm-sidebar-active-bg)] transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
