import React, { useState, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import { exportToCSV } from '../utils';
import { TaskCheckmark } from './TaskCheckmark';
import { 
  TeamMember, 
  ProjectStatus,
  Client,
  Project
} from '../types';
import { getNextMasterTeamMemberId, getMasterTeamMemberId } from '../lib/clientIdUtils';
import CrmProfileView from './CrmProfileView';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit2, 
  Trash2, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff,
  Users, 
  Mail, 
  Phone, 
  Facebook, 
  Instagram, 
  Linkedin,
  Github,
  Globe,
  Link as LinkIcon,
  Lock,
  Shield,
  Award,
  Sliders,
  MapPin,
  Building2,
  FileText, 
  UserCheck, 
  User,
  UserPlus,
  ChevronDown, 
  ChevronUp, 
  Compass, 
  Bookmark, 
  MessageSquare,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layout,
  DollarSign,
  Archive,
  RefreshCw,
  XCircle,
  Star
} from 'lucide-react';
import TeamWorkloadPlanner from './TeamWorkloadPlanner';
import PreHiringTestingManager from './PreHiringTestingManager';

interface TeamManagerProps {
  defaultSubTab?: 'members' | 'workload' | 'preHiring';
  teamMembers: TeamMember[];
  onAddTeamMember: (member: Omit<TeamMember, 'id' | 'createdAt'>) => void;
  onUpdateTeamMember: (member: TeamMember) => Promise<boolean>;
  onDeleteTeamMember: (id: string) => Promise<boolean>;
  onDeleteMultipleTeamMembers?: (ids: string[]) => void;
  clients: Client[];
  allProjects: Project[];
  allTasks: any[];
  onUpdateProject: (project: Project) => Promise<boolean>;
}

const AGENCY_SERVICES = [
  'Video Editing',
  'Graphic Design',
  'Logo & Brand Identity Design',
  'Website Development',
  'Software Development',
  'SEO',
  'Digital Marketing',
  'Social Media Management',
  'E-commerce Solutions',
  'UGC Ads',
  'AI Automation & Chatbots',
  'Other'
];

const ROLES_OPTIONS = AGENCY_SERVICES;
const SERVICE_OPTIONS = AGENCY_SERVICES;
const EXPERIENCE_LEVELS = ['Junior', 'Mid-Level', 'Senior', 'Expert'] as const;
const EMPLOYMENT_TYPES = ['Full-Time', 'Part-Time', 'Freelance', 'Contract', 'Intern'] as const;
const WORK_MODES = ['Remote', 'Hybrid', 'On-Site'] as const;
const AVAILABILITY_OPTIONS = ['Available', 'Partially Available', 'Unavailable'] as const;
const RECRUITER_SOURCES = ['LinkedIn', 'Referral', 'Website', 'Upwork', 'Fiverr', 'Direct Application', 'Other'] as const;
const PAYMENT_PLATFORMS = ['Bank Transfer', 'Payoneer', 'Wise', 'JazzCash', 'EasyPaisa', 'PayPal', 'Crypto / USDT', 'Other'] as const;
const CURRENCIES = ['USD ($)', 'PKR (Rs)', 'EUR (€)', 'GBP (£)', 'AED (AED)', 'CAD (C$)', 'AUD (A$)', 'Other'] as const;
const STATUS_OPTIONS: ProjectStatus[] = ['Not Started', 'In Progress', 'Review', 'Revision', 'Completed', 'Delivered'];

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

