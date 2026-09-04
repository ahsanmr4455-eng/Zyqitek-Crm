import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Client, EmailDiscussion, CallDiscussion, ConversationDiscussion, Project, TeamMember } from '../types';
import { getNextMasterClientId, getMasterClientId } from '../lib/clientIdUtils';
import ProjectTracker from './ProjectTracker';
import { exportToCSV } from '../utils';
import { 
  Building2, 
  Mail, 
  Phone, 
  FolderGit2, 
  DollarSign, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Sliders,
  Users,
  Briefcase,
  ChevronRight,
  ClipboardList,
  Trash2,
  Edit3,
  X,
  Globe,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Clock,
  Paperclip,
  FileText,
  Instagram,
  Facebook,
  Linkedin,
  ExternalLink,
  Edit2,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Activity,
  Search,
  Filter,
  Archive,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import CrmProfileView from './CrmProfileView';

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return 'CL';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

interface ClientManagerProps {
  clients: Client[];
  projects?: Project[];
  initialSelectedClientId?: string | null;
  onClearInitialSelectedClientId?: () => void;
  onUpdateClient: (client: Client) => Promise<boolean> | void;
  onAddClient: (client: Omit<Client, 'id'>) => Promise<boolean> | any;
  onDeleteClient: (id: string) => Promise<boolean>;
  onDeleteMultipleClients?: (ids: string[]) => void;
  emailDiscussions?: EmailDiscussion[];
  callDiscussions?: CallDiscussion[];
  conversationDiscussions?: ConversationDiscussion[];
  onAddDiscussionRecord?: (client: Client, type: 'Email' | 'Call' | 'Conversation') => void;
  teamMembers?: TeamMember[];
}

export const PREDEFINED_SERVICES = [
  'Video Editing',
  'Graphic Design',
  'Logo & Brand Identity Design',
  'Website Development',
  'Software Development',
  'SEO (Search Engine Optimization)',
  'Digital Marketing',
  'Social Media Management',
  'E-commerce Solutions (Shopify / WooCommerce)',
  'UGC Ads',
  'AI Automation & Chatbots'
];

const SocialButtons = ({ email, instagram, facebook, compact = false }: { email?: string; instagram?: string; facebook?: string; compact?: boolean }) => {
  const handleOpenLink = (url?: string) => {
    if (!url) return;
    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const btnClass = compact 
    ? "p-2 sm:p-1 rounded text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] hover:bg-[var(--crm-sidebar)] transition-all cursor-pointer" 
    : "p-2 sm:p-1.5 rounded-md transition-all cursor-pointer hover:scale-105 active:scale-95";

  if (!email && !instagram && !facebook) return null;

  return (
    <div className="flex items-center gap-1.5 justify-center md:justify-start">
      {/* Instagram Button */}
      {instagram && instagram.trim() && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleOpenLink(instagram); }}
          className={`${btnClass} ${compact ? '' : 'text-pink-600 hover:bg-pink-500/10'}`}
          title={`Open Instagram: ${instagram}`}
        >
          <Instagram size={compact ? 13 : 15} />
        </button>
      )}

      {/* Facebook Button */}
      {facebook && facebook.trim() && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleOpenLink(facebook); }}
          className={`${btnClass} ${compact ? '' : 'text-blue-600 hover:bg-blue-500/10'}`}
          title={`Open Facebook: ${facebook}`}
        >
          <Facebook size={compact ? 13 : 15} />
        </button>
      )}

      {/* Email Button */}
      {email && email.trim() && (
        <a
          href={`mailto:${email.trim()}`}
          onClick={(e) => e.stopPropagation()}
          className={`${btnClass} ${compact ? '' : 'text-indigo-600 hover:bg-indigo-500/10 inline-flex items-center'}`}
          title={`Send Email to: ${email}`}
        >
          <Mail size={compact ? 13 : 15} />
        </a>
      )}
    </div>
  );
};

