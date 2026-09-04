import React, { useMemo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Mail, Phone, Calendar, Building2, Globe, ExternalLink, 
  User, Briefcase, Clock, FileText, Sliders, ArrowUpRight, 
  ArrowDownLeft, Paperclip, ChevronRight, Award, GraduationCap, 
  Instagram, Facebook, Linkedin, Link2, CheckCircle2, AlertCircle,
  MessageCircle, Edit3, ShieldCheck, FolderCheck, CheckSquare,
  Key, File, Folder, Users, DollarSign, Pencil, Trash2, Archive, RefreshCw, Star
} from 'lucide-react';
import { Lead, Client, TeamMember, EmailDiscussion, CallDiscussion, ConversationDiscussion, Project, ClientPortalAccount, TeamPortalAccount, ClientPaymentRecord } from '../types';
import { jsPDF } from 'jspdf';
import { getCollectionOnce } from '../lib/firebaseSync';
import { getMasterClientId } from '../lib/clientIdUtils';
import LeadProfileCard from './LeadProfileCard';

interface CrmProfileViewProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'Lead' | 'Client' | 'Team Member' | 'Portal';
  data: Lead | Client | TeamMember | any | null;
  emailDiscussions?: EmailDiscussion[];
  callDiscussions?: CallDiscussion[];
  conversationDiscussions?: ConversationDiscussion[];
  projects?: Project[];
  teamMembers?: TeamMember[];
  leads?: Lead[];
  clients?: Client[];
  clientPortals?: ClientPortalAccount[];
  teamPortals?: TeamPortalAccount[];
  clientPayments?: ClientPaymentRecord[];
  onUpdateLead?: (updatedLead: Lead) => void;
  onUpdateClient?: (updatedClient: Client) => void;
  onUpdateTeamMember?: (updatedTeamMember: TeamMember) => void;
  onUpdateProject?: (updatedProject: Project) => void;
  onEdit?: () => void;
  onDelete?: (id: string) => Promise<boolean | void> | void;
}

const StarRatingStatic = ({ rating, size = 14 }: { rating: number; size?: number }) => {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFull = star <= rating;
        const isHalf = !isFull && (star - 0.5) <= rating;
        return (
          <span
            key={star}
            className={`text-[15px] leading-none ${
              isFull
                ? 'text-amber-500'
                : isHalf
                ? 'text-amber-500 opacity-70'
                : 'text-zinc-200 dark:text-zinc-700'
            }`}
            style={{ fontSize: `${size}px` }}
          >
            ★
          </span>
        );
      })}
    </div>
  );
};

const StarRatingInteractive = ({ rating, onChange, size = 16 }: { rating: number; onChange: (r: number) => void; size?: number }) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const currentVal = hoverRating !== null ? hoverRating : rating;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= currentVal;
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(null)}
            className="cursor-pointer hover:scale-110 transition-transform focus:outline-none p-0.5"
          >
            <span
              className={`text-[18px] leading-none ${
                active
                  ? 'text-amber-500'
                  : 'text-zinc-200 dark:text-zinc-700'
              }`}
              style={{ fontSize: `${size}px` }}
            >
              ★
            </span>
          </button>
        );
      })}
      {rating > 0 && (
        <button
          type="button"
          onClick={() => onChange(0)}
          className="text-[10px] font-semibold text-rose-500 hover:text-rose-600 ml-1.5 uppercase tracking-wider"
        >
          Clear
        </button>
      )}
    </div>
  );
};

