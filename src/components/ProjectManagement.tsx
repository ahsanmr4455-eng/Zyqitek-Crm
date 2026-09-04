import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Briefcase, 
  DollarSign, 
  User, 
  Calendar, 
  CheckCircle, 
  Sliders, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  ChevronRight, 
  X, 
  FolderPlus,
  AlertCircle,
  TrendingUp,
  Activity,
  CheckCircle2,
  Clock,
  CreditCard,
  Globe,
  Send,
  Wallet,
  Landmark,
  Coins,
  FileText,
  Download,
  Sparkles,
  Calculator,
  Check,
  ArrowRight,
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  UserCheck,
  LifeBuoy
} from 'lucide-react';
import { Client, TeamMember, Project, ProposalQuotation, PricingCatalog, PaymentDetails, SupportTicket, EmailDiscussion, CallDiscussion, ConversationDiscussion, ClientPaymentRecord } from '../types';
import ProjectTrackingSection from './ProjectTrackingSection';
import SupportTicketsManager from './SupportTicketsManager';
import ProjectReviewsManager from './ProjectReviewsManager';
import TeamPaymentsLedger from './TeamPaymentsLedger';
import ProposalCalculator from './ProposalCalculator';
import { DEFAULT_PRICING_CATALOG } from '../data/defaultPricingCatalog';

const getPaymentPlatformIcon = (platform: string) => {
  const norm = (platform || '').toLowerCase();
  if (norm.includes('sadapay')) return <Wallet size={12} className="text-emerald-500 inline-block align-middle mr-1" />;
  if (norm.includes('payoneer')) return <Coins size={12} className="text-amber-500 inline-block align-middle mr-1" />;
  if (norm.includes('elevate')) return <TrendingUp size={12} className="text-cyan-500 inline-block align-middle mr-1" />;
  if (norm.includes('wise')) return <Globe size={12} className="text-lime-500 inline-block align-middle mr-1" />;
  if (norm.includes('bank') || norm.includes('transfer')) return <Landmark size={12} className="text-[var(--crm-text-secondary)] inline-block align-middle mr-1" />;
  return <DollarSign size={12} className="text-[var(--crm-text-secondary)] inline-block align-middle mr-1" />;
};