export default function TeamManager({ 
  defaultSubTab = 'members',
  teamMembers, 
  onAddTeamMember, 
  onUpdateTeamMember, 
  onDeleteTeamMember,
  onDeleteMultipleTeamMembers,
  clients,
  allProjects,
  allTasks,
  onUpdateProject
}: TeamManagerProps) {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'members' | 'workload' | 'preHiring'>(defaultSubTab);

  React.useEffect(() => {
    if (defaultSubTab) {
      setActiveTab(defaultSubTab);
    }
  }, [defaultSubTab]);

  // Search & Filtering States
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [serviceFilter, setServiceFilter] = useState<string>('All');
  const [statusActiveFilter, setStatusActiveFilter] = useState<string>('All');
  const [idSearchQuery, setIdSearchQuery] = useState('');

  // New states for Team Member Profile Tabbed View & Reviews
  const [memberProfileTab, setMemberProfileTab] = useState<'overview' | 'projects' | 'reviews' | 'notes'>('overview');
  const [newReviewTitle, setNewReviewTitle] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComments, setNewReviewComments] = useState('');
  const [newReviewDate, setNewReviewDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Context Action Menu State for Team Members
  const [actionMenuMember, setActionMenuMember] = useState<TeamMember | null>(null);
  const memberLongPressTimer = useRef<NodeJS.Timeout | null>(null);
  const memberLongPressTriggered = useRef<string | null>(null);

  const startMemberPress = (member: TeamMember) => {
    memberLongPressTriggered.current = null;
    if (memberLongPressTimer.current) clearTimeout(memberLongPressTimer.current);
    memberLongPressTimer.current = setTimeout(() => {
      memberLongPressTriggered.current = member.id;
      setActionMenuMember(member);
    }, 500);
  };

  const cancelMemberPress = () => {
    if (memberLongPressTimer.current) {
      clearTimeout(memberLongPressTimer.current);
      memberLongPressTimer.current = null;
    }
  };

  const getMemberPressHandlers = (member: TeamMember, normalClick: () => void) => {
    return {
      onMouseDown: (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('a') || target.closest('svg')) return;
        startMemberPress(member);
      },
      onMouseUp: cancelMemberPress,
      onMouseLeave: cancelMemberPress,
      onTouchStart: (e: React.TouchEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('a') || target.closest('svg')) return;
        startMemberPress(member);
      },
      onTouchEnd: cancelMemberPress,
      onTouchMove: cancelMemberPress,
      onContextMenu: (e: React.MouseEvent) => {
        e.preventDefault();
        setActionMenuMember(member);
      },
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (memberLongPressTriggered.current === member.id) {
          memberLongPressTriggered.current = null;
          return;
        }
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('a')) return;
        normalClick();
      }
    };
  };

  // Selection and Long-press system
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [showBulkDeleteMembersConfirm, setShowBulkDeleteMembersConfirm] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggeredForId = useRef<string | null>(null);
  const isTouchDevice = useRef(false);

  // Escape key listener to exit Selection Mode
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedMemberIds.length > 0) {
        setSelectedMemberIds([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMemberIds]);

  const handleToggleSelectMember = (id: string) => {
    if (!id) return;
    setSelectedMemberIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllMembers = (filtered: TeamMember[]) => {
    const filteredIds = filtered.map(m => m.id);
    const allSelected = filteredIds.every(id => selectedMemberIds.includes(id));
    if (allSelected) {
      setSelectedMemberIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedMemberIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const startPress = (id: string) => {
    longPressTriggeredForId.current = null;
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    longPressTimer.current = setTimeout(() => {
      longPressTriggeredForId.current = id;
      handleToggleSelectMember(id);
    }, 600);
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
    if (selectedMemberIds.length > 0) {
      handleToggleSelectMember(id);
    } else {
      normalClick();
    }
  };

  const getPressHandlers = (id: string, normalClick: () => void) => {
    return {
      onMouseDown: () => {
        if (isTouchDevice.current) return;
        startPress(id);
      },
      onMouseUp: () => {
        if (isTouchDevice.current) return;
        cancelPress();
      },
      onMouseLeave: () => {
        if (isTouchDevice.current) return;
        cancelPress();
      },
      onTouchStart: () => {
        isTouchDevice.current = true;
        startPress(id);
      },
      onTouchEnd: () => {
        cancelPress();
      },
      onTouchMove: cancelPress,
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        // Prevent row selection if clicked on standard interactive controls
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('a')) {
          return;
        }
        handleRowClick(id, normalClick);
      }
    };
  };

  const handleDeleteBulkMembers = () => {
    if (selectedMemberIds.length === 0) return;
    setShowBulkDeleteMembersConfirm(true);
  };

  const handleExecuteBulkDeleteMembers = () => {
    if (onDeleteMultipleTeamMembers) {
      onDeleteMultipleTeamMembers(selectedMemberIds);
    }
    setSelectedMemberIds([]);
    setShowBulkDeleteMembersConfirm(false);
  };

  const handleUpdateStatusBulkMembers = (newStatus: ProjectStatus) => {
    selectedMemberIds.forEach(id => {
      const member = teamMembers.find(m => m.id === id);
      if (member) {
        onUpdateTeamMember({
          ...member,
          projectStatus: newStatus
        });
      }
    });
    setSelectedMemberIds([]);
  };
  
  // Sorting States
  const [sortField, setSortField] = useState<keyof TeamMember>('fullName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals & Panels States
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State for Add / Edit
  const [formTeamMemberId, setFormTeamMemberId] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formAvatar, setFormAvatar] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formWhatsapp, setFormWhatsapp] = useState('');
  const [formCnicNumber, setFormCnicNumber] = useState('');
  const [formCountry, setFormCountry] = useState('');
  const [formCity, setFormCity] = useState('');

  // Professional Information
  const [formRole, setFormRole] = useState('Video Editing');
  const [customRoleText, setCustomRoleText] = useState('');
  const [formService, setFormService] = useState('Video Editing');
  const [formPrimarySkill, setFormPrimarySkill] = useState('');
  const [formSecondarySkills, setFormSecondarySkills] = useState('');
  const [formExperienceYears, setFormExperienceYears] = useState<string | number>('');
  const [formExperienceLevel, setFormExperienceLevel] = useState<'Junior' | 'Mid-Level' | 'Senior' | 'Expert'>('Mid-Level');
  const [formBio, setFormBio] = useState('');

  // Portfolio & Links
  const [formPortfolio, setFormPortfolio] = useState('');
  const [formLinkedin, setFormLinkedin] = useState('');
  const [formGithub, setFormGithub] = useState('');
  const [formBehance, setFormBehance] = useState('');
  const [formDribbble, setFormDribbble] = useState('');
  const [formWebsite, setFormWebsite] = useState('');
  const [formFacebook, setFormFacebook] = useState('');
  const [formInstagram, setFormInstagram] = useState('');
  const [formCustomLinks, setFormCustomLinks] = useState<{ id: string; name: string; url: string }[]>([]);
  const [showCustomLinkModal, setShowCustomLinkModal] = useState(false);
  const [customLinkName, setCustomLinkName] = useState('');
  const [customLinkUrl, setCustomLinkUrl] = useState('');
  const [editingCustomLinkId, setEditingCustomLinkId] = useState<string | null>(null);

  // Remote Work Information
  const [formEmploymentType, setFormEmploymentType] = useState<'Full-Time' | 'Part-Time' | 'Freelance' | 'Contract' | 'Intern'>('Full-Time');
  const [formWorkMode, setFormWorkMode] = useState<'Remote' | 'Hybrid' | 'On-Site'>('Remote');
  const [formAvailability, setFormAvailability] = useState<'Available' | 'Partially Available' | 'Unavailable'>('Available');
  const [formTimezone, setFormTimezone] = useState('');
  const [formWorkingHours, setFormWorkingHours] = useState('');

  // Hiring Information
  const [formJoiningDate, setFormJoiningDate] = useState('');
  const [formHiringType, setFormHiringType] = useState('');
  const [formExperienceAtJoining, setFormExperienceAtJoining] = useState('');
  const [formRecruiterSource, setFormRecruiterSource] = useState('LinkedIn');
  const [formResumeLink, setFormResumeLink] = useState('');
  const [formInterviewNotes, setFormInterviewNotes] = useState('');

  // Payment Configuration
  const [formPaymentType, setFormPaymentType] = useState<'Monthly' | 'Project Based' | 'Hourly' | 'Monthly Salary'>('Monthly');
  const [formSalaryRate, setFormSalaryRate] = useState<number | ''>(600);
  const [formCurrency, setFormCurrency] = useState('USD ($)');
  const [formPaymentPlatform, setFormPaymentPlatform] = useState('Bank Transfer');
  const [formAccountHolderName, setFormAccountHolderName] = useState('');
  const [formAccountIdentifier, setFormAccountIdentifier] = useState('');
  const [formPaymentNotes, setFormPaymentNotes] = useState('');

  // Portal Access
  const [formPortalStatus, setFormPortalStatus] = useState<'Active' | 'Disabled' | 'Pending'>('Active');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Documents
  const [formCvDocumentUrl, setFormCvDocumentUrl] = useState('');
  const [formPortfolioDocumentUrl, setFormPortfolioDocumentUrl] = useState('');
  const [formContractDocumentUrl, setFormContractDocumentUrl] = useState('');
  const [formOtherDocumentUrl, setFormOtherDocumentUrl] = useState('');

  // Internal Notes & Status
  const [formInternalNotes, setFormInternalNotes] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');

  // Rating form states
  const [ratingWorkQuality, setRatingWorkQuality] = useState<number>(0);
  const [ratingCommunication, setRatingCommunication] = useState<number>(0);
  const [ratingReliability, setRatingReliability] = useState<number>(0);
  const [ratingTechnicalSkills, setRatingTechnicalSkills] = useState<number>(0);
  const [ratingDeadlineManagement, setRatingDeadlineManagement] = useState<number>(0);
  const [ratingClientHandling, setRatingClientHandling] = useState<number>(0);
  const [ratingTeamwork, setRatingTeamwork] = useState<number>(0);
  const [ratingNotes, setRatingNotes] = useState<string>('');

  // Team Member Interactive Tasks States & Handlers
  const [memberTasks, setMemberTasks] = useState<{ id: string; text: string; completed: boolean; notes?: { id: string; text: string; date: string }[] }[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [activeTaskForNotes, setActiveTaskForNotes] = useState<{ id: string; text: string; completed: boolean; notes?: { id: string; text: string; date: string }[] } | null>(null);
  const [taskNoteInput, setTaskNoteInput] = useState('');

  React.useEffect(() => {
    if (selectedMember) {
      const stored = localStorage.getItem(`tasks_${selectedMember.id}`);
      if (stored) {
        try {
          setMemberTasks(JSON.parse(stored));
        } catch (e) {
          setMemberTasks([]);
        }
      } else {
        const defaultTasks = [
          { id: 't1', text: 'Credentials setup & onboarding', completed: true },
          { id: 't2', text: 'Review project files & deadlines', completed: false },
          { id: 't3', text: 'Push initial core feature branch', completed: false }
        ];
        setMemberTasks(defaultTasks);
        localStorage.setItem(`tasks_${selectedMember.id}`, JSON.stringify(defaultTasks));
      }
    } else {
      setMemberTasks([]);
    }
  }, [selectedMember]);

  React.useEffect(() => {
    const isAnyModalOpen = isAddingNew || !!editingMember || !!selectedMember || !!memberToDelete || showBulkDeleteMembersConfirm || showCustomLinkModal;
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAddingNew, editingMember, selectedMember, memberToDelete, showBulkDeleteMembersConfirm, showCustomLinkModal]);

  const handleAddTask = () => {
    if (!newTaskText.trim() || !selectedMember) return;
    const task = {
      id: `task-${Date.now()}`,
      text: newTaskText.trim(),
      completed: false
    };
    const updated = [...memberTasks, task];
    setMemberTasks(updated);
    localStorage.setItem(`tasks_${selectedMember.id}`, JSON.stringify(updated));
    setNewTaskText('');
  };

  const handleToggleTask = (taskId: string) => {
    if (!selectedMember) return;
    const updated = memberTasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
    setMemberTasks(updated);
    localStorage.setItem(`tasks_${selectedMember.id}`, JSON.stringify(updated));
  };

  const handleDeleteTask = (taskId: string) => {
    if (!selectedMember) return;
    const updated = memberTasks.filter(t => t.id !== taskId);
    setMemberTasks(updated);
    localStorage.setItem(`tasks_${selectedMember.id}`, JSON.stringify(updated));
  };

  const handleAddTaskNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskNoteInput.trim() || !activeTaskForNotes || !selectedMember) return;
    const newNote = {
      id: `note-${Date.now()}`,
      text: taskNoteInput.trim(),
      date: new Date().toISOString()
    };
    const updatedTasks = memberTasks.map(t => {
      if (t.id === activeTaskForNotes.id) {
        const existingNotes = Array.isArray(t.notes) ? t.notes : [];
        return { ...t, notes: [newNote, ...existingNotes] };
      }
      return t;
    });
    setMemberTasks(updatedTasks);
    localStorage.setItem(`tasks_${selectedMember.id}`, JSON.stringify(updatedTasks));
    setActiveTaskForNotes(prev => prev ? { ...prev, notes: [newNote, ...(prev.notes || [])] } : null);
    setTaskNoteInput('');
  };

  // Reset tab selection when team member is changed or opened
  React.useEffect(() => {
    if (selectedMember) {
      setMemberProfileTab('overview');
    }
  }, [selectedMember]);

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !newReviewTitle.trim()) return;
    
    const newReview = {
      id: `rev-${Date.now()}`,
      title: newReviewTitle.trim(),
      date: newReviewDate,
      rating: Number(newReviewRating),
      comments: newReviewComments.trim()
    };
    
    let currentReviews = [];
    if (selectedMember.reviews) {
      try {
        currentReviews = JSON.parse(selectedMember.reviews);
      } catch (err) {
        currentReviews = [];
      }
    }
    
    const updatedReviews = [newReview, ...currentReviews];
    const updatedMember = {
      ...selectedMember,
      reviews: JSON.stringify(updatedReviews)
    };
    
    onUpdateTeamMember(updatedMember);
    setSelectedMember(updatedMember);
    
    // Reset form
    setNewReviewTitle('');
    setNewReviewRating(5);
    setNewReviewComments('');
    setNewReviewDate(new Date().toISOString().split('T')[0]);
  };

  const handleDeleteReview = (reviewId: string) => {
    if (!selectedMember) return;
    
    let currentReviews = [];
    if (selectedMember.reviews) {
      try {
        currentReviews = JSON.parse(selectedMember.reviews);
      } catch (err) {
        currentReviews = [];
      }
    }
    
    const updatedReviews = currentReviews.filter((r: any) => r.id !== reviewId);
    const updatedMember = {
      ...selectedMember,
      reviews: JSON.stringify(updatedReviews)
    };
    
    onUpdateTeamMember(updatedMember);
    setSelectedMember(updatedMember);
  };

  // Dashboard Stats Calculations
  const stats = useMemo(() => {
    const total = teamMembers.length;
    const activeMembersCount = teamMembers.filter(m => (m.status || 'Active') === 'Active').length;
    const assignedProjectsCount = teamMembers.filter(m => m.assignedProjectName && m.assignedProjectName.trim() !== '').length;
    
    let assignedTasksCount = 0;
    teamMembers.forEach(m => {
      const stored = localStorage.getItem(`tasks_${m.id}`);
      if (stored) {
        try {
          assignedTasksCount += JSON.parse(stored).length;
        } catch (e) {}
      } else {
        assignedTasksCount += 3; // Default tasks fallback
      }
    });

    return { 
      total, 
      active: activeMembersCount, 
      assignedProjects: assignedProjectsCount, 
      assignedTasks: assignedTasksCount 
    };
  }, [teamMembers]);

  // Handle Opening Edit Modal
  const openEditModal = (member: TeamMember, e?: React.MouseEvent) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    setEditingMember(member);
    setFormTeamMemberId(member.teamMemberId || getMasterTeamMemberId(member));
    setFormFullName(member.fullName || '');
    setFormAvatar(member.avatar || '');
    setFormEmail(member.email || '');
    setFormPhone(member.phone || '');
    setFormWhatsapp(member.whatsapp || '');
    setFormCnicNumber(member.cnicNumber || '');
    setFormCountry(member.country || '');
    setFormCity(member.city || '');

    const isPredefined = ROLES_OPTIONS.includes(member.role || '');
    if (isPredefined) {
      setFormRole(member.role || 'Other');
      setCustomRoleText('');
    } else {
      setFormRole('Other');
      setCustomRoleText(member.role || '');
    }
    setFormService(member.service || 'Video Editing');
    setFormPrimarySkill(member.primarySkill || '');
    setFormSecondarySkills(member.secondarySkills || '');
    setFormExperienceYears(member.experienceYears !== undefined ? member.experienceYears : '');
    setFormExperienceLevel(member.experienceLevel || 'Mid-Level');
    setFormBio(member.bio || '');

    setFormPortfolio(member.portfolioLink || '');
    setFormLinkedin(member.linkedinLink || '');
    setFormGithub(member.githubLink || '');
    setFormBehance(member.behanceLink || '');
    setFormDribbble(member.dribbbleLink || '');
    setFormWebsite(member.websiteLink || '');
    setFormFacebook(member.facebookLink || '');
    setFormInstagram(member.instagramLink || '');

    let parsedLinks = [];
    if (member.customLinks) {
      try {
        parsedLinks = JSON.parse(member.customLinks);
        parsedLinks = parsedLinks.map((l: any, idx: number) => ({
          id: l.id || `cl-${idx}-${Date.now()}`,
          name: l.name,
          url: l.url
        }));
      } catch (err) {
        console.error("Error parsing custom links", err);
      }
    }
    setFormCustomLinks(parsedLinks);

    setFormEmploymentType(member.employmentType || 'Full-Time');
    setFormWorkMode(member.workMode || 'Remote');
    setFormAvailability(member.availability || 'Available');
    setFormTimezone(member.timezone || '');
    setFormWorkingHours(member.workingHours || '');

    setFormJoiningDate(member.joiningDate || '');
    setFormHiringType(member.hiringType || '');
    setFormExperienceAtJoining(member.experienceAtJoining || '');
    setFormRecruiterSource(member.recruiterSource || 'LinkedIn');
    setFormResumeLink(member.resumeLink || '');
    setFormInterviewNotes(member.interviewNotes || '');

    setFormPaymentType(member.paymentType || 'Monthly');
    const parsedSalary = typeof member.salaryRate === 'number' ? member.salaryRate : (typeof member.monthlySalary === 'number' ? member.monthlySalary : (Number(member.salaryRate || member.monthlySalary) || 600));
    setFormSalaryRate(parsedSalary);
    setFormCurrency(member.currency || 'USD ($)');
    setFormPaymentPlatform(member.paymentPlatform || 'Bank Transfer');
    setFormAccountHolderName(member.accountHolderName || '');
    setFormAccountIdentifier(member.accountIdentifier || '');
    setFormPaymentNotes(member.paymentNotes || '');

    setFormPortalStatus(member.portalStatus || 'Active');
    setFormUsername(member.username || member.email || '');
    setFormPassword(member.password || '');
    setShowPassword(false);

    setFormCvDocumentUrl(member.cvDocumentUrl || '');
    setFormPortfolioDocumentUrl(member.portfolioDocumentUrl || '');
    setFormContractDocumentUrl(member.contractDocumentUrl || '');
    setFormOtherDocumentUrl(member.otherDocumentUrl || '');

    setFormInternalNotes(member.internalNotes || '');
    setFormNotes(member.notes || '');
    setFormStatus((member.status as 'Active' | 'Inactive') || 'Active');

    // Load rating fields
    setRatingWorkQuality(member.ratingCategories?.workQuality || 0);
    setRatingCommunication(member.ratingCategories?.communication || 0);
    setRatingReliability(member.ratingCategories?.reliability || 0);
    setRatingTechnicalSkills(member.ratingCategories?.technicalSkills || 0);
    setRatingDeadlineManagement(member.ratingCategories?.deadlineManagement || 0);
    setRatingClientHandling(member.ratingCategories?.clientHandling || 0);
    setRatingTeamwork(member.ratingCategories?.teamwork || 0);
    setRatingNotes(member.ratingNotes || '');

    setIsAddingNew(false);
  };

  // Handle Opening Add Modal
  const openAddModal = () => {
    setEditingMember(null);
    setFormTeamMemberId(getNextMasterTeamMemberId(teamMembers));
    setFormFullName('');
    setFormAvatar('');
    setFormEmail('');
    setFormPhone('');
    setFormWhatsapp('');
    setFormCnicNumber('');
    setFormCountry('');
    setFormCity('');

    setFormRole('Video Editing');
    setCustomRoleText('');
    setFormService('Video Editing');
    setFormPrimarySkill('');
    setFormSecondarySkills('');
    setFormExperienceYears('');
    setFormExperienceLevel('Mid-Level');
    setFormBio('');

    setFormPortfolio('');
    setFormLinkedin('');
    setFormGithub('');
    setFormBehance('');
    setFormDribbble('');
    setFormWebsite('');
    setFormFacebook('');
    setFormInstagram('');
    setFormCustomLinks([]);

    setFormEmploymentType('Full-Time');
    setFormWorkMode('Remote');
    setFormAvailability('Available');
    setFormTimezone('');
    setFormWorkingHours('');

    setFormJoiningDate('');
    setFormHiringType('');
    setFormExperienceAtJoining('');
    setFormRecruiterSource('LinkedIn');
    setFormResumeLink('');
    setFormInterviewNotes('');

    setFormPaymentType('Monthly');
    setFormSalaryRate(600);
    setFormCurrency('USD ($)');
    setFormPaymentPlatform('Bank Transfer');
    setFormAccountHolderName('');
    setFormAccountIdentifier('');
    setFormPaymentNotes('');

    setFormPortalStatus('Active');
    setFormUsername('');
    setFormPassword('');
    setShowPassword(false);

    setFormCvDocumentUrl('');
    setFormPortfolioDocumentUrl('');
    setFormContractDocumentUrl('');
    setFormOtherDocumentUrl('');

    setFormInternalNotes('');
    setFormNotes('');
    setFormStatus('Active');

    // Reset rating fields
    setRatingWorkQuality(0);
    setRatingCommunication(0);
    setRatingReliability(0);
    setRatingTechnicalSkills(0);
    setRatingDeadlineManagement(0);
    setRatingClientHandling(0);
    setRatingTeamwork(0);
    setRatingNotes('');

    setIsAddingNew(true);
  };

  // Submit Add / Edit Form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFullName.trim()) return;
    setIsSaving(true);

    const actualRole = formRole === 'Other' ? customRoleText.trim() || 'Other' : formRole;

    // Calculate rating and history
    const ratingVals = [
      ratingWorkQuality,
      ratingCommunication,
      ratingReliability,
      ratingTechnicalSkills,
      ratingDeadlineManagement,
      ratingClientHandling,
      ratingTeamwork
    ].filter(r => r > 0);
    
    const calculatedOverallRating = ratingVals.length > 0 
      ? Number((ratingVals.reduce((sum, v) => sum + v, 0) / ratingVals.length).toFixed(1))
      : 0;

    const ratingCategoriesObj = {
      workQuality: ratingWorkQuality || undefined,
      communication: ratingCommunication || undefined,
      reliability: ratingReliability || undefined,
      technicalSkills: ratingTechnicalSkills || undefined,
      deadlineManagement: ratingDeadlineManagement || undefined,
      clientHandling: ratingClientHandling || undefined,
      teamwork: ratingTeamwork || undefined,
    };

    const ratingHasChanged = editingMember ? (
      ratingWorkQuality !== (editingMember.ratingCategories?.workQuality || 0) ||
      ratingCommunication !== (editingMember.ratingCategories?.communication || 0) ||
      ratingReliability !== (editingMember.ratingCategories?.reliability || 0) ||
      ratingTechnicalSkills !== (editingMember.ratingCategories?.technicalSkills || 0) ||
      ratingDeadlineManagement !== (editingMember.ratingCategories?.deadlineManagement || 0) ||
      ratingClientHandling !== (editingMember.ratingCategories?.clientHandling || 0) ||
      ratingTeamwork !== (editingMember.ratingCategories?.teamwork || 0) ||
      ratingNotes !== (editingMember.ratingNotes || '')
    ) : (
      ratingWorkQuality > 0 ||
      ratingCommunication > 0 ||
      ratingReliability > 0 ||
      ratingTechnicalSkills > 0 ||
      ratingDeadlineManagement > 0 ||
      ratingClientHandling > 0 ||
      ratingTeamwork > 0 ||
      ratingNotes !== ''
    );

    let updatedHistory = editingMember?.ratingHistory || [];
    if (ratingHasChanged && calculatedOverallRating > 0) {
      const newHistoryEntry = {
        id: `rh-${Date.now()}`,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
        overallRating: calculatedOverallRating,
        categoryRatings: { ...ratingCategoriesObj },
        reviewer: 'Admin',
        notes: ratingNotes.trim() || undefined
      };
      updatedHistory = [newHistoryEntry, ...updatedHistory];
    }

    const data: Partial<TeamMember> = {
      teamMemberId: formTeamMemberId || (editingMember ? getMasterTeamMemberId(editingMember) : getNextMasterTeamMemberId(teamMembers)),
      fullName: formFullName.trim(),
      avatar: formAvatar,
      email: formEmail.trim(),
      phone: formPhone.trim(),
      whatsapp: formWhatsapp.trim(),
      cnicNumber: formCnicNumber.trim(),
      country: formCountry.trim(),
      city: formCity.trim(),

      role: actualRole,
      service: formService,
      primarySkill: formPrimarySkill.trim(),
      secondarySkills: formSecondarySkills.trim(),
      experienceYears: formExperienceYears,
      experienceLevel: formExperienceLevel,
      bio: formBio.trim(),

      portfolioLink: formPortfolio.trim(),
      linkedinLink: formLinkedin.trim(),
      githubLink: formGithub.trim(),
      behanceLink: formBehance.trim(),
      dribbbleLink: formDribbble.trim(),
      websiteLink: formWebsite.trim(),
      facebookLink: formFacebook.trim(),
      instagramLink: formInstagram.trim(),
      customLinks: JSON.stringify(formCustomLinks),

      employmentType: formEmploymentType,
      workMode: formWorkMode,
      availability: formAvailability,
      timezone: formTimezone.trim(),
      workingHours: formWorkingHours.trim(),

      joiningDate: formJoiningDate,
      hiringType: formHiringType.trim(),
      experienceAtJoining: formExperienceAtJoining.trim(),
      recruiterSource: formRecruiterSource,
      resumeLink: formResumeLink.trim(),
      interviewNotes: formInterviewNotes.trim(),

      paymentType: formPaymentType,
      salaryRate: formSalaryRate !== '' ? Number(formSalaryRate) : 0,
      currency: formCurrency,
      paymentPlatform: formPaymentPlatform,
      accountHolderName: formAccountHolderName.trim(),
      accountIdentifier: formAccountIdentifier.trim(),
      paymentNotes: formPaymentNotes.trim(),
      monthlySalary: formPaymentType === 'Monthly' || formPaymentType === 'Monthly Salary' ? (formSalaryRate !== '' ? Number(formSalaryRate) : 0) : undefined,

      portalStatus: formPortalStatus,
      username: formUsername.trim() || formEmail.trim(),
      password: formPassword || (editingMember ? editingMember.password : ''),

      cvDocumentUrl: formCvDocumentUrl.trim(),
      portfolioDocumentUrl: formPortfolioDocumentUrl.trim(),
      contractDocumentUrl: formContractDocumentUrl.trim(),
      otherDocumentUrl: formOtherDocumentUrl.trim(),

      internalNotes: formInternalNotes.trim(),
      notes: formNotes.trim(),
      status: formStatus,

      currentRating: calculatedOverallRating || undefined,
      ratingCategories: calculatedOverallRating > 0 ? ratingCategoriesObj : undefined,
      ratingNotes: ratingNotes.trim() || undefined,
      ratingUpdatedAt: ratingHasChanged && calculatedOverallRating > 0 ? new Date().toISOString() : (editingMember?.ratingUpdatedAt || undefined),
      ratingHistory: updatedHistory
    };

    try {
      if (editingMember) {
        const updatedMember = {
          ...editingMember,
          ...data
        };
        await onUpdateTeamMember(updatedMember);
        if (selectedMember && selectedMember.id === editingMember.id) {
          setSelectedMember(updatedMember);
        }
      } else {
        await onAddTeamMember({
          ...data
        } as Omit<TeamMember, 'id' | 'createdAt'>);
      }

      setEditingMember(null);
      setIsAddingNew(false);
    } catch (err) {
      console.error("Error saving team member profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Sort function
  const handleSort = (field: keyof TeamMember) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter & Search & Sort logic
  const filteredAndSortedMembers = useMemo(() => {
    let list = teamMembers.filter(m => (m.status || 'Active') !== 'Archived');

    if (idSearchQuery.trim()) {
      const q = idSearchQuery.trim().toLowerCase();
      list = list.filter(m => m.id.toLowerCase().includes(q));
    }

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(m => 
        m.fullName.toLowerCase().includes(term) ||
        m.email.toLowerCase().includes(term) ||
        m.assignedProjectName.toLowerCase().includes(term) ||
        m.clientName.toLowerCase().includes(term) ||
        m.role.toLowerCase().includes(term)
      );
    }

    // Role Filter
    if (roleFilter !== 'All') {
      if (roleFilter === 'Other') {
        list = list.filter(m => !ROLES_OPTIONS.includes(m.role));
      } else {
        list = list.filter(m => m.role === roleFilter);
      }
    }

    // Service Filter
    if (serviceFilter !== 'All') {
      list = list.filter(m => m.service === serviceFilter);
    }

    // Status Filter (Active / Inactive)
    if (statusActiveFilter !== 'All') {
      list = list.filter(m => (m.status || 'Active') === statusActiveFilter);
    }

    // Sorting logic
    list.sort((a, b) => {
      let aVal: any = a[sortField] ?? '';
      let bVal: any = b[sortField] ?? '';

      if (sortField === 'createdAt') {
        aVal = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        bVal = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      } else if (typeof aVal === 'string') {
        aVal = (aVal as string).toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [teamMembers, searchTerm, roleFilter, serviceFilter, statusActiveFilter, sortField, sortDirection]);

  // Paginated list
  const paginatedMembers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedMembers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedMembers, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedMembers.length / itemsPerPage) || 1;

  // Status Badge Helper
  const getStatusBadgeClass = (status: ProjectStatus) => {
    switch (status) {
      case 'Not Started':
        return 'bg-[var(--crm-sidebar)] text-[var(--crm-text)] border-[var(--crm-card-border)]';
      case 'In Progress':
        return 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20';
      case 'Review':
        return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20';
      case 'Revision':
        return 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/20';
      case 'Completed':
        return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20';
      case 'Delivered':
        return 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-500/20';
      default:
        return 'bg-[var(--crm-sidebar)] text-[var(--crm-text)] border-[var(--crm-card-border)]';
    }
  };

  // Helper functions for member projects and tasks
  const getMemberProjectCount = (member: TeamMember) => {
    let count = 0;
    if (member.assignedProjectName && member.assignedProjectName.trim() !== '') {
      count++;
    }
    if (allProjects && allProjects.length > 0) {
      const matchingProjects = allProjects.filter(p => 
        p.assignedTeamMemberId === member.id ||
        p.assignedTeamMember === member.fullName ||
        (p as any).assignedDeveloperId === member.id ||
        (p as any).teamMemberId === member.id
      );
      count = Math.max(count, matchingProjects.length);
    }
    return count > 0 ? `${count} ${count === 1 ? 'Project' : 'Projects'}` : 'No assigned projects';
  };

  const getMemberTaskCount = (member: TeamMember) => {
    let taskCount = 0;
    const stored = localStorage.getItem(`tasks_${member.id}`);
    if (stored) {
      try {
        taskCount = JSON.parse(stored).length;
      } catch (e) {}
    }
    if (allTasks && allTasks.length > 0) {
      const matchingTasks = allTasks.filter(t => 
        t.assignedTo === member.fullName || 
        t.assignedTo === member.id ||
        t.teamMemberId === member.id
      );
      taskCount = Math.max(taskCount, matchingTasks.length);
    }
    return taskCount > 0 ? `${taskCount} ${taskCount === 1 ? 'Task' : 'Tasks'}` : 'No assigned tasks';
  };

  return (
    <div id="team-management-module" className="space-y-6 text-[var(--crm-text)] select-none pb-12">
      
      {/* 1. Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[30px] sm:text-[32px] font-bold tracking-tight text-[var(--crm-heading)] font-structure leading-[1.2] section-main-heading">
            Team Management
          </h1>
          <p className="text-[var(--crm-subtitle)] text-sm font-normal italic mt-1 section-sub-heading">
            Manage your team members, workload, assignments, and capacity.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'members' && (
            <button 
              id="btn-add-team-member"
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-[13px] font-semibold rounded-xl transition-all cursor-pointer shadow-md active:scale-98"
            >
              <Plus size={16} /> <span>Add Team Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Tab Navigation */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[var(--crm-sidebar)] rounded-2xl w-fit border border-[var(--crm-card-border)] shadow-xs">
        <button
          onClick={() => setActiveTab('members')}
          className={`px-5 py-2 text-[13px] font-medium rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'members' 
              ? 'bg-[var(--crm-card)] text-[#4F46E5] dark:text-indigo-400 font-semibold shadow-xs' 
              : 'text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)]'
          }`}
        >
          <Users size={16} />
          <span>Team Members</span>
        </button>

        <button
          onClick={() => setActiveTab('preHiring')}
          className={`px-5 py-2 text-[13px] font-medium rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'preHiring' 
              ? 'bg-[var(--crm-card)] text-[#4F46E5] dark:text-indigo-400 font-semibold shadow-xs' 
              : 'text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)]'
          }`}
        >
          <UserPlus size={16} />
          <span>Team Hiring / Recruitment</span>
        </button>

        <button
          onClick={() => setActiveTab('workload')}
          className={`px-5 py-2 text-[13px] font-medium rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'workload' 
              ? 'bg-[var(--crm-card)] text-[#4F46E5] dark:text-indigo-400 font-semibold shadow-xs' 
              : 'text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)]'
          }`}
        >
          <Compass size={16} />
          <span>Team Workload & Capacity Planner</span>
        </button>
      </div>

      {activeTab === 'workload' ? (
        <TeamWorkloadPlanner 
          teamMembers={teamMembers}
          clients={clients}
          projects={allProjects}
          tasks={allTasks}
          onUpdateTeamMember={onUpdateTeamMember}
          onUpdateProject={onUpdateProject}
          onOpenProfile={(member) => setSelectedMember(member)}
        />
      ) : activeTab === 'preHiring' ? (
        <PreHiringTestingManager />
      ) : (
        <>
          {/* 2. Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 4k:grid-cols-8 5k:grid-cols-12 gap-5">
            {/* Total Members */}
            <div className="bg-[var(--crm-card)] rounded-[20px] p-5 sm:p-6 border border-[var(--crm-card-border)] flex items-center gap-4 shadow-xs">
              <div className="h-12 w-12 rounded-[14px] bg-[var(--crm-sidebar)] text-[var(--crm-text)] border border-[var(--crm-card-border)] flex items-center justify-center shrink-0 shadow-xs">
                <Users size={22} className="text-[var(--crm-text-secondary)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-[var(--crm-text-muted)] uppercase tracking-wider mb-1">
                  TOTAL MEMBERS
                </p>
                <p className="text-3xl font-extrabold text-[var(--crm-text)] leading-none">
                  {stats.total}
                </p>
              </div>
            </div>

            {/* Active Members */}
            <div className="bg-[var(--crm-card)] rounded-[20px] p-5 sm:p-6 border border-[var(--crm-card-border)] flex items-center gap-4 shadow-xs">
              <div className="h-12 w-12 rounded-[14px] bg-[var(--crm-sidebar)] text-[#10B981] border border-[var(--crm-card-border)] flex items-center justify-center shrink-0 shadow-xs">
                <UserCheck size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-[var(--crm-text-muted)] uppercase tracking-wider mb-1">
                  ACTIVE MEMBERS
                </p>
                <p className="text-3xl font-extrabold text-[var(--crm-text)] leading-none">
                  {stats.active}
                </p>
              </div>
            </div>

            {/* Assigned Projects */}
            <div className="bg-[var(--crm-card)] rounded-[20px] p-5 sm:p-6 border border-[var(--crm-card-border)] flex items-center gap-4 shadow-xs">
              <div className="h-12 w-12 rounded-[14px] bg-[var(--crm-sidebar)] text-[#4F46E5] dark:text-indigo-400 border border-[var(--crm-card-border)] flex items-center justify-center shrink-0 shadow-xs">
                <Briefcase size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-[var(--crm-text-muted)] uppercase tracking-wider mb-1">
                  ASSIGNED PROJECTS
                </p>
                <p className="text-3xl font-extrabold text-[var(--crm-text)] leading-none">
                  {stats.assignedProjects}
                </p>
              </div>
            </div>

            {/* Assigned Tasks */}
            <div className="bg-[var(--crm-card)] rounded-[20px] p-5 sm:p-6 border border-[var(--crm-card-border)] flex items-center gap-4 shadow-xs">
              <div className="h-12 w-12 rounded-[14px] bg-[var(--crm-sidebar)] text-[#F97316] border border-[var(--crm-card-border)] flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-[var(--crm-text-muted)] uppercase tracking-wider mb-1">
                  ASSIGNED TASKS
                </p>
                <p className="text-3xl font-extrabold text-[var(--crm-text)] leading-none">
                  {stats.assignedTasks}
                </p>
              </div>
            </div>
          </div>

          {/* 3. Main Team Members Container */}
          <div className="mt-6">
            
            {/* Filter & Search Bar Container matching Screenshot */}
            <div className="mb-6 bg-[var(--crm-card)] rounded-[18px] p-3 sm:p-4 border border-[var(--crm-card-border)] flex flex-wrap gap-4 items-center justify-between shadow-xs">
              
              {/* Search Box */}
              <div className="relative flex-1 min-w-[240px] max-w-[340px] 2xl:max-w-[500px] 3xl:max-w-[800px] 4k:max-w-none">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--crm-text-muted)]">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  placeholder="Search team"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-10 bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] focus:border-[#4F46E5] text-[13px] text-[var(--crm-text)] rounded-xl pl-10 pr-4 focus:outline-none transition-all placeholder-[var(--crm-text-muted)] font-medium shadow-xs"
                />
              </div>

              {/* Quick Filters Group */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Role Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[var(--crm-text-muted)] uppercase tracking-widest">ROLE:</span>
                  <select
                    value={roleFilter}
                    onChange={(e) => {
                      setRoleFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="h-10 bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] focus:border-[#4F46E5] text-[13px] text-[var(--crm-text)] rounded-xl px-3 focus:outline-none font-medium min-w-[140px] shadow-xs cursor-pointer"
                  >
                    <option value="All">All Roles</option>
                    {ROLES_OPTIONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* Service Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[var(--crm-text-muted)] uppercase tracking-widest">SERVICE:</span>
                  <select
                    value={serviceFilter}
                    onChange={(e) => {
                      setServiceFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="h-10 bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] focus:border-[#4F46E5] text-[13px] text-[var(--crm-text)] rounded-xl px-3 focus:outline-none font-medium min-w-[140px] shadow-xs cursor-pointer"
                  >
                    <option value="All">All Services</option>
                    {SERVICE_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[var(--crm-text-muted)] uppercase tracking-widest">STATUS:</span>
                  <select
                    value={statusActiveFilter}
                    onChange={(e) => {
                      setStatusActiveFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="h-10 bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] focus:border-[#4F46E5] text-[13px] text-[var(--crm-text)] rounded-xl px-3 focus:outline-none font-medium min-w-[120px] shadow-xs cursor-pointer"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                {/* Sort Control */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[var(--crm-text-muted)] uppercase tracking-widest">SORT:</span>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={sortField as string}
                      onChange={(e) => {
                        setSortField(e.target.value as keyof TeamMember);
                        setCurrentPage(1);
                      }}
                      className="h-10 bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] focus:border-[#4F46E5] text-[13px] text-[var(--crm-text)] rounded-xl px-3 focus:outline-none font-medium min-w-[130px] shadow-xs cursor-pointer"
                    >
                      <option value="fullName">Full Name</option>
                      <option value="role">Role</option>
                      <option value="createdAt">Date Created</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                      className="h-10 w-10 bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] hover:border-[#4F46E5] text-[var(--crm-text)] rounded-xl flex items-center justify-center cursor-pointer transition-all shadow-xs"
                      title="Toggle sort direction"
                    >
                      {sortDirection === 'asc' ? <ArrowUp size={15} /> : <ArrowDown size={15} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Member Grid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 4k:grid-cols-7 5k:grid-cols-10 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 4k:grid-cols-8 5k:grid-cols-12 gap-6">
              {paginatedMembers.map((member) => (
                <motion.div
                  key={member.id}
                  whileHover={{ y: -4 }}
                  {...getMemberPressHandlers(member, () => setSelectedMember(member))}
                  className="bg-[var(--crm-card)] rounded-[20px] p-6 border border-[var(--crm-card-border)] shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col h-full relative"
                >
                  {/* Top Badges & Member ID */}
                  <div className="flex items-center justify-between mb-3 text-[10px] font-bold">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 font-mono">
                      {member.teamMemberId || getMasterTeamMemberId(member)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {member.currentRating !== undefined && member.currentRating > 0 && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold leading-none">
                          ★ {member.currentRating.toFixed(1)}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        (member.status || 'Active') === 'Active'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}>
                        {member.status || 'Active'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-[var(--crm-sidebar)] text-[var(--crm-text)] border border-[var(--crm-card-border)] flex items-center justify-center font-bold text-lg uppercase shrink-0">
                      {member.avatar && !member.avatar.includes('/_/upload') ? (
                        <img src={member.avatar} alt={member.fullName} className="h-full w-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                      ) : (
                        member.fullName.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[15px] font-bold text-[var(--crm-text)] truncate leading-tight">
                        {member.fullName}
                      </h3>
                      <p className="text-[11px] font-bold text-[var(--crm-text-muted)] uppercase tracking-wider mt-0.5 truncate">
                        {member.role || 'VIDEO EDITING'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4 flex-1">
                    <div>
                      <p className="text-[9px] font-bold text-[var(--crm-text-muted)] uppercase tracking-[0.2em] mb-1">
                        PRIMARY SERVICE
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-[#4F46E5]" />
                        <span className="text-[12.5px] font-bold text-[var(--crm-text)]">
                          {member.service || 'Video Editing'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {member.experienceLevel && (
                        <span className="px-2 py-0.5 rounded-md bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[10px] font-semibold text-[var(--crm-text-secondary)]">
                          {member.experienceLevel}
                        </span>
                      )}
                      {member.employmentType && (
                        <span className="px-2 py-0.5 rounded-md bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[10px] font-semibold text-[var(--crm-text-secondary)]">
                          {member.employmentType}
                        </span>
                      )}
                      {member.workMode && (
                        <span className="px-2 py-0.5 rounded-md bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[10px] font-semibold text-[var(--crm-text-secondary)]">
                          {member.workMode}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[var(--crm-card-border)] flex items-center justify-between">
                    <span className="text-[11px] font-medium text-[var(--crm-text-muted)]">
                      Portfolio
                    </span>
                    {member.portfolioLink ? (
                      <a
                        href={member.portfolioLink.startsWith('http') ? member.portfolioLink : `https://${member.portfolioLink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold transition-colors cursor-pointer"
                        title="Open Portfolio in new tab"
                      >
                        <ExternalLink size={12} />
                        View Portfolio
                      </a>
                    ) : (
                      <span className="text-[11px] text-[var(--crm-text-muted)] italic">No link</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination UI */}
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-[var(--crm-card-border)] bg-[var(--crm-card)] text-[var(--crm-text-secondary)] disabled:opacity-50 hover:bg-[var(--crm-sidebar)] shadow-sm transition-all"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`h-10 w-10 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                        currentPage === i + 1 
                          ? 'bg-black dark:bg-indigo-600 text-white shadow-md' 
                          : 'bg-[var(--crm-card)] text-[var(--crm-text-secondary)] border border-[var(--crm-card-border)] hover:border-gray-400'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border border-[var(--crm-card-border)] bg-[var(--crm-card)] text-[var(--crm-text-secondary)] disabled:opacity-50 hover:bg-[var(--crm-sidebar)] shadow-sm transition-all"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* 4. Add / Edit Dialog Modal */}
      {(editingMember !== null || isAddingNew) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--crm-card)] rounded-[24px] border border-[var(--crm-card-border)]/20 max-w-2xl 3xl:max-w-4xl 4k:max-w-5xl 5k:max-w-7xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--crm-card-border)] flex items-center justify-between">
              <h3 className="text-base font-semibold text-[var(--crm-text)] tracking-tight">
                {isAddingNew ? 'Add New Team Member' : `Edit Team Member: ${editingMember?.fullName}`}
              </h3>
              <button 
                onClick={() => {
                  setEditingMember(null);
                  setIsAddingNew(false);
                }}
                className="p-1 text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] rounded-md cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Form */}
            <form onSubmit={handleFormSubmit} className="overflow-y-auto p-6 space-y-6 text-xs text-[var(--crm-text)] flex-1">
              
              {/* SECTION 1: BASIC INFORMATION */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--crm-card-border)] pb-2">
                  <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                    <User size={14} /> 1. Basic Information
                  </h4>
                  <span className="text-[10px] font-mono text-[var(--crm-text-muted)]">
                    ID: {formTeamMemberId || 'Auto-generated'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-secondary)]">Team Member ID</label>
                    <input
                      type="text"
                      value={formTeamMemberId}
                      onChange={(e) => setFormTeamMemberId(e.target.value)}
                      placeholder="e.g. TM-001"
                      className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-mono text-xs text-[var(--crm-text)] focus:outline-none focus:border-[#4F46E5]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-secondary)]">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formFullName}
                      onChange={(e) => setFormFullName(e.target.value)}
                      placeholder="Enter full name"
                      className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-medium text-xs text-[var(--crm-text)] focus:outline-none focus:border-[#4F46E5]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-secondary)]">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="e.g. name@zyqitek.com"
                      className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-medium text-xs text-[var(--crm-text)] focus:outline-none focus:border-[#4F46E5]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-secondary)]">Phone Number</label>
                    <input
                      type="tel"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="e.g. +92 300 1234567"
                      className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-medium text-xs text-[var(--crm-text)] focus:outline-none focus:border-[#4F46E5]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-secondary)]">WhatsApp Number</label>
                    <input
                      type="tel"
                      value={formWhatsapp}
                      onChange={(e) => setFormWhatsapp(e.target.value)}
                      placeholder="e.g. +92 300 1234567"
                      className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-medium text-xs text-[var(--crm-text)] focus:outline-none focus:border-[#4F46E5]"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-semibold text-[var(--crm-text-secondary)]">CNIC Number</label>
                      <span className="text-[9px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <Lock size={9} /> Admin Only
                      </span>
                    </div>
                    <input
                      type="text"
                      value={formCnicNumber}
                      onChange={(e) => setFormCnicNumber(e.target.value)}
                      placeholder="e.g. 35202-XXXXXXX-X"
                      className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-mono text-xs text-[var(--crm-text)] focus:outline-none focus:border-[#4F46E5]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-secondary)]">Country</label>
                    <input
                      type="text"
                      value={formCountry}
                      onChange={(e) => setFormCountry(e.target.value)}
                      placeholder="e.g. Pakistan, UAE, UK"
                      className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-medium text-xs text-[var(--crm-text)] focus:outline-none focus:border-[#4F46E5]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-secondary)]">City / Location</label>
                    <input
                      type="text"
                      value={formCity}
                      onChange={(e) => setFormCity(e.target.value)}
                      placeholder="e.g. Lahore, Karachi, Dubai"
                      className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-medium text-xs text-[var(--crm-text)] focus:outline-none focus:border-[#4F46E5]"
                    />
                  </div>
                </div>

                {/* Profile Photo Upload */}
                <div className="space-y-1 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl p-3">
                  <label className="text-[10px] font-semibold text-[var(--crm-text-secondary)] block">Profile Photo</label>
                  <div className="flex items-center gap-4">
                    {formAvatar ? (
                      <img 
                        src={formAvatar} 
                        alt="Preview" 
                        className="h-12 w-12 rounded-xl object-cover border border-[var(--crm-card-border)] shadow-xs"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-[var(--crm-card)] flex items-center justify-center text-[var(--crm-text-secondary)] text-[10px] border border-[var(--crm-card-border)]">
                        No Photo
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFormAvatar(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="text-xs text-[var(--crm-text-secondary)] file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                      />
                    </div>
                    {formAvatar && (
                      <button 
                        type="button" 
                        onClick={() => setFormAvatar('')}
                        className="text-rose-500 hover:text-rose-700 text-xs font-semibold cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 2: PROFESSIONAL INFORMATION */}
              <div className="space-y-4 pt-2 border-t border-[var(--crm-card-border)]">
                <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                  <Briefcase size={14} /> 2. Professional Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-secondary)]">Job Title / Role *</label>
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                      className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-medium text-xs text-[var(--crm-text)] focus:outline-none focus:border-[#4F46E5]"
                    >
                      {ROLES_OPTIONS.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                      <option value="Other">Other (Custom Role)</option>
                    </select>
                    {formRole === 'Other' && (
                      <input
                        type="text"
                        value={customRoleText}
                        onChange={(e) => setCustomRoleText(e.target.value)}
                        placeholder="Enter custom job title"
                        className="mt-2 w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-medium text-xs text-[var(--crm-text)] focus:outline-none focus:border-[#4F46E5]"
                      />
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-secondary)]">Primary Service / Department *</label>
                    <select
                      value={formService}
                      onChange={(e) => setFormService(e.target.value)}
                      className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-medium text-xs text-[var(--crm-text)] focus:outline-none focus:border-[#4F46E5]"
                    >
                      {SERVICE_OPTIONS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-secondary)]">Experience Level</label>
                    <select
                      value={formExperienceLevel}
                      onChange={(e) => setFormExperienceLevel(e.target.value as any)}
                      className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-medium text-xs text-[var(--crm-text)] focus:outline-none focus:border-[#4F46E5]"
                    >
                      {EXPERIENCE_LEVELS.map(lvl => (
                        <option key={lvl} value={lvl}>{lvl}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-secondary)]">Primary Skill</label>
                    <input
                      type="text"
                      value={formPrimarySkill}
                      onChange={(e) => setFormPrimarySkill(e.target.value)}
                      placeholder="e.g. Premiere Pro / After Effects / React"
                      className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-medium text-xs text-[var(--crm-text)] focus:outline-none focus:border-[#4F46E5]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-secondary)]">Secondary Skills</label>
                    <input
                      type="text"
                      value={formSecondarySkills}
                      onChange={(e) => setFormSecondarySkills(e.target.value)}
                      placeholder="e.g. Photoshop, DaVinci, Figma, Motion"
                      className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-medium text-xs text-[var(--crm-text)] focus:outline-none focus:border-[#4F46E5]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-secondary)]">Total Experience (Years)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={formExperienceYears}
                      onChange={(e) => setFormExperienceYears(e.target.value)}
                      placeholder="e.g. 3.5"
                      className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-medium text-xs text-[var(--crm-text)] focus:outline-none focus:border-[#4F46E5]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[var(--crm-text-secondary)]">Professional Bio</label>
                  <textarea
                    rows={2}
                    value={formBio}
                    onChange={(e) => setFormBio(e.target.value)}
                    placeholder="Brief summary of expertise, background, and achievements..."
                    className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-medium text-xs text-[var(--crm-text)] focus:outline-none focus:border-[#4F46E5] resize-none"
                  />
                </div>
              </div>

              {/* SECTION 3: PORTFOLIO & PROFESSIONAL LINKS */}
              <div className="space-y-4 pt-2 border-t border-[var(--crm-card-border)]">
                <div>
                  <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                    <Globe size={14} /> 3. Portfolio & Professional Links
                  </h4>
                  <p className="text-[10px] text-[var(--crm-text-muted)] mt-0.5">
                    External links open in a NEW TAB when clicked.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-secondary)]">Portfolio Link *</label>
                    <input
                      type="url"
                      value={formPortfolio}
                      onChange={(e) => setFormPortfolio(e.target.value)}
                      placeholder="https://behance.net/... or Google Drive"
                      className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-medium text-xs text-[var(--crm-text)] focus:outline-none focus:border-[#4F46E5]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-secondary)]">LinkedIn Profile</label>
                    <input
                      type="url"
                      value={formLinkedin}
                      onChange={(e) => setFormLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/in/..."
                      className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-medium text-xs text-[var(--crm-text)] focus:outline-none focus:border-[#4F46E5]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-secondary)]">GitHub Profile</label>
                    <input
                      type="url"
                      value={formGithub}
                      onChange={(e) => setFormGithub(e.target.value)}
                      placeholder="https://github.com/..."
                      className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-medium text-xs text-[var(--crm-text)] focus:outline-none focus:border-[#4F46E5]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-secondary)]">Behance Profile</label>
                    <input
                      type="url"
                      value={formBehance}
                      onChange={(e) => setFormBehance(e.target.value)}
                      placeholder="https://behance.net/..."
                      className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-medium text-xs text-[var(--crm-text)] focus:outline-none focus:border-[#4F46E5]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-secondary)]">Dribbble Profile</label>
                    <input
                      type="url"
                      value={formDribbble}
                      onChange={(e) => setFormDribbble(e.target.value)}
                      placeholder="https://dribbble.com/..."
                      className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-medium text-xs text-[var(--crm-text)] focus:outline-none focus:border-[#4F46E5]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-secondary)]">Personal Website</label>
                    <input
                      type="url"
                      value={formWebsite}
                      onChange={(e) => setFormWebsite(e.target.value)}
                      placeholder="https://mywebsite.com"
                      className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-medium text-xs text-[var(--crm-text)] focus:outline-none focus:border-[#4F46E5]"
                    />
                  </div>
                </div>

                {/* Custom Links Manager */}
                <div className="bg-[var(--crm-sidebar)] rounded-xl p-3 border border-[var(--crm-card-border)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Custom Links / Badges</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCustomLinkId(null);
                        setCustomLinkName('');
                        setCustomLinkUrl('');
                        setShowCustomLinkModal(true);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#4F46E5] hover:bg-indigo-600 text-white text-[10px] font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus size={12} /> Add Custom Link
                    </button>
                  </div>
                  {formCustomLinks.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {formCustomLinks.map((link) => (
                        <div key={link.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--crm-card)] border border-[var(--crm-card-border)] text-xs rounded-lg">
                          <span className="font-semibold text-[var(--crm-text)]">{link.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCustomLinkId(link.id);
                              setCustomLinkName(link.name);
                              setCustomLinkUrl(link.url);
                              setShowCustomLinkModal(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-800 p-0.5"
                          >
                            <Edit2 size={10} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormCustomLinks(prev => prev.filter(l => l.id !== link.id))}
                            className="text-rose-600 hover:text-rose-800 p-0.5"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-[var(--crm-text-muted)] italic">No additional custom links added.</p>
                  )}
                </div>
              </div>

              {/* SECTION 4: REMOTE WORK INFORMATION */}
              <div className="space-y-4 pt-2 border-t border-[var(--crm-card-border)]">
                <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                  <Clock size={14} /> 4. Remote Work Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-secondary)]">Employment Type</label>
                    <select
                      value={formEmploymentType}
                      onChange={(e) => setFormEmploymentType(e.target.value as any)}
                      className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-medium text-xs text-[var(--crm-text)] focus:outline-none focus:border-[#4F46E5]"
                    >
                      {EMPLOYMENT_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-secondary)]">Work Mode</label>
                    <select
                      value={formWorkMode}
                      onChange={(e) => setFormWorkMode(e.target.value as any)}
                      className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-medium text-xs text-[var(--crm-text)] focus:outline-none focus:border-[#4F46E5]"
                    >
                      {WORK_MODES.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-secondary)]">Availability Status</label>
                    <select
                      value={formAvailability}
                      onChange={(e) => setFormAvailability(e.target.value as any)}
                      className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-medium text-xs text-[var(--crm-text)] focus:outline-none focus:border-[#4F46E5]"
                    >
                      {AVAILABILITY_OPTIONS.map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-secondary)]">Timezone</label>
                    <input
                      type="text"
                      value={formTimezone}
                      onChange={(e) => setFormTimezone(e.target.value)}
                      placeholder="e.g. UTC+5 (PKT) / UTC-5 (EST)"
                      className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-medium text-xs text-[var(--crm-text)] focus:outline-none focus:border-[#4F46E5]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-secondary)]">Working Hours</label>
                    <input
                      type="text"
                      value={formWorkingHours}
                      onChange={(e) => setFormWorkingHours(e.target.value)}
                      placeholder="e.g. 9:00 AM - 5:00 PM EST"
                      className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-medium text-xs text-[var(--crm-text)] focus:outline-none focus:border-[#4F46E5]"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 5: HIRING & JOINING INFORMATION */}
              <div className="space-y-4 pt-2 border-t border-[var(--crm-card-border)]">
                <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                  <UserCheck size={14} /> 5. Hiring & Joining Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-secondary)]">Joining Date</label>
                    <input
                      type="date"
                      value={formJoiningDate}
                      onChange={(e) => setFormJoiningDate(e.target.value)}
                      className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-medium text-xs text-[var(--crm-text)] focus:outline-none focus:border-[#4F46E5]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-secondary)]">Hiring Type</label>
                    <input
                      type="text"
                      value={formHiringType}
                      onChange={(e) => setFormHiringType(e.target.value)}
                      placeholder="e.g. Direct Hire, Agency Referral, Probation"
                      className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-medium text-xs text-[var(--crm-text)] focus:outline-none focus:border-[#4F46E5]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-secondary)]">Recruiter / Source</label>
                    <select
                      value={formRecruiterSource}
                      onChange={(e) => setFormRecruiterSource(e.target.value)}
                      className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-medium text-xs text-[var(--crm-text)] focus:outline-none focus:border-[#4F46E5]"
                    >
                      {RECRUITER_SOURCES.map(src => (
                        <option key={src} value={src}>{src}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-secondary)]">Experience at Joining</label>
                    <input
                      type="text"
                      value={formExperienceAtJoining}
                      onChange={(e) => setFormExperienceAtJoining(e.target.value)}
                      placeholder="e.g. 2 years relevant video editing experience"
                      className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-medium text-xs text-[var(--crm-text)] focus:outline-none focus:border-[#4F46E5]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-secondary)]">Resume / CV URL</label>
                    <input
                      type="url"
                      value={formResumeLink}
                      onChange={(e) => setFormResumeLink(e.target.value)}
                      placeholder="https://drive.google.com/file/..."
                      className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-medium text-xs text-[var(--crm-text)] focus:outline-none focus:border-[#4F46E5]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[var(--crm-text-secondary)]">Interview & Assessment Notes</label>
                  <textarea
                    rows={2}
                    value={formInterviewNotes}
                    onChange={(e) => setFormInterviewNotes(e.target.value)}
                    placeholder="Technical assessment results, interviewer observations, soft skills feedback..."
                    className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-medium text-xs text-[var(--crm-text)] focus:outline-none focus:border-[#4F46E5] resize-none"
                  />
                </div>
              </div>



              {/* SECTION 6: PROFESSIONAL DOCUMENTS */}
              <div className="space-y-4 pt-2 border-t border-[var(--crm-card-border)]">
                <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                  <FileText size={14} /> 6. Professional Documents
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-secondary)]">Resume / CV Document URL</label>
                    <input
                      type="url"
                      value={formCvDocumentUrl}
                      onChange={(e) => setFormCvDocumentUrl(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-medium text-xs text-[var(--crm-text)] focus:outline-none focus:border-[#4F46E5]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-secondary)]">Portfolio Document URL</label>
                    <input
                      type="url"
                      value={formPortfolioDocumentUrl}
                      onChange={(e) => setFormPortfolioDocumentUrl(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-medium text-xs text-[var(--crm-text)] focus:outline-none focus:border-[#4F46E5]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-secondary)]">Contract / NDA Document URL</label>
                    <input
                      type="url"
                      value={formContractDocumentUrl}
                      onChange={(e) => setFormContractDocumentUrl(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-medium text-xs text-[var(--crm-text)] focus:outline-none focus:border-[#4F46E5]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-secondary)]">Other Document URL</label>
                    <input
                      type="url"
                      value={formOtherDocumentUrl}
                      onChange={(e) => setFormOtherDocumentUrl(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-medium text-xs text-[var(--crm-text)] focus:outline-none focus:border-[#4F46E5]"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 7: INTERNAL ADMIN NOTES */}
              <div className="space-y-3 pt-2 border-t border-[var(--crm-card-border)]">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <Shield size={14} /> 7. Internal Admin Notes
                  </h4>
                  <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">
                    Admin Only — Never Visible in Team Portal
                  </span>
                </div>

                <textarea
                  rows={3}
                  value={formInternalNotes}
                  onChange={(e) => setFormInternalNotes(e.target.value)}
                  placeholder="Private admin observations, performance reviews, internal flags..."
                  className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-medium text-xs text-[var(--crm-text)] focus:outline-none focus:border-[#4F46E5] resize-none"
                />
              </div>

              {/* TEAM MEMBER RATING SECTION */}
              <div className="space-y-4 pt-4 border-t border-[var(--crm-card-border)] bg-amber-500/[0.02] dark:bg-amber-500/[0.01] p-4 rounded-2xl border border-dashed border-amber-200/40 dark:border-amber-500/10">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <Star size={14} /> Team Member Rating
                  </h4>
                  <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">
                    Admin Only — Internal Evaluation
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Category Ratings */}
                  <div className="space-y-3 bg-[var(--crm-card)] p-4 rounded-xl border border-[var(--crm-card-border)]">
                    <h5 className="text-[11px] font-bold text-[var(--crm-text-muted)] uppercase tracking-wider mb-2 border-b border-[var(--crm-card-border)] pb-1">
                      Performance Metrics
                    </h5>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-xs font-medium text-[var(--crm-text-secondary)]">Work Quality</span>
                      <StarRatingInteractive rating={ratingWorkQuality} onChange={setRatingWorkQuality} />
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-xs font-medium text-[var(--crm-text-secondary)]">Communication</span>
                      <StarRatingInteractive rating={ratingCommunication} onChange={setRatingCommunication} />
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-xs font-medium text-[var(--crm-text-secondary)]">Reliability</span>
                      <StarRatingInteractive rating={ratingReliability} onChange={setRatingReliability} />
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-xs font-medium text-[var(--crm-text-secondary)]">Technical Skills</span>
                      <StarRatingInteractive rating={ratingTechnicalSkills} onChange={setRatingTechnicalSkills} />
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-xs font-medium text-[var(--crm-text-secondary)]">Deadline Management</span>
                      <StarRatingInteractive rating={ratingDeadlineManagement} onChange={setRatingDeadlineManagement} />
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-xs font-medium text-[var(--crm-text-secondary)]">Client Handling</span>
                      <StarRatingInteractive rating={ratingClientHandling} onChange={setRatingClientHandling} />
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-xs font-medium text-[var(--crm-text-secondary)]">Teamwork</span>
                      <StarRatingInteractive rating={ratingTeamwork} onChange={setRatingTeamwork} />
                    </div>
                  </div>

                  {/* Right Column: Calculated Overall Rating & Notes */}
                  <div className="space-y-4 flex flex-col justify-between">
                    <div className="p-4 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-[var(--crm-text-muted)] uppercase tracking-wider block">Calculated Overall Rating</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-2xl font-black text-[var(--crm-text)]">
                            {(() => {
                              const vals = [
                                ratingWorkQuality,
                                ratingCommunication,
                                ratingReliability,
                                ratingTechnicalSkills,
                                ratingDeadlineManagement,
                                ratingClientHandling,
                                ratingTeamwork
                              ].filter(v => v > 0);
                              return vals.length > 0 
                                ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
                                : '0.0';
                            })()}
                          </span>
                          <span className="text-sm font-semibold text-[var(--crm-text-muted)]">/ 5.0</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] text-[var(--crm-text-muted)] italic mb-1">Overall Stars</span>
                        <StarRatingStatic 
                          rating={(() => {
                            const vals = [
                              ratingWorkQuality,
                              ratingCommunication,
                              ratingReliability,
                              ratingTechnicalSkills,
                              ratingDeadlineManagement,
                              ratingClientHandling,
                              ratingTeamwork
                            ].filter(v => v > 0);
                            return vals.length > 0 
                              ? Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1))
                              : 0;
                          })()} 
                          size={16} 
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[var(--crm-text-secondary)] uppercase tracking-wider block">Rating Notes</label>
                      <textarea
                        rows={3}
                        value={ratingNotes}
                        onChange={(e) => setRatingNotes(e.target.value)}
                        placeholder="Provide details about performance reviews, strengths, areas of improvement, or general feedback..."
                        className="w-full bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-medium text-xs text-[var(--crm-text)] focus:outline-none focus:border-[#4F46E5] resize-none"
                      />
                      <span className="text-[9px] text-[var(--crm-text-muted)] italic block mt-0.5">
                        Admin only — Never visible in Team Portal.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 8: ACCOUNT STATUS */}
              <div className="space-y-2 pt-2 border-t border-[var(--crm-card-border)]">
                <label className="text-[10px] font-semibold text-[var(--crm-text-secondary)] block">Account Status</label>
                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="accountStatus"
                      value="Active"
                      checked={formStatus === 'Active'}
                      onChange={() => setFormStatus('Active')}
                      className="accent-emerald-500"
                    />
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Active</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="accountStatus"
                      value="Inactive"
                      checked={formStatus === 'Inactive'}
                      onChange={() => setFormStatus('Inactive')}
                      className="accent-rose-500"
                    />
                    <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">Inactive</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[var(--crm-card-border)] flex justify-end gap-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => {
                    setEditingMember(null);
                    setIsAddingNew(false);
                  }}
                  className="px-4 py-2 bg-[var(--crm-sidebar)] hover:bg-[var(--crm-sidebar-active-bg)] text-[var(--crm-text)] border border-[var(--crm-card-border)] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors cursor-pointer shadow-xs flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Saving Workspace...</span>
                    </>
                  ) : (
                    <span>Save Workspace Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Detail Side Drawpanel / Modal View */}
      <CrmProfileView
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        type="Team Member"
        data={selectedMember}
        teamMembers={teamMembers}
        projects={allProjects || []}
        onEdit={() => {
          if (selectedMember) {
            const target = selectedMember;
            setSelectedMember(null);
            openEditModal(target);
          }
        }}
        onDelete={async (id) => {
          return await onDeleteTeamMember(id);
        }}
        onUpdateTeamMember={async (updated) => {
          await onUpdateTeamMember(updated);
          setSelectedMember(updated);
        }}
      /> 
      {false && (
        <div className="hidden">
            <div className="bg-slate-900 text-white p-6 md:p-8 relative overflow-hidden shrink-0">
              {/* Decorative background accent */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-500/10/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-50 dark:bg-blue-500/10/10 rounded-full blur-2xl -ml-20 -mb-20"></div>

              <button 
                onClick={() => setSelectedMember(null)}
                className="absolute top-4 right-4 text-[var(--crm-text-muted)] hover:text-white transition-colors cursor-pointer p-1.5 rounded-full hover:bg-slate-800 z-10"
              >
                <X size={18} />
              </button>
              
              <div className="relative flex flex-col sm:flex-row gap-5 sm:items-center">
                {selectedMember.avatar && !selectedMember.avatar.includes('/_/upload') ? (
                  <img 
                    src={selectedMember.avatar} 
                    alt={selectedMember.fullName} 
                    className="h-20 w-20 rounded-2xl object-cover shadow-lg border border-[var(--crm-card-border)] shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-medium shadow-lg border border-[var(--crm-card-border)] select-none  shrink-0">
                    {selectedMember.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'TM'}
                  </div>
                )}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-semibold   px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10/20 text-indigo-300 rounded-full border border-indigo-500/30">
                      TEAM-{selectedMember.id.slice(0, 4).toUpperCase()}
                    </span>
                    <span className={`text-[10px] font-semibold   px-2 py-0.5 rounded-full border ${
                      (selectedMember.status || 'Active') === 'Active' 
                        ? 'bg-emerald-50 dark:bg-emerald-500/10/20 text-emerald-300 border-emerald-500/30' 
                        : 'bg-slate-50 /20 text-slate-300 border-slate-500/30'
                    }`}>
                      {selectedMember.status || 'Active'}
                    </span>
                  </div>
                  <h4 className="text-2xl font-medium tracking-tight text-white">{selectedMember.fullName}</h4>
                  <p className="text-xs text-slate-300 flex flex-wrap items-center gap-1.5 ">
                    <Briefcase size={13} className="text-indigo-400 shrink-0" /> {selectedMember.role}
                    <span className="text-[var(--crm-text-secondary)]">•</span>
                    <Calendar size={13} className="text-[var(--crm-text-muted)] shrink-0" /> Onboarded {selectedMember.createdAt ? new Date(selectedMember.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Recently'}
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Grid Container */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-8 4k:grid-cols-12 5k:grid-cols-16 gap-6 items-start">
                
                {/* Left Columns - Information Cards */}
                <div className="lg:col-span-3 space-y-6">
                  
                  {/* Card 1: Team Member Overview */}
                  <div className="bg-[var(--crm-card)] rounded-2xl p-5 border border-[var(--crm-card-border)] shadow-xs space-y-4">
                    <h5 className="text-xs font-medium text-[var(--crm-text-muted)]   border-b border-[var(--crm-card-border)] pb-2 flex items-center gap-1.5">
                      <Users size={14} className="text-[var(--crm-text-muted)] shrink-0" /> Professional Profile & Credentials
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[10px] font-medium text-[var(--crm-text-muted)] ">Primary Service</span>
                        <p className=" text-indigo-700 bg-indigo-50 dark:bg-indigo-500/10 border border-[var(--crm-card-border)] px-2 py-0.5 rounded w-max mt-1">{selectedMember.service || 'Other'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-medium text-[var(--crm-text-muted)] ">Country / Region</span>
                        <p className=" text-[var(--crm-text)] bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] px-2 py-0.5 rounded w-max mt-1">{selectedMember.country || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-medium text-[var(--crm-text-muted)] ">Experience Level</span>
                        <p className=" text-[var(--crm-text)] mt-1">{selectedMember.experience || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-medium text-[var(--crm-text-muted)] ">Software Knowledge</span>
                        <p className=" text-[var(--crm-text)] mt-1">{selectedMember.softwareKnowledge || 'Not specified'}</p>
                      </div>
                    </div>

                    {/* Portfolios & Links inside overview */}
                    <div className="pt-3 border-t border-[var(--crm-card-border)] space-y-3">
                      <span className="text-[10px] font-medium text-[var(--crm-text-muted)]  block">Portfolios & Profiles</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {selectedMember.portfolioLink ? (
                          <a href={selectedMember.portfolioLink} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-[var(--crm-sidebar)] hover:bg-[var(--crm-sidebar-active-bg)] text-[var(--crm-text)]  rounded-xl border border-[var(--crm-card-border)]/60 transition-all flex items-center justify-between">
                            <span>Main Portfolio</span>
                            <ExternalLink size={12} className="text-[var(--crm-text-muted)]" />
                          </a>
                        ) : (
                          <div className="p-2.5 bg-[var(--crm-sidebar)] text-[var(--crm-text-muted)] italic rounded-xl border border-dashed border-[var(--crm-card-border)]">No portfolio set</div>
                        )}

                        {selectedMember.linkedinLink ? (
                          <a href={selectedMember.linkedinLink} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-blue-50/50 dark:bg-blue-500/10 hover:bg-blue-50 dark:bg-blue-500/10 text-blue-700 font-medium rounded-xl border border-[var(--crm-card-border)] transition-all flex items-center justify-between">
                            <span>LinkedIn Profile</span>
                            <ExternalLink size={12} className="text-blue-400" />
                          </a>
                        ) : (
                          <div className="p-2.5 bg-[var(--crm-sidebar)] text-[var(--crm-text-muted)] italic rounded-xl border border-dashed border-[var(--crm-card-border)]">No LinkedIn set</div>
                        )}
                      </div>

                      {/* Render custom links if any */}
                      {selectedMember.customLinks && (() => {
                        try {
                          const links = JSON.parse(selectedMember.customLinks);
                          if (links.length > 0) {
                            return (
                              <div className="pt-2">
                                <span className="text-[10px] font-medium text-[var(--crm-text-muted)]  block mb-1.5">Additional Links</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {links.map((link: any, i: number) => (
                                    <a
                                      key={link.id || i}
                                      href={link.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-[var(--crm-sidebar)] hover:bg-[var(--crm-sidebar-active-bg)] text-[var(--crm-text)] text-[10px]  rounded-lg border border-[var(--crm-card-border)] transition-all shadow-3xs"
                                    >
                                      {link.name} <ExternalLink size={9} className="text-[var(--crm-text-muted)]" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                        } catch (e) {}
                        return null;
                      })()}
                    </div>
                  </div>

                  {/* Card 2: Contact Details */}
                  <div className="bg-[var(--crm-card)] rounded-2xl p-5 border border-[var(--crm-card-border)] shadow-xs space-y-4">
                    <h5 className="text-xs font-medium text-[var(--crm-text-muted)]   border-b border-[var(--crm-card-border)] pb-2 flex items-center gap-1.5">
                      <Mail size={14} className="text-[var(--crm-text-muted)] shrink-0" /> Contact Channels
                    </h5>
                    <div className="divide-y divide-slate-100 dark:divide-[#30353D] text-xs">
                      <div className="flex justify-between items-center py-2.5">
                        <span className="font-medium text-[var(--crm-text-muted)]  text-[10px]">Email Address</span>
                        {selectedMember.email ? (
                          <a href={`mailto:${selectedMember.email}`} className="font-semibold text-indigo-600 hover:underline">
                            {selectedMember.email}
                          </a>
                        ) : <span className="text-[var(--crm-text-muted)] italic">None set</span>}
                      </div>
                      <div className="flex justify-between items-center py-2.5">
                        <span className="font-medium text-[var(--crm-text-muted)]  text-[10px]">WhatsApp Contact</span>
                        {selectedMember.whatsapp ? (
                          <a 
                            href={`https://wa.me/${selectedMember.whatsapp.replace(/\D/g, '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-medium text-emerald-600 hover:underline flex items-center gap-1"
                          >
                            {selectedMember.whatsapp} <ExternalLink size={11} />
                          </a>
                        ) : <span className="text-[var(--crm-text-muted)] italic">None set</span>}
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Assigned Project (Interactive progress metrics) */}
                  <div className="bg-[var(--crm-card)] rounded-2xl p-5 border border-[var(--crm-card-border)] shadow-xs space-y-4">
                    <h5 className="text-xs font-medium text-[var(--crm-text-muted)]   border-b border-[var(--crm-card-border)] pb-2 flex items-center gap-1.5">
                      <Briefcase size={14} className="text-[var(--crm-text-muted)] shrink-0" /> Assignment Information
                    </h5>

                    {selectedMember.assignedProjectName ? (
                      <div className="space-y-4 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <span className="text-[10px] font-medium text-[var(--crm-text-muted)] ">Active Project Assignment</span>
                            <p className=" text-[var(--crm-text)] text-sm mt-0.5">{selectedMember.assignedProjectName}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-medium text-[var(--crm-text-muted)] ">Client Account Liaison</span>
                            <p className=" text-[var(--crm-text)] mt-0.5">{selectedMember.clientName || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-medium text-[var(--crm-text-muted)] ">Project Deadline</span>
                            {(() => {
                              const isCompleted = selectedMember.projectStatus === 'Completed' || selectedMember.projectStatus === 'Delivered';
                              const now = new Date();
                              const deadlineDate = selectedMember.projectDeadline ? new Date(selectedMember.projectDeadline) : null;
                              const isUrgent = deadlineDate && !isCompleted && (deadlineDate.getTime() - now.getTime() <= 86400000);
                              const isOverdue = deadlineDate && !isCompleted && (deadlineDate.getTime() < now.getTime());
                              const isDueSoon = isUrgent && !isOverdue;

                              return (
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <p className={`font-medium flex items-center gap-1 ${
                                    isOverdue ? 'text-rose-600 font-semibold' :
                                    isDueSoon ? 'text-amber-600 font-semibold' :
                                    'text-[var(--crm-text)]'
                                  }`}>
                                    <Clock size={12} className={isOverdue ? "text-rose-500" : isDueSoon ? "text-amber-500" : "text-[var(--crm-text-muted)]"} />
                                    {selectedMember.projectDeadline || 'Not set'}
                                  </p>
                                  {isOverdue && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-semibold   bg-rose-50 dark:bg-rose-500/10 text-rose-600 border border-rose-200">
                                      <AlertCircle size={10} /> Overdue
                                    </span>
                                  )}
                                  {isDueSoon && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-semibold   bg-amber-50 dark:bg-amber-500/10 text-amber-600 border border-amber-200 animate-pulse">
                                      <Clock size={10} /> Due Soon
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                          <div>
                            <span className="text-[10px] font-medium text-[var(--crm-text-muted)] ">Assignment Status</span>
                            <div className="mt-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold   border ${getStatusBadgeClass(selectedMember.projectStatus)}`}>
                                {selectedMember.projectStatus}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar inside Assignment block */}
                        <div className="pt-3 border-t border-slate-50 space-y-2">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-medium text-[var(--crm-text-muted)] ">Task Assignment Completion</span>
                            <span className="font-semibold text-indigo-600">{selectedMember.projectProgress}% Complete</span>
                          </div>
                          <div className="w-full bg-[var(--crm-sidebar)] h-2 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-600 transition-all duration-500"
                              style={{ width: `${selectedMember.projectProgress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-[var(--crm-text-muted)] italic text-xs">
                        No active project assignments.
                      </div>
                    )}
                  </div>

                  {/* Card 4: Administrative Notes */}
                  <div className="bg-[var(--crm-card)] rounded-2xl p-5 border border-[var(--crm-card-border)] shadow-xs space-y-3">
                    <h5 className="text-xs font-medium text-[var(--crm-text-muted)]   border-b border-[var(--crm-card-border)] pb-2 flex items-center gap-1.5">
                      <FileText size={14} className="text-[var(--crm-text-muted)] shrink-0" /> Administrative Profile Notes
                    </h5>
                    {selectedMember.notes ? (
                      <p className="bg-amber-50/60 dark:bg-amber-500/10 p-4 border border-amber-100 text-[var(--crm-text)] text-xs rounded-xl leading-relaxed italic whitespace-pre-wrap">
                        "{selectedMember.notes}"
                      </p>
                    ) : (
                      <p className="text-[var(--crm-text-muted)] italic text-xs">No admin profile notes or private instructions configured.</p>
                    )}
                  </div>

                </div>

                {/* Right Columns - Tasks & Reviews */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Card 5: Task Checklist */}
                  <div className="bg-[var(--crm-card)] rounded-2xl p-5 border border-[var(--crm-card-border)] shadow-xs space-y-4">
                    <div className="flex justify-between items-center border-b border-[var(--crm-card-border)] pb-2">
                      <h5 className="text-xs font-medium text-[var(--crm-text-muted)]   flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-[var(--crm-text-muted)] shrink-0" /> Task Checklist
                      </h5>
                      {memberTasks.length > 0 && (
                        <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 border border-[var(--crm-card-border)] px-2 py-0.5 rounded-full">
                          {memberTasks.filter(t => t.completed).length}/{memberTasks.length} Done
                        </span>
                      )}
                    </div>

                    <div className="space-y-3 text-xs">
                      {/* Add Task input */}
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          placeholder="Add assignment task..."
                          value={newTaskText}
                          onChange={(e) => setNewTaskText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddTask();
                            }
                          }}
                          className="flex-1 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500 font-medium text-[var(--crm-text)]"
                        />
                        <button
                          type="button"
                          onClick={handleAddTask}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-50 dark:bg-indigo-500/10 text-white font-medium text-xs rounded-lg cursor-pointer transition-colors shadow-xs"
                        >
                          Add
                        </button>
                      </div>

                      {/* Stored tasks list */}
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        {memberTasks.length === 0 ? (
                          <p className="text-[var(--crm-text-muted)] italic text-center py-6 text-xs">No tasks configured.</p>
                        ) : (
                          memberTasks.map(task => (
                            <div key={task.id} className="flex items-center justify-between gap-3 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl p-2.5 hover:border-[var(--crm-card-border)] transition-all dark:bg-[#0a0f17] ">
                              <TaskCheckmark
                                checked={task.completed}
                                onChange={() => handleToggleTask(task.id)}
                                label={task.text}
                                size={16}
                                className="flex-1 min-w-0"
                              />
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setActiveTaskForNotes(task)}
                                  title="Add or view task notes & updates"
                                  className="relative p-1.5 text-[var(--crm-text-muted)] hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/60 dark:hover:bg-[#20242B] rounded-lg transition-colors cursor-pointer"
                                >
                                  <MessageSquare size={14} />
                                  {Array.isArray(task.notes) && task.notes.length > 0 && (
                                    <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-indigo-600 text-[9px] font-semibold text-white flex items-center justify-center">
                                      {task.notes.length}
                                    </span>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="text-slate-300 hover:text-rose-500 transition-colors p-0.5"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card 6: Performance Reviews */}
                  <div className="bg-[var(--crm-card)] rounded-2xl p-5 border border-[var(--crm-card-border)] shadow-xs space-y-4">
                    <h5 className="text-xs font-medium text-[var(--crm-text-muted)]   border-b border-[var(--crm-card-border)] pb-2 flex items-center gap-1.5">
                      <Bookmark size={14} className="text-[var(--crm-text-muted)] shrink-0" /> Stored Performance Reviews
                    </h5>

                    <div className="space-y-4 text-xs">
                      {/* Reviews container list */}
                      <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
                        {(() => {
                          let reviews = [];
                          if (selectedMember.reviews) {
                            try {
                              reviews = JSON.parse(selectedMember.reviews);
                            } catch (e) {
                              reviews = [];
                            }
                          }
                          
                          if (reviews.length === 0) {
                            return (
                              <div className="bg-[var(--crm-sidebar)] rounded-xl p-6 text-center text-[var(--crm-text-muted)] italic">
                                No reviews recorded yet for this team member.
                              </div>
                            );
                          }

                          return reviews.map((review: any) => (
                            <div key={review.id} className="bg-[var(--crm-sidebar)] rounded-xl p-3 border border-[var(--crm-card-border)] relative group hover:border-[var(--crm-card-border)]">
                              <button
                                type="button"
                                onClick={() => handleDeleteReview(review.id)}
                                className="absolute right-2 top-2 text-slate-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100 p-1"
                                title="Delete Review"
                              >
                                <Trash2 size={11} />
                              </button>
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="font-semibold text-[var(--crm-text)]">{review.title}</span>
                                <span className="text-[9px] font-medium text-[var(--crm-text-muted)] whitespace-nowrap">{review.date}</span>
                              </div>

                              {/* Stars */}
                              <div className="flex items-center gap-0.5 text-amber-500 mb-1.5">
                                {Array.from({ length: 5 }).map((_, idx) => (
                                  <span key={idx} className="text-[11px]">
                                    {idx < review.rating ? '★' : '☆'}
                                  </span>
                                ))}
                              </div>

                              {review.comments && (
                                <p className="text-[var(--crm-subtitle)] text-[11px] leading-relaxed italic">
                                  "{review.comments}"
                                </p>
                              )}
                            </div>
                          ));
                        })()}
                      </div>

                      {/* Add Review Record form */}
                      <div className="pt-3 border-t border-[var(--crm-card-border)] space-y-3">
                        <span className="text-[10px] font-medium text-[var(--crm-text-muted)]  block">Log constructive feedback</span>
                        
                        <div className="space-y-2.5">
                          <input 
                            type="text"
                            placeholder="Review title (e.g. Q4 Performance)"
                            value={newReviewTitle}
                            onChange={(e) => setNewReviewTitle(e.target.value)}
                            className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500 font-medium text-[var(--crm-text)]"
                          />
                          
                          <div className="grid grid-cols-2 gap-2">
                            <input 
                              type="date"
                              value={newReviewDate}
                              onChange={(e) => setNewReviewDate(e.target.value)}
                              className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-lg px-2 py-1 text-[11px] focus:outline-none focus:border-indigo-500 font-semibold text-slate-850"
                            />
                            
                            <select 
                              value={newReviewRating}
                              onChange={(e) => setNewReviewRating(Number(e.target.value))}
                              className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-lg px-2 py-1 text-[11px] focus:outline-none focus:border-indigo-500 font-medium text-[var(--crm-text)]"
                            >
                              <option value="5">5 ★ Excellent</option>
                              <option value="4">4 ★ Good</option>
                              <option value="3">3 ★ Satisfactory</option>
                              <option value="2">2 ★ Needs Work</option>
                              <option value="1">1 ★ Unsatisfactory</option>
                            </select>
                          </div>

                          <textarea 
                            rows={2}
                            placeholder="Feedback comments..."
                            value={newReviewComments}
                            onChange={(e) => setNewReviewComments(e.target.value)}
                            className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-indigo-500 font-medium text-[var(--crm-text)] resize-none"
                          />

                          <button 
                            type="button"
                            onClick={handleAddReview}
                            className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-50 dark:bg-indigo-500/10 text-white font-medium rounded-lg text-xs cursor-pointer transition-colors shadow-xs"
                          >
                            Save Review Record
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>

              </div>
            </div>

            {/* Bottom Actions Footer */}
            <div className="p-5 border-t border-[var(--crm-card-border)] bg-[var(--crm-sidebar)] flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-xl transition-all cursor-pointer shadow-md hover:scale-102 active:scale-98"
              >
                Close Profile
              </button>
            </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--crm-card)] rounded-xl shadow-2xl border border-[var(--crm-card-border)] max-w-sm w-full overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200 text-[var(--crm-text)]">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-lg">
                  <Trash2 size={24} />
                </div>
                <h3 className="text-base font-semibold tracking-tight">Delete Team Member</h3>
              </div>
              <p className="text-xs text-[var(--crm-subtitle)] leading-relaxed">
                Are you sure you want to permanently delete the profile for <strong className="text-[var(--crm-text)] font-medium">"{memberToDelete.fullName}"</strong>? This will remove all their active assignments and contact logs.
              </p>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setMemberToDelete(null)}
                  className="px-4 py-2 bg-[var(--crm-sidebar)] hover:bg-slate-200 text-[var(--crm-text)] text-xs  rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={async () => {
                    setIsDeleting(true);
                    try {
                      const success = await onDeleteTeamMember(memberToDelete.id);
                      if (success !== false) {
                        setMemberToDelete(null);
                        if (selectedMember && selectedMember.id === memberToDelete.id) {
                          setSelectedMember(null);
                        }
                      }
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                  className={`px-4 py-2 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer ${isDeleting ? 'bg-rose-400 opacity-70 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700 dark:hover:bg-rose-500'}`}
                >
                  {isDeleting ? "Deleting..." : "Delete Profile"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Bulk Delete Confirmation Modal */}
      {showBulkDeleteMembersConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--crm-card)] rounded-xl shadow-2xl border border-[var(--crm-card-border)] max-w-sm w-full overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200 text-[var(--crm-text)]">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-lg">
                  <Trash2 size={24} />
                </div>
                <h3 className="text-base font-semibold tracking-tight">Bulk Delete Team Members</h3>
              </div>
              <p className="text-xs text-[var(--crm-subtitle)] leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-[var(--crm-text)] font-medium">{selectedMemberIds.length}</strong> selected team members? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkDeleteMembersConfirm(false)}
                  className="px-4 py-2 bg-[var(--crm-sidebar)] hover:bg-slate-200 text-[var(--crm-text)] text-xs  rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBulkDeleteMembers}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-50 dark:bg-rose-500/10 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-md shadow-rose-600/10"
                >
                  Delete Selected
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Custom Link Modal */}
      {showCustomLinkModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--crm-card)] rounded-xl shadow-2xl border border-[var(--crm-card-border)] max-w-sm w-full overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200 text-[var(--crm-text)] ">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (!customLinkName.trim() || !customLinkUrl.trim()) return;
                
                // Validate URL starting with http:// or https://
                let formattedUrl = customLinkUrl.trim();
                if (!/^https?:\/\//i.test(formattedUrl)) {
                  formattedUrl = 'https://' + formattedUrl;
                }

                if (editingCustomLinkId) {
                  setFormCustomLinks(prev => prev.map(l => l.id === editingCustomLinkId ? { ...l, name: customLinkName.trim(), url: formattedUrl } : l));
                } else {
                  setFormCustomLinks(prev => [...prev, { id: 'cl-' + Date.now(), name: customLinkName.trim(), url: formattedUrl }]);
                }
                setShowCustomLinkModal(false);
              }}
              className="p-6 space-y-4"
            >
              <div className="flex items-center gap-3 text-indigo-600">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg">
                  <Plus size={20} />
                </div>
                <h3 className="text-base font-semibold tracking-tight">
                  {editingCustomLinkId ? 'Edit Custom Link' : 'Add Custom Link'}
                </h3>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-[var(--crm-text-secondary)]   block">Link Name</label>
                  <input
                    type="text"
                    required
                    value={customLinkName}
                    onChange={(e) => setCustomLinkName(e.target.value)}
                    placeholder="e.g., GitHub, Portfolio, Twitter"
                    className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-zinc-900 font-medium text-[var(--crm-text)] "
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-[var(--crm-text-secondary)]   block">URL</label>
                  <input
                    type="text"
                    required
                    value={customLinkUrl}
                    onChange={(e) => setCustomLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-zinc-900 font-medium text-[var(--crm-text)] "
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomLinkModal(false)}
                  className="px-3.5 py-2 bg-[var(--crm-sidebar)] hover:bg-[var(--crm-sidebar-active-bg)] text-[var(--crm-text)] border border-[var(--crm-card-border)] text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  {editingCustomLinkId ? 'Save Link' : 'Add Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Notes & Updates Modal */}
      {activeTaskForNotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setActiveTaskForNotes(null)}
          />
          <div className="relative bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden z-10 text-[var(--crm-text)] p-6 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-[var(--crm-card-border)] pb-3">
              <h4 className="text-sm font-medium text-[var(--crm-text)] flex items-center gap-2">
                <MessageSquare size={16} className="text-indigo-600" /> Task Notes & Updates
              </h4>
              <button
                type="button"
                onClick={() => setActiveTaskForNotes(null)}
                className="text-[var(--crm-text-muted)] hover:text-[var(--crm-heading)] p-1 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-[var(--crm-sidebar)] p-3 rounded-xl border border-[var(--crm-card-border)]">
                <span className="text-[10px] font-semibold text-[var(--crm-text-muted)]   block">Assigned Task</span>
                <p className="text-xs  text-[var(--crm-text)] mt-0.5">{activeTaskForNotes.text}</p>
              </div>

              <form onSubmit={handleAddTaskNote} className="space-y-2">
                <label className="text-[10px] font-medium text-[var(--crm-text-secondary)]  ">Add Note or Update</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Type progress update or note..."
                    value={taskNoteInput}
                    onChange={(e) => setTaskNoteInput(e.target.value)}
                    className="flex-1 bg-[var(--crm-input-bg)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 text-xs font-medium text-[var(--crm-text)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
                  >
                    Add
                  </button>
                </div>
              </form>

              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-medium text-[var(--crm-text-muted)] block">Logged Notes ({activeTaskForNotes.notes?.length || 0})</span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {(!activeTaskForNotes.notes || activeTaskForNotes.notes.length === 0) ? (
                    <p className="text-[var(--crm-text-muted)] italic text-center py-6 text-xs">No notes or updates added yet.</p>
                  ) : (
                    activeTaskForNotes.notes.map(note => (
                      <div key={note.id} className="bg-[var(--crm-sidebar)] p-2.5 rounded-xl border border-[var(--crm-card-border)] space-y-1">
                        <p className="text-xs text-[var(--crm-text)] ">{note.text}</p>
                        <span className="text-[10px] font-medium text-[var(--crm-text-muted)] block text-right">
                          {new Date(note.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Member Long-Press / Context Action Menu Modal */}
      {actionMenuMember && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs" 
          onClick={() => setActionMenuMember(null)}
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
                  {actionMenuMember.teamMemberId || getMasterTeamMemberId(actionMenuMember)}
                </span>
                <h4 className="font-bold text-sm text-[var(--crm-heading)] truncate">
                  {actionMenuMember.fullName}
                </h4>
                <p className="text-[10px] text-[var(--crm-text-muted)] truncate uppercase tracking-wider font-semibold">
                  {actionMenuMember.role || 'Team Member'}
                </p>
              </div>
              <button 
                onClick={() => setActionMenuMember(null)} 
                className="p-1 text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] rounded-lg hover:bg-[var(--crm-sidebar)] transition-colors cursor-pointer shrink-0"
              >
                <X size={14} />
              </button>
            </div>

            <div className="py-1 space-y-0.5">
              <button 
                onClick={() => { 
                  const member = actionMenuMember;
                  setActionMenuMember(null); 
                  setSelectedMember(member); 
                }} 
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[var(--crm-sidebar-active-bg)] text-[var(--crm-text)] text-left cursor-pointer transition-colors font-medium"
              >
                <Eye size={15} className="text-indigo-500 shrink-0" />
                <div>
                  <span className="block text-xs font-semibold">Open / View Profile</span>
                  <span className="block text-[10px] text-[var(--crm-text-muted)]">Inspect team member details</span>
                </div>
              </button>

              <button 
                onClick={async () => { 
                  const member = actionMenuMember;
                  setActionMenuMember(null); 
                  await onUpdateTeamMember({
                    ...member,
                    status: 'Active',
                    updatedAt: new Date().toISOString()
                  } as any);
                }} 
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-left cursor-pointer transition-colors font-medium"
              >
                <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                <div>
                  <span className="block text-xs font-semibold">Set Status to Active</span>
                  <span className="block text-[10px] text-[var(--crm-text-muted)]">Keep member active on roster</span>
                </div>
              </button>

              <button 
                onClick={async () => { 
                  const member = actionMenuMember;
                  setActionMenuMember(null); 
                  await onUpdateTeamMember({
                    ...member,
                    status: 'Inactive',
                    updatedAt: new Date().toISOString()
                  } as any);
                }} 
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-left cursor-pointer transition-colors font-medium"
              >
                <XCircle size={15} className="text-amber-500 shrink-0" />
                <div>
                  <span className="block text-xs font-semibold">Set Status to Inactive</span>
                  <span className="block text-[10px] text-[var(--crm-text-muted)]">Mark member inactive</span>
                </div>
              </button>

              <button 
                onClick={async () => { 
                  const member = actionMenuMember;
                  setActionMenuMember(null); 
                  await onUpdateTeamMember({
                    ...member,
                    status: 'Archived',
                    updatedAt: new Date().toISOString()
                  } as any);
                }} 
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-left cursor-pointer transition-colors font-medium"
              >
                <Archive size={15} className="text-indigo-500 shrink-0" />
                <div>
                  <span className="block text-xs font-semibold">Archive Team Member</span>
                  <span className="block text-[10px] text-[var(--crm-text-muted)]">Move member to Central Archive</span>
                </div>
              </button>
            </div>

            <div className="border-t border-[var(--crm-card-border)] pt-1">
              <button 
                onClick={async () => { 
                  const member = actionMenuMember;
                  setActionMenuMember(null); 
                  if (window.confirm(`Are you sure you want to delete ${member.fullName}?`)) {
                    await onDeleteTeamMember(member.id);
                  }
                }} 
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-rose-500/10 text-rose-600 text-left cursor-pointer transition-colors font-medium"
              >
                <Trash2 size={15} className="text-rose-500 shrink-0" />
                <div>
                  <span className="block text-xs font-semibold">Delete Team Member</span>
                  <span className="block text-[10px] text-[var(--crm-text-muted)]">Permanently delete member record</span>
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