export default function CrmProfileView({
  isOpen,
  onClose,
  type,
  data,
  emailDiscussions = [],
  callDiscussions = [],
  conversationDiscussions = [],
  projects = [],
  teamMembers = [],
  leads = [],
  clients = [],
  clientPortals = [],
  teamPortals = [],
  clientPayments = [],
  onUpdateLead,
  onUpdateClient,
  onUpdateTeamMember,
  onUpdateProject,
  onEdit,
  onDelete
}: CrmProfileViewProps) {
  
  const [showFollowUpModal, setShowFollowUpModal] = React.useState(false);
  const [showMeetingModal, setShowMeetingModal] = React.useState(false);
  const [showNoteModal, setShowNoteModal] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Rating States
  const [showRatingModal, setShowRatingModal] = React.useState(false);
  const [rateWorkQuality, setRateWorkQuality] = React.useState(0);
  const [rateCommunication, setRateCommunication] = React.useState(0);
  const [rateReliability, setRateReliability] = React.useState(0);
  const [rateTechnicalSkills, setRateTechnicalSkills] = React.useState(0);
  const [rateDeadlineManagement, setRateDeadlineManagement] = React.useState(0);
  const [rateClientHandling, setRateClientHandling] = React.useState(0);
  const [rateTeamwork, setRateTeamwork] = React.useState(0);
  const [rateNotes, setRateNotes] = React.useState('');

  const handleOpenRatingModal = () => {
    if (!teamData) return;
    setRateWorkQuality(teamData.ratingCategories?.workQuality || 0);
    setRateCommunication(teamData.ratingCategories?.communication || 0);
    setRateReliability(teamData.ratingCategories?.reliability || 0);
    setRateTechnicalSkills(teamData.ratingCategories?.technicalSkills || 0);
    setRateDeadlineManagement(teamData.ratingCategories?.deadlineManagement || 0);
    setRateClientHandling(teamData.ratingCategories?.clientHandling || 0);
    setRateTeamwork(teamData.ratingCategories?.teamwork || 0);
    setRateNotes(teamData.ratingNotes || '');
    setShowRatingModal(true);
  };

  const handleSaveRating = () => {
    if (!teamData || !onUpdateTeamMember) return;

    const ratingVals = [
      rateWorkQuality,
      rateCommunication,
      rateReliability,
      rateTechnicalSkills,
      rateDeadlineManagement,
      rateClientHandling,
      rateTeamwork
    ].filter(r => r > 0);

    const calculatedOverallRating = ratingVals.length > 0 
      ? Number((ratingVals.reduce((sum, v) => sum + v, 0) / ratingVals.length).toFixed(1))
      : 0;

    const ratingCategoriesObj = {
      workQuality: rateWorkQuality || undefined,
      communication: rateCommunication || undefined,
      reliability: rateReliability || undefined,
      technicalSkills: rateTechnicalSkills || undefined,
      deadlineManagement: rateDeadlineManagement || undefined,
      clientHandling: rateClientHandling || undefined,
      teamwork: rateTeamwork || undefined,
    };

    const ratingHasChanged = (
      rateWorkQuality !== (teamData.ratingCategories?.workQuality || 0) ||
      rateCommunication !== (teamData.ratingCategories?.communication || 0) ||
      rateReliability !== (teamData.ratingCategories?.reliability || 0) ||
      rateTechnicalSkills !== (teamData.ratingCategories?.technicalSkills || 0) ||
      rateDeadlineManagement !== (teamData.ratingCategories?.deadlineManagement || 0) ||
      rateClientHandling !== (teamData.ratingCategories?.clientHandling || 0) ||
      rateTeamwork !== (teamData.ratingCategories?.teamwork || 0) ||
      rateNotes !== (teamData.ratingNotes || '')
    );

    let updatedHistory = teamData.ratingHistory || [];
    if (ratingHasChanged && calculatedOverallRating > 0) {
      const newHistoryEntry = {
        id: `rh-${Date.now()}`,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
        overallRating: calculatedOverallRating,
        categoryRatings: { ...ratingCategoriesObj },
        reviewer: 'Admin',
        notes: rateNotes.trim() || undefined
      };
      updatedHistory = [newHistoryEntry, ...updatedHistory];
    }

    const updatedMember: TeamMember = {
      ...teamData,
      currentRating: calculatedOverallRating || undefined,
      ratingCategories: calculatedOverallRating > 0 ? ratingCategoriesObj : undefined,
      ratingNotes: rateNotes.trim() || undefined,
      ratingUpdatedAt: ratingHasChanged && calculatedOverallRating > 0 ? new Date().toISOString() : (teamData.ratingUpdatedAt || undefined),
      ratingHistory: updatedHistory
    };

    onUpdateTeamMember(updatedMember);
    setShowRatingModal(false);
  };

  const handleDeleteHistoryEntry = (entryId: string) => {
    if (!teamData || !onUpdateTeamMember) return;
    if (!window.confirm("Are you sure you want to delete this rating history entry? This will NOT delete the team member or other data.")) return;

    const updatedHistory = (teamData.ratingHistory || []).filter(e => e.id !== entryId);
    const hasHistoryRemaining = updatedHistory.length > 0;
    
    const updatedMember: TeamMember = {
      ...teamData,
      ratingHistory: updatedHistory,
      currentRating: hasHistoryRemaining ? teamData.currentRating : undefined,
      ratingCategories: hasHistoryRemaining ? teamData.ratingCategories : undefined,
      ratingNotes: hasHistoryRemaining ? teamData.ratingNotes : undefined
    };

    onUpdateTeamMember(updatedMember);
  };

  const [followUpInputDate, setFollowUpInputDate] = React.useState('');
  const [meetingInputDate, setMeetingInputDate] = React.useState('');
  const [meetingInputTitle, setMeetingInputTitle] = React.useState('');
  const [noteInputText, setNoteInputText] = React.useState('');

  // Fallback states for data collections if not provided in props
  const [fetchedClientPortals, setFetchedClientPortals] = useState<ClientPortalAccount[]>([]);
  const [fetchedTeamPortals, setFetchedTeamPortals] = useState<TeamPortalAccount[]>([]);
  const [fetchedLeads, setFetchedLeads] = useState<Lead[]>([]);
  const [fetchedClients, setFetchedClients] = useState<Client[]>([]);
  const [fetchedClientPayments, setFetchedClientPayments] = useState<ClientPaymentRecord[]>([]);

  useEffect(() => {
    if (!isOpen || !data) return;

    if (!clientPortals || clientPortals.length === 0) {
      getCollectionOnce<ClientPortalAccount>('clientPortals').then(res => {
        if (res && res.length > 0) setFetchedClientPortals(res);
      });
    }
    if (!teamPortals || teamPortals.length === 0) {
      getCollectionOnce<TeamPortalAccount>('teamPortals').then(res => {
        if (res && res.length > 0) setFetchedTeamPortals(res);
      });
    }
    if (!leads || leads.length === 0) {
      getCollectionOnce<Lead>('leads').then(res => {
        if (res && res.length > 0) setFetchedLeads(res);
      });
    }
    if (!clients || clients.length === 0) {
      getCollectionOnce<Client>('clients').then(res => {
        if (res && res.length > 0) setFetchedClients(res);
      });
    }
    if (!clientPayments || clientPayments.length === 0) {
      getCollectionOnce<ClientPaymentRecord>('clientPayments').then(res => {
        if (res && res.length > 0) setFetchedClientPayments(res);
      });
    }
  }, [isOpen, data, clientPortals, teamPortals, leads, clients, clientPayments]);

  const allClientPortals = (clientPortals && clientPortals.length > 0) ? clientPortals : fetchedClientPortals;
  const allTeamPortals = (teamPortals && teamPortals.length > 0) ? teamPortals : fetchedTeamPortals;
  const allLeads = (leads && leads.length > 0) ? leads : fetchedLeads;
  const allClients = (clients && clients.length > 0) ? clients : fetchedClients;
  const allClientPayments = (clientPayments && clientPayments.length > 0) ? clientPayments : fetchedClientPayments;

  // Helper for displaying values with strict 'Not available' fallback for empty fields
  const valOrFallback = (val: any, fallback = 'Not available') => {
    if (val === null || val === undefined) return fallback;
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (!trimmed || trimmed.toLowerCase() === 'n/a' || trimmed.toLowerCase() === 'none') return fallback;
      return trimmed;
    }
    if (typeof val === 'number') {
      if (isNaN(val)) return fallback;
      return val;
    }
    return val;
  };

  // Initials generator
  const getInitials = (name: string) => {
    if (!name) return 'CU';
    const clean = name.replace(/[^a-zA-Z\s]/g, '').trim();
    if (clean.length >= 2) {
      const parts = clean.split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return parts[0].substring(0, 2).toUpperCase();
    }
    return name.trim().substring(0, 2).toUpperCase() || 'CU';
  };

  // Safe formatting for dates
  const formatDate = (dateStr?: string) => {
    if (!dateStr || dateStr === 'N/A' || dateStr.trim() === '') return 'Not available';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

  // Normalize data depending on the type
  const isLead = type === 'Lead';
  const isClient = type === 'Client';
  const isTeamMember = type === 'Team Member';
  const isPortal = type === 'Portal';

  const leadData = isLead ? (data as Lead) : null;
  const clientData = isClient ? (data as Client) : null;
  const teamData = isTeamMember ? (data as TeamMember) : null;
  const portalData = isPortal ? (data as any) : null;

  const rawId = (data?.id || '').replace(/^(client|lead|team|portal)[-_]?/i, '');
  const cleanIdCode = rawId ? rawId.toUpperCase() : '001';
  const idLabel = isLead 
    ? `LEAD #${cleanIdCode}` 
    : isClient 
    ? `CLIENT #${cleanIdCode}` 
    : isPortal
    ? `PORTAL #${cleanIdCode}`
    : `TEAM #${cleanIdCode}`;

  const displayName = isTeamMember 
    ? teamData?.fullName 
    : isPortal
    ? (portalData?.clientName || portalData?.fullName || 'Portal User')
    : (data as any)?.name || 'Unknown Contact';
  
  // Custom colors and status badges
  const getStatusBadge = () => {
    if (!data) return null;
    const status = data.status || 'Active';
    let classes = 'bg-[var(--crm-sidebar)] text-[var(--crm-text-secondary)] border-[var(--crm-card-border)]';
    
    if (isLead && leadData) {
      const s = leadData.status;
      if (s === 'New') classes = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      else if (s === 'Contacted') classes = 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
      else if (s === 'Proposal') classes = 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      else if (s === 'Closed') classes = 'bg-rose-500/10 text-rose-600 border-rose-500/20';
    } else if (isClient && clientData) {
      const s = clientData.status;
      if (s === 'Active') classes = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      else if (s === 'Project Completed') classes = 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      else if (s === 'No Active Project') classes = 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      else if (s === 'Archived') classes = 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
      else classes = 'bg-rose-500/10 text-rose-600 border-rose-500/20';
    } else if (isTeamMember && teamData) {
      const s = teamData.status || 'Active';
      if (s === 'Active') classes = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      else classes = 'bg-rose-500/10 text-rose-600 border-rose-500/20';
    }

    return (
      <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${classes}`}>
        {data.status || 'Active'}
      </span>
    );
  };

  const gradientClass = isLead 
    ? 'from-blue-600 via-indigo-600 to-indigo-700' 
    : isClient 
    ? 'from-emerald-600 via-teal-600 to-cyan-700' 
    : 'from-purple-600 via-indigo-600 to-indigo-700';

  // 1. Social action links helpers
  const getSocialValue = (platform: string) => {
    if (isLead && leadData) {
      if (platform === 'instagram') return leadData.instagramLink;
      if (platform === 'facebook') return leadData.facebookLink;
      if (platform === 'linkedin') return leadData.linkedinLink;
      if (platform === 'website') return leadData.websiteUrl;
      if (platform === 'other') return leadData.otherLink;
    }
    if (isClient && clientData) {
      if (platform === 'instagram') return clientData.instagramLink;
      if (platform === 'facebook') return clientData.facebookLink;
      if (platform === 'linkedin') return clientData.linkedinLink;
      if (platform === 'website') return clientData.websiteUrl;
      if (platform === 'other') return clientData.otherLink;
    }
    if (isTeamMember && teamData) {
      if (platform === 'instagram') return teamData.instagramLink;
      if (platform === 'facebook') return teamData.facebookLink;
      if (platform === 'linkedin') return teamData.linkedinLink;
      if (platform === 'website') return teamData.portfolioLink;
    }
    return undefined;
  };

  const handleOpenLink = (url?: string) => {
    if (!url) return;
    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  // Discussions match helpers
  const relatedEmails = useMemo(() => {
    if (!isOpen || !data || isTeamMember) return [];
    const nameToMatch = (displayName || '').toLowerCase();
    const companyToMatch = ((data as any)?.company || '').toLowerCase();
    return emailDiscussions.filter(disc => 
      (isLead && disc.leadId === data.id) ||
      (isClient && disc.clientId === data.id) ||
      (nameToMatch && (disc.clientName || '').toLowerCase() === nameToMatch) ||
      (companyToMatch && (disc.clientName || '').toLowerCase() === companyToMatch)
    );
  }, [isOpen, data, displayName, emailDiscussions, isTeamMember, isLead, isClient]);

  const relatedCalls = useMemo(() => {
    if (!isOpen || !data || isTeamMember) return [];
    const nameToMatch = (displayName || '').toLowerCase();
    const companyToMatch = ((data as any)?.company || '').toLowerCase();
    return callDiscussions.filter(disc => 
      (isLead && disc.leadId === data.id) ||
      (isClient && disc.clientId === data.id) ||
      (nameToMatch && (disc.clientName || '').toLowerCase() === nameToMatch) ||
      (companyToMatch && (disc.clientName || '').toLowerCase() === companyToMatch)
    );
  }, [isOpen, data, displayName, callDiscussions, isTeamMember, isLead, isClient]);

  const relatedConversations = useMemo(() => {
    if (!isOpen || !data || isTeamMember) return [];
    const nameToMatch = (displayName || '').toLowerCase();
    const companyToMatch = ((data as any)?.company || '').toLowerCase();
    return conversationDiscussions.filter(disc => 
      (isLead && disc.leadId === data.id) ||
      (isClient && disc.clientId === data.id) ||
      (nameToMatch && ((disc.leadName || '').toLowerCase() === nameToMatch || (disc.clientName || '').toLowerCase() === nameToMatch)) ||
      (companyToMatch && (disc.company || '').toLowerCase() === companyToMatch)
    );
  }, [isOpen, data, displayName, conversationDiscussions, isLead, isClient, isTeamMember]);

  // Find Client's Projects
  const clientProjects = useMemo(() => {
    if (!isOpen || !data || !isClient) return [];
    return projects.filter(p => p.clientId === data.id);
  }, [isOpen, data, isClient, projects]);

  const clientPaymentsList = useMemo(() => {
    if (!isOpen || !data || !isClient) return [];
    const client = data as Client;
    const cId = client.id;
    const mId = client.masterClientId;
    const cName = (client.name || '').toLowerCase();

    return allClientPayments.filter(p => {
      if (!p) return false;
      if (p.clientId && p.clientId === cId) return true;
      if (mId && p.masterClientId && p.masterClientId === mId) return true;
      if (cName && p.clientName && p.clientName.toLowerCase() === cName) return true;
      return false;
    });
  }, [isOpen, data, isClient, allClientPayments]);

  const clientFinancialMetrics = useMemo(() => {
    if (!isClient || !data) return { totalValue: 0, totalReceived: 0, outstanding: 0 };
    const totalVal = clientProjects.reduce((sum, p) => sum + Number(p.totalProjectValue || p.budget || 0), 0) || Number((data as Client).totalValue || 0);
    const totalRec = clientPaymentsList.reduce((sum, p) => sum + Number(p.totalPaid || 0), 0);
    const out = Math.max(0, totalVal - totalRec);
    return { totalValue: totalVal, totalReceived: totalRec, outstanding: out };
  }, [isClient, data, clientProjects, clientPaymentsList]);

  // Find Assigned Team Member for Lead or Client
  const assignedMember = useMemo(() => {
    if (!isOpen || !data || isTeamMember) return null;
    const memberId = (data as any).assignedTeamMember;
    if (!memberId) return null;
    return teamMembers.find(t => t.id === memberId) || null;
  }, [isOpen, data, isTeamMember, teamMembers]);

  const assignedClientsForMember = useMemo(() => {
    if (!isOpen || !data || !isTeamMember || !teamData) return [];
    return allClients.filter(c => (c as any).assignedTeamMember === teamData.id);
  }, [isOpen, data, isTeamMember, teamData, allClients]);

  const assignedLeadsForMember = useMemo(() => {
    if (!isOpen || !data || !isTeamMember || !teamData) return [];
    return allLeads.filter(l => (l as any).assignedTeamMember === teamData.id);
  }, [isOpen, data, isTeamMember, teamData, allLeads]);

  const linkedPortal = useMemo(() => {
    if (!isOpen || !data) return null;
    if (isClient) {
      return allClientPortals.find(p => p.clientId === data.id);
    }
    if (isTeamMember) {
      return allTeamPortals.find(p => p.teamMemberId === data.id);
    }
    return null;
  }, [isOpen, data, isClient, isTeamMember, allClientPortals, allTeamPortals]);

  // Construct a beautifully formatted timeline sorted newest first, pulling real CRM data
  const activityTimeline = useMemo(() => {
    if (!isOpen || !data || isTeamMember) return [];
    const events: Array<{
      id: string;
      type: 'created' | 'discussion' | 'status_change';
      date: string;
      title: string;
      description: string;
      iconType: 'plus' | 'message' | 'stage';
      discussionType?: string;
    }> = [];

    // Registered creation event
    events.push({
      id: `create-${data.id}`,
      type: 'created',
      date: (data as any).createdAt || new Date().toISOString(),
      title: `${type} Profile Created`,
      description: `Registered successfully in the Zyqitek CRM database.`,
      iconType: 'plus',
    });

    // Current Pipeline Status
    events.push({
      id: `stage-${data.id}`,
      type: 'status_change',
      date: (data as any).updatedAt || (data as any).createdAt || new Date().toISOString(),
      title: `Status: ${data.status || 'Active'}`,
      description: `The current status stage is set to "${data.status || 'Active'}".`,
      iconType: 'stage',
    });

    // Match Emails
    relatedEmails.forEach(email => {
      events.push({
        id: `email-${email.id}`,
        type: 'discussion',
        date: email.date || '',
        title: `Email logged: ${email.subject}`,
        description: email.content ? (email.content.length > 100 ? email.content.substring(0, 100) + '...' : email.content) : 'No email text content.',
        iconType: 'message',
        discussionType: 'Email'
      });
    });

    // Match Calls
    relatedCalls.forEach(call => {
      events.push({
        id: `call-${call.id}`,
        type: 'discussion',
        date: call.callDate || '',
        title: `Call record: ${call.duration ? `(${call.duration})` : 'Connected'}`,
        description: call.summary ? (call.summary.length > 100 ? call.summary.substring(0, 100) + '...' : call.summary) : 'No call logs recorded.',
        iconType: 'message',
        discussionType: 'Call'
      });
    });

    // Match Conversations
    relatedConversations.forEach(conv => {
      events.push({
        id: `conv-${conv.id}`,
        type: 'discussion',
        date: conv.date && conv.time ? `${conv.date}T${conv.time}` : conv.date || '',
        title: conv.discussionTitle || 'Conversation logged',
        description: conv.conversationSummary ? (conv.conversationSummary.length > 100 ? conv.conversationSummary.substring(0, 100) + '...' : conv.conversationSummary) : 'No conversation notes recorded.',
        iconType: 'message',
        discussionType: conv.notes?.startsWith('[') && conv.notes?.includes(']') ? conv.notes.substring(1, conv.notes.indexOf(']')) : 'Conversation'
      });
    });

    // Client Projects Integration
    if (isClient) {
      clientProjects.forEach(proj => {
        if (proj.createdAt) {
          events.push({
            id: `project-start-${proj.id}`,
            type: 'status_change',
            date: proj.createdAt,
            title: `Project Started: ${proj.name}`,
            description: `A new project "${proj.name}" with a budget of $${(proj.totalProjectValue || proj.budget || 0).toLocaleString()} was initiated.`,
            iconType: 'plus',
          });
        }
        if (proj.status === 'Completed' || proj.status === 'Delivered') {
          events.push({
            id: `project-complete-${proj.id}`,
            type: 'status_change',
            date: proj.deadline || proj.createdAt || '',
            title: `Project ${proj.status}: ${proj.name}`,
            description: `Project "${proj.name}" was marked as ${proj.status.toLowerCase()} with a final progress of ${proj.projectProgress || proj.progress || 100}%.`,
            iconType: 'stage',
          });
        }
      });

      // Client Payments Integration
      clientPaymentsList.forEach(payment => {
        const paymentDate = payment.paymentDates?.[0] || payment.createdAt || '';
        if (paymentDate) {
          events.push({
            id: `payment-rec-${payment.id}`,
            type: 'status_change',
            date: paymentDate,
            title: `Payment Received: $${(payment.totalPaid || payment.advance || 0).toLocaleString()}`,
            description: `Received payment for project "${payment.projectName || 'General Services'}" via ${payment.paymentPlatform || 'Platform'}.`,
            iconType: 'stage',
          });
        }
      });

      // Portal account integration
      if (linkedPortal) {
        events.push({
          id: `portal-create-${linkedPortal.id}`,
          type: 'created',
          date: linkedPortal.createdAt || data.createdAt || '',
          title: `Client Portal Activated`,
          description: `Secure access portal created for ${linkedPortal.username || 'client'}. Access status is currently: ${linkedPortal.status || 'Active'}.`,
          iconType: 'plus',
        });
      }
    }

    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [isOpen, data, type, isTeamMember, relatedEmails, relatedCalls, relatedConversations, isClient, clientProjects, clientPaymentsList, linkedPortal]);

  // Quick Action toolbar
  const phoneVal = data ? ((data as any).phone || (teamData as any)?.whatsapp) : undefined;
  const emailVal = data?.email;

  const instagramVal = getSocialValue('instagram');
  const facebookVal = getSocialValue('facebook');
  const linkedinVal = getSocialValue('linkedin');
  const websiteVal = getSocialValue('website');
  const otherLinkVal = getSocialValue('other');

  const hasInstagram = !!instagramVal;
  const hasFacebook = !!facebookVal;
  const hasLinkedin = !!linkedinVal;
  const hasWebsite = !!websiteVal;
  const hasOther = !!otherLinkVal;

  const handleGeneratePdfReport = () => {
    if (!clientData) return;

    const doc = new jsPDF('p', 'mm', 'a4');
    const brandPrimary = [17, 24, 39]; // Slate-900 (#111827)
    const brandAccent = [132, 204, 22]; // Lime-500 (#84cc16)
    const textMain = [31, 41, 55]; // Gray-800 (#1f2937)
    const textMuted = [107, 114, 128]; // Gray-500 (#6b7280)
    const bgLight = [248, 250, 252]; // Slate-50 (#f8fafc)
    const borderLight = [226, 232, 240]; // Slate-200 (#e2e8f0)

    let currentY = 15;

    const checkPageOverflow = (neededHeight: number) => {
      if (currentY + neededHeight > 275) {
        doc.addPage();
        currentY = 15;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Zyqitek CRM — ${clientData.company} Summary Report (Continued)`, 15, currentY);
        doc.setDrawColor(226, 232, 240);
        doc.line(15, currentY + 2, 195, currentY + 2);
        currentY += 10;
      }
    };

    doc.setFillColor(brandAccent[0], brandAccent[1], brandAccent[2]);
    doc.rect(15, currentY, 3, 16, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
    doc.text('CLIENT PROFILE SUMMARY', 21, currentY + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Zyqitek — Customer Relationship Management', 21, currentY + 11.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(brandAccent[0], brandAccent[1], brandAccent[2]);
    const genDate = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const dateText = `GENERATED: ${genDate.toUpperCase()}`;
    doc.text(dateText, 195 - doc.getTextWidth(dateText), currentY + 5.5);
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.line(15, currentY + 16.5, 195, currentY + 16.5);
    currentY += 24;

    checkPageOverflow(56);
    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.roundedRect(15, currentY, 180, 52, 3, 3, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
    doc.text('I. CLIENT ACCOUNT METADATA', 20, currentY + 6);
    doc.line(20, currentY + 8.5, 190, currentY + 8.5);

    const col1X = 22;
    const col2X = 110;
    doc.setFontSize(8);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.setFont('helvetica', 'normal');
    doc.text('Company Name', col1X, currentY + 14);
    doc.setTextColor(textMain[0], textMain[1], textMain[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(clientData.company || 'N/A', col1X, currentY + 18);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Liaison Representative', col2X, currentY + 14);
    doc.setTextColor(textMain[0], textMain[1], textMain[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(assignedMember ? assignedMember.fullName : 'None Assigned', col2X, currentY + 18);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Contact Person', col1X, currentY + 23);
    doc.setTextColor(textMain[0], textMain[1], textMain[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(clientData.name || 'N/A', col1X, currentY + 27);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Service Specialization', col2X, currentY + 23);
    doc.setTextColor(textMain[0], textMain[1], textMain[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(clientData.serviceType || 'Other', col2X, currentY + 27);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Email Address', col1X, currentY + 32);
    doc.setTextColor(textMain[0], textMain[1], textMain[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(clientData.email || 'None', col1X, currentY + 36);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Account Status', col2X, currentY + 32);
    doc.setTextColor(textMain[0], textMain[1], textMain[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(clientData.status || 'Active', col2X, currentY + 36);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Phone Number', col1X, currentY + 41);
    doc.setTextColor(textMain[0], textMain[1], textMain[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(clientData.phone || 'Not specified', col1X, currentY + 45);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('Country Location', col2X, currentY + 41);
    doc.setTextColor(textMain[0], textMain[1], textMain[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(clientData.country || 'Not specified', col2X, currentY + 45);
    currentY += 58;

    checkPageOverflow(28);
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(15, currentY, 87, 24, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(22, 101, 52);
    doc.text('TOTAL CONTRACT DEAL VALUE', 20, currentY + 6);
    doc.setFontSize(14);
    doc.text(`$${(clientData.totalValue || 0).toLocaleString()}`, 20, currentY + 16);
    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(191, 219, 254);
    doc.roundedRect(108, currentY, 87, 24, 2, 2, 'FD');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 64, 175);
    doc.text('ACTIVE CONTRACT CAMPAIGNS', 113, currentY + 6);
    doc.setFontSize(14);
    doc.text(`${clientData.activeProjects || 0} Campaigns`, 113, currentY + 16);
    currentY += 32;

    checkPageOverflow(15);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
    doc.text('II. ACTIVE CAMPAIGNS & DEVELOPMENT PROGRESS', 15, currentY);
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.line(15, currentY + 2.5, 195, currentY + 2.5);
    currentY += 8.5;

    if (clientProjects.length === 0) {
      checkPageOverflow(18);
      doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
      doc.roundedRect(15, currentY, 180, 14, 2, 2, 'F');
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text('No active campaigns or deliverables found in the development logs.', 20, currentY + 8);
      currentY += 20;
    } else {
      clientProjects.forEach((proj, idx) => {
        checkPageOverflow(26);
        doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
        doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
        doc.roundedRect(15, currentY, 180, 21, 2, 2, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
        doc.text(`${idx + 1}. ${proj.name}`, 20, currentY + 6.5);
        doc.setFontSize(7.5);
        const statusTxt = `STATUS: ${proj.status.toUpperCase()}`;
        doc.setTextColor(79, 70, 229);
        doc.text(statusTxt, 190 - doc.getTextWidth(statusTxt), currentY + 6.5);
        doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('Development & Campaign Delivery Progress:', 20, currentY + 12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
        doc.text(`${proj.projectProgress || 0}%`, 184, currentY + 12);
        const barWidth = 170;
        const barX = 20;
        const barY = currentY + 14.5;
        const barHeight = 2.5;
        doc.setFillColor(226, 232, 240);
        doc.rect(barX, barY, barWidth, barHeight, 'F');
        const fillWidth = (barWidth * (proj.projectProgress || 0)) / 100;
        if (fillWidth > 0) {
          doc.setFillColor(79, 70, 229);
          doc.rect(barX, barY, fillWidth, barHeight, 'F');
        }
        currentY += 26;
      });
      currentY += 2;
    }

    checkPageOverflow(15);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
    doc.text('III. RECENT CRM DISCUSSIONS & CHRONOLOGICAL HISTORY', 15, currentY);
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.line(15, currentY + 2.5, 195, currentY + 2.5);
    currentY += 8.5;

    const clientTimeline = activityTimeline.filter(e => e.type === 'discussion');
    if (clientTimeline.length === 0) {
      checkPageOverflow(18);
      doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
      doc.roundedRect(15, currentY, 180, 14, 2, 2, 'F');
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text('No historical CRM logged activities or recent team discussion summaries available.', 20, currentY + 8);
      currentY += 20;
    } else {
      const topTimeline = clientTimeline.slice(0, 8);
      topTimeline.forEach((event) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const wrappedDesc = doc.splitTextToSize(event.description, 168);
        const textHeight = wrappedDesc.length * 4;
        const totalBlockHeight = 10 + textHeight;
        checkPageOverflow(totalBlockHeight);
        doc.setDrawColor(132, 204, 22);
        doc.setLineWidth(0.5);
        doc.line(17, currentY, 17, currentY + totalBlockHeight);
        doc.setFillColor(132, 204, 22);
        doc.circle(17, currentY + 2.5, 1.2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
        const discTypeStr = event.discussionType ? `[${event.discussionType}] ` : '';
        doc.text(`${discTypeStr}${event.title}`, 22, currentY + 3.2);
        doc.setFontSize(7.5);
        doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
        const formattedEventDate = new Date(event.date).toLocaleDateString(undefined, { 
          month: 'short', day: 'numeric', year: 'numeric' 
        });
        doc.text(formattedEventDate, 195 - doc.getTextWidth(formattedEventDate), currentY + 3.2);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(textMain[0], textMain[1], textMain[2]);
        let localY = currentY + 7.5;
        wrappedDesc.forEach((line: string) => {
          doc.text(line, 22, localY);
          localY += 3.8;
        });
        currentY += totalBlockHeight;
      });
      currentY += 5;
    }

    if (clientData.notes) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const wrappedNotes = doc.splitTextToSize(clientData.notes, 170);
      const notesHeight = wrappedNotes.length * 4 + 14;
      checkPageOverflow(notesHeight);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
      doc.text('IV. INTERNAL CRM ACCOUNT DIRECTIVES & NOTES', 15, currentY);
      doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
      doc.line(15, currentY + 2.5, 195, currentY + 2.5);
      currentY += 8.5;
      doc.setFillColor(255, 251, 235);
      doc.setDrawColor(253, 230, 138);
      doc.roundedRect(15, currentY, 180, wrappedNotes.length * 3.8 + 8, 2, 2, 'FD');
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(146, 64, 14);
      let notesY = currentY + 6;
      wrappedNotes.forEach((line: string) => {
        doc.text(line, 20, notesY);
        notesY += 3.8;
      });
      currentY += wrappedNotes.length * 3.8 + 14;
    }

    checkPageOverflow(18);
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.line(15, currentY + 2, 195, currentY + 2);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
    doc.text('Zyqitek — Customer Relationship Management', 15, currentY + 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('CONFIDENTIAL • FOR INTERNAL TEAM USE ONLY • SECURED BY FIRESTORE END-TO-END LEDGER', 15, currentY + 12);
    const safeCompName = (clientData.company || 'client').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`${safeCompName}_crm_audit_report.pdf`);
  };

  const handleQuickAction = (action: 'call' | 'whatsapp' | 'email' | 'mark_contacted' | 'mark_closed') => {
    if (!leadData || !onUpdateLead) return;
    const act = leadData.leadActivity || {};
    let updatedAct = { ...act };
    let newStatus = leadData.status;
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
    } else if (action === 'mark_contacted') {
      updatedAct.contacted = true;
      newStatus = 'Contacted';
      if (!updatedAct.firstContactAt) updatedAct.firstContactAt = new Date().toISOString();
      updatedAct.lastContactAt = new Date().toISOString();
    } else if (action === 'mark_closed') {
      newStatus = 'Closed';
    }
    updatedAct.lastActivityAt = new Date().toISOString();
    onUpdateLead({
      ...leadData,
      status: newStatus,
      leadActivity: updatedAct,
      updatedAt: new Date().toISOString()
    });
  };

  const handleSaveFollowUp = () => {
    if (!leadData || !onUpdateLead || !followUpInputDate) return;
    const act = leadData.leadActivity || {};
    const updatedAct = {
      ...act,
      followUpStatus: 'Scheduled' as const,
      followUpDate: followUpInputDate,
      lastActivityAt: new Date().toISOString()
    };
    onUpdateLead({
      ...leadData,
      status: leadData.status === 'New' ? 'Follow Up' : leadData.status,
      leadActivity: updatedAct,
      updatedAt: new Date().toISOString()
    });
    setFollowUpInputDate('');
    setShowFollowUpModal(false);
  };

  const handleSaveMeeting = () => {
    if (!leadData || !onUpdateLead || !meetingInputDate) return;
    const act = leadData.leadActivity || {};
    const updatedAct = {
      ...act,
      meetingStatus: 'Scheduled' as const,
      lastActivityAt: new Date().toISOString(),
      communicationNotes: (act.communicationNotes ? act.communicationNotes + '\n' : '') + `Meeting Scheduled: ${meetingInputTitle || 'Client Discussion'} on ${meetingInputDate}`
    };
    onUpdateLead({
      ...leadData,
      leadActivity: updatedAct,
      updatedAt: new Date().toISOString()
    });
    setMeetingInputDate('');
    setMeetingInputTitle('');
    setShowMeetingModal(false);
  };

  const handleSaveNote = () => {
    if (!leadData || !onUpdateLead || !noteInputText.trim()) return;
    const act = leadData.leadActivity || {};
    const updatedAct = {
      ...act,
      lastActivityAt: new Date().toISOString(),
      communicationNotes: (act.communicationNotes ? act.communicationNotes + '\n' : '') + `[${new Date().toLocaleDateString()}] ${noteInputText.trim()}`
    };
    onUpdateLead({
      ...leadData,
      leadActivity: updatedAct,
      updatedAt: new Date().toISOString()
    });
    setNoteInputText('');
    setShowNoteModal(false);
  };

  // Helper components for compact layout
  const InfoItem = ({ label, value, icon, highlight }: { label: string, value?: any, icon: React.ReactNode, highlight?: boolean }) => (
    <div className="p-3 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl space-y-1 hover:border-indigo-500/30 transition-all">
      <span className="text-[10px] font-semibold text-[var(--crm-text-secondary)] uppercase tracking-wider block">{label}</span>
      <div className={`flex items-center gap-2 text-xs font-semibold ${highlight ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-500/20 w-fit' : 'text-[var(--crm-text)]'}`}>
        <span className="text-indigo-500 shrink-0">{icon}</span>
        <span className="truncate max-w-full">{valOrFallback(value)}</span>
      </div>
    </div>
  );

  const SectionHeader = ({ icon, title }: { icon: React.ReactNode, title: string }) => (
    <div className="flex items-center gap-2.5 border-b border-[var(--crm-card-border)] pb-2.5 mb-3">
      <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 shrink-0">
        {icon}
      </div>
      <h5 className="text-xs font-bold tracking-tight text-[var(--crm-text)] uppercase">{title}</h5>
    </div>
  );

  const TimelineItem = ({ event }: { event: any }) => (
    <div className="relative pl-5 pb-4 last:pb-0">
      <div className="absolute left-0 top-1.5 w-[11px] h-[11px] rounded-full border-2 border-[var(--crm-card-border)] bg-[var(--crm-card-border)] z-10 shadow-sm" />
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px]  text-[var(--crm-text)] leading-tight">
          {event.discussionType ? `[${event.discussionType}] ` : ''}
          {event.title}
        </p>
        <span className="text-[9px] font-medium text-[var(--crm-text-secondary)] whitespace-nowrap">
          {new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
      </div>
      <p className="text-[10px] text-[var(--crm-subtitle)] line-clamp-2 mt-1 leading-relaxed">{event.description}</p>
    </div>
  );

  if (!isOpen || !data) return null;

  if (isLead && leadData) {
    return (
      <LeadProfileCard
        isOpen={isOpen}
        onClose={onClose}
        lead={leadData}
        teamMembers={teamMembers}
        emailDiscussions={emailDiscussions}
        callDiscussions={callDiscussions}
        conversationDiscussions={conversationDiscussions}
        onUpdateLead={onUpdateLead}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden"
        onClick={onClose}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="bg-[var(--crm-card)] rounded-2xl shadow-2xl border border-[var(--crm-card-border)] max-w-4xl lg:max-w-5xl 2xl:max-w-6xl 3xl:max-w-7xl 4k:max-w-[2000px] 5k:max-w-[3000px] 3xl:max-w-[1400px] 4k:max-w-[1800px] 5k:max-w-[2400px] md:w-11/12 w-full overflow-hidden text-[var(--crm-text)] flex flex-col max-h-[95vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 1. Header (Compact) */}
          <div className="p-5 border-b border-[var(--crm-card-border)] flex items-start gap-5 relative bg-[var(--crm-card)]">
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 hover:bg-[var(--crm-sidebar)] rounded-xl text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)] transition-all cursor-pointer z-10"
            >
              <X size={16} />
            </button>

            {/* Avatar */}
            {isTeamMember && teamData?.avatar && !teamData.avatar.includes('/_/upload') ? (
              <img src={teamData.avatar} alt="" className="h-16 w-16 rounded-2xl object-cover border border-[var(--crm-card-border)] shadow-md shrink-0 ring-2 ring-indigo-500/20" />
            ) : (
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-900 via-zinc-900 to-black text-white text-xl font-bold shadow-md border border-indigo-500/20 flex items-center justify-center shrink-0 tracking-wider">
                {getInitials(displayName || '')}
              </div>
            )}

            <div className="flex-1 pr-10">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 rounded-lg border border-indigo-100 dark:border-indigo-500/20">
                  {idLabel}
                </span>
                {getStatusBadge()}
              </div>
              <h4 className="text-2xl font-bold tracking-tight text-[var(--crm-text)] leading-tight">
                {displayName}
              </h4>
              <p className="text-xs text-[var(--crm-text-secondary)] font-medium mt-1.5 flex items-center gap-1.5">
                <Building2 size={13} className="text-indigo-500 shrink-0" />
                {isTeamMember ? teamData?.role : ((data as any).company || 'Independent Contact')}
              </p>
            </div>
          </div>

          {/* 2. Content Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide">
            
            {/* Quick Interaction Toolbar (Leads Only) */}
            {isLead && (
              <div className="flex flex-wrap gap-2 p-3 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-2xl">
                <a href={phoneVal ? `tel:${phoneVal}` : '#'} onClick={() => phoneVal && handleQuickAction('call')} className="px-3 py-1.5 bg-zinc-900 text-white text-[10px] font-semibold   rounded-xl flex items-center gap-1.5 hover:bg-zinc-800 transition-all">
                  <Phone size={12} /> Call
                </a>
                <a href={phoneVal ? `https://wa.me/${phoneVal.replace(/[^0-9]/g, '')}` : '#'} onClick={() => handleQuickAction('whatsapp')} className="px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-semibold   rounded-xl flex items-center gap-1.5 hover:bg-emerald-700 transition-all">
                  <MessageCircle size={12} /> WhatsApp
                </a>
                <a href={emailVal ? `mailto:${emailVal}` : '#'} onClick={() => handleQuickAction('email')} className="px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-semibold   rounded-xl flex items-center gap-1.5 hover:bg-indigo-700 transition-all">
                  <Mail size={12} /> Email
                </a>
                <button onClick={() => setShowFollowUpModal(true)} className="px-3 py-1.5 bg-[var(--crm-card)] border border-[var(--crm-card-border)] text-[var(--crm-text-secondary)] text-[10px]    rounded-xl flex items-center gap-1.5 hover:bg-[var(--crm-sidebar)] transition-all cursor-pointer">
                  <Calendar size={12} /> Follow-up
                </button>
              </div>
            )}

            <div className="space-y-6">
              {/* Layout varies by type */}
              
              {isLead && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div className="bg-[var(--crm-card)] rounded-2xl border border-[var(--crm-card-border)] shadow-xs p-4 space-y-4">
                      <SectionHeader icon={<User size={14}/>} title="Lead Information" />
                      <div className="grid grid-cols-1 gap-4">
                        <InfoItem label="Lead Source" value={leadData?.source} icon={<ArrowUpRight size={12}/>} highlight />
                        <InfoItem label="Lead Score" value={`${leadData?.leadScore || 0}/100`} icon={<Award size={12}/>} highlight />
                        <InfoItem label="Category" value={leadData?.category} icon={<Briefcase size={12}/>} />
                        <InfoItem label="Assigned Team" value={assignedMember?.fullName} icon={<Users size={12}/>} />
                      </div>
                    </div>

                    <div className="bg-[var(--crm-card)] rounded-2xl border border-[var(--crm-card-border)] shadow-xs p-4 space-y-4">
                      <SectionHeader icon={<Phone size={14}/>} title="Contact Details" />
                      <div className="grid grid-cols-1 gap-4">
                        <InfoItem label="Email" value={emailVal} icon={<Mail size={12}/>} />
                        <InfoItem label="Phone" value={phoneVal} icon={<Phone size={12}/>} />
                        <InfoItem label="Location" value={leadData?.country} icon={<Globe size={12}/>} />
                      </div>
                    </div>

                    {leadData?.customFields && Object.keys(leadData.customFields).length > 0 && (
                      <div className="bg-[var(--crm-card)] rounded-2xl border border-[var(--crm-card-border)] shadow-xs p-4 space-y-4">
                        <SectionHeader icon={<Sliders size={14}/>} title="Imported Dynamic Fields" />
                        <div className="grid grid-cols-1 gap-3">
                          {Object.entries(leadData.customFields).map(([fKey, fVal]) => {
                            if (fVal === null || fVal === undefined || fVal === '') return null;
                            const isUrl = typeof fVal === 'string' && (fVal.startsWith('http://') || fVal.startsWith('https://') || fVal.startsWith('www.'));
                            return (
                              <div key={fKey} className="p-2.5 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl space-y-1">
                                <span className="text-[10px] font-medium text-[var(--crm-text-secondary)]   block">{fKey}</span>
                                {isUrl ? (
                                  <a
                                    href={fVal.startsWith('http') ? fVal : `https://${fVal}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs font-medium text-indigo-600 hover:underline break-all block"
                                  >
                                    {String(fVal)}
                                  </a>
                                ) : (
                                  <span className="text-xs font-medium text-[var(--crm-text)] break-words block">{String(fVal)}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div className="bg-[var(--crm-card)] rounded-2xl border border-[var(--crm-card-border)] shadow-xs p-4 space-y-4">
                      <SectionHeader icon={<Clock size={14}/>} title="Recent Discussions" />
                      <div className="space-y-4 relative before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-[var(--crm-sidebar)]">
                        {activityTimeline.filter(e => e.type === 'discussion').length > 0 ? (
                          activityTimeline.filter(e => e.type === 'discussion').slice(0, 4).map(event => (
                            <TimelineItem key={event.id} event={event} />
                          ))
                        ) : (
                          <p className="text-[10px]  text-[var(--crm-subtitle)] italic pl-5">No discussions logged.</p>
                        )}
                      </div>
                    </div>
                    {leadData?.notes && (
                      <div className="bg-amber-50/50 dark:bg-amber-500/10 rounded-2xl border border-amber-100 p-4 space-y-2">
                        <SectionHeader icon={<FileText size={14}/>} title="Internal Notes" />
                        <p className="text-[11px] text-amber-800 leading-relaxed italic ">"{leadData.notes}"</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isClient && (
                <div className="space-y-6">
                  {/* Financial & Payment History Full Section */}
                  <div className="bg-[var(--crm-card)] rounded-2xl border border-[var(--crm-card-border)] shadow-xs p-5 space-y-4">
                    <SectionHeader icon={<DollarSign size={14}/>} title="Financial Overview & Payment History" />
                    
                    {/* Financial Summary Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 bg-[var(--crm-sidebar)] p-4 rounded-xl border border-[var(--crm-card-border)]">
                      <div>
                        <span className="text-[9px] font-bold text-[var(--crm-text-muted)] uppercase block">Master Client ID</span>
                        <span className="text-xs font-mono font-bold text-indigo-600 mt-1 block">{clientData?.masterClientId || getMasterClientId(clientData)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-[var(--crm-text-muted)] uppercase block">Total Project Value</span>
                        <span className="text-xs font-mono font-bold text-[var(--crm-text)] mt-1 block">${clientFinancialMetrics.totalValue.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-emerald-600 uppercase block">Total Received</span>
                        <span className="text-xs font-mono font-bold text-emerald-600 mt-1 block">${clientFinancialMetrics.totalReceived.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-amber-600 uppercase block">Total Outstanding</span>
                        <span className="text-xs font-mono font-bold text-amber-600 mt-1 block">${clientFinancialMetrics.outstanding.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-[var(--crm-text-muted)] uppercase block">Total Payments</span>
                        <span className="text-xs font-mono font-bold text-[var(--crm-text)] mt-1 block">{clientPaymentsList.length}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-[var(--crm-text-muted)] uppercase block">Projects Count</span>
                        <span className="text-xs font-mono font-bold text-[var(--crm-text)] mt-1 block">{clientProjects.length}</span>
                      </div>
                    </div>

                    {/* Payment History Table */}
                    <div className="space-y-2 pt-2">
                      <h6 className="text-[11px] font-semibold text-[var(--crm-text)] flex items-center justify-between">
                        <span>Payment Transactions ({clientPaymentsList.length})</span>
                      </h6>
                      {clientPaymentsList.length === 0 ? (
                        <div className="p-4 bg-[var(--crm-sidebar)] border border-dashed border-[var(--crm-card-border)] rounded-xl text-center space-y-1">
                          <DollarSign size={18} className="text-[var(--crm-text-secondary)] mx-auto opacity-50 mb-1" />
                          <p className="text-xs font-semibold text-[var(--crm-text)]">No payment history found</p>
                          <p className="text-[10px] text-[var(--crm-text-secondary)]">No recorded transactions for this client account yet.</p>
                        </div>
                      ) : (
                        <div className="border border-[var(--crm-card-border)] rounded-xl overflow-hidden bg-[var(--crm-card)]">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-[var(--crm-sidebar)] border-b border-[var(--crm-card-border)] text-[var(--crm-text-muted)] text-[9px]">
                                  <th className="p-2.5">Date</th>
                                  <th className="p-2.5">Project Name</th>
                                  <th className="p-2.5">Type</th>
                                  <th className="p-2.5">Amount</th>
                                  <th className="p-2.5">Method</th>
                                  <th className="p-2.5">Status</th>
                                  <th className="p-2.5">Ref / Trans ID</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[var(--crm-card-border)] font-medium text-[var(--crm-text-secondary)]">
                                {clientPaymentsList.map((p) => (
                                  <tr key={p.id} className="hover:bg-[var(--crm-sidebar-active-bg)]">
                                    <td className="p-2.5 font-mono text-[var(--crm-text-muted)]">{p.paymentDates?.[0] || (p.createdAt ? p.createdAt.split('T')[0] : '—')}</td>
                                    <td className="p-2.5 font-semibold text-[var(--crm-text)]">{p.projectName || '—'}</td>
                                    <td className="p-2.5 text-[var(--crm-text-secondary)]">{p.paymentType || (p.advance > 0 ? 'Advance' : 'Payment')}</td>
                                    <td className="p-2.5 font-semibold text-[var(--crm-text)] font-mono">${(p.totalPaid || p.advance || 0).toLocaleString()}</td>
                                    <td className="p-2.5 text-[var(--crm-text-secondary)]">{p.paymentPlatform || '—'}</td>
                                    <td className="p-2.5">
                                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium ${
                                        p.status === 'Paid' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 border border-emerald-200' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 border border-amber-200'
                                      }`}>
                                        {p.status}
                                      </span>
                                    </td>
                                    <td className="p-2.5 font-mono text-[10px] text-[var(--crm-text-muted)]">{p.transactionId || p.id}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <div className="bg-[var(--crm-card)] rounded-2xl border border-[var(--crm-card-border)] shadow-xs p-4 space-y-4">
                        <SectionHeader icon={<Building2 size={14}/>} title="Client Information" />
                        <div className="grid grid-cols-1 gap-4">
                          <InfoItem label="Contact Name" value={clientData?.name} icon={<User size={12}/>} />
                          <InfoItem label="Industry" value={clientData?.serviceType} icon={<Briefcase size={12}/>} />
                          <InfoItem label="Location" value={clientData?.country} icon={<Globe size={12}/>} />
                          <InfoItem label="Budget / Deal Value" value={`$${clientData?.totalValue?.toLocaleString()}`} icon={<DollarSign size={12}/>} highlight />
                        </div>
                      </div>

                      <div className="bg-[var(--crm-card)] rounded-2xl border border-[var(--crm-card-border)] shadow-xs p-4 space-y-4">
                        <SectionHeader icon={<ShieldCheck size={14}/>} title="Reviews & Trust" />
                        <div className="grid grid-cols-2 gap-4">
                          <InfoItem label="Trust Score" value={`${clientData?.trustScore || 0}%`} icon={<ShieldCheck size={12}/>} highlight />
                          <InfoItem label="Project Reviews" value={clientProjects.reduce((acc, p) => acc + (p.reviews?.length || 0), 0)} icon={<Award size={12}/>} />
                        </div>
                      </div>

                      {linkedPortal && (
                        <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 rounded-2xl p-4 space-y-3">
                          <SectionHeader icon={<Key size={14}/>} title="Portal Access" />
                          <div className="grid grid-cols-1 gap-2">
                            <InfoItem label="Portal Username" value={linkedPortal.username} icon={<User size={12}/>} />
                            <InfoItem label="Account Type" value="Client Access" icon={<ShieldCheck size={12}/>} />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                      <div className="bg-[var(--crm-card)] rounded-2xl border border-[var(--crm-card-border)] shadow-xs p-4 space-y-4">
                        <SectionHeader icon={<Briefcase size={14}/>} title="Active Projects" />
                        <div className="space-y-3">
                          {clientProjects.length > 0 ? (
                            clientProjects.slice(0, 3).map(p => (
                              <div key={p.id} className="p-3 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl space-y-2">
                                <div className="flex justify-between items-center gap-2">
                                  <span className="text-xs font-semibold text-[var(--crm-text)] truncate">{p.name}</span>
                                  <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-500/20">{p.status}</span>
                                </div>
                                <div className="h-1.5 bg-[var(--crm-card-border)] rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-600 rounded-full transition-all duration-500" style={{ width: `${p.projectProgress}%` }} />
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-4 bg-[var(--crm-sidebar)] border border-dashed border-[var(--crm-card-border)] rounded-xl text-center space-y-1">
                              <Briefcase size={18} className="text-[var(--crm-text-secondary)] mx-auto opacity-50 mb-1" />
                              <p className="text-xs font-semibold text-[var(--crm-text)]">No active projects</p>
                              <p className="text-[10px] text-[var(--crm-text-secondary)]">No active campaigns or deliverables linked yet.</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-[var(--crm-card)] rounded-2xl border border-[var(--crm-card-border)] shadow-xs p-4 space-y-4">
                        <SectionHeader icon={<MessageCircle size={14}/>} title="Client Discussions" />
                        <div>
                          {activityTimeline.filter(e => e.type === 'discussion').length > 0 ? (
                            <div className="space-y-4 relative before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-[var(--crm-sidebar)]">
                              {activityTimeline.filter(e => e.type === 'discussion').slice(0, 3).map(event => (
                                <TimelineItem key={event.id} event={event} />
                              ))}
                            </div>
                          ) : (
                            <div className="p-4 bg-[var(--crm-sidebar)] border border-dashed border-[var(--crm-card-border)] rounded-xl text-center space-y-1">
                              <MessageCircle size={18} className="text-[var(--crm-text-secondary)] mx-auto opacity-50 mb-1" />
                              <p className="text-xs font-semibold text-[var(--crm-text)]">No discussions logged</p>
                              <p className="text-[10px] text-[var(--crm-text-secondary)]">Log calls, emails, or meetings to populate history.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isTeamMember && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div className="bg-[var(--crm-card)] rounded-2xl border border-[var(--crm-card-border)] shadow-xs p-4 space-y-4">
                      <SectionHeader icon={<User size={14}/>} title="Team Member Information" />
                      <div className="grid grid-cols-1 gap-4">
                        <InfoItem label="Specialization" value={teamData?.service} icon={<Sliders size={12}/>} highlight />
                        <InfoItem label="Experience" value={teamData?.experience} icon={<Award size={12}/>} />
                        <InfoItem label="Email" value={teamData?.email} icon={<Mail size={12}/>} />
                        <InfoItem label="Status" value={teamData?.status} icon={<CheckCircle2 size={12}/>} />
                      </div>
                    </div>

                    <div className="bg-[var(--crm-card)] rounded-2xl border border-[var(--crm-card-border)] shadow-xs p-4 space-y-4">
                      <SectionHeader icon={<Briefcase size={14}/>} title="Assigned Portfolio" />
                      <div className="grid grid-cols-2 gap-4">
                        <InfoItem label="Active Clients" value={assignedClientsForMember.length} icon={<Building2 size={12}/>} highlight />
                        <InfoItem label="Active Leads" value={assignedLeadsForMember.length} icon={<ArrowUpRight size={12}/>} highlight />
                      </div>
                    </div>

                    {linkedPortal && (
                      <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 rounded-2xl p-4 space-y-3">
                        <SectionHeader icon={<Key size={14}/>} title="Team Portal" />
                        <div className="flex justify-between items-center">
                          <InfoItem label="Username" value={linkedPortal.username} icon={<User size={12}/>} />
                          <span className="text-[9px] font-semibold text-indigo-600 bg-[var(--crm-card)] px-2 py-1 rounded-lg border border-indigo-100">Live</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div className="bg-[var(--crm-card)] rounded-2xl border border-[var(--crm-card-border)] shadow-xs p-4 space-y-4">
                      <SectionHeader icon={<Folder size={14}/>} title="Assigned Projects" />
                      <div className="space-y-3">
                        {projects.filter(p => p.assignedTeamMemberId === teamData?.id).length > 0 ? (
                          projects.filter(p => p.assignedTeamMemberId === teamData?.id).slice(0, 4).map(p => (
                            <div key={p.id} className="p-2.5 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl flex justify-between items-center">
                              <span className="text-[11px] font-semibold text-[var(--crm-text)] truncate pr-2">{p.name}</span>
                              <span className="text-[9px] font-medium text-[var(--crm-text-secondary)] whitespace-nowrap">{p.status}</span>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 bg-[var(--crm-sidebar)] border border-dashed border-[var(--crm-card-border)] rounded-xl text-center space-y-1">
                            <Folder size={18} className="text-[var(--crm-text-secondary)] mx-auto opacity-50 mb-1" />
                            <p className="text-xs font-semibold text-[var(--crm-text)]">No assigned projects</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* TEAM MEMBER RATING CARD */}
                    <div className="bg-[var(--crm-card)] rounded-2xl border border-[var(--crm-card-border)] shadow-xs p-5 space-y-4">
                      <div className="flex items-center justify-between border-b border-[var(--crm-card-border)] pb-3">
                        <SectionHeader icon={<Star size={14} className="text-amber-500 fill-amber-500" />} title="Team Member Rating" />
                        <button
                          type="button"
                          onClick={() => handleOpenRatingModal()}
                          className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs whitespace-nowrap"
                        >
                          <Pencil size={10} /> Update Rating
                        </button>
                      </div>

                      {/* Overall Rating Hero Metric */}
                      <div className="flex items-center justify-between bg-[var(--crm-sidebar)] p-4 rounded-xl border border-[var(--crm-card-border)]">
                        <div>
                          <span className="text-[10px] font-bold text-[var(--crm-text-muted)] uppercase tracking-wider block">Overall Performance</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-2xl font-black text-[var(--crm-text)]">
                              {teamData?.currentRating ? teamData.currentRating.toFixed(1) : '0.0'}
                            </span>
                            <span className="text-xs font-semibold text-[var(--crm-text-muted)]">/ 5.0</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <StarRatingStatic rating={teamData?.currentRating || 0} size={15} />
                          <span className="text-[9px] text-[var(--crm-text-muted)] mt-1 font-semibold uppercase tracking-wider">
                            {teamData?.currentRating ? (
                              teamData.currentRating >= 4.5 ? 'Excellent' :
                              teamData.currentRating >= 3.5 ? 'Good' :
                              teamData.currentRating >= 2.5 ? 'Average' :
                              'Needs Improvement'
                            ) : 'Unrated'}
                          </span>
                        </div>
                      </div>

                      {/* Category Rating list */}
                      {teamData?.ratingCategories ? (
                        <div className="space-y-2.5 text-xs">
                          <h6 className="text-[10px] font-bold text-[var(--crm-text-muted)] uppercase tracking-wider border-b border-[var(--crm-card-border)] pb-1">
                            Category Breakdown
                          </h6>
                          <div className="grid grid-cols-1 gap-2">
                            {Object.entries({
                              'Work Quality': teamData.ratingCategories.workQuality,
                              'Communication': teamData.ratingCategories.communication,
                              'Reliability': teamData.ratingCategories.reliability,
                              'Technical Skills': teamData.ratingCategories.technicalSkills,
                              'Deadline Management': teamData.ratingCategories.deadlineManagement,
                              'Client Handling': teamData.ratingCategories.clientHandling,
                              'Teamwork': teamData.ratingCategories.teamwork,
                            }).map(([label, val]) => (
                              <div key={label} className="flex items-center justify-between py-0.5 border-b border-slate-100/50 dark:border-[#30353D]/30 last:border-0">
                                <span className="font-semibold text-[var(--crm-text-secondary)] text-[11px]">{label}</span>
                                <div className="flex items-center gap-2">
                                  <StarRatingStatic rating={val || 0} size={12} />
                                  <span className="text-[10px] font-bold text-[var(--crm-text)] bg-[var(--crm-sidebar)] px-1.5 py-0.5 rounded border border-[var(--crm-card-border)]">
                                    {val ? val.toFixed(1) : 'N/A'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-[var(--crm-text-muted)] italic text-center py-4 bg-[var(--crm-sidebar)] rounded-xl border border-dashed border-[var(--crm-card-border)]">
                          No category evaluations set yet. Click Update Rating to evaluate.
                        </p>
                      )}

                      {/* Notes Box */}
                      {teamData?.ratingNotes && (
                        <div className="space-y-1.5 bg-amber-500/[0.02] border border-amber-200/30 dark:border-amber-500/10 p-3 rounded-xl">
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Rating Notes</span>
                          <p className="text-xs text-[var(--crm-text-secondary)] italic leading-relaxed">
                            "{teamData.ratingNotes}"
                          </p>
                        </div>
                      )}

                      {/* Rating History List */}
                      <div className="space-y-3 pt-3 border-t border-[var(--crm-card-border)]">
                        <h6 className="text-[10px] font-bold text-[var(--crm-text-muted)] uppercase tracking-wider flex items-center justify-between">
                          <span>Evaluation History</span>
                          <span className="text-[9px] text-[var(--crm-text-muted)] lowercase font-normal italic">Admin only</span>
                        </h6>

                        {teamData?.ratingHistory && teamData.ratingHistory.length > 0 ? (
                          <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                            {teamData.ratingHistory.map((entry) => (
                              <div key={entry.id} className="p-2.5 bg-[var(--crm-sidebar)] rounded-xl border border-[var(--crm-card-border)] relative group/history hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteHistoryEntry(entry.id)}
                                  className="absolute right-2 top-2 text-slate-400 hover:text-rose-600 transition-colors opacity-0 group-hover/history:opacity-100 p-0.5 cursor-pointer"
                                  title="Delete Rating Entry"
                                >
                                  <Trash2 size={11} />
                                </button>
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className="text-[10px] font-bold text-[var(--crm-text-muted)]">{entry.date}</span>
                                  <div className="flex items-center gap-1.5">
                                    <StarRatingStatic rating={entry.overallRating} size={10} />
                                    <span className="text-[10px] font-extrabold text-[var(--crm-text)]">
                                      {entry.overallRating.toFixed(1)}
                                    </span>
                                  </div>
                                </div>
                                {entry.notes && (
                                  <p className="text-[11px] text-[var(--crm-text-secondary)] leading-snug mt-1">
                                    {entry.notes}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-[var(--crm-text-muted)] italic text-center py-2">
                            No rating history recorded yet.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isPortal && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div className="bg-[var(--crm-card)] rounded-2xl border border-[var(--crm-card-border)] shadow-xs p-4 space-y-4">
                      <SectionHeader icon={<Key size={14}/>} title="Portal Authentication" />
                      <div className="grid grid-cols-1 gap-4">
                        <InfoItem label="Portal ID" value={portalData?.portalId} icon={<Key size={12}/>} highlight />
                        <InfoItem label="Username" value={portalData?.username} icon={<User size={12}/>} />
                        <InfoItem label="Portal Type" value={portalData?.portalType || (portalData?.clientId ? 'Client' : 'Team')} icon={<ShieldCheck size={12}/>} highlight />
                        <InfoItem label="Status" value={portalData?.status || 'Active'} icon={<CheckCircle2 size={12}/>} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-[var(--crm-card)] rounded-2xl border border-[var(--crm-card-border)] shadow-xs p-4 space-y-4">
                      <SectionHeader icon={<Users size={14}/>} title="Linked Identity" />
                      <div className="p-3 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl space-y-3">
                        <div className="flex items-center gap-3">
                           <div className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white text-[10px] font-semibold ">
                             {getInitials(portalData?.clientName || portalData?.fullName || '')}
                           </div>
                           <div>
                             <p className="text-[11px] text-[var(--crm-text)] leading-tight">{portalData?.clientName || portalData?.fullName}</p>
                             <p className="text-[9px] text-[var(--crm-text-muted)] tracking-tight">{portalData?.clientId ? 'Client Account' : 'Team Member Account'}</p>
                           </div>
                        </div>
                      </div>
                    </div>

                    {portalData?.clientId && (
                      <div className="bg-[var(--crm-card)] rounded-2xl border border-[var(--crm-card-border)] shadow-xs p-4 space-y-4">
                        <SectionHeader icon={<Briefcase size={14}/>} title="Project Visibility" />
                        <div className="space-y-2">
                           {projects.filter(p => p.clientId === portalData.clientId).slice(0, 3).map(p => (
                             <div key={p.id} className="flex justify-between items-center">
                               <span className="text-[10px] font-medium text-[var(--crm-text-secondary)] truncate">{p.name}</span>
                               <span className="text-[9px] font-semibold text-indigo-600">{p.projectProgress}%</span>
                             </div>
                           ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. Footer (Actions) */}
          <div className="p-4 border-t border-[var(--crm-card-border)] bg-[var(--crm-sidebar)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button 
                onClick={onEdit}
                className="px-3.5 py-2 bg-[var(--crm-card)] hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-[var(--crm-card-border)] rounded-xl text-[var(--crm-text)] text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shadow-xs"
                title="Edit Profile"
              >
                <Pencil size={14} className="text-indigo-600" />
                <span>Edit Profile</span>
              </button>
              <button 
                disabled={isDeleting}
                onClick={async () => {
                  if (window.confirm(`Are you sure you want to delete this ${type.toLowerCase()}?`)) {
                    setIsDeleting(true);
                    try {
                      if (onDelete && data?.id) {
                        const result = await onDelete(data.id);
                        if (result !== false) {
                          onClose();
                        }
                      }
                    } catch (err) {
                      console.error("Failed to delete", err);
                    } finally {
                      setIsDeleting(false);
                    }
                  }
                }}
                className={`px-3.5 py-2 border rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${isDeleting ? 'opacity-50 cursor-not-allowed bg-rose-500/10 text-rose-600 border-rose-500/20' : 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 hover:text-rose-700 text-rose-600 border-rose-200 dark:border-rose-500/20'}`}
                title="Delete Profile"
              >
                {isDeleting ? <span className="text-xs font-semibold px-1">Deleting...</span> : <><Trash2 size={14} /> <span>Delete</span></>}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {isClient && clientData && (
                clientData.status === 'Archived' ? (
                  <button 
                    onClick={async () => {
                      if (window.confirm("Are you sure you want to reactivate this client? This will restore their active status in the CRM.")) {
                        try {
                          if (onUpdateClient) {
                            await onUpdateClient({
                              ...clientData,
                              status: 'Active',
                              updatedAt: new Date().toISOString()
                            });
                            onClose();
                          }
                        } catch (err) {
                          console.error("Failed to reactivate client", err);
                        }
                      }
                    }}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    title="Reactivate Client Account"
                  >
                    <RefreshCw size={14} />
                    <span>Reactivate Client</span>
                  </button>
                ) : null
              )}
              {isClient && (
                <button 
                  onClick={handleGeneratePdfReport}
                  className="px-4 py-2 bg-[var(--crm-card)] hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-[var(--crm-card-border)] text-[var(--crm-text)] text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-2"
                >
                  <FileText size={14} className="text-indigo-600" /> PDF Report
                </button>
              )}
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-xl transition-all shadow-md cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>

        {/* Floating Modals for Actions */}
        <AnimatePresence>
          {showFollowUpModal && (
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
             >
                <div className="bg-[var(--crm-card)] rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-[var(--crm-card-border)] space-y-4">
                  <h4 className="text-sm font-medium text-[var(--crm-text)] flex items-center gap-2  tracking-tight">
                    <Calendar size={16} className="text-indigo-600" /> Schedule Follow-up
                  </h4>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-muted)]   block">Follow-up Date</label>
                    <input
                      type="date"
                      value={followUpInputDate}
                      onChange={(e) => setFollowUpInputDate(e.target.value)}
                      className="w-full px-4 py-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl text-sm font-medium text-[var(--crm-text)] outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowFollowUpModal(false)} className="flex-1 py-2 text-sm font-medium text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar)] rounded-xl transition-all">Cancel</button>
                    <button onClick={handleSaveFollowUp} className="flex-1 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/10">Save</button>
                  </div>
                </div>
             </motion.div>
          )}
          {showMeetingModal && (
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
             >
                <div className="bg-[var(--crm-card)] rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-[var(--crm-card-border)] space-y-4">
                  <h4 className="text-sm font-medium text-[var(--crm-text)] flex items-center gap-2  tracking-tight">
                    <User size={16} className="text-indigo-600" /> Schedule Meeting
                  </h4>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-[var(--crm-text-muted)]   block">Topic</label>
                      <input
                        type="text"
                        placeholder="Discovery Call"
                        value={meetingInputTitle}
                        onChange={(e) => setMeetingInputTitle(e.target.value)}
                        className="w-full px-4 py-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl text-sm font-medium text-[var(--crm-text)] outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-[var(--crm-text-muted)]   block">Date & Time</label>
                      <input
                        type="datetime-local"
                        value={meetingInputDate}
                        onChange={(e) => setMeetingInputDate(e.target.value)}
                        className="w-full px-4 py-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl text-sm font-medium text-[var(--crm-text)] outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowMeetingModal(false)} className="flex-1 py-2 text-sm font-medium text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar)] rounded-xl transition-all">Cancel</button>
                    <button onClick={handleSaveMeeting} className="flex-1 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/10">Save</button>
                  </div>
                </div>
             </motion.div>
          )}
          {showNoteModal && (
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
             >
                <div className="bg-[var(--crm-card)] rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-[var(--crm-card-border)] space-y-4">
                  <h4 className="text-sm font-medium text-[var(--crm-text)] flex items-center gap-2  tracking-tight">
                    <FileText size={16} className="text-indigo-600" /> Log Note
                  </h4>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-muted)]   block">Communication Summary</label>
                    <textarea
                      rows={4}
                      value={noteInputText}
                      onChange={(e) => setNoteInputText(e.target.value)}
                      className="w-full px-4 py-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl text-sm font-medium text-[var(--crm-text)] outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowNoteModal(false)} className="flex-1 py-2 text-sm font-medium text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar)] rounded-xl transition-all border border-[var(--crm-card-border)]">Cancel</button>
                    <button onClick={handleSaveNote} className="flex-1 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/10">Log Note</button>
                  </div>
                </div>
             </motion.div>
          )}
          {showRatingModal && (
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
             >
                <div className="bg-[var(--crm-card)] rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-[var(--crm-card-border)] space-y-4 my-8">
                  <div className="flex items-center justify-between border-b border-[var(--crm-card-border)] pb-3">
                    <h4 className="text-sm font-bold text-[var(--crm-text)] flex items-center gap-2 tracking-tight">
                      <Star size={16} className="text-amber-500 fill-amber-500" /> Update Performance Evaluation
                    </h4>
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Admin Only
                    </span>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs text-[var(--crm-text-secondary)] leading-relaxed">
                      Evaluate <strong>{teamData?.fullName}</strong> across key performance categories. The overall rating will be auto-calculated.
                    </p>

                    <div className="space-y-3 bg-[var(--crm-sidebar)] p-4 rounded-xl border border-[var(--crm-card-border)]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[var(--crm-text)]">Work Quality</span>
                        <StarRatingInteractive rating={rateWorkQuality} onChange={setRateWorkQuality} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[var(--crm-text)]">Communication</span>
                        <StarRatingInteractive rating={rateCommunication} onChange={setRateCommunication} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[var(--crm-text)]">Reliability</span>
                        <StarRatingInteractive rating={rateReliability} onChange={setRateReliability} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[var(--crm-text)]">Technical Skills</span>
                        <StarRatingInteractive rating={rateTechnicalSkills} onChange={setRateTechnicalSkills} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[var(--crm-text)]">Deadline Management</span>
                        <StarRatingInteractive rating={rateDeadlineManagement} onChange={setRateDeadlineManagement} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[var(--crm-text)]">Client Handling</span>
                        <StarRatingInteractive rating={rateClientHandling} onChange={setRateClientHandling} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[var(--crm-text)]">Teamwork</span>
                        <StarRatingInteractive rating={rateTeamwork} onChange={setRateTeamwork} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[var(--crm-text-secondary)] uppercase tracking-wider block">Evaluation Notes / Review Remarks</label>
                      <textarea
                        rows={3}
                        value={rateNotes}
                        onChange={(e) => setRateNotes(e.target.value)}
                        placeholder="Detail performance, achievements, specific comments, or improvement pathways..."
                        className="w-full px-3 py-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl text-xs font-medium text-[var(--crm-text)] outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2 border-t border-[var(--crm-card-border)]">
                    <button 
                      type="button"
                      onClick={() => setShowRatingModal(false)} 
                      className="flex-1 py-2 text-xs font-semibold text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar)] rounded-xl transition-all border border-[var(--crm-card-border)] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="button"
                      onClick={handleSaveRating} 
                      className="flex-1 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                    >
                      Save Evaluation
                    </button>
                  </div>
                </div>
             </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