const PAYMENT_PLATFORMS = [
  {
    id: 'SadaPay',
    name: 'SadaPay',
    logo: (
      <svg viewBox="0 0 100 100" className="w-6 h-6 select-none shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M34 26C20 34 16 54 26 68C36 82 56 86 70 76C80 68 76 52 66 44C56 36 44 42 38 52" stroke="#16D3B4" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M66 74C80 66 84 46 74 32C64 18 44 14 30 24C20 32 24 48 34 56C44 64 56 58 62 48" stroke="#FF7F63" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    id: 'Payoneer',
    name: 'Payoneer',
    logo: (
      <svg viewBox="0 0 100 100" className="w-6 h-6 select-none shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="payoneerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF4E50" />
            <stop offset="35%" stopColor="#F9D423" />
            <stop offset="70%" stopColor="#20E2D7" />
            <stop offset="100%" stopColor="#B06AB3" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="36" stroke="url(#payoneerGrad)" strokeWidth="12" />
      </svg>
    )
  },
  {
    id: 'Elevate Pay',
    name: 'Elevate Pay',
    logo: (
      <svg viewBox="0 0 100 100" className="w-6 h-6 select-none shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="elevateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0B0947" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
        </defs>
        <rect width="100" height="100" rx="26" fill="url(#elevateGrad)" />
        <path d="M28 66L50 34L72 66" stroke="white" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    id: 'Wise',
    name: 'Wise',
    logo: (
      <svg viewBox="0 0 100 100" className="w-6 h-6 select-none shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="100" rx="26" fill="#96F250" />
        <path d="M 28 64 L 46 36 L 60 36 L 50 51 H 72 L 62 64 H 36" stroke="#003B2F" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    )
  },
  {
    id: 'Bank Transfer',
    name: 'Bank Transfer',
    logo: (
      <svg viewBox="0 0 100 100" className="w-6 h-6 select-none shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bankGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
        </defs>
        <path d="M 18,50 A 32,32 0 0,1 75,23" stroke="url(#bankGrad)" strokeWidth="5.5" strokeLinecap="round" />
        <path d="M 75,23 L 61,22 M 75,23 L 74,37" stroke="url(#bankGrad)" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
        
        <path d="M 82,50 A 32,32 0 0,1 25,77" stroke="url(#bankGrad)" strokeWidth="5.5" strokeLinecap="round" />
        <path d="M 25,77 L 39,78 M 25,77 L 26,63" stroke="url(#bankGrad)" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
        
        <path d="M 32,62 H 68 M 36,62 V 46 M 44,62 V 46 M 52,62 V 46 M 60,62 V 46 M 34,46 H 66 M 50,32 L 32,42 L 68,42 Z" stroke="url(#bankGrad)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    )
  },
  {
    id: 'Other',
    name: 'Other',
    logo: (
      <svg viewBox="0 0 100 100" className="w-6 h-6 select-none shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="otherGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#4F46E5" />
          </linearGradient>
        </defs>
        <rect x="15" y="25" width="70" height="50" rx="12" fill="url(#otherGrad)" />
        <rect x="15" y="35" width="70" height="10" fill="#312E81" opacity="0.3" />
        <rect x="25" y="55" width="12" height="10" rx="3" fill="#E0E7FF" opacity="0.8" />
        <circle cx="63" cy="60" r="8" fill="#E0E7FF" opacity="0.4" />
        <circle cx="71" cy="60" r="8" fill="#E0E7FF" opacity="0.6" />
      </svg>
    )
  }
];

interface ProjectManagementProps {
  clients: Client[];
  teamMembers: TeamMember[];
  projects: Project[];
  onAddProject: (newProject: Omit<Project, 'id'>) => Promise<boolean>;
  onUpdateProject: (updatedProject: Project) => Promise<boolean>;
  onDeleteProject: (projectId: string) => Promise<boolean>;
  filterTeamMemberId?: string;
  proposals?: ProposalQuotation[];
  pricingCatalog?: PricingCatalog;
  onSaveProposal?: (proposal: ProposalQuotation) => Promise<boolean>;
  onDeleteProposal?: (id: string) => Promise<boolean>;
  onConvertProposalToProject?: (proposal: ProposalQuotation) => Promise<void>;
  onUpdatePricingCatalog?: (updatedCatalog: PricingCatalog) => Promise<boolean>;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
  paymentDetails?: PaymentDetails | null;
  supportTickets?: SupportTicket[];
  emailDiscussions?: EmailDiscussion[];
  callDiscussions?: CallDiscussion[];
  conversationDiscussions?: ConversationDiscussion[];
  teamActivity?: any[];
  clientPayments?: ClientPaymentRecord[];
  onAddSupportTicket?: (ticket: Omit<SupportTicket, 'id'>) => Promise<boolean>;
  onUpdateSupportTicket?: (ticket: SupportTicket) => Promise<boolean>;
  onDeleteSupportTicket?: (id: string) => Promise<boolean>;
}

const PROJECT_STATUSES = [
  'Not Started',
  'In Progress',
  'Review',
  'Revision',
  'Completed',
  'Delivered',
  'On Hold',
  'Cancelled'
];

const PROJECT_PREDEFINED_SERVICES = [
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

export default function ProjectManagement({ 
  clients, 
  teamMembers, 
  projects: allProjects, 
  onAddProject, 
  onUpdateProject, 
  onDeleteProject,
  filterTeamMemberId,
  proposals = [],
  pricingCatalog = DEFAULT_PRICING_CATALOG,
  onSaveProposal = async () => true,
  onDeleteProposal = async () => true,
  onConvertProposalToProject = async () => {},
  onUpdatePricingCatalog = async () => true,
  showToast = () => {},
  paymentDetails,
  supportTickets = [],
  emailDiscussions = [],
  callDiscussions = [],
  conversationDiscussions = [],
  teamActivity = [],
  clientPayments = [],
  onAddSupportTicket = async () => true,
  onUpdateSupportTicket = async () => true,
  onDeleteSupportTicket = async () => true
}: ProjectManagementProps) {
  
  // Filter projects if filterTeamMemberId is provided
  const projects = useMemo(() => filterTeamMemberId 
    ? allProjects.filter(p => p.assignedTeamMember === filterTeamMemberId)
    : allProjects, [allProjects, filterTeamMemberId]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [clientFilter, setClientFilter] = useState('All');
  const [serviceFilter, setServiceFilter] = useState('All');
  const [teamMemberFilter, setTeamMemberFilter] = useState('All');
  const [deadlineFilter, setDeadlineFilter] = useState('All');
  const [idSearchQuery, setIdSearchQuery] = useState('');

  // Unified Filter Panel states & drafts
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [draftStatusFilter, setDraftStatusFilter] = useState('All');
  const [draftClientFilter, setDraftClientFilter] = useState('All');
  const [draftServiceFilter, setDraftServiceFilter] = useState('All');
  const [draftTeamMemberFilter, setDraftTeamMemberFilter] = useState('All');
  const [draftDeadlineFilter, setDraftDeadlineFilter] = useState('All');

  const handleToggleFilter = () => {
    if (!isFilterOpen) {
      setDraftStatusFilter(statusFilter);
      setDraftClientFilter(clientFilter);
      setDraftServiceFilter(serviceFilter);
      setDraftTeamMemberFilter(teamMemberFilter);
      setDraftDeadlineFilter(deadlineFilter);
    }
    setIsFilterOpen(!isFilterOpen);
  };

  const handleApplyFilters = () => {
    setStatusFilter(draftStatusFilter);
    setClientFilter(draftClientFilter);
    setServiceFilter(draftServiceFilter);
    setTeamMemberFilter(draftTeamMemberFilter);
    setDeadlineFilter(draftDeadlineFilter);
    setIsFilterOpen(false);
  };

  const handleClearFilters = () => {
    setStatusFilter('All');
    setClientFilter('All');
    setServiceFilter('All');
    setTeamMemberFilter('All');
    setDeadlineFilter('All');

    setDraftStatusFilter('All');
    setDraftClientFilter('All');
    setDraftServiceFilter('All');
    setDraftTeamMemberFilter('All');
    setDraftDeadlineFilter('All');

    setIsFilterOpen(false);
  };

  const activeFiltersCount =
    (statusFilter !== 'All' ? 1 : 0) +
    (clientFilter !== 'All' ? 1 : 0) +
    (serviceFilter !== 'All' ? 1 : 0) +
    (teamMemberFilter !== 'All' ? 1 : 0) +
    (deadlineFilter !== 'All' ? 1 : 0);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [stepClientSearch, setStepClientSearch] = useState('');
  const [stepTeamSearch, setStepTeamSearch] = useState('');
  const [trackingProject, setTrackingProject] = useState<Project | null>(null);
  const [projectSubTab, setProjectSubTab] = useState<'projectTracking' | 'proposals' | 'supportTickets' | 'projectReviews'>('projectTracking');

  // Form fields
  const [projectName, setProjectName] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [budget, setBudget] = useState<number | string>('');
  const [assignedMember, setAssignedMember] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState<Project['status']>('Not Started');
  const [priority, setPriority] = useState<Project['priority']>('Medium');
  const [progress, setProgress] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // New Project Fields
  const [startDate, setStartDate] = useState('');
  const [expectedCompletionDate, setExpectedCompletionDate] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [actualDuration, setActualDuration] = useState('');
  const [newRequirements, setNewRequirements] = useState('');
  const [service, setService] = useState('');
  const [currentStatus, setCurrentStatus] = useState('');

  // Payment details
  const [totalProjectValue, setTotalProjectValue] = useState<number | string>('');
  const [currency, setCurrency] = useState<string>('USD');
  const [advancePayment, setAdvancePayment] = useState<number | string>('');
  const [paymentStatus, setPaymentStatus] = useState<'Pending' | 'Partial' | 'Paid'>('Pending');
  const [paymentPlatform, setPaymentPlatform] = useState<string>('Other');
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);
  const [paymentNotes, setPaymentNotes] = useState('');

  // Searchable states
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [teamSearch, setTeamSearch] = useState('');
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);

  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Consolidated discussions for tracking section
  const consolidatedDiscussions = useMemo(() => [
    ...(emailDiscussions || []).map(d => ({ ...d, type: 'Email' })),
    ...(callDiscussions || []).map(d => ({ ...d, type: 'Call' })),
    ...(conversationDiscussions || []).map(d => ({ ...d, type: 'Conversation' }))
  ], [emailDiscussions, callDiscussions, conversationDiscussions]);

  // Logic for client selection
  React.useEffect(() => {
    if (!selectedClientId) return;
    const client = clients.find(c => c.id === selectedClientId);
    if (!client) return;

    if (!editingProject) {
      if (!projectName) setProjectName(`${client.company || client.name} - New Project`);
      setService(client.serviceType || '');
      setCurrentStatus(client.status || 'Active');
    }
  }, [selectedClientId, clients, editingProject]);

  // Derived filtered team members based on service
  const filteredTeamMembers = useMemo(() => {
    if (!service) return teamMembers;
    return teamMembers.filter(t => (t.service || '').toLowerCase().includes(service.toLowerCase()));
  }, [teamMembers, service]);

  const resetForm = () => {
    setProjectName('');
    setSelectedClientId('');
    setClientSearch('');
    setBudget('');
    setTotalProjectValue('');
    setCurrency('USD');
    setAssignedMember('');
    setSelectedMembers([]);
    setTeamSearch('');
    setDeadline('');
    setStatus('Not Started');
    setPriority('Medium');
    setProgress(0);
    setNotes('');
    setStartDate('');
    setExpectedCompletionDate('');
    setEstimatedDuration('');
    setActualDuration('');
    setNewRequirements('');
    setService('');
    setCurrentStatus('');
    setAdvancePayment('');
    setPaymentStatus('Pending');
    setPaymentPlatform('Other');
    setShowPlatformDropdown(false);
    setPaymentNotes('');
    setValidationError(null);
    setStepClientSearch('');
    setStepTeamSearch('');
  };

  // Multi-select & Long Press Selection System
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggeredForId = useRef<string | null>(null);
  const isTouchDevice = useRef(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedProjectIds.length > 0) {
        setSelectedProjectIds([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProjectIds]);

  const handleToggleSelectProject = (id: string) => {
    if (!id) return;
    setSelectedProjectIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllProjects = (filtered: Project[]) => {
    const filteredIds = filtered.map(p => p.id);
    const allSelected = filteredIds.every(id => selectedProjectIds.includes(id));
    if (allSelected) {
      setSelectedProjectIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedProjectIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const startPress = (id: string) => {
    longPressTriggeredForId.current = null;
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      longPressTriggeredForId.current = id;
      handleToggleSelectProject(id);
    }, 600);
  };

  const cancelPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleRowClick = (id: string, normalClick?: () => void) => {
    if (longPressTriggeredForId.current === id) {
      longPressTriggeredForId.current = null;
      return;
    }
    longPressTriggeredForId.current = null;
    if (selectedProjectIds.length > 0) {
      handleToggleSelectProject(id);
    } else if (normalClick) {
      normalClick();
    }
  };

  const getPressHandlers = (id: string, normalClick?: () => void) => {
    return {
      onMouseDown: () => {
        if (isTouchDevice.current) return;
        startPress(id);
      },
      onMouseUp: () => {
        if (isTouchDevice.current) return;
        cancelPress();
      },
      onMouseLeave: cancelPress,
      onTouchStart: () => {
        isTouchDevice.current = true;
        startPress(id);
      },
      onTouchEnd: cancelPress,
      onTouchMove: cancelPress,
      onClick: () => handleRowClick(id, normalClick)
    };
  };

  const handleExecuteBulkDelete = () => {
    selectedProjectIds.forEach(id => {
      onDeleteProject(id);
    });
    setSelectedProjectIds([]);
    setShowBulkDeleteConfirm(false);
  };

  React.useEffect(() => {
    if (showAddForm || editingProject) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAddForm, editingProject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setValidationError("Project Name is required.");
      return;
    }
    if (!selectedClientId) {
      setValidationError("Please select a Client to assign this project to.");
      return;
    }

    const matchedClient = clients.find(c => c.id === selectedClientId);
    if (!matchedClient) {
      setValidationError("Selected client does not exist.");
      return;
    }

    setValidationError(null);
    setSaving(true);

    const parsedTotal = Number(totalProjectValue || budget || 0);
    const primaryMember = teamMembers.find(t => selectedMembers.includes(t.fullName));

    const projectData = {
      name: projectName.trim(),
      clientId: selectedClientId,
      clientName: matchedClient.company || matchedClient.name,
      service: service.trim() || 'Custom Project',
      totalProjectValue: parsedTotal,
      budget: parsedTotal,
      currency: currency || 'USD',
      assignedTeamMember: selectedMembers.join(', ') || 'Unassigned',
      assignedTeamMemberId: primaryMember ? primaryMember.id : undefined,
      deadline: deadline || expectedCompletionDate || '',
      expectedDeliveryDate: expectedCompletionDate || deadline || '',
      status,
      currentStatus: currentStatus || status,
      projectProgress: Number(progress || 0),
      priority,
      startDate: startDate || '',
      expectedCompletionDate: expectedCompletionDate || '',
      estimatedDuration: estimatedDuration.trim(),
      actualDuration: actualDuration.trim(),
      notes: notes.trim(),
      newRequirements: newRequirements.trim()
    };

    try {
      let success = false;
      if (editingProject) {
        success = await onUpdateProject({
          ...editingProject,
          ...projectData
        });
        if (success) {
          setEditingProject(null);
          resetForm();
        }
      } else {
        success = await onAddProject(projectData);
        if (success) {
          setShowAddForm(false);
          resetForm();
          setProjectSubTab('projectTracking');
        }
      }
    } catch (err) {
      console.error(err);
      setValidationError("An error occurred while saving the project.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (p: Project) => {
    setEditingProject(p);
    setProjectName(p.name);
    setSelectedClientId(p.clientId);
    const matchedClient = clients.find(c => c.id === p.clientId);
    setClientSearch(matchedClient ? (matchedClient.company || matchedClient.name) : '');
    setBudget(p.totalProjectValue ?? p.budget ?? '');
    setTotalProjectValue(p.totalProjectValue ?? p.budget ?? '');
    setCurrency(p.currency || 'USD');
    setAdvancePayment(p.advancePayment ?? '');
    setPaymentStatus(p.paymentStatus ?? 'Pending');
    setPaymentPlatform(p.paymentPlatform ?? 'Other');
    setPaymentNotes(p.paymentNotes ?? '');
    
    const members = p.assignedTeamMember 
      ? p.assignedTeamMember.split(',').map(m => m.trim()).filter(Boolean)
      : [];
    setSelectedMembers(members);
    setTeamSearch('');

    setDeadline(p.deadline || '');
    setStatus(p.status);
    setPriority(p.priority || 'Medium');
    setProgress(p.projectProgress);
    setNotes(p.notes || '');
    setStartDate(p.startDate || '');
    setExpectedCompletionDate(p.expectedCompletionDate || '');
    setEstimatedDuration(p.estimatedDuration || '');
    setActualDuration(p.actualDuration || '');
    setNewRequirements(p.newRequirements || '');
    setService(p.service || '');
    setCurrentStatus(p.currentStatus || p.status);
    setShowAddForm(false);
    setValidationError(null);
  };

  const handleDeleteClick = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      await onDeleteProject(id);
    }
  };

  // Filter projects
  const filteredProjects = projects.filter(p => {
    if (idSearchQuery.trim()) {
      const q = idSearchQuery.trim().toLowerCase();
      if (!p.id.toLowerCase().includes(q)) return false;
    }

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query ||
                          p.name.toLowerCase().includes(query) || 
                          (p.clientName && p.clientName.toLowerCase().includes(query)) ||
                          (p.id && p.id.toLowerCase().includes(query)) ||
                          (p.clientId && p.clientId.toLowerCase().includes(query));
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    const matchesClient = clientFilter === 'All' || p.clientId === clientFilter;

    // Service filter
    let matchesService = true;
    if (serviceFilter !== 'All') {
      const client = clients.find(c => c.id === p.clientId);
      const clientService = client?.serviceType || '';
      const isPredefined = [
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
      ].includes(clientService);

      if (serviceFilter === 'Other') {
        matchesService = !clientService || !isPredefined;
      } else {
        matchesService = clientService === serviceFilter;
      }
    }

    // Team member filter
    let matchesTeamMember = true;
    if (teamMemberFilter !== 'All') {
      matchesTeamMember = p.assignedTeamMember ? p.assignedTeamMember.includes(teamMemberFilter) : false;
    }

    // Deadline filter
    let matchesDeadline = true;
    if (deadlineFilter !== 'All' && p.deadline) {
      const deadlineDate = new Date(p.deadline);
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      if (deadlineFilter === 'Overdue') {
        matchesDeadline = deadlineDate < now && p.status !== 'Completed' && p.status !== 'Delivered';
      } else if (deadlineFilter === 'This Week') {
        const nextWeek = new Date();
        nextWeek.setDate(now.getDate() + 7);
        matchesDeadline = deadlineDate >= now && deadlineDate <= nextWeek;
      } else if (deadlineFilter === 'This Month') {
        matchesDeadline = deadlineDate.getMonth() === now.getMonth() && deadlineDate.getFullYear() === now.getFullYear();
      }
    } else if (deadlineFilter !== 'All' && !p.deadline) {
      matchesDeadline = false;
    }

    return matchesSearch && matchesStatus && matchesClient && matchesService && matchesTeamMember && matchesDeadline;
  });

  return (
    <div className="space-y-6 text-[var(--crm-text)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[30px] sm:text-[32px] font-bold tracking-tight !text-white text-white font-structure leading-[1.2] section-main-heading">Project Management</h1>
          <p className="!text-white text-white text-sm font-normal italic mt-1 section-sub-heading">Track milestones, assign teams, manage budgets, and oversee all customer projects.</p>
        </div>
        {projectSubTab === 'projectTracking' && (
          <div className="flex gap-2.5">
            <button
              onClick={() => {
                resetForm();
                setEditingProject(null);
                setShowAddForm(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10 cursor-pointer"
            >
              <Plus size={16} />
              New Project
            </button>
          </div>
        )}
        {projectSubTab === 'supportTickets' && (
          <div className="flex gap-2.5">
            {/* The "New Ticket" button will be inside SupportTicketsManager to handle its own form state */}
          </div>
        )}
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="bg-[var(--crm-sidebar)] p-1.5 rounded-2xl border border-[var(--crm-card-border)] flex items-center gap-2 sm:gap-3 mb-6 overflow-x-auto no-scrollbar shadow-2xs">
        <button 
          type="button"
          onClick={() => setProjectSubTab('projectTracking')}
          className={`px-5 sm:px-6 py-3 min-h-[46px] rounded-xl text-[15px] transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0 ${
            projectSubTab === 'projectTracking' 
              ? 'bg-[var(--crm-card)] text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200/80 dark:border-indigo-500/30 shadow-xs' 
              : 'text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)] hover:bg-[var(--crm-card)]/60 font-medium'
          }`}
        >
          <Briefcase size={18} className={projectSubTab === 'projectTracking' ? 'text-indigo-600 dark:text-indigo-400 stroke-[2.5]' : 'text-[var(--crm-text-muted)]'} />
          <span>Projects</span>
        </button>

        <button 
          type="button"
          onClick={() => setProjectSubTab('projectReviews')}
          className={`px-5 sm:px-6 py-3 min-h-[46px] rounded-xl text-[15px] transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0 ${
            projectSubTab === 'projectReviews' 
              ? 'bg-[var(--crm-card)] text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200/80 dark:border-indigo-500/30 shadow-xs' 
              : 'text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)] hover:bg-[var(--crm-card)]/60 font-medium'
          }`}
        >
          <TrendingUp size={18} className={projectSubTab === 'projectReviews' ? 'text-indigo-600 dark:text-indigo-400 stroke-[2.5]' : 'text-[var(--crm-text-muted)]'} />
          <span>Project Reviews</span>
        </button>

        <button 
          type="button"
          onClick={() => setProjectSubTab('supportTickets')}
          className={`px-5 sm:px-6 py-3 min-h-[46px] rounded-xl text-[15px] transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0 ${
            projectSubTab === 'supportTickets' 
              ? 'bg-[var(--crm-card)] text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200/80 dark:border-indigo-500/30 shadow-xs' 
              : 'text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)] hover:bg-[var(--crm-card)]/60 font-medium'
          }`}
        >
          <LifeBuoy size={18} className={projectSubTab === 'supportTickets' ? 'text-indigo-600 dark:text-indigo-400 stroke-[2.5]' : 'text-[var(--crm-text-muted)]'} />
          <span>Support Tickets & Maintenance Log</span>
        </button>

        <button 
          type="button"
          onClick={() => setProjectSubTab('proposals')}
          className={`px-5 sm:px-6 py-3 min-h-[46px] rounded-xl text-[15px] transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0 ${
            projectSubTab === 'proposals' 
              ? 'bg-[var(--crm-card)] text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200/80 dark:border-indigo-500/30 shadow-xs' 
              : 'text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)] hover:bg-[var(--crm-card)]/60 font-medium'
          }`}
        >
          <Calculator size={18} className={projectSubTab === 'proposals' ? 'text-indigo-600 dark:text-indigo-400 stroke-[2.5]' : 'text-[var(--crm-text-muted)]'} />
          <span>Proposal & Pricing Calculator</span>
        </button>
      </div>

      {/* Add/Edit Project Form Modal */}
      <AnimatePresence>
        {(showAddForm || editingProject) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                setShowAddForm(false);
                setEditingProject(null);
                resetForm();
              }}
            />
            
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative bg-[var(--crm-card)] w-full max-w-2xl 3xl:max-w-4xl 4k:max-w-5xl 5k:max-w-7xl rounded-xl shadow-2xl overflow-hidden z-10 text-[var(--crm-text)] flex flex-col max-h-[90vh] border border-[var(--crm-card-border)]"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-[var(--crm-card-border)] bg-[var(--crm-sidebar)]">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-indigo-700 text-sm">
                      {editingProject ? `Edit Project: ${editingProject.name}` : 'Create New Project'}
                    </h4>
                    <p className="text-[11px] text-[var(--crm-text-muted)]">
                      {editingProject 
                        ? 'Update project details, milestones, and progress.' 
                        : 'Fill in the details below to initialize a new project workflow.'}
                    </p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingProject(null);
                      resetForm();
                    }}
                    className="text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] p-1.5 rounded-lg hover:bg-[var(--crm-sidebar-active-bg)] transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>


              </div>

              {/* PROJECT INFORMATION FORM */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-[var(--crm-text)] flex-1 overflow-y-auto max-h-[75vh] bg-[var(--crm-card)]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-medium text-[var(--crm-text-secondary)] ">Project Name</label>
                    <input 
                      type="text" required value={projectName} onChange={(e) => setProjectName(e.target.value)}
                      placeholder="e.g. Website Redesign"
                      className="w-full px-3 py-2 border border-[var(--crm-card-border)] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs bg-[var(--crm-card)] text-[var(--crm-text)]"
                    />
                  </div>

                  <div className="space-y-1 relative">
                    <label className="font-medium text-[var(--crm-text-secondary)]  block">Assign to Client</label>
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="Type to search client..."
                        value={clientSearch}
                        onFocus={() => setShowClientDropdown(true)}
                        onChange={(e) => {
                          setClientSearch(e.target.value);
                          if (selectedClientId) {
                            setSelectedClientId('');
                          }
                        }}
                        className="w-full px-3 py-2 border border-[var(--crm-card-border)] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs bg-[var(--crm-card)] text-[var(--crm-text)]"
                      />
                      {clientSearch && (
                        <button
                          type="button"
                          onClick={() => {
                            setClientSearch('');
                            setSelectedClientId('');
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--crm-text-muted)] hover:text-[var(--crm-text-secondary)]"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                    
                    {showClientDropdown && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setShowClientDropdown(false)} />
                        <div className="absolute left-0 right-0 mt-1 bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-lg shadow-lg z-40 max-h-48 overflow-y-auto divide-y divide-[var(--crm-sidebar)]">
                          {clients
                            .filter(c => {
                              const searchLower = clientSearch.toLowerCase();
                              return (c.company || '').toLowerCase().includes(searchLower) || 
                                     (c.name || '').toLowerCase().includes(searchLower);
                            })
                            .map(c => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  setSelectedClientId(c.id);
                                  setClientSearch(c.company || c.name);
                                  setShowClientDropdown(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-[var(--crm-sidebar)] text-xs text-[var(--crm-text)] transition-colors flex flex-col"
                              >
                                <span className="font-medium text-[var(--crm-text)]">{c.company}</span>
                                <span className="text-[10px] text-[var(--crm-text-secondary)]">Contact: {c.name}</span>
                              </button>
                            ))}
                          {clients.filter(c => {
                            const searchLower = clientSearch.toLowerCase();
                            return (c.company || '').toLowerCase().includes(searchLower) || 
                                   (c.name || '').toLowerCase().includes(searchLower);
                          }).length === 0 && (
                            <div className="px-3 py-2 text-xs text-[var(--crm-text-muted)] italic">No clients found</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-[var(--crm-text-secondary)] ">Service Category</label>
                    <select 
                      value={service} 
                      onChange={(e) => setService(e.target.value)}
                      className="w-full px-3 py-2 border border-[var(--crm-card-border)] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs bg-[var(--crm-card)] text-[var(--crm-text)]"
                    >
                      <option value="">Select Service</option>
                      {PROJECT_PREDEFINED_SERVICES.map(svc => (
                        <option key={svc} value={svc}>{svc}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-[var(--crm-text-secondary)] ">Current Status</label>
                    <input 
                      type="text" value={currentStatus} onChange={(e) => setCurrentStatus(e.target.value)}
                      placeholder="e.g. Planning, Design Phase"
                      className="w-full px-3 py-2 border border-[var(--crm-card-border)] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs bg-[var(--crm-card)] text-[var(--crm-text)]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:col-span-2">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="font-medium text-[var(--crm-text-secondary)] ">Total Project Value</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--crm-text-muted)] font-bold text-xs">$</span>
                        <input 
                          type="number" 
                          min="0" 
                          step="any"
                          value={totalProjectValue} 
                          onChange={(e) => {
                            setTotalProjectValue(e.target.value);
                            setBudget(e.target.value);
                          }}
                          placeholder="e.g. 5000"
                          className="w-full pl-7 pr-3 py-2 border border-[var(--crm-card-border)] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs bg-[var(--crm-card)] text-[var(--crm-text)] font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="font-medium text-[var(--crm-text-secondary)] ">Currency</label>
                      <select 
                        value={currency} 
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full px-3 py-2 border border-[var(--crm-card-border)] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs bg-[var(--crm-card)] text-[var(--crm-text)]"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="CAD">CAD ($)</option>
                        <option value="AUD">AUD ($)</option>
                        <option value="PKR">PKR (Rs)</option>
                        <option value="AED">AED (AED)</option>
                      </select>
                    </div>
                  </div>

                  <div className="sm:col-span-2 border-t border-b border-[var(--crm-card-border)] py-3.5 my-1 space-y-3">
                    <h5 className="font-medium text-indigo-700 text-[11px]  ">Project Timeline</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <label className="font-medium text-[var(--crm-text-secondary)] ">Start Date</label>
                        <input 
                          type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                          className="w-full px-3 py-2 border border-[var(--crm-card-border)] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs bg-[var(--crm-card)] text-[var(--crm-text)]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-medium text-[var(--crm-text-secondary)] ">Expected Completion</label>
                        <input 
                          type="date" value={expectedCompletionDate} onChange={(e) => setExpectedCompletionDate(e.target.value)}
                          className="w-full px-3 py-2 border border-[var(--crm-card-border)] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs bg-[var(--crm-card)] text-[var(--crm-text)]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-medium text-[var(--crm-text-secondary)] ">Est. Duration</label>
                        <input 
                          type="text" value={estimatedDuration} onChange={(e) => setEstimatedDuration(e.target.value)}
                          placeholder="e.g. 2 weeks"
                          className="w-full px-3 py-2 border border-[var(--crm-card-border)] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs bg-[var(--crm-card)] text-[var(--crm-text)]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-medium text-[var(--crm-text-secondary)] ">Actual Duration</label>
                        <input 
                          type="text" value={actualDuration} onChange={(e) => setActualDuration(e.target.value)}
                          placeholder="e.g. 12 days"
                          className="w-full px-3 py-2 border border-[var(--crm-card-border)] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs bg-[var(--crm-card)] text-[var(--crm-text)]"
                        />
                      </div>
                    </div>
                  </div>



                    {/* Searchable Team Member Multi-Select Dropdown */}
                    <div className="space-y-1 relative sm:col-span-2">
                      <label className="font-medium text-[var(--crm-text-secondary)]  block">Assigned Team Members</label>
                      
                      {/* Selected members as pills */}
                      <div className="flex flex-wrap gap-1.5 mb-1.5 min-h-[24px]">
                        {selectedMembers.map(name => {
                          const tm = teamMembers.find(t => t.fullName === name);
                          return (
                            <span 
                              key={name}
                              className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 border border-indigo-150 px-2 py-0.5 rounded-lg text-[10px] font-semibold"
                            >
                              <span>{name} {tm ? `(${tm.role})` : ''}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedMembers(prev => prev.filter(m => m !== name));
                                }}
                                className="text-indigo-500 hover:text-indigo-800 focus:outline-none cursor-pointer"
                              >
                                <X size={10} />
                              </button>
                            </span>
                          );
                        })}
                        {selectedMembers.length === 0 && (
                          <span className="text-[11px] text-[var(--crm-text-muted)] italic">No team members selected.</span>
                        )}
                      </div>

                      <div className="relative">
                        <input 
                          type="text"
                          placeholder="Type to search & add team member..."
                          value={teamSearch}
                          onFocus={() => setShowTeamDropdown(true)}
                          onChange={(e) => setTeamSearch(e.target.value)}
                          className="w-full px-3 py-2 border border-[var(--crm-card-border)] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs bg-[var(--crm-card)]"
                        />
                        {teamSearch && (
                          <button
                            type="button"
                            onClick={() => setTeamSearch('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--crm-text-muted)] hover:text-[var(--crm-text-secondary)]"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>

                      {showTeamDropdown && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setShowTeamDropdown(false)} />
                          <div className="absolute left-0 right-0 mt-1 bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-lg shadow-lg z-40 max-h-48 overflow-y-auto divide-y divide-slate-50">
                            {teamMembers
                              .filter(t => {
                                const searchLower = teamSearch.toLowerCase();
                                return t.fullName.toLowerCase().includes(searchLower) || 
                                       t.role.toLowerCase().includes(searchLower);
                              })
                              .map(t => {
                                const isAlreadySelected = selectedMembers.includes(t.fullName);
                                return (
                                  <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => {
                                      if (isAlreadySelected) {
                                        setSelectedMembers(prev => prev.filter(m => m !== t.fullName));
                                      } else {
                                        setSelectedMembers(prev => [...prev, t.fullName]);
                                      }
                                      setTeamSearch('');
                                      setShowTeamDropdown(false);
                                    }}
                                    className="w-full text-left px-3 py-2 hover:bg-indigo-50 dark:bg-indigo-500/10 text-xs transition-colors flex items-center justify-between cursor-pointer"
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-medium text-[var(--crm-text)]">{t.fullName}</span>
                                      <span className="text-[10px] text-[var(--crm-text-muted)]">{t.role}</span>
                                    </div>
                                    {isAlreadySelected && (
                                      <span className="text-indigo-600 font-semibold text-[10px]">Selected</span>
                                    )}
                                  </button>
                                );
                              })}
                            {teamMembers.filter(t => {
                              const searchLower = teamSearch.toLowerCase();
                              return t.fullName.toLowerCase().includes(searchLower) || 
                                     t.role.toLowerCase().includes(searchLower);
                            }).length === 0 && (
                              <div className="px-3 py-2 text-xs text-[var(--crm-text-muted)] italic">No team members found</div>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="font-medium text-[var(--crm-text-secondary)] ">Deadline</label>
                      <input 
                        type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                        className="w-full px-3 py-2 border border-[var(--crm-card-border)] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs bg-[var(--crm-card)]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-medium text-[var(--crm-text-secondary)] ">Status</label>
                      <select 
                        value={status} 
                        onChange={(e) => setStatus(e.target.value as Project['status'])}
                        className="w-full px-3 py-2 border border-[var(--crm-card-border)] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs bg-[var(--crm-card)]"
                      >
                        {PROJECT_STATUSES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-medium text-[var(--crm-text-secondary)] ">Priority</label>
                      <select 
                        value={priority || 'Medium'} 
                        onChange={(e) => setPriority(e.target.value as 'Low' | 'Medium' | 'High')}
                        className="w-full px-3 py-2 border border-[var(--crm-card-border)] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs bg-[var(--crm-card)] text-[var(--crm-text)] cursor-pointer"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>

                    {editingProject && (
                      <div className="sm:col-span-2 space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="font-medium text-[var(--crm-text-secondary)] ">Project Progress ({progress}%)</label>
                          <span className="text-[var(--crm-text-muted)] text-[10px]">
                            {editingProject.tasks && editingProject.tasks.length > 0 ? 'Locked (Driven by tasks)' : 'Adjust progress indicator'}
                          </span>
                        </div>
                        
                        {editingProject.tasks && editingProject.tasks.length > 0 ? (
                          <div className="bg-indigo-50 dark:bg-indigo-500/10 p-2.5 rounded-lg border border-indigo-100 flex items-center gap-2">
                            <Sparkles size={14} className="text-indigo-600" />
                            <p className="text-[10px] text-indigo-700 font-medium leading-tight">
                              This project's progress is automatically calculated based on its <b>{editingProject.tasks.length} linked tasks</b>. 
                              Manage tasks in the Project Tracking view to update progress.
                            </p>
                          </div>
                        ) : (
                          <input 
                            type="range" min="0" max="100" step="5" value={progress} onChange={(e) => setProgress(Number(e.target.value))}
                            className="w-full accent-indigo-600 h-1.5 bg-[var(--crm-sidebar)] rounded-lg cursor-pointer"
                          />
                        )}
                      </div>
                    )}

                    <div className="sm:col-span-2 space-y-1">
                      <label className="font-medium text-[var(--crm-text-secondary)] ">New Requirements / Deliverables</label>
                      <textarea 
                        rows={2}
                        value={newRequirements} 
                        onChange={(e) => setNewRequirements(e.target.value)}
                        placeholder="Specify any new requirements or specific deliverables for this project..."
                        className="w-full px-3 py-2 border border-[var(--crm-card-border)] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs bg-[var(--crm-card)]"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="font-medium text-[var(--crm-text-secondary)] ">Milestones & Notes</label>
                      <textarea 
                        rows={3}
                        value={notes} 
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Describe project details, milestones, sprint tasks, or delivery stipulations..."
                        className="w-full px-3 py-2 border border-[var(--crm-card-border)] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs bg-[var(--crm-card)]"
                      />
                    </div>
                  </div>

                  {validationError && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-700 rounded-lg font-medium flex items-center gap-2">
                      <AlertCircle size={16} />
                      <span>{validationError}</span>
                    </div>
                  )}

                  <div className="border-t border-[var(--crm-card-border)] pt-3 flex justify-end items-center">
                    <div className="flex items-center gap-2">
                      <button 
                        type="button" 
                        onClick={() => {
                          setShowAddForm(false);
                          setEditingProject(null);
                          resetForm();
                        }}
                        className="px-4 py-2 border border-[var(--crm-card-border)] text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar)] rounded-lg  cursor-pointer text-xs"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={saving}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-50 dark:bg-indigo-500/10 text-white font-semibold rounded-lg shadow-md transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-75 text-xs"
                      >
                        {saving ? 'Saving...' : (editingProject ? 'Save Changes' : 'Create Project')}
                      </button>
                    </div>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      {projectSubTab === 'proposals' && (
        <ProposalCalculator
          clients={clients}
          projects={allProjects}
          pricingCatalog={pricingCatalog}
          onSaveProposal={onSaveProposal}
          onDeleteProposal={onDeleteProposal}
          onConvertProposalToProject={onConvertProposalToProject}
          savedProposals={proposals}
          onUpdatePricingCatalog={onUpdatePricingCatalog}
          showToast={showToast}
          paymentDetails={paymentDetails}
        />
      )}

      {projectSubTab === 'supportTickets' && (
        <SupportTicketsManager
          tickets={supportTickets}
          clients={clients}
          projects={allProjects}
          teamMembers={teamMembers}
          onAddTicket={onAddSupportTicket}
          onUpdateTicket={onUpdateSupportTicket}
          onDeleteTicket={onDeleteSupportTicket}
          showToast={showToast}
        />
      )}

      {projectSubTab === 'projectReviews' && (
        <ProjectReviewsManager
          projects={allProjects}
          clients={clients}
          showToast={showToast}
          onUpdateProject={onUpdateProject}
        />
      )}


      {projectSubTab === 'projectTracking' && (
        <>
          {/* Quick Metrics & Project Health */}
          {(() => {
            let onTrack = 0;
            let inProgress = 0;
            let pending = 0;
            let completed = 0;
            let overdue = 0;
            let totalProgress = 0;
            
            const now = new Date();
            
            filteredProjects.forEach(p => {
              const isProjectCompleted = p.status === 'Completed' || p.status === 'Delivered';
              const deadlineDate = p.deadline ? new Date(p.deadline) : null;
              const isProjectOverdue = deadlineDate && !isProjectCompleted && (deadlineDate.getTime() < now.getTime());
              
              if (isProjectCompleted) {
                completed++;
              } else if (isProjectOverdue) {
                overdue++;
              } else if (p.status === 'In Progress' || p.status === 'Active' || p.status === 'Revision') {
                inProgress++;
                const isApproaching = deadlineDate && (deadlineDate.getTime() - now.getTime() < 48 * 60 * 60 * 1000);
                if (!isApproaching) {
                  onTrack++;
                }
              } else if (p.status === 'Not Started' || p.status === 'Review' || p.status === 'On Hold') {
                pending++;
              }
              totalProgress += (p.progress || 0);
            });
            
            const avgProgress = filteredProjects.length > 0 ? Math.round(totalProgress / filteredProjects.length) : 0;
            const totalRevenue = filteredProjects.reduce((sum, p) => sum + Number(p.totalProjectValue || p.budget || 0), 0);
            
            return (
              <div className="space-y-4 mb-4">
                {/* 1. Main Project Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-[var(--crm-card)] p-4 rounded-xl border border-[var(--crm-card-border)] shadow-xs flex flex-col justify-between">
                    <p className="text-[10px] text-[var(--crm-text-muted)] font-bold tracking-wide uppercase mb-1">Total Projects</p>
                    <p className="text-xl font-bold text-[var(--crm-text)]">{filteredProjects.length}</p>
                  </div>
                  <div className="bg-[var(--crm-card)] p-4 rounded-xl border border-[var(--crm-card-border)] shadow-xs flex flex-col justify-between">
                    <p className="text-[10px] text-[var(--crm-text-muted)] font-bold tracking-wide uppercase mb-1">Active Projects</p>
                    <p className="text-xl font-bold text-[var(--crm-text)]">{inProgress}</p>
                  </div>
                  <div className="bg-[var(--crm-card)] p-4 rounded-xl border border-[var(--crm-card-border)] shadow-xs flex flex-col justify-between">
                    <p className="text-[10px] text-[var(--crm-text-muted)] font-bold tracking-wide uppercase mb-1">Completed</p>
                    <p className="text-xl font-bold text-[var(--crm-text)]">{completed}</p>
                  </div>
                  <div className="bg-[var(--crm-card)] p-4 rounded-xl border border-[var(--crm-card-border)] shadow-xs flex flex-col justify-between">
                    <p className="text-[10px] text-[var(--crm-text-muted)] font-bold tracking-wide uppercase mb-1">Total Revenue</p>
                    <p className="text-xl font-bold text-[var(--crm-text)] truncate">${totalRevenue.toLocaleString()}</p>
                  </div>
                </div>

                {/* 2. Project Health */}
                <div className="bg-[var(--crm-card)] p-4 rounded-xl border border-[var(--crm-card-border)] shadow-xs">
                  <h3 className="text-[12px] font-bold uppercase tracking-wider text-[var(--crm-heading)] mb-3">Project Health</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="p-3 bg-[var(--crm-sidebar)] rounded-lg border border-[var(--crm-card-border)] flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[10px] font-semibold text-[var(--crm-text-muted)] uppercase tracking-wider mb-2">
                        <span>On Track</span>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      </div>
                      <div className="text-lg font-bold text-[var(--crm-heading)] leading-none">{onTrack}</div>
                    </div>
                    <div className="p-3 bg-[var(--crm-sidebar)] rounded-lg border border-[var(--crm-card-border)] flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[10px] font-semibold text-[var(--crm-text-muted)] uppercase tracking-wider mb-2">
                        <span>In Progress</span>
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      </div>
                      <div className="text-lg font-bold text-[var(--crm-heading)] leading-none">{inProgress}</div>
                    </div>
                    <div className="p-3 bg-[var(--crm-sidebar)] rounded-lg border border-[var(--crm-card-border)] flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[10px] font-semibold text-[var(--crm-text-muted)] uppercase tracking-wider mb-2">
                        <span>Pending</span>
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      </div>
                      <div className="text-lg font-bold text-[var(--crm-heading)] leading-none">{pending}</div>
                    </div>
                    <div className="p-3 bg-[var(--crm-sidebar)] rounded-lg border border-[var(--crm-card-border)] flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[10px] font-semibold text-[var(--crm-text-muted)] uppercase tracking-wider mb-2">
                        <span>Completed</span>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                      </div>
                      <div className="text-lg font-bold text-[var(--crm-heading)] leading-none">{completed}</div>
                    </div>
                    <div className={`p-3 rounded-lg border flex flex-col justify-between ${overdue > 0 ? 'bg-rose-500/10 border-rose-500/30' : 'bg-[var(--crm-sidebar)] border-[var(--crm-card-border)]'}`}>
                      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider mb-2">
                        <span className={overdue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--crm-text-muted)]'}>Overdue</span>
                        <span className={`h-1.5 w-1.5 rounded-full ${overdue > 0 ? 'bg-rose-500' : 'bg-zinc-400 dark:bg-zinc-600'}`} />
                      </div>
                      <div className={`text-lg font-bold leading-none ${overdue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--crm-heading)]'}`}>
                        {overdue}
                      </div>
                    </div>
                    <div className="p-3 bg-[var(--crm-sidebar)] rounded-lg border border-[var(--crm-card-border)] flex flex-col justify-between">
                      <div className="flex items-center justify-between text-[10px] font-semibold text-[var(--crm-text-muted)] uppercase tracking-wider mb-2">
                        <span>Avg Progress</span>
                        <span className="text-indigo-500 font-bold">%</span>
                      </div>
                      <div className="text-lg font-bold text-[var(--crm-heading)] leading-none">{avgProgress}%</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Filter and Search Bar */}
          <div className="bg-[var(--crm-card)] p-4 rounded-xl border border-[var(--crm-card-border)] shadow-xs flex flex-col md:flex-row gap-3 items-center">
            <div className="flex gap-2 w-full md:flex-1">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--crm-text-secondary)]" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects or clients..."
                  className="w-full pl-9 pr-4 py-2 border border-[var(--crm-card-border)] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs bg-[var(--crm-sidebar)] text-[var(--crm-text)]"
                />
              </div>
              <div className="relative w-48 hidden sm:block">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--crm-text-secondary)]" />
                <input 
                  type="text"
                  value={idSearchQuery}
                  onChange={(e) => setIdSearchQuery(e.target.value)}
                  placeholder="Search ID (PR-1007)..."
                  className="w-full pl-9 pr-4 py-2 border border-[var(--crm-card-border)] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs bg-[var(--crm-sidebar)] text-[var(--crm-text)]"
                />
              </div>
            </div>
            
            <div className="relative">
              <button
                type="button"
                onClick={handleToggleFilter}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer select-none active:scale-95 ${
                  isFilterOpen || activeFiltersCount > 0
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 text-indigo-700 shadow-xs animate-in'
                    : 'bg-[var(--crm-card)] border-[var(--crm-card-border)] text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar)]'
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
                        <span className="font-medium text-[var(--crm-text)] text-xs">Project Filters</span>
                        <button onClick={() => setIsFilterOpen(false)} className="text-[var(--crm-text-muted)] hover:text-[var(--crm-text)]">
                          <X size={14} />
                        </button>
                      </div>

                      <div className="space-y-2">
                        {/* Project Status */}
                        <div className="space-y-1 text-xs">
                          <label className="font-medium text-[var(--crm-text-muted)] block">Project Status</label>
                          <select
                            value={draftStatusFilter}
                            onChange={(e) => setDraftStatusFilter(e.target.value)}
                            className="w-full px-2 py-1.5 bg-[var(--crm-sidebar)] text-[var(--crm-text)] border border-[var(--crm-card-border)] rounded-md outline-hidden text-xs cursor-pointer"
                          >
                            <option value="All">All Statuses</option>
                            {PROJECT_STATUSES.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>

                        {/* Client */}
                        <div className="space-y-1 text-xs">
                          <label className="font-medium text-[var(--crm-text-muted)] block">Client</label>
                          <select
                            value={draftClientFilter}
                            onChange={(e) => setDraftClientFilter(e.target.value)}
                            className="w-full px-2 py-1.5 bg-[var(--crm-sidebar)] text-[var(--crm-text)] border border-[var(--crm-card-border)] rounded-md outline-hidden text-xs cursor-pointer"
                          >
                            <option value="All">All Clients</option>
                            {clients.map(c => (
                              <option key={c.id} value={c.id}>{c.company || c.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Service Type */}
                        <div className="space-y-1 text-xs">
                          <label className="font-medium text-[var(--crm-text-muted)] block">Service Type</label>
                          <select
                            value={draftServiceFilter}
                            onChange={(e) => setDraftServiceFilter(e.target.value)}
                            className="w-full px-2 py-1.5 bg-[var(--crm-sidebar)] text-[var(--crm-text)] border border-[var(--crm-card-border)] rounded-md outline-hidden text-xs cursor-pointer"
                          >
                            <option value="All">All Services</option>
                            {PROJECT_PREDEFINED_SERVICES.map(svc => (
                              <option key={svc} value={svc}>{svc}</option>
                            ))}
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        {/* Team Member */}
                        <div className="space-y-1 text-xs">
                          <label className="font-medium text-[var(--crm-text-muted)] block">Team Member</label>
                          <select
                            value={draftTeamMemberFilter}
                            onChange={(e) => setDraftTeamMemberFilter(e.target.value)}
                            className="w-full px-2 py-1.5 bg-[var(--crm-sidebar)] text-[var(--crm-text)] border border-[var(--crm-card-border)] rounded-md outline-hidden text-xs cursor-pointer"
                          >
                            <option value="All">All Members</option>
                            {teamMembers.map(m => (
                              <option key={m.id} value={m.fullName}>{m.fullName}</option>
                            ))}
                          </select>
                        </div>

                        {/* Deadline filter */}
                        <div className="space-y-1 text-xs">
                          <label className="font-medium text-[var(--crm-text-muted)] block">Deadline</label>
                          <select
                            value={draftDeadlineFilter}
                            onChange={(e) => setDraftDeadlineFilter(e.target.value)}
                            className="w-full px-2 py-1.5 bg-[var(--crm-sidebar)] text-[var(--crm-text)] border border-[var(--crm-card-border)] rounded-md outline-hidden text-xs cursor-pointer"
                          >
                            <option value="All">All Deadlines</option>
                            <option value="Overdue">Overdue</option>
                            <option value="This Week">Due This Week</option>
                            <option value="This Month">Due This Month</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-[var(--crm-card-border)] pt-2.5">
                        <button
                          onClick={handleClearFilters}
                          className="px-2.5 py-1.5 hover:bg-[var(--crm-sidebar)] text-[var(--crm-text-secondary)] text-[11px]  rounded-md transition-colors border border-[var(--crm-card-border)] cursor-pointer"
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
                      className="sm:hidden fixed bottom-0 left-0 right-0 bg-[var(--crm-card)] rounded-t-2xl shadow-2xl p-5 z-50 space-y-4 border-t border-[var(--crm-card-border)]"
                    >
                      <div className="flex items-center justify-between border-b border-[var(--crm-card-border)] pb-2">
                        <span className="font-medium text-[var(--crm-text)] text-sm">Project Filters</span>
                        <button onClick={() => setIsFilterOpen(false)} className="text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] p-1">
                          <X size={18} />
                        </button>
                      </div>

                      <div className="space-y-3">
                        {/* Project Status */}
                        <div className="space-y-1 text-xs">
                          <label className="font-medium text-[var(--crm-text-muted)] block">Project Status</label>
                          <select
                            value={draftStatusFilter}
                            onChange={(e) => setDraftStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 bg-[var(--crm-sidebar)] text-[var(--crm-text)] border border-[var(--crm-card-border)] rounded-lg outline-hidden text-xs cursor-pointer"
                          >
                            <option value="All">All Statuses</option>
                            {PROJECT_STATUSES.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>

                        {/* Client */}
                        <div className="space-y-1 text-xs">
                          <label className="font-medium text-[var(--crm-text-muted)] block">Client</label>
                          <select
                            value={draftClientFilter}
                            onChange={(e) => setDraftClientFilter(e.target.value)}
                            className="w-full px-3 py-2 bg-[var(--crm-sidebar)] text-[var(--crm-text)] border border-[var(--crm-card-border)] rounded-lg outline-hidden text-xs cursor-pointer"
                          >
                            <option value="All">All Clients</option>
                            {clients.map(c => (
                              <option key={c.id} value={c.id}>{c.company || c.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Service Type */}
                        <div className="space-y-1 text-xs">
                          <label className="font-medium text-[var(--crm-text-muted)] block">Service Type</label>
                          <select
                            value={draftServiceFilter}
                            onChange={(e) => setDraftServiceFilter(e.target.value)}
                            className="w-full px-3 py-2 bg-[var(--crm-sidebar)] text-[var(--crm-text)] border border-[var(--crm-card-border)] rounded-lg outline-hidden text-xs cursor-pointer"
                          >
                            <option value="All">All Services</option>
                            {PROJECT_PREDEFINED_SERVICES.map(svc => (
                              <option key={svc} value={svc}>{svc}</option>
                            ))}
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        {/* Team Member */}
                        <div className="space-y-1 text-xs">
                          <label className="font-medium text-[var(--crm-text-muted)] block">Team Member</label>
                          <select
                            value={draftTeamMemberFilter}
                            onChange={(e) => setDraftTeamMemberFilter(e.target.value)}
                            className="w-full px-3 py-2 bg-[var(--crm-sidebar)] text-[var(--crm-text)] border border-[var(--crm-card-border)] rounded-lg outline-hidden text-xs cursor-pointer"
                          >
                            <option value="All">All Members</option>
                            {teamMembers.map(m => (
                              <option key={m.id} value={m.fullName}>{m.fullName}</option>
                            ))}
                          </select>
                        </div>

                        {/* Deadline */}
                        <div className="space-y-1 text-xs">
                          <label className="font-medium text-[var(--crm-text-muted)] block">Deadline</label>
                          <select
                            value={draftDeadlineFilter}
                            onChange={(e) => setDraftDeadlineFilter(e.target.value)}
                            className="w-full px-3 py-2 bg-[var(--crm-sidebar)] text-[var(--crm-text)] border border-[var(--crm-card-border)] rounded-lg outline-hidden text-xs cursor-pointer"
                          >
                            <option value="All">All Deadlines</option>
                            <option value="Overdue">Overdue</option>
                            <option value="This Week">Due This Week</option>
                            <option value="This Month">Due This Month</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-4 border-t border-[var(--crm-card-border)]">
                        <button
                          onClick={handleClearFilters}
                          className="flex-1 py-2.5 bg-[var(--crm-sidebar)] hover:bg-[var(--crm-sidebar-active-bg)] text-[var(--crm-text-secondary)] text-xs  rounded-xl transition-all text-center cursor-pointer"
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

          {/* Bulk Action Bar for Projects */}
          {selectedProjectIds.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 rounded-xl p-3 flex items-center justify-between shadow-xs mb-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <span className="h-5 w-5 bg-amber-600 text-white text-[10px] font-semibold rounded-full flex items-center justify-center shrink-0">
                   {selectedProjectIds.length}
                </span>
                <span className="text-xs font-medium text-amber-950 dark:text-amber-100">projects selected</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Trash2 size={13} /> Delete Selected
                </button>
                <button
                  onClick={() => setSelectedProjectIds([])}
                  className="px-2 py-1 text-xs font-medium text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel (ESC)
                </button>
              </div>
            </div>
          )}

          {/* Projects List Grid */}
          <div className="bg-[var(--crm-card)] rounded-xl border border-[var(--crm-card-border)] shadow-xs overflow-hidden">
            {filteredProjects.length === 0 ? (
              <div className="p-12 text-center text-[var(--crm-text-muted)] space-y-2">
                <Briefcase className="mx-auto text-[var(--crm-text-muted)]/40" size={36} />
                <p className=" text-sm text-[var(--crm-subtitle)]">No projects found matching the criteria.</p>
                <p className="text-xs text-[var(--crm-text-muted)]">Click "New Project" to define and assign a deliverable.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[var(--crm-text-secondary)]">
                  <thead>
                    <tr className="bg-[var(--crm-sidebar)] border-b border-[var(--crm-card-border)] text-[10px] font-medium text-[var(--crm-text-muted)]  ">
                      {selectedProjectIds.length > 0 && (
                        <th className="py-3.5 px-3 w-10 text-center">
                          <input 
                            type="checkbox"
                            checked={filteredProjects.length > 0 && filteredProjects.every(p => selectedProjectIds.includes(p.id))}
                            onChange={() => handleToggleSelectAllProjects(filteredProjects)}
                            className="rounded border-[var(--crm-card-border)] text-amber-600 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer"
                          />
                        </th>
                      )}
                      <th className="py-3.5 px-4">Project Name</th>
                      <th className="py-3.5 px-4">Client</th>
                      <th className="py-3.5 px-4">Budget</th>
                      <th className="py-3.5 px-4">Team Member</th>
                      <th className="py-3.5 px-4">Deadline</th>
                      <th className="py-3.5 px-4">Status & Progress</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--crm-card-border)] text-xs">
                    {filteredProjects.map((p) => {
                      const isSelected = selectedProjectIds.includes(p.id);
                      let statusBg = 'bg-[var(--crm-sidebar)] text-[var(--crm-text-secondary)] border border-[var(--crm-card-border)]';
                      let statusDot = 'bg-slate-400';
                      if (p.status === 'Active') { statusBg = 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 border border-blue-100'; statusDot = 'bg-blue-500'; }
                      else if (p.status === 'In Progress') { statusBg = 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 border border-indigo-100'; statusDot = 'bg-indigo-500'; }
                      else if (p.status === 'Review' || p.status === 'Revision') { statusBg = 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 border border-amber-100'; statusDot = 'bg-amber-500'; }
                      else if (p.status === 'Completed' || p.status === 'Delivered') { statusBg = 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 border border-emerald-100'; statusDot = 'bg-emerald-500'; }
                      else if (p.status === 'On Hold') { statusBg = 'bg-orange-50 dark:bg-orange-500/10 text-orange-700 border border-orange-100'; statusDot = 'bg-orange-500'; }
                      
                      const tasksList = Array.isArray(p.tasks) ? p.tasks : [];
                      const totalTasks = tasksList.length > 0 ? tasksList.length : 10;
                      const completedTasks = tasksList.length > 0
                        ? tasksList.filter((t: any) => t.completed || t.status === 'Completed' || t.status === 'Done').length
                        : Math.min(totalTasks, Math.round(((p.projectProgress || 0) / 100) * totalTasks));
                      const completionPercent = Math.round((completedTasks / Math.max(1, totalTasks)) * 100);

                      const isCompleted = p.status === 'Completed' || p.status === 'Delivered';
                      const now = new Date();
                      const deadlineDate = p.deadline ? new Date(p.deadline) : null;
                      const isUrgent = deadlineDate && !isCompleted && (deadlineDate.getTime() - now.getTime() <= 172800000);
                      const isOverdue = deadlineDate && !isCompleted && (deadlineDate.getTime() < now.getTime());
                      const isDueSoon = isUrgent && !isOverdue;

                      return (
                        <tr 
                          key={p.id} 
                          className={`transition-colors select-none ${isSelected ? 'bg-amber-50/70 dark:bg-amber-500/10 border-l-2 border-l-amber-500' : 'hover:bg-[var(--crm-sidebar)]'}`}
                          {...getPressHandlers(p.id)}
                        >
                          {selectedProjectIds.length > 0 && (
                            <td className="py-4 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <input 
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectProject(p.id)}
                                className="rounded border-[var(--crm-card-border)] text-amber-600 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer"
                              />
                            </td>
                          )}
                          <td className="py-4 px-4 min-w-[200px]">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-[var(--crm-text)]">{p.name}</span>
                              {p.priority && (
                                <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-semibold tracking-wide border ${
                                  p.priority === 'High' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 border-rose-200' :
                                  p.priority === 'Medium' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 border-amber-200' :
                                  'bg-[var(--crm-sidebar)] text-[var(--crm-text-muted)] border-[var(--crm-card-border)]'
                                }`}>
                                  {p.priority}
                                </span>
                              )}
                            </div>
                            {p.notes && <div className="text-[11px] text-[var(--crm-text-muted)] mt-1 max-w-[200px] truncate">{p.notes}</div>}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold text-[10px]">
                                {(p.clientName || 'U').charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-[var(--crm-text-secondary)]">{p.clientName || 'Unassigned'}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-semibold text-[var(--crm-text)] text-sm mb-1.5">
                              ${p.totalProjectValue ? Number(p.totalProjectValue).toLocaleString() : Number(p.budget || 0).toLocaleString()}
                            </div>
                            <div className="flex flex-wrap gap-1.5 items-center">
                              <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-semibold border ${
                                p.paymentStatus === 'Paid' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 border-emerald-100' :
                                p.paymentStatus === 'Partial' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 border-amber-100' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 border-rose-100'
                              }`}>
                                {p.paymentStatus || 'Pending'}
                              </span>
                              <span className="text-[var(--crm-card-border)]">•</span>
                              <span className="inline-flex items-center text-[10px] text-[var(--crm-text-muted)]">
                                {getPaymentPlatformIcon(p.paymentPlatform || 'Other')}
                                <span className="ml-0.5">{p.paymentPlatform || 'Other'}</span>
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2 text-[var(--crm-text-secondary)]">
                              <div className="h-6 w-6 rounded-full bg-[var(--crm-sidebar-active-bg)] border border-[var(--crm-card-border)] flex items-center justify-center">
                                <User size={12} className="text-[var(--crm-text-muted)]" />
                              </div>
                              <span className="text-xs font-medium">{p.assignedTeamMember || 'Unassigned'}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-1.5 text-[var(--crm-text-secondary)] mb-1.5">
                              <Calendar size={13} className={isOverdue ? "text-rose-500" : isDueSoon ? "text-amber-500" : "text-[var(--crm-text-muted)]"} />
                              <span className={isOverdue ? "text-rose-600 font-medium text-xs" : isDueSoon ? "text-amber-600 font-medium text-xs" : "text-xs"}>
                                {p.deadline || 'No deadline'}
                              </span>
                            </div>
                            {isOverdue && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-600 border border-rose-200">
                                <AlertCircle size={10} /> Overdue
                              </span>
                            )}
                            {isDueSoon && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-600 border border-amber-200">
                                <Clock size={10} /> Due Soon
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 min-w-[180px]">
                            <div className="flex justify-between items-center mb-1.5">
                              <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${statusDot}`} />
                                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${statusBg}`}>
                                  {p.status}
                                </span>
                              </div>
                              <span className="text-[10px] font-semibold text-[var(--crm-text)]">{completionPercent}%</span>
                            </div>
                            <div className="w-full bg-[var(--crm-sidebar)] h-1.5 rounded-full overflow-hidden mb-1.5 border border-[var(--crm-card-border)]/50">
                              <motion.div 
                                className="bg-indigo-600 h-full rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${completionPercent}%` }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                              />
                            </div>
                            <div className="flex items-center gap-1 text-[9px] font-medium text-[var(--crm-text-muted)]">
                              <CheckCircle2 size={10} className="text-emerald-500 inline" />
                              Tasks: {completedTasks} / {totalTasks}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button 
                                onClick={() => setTrackingProject(p)}
                                title="View Project Details"
                                className="p-2 hover:bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-[var(--crm-text-muted)] hover:text-indigo-600 transition-colors cursor-pointer"
                              >
                                <Activity size={14} />
                              </button>
                              <button 
                                onClick={() => handleDeleteClick(p.id)}
                                title="Delete Project"
                                className="p-2 hover:bg-rose-50 dark:bg-rose-500/10 rounded-lg text-[var(--crm-text-muted)] hover:text-rose-600 transition-colors cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <AnimatePresence>
        {showBulkDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-[var(--crm-card)] rounded-2xl max-w-md w-full p-6 shadow-xl border border-[var(--crm-card-border)] space-y-4">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-100">
                  <Trash2 size={20} />
                </div>
                <h3 className="text-base font-medium text-[var(--crm-text)]">Confirm Bulk Deletion</h3>
              </div>
              <p className="text-xs text-[var(--crm-subtitle)] leading-relaxed">
                Are you sure you want to permanently delete <strong>{selectedProjectIds.length} selected project{selectedProjectIds.length === 1 ? '' : 's'}</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  className="px-3.5 py-2 text-xs font-medium text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar)] rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteBulkDelete}
                  className="px-3.5 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer shadow-xs shadow-rose-600/20"
                >
                  Delete Projects
                </button>
              </div>
            </div>
          </div>
        )}

        {trackingProject && (
          <ProjectTrackingSection 
            project={trackingProject}
            onClose={() => setTrackingProject(null)}
            onDelete={(projectId) => {
              handleDeleteClick(projectId);
              setTrackingProject(null);
            }}
            onEdit={(p) => {
              handleEditClick(p);
              setTrackingProject(null);
              setShowAddForm(true);
            }}
            teamMembers={teamMembers}
            clientPayments={clientPayments}
            onUpdateProject={async (p) => {
              const success = await onUpdateProject(p);
              if (success) {
                setTrackingProject(p);
              }
              return success;
            }}
            discussions={consolidatedDiscussions}
            teamActivity={teamActivity}
          />
        )}

      </AnimatePresence>
    </div>
  );
}