export default function ClientManager({ 
  clients, 
  projects = [],
  initialSelectedClientId,
  onClearInitialSelectedClientId,
  onUpdateClient, 
  onAddClient, 
  onDeleteClient,
  onDeleteMultipleClients,
  emailDiscussions = [],
  callDiscussions = [],
  conversationDiscussions = [],
  onAddDiscussionRecord,
  teamMembers = []
}: ClientManagerProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [progressVal, setProjectProgressVal] = useState<number>(50);
  const [activeTrackingClient, setActiveTrackingClient] = useState<Client | null>(null);
  const [selectedClientProfile, setSelectedClientProfile] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [serviceFilter, setServiceFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'No Active Project' | 'Project Completed' | 'Inactive'>('All');
  const [dateFilter, setDateFilter] = useState<string>('All');

  // Unified Filter Panel states & drafts
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [draftServiceFilter, setDraftServiceFilter] = useState<string>('All');
  const [draftStatusFilter, setDraftStatusFilter] = useState<'All' | 'Active' | 'No Active Project' | 'Project Completed' | 'Inactive'>('All');
  const [draftDateFilter, setDraftDateFilter] = useState<string>('All');
  const [draftSortField, setDraftSortField] = useState<'company' | 'name' | 'totalValue' | 'createdAt' | 'status'>('company');
  const [draftSortDirection, setDraftSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const [idSearchQuery, setIdSearchQuery] = useState('');

  const handleToggleFilter = () => {
    if (!isFilterOpen) {
      setDraftServiceFilter(serviceFilter);
      setDraftStatusFilter(statusFilter);
      setDraftDateFilter(dateFilter);
      setDraftSortField(sortField);
      setDraftSortDirection(sortDirection);
    }
    setIsFilterOpen(!isFilterOpen);
  };

  const handleApplyFilters = () => {
    setServiceFilter(draftServiceFilter);
    setStatusFilter(draftStatusFilter);
    setDateFilter(draftDateFilter);
    setSortField(draftSortField);
    setSortDirection(draftSortDirection);
    setIsFilterOpen(false);
  };

  const handleClearFilters = () => {
    setServiceFilter('All');
    setStatusFilter('All');
    setDateFilter('All');
    setSortField('company');
    setSortDirection('asc');

    setDraftServiceFilter('All');
    setDraftStatusFilter('All');
    setDraftDateFilter('All');
    setDraftSortField('company');
    setDraftSortDirection('asc');

    setIsFilterOpen(false);
  };

  const activeFiltersCount =
    (serviceFilter !== 'All' ? 1 : 0) +
    (statusFilter !== 'All' ? 1 : 0) +
    (dateFilter !== 'All' ? 1 : 0);

  const [sortField, setSortField] = useState<'company' | 'name' | 'totalValue' | 'createdAt' | 'status'>('company');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [addStatus, setAddStatus] = useState<Client['status']>('Active');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [addAssignedTeamMember, setAddAssignedTeamMember] = useState('');
  const [editAssignedTeamMember, setEditAssignedTeamMember] = useState('');
  const [users, setUsers] = useState<{ id: string; username: string; role: string }[]>([]);

  React.useEffect(() => {
    if (initialSelectedClientId) {
      const match = clients.find(c => c.id === initialSelectedClientId);
      if (match) {
        setSelectedClientId(match.id);
        setSelectedClientProfile(match);
      }
      if (onClearInitialSelectedClientId) {
        onClearInitialSelectedClientId();
      }
    }
  }, [initialSelectedClientId, clients, onClearInitialSelectedClientId]);

  React.useEffect(() => {
    fetch('/api/get_users.php')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setUsers(data);
        }
      })
      .catch(err => console.error('Error fetching users:', err));
  }, []);
  
  // Context Action Menu State for Long Press / Right Click
  const [actionMenuClient, setActionMenuClient] = useState<Client | null>(null);

  // Selection and Long-press system
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [showBulkDeleteClientsConfirm, setShowBulkDeleteClientsConfirm] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggeredForId = useRef<string | null>(null);
  const isTouchDevice = useRef(false);

  // Escape key listener to exit Selection Mode
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedClientIds.length > 0) {
        setSelectedClientIds([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClientIds]);

  const handleToggleSelectClient = (id: string) => {
    if (!id) return;
    setSelectedClientIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllClients = (filtered: Client[]) => {
    const filteredIds = filtered.map(c => c.id);
    const allSelected = filteredIds.every(id => selectedClientIds.includes(id));
    if (allSelected) {
      setSelectedClientIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedClientIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const startPress = (client: Client) => {
    longPressTriggeredForId.current = null;
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    longPressTimer.current = setTimeout(() => {
      longPressTriggeredForId.current = client.id;
      setActionMenuClient(client);
    }, 500);
  };

  const cancelPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleRowClick = (id: string, normalClick: () => void) => {
    if (longPressTriggeredForId.current === id) {
      longPressTriggeredForId.current = null;
      return;
    }
    longPressTriggeredForId.current = null;
    if (selectedClientIds.length > 0) {
      handleToggleSelectClient(id);
    } else {
      normalClick();
    }
  };

  const getPressHandlers = (client: Client, normalClick: () => void) => {
    return {
      onMouseDown: (e: React.MouseEvent) => {
        if (isTouchDevice.current) return;
        if (e.button !== 0) return;
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('a') || target.closest('svg')) {
          return;
        }
        startPress(client);
      },
      onMouseUp: () => {
        if (isTouchDevice.current) return;
        cancelPress();
      },
      onMouseLeave: () => {
        if (isTouchDevice.current) return;
        cancelPress();
      },
      onTouchStart: (e: React.TouchEvent) => {
        isTouchDevice.current = true;
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('a') || target.closest('svg')) {
          return;
        }
        startPress(client);
      },
      onTouchEnd: () => {
        cancelPress();
      },
      onTouchMove: cancelPress,
      onContextMenu: (e: React.MouseEvent) => {
        e.preventDefault();
        setActionMenuClient(client);
      },
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        // Prevent row selection if clicked on standard interactive controls
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('a')) {
          return;
        }
        handleRowClick(client.id, normalClick);
      }
    };
  };

  const handleDeleteBulkClients = () => {
    if (selectedClientIds.length === 0) return;
    setShowBulkDeleteClientsConfirm(true);
  };

  const handleExecuteBulkDeleteClients = () => {
    if (onDeleteMultipleClients) {
      onDeleteMultipleClients(selectedClientIds);
    }
    setSelectedClientIds([]);
    setShowBulkDeleteClientsConfirm(false);
  };

  const handleUpdateStatusBulkClients = (newStatus: 'Active' | 'Inactive') => {
    selectedClientIds.forEach(id => {
      const client = clients.find(c => c.id === id);
      if (client) {
        onUpdateClient({
          ...client,
          status: newStatus
        });
      }
    });
    setSelectedClientIds([]);
  };
  
  // Profile modal states
  const [clientProfileTab, setClientProfileTab] = useState<'overview' | 'contact' | 'payments' | 'notes' | 'discussions'>('overview');
  
  // SMM Campaign State (Adding Client)
  const [addSmmPlatformName, setAddSmmPlatformName] = useState('');
  const [addSmmPlannedPosts, setAddSmmPlannedPosts] = useState<number>(12);
  const [addSmmPostingFrequency, setAddSmmPostingFrequency] = useState('3 times a week');
  const [addSmmContentNotes, setAddSmmContentNotes] = useState('');
  const [addSmmCampaignRequirements, setAddSmmCampaignRequirements] = useState('');

  // Adding manual client
  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addCompany, setAddCompany] = useState('');
  const [addProjects, setAddProjects] = useState(1);
  const [addValue, setAddValue] = useState(15000);
  const [addServiceType, setAddServiceType] = useState('Other');
  const [addCustomServiceText, setAddCustomServiceText] = useState('');
  const [addNotes, setAddNotes] = useState('');
  const [addCountry, setAddCountry] = useState('');

  // Client Upgrade States (Adding)
  const [addInstagramLink, setAddInstagramLink] = useState('');
  const [addFacebookLink, setAddFacebookLink] = useState('');
  const [addLinkedInLink, setAddLinkedInLink] = useState('');
  const [addWebsiteUrl, setAddWebsiteUrl] = useState('');
  const [addOtherLink, setAddOtherLink] = useState('');

  // SMM Campaign State (Editing Client)
  const [editSmmPlatformName, setEditSmmPlatformName] = useState('');
  const [editSmmPlannedPosts, setEditSmmPlannedPosts] = useState<number>(12);
  const [editSmmPostingFrequency, setEditSmmPostingFrequency] = useState('');
  const [editSmmContentNotes, setEditSmmContentNotes] = useState('');
  const [editSmmCampaignRequirements, setEditSmmCampaignRequirements] = useState('');

  // Editing client
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editProjects, setEditProjects] = useState(1);
  const [editValue, setEditValue] = useState(15000);
  const [editStatus, setEditStatus] = useState<'Active' | 'Inactive' | 'No Active Project' | 'Project Completed' | string>('Active');
  const [editServiceType, setEditServiceType] = useState('Other');
  const [editCustomServiceText, setEditCustomServiceText] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editProgress, setEditProgress] = useState<number>(0);

  // Client Upgrade States (Editing)
  const [editInstagramLink, setEditInstagramLink] = useState('');
  const [editFacebookLink, setEditFacebookLink] = useState('');
  const [editLinkedInLink, setEditLinkedInLink] = useState('');
  const [editWebsiteUrl, setEditWebsiteUrl] = useState('');
  const [editOtherLink, setEditOtherLink] = useState('');

  // Client Custom Links States
  const [clientCustomLinks, setClientCustomLinks] = useState<{ id: string; name: string; url: string }[]>([]);
  const [showClientCustomLinkModal, setShowClientCustomLinkModal] = useState(false);
  const [clientCustomLinkName, setClientCustomLinkName] = useState('');
  const [clientCustomLinkUrl, setClientCustomLinkUrl] = useState('');
  const [editingClientCustomLinkId, setEditingClientCustomLinkId] = useState<string | null>(null);

  const [clientValidationError, setClientValidationError] = useState<string | null>(null);

  React.useEffect(() => {
    const isAnyModalOpen = showAddForm || !!editingClient || !!selectedClientProfile || !!clientToDelete || showBulkDeleteClientsConfirm || showClientCustomLinkModal || !!activeTrackingClient;
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showAddForm, editingClient, selectedClientProfile, clientToDelete, showBulkDeleteClientsConfirm, showClientCustomLinkModal, activeTrackingClient]);

  // Match related discussions dynamically using memoization
  const relatedEmails = useMemo(() => {
    if (!selectedClientProfile) return [];
    return emailDiscussions.filter(disc => 
      (disc.clientName || '').toLowerCase() === (selectedClientProfile.name || '').toLowerCase() ||
      (selectedClientProfile.company && (disc.clientName || '').toLowerCase() === (selectedClientProfile.company || '').toLowerCase())
    );
  }, [selectedClientProfile, emailDiscussions]);

  const relatedCalls = useMemo(() => {
    if (!selectedClientProfile) return [];
    return callDiscussions.filter(disc => 
      (disc.clientName || '').toLowerCase() === (selectedClientProfile.name || '').toLowerCase() ||
      (selectedClientProfile.company && (disc.clientName || '').toLowerCase() === (selectedClientProfile.company || '').toLowerCase())
    );
  }, [selectedClientProfile, callDiscussions]);

  const relatedConversations = useMemo(() => {
    if (!selectedClientProfile) return [];
    return conversationDiscussions.filter(disc => 
      (disc.leadName && disc.leadName.toLowerCase() === (selectedClientProfile.name || '').toLowerCase()) ||
      (disc.company && disc.company.toLowerCase() === (selectedClientProfile.company || '').toLowerCase()) ||
      disc.clientId === selectedClientProfile.id
    );
  }, [selectedClientProfile, conversationDiscussions]);

  const clientTimelineEvents = useMemo(() => {
    if (!selectedClientProfile) return [];
    
    const events: Array<{
      id: string;
      type: 'created' | 'discussion' | 'status_change';
      date: string;
      title: string;
      description: string;
    }> = [];

    // 1. Created Event
    events.push({
      id: `create-${selectedClientProfile.id}`,
      type: 'created',
      date: selectedClientProfile.createdAt || new Date().toISOString(),
      title: 'Account Registered',
      description: 'Client account was registered and validated within Zyqitek CRM.',
    });

    // 2. Status event
    events.push({
      id: `status-${selectedClientProfile.id}`,
      type: 'status_change',
      date: selectedClientProfile.updatedAt || selectedClientProfile.createdAt || new Date().toISOString(),
      title: `Account Status: ${selectedClientProfile.status}`,
      description: `Current account status is set to "${selectedClientProfile.status}".`,
    });

    // 3. Discussion events
    relatedEmails.forEach(email => {
      events.push({
        id: `email-${email.id}`,
        type: 'discussion',
        date: email.date || '',
        title: `Email: ${email.subject}`,
        description: email.content ? (email.content.length > 80 ? email.content.substring(0, 80) + '...' : email.content) : 'No description available.',
      });
    });

    relatedCalls.forEach(call => {
      events.push({
        id: `call-${call.id}`,
        type: 'discussion',
        date: call.callDate || '',
        title: `Call: ${call.summary}`,
        description: call.notes ? (call.notes.length > 80 ? call.notes.substring(0, 80) + '...' : call.notes) : 'No description available.',
      });
    });

    relatedConversations.forEach(conv => {
      events.push({
        id: `conv-${conv.id}`,
        type: 'discussion',
        date: conv.date && conv.time ? `${conv.date}T${conv.time}` : conv.date || '',
        title: `Meeting: ${conv.discussionTitle || 'Status Update'}`,
        description: conv.conversationSummary ? (conv.conversationSummary.length > 80 ? conv.conversationSummary.substring(0, 80) + '...' : conv.conversationSummary) : 'No details available.',
      });
    });

    // Sort events chronologically (newest first)
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedClientProfile, relatedEmails, relatedCalls, relatedConversations]);

  const handleOpenEditModal = (client: Client) => {
    setEditingClient(client);
    setEditName(client.name);
    setEditEmail(client.email);
    setEditPhone(client.phone);
    setEditCompany(client.company);
    setEditProjects(client.activeProjects);
    setEditValue(client.totalValue);
    setEditStatus(client.status);
    
    const isPredefined = PREDEFINED_SERVICES.includes(client.serviceType || '');
    if (isPredefined) {
      setEditServiceType(client.serviceType || 'Other');
      setEditCustomServiceText('');
    } else {
      setEditServiceType('Other');
      setEditCustomServiceText(client.serviceType || '');
    }
    setEditNotes(client.notes);
    setEditCountry(client.country || '');
    setEditProgress(client.projectProgress || 0);
    
    // Upgrade fields
    setEditAssignedTeamMember(client.assignedTeamMember || '');
    setEditInstagramLink(client.instagramLink || '');
    setEditFacebookLink(client.facebookLink || '');
    setEditLinkedInLink(client.linkedinLink || '');
    setEditWebsiteUrl(client.websiteUrl || '');
    setEditOtherLink(client.otherLink || '');
    
    let parsedLinks = [];
    if (client.customLinks) {
      try {
        parsedLinks = JSON.parse(client.customLinks);
        parsedLinks = parsedLinks.map((l: any, idx: number) => ({
          id: l.id || `cl-${idx}-${Date.now()}`,
          name: l.name,
          url: l.url
        }));
      } catch (e) {
        console.error("Error parsing custom links", e);
      }
    }
    setClientCustomLinks(parsedLinks);

    setClientValidationError(null);

    // SMM
    setEditSmmPlatformName(client.smmPlatformName || '');
    setEditSmmPlannedPosts(client.smmPlannedPosts || 12);
    setEditSmmPostingFrequency(client.smmPostingFrequency || '');
    setEditSmmContentNotes(client.smmContentNotes || '');
    setEditSmmCampaignRequirements(client.smmCampaignRequirements || '');
  };

  const handleSaveClientEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    if (!editName.trim()) {
      setClientValidationError("Full Name is required.");
      return;
    }
    if (!editEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail.trim())) {
      setClientValidationError("Please enter a valid Email Address.");
      return;
    }

    // URL validations (only if entered)
    const isValidUrl = (urlStr: string) => {
      if (!urlStr.trim()) return true;
      let val = urlStr.trim();
      if (!/^https?:\/\//i.test(val)) {
        val = 'https://' + val;
      }
      try {
        const u = new URL(val);
        return u.hostname.includes('.');
      } catch (_) {
        return false;
      }
    };

    if (editInstagramLink && !isValidUrl(editInstagramLink)) {
      setClientValidationError("Please enter a valid Instagram Link.");
      return;
    }
    if (editFacebookLink && !isValidUrl(editFacebookLink)) {
      setClientValidationError("Please enter a valid Facebook Link.");
      return;
    }
    if (editLinkedInLink && !isValidUrl(editLinkedInLink)) {
      setClientValidationError("Please enter a valid LinkedIn Link.");
      return;
    }
    if (editWebsiteUrl && !isValidUrl(editWebsiteUrl)) {
      setClientValidationError("Please enter a valid Website URL.");
      return;
    }
    if (editOtherLink && !isValidUrl(editOtherLink)) {
      setClientValidationError("Please enter a valid Other Social Link.");
      return;
    }

    setClientValidationError(null);
    setIsSaving(true);

    const actualServiceType = editServiceType === 'Other' ? editCustomServiceText.trim() || 'Other' : editServiceType;

    try {
      await onUpdateClient({
        ...editingClient,
        masterClientId: editingClient.masterClientId || getMasterClientId(editingClient),
        name: editName,
        email: editEmail,
        phone: editPhone,
        company: editCompany,
        activeProjects: Number(editProjects),
        totalValue: Number(editValue),
        status: editStatus,
        serviceType: actualServiceType,
        notes: editNotes,
        country: editCountry,
        projectProgress: Number(editProgress),
        assignedTeamMember: editAssignedTeamMember || undefined,
        instagramLink: editInstagramLink,
        facebookLink: editFacebookLink,
        linkedinLink: editLinkedInLink,
        websiteUrl: editWebsiteUrl,
        otherLink: editOtherLink,
        customLinks: JSON.stringify(clientCustomLinks),
        // SMM
        smmPlatformName: editServiceType === 'Social Media Management' ? editSmmPlatformName : undefined,
        smmPlannedPosts: editServiceType === 'Social Media Management' ? Number(editSmmPlannedPosts) : undefined,
        smmPostingFrequency: editServiceType === 'Social Media Management' ? editSmmPostingFrequency : undefined,
        smmContentNotes: editServiceType === 'Social Media Management' ? editSmmContentNotes : undefined,
        smmCampaignRequirements: editServiceType === 'Social Media Management' ? editSmmCampaignRequirements : undefined
      });

      setEditingClient(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Filter and sort clients
  const filteredClients = useMemo(() => {
    // Exclude archived clients from default Active Clients list
    let baseList = clients.filter(c => c.status !== 'Archived');

    if (idSearchQuery.trim()) {
      const q = idSearchQuery.trim().toLowerCase();
      baseList = baseList.filter(client => {
        const matchId = client.id.toLowerCase().includes(q) || 
                        (client.masterClientId && client.masterClientId.toLowerCase().includes(q));
        const matchName = (client.name || '').toLowerCase().includes(q);
        const matchCompany = (client.company || '').toLowerCase().includes(q);
        const matchEmail = (client.email || '').toLowerCase().includes(q);
        const matchPhone = (client.phone || '').toLowerCase().includes(q);
        const clientProjectsList = projects ? projects.filter(p => p.clientId === client.id) : [];
        const matchProject = clientProjectsList.some(p => p.name.toLowerCase().includes(q));
        return matchId || matchName || matchCompany || matchEmail || matchPhone || matchProject;
      });
    }

    const list = baseList.filter(client => {
      // 1. Service type filter
      let matchService = true;
      if (serviceFilter !== 'All') {
        const isPredefined = PREDEFINED_SERVICES.includes(client.serviceType || '');
        if (serviceFilter === 'Other') {
          matchService = !client.serviceType || !isPredefined;
        } else {
          matchService = client.serviceType === serviceFilter;
        }
      }

      // 2. Status filter
      let matchStatus = true;
      if (statusFilter !== 'All') {
        matchStatus = client.status === statusFilter;
      }

      // 3. Created Date filter
      let matchDate = true;
      if (dateFilter !== 'All') {
        if (!client.createdAt) {
          matchDate = false;
        } else {
          const createdDate = new Date(client.createdAt);
          const now = new Date();
          if (dateFilter === 'today') {
            const yesterday = new Date();
            yesterday.setHours(now.getHours() - 24);
            matchDate = createdDate >= yesterday;
          } else if (dateFilter === '7days') {
            const lastWeek = new Date();
            lastWeek.setDate(now.getDate() - 7);
            matchDate = createdDate >= lastWeek;
          } else if (dateFilter === '30days') {
            const lastMonth = new Date();
            lastMonth.setDate(now.getDate() - 30);
            matchDate = createdDate >= lastMonth;
          } else if (dateFilter === 'thismonth') {
            matchDate = createdDate.getMonth() === now.getMonth() && createdDate.getFullYear() === now.getFullYear();
          } else if (dateFilter === 'thisyear') {
            matchDate = createdDate.getFullYear() === now.getFullYear();
          }
        }
      }

      return matchService && matchStatus && matchDate;
    });

    return list.sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      switch (sortField) {
        case 'company':
          valA = (a.company || a.name || '').toLowerCase();
          valB = (b.company || b.name || '').toLowerCase();
          break;
        case 'name':
          valA = (a.name || '').toLowerCase();
          valB = (b.name || '').toLowerCase();
          break;
        case 'totalValue':
          valA = a.totalValue ?? 0;
          valB = b.totalValue ?? 0;
          break;
        case 'status':
          valA = (a.status || '').toLowerCase();
          valB = (b.status || '').toLowerCase();
          break;
        case 'createdAt':
          valA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          valB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          break;
        default:
          valA = (a.company || a.name || '').toLowerCase();
          valB = (b.company || b.name || '').toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [clients, serviceFilter, statusFilter, dateFilter, sortField, sortDirection, idSearchQuery, projects]);

  const activeClient = useMemo(() => {
    return filteredClients.find(c => c.id === selectedClientId) || (filteredClients.length > 0 ? filteredClients[0] : null);
  }, [filteredClients, selectedClientId]);

  const handleSubmitAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !addCompany.trim()) return;

    if (!addEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addEmail.trim())) {
      setClientValidationError("Please enter a valid Email Address.");
      return;
    }

    // URL validations (only if entered)
    const isValidUrl = (urlStr: string) => {
      if (!urlStr.trim()) return true;
      let val = urlStr.trim();
      if (!/^https?:\/\//i.test(val)) {
        val = 'https://' + val;
      }
      try {
        const u = new URL(val);
        return u.hostname.includes('.');
      } catch (_) {
        return false;
      }
    };

    if (addInstagramLink && !isValidUrl(addInstagramLink)) {
      setClientValidationError("Please enter a valid Instagram Link.");
      return;
    }
    if (addFacebookLink && !isValidUrl(addFacebookLink)) {
      setClientValidationError("Please enter a valid Facebook Link.");
      return;
    }
    if (addLinkedInLink && !isValidUrl(addLinkedInLink)) {
      setClientValidationError("Please enter a valid LinkedIn Link.");
      return;
    }
    if (addWebsiteUrl && !isValidUrl(addWebsiteUrl)) {
      setClientValidationError("Please enter a valid Website URL.");
      return;
    }
    if (addOtherLink && !isValidUrl(addOtherLink)) {
      setClientValidationError("Please enter a valid Other Social Link.");
      return;
    }

    setClientValidationError(null);
    setIsSaving(true);

    const actualServiceType = addServiceType === 'Other' ? addCustomServiceText.trim() || 'Other' : addServiceType;

    try {
      const success = await onAddClient({
        masterClientId: getNextMasterClientId(clients),
        name: addName,
        email: addEmail,
        phone: addPhone,
        company: addCompany,
        activeProjects: Number(addProjects || 0),
        totalValue: Number(addValue || 0),
        status: addStatus || 'Active',
        projectProgress: 0,
        serviceType: actualServiceType,
        notes: addNotes || 'Profile initialized.',
        country: addCountry,
        assignedTeamMember: addAssignedTeamMember || undefined,
        instagramLink: addInstagramLink,
        facebookLink: addFacebookLink,
        linkedinLink: addLinkedInLink,
        websiteUrl: addWebsiteUrl,
        otherLink: addOtherLink,
        customLinks: JSON.stringify(clientCustomLinks),
      });

      if (success) {
        // Reset fields
        setAddName('');
        setAddEmail('');
        setAddPhone('');
        setAddCompany('');
        setAddProjects(1);
        setAddValue(15000);
        setAddStatus('Active');
        setAddServiceType('Other');
        setAddCustomServiceText('');
        setAddNotes('');
        setAddCountry('');
        setAddAssignedTeamMember('');
        setAddInstagramLink('');
        setAddFacebookLink('');
        setAddLinkedInLink('');
        setAddWebsiteUrl('');
        setAddOtherLink('');
        setClientCustomLinks([]);
        setAddSmmPlatformName('');
        setAddSmmPlannedPosts(12);
        setAddSmmPostingFrequency('3 times a week');
        setAddSmmContentNotes('');
        setAddSmmCampaignRequirements('');
        setShowAddForm(false);
      } else {
        setClientValidationError("Failed to save the client. Please try again.");
      }
    } catch (err: any) {
      console.error(err);
      setClientValidationError(err.message || "An error occurred during save.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateProgress = () => {
    if (!activeClient) return;
    onUpdateClient({
      ...activeClient,
      projectProgress: progressVal
    });
  };

  // Mock invoice billing tracker for active clients
  const mockInvoices = [
    { id: 'inv-101', description: 'Contract Activation Deposit', amount: 5000, date: '2026-06-15', status: 'Paid' },
    { id: 'inv-102', description: 'Design Approval Milestone', amount: 4500, date: '2026-06-22', status: 'Paid' },
    { id: 'inv-103', description: 'Beta Delivery Milestone', amount: 6000, date: '2026-07-10', status: 'Pending' }
  ];

  return (
    <div className="space-y-4 text-[var(--crm-text)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[30px] sm:text-[32px] font-bold tracking-tight !text-white text-white font-structure leading-[1.2] section-main-heading">Clients</h1>
          <p className="!text-white text-white text-sm font-normal italic mt-1 section-sub-heading">Oversee and manage client accounts, services, and profile details.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/10 cursor-pointer"
          >
            <Plus size={14} /> Add Client
          </button>
        </div>
      </div>

      {/* Client Dashboard Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 2xl:grid-cols-4 gap-2.5">
        <div className="bg-[var(--crm-card)] p-3 rounded-xl border border-transparent shadow-2xs flex items-center gap-2.5 hover:shadow-xs transition-shadow duration-200">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 shrink-0">
            <Users size={15} />
          </div>
          <div>
            <p className="text-[10px] text-[var(--crm-text-muted)] mb-0.5 leading-none">Total Accounts</p>
            <p className="text-base text-[var(--crm-text)] leading-none">{clients.filter(c => c.status !== 'Archived').length}</p>
          </div>
        </div>

        <div className="bg-[var(--crm-card)] p-3 rounded-xl border border-transparent shadow-2xs flex items-center gap-2.5 hover:shadow-xs transition-shadow duration-200">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0">
            <CheckCircle size={15} />
          </div>
          <div>
            <p className="text-[10px] text-[var(--crm-text-muted)] mb-0.5 leading-none">Active</p>
            <p className="text-base text-[var(--crm-text)] leading-none">{clients.filter(c => c.status === 'Active').length}</p>
          </div>
        </div>

        <div className="bg-[var(--crm-card)] p-3 rounded-xl border border-transparent shadow-2xs flex items-center gap-2.5 hover:shadow-xs transition-shadow duration-200">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 shrink-0">
            <AlertCircle size={15} />
          </div>
          <div>
            <p className="text-[10px] text-[var(--crm-text-muted)] mb-0.5 leading-none">Completed</p>
            <p className="text-base text-[var(--crm-text)] leading-none">{clients.filter(c => c.status === 'Project Completed').length}</p>
          </div>
        </div>

        <div className="bg-[var(--crm-card)] p-3 rounded-xl border border-transparent shadow-2xs flex items-center gap-2.5 hover:shadow-xs transition-shadow duration-200">
          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-600 shrink-0">
            <Briefcase size={15} />
          </div>
          <div>
            <p className="text-[10px] text-[var(--crm-text-muted)] mb-0.5 leading-none">Active Work</p>
            <p className="text-base text-[var(--crm-text)] leading-none">
              {projects ? projects.filter(p => p.status !== 'Completed' && p.status !== 'Delivered' && p.status !== 'Cancelled').length : clients.filter(c => c.status !== 'Archived').reduce((sum, c) => sum + (c.activeProjects || 0), 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Add Client Form Modal with backdrop blur */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative bg-[var(--crm-card)] w-full max-w-2xl 3xl:max-w-4xl 4k:max-w-5xl 5k:max-w-7xl rounded-xl shadow-2xl overflow-hidden z-10 text-[var(--crm-text)]"
            >
              <form onSubmit={handleSubmitAddClient} className="p-6 space-y-4 text-xs text-[var(--crm-text-secondary)] max-h-[85vh] overflow-y-auto">
                <div className="border-b border-[var(--crm-card-border)] pb-3 flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-indigo-700 text-sm">Create New Client Account Record</h4>
                    <p className="text-[11px] text-[var(--crm-text-muted)]">Initialize a deliverables track card manually.</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setShowAddForm(false)}
                    className="text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] p-1.5 rounded-lg hover:bg-[var(--crm-sidebar-active-bg)] transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="font-medium text-[var(--crm-text-muted)] ">Contact Name</label>
              <input 
                type="text" required value={addName} onChange={(e) => setAddName(e.target.value)}
                placeholder="e.g. Marcus Brody"
                className="w-full px-3 py-2 border border-[var(--crm-card-border)] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs bg-[var(--crm-sidebar)] text-[var(--crm-text)]"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-[var(--crm-text-muted)] ">Company Name</label>
              <input 
                type="text" required value={addCompany} onChange={(e) => setAddCompany(e.target.value)}
                placeholder="e.g. Nexus Transit Corp"
                className="w-full px-3 py-2 border border-[var(--crm-card-border)] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs bg-[var(--crm-sidebar)] text-[var(--crm-text)]"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-[var(--crm-text-muted)] ">Work Email</label>
              <input 
                type="email" required value={addEmail} onChange={(e) => setAddEmail(e.target.value)}
                placeholder="e.g. mbrody@nexus.org"
                className="w-full px-3 py-2 border border-[var(--crm-card-border)] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs bg-[var(--crm-sidebar)] text-[var(--crm-text)]"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-[var(--crm-text-muted)] ">Phone Number (Optional)</label>
              <input 
                type="text" value={addPhone} onChange={(e) => setAddPhone(e.target.value)}
                placeholder="e.g. +1 (555) 091-1144"
                className="w-full px-3 py-2 border border-[var(--crm-card-border)] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs bg-[var(--crm-sidebar)] text-[var(--crm-text)]"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-[var(--crm-text-muted)] ">Country</label>
              <input 
                type="text" value={addCountry} onChange={(e) => setAddCountry(e.target.value)}
                placeholder="e.g. United Kingdom"
                className="w-full px-3 py-2 border border-[var(--crm-card-border)] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs bg-[var(--crm-sidebar)] text-[var(--crm-text)]"
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-[var(--crm-text-muted)] ">Service Type</label>
              <select 
                value={addServiceType} 
                onChange={(e) => setAddServiceType(e.target.value)}
                className="w-full px-3 py-2 border border-[var(--crm-card-border)] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs bg-[var(--crm-sidebar)] text-[var(--crm-text)]"
              >
                {PREDEFINED_SERVICES.map(service => (
                  <option key={service} value={service}>{service}</option>
                ))}
                <option value="Other">Other</option>
              </select>
            </div>


          </div>

          <div className="border-t border-[var(--crm-card-border)] pt-3.5 mt-2">
            <h5 className="font-medium text-indigo-700 text-xs mb-2.5">Social & Profile Links (Optional)</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="font-medium text-[var(--crm-text-secondary)]">Instagram Link</label>
                <input 
                  type="text" value={addInstagramLink} onChange={(e) => setAddInstagramLink(e.target.value)}
                  placeholder="e.g. instagram.com/username"
                  className="w-full px-3 py-2 border border-[var(--crm-card-border)] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-[var(--crm-text-secondary)]">Facebook Link</label>
                <input 
                  type="text" value={addFacebookLink} onChange={(e) => setAddFacebookLink(e.target.value)}
                  placeholder="e.g. facebook.com/username"
                  className="w-full px-3 py-2 border border-[var(--crm-card-border)] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-[var(--crm-text-secondary)]">LinkedIn Link</label>
                <input 
                  type="text" value={addLinkedInLink} onChange={(e) => setAddLinkedInLink(e.target.value)}
                  placeholder="e.g. linkedin.com/in/username"
                  className="w-full px-3 py-2 border border-[var(--crm-card-border)] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-[var(--crm-text-secondary)]">Website URL</label>
                <input 
                  type="text" value={addWebsiteUrl} onChange={(e) => setAddWebsiteUrl(e.target.value)}
                  placeholder="e.g. www.company.com"
                  className="w-full px-3 py-2 border border-[var(--crm-card-border)] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs"
                />
              </div>
            </div>

            {/* Dynamic Custom Links for Add Client */}
            <div className="mt-4 p-4 bg-[var(--crm-sidebar)] rounded-xl border border-[var(--crm-card-border)] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h6 className="font-medium text-[var(--crm-text)] text-xs  ">Custom Profile Links</h6>
                  <p className="text-[10px] text-[var(--crm-subtitle)]">Add unlimited custom clickable buttons for this client.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingClientCustomLinkId(null);
                    setClientCustomLinkName('');
                    setClientCustomLinkUrl('');
                    setShowClientCustomLinkModal(true);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-medium rounded-lg transition-colors cursor-pointer"
                >
                  <Plus size={10} /> Add Link
                </button>
              </div>

              {clientCustomLinks.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {clientCustomLinks.map((link) => (
                    <div
                      key={link.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--crm-card)] border border-[var(--crm-card-border)] text-[var(--crm-text)] text-[10px]  rounded-lg shadow-sm"
                    >
                      <span className="truncate max-w-[120px] 2xl:max-w-[240px] 3xl:max-w-[400px] 4k:max-w-none">{link.name}</span>
                      <div className="flex items-center gap-1 border-l border-[var(--crm-card-border)] pl-1.5 ml-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingClientCustomLinkId(link.id);
                            setClientCustomLinkName(link.name);
                            setClientCustomLinkUrl(link.url);
                            setShowClientCustomLinkModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 p-0.5"
                        >
                          <Edit2 size={10} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setClientCustomLinks(prev => prev.filter(l => l.id !== link.id));
                          }}
                          className="text-rose-600 hover:text-rose-800 p-0.5"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-1 text-[var(--crm-text-muted)] text-[10px] italic">No custom links added yet.</div>
              )}
            </div>
          </div>

          {clientValidationError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2 font-semibold">
              <AlertCircle size={16} />
              <span>{clientValidationError}</span>
            </div>
          )}

                <div className="flex justify-end items-center gap-2 pt-4 border-t border-[var(--crm-card-border)]">
                  <button 
                    type="button" 
                    disabled={isSaving}
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 bg-[var(--crm-sidebar)] hover:bg-[var(--crm-sidebar-active-bg)] text-[var(--crm-text-secondary)]  rounded-lg transition-colors cursor-pointer disabled:opacity-50 text-xs"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-[var(--crm-text)] hover:opacity-90 text-[var(--crm-card)] font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50 text-xs"
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Add Client</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Client Directory (Full Width Container) */}
      <div className="bg-[var(--crm-bg)] rounded-xl border border-transparent shadow-sm p-3.5 sm:p-4 space-y-3">
          
          {selectedClientIds.length > 0 && (
            <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 rounded-xl p-2.5 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-5 w-5 bg-indigo-600 text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
                    {selectedClientIds.length}
                  </span>
                  <span className="text-xs font-medium text-indigo-950 dark:text-indigo-200">Clients selected</span>
                </div>
                <button
                  onClick={() => setSelectedClientIds([])}
                  className="text-[10px] font-medium text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)] cursor-pointer"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleUpdateStatusBulkClients('Active')}
                  className="px-2 py-1 bg-[var(--crm-card)] hover:bg-[var(--crm-sidebar-active-bg)] border border-[var(--crm-card-border)] text-[10px] font-medium rounded text-emerald-700 cursor-pointer shadow-xs"
                >
                  Mark Active
                </button>
                <button
                  onClick={() => handleUpdateStatusBulkClients('Inactive')}
                  className="px-2 py-1 bg-[var(--crm-card)] hover:bg-[var(--crm-sidebar-active-bg)] border border-[var(--crm-card-border)] text-[10px] font-medium rounded text-amber-700 cursor-pointer shadow-xs"
                >
                  Mark Inactive
                </button>
                <button
                  onClick={handleDeleteBulkClients}
                  className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-medium rounded cursor-pointer flex items-center gap-1 shadow-sm shadow-rose-600/10"
                >
                  <Trash2 size={10} /> Delete
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--crm-card-border)] pb-3">
            <div className="flex items-center gap-2">
              <h4 
                className="text-base font-bold text-white dark:text-white !text-white !font-bold font-structure tracking-tight flex items-center gap-2 not-italic"
                style={{ color: '#FFFFFF', fontWeight: 700 }}
              >
                <span 
                  className="font-bold text-white dark:text-white !text-white !font-bold not-italic"
                  style={{ color: '#FFFFFF', fontWeight: 700 }}
                >
                  Client Directory
                </span>
              </h4>
              <span className="text-[11px] font-medium text-[var(--crm-text-secondary)] bg-[var(--crm-card)] border border-[var(--crm-card-border)] px-2.5 py-0.5 rounded-full shadow-xs">
                {`${filteredClients.length} of ${clients.filter(c => c.status !== 'Archived').length}`}
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Compact Search Bar */}
              <div className="relative flex-1 sm:flex-initial sm:w-60">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[var(--crm-text-muted)]">
                  <Search size={13} />
                </span>
                <input
                  type="text"
                  placeholder="Search ID, name, email..."
                  value={idSearchQuery}
                  onChange={(e) => setIdSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 bg-[var(--crm-card)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-lg outline-hidden text-xs focus:ring-1 focus:ring-indigo-500 transition-shadow placeholder-[var(--crm-text-muted)]"
                />
                {idSearchQuery ? (
                  <button
                    onClick={() => setIdSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[var(--crm-text-muted)] hover:text-white"
                  >
                    <X size={12} />
                  </button>
                ) : null}
              </div>

              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={handleToggleFilter}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer select-none active:scale-95 ${
                    isFilterOpen || activeFiltersCount > 0
                      ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 shadow-xs'
                      : 'bg-[var(--crm-card)] border-[var(--crm-card-border)] text-[var(--crm-text)] hover:bg-[var(--crm-sidebar)]'
                  }`}
                >
                  <Filter size={12} />
                  <span>Filter{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}</span>
                </button>

                {/* Filter Panel (Dropdown and Mobile bottom sheet) */}
                <AnimatePresence>
                  {isFilterOpen && (
                    <>
                      {/* Backdrop for click outside */}
                      <div className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent" onClick={() => setIsFilterOpen(false)} />

                      {/* Desktop panel */}
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="hidden sm:block absolute right-0 top-full mt-2 w-80 bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl shadow-xl p-4 z-50 space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-[var(--crm-card-border)] pb-1.5">
                          <span className="font-medium text-[var(--crm-text)] text-xs">Client Filters</span>
                          <button onClick={() => setIsFilterOpen(false)} className="text-[var(--crm-text-muted)] hover:text-[var(--crm-text-secondary)]">
                            <X size={14} />
                          </button>
                        </div>

                        <div className="space-y-2">
                          {/* Client Status */}
                          <div className="space-y-1 text-xs">
                            <label className="font-medium text-[var(--crm-text-secondary)] block">Account Status</label>
                            <select
                              value={draftStatusFilter}
                              onChange={(e) => setDraftStatusFilter(e.target.value as any)}
                              className="w-full px-2 py-1.5 bg-[var(--crm-sidebar)] text-[var(--crm-text)] border border-[var(--crm-card-border)] rounded-md outline-hidden text-xs cursor-pointer"
                            >
                              <option value="All">All Statuses</option>
                              <option value="Active">Active</option>
                              <option value="No Active Project">No Project</option>
                              <option value="Project Completed">Completed</option>
                              <option value="Inactive">Inactive</option>
                            </select>
                          </div>

                          {/* Service Type */}
                          <div className="space-y-1 text-xs">
                            <label className="font-medium text-[var(--crm-text-secondary)] block">Service Type</label>
                            <select
                              value={draftServiceFilter}
                              onChange={(e) => setDraftServiceFilter(e.target.value)}
                              className="w-full px-2 py-1.5 bg-[var(--crm-sidebar)] text-[var(--crm-text)] border border-[var(--crm-card-border)] rounded-md outline-hidden text-xs cursor-pointer"
                            >
                              <option value="All">All Services</option>
                              {PREDEFINED_SERVICES.map(svc => (
                                <option key={svc} value={svc}>{svc}</option>
                              ))}
                              <option value="Other">Other</option>
                            </select>
                          </div>

                          {/* Created Date */}
                          <div className="space-y-1 text-xs">
                            <label className="font-medium text-[var(--crm-text-secondary)] block">Date Added</label>
                            <select
                              value={draftDateFilter}
                              onChange={(e) => setDraftDateFilter(e.target.value)}
                              className="w-full px-2 py-1.5 bg-[var(--crm-sidebar)] text-[var(--crm-text)] border border-[var(--crm-card-border)] rounded-md outline-hidden text-xs cursor-pointer"
                            >
                              <option value="All">All Time</option>
                              <option value="today">Today (Last 24 Hours)</option>
                              <option value="7days">Last 7 Days</option>
                              <option value="30days">Last 30 Days</option>
                              <option value="thismonth">This Month</option>
                              <option value="thisyear">This Year</option>
                            </select>
                          </div>

                          {/* Sort Options */}
                          <div className="pt-2 border-t border-[var(--crm-card-border)] space-y-2">
                            <div className="space-y-1 text-xs">
                              <label className="font-medium text-[var(--crm-text-secondary)] block">Sort By</label>
                              <select
                                value={draftSortField}
                                onChange={(e) => setDraftSortField(e.target.value as any)}
                                className="w-full px-2 py-1.5 bg-[var(--crm-sidebar)] text-[var(--crm-text)] border border-[var(--crm-card-border)] rounded-md outline-hidden text-xs cursor-pointer"
                              >
                                <option value="name">Contact Name</option>
                                <option value="company">Company</option>
                                <option value="totalValue">Deal Value</option>
                                <option value="createdAt">Date Added</option>
                                <option value="status">Status</option>
                              </select>
                            </div>
                            <div className="space-y-1 text-xs">
                              <label className="font-medium text-[var(--crm-text-secondary)] block">Direction</label>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setDraftSortDirection('asc')}
                                  className={`flex-1 py-1.5 rounded-md border text-[10px] font-medium transition-all ${
                                    draftSortDirection === 'asc'
                                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                                      : 'bg-[var(--crm-sidebar)] border-[var(--crm-card-border)] text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar-active-bg)]'
                                  }`}
                                >
                                  Ascending
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDraftSortDirection('desc')}
                                  className={`flex-1 py-1.5 rounded-md border text-[10px] font-medium transition-all ${
                                    draftSortDirection === 'desc'
                                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                                      : 'bg-[var(--crm-sidebar)] border-[var(--crm-card-border)] text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar-active-bg)]'
                                  }`}
                                >
                                  Descending
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-[var(--crm-card-border)] pt-2.5">
                          <button
                            onClick={handleClearFilters}
                            className="px-2.5 py-1.5 bg-[var(--crm-sidebar)] text-[var(--crm-text-secondary)] text-[11px]  rounded-md transition-colors border border-[var(--crm-card-border)] cursor-pointer"
                          >
                            Clear
                          </button>
                          <button
                            onClick={handleApplyFilters}
                            className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-medium rounded-md transition-colors cursor-pointer"
                          >
                            Apply Filters
                          </button>
                        </div>
                      </motion.div>

                      {/* Mobile bottom sheet */}
                      <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="sm:hidden fixed bottom-0 left-0 right-0 bg-[var(--crm-card)] rounded-t-2xl shadow-2xl p-5 z-50 space-y-4"
                      >
                        <div className="flex items-center justify-between border-b border-[var(--crm-card-border)] pb-2">
                          <span className="font-medium text-[var(--crm-text)] text-sm">Client Filters</span>
                          <button onClick={() => setIsFilterOpen(false)} className="text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] p-1">
                            <X size={18} />
                          </button>
                        </div>

                        <div className="space-y-3">
                          {/* Client Status */}
                          <div className="space-y-1 text-xs">
                            <label className="font-medium text-[var(--crm-text-secondary)] block">Account Status</label>
                            <select
                              value={draftStatusFilter}
                              onChange={(e) => setDraftStatusFilter(e.target.value as any)}
                              className="w-full px-3 py-2 bg-[var(--crm-sidebar)] text-[var(--crm-text)] border border-[var(--crm-card-border)] rounded-lg outline-hidden text-xs cursor-pointer"
                            >
                              <option value="All">All Statuses</option>
                              <option value="Active">Active</option>
                              <option value="No Active Project">No Project</option>
                              <option value="Project Completed">Completed</option>
                              <option value="Inactive">Inactive</option>
                            </select>
                          </div>

                          {/* Service Type */}
                          <div className="space-y-1 text-xs">
                            <label className="font-medium text-[var(--crm-text-secondary)] block">Service Type</label>
                            <select
                              value={draftServiceFilter}
                              onChange={(e) => setDraftServiceFilter(e.target.value)}
                              className="w-full px-3 py-2 bg-[var(--crm-sidebar)] text-[var(--crm-text)] border border-[var(--crm-card-border)] rounded-lg outline-hidden text-xs cursor-pointer"
                            >
                              <option value="All">All Services</option>
                              {PREDEFINED_SERVICES.map(svc => (
                                <option key={svc} value={svc}>{svc}</option>
                              ))}
                              <option value="Other">Other</option>
                            </select>
                          </div>

                           {/* Created Date */}
                          <div className="space-y-1 text-xs">
                            <label className="font-medium text-[var(--crm-text-secondary)] block">Date Added</label>
                            <select
                              value={draftDateFilter}
                              onChange={(e) => setDraftDateFilter(e.target.value)}
                              className="w-full px-3 py-2 bg-[var(--crm-sidebar)] text-[var(--crm-text)] border border-[var(--crm-card-border)] rounded-lg outline-hidden text-xs cursor-pointer"
                            >
                              <option value="All">All Time</option>
                              <option value="today">Today (Last 24 Hours)</option>
                              <option value="7days">Last 7 Days</option>
                              <option value="30days">Last 30 Days</option>
                              <option value="thismonth">This Month</option>
                              <option value="thisyear">This Year</option>
                            </select>
                          </div>

                          {/* Sort Options Mobile */}
                          <div className="pt-3 border-t border-[var(--crm-card-border)] space-y-3">
                            <div className="space-y-1 text-xs">
                              <label className="font-medium text-[var(--crm-text-secondary)] block">Sort By</label>
                              <select
                                value={draftSortField}
                                onChange={(e) => setDraftSortField(e.target.value as any)}
                                className="w-full px-3 py-2 bg-[var(--crm-sidebar)] text-[var(--crm-text)] border border-[var(--crm-card-border)] rounded-lg outline-hidden text-xs cursor-pointer"
                              >
                                <option value="name">Contact Name</option>
                                <option value="company">Company</option>
                                <option value="totalValue">Deal Value</option>
                                <option value="createdAt">Date Added</option>
                                <option value="status">Status</option>
                              </select>
                            </div>
                            <div className="space-y-1 text-xs">
                              <label className="font-medium text-[var(--crm-text-secondary)] block">Direction</label>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setDraftSortDirection('asc')}
                                  className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${
                                    draftSortDirection === 'asc'
                                      ? 'bg-indigo-600 border-indigo-600 text-white'
                                      : 'bg-[var(--crm-sidebar)] border-[var(--crm-card-border)] text-[var(--crm-text-secondary)]'
                                  }`}
                                >
                                  Ascending
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDraftSortDirection('desc')}
                                  className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${
                                    draftSortDirection === 'desc'
                                      ? 'bg-indigo-600 border-indigo-600 text-white'
                                      : 'bg-[var(--crm-sidebar)] border-[var(--crm-card-border)] text-[var(--crm-text-secondary)]'
                                  }`}
                                >
                                  Descending
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 pt-4 border-t border-[var(--crm-card-border)]">
                          <button
                            onClick={handleClearFilters}
                            className="flex-1 py-2.5 bg-[var(--crm-sidebar)] hover:bg-[var(--crm-sidebar-active-bg)] text-[var(--crm-text-secondary)] text-xs  rounded-xl transition-all text-center cursor-pointer border border-[var(--crm-card-border)]"
                          >
                            Clear
                          </button>
                          <button
                            onClick={handleApplyFilters}
                            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl transition-all text-center cursor-pointer"
                          >
                            Apply Filters
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 4k:grid-cols-7 5k:grid-cols-10 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 4k:grid-cols-8 5k:grid-cols-12 gap-3 max-h-[calc(100vh-270px)] min-h-[350px] overflow-y-auto pr-1 pb-4">
            {filteredClients.length > 0 ? (
                filteredClients.map(client => {
                  const isActive = activeClient && activeClient.id === client.id;
                  const isSelected = selectedClientIds.includes(client.id);
                  const hasActiveProject = projects.some(p => p.clientId === client.id && p.status !== 'Completed' && p.status !== 'Delivered' && p.status !== 'Cancelled');
                  
                  const hasSocials = client.email || client.instagramLink || client.facebookLink;

                  return (
                    <motion.div
                      key={client.id}
                      layoutId={`client-card-${client.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      id={`client-btn-${client.id}`}
                      {...getPressHandlers(client, () => {
                        setSelectedClientId(client.id);
                        setProjectProgressVal(client.projectProgress);
                        setSelectedClientProfile(client);
                      })}
                      className={`w-full text-left p-2.5 sm:p-3 rounded-xl border transition-all flex flex-col gap-1.5 sm:gap-2 cursor-pointer select-none relative ${
                        isActive 
                          ? 'bg-[var(--crm-sidebar)] border-[var(--crm-card-border)] shadow-xs ring-1 ring-[var(--crm-card-border)]' 
                          : 'bg-[var(--crm-card)] border-[var(--crm-card-border)] hover:bg-[var(--crm-sidebar)]'
                      }`}
                    >
                      {/* Top Header: Checkbox + Name + Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-1.5 sm:gap-2 min-w-0">
                          {selectedClientIds.length > 0 && (
                            <div 
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                              onMouseUp={(e) => e.stopPropagation()}
                              onTouchStart={(e) => e.stopPropagation()}
                              onTouchEnd={(e) => e.stopPropagation()}
                              className="pt-0.5 shrink-0 px-1 -ml-1"
                            >
                              <input 
                                type="checkbox" 
                                checked={isSelected}
                                onChange={() => handleToggleSelectClient(client.id)}
                                className="rounded border-[var(--crm-card-border)] text-indigo-600 focus:ring-indigo-500 h-4 w-4 sm:h-3.5 sm:w-3.5 cursor-pointer"
                              />
                            </div>
                          )}
                          <div className="min-w-0 flex flex-col">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="text-[13px] font-semibold text-[var(--crm-heading)] truncate leading-tight">
                                {client.company}
                              </h3>
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-semibold shrink-0 ${
                                client.status === 'Active'
                                  ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                                  : client.status === 'No Active Project'
                                    ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                    : client.status === 'Project Completed'
                                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                      : 'bg-[var(--crm-sidebar)] text-[var(--crm-text-secondary)] border border-[var(--crm-card-border)]'
                              }`}>
                                {client.status === 'Active' && (
                                  <svg className="w-1.5 h-1.5 fill-blue-600 animate-pulse" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="8" />
                                  </svg>
                                )}
                                {client.status}
                              </span>
                            </div>
                            <p className="text-[10px] text-[var(--crm-text-muted)] truncate flex items-center gap-1 mt-0.5">
                              <span className="font-mono">{getMasterClientId(client)}</span>
                              <span>•</span>
                              <span>{client.name}</span>
                            </p>
                          </div>
                        </div>
                        
                        <button className="text-[var(--crm-text-muted)] hover:text-[var(--crm-heading)] p-2 -mr-1 -mt-1 shrink-0 transition-colors cursor-pointer">
                          <ChevronRight size={16} />
                        </button>
                      </div>

                      {/* Dense Info Grid */}
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[10px] border-t border-[var(--crm-card-border)] pt-1.5 mt-0.5">
                        <div className="flex flex-col min-w-0">
                          <span className="text-[9px] text-[var(--crm-text-muted)] uppercase tracking-wider">Service</span>
                          <span className="text-[var(--crm-text)] font-medium truncate">{client.serviceType || 'Other'}</span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[9px] text-[var(--crm-text-muted)] uppercase tracking-wider">Budget</span>
                          <span className="text-[var(--crm-text)] font-medium font-mono">${(client.totalValue || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[9px] text-[var(--crm-text-muted)] uppercase tracking-wider">Join Date</span>
                          <span className="text-[var(--crm-text)] font-medium truncate">{new Date(client.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[9px] text-[var(--crm-text-muted)] uppercase tracking-wider">Active Work</span>
                          <span className="text-[var(--crm-text)] font-medium truncate">{hasActiveProject ? 'Yes' : 'None'}</span>
                        </div>
                      </div>

                      {/* Optional Socials */}
                      {hasSocials && (
                        <div className="flex items-center justify-start pt-1.5 border-t border-[var(--crm-card-border)] mt-0.5" onClick={(e) => e.stopPropagation()}>
                          <SocialButtons 
                            email={client.email} 
                            instagram={client.instagramLink} 
                            facebook={client.facebookLink}
                            compact={true}
                          />
                        </div>
                      )}
                    </motion.div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-12 text-[var(--crm-text-muted)]">
                  <p className="text-sm">No active clients found matching the filters.</p>
                </div>
              )}
          </div>
      </div>

      {/* Client Edit Modal Overlay */}
      {editingClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--crm-card)] text-[var(--crm-text)] rounded-xl shadow-2xl max-w-xl 2xl:max-w-2xl 3xl:max-w-3xl 4k:max-w-5xl 5k:max-w-6xl w-full border border-[var(--crm-card-border)] overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="p-6 border-b border-[var(--crm-card-border)] flex items-center justify-between">
              <h3 className="font-semibold text-[var(--crm-text)] text-xs uppercase tracking-wider">Edit Client Account</h3>
              <button 
                type="button"
                onClick={() => setEditingClient(null)}
                className="text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] transition-colors p-1"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSaveClientEdit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-[var(--crm-text-muted)] block uppercase tracking-wider">Company Name</label>
                <input
                  type="text"
                  required
                  value={editCompany}
                  onChange={(e) => setEditCompany(e.target.value)}
                  className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-lg px-3.5 py-2 text-xs font-medium text-[var(--crm-text)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-medium text-[var(--crm-text-muted)] block uppercase tracking-wider">Primary Contact Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-lg px-3.5 py-2 text-xs font-medium text-[var(--crm-text)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-[var(--crm-text-muted)] block uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-lg px-3.5 py-2 text-xs font-medium text-[var(--crm-text)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-[var(--crm-text-muted)] block uppercase tracking-wider">Phone Number (Optional)</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-lg px-3.5 py-2 text-xs font-medium text-[var(--crm-text)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-[var(--crm-text-muted)] block uppercase tracking-wider">Active Projects (Auto-Calculated)</label>
                  <div className="w-full bg-[var(--crm-sidebar-active-bg)] border border-[var(--crm-card-border)] rounded-lg px-3.5 py-2 text-xs font-medium text-[var(--crm-text-muted)] select-none">
                    {editProjects}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-[var(--crm-text-muted)] block uppercase tracking-wider">Total Deal Value (Auto-Calculated)</label>
                  <div className="w-full bg-[var(--crm-sidebar-active-bg)] border border-[var(--crm-card-border)] rounded-lg px-3.5 py-2 text-xs font-medium text-[var(--crm-text-muted)] select-none">
                    ${editValue.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-[var(--crm-text-muted)] block uppercase tracking-wider">Account Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as 'Active' | 'Inactive')}
                    className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-lg px-3.5 py-2.5 text-xs font-medium text-[var(--crm-text)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-[var(--crm-text-muted)] block uppercase tracking-wider">Service Type</label>
                  <select
                    value={editServiceType}
                    onChange={(e) => setEditServiceType(e.target.value)}
                    className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-lg px-3.5 py-2.5 text-xs font-medium text-[var(--crm-text)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {PREDEFINED_SERVICES.map(service => (
                      <option key={service} value={service}>{service}</option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Dynamic SMM Fields inside Edit Form */}
              {editServiceType === 'Social Media Management' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/20 animate-in fade-in duration-200">
                  <div className="sm:col-span-3 text-[10px] font-semibold text-indigo-600 border-b border-indigo-500/10 pb-1.5 flex items-center gap-1">
                    <Sliders size={13} className="text-indigo-600" /> Dynamic SMM Configuration
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-[var(--crm-text-muted)] block uppercase tracking-wider">SMM Platform Name</label>
                    <input 
                      type="text" 
                      value={editSmmPlatformName} 
                      onChange={(e) => setEditSmmPlatformName(e.target.value)}
                      placeholder="e.g., Instagram & TikTok"
                      className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-lg px-3 py-1.5 text-xs text-[var(--crm-text)] font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-[var(--crm-text-muted)] block uppercase tracking-wider">Planned Posts</label>
                    <input 
                      type="number" 
                      value={editSmmPlannedPosts} 
                      onChange={(e) => setEditSmmPlannedPosts(Number(e.target.value))}
                      className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-lg px-3 py-1.5 text-xs text-[var(--crm-text)] font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-[var(--crm-text-muted)] block uppercase tracking-wider">Frequency</label>
                    <input 
                      type="text" 
                      value={editSmmPostingFrequency} 
                      onChange={(e) => setEditSmmPostingFrequency(e.target.value)}
                      placeholder="e.g., Daily"
                      className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-lg px-3 py-1.5 text-xs text-[var(--crm-text)] font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="sm:col-span-1.5 space-y-1">
                    <label className="text-[10px] font-medium text-[var(--crm-text-muted)] block uppercase tracking-wider">Content / Theme Notes</label>
                    <textarea 
                      rows={2}
                      value={editSmmContentNotes} 
                      onChange={(e) => setEditSmmContentNotes(e.target.value)}
                      className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-lg px-3 py-1.5 text-xs text-[var(--crm-text)] font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="sm:col-span-1.5 space-y-1">
                    <label className="text-[10px] font-medium text-[var(--crm-text-muted)] block uppercase tracking-wider">Campaign Requirements</label>
                    <textarea 
                      rows={2}
                      value={editSmmCampaignRequirements} 
                      onChange={(e) => setEditSmmCampaignRequirements(e.target.value)}
                      className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-lg px-3 py-1.5 text-xs text-[var(--crm-text)] font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-medium text-[var(--crm-text-muted)] block uppercase tracking-wider">Country Location</label>
                <input
                  type="text"
                  value={editCountry}
                  onChange={(e) => setEditCountry(e.target.value)}
                  placeholder="e.g. United Kingdom"
                  className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-lg px-3.5 py-2 text-xs font-medium text-[var(--crm-text)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-medium text-[var(--crm-text-muted)] block uppercase tracking-wider">Assigned Team Member</label>
                <select
                  value={editAssignedTeamMember}
                  onChange={(e) => setEditAssignedTeamMember(e.target.value)}
                  className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-lg px-3.5 py-2.5 text-xs font-medium text-[var(--crm-text)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">None / Unassigned</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.username} ({u.role})</option>
                  ))}
                </select>
              </div>



              <div className="border-t border-[var(--crm-card-border)] pt-3 mt-2 space-y-3">
                <h5 className="font-medium text-[var(--crm-text-secondary)] text-xs">Social & Profile Links (Optional)</h5>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-[var(--crm-text-muted)] block uppercase tracking-wider">Instagram Profile Link</label>
                  <input
                    type="text"
                    value={editInstagramLink}
                    onChange={(e) => setEditInstagramLink(e.target.value)}
                    placeholder="e.g. instagram.com/username"
                    className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-lg px-3.5 py-2 text-xs font-medium text-[var(--crm-text)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-[var(--crm-text-muted)] block uppercase tracking-wider">Facebook Profile Link</label>
                  <input
                    type="text"
                    value={editFacebookLink}
                    onChange={(e) => setEditFacebookLink(e.target.value)}
                    placeholder="e.g. facebook.com/username"
                    className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-lg px-3.5 py-2 text-xs font-medium text-[var(--crm-text)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-[var(--crm-text-muted)] block uppercase tracking-wider">LinkedIn Link</label>
                    <input
                      type="text"
                      value={editLinkedInLink}
                      onChange={(e) => setEditLinkedInLink(e.target.value)}
                      placeholder="e.g. linkedin.com/in/username"
                      className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-lg px-3.5 py-2 text-xs font-medium text-[var(--crm-text)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-[var(--crm-text-muted)] block uppercase tracking-wider">Website URL</label>
                    <input
                      type="text"
                      value={editWebsiteUrl}
                      onChange={(e) => setEditWebsiteUrl(e.target.value)}
                      placeholder="e.g. www.company.com"
                      className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-lg px-3.5 py-2 text-xs font-medium text-[var(--crm-text)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                {/* Dynamic Custom Links for Edit Client */}
                <div className="p-4 bg-[var(--crm-sidebar)] rounded-xl border border-[var(--crm-card-border)] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h6 className="font-medium text-[var(--crm-text)] text-xs uppercase tracking-wider">Custom Profile Links</h6>
                      <p className="text-[10px] text-[var(--crm-text-muted)]">Add unlimited custom clickable buttons for this client.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingClientCustomLinkId(null);
                        setClientCustomLinkName('');
                        setClientCustomLinkUrl('');
                        setShowClientCustomLinkModal(true);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-medium rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus size={10} /> Add Link
                    </button>
                  </div>

                  {clientCustomLinks.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {clientCustomLinks.map((link) => (
                        <div
                          key={link.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--crm-card)] border border-[var(--crm-card-border)] text-[var(--crm-text)] text-[10px]  rounded-lg shadow-sm"
                        >
                          <span className="truncate max-w-[120px] 2xl:max-w-[240px] 3xl:max-w-[400px] 4k:max-w-none">{link.name}</span>
                      <div className="flex items-center gap-1 border-l border-[var(--crm-card-border)] pl-1.5 ml-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingClientCustomLinkId(link.id);
                                setClientCustomLinkName(link.name);
                                setClientCustomLinkUrl(link.url);
                                setShowClientCustomLinkModal(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-800 p-0.5"
                            >
                              <Edit2 size={10} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setClientCustomLinks(prev => prev.filter(l => l.id !== link.id));
                              }}
                              className="text-rose-600 hover:text-rose-800 p-0.5"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-1 text-[var(--crm-text-muted)] text-[10px] italic">No custom links added yet.</div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-medium text-[var(--crm-text-muted)] block uppercase tracking-wider">Internal Account Notes</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-lg px-3.5 py-2 text-xs font-medium text-[var(--crm-text)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {clientValidationError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2 font-semibold">
                  <AlertCircle size={16} />
                  <span>{clientValidationError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-4 border-t border-[var(--crm-card-border)]">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setEditingClient(null)}
                  className="px-4 py-2 bg-[var(--crm-sidebar-active-bg)] hover:bg-[var(--crm-sidebar-active-bg)]/80 text-[var(--crm-text-secondary)] text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--crm-card)] rounded-xl shadow-2xl border border-[var(--crm-card-border)] max-w-sm w-full overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200 text-[var(--crm-text)]">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-lg">
                  <Trash2 size={24} />
                </div>
                <h3 className="text-base font-semibold tracking-tight">Delete Client Account</h3>
              </div>
              <p className="text-xs text-[var(--crm-subtitle)] leading-relaxed">
                Are you sure you want to permanently delete the client account for <strong className="text-[var(--crm-text)] font-medium">"{clientToDelete.company}"</strong>? This will remove all their details from the database.
              </p>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setClientToDelete(null)}
                  className="px-4 py-2 bg-[var(--crm-sidebar-active-bg)] hover:bg-[var(--crm-sidebar-active-bg)]/80 text-[var(--crm-text-secondary)] text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={async () => {
                    setIsDeleting(true);
                    try {
                      const success = await onDeleteClient(clientToDelete.id);
                      if (success !== false) {
                        setClientToDelete(null);
                      }
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                  className={`px-4 py-2 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer ${isDeleting ? 'bg-rose-400 opacity-70 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700 dark:hover:bg-rose-500'}`}
                >
                  {isDeleting ? "Deleting..." : "Delete Account"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Bulk Delete Confirmation Modal */}
      {showBulkDeleteClientsConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--crm-card)] rounded-xl shadow-2xl border border-[var(--crm-card-border)] max-w-sm w-full overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200 text-[var(--crm-text)]">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-lg">
                  <Trash2 size={24} />
                </div>
                <h3 className="text-base font-semibold tracking-tight">Bulk Delete Clients</h3>
              </div>
              <p className="text-xs text-[var(--crm-subtitle)] leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-[var(--crm-text)] font-medium">{selectedClientIds.length}</strong> selected clients? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkDeleteClientsConfirm(false)}
                  className="px-4 py-2 bg-[var(--crm-sidebar-active-bg)] hover:bg-[var(--crm-sidebar-active-bg)]/80 text-[var(--crm-text-secondary)] text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBulkDeleteClients}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-md shadow-rose-600/10"
                >
                  Delete Selected
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Client Profile Modal Backdrop */}
      <CrmProfileView
        isOpen={!!selectedClientProfile}
        onClose={() => setSelectedClientProfile(null)}
        type="Client"
        data={selectedClientProfile}
        emailDiscussions={emailDiscussions}
        callDiscussions={callDiscussions}
        conversationDiscussions={conversationDiscussions}
        projects={projects}
        teamMembers={teamMembers}
        clients={clients}
        onEdit={() => {
          if (selectedClientProfile) {
            const target = selectedClientProfile;
            setSelectedClientProfile(null);
            handleOpenEditModal(target);
          }
        }}
        onDelete={async (id) => {
          return await onDeleteClient(id);
        }}
      />
      {/* Client Add/Edit Custom Link Modal */}
      {showClientCustomLinkModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--crm-card)] rounded-xl shadow-2xl border border-[var(--crm-card-border)] max-w-sm w-full overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200 text-[var(--crm-text)]">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!clientCustomLinkName.trim() || !clientCustomLinkUrl.trim()) return;
                
                // Validate URL starting with http:// or https://
                let formattedUrl = clientCustomLinkUrl.trim();
                if (!/^https?:\/\//i.test(formattedUrl)) {
                  formattedUrl = 'https://' + formattedUrl;
                }

                if (editingClientCustomLinkId) {
                  setClientCustomLinks(prev => prev.map(l => l.id === editingClientCustomLinkId ? { ...l, name: clientCustomLinkName.trim(), url: formattedUrl } : l));
                } else {
                  setClientCustomLinks(prev => [...prev, { id: 'cl-' + Date.now(), name: clientCustomLinkName.trim(), url: formattedUrl }]);
                }
                setShowClientCustomLinkModal(false);
              }}
              className="p-6 space-y-4"
            >
              <div className="flex items-center gap-3 text-indigo-600">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                  <Plus size={20} />
                </div>
                <h3 className="text-base font-semibold tracking-tight">
                  {editingClientCustomLinkId ? 'Edit Custom Link' : 'Add Custom Link'}
                </h3>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-[var(--crm-text-muted)]   block">Link Name</label>
                  <input
                    type="text"
                    required
                    value={clientCustomLinkName}
                    onChange={(e) => setClientCustomLinkName(e.target.value)}
                    placeholder="e.g., GitHub, Portal, Invoice"
                    className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 font-medium text-[var(--crm-text)]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-[var(--crm-text-muted)]   block">URL</label>
                  <input
                    type="text"
                    required
                    value={clientCustomLinkUrl}
                    onChange={(e) => setClientCustomLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 font-medium text-[var(--crm-text)]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClientCustomLinkModal(false)}
                  className="px-3.5 py-2 bg-[var(--crm-sidebar-active-bg)] hover:bg-[var(--crm-sidebar-active-bg)]/80 text-[var(--crm-text-secondary)] text-xs  rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-md"
                >
                  {editingClientCustomLinkId ? 'Save Link' : 'Add Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Long-Press / Context Action Menu Modal */}
      <AnimatePresence>
        {actionMenuClient && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs" 
            onClick={() => setActionMenuClient(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-2xl shadow-2xl w-80 p-3 space-y-1 text-xs text-[var(--crm-text)] font-sans"
            >
              <div className="px-3 py-2.5 border-b border-[var(--crm-card-border)] flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <span className="font-mono text-[9px] text-[var(--crm-text-muted)] font-bold uppercase tracking-wider block">
                    {getMasterClientId(actionMenuClient)}
                  </span>
                  <h4 className="font-bold text-sm text-[var(--crm-heading)] truncate">
                    {actionMenuClient.name}
                  </h4>
                  {actionMenuClient.company && (
                    <p className="text-[10px] text-[var(--crm-text-muted)] truncate">{actionMenuClient.company}</p>
                  )}
                </div>
                <button 
                  onClick={() => setActionMenuClient(null)} 
                  className="p-1 text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] rounded-lg hover:bg-[var(--crm-sidebar)] transition-colors cursor-pointer shrink-0"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="py-1 space-y-0.5">
                <button 
                  onClick={() => { 
                    const client = actionMenuClient;
                    setActionMenuClient(null); 
                    setSelectedClientProfile(client); 
                  }} 
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-left cursor-pointer transition-colors font-medium"
                >
                  <Eye size={15} className="text-indigo-500 shrink-0" />
                  <div>
                    <span className="block text-xs font-semibold">Open / View Profile</span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400">Inspect detailed client overview</span>
                  </div>
                </button>

                <button 
                  onClick={async () => { 
                    const client = actionMenuClient;
                    setActionMenuClient(null); 
                    await onUpdateClient({
                      ...client,
                      status: 'Active',
                      updatedAt: new Date().toISOString()
                    });
                  }} 
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-left cursor-pointer transition-colors font-medium"
                >
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                  <div>
                    <span className="block text-xs font-semibold">Set Status to Active</span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400">Keep client active in pipeline</span>
                  </div>
                </button>

                <button 
                  onClick={async () => { 
                    const client = actionMenuClient;
                    setActionMenuClient(null); 
                    await onUpdateClient({
                      ...client,
                      status: 'Inactive',
                      updatedAt: new Date().toISOString()
                    });
                  }} 
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-left cursor-pointer transition-colors font-medium"
                >
                  <XCircle size={15} className="text-amber-500 shrink-0" />
                  <div>
                    <span className="block text-xs font-semibold">Set Status to Inactive</span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400">Mark client as inactive</span>
                  </div>
                </button>

                <button 
                  onClick={async () => { 
                    const client = actionMenuClient;
                    setActionMenuClient(null); 
                    await onUpdateClient({
                      ...client,
                      status: 'Archived',
                      updatedAt: new Date().toISOString()
                    });
                  }} 
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-left cursor-pointer transition-colors font-medium"
                >
                  <Archive size={15} className="text-indigo-500 shrink-0" />
                  <div>
                    <span className="block text-xs font-semibold">Archive Client</span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400">Move client to Central Archive</span>
                  </div>
                </button>
              </div>

              <div className="border-t border-[var(--crm-card-border)] pt-1">
                <button 
                  onClick={async () => { 
                    const client = actionMenuClient;
                    setActionMenuClient(null); 
                    if (window.confirm(`Are you sure you want to delete ${client.name}?`)) {
                      await onDeleteClient(client.id);
                    }
                  }} 
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-rose-500/10 text-rose-600 text-left cursor-pointer transition-colors font-medium"
                >
                  <Trash2 size={15} className="text-rose-500 shrink-0" />
                  <div>
                    <span className="block text-xs font-semibold">Delete Client</span>
                    <span className="block text-[10px] text-slate-500 dark:text-slate-400">Permanently remove record</span>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
