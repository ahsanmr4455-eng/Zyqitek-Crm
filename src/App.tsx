import React, { useState, useEffect, useMemo, useCallback, useTransition } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lead, CallLog, Client, TeamMember, Goal, EmailDiscussion, CallDiscussion, ConversationDiscussion, Project, ProposalQuotation, PricingCatalog, PaymentDetails, CallScript, EmailScript, SupportTicket, Meeting, ClientPaymentRecord, TeamPaymentRecord } from './types';
import { DEFAULT_PRICING_CATALOG } from './data/defaultPricingCatalog';
import { DEFAULT_CALL_SCRIPTS, DEFAULT_EMAIL_SCRIPTS } from './data/defaultScripts';

// Import Screen Components
import Dashboard from './components/Dashboard';
import LeadManager from './components/LeadManager';
import ClientManager from './components/ClientManager';
import ArchiveManager from './components/ArchiveManager';
import GoalsView from './components/GoalsView';
import WebsiteView from './components/WebsiteView';
import SettingsView from './components/SettingsView';
import TeamManager from './components/TeamManager';
import Discussions from './components/Discussions';
import ProjectManagement from './components/ProjectManagement';
import ClientPortalManager from './components/ClientPortalManager';
import TeamPortalManager from './components/TeamPortalManager';
import PortalModule from './components/PortalModule';
import StandalonePortalGateway from './components/StandalonePortalGateway';
import PaymentsManager from './components/PaymentsManager';
import { parsePortalRoute } from './lib/portalRouter';
import { SecurityAccessModal } from './components/SecurityAccessModal';
import croppedChatIconImg from './assets/images/cropped_chat_icon_1788410283440.jpg';

// Custom Chat icon replacing MessageSquare in sidebar / portal section
function ChatIconComponent({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <img 
      src={croppedChatIconImg} 
      alt="Chat Logo" 
      className={`${className} object-contain rounded-[4px] bg-white border border-slate-200/50 p-0.5`} 
      style={{ width: size, height: size }}
      referrerPolicy="no-referrer"
    />
  );
}

import { 
  LayoutDashboard, 
  Users, 
  PhoneCall, 
  CheckCircle, 
  Target, 
  Globe, 
  Settings as SettingsIcon,
  Menu,
  X,
  Sparkles,
  ShieldCheck,
  Smartphone,
  LogOut,
  UserCheck,
  Cloud,
  RefreshCw,
  MessageSquare,
  MessageCircle,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Terminal,
  Briefcase,
  ExternalLink,
  Shield,
  ShieldAlert,
  AlertCircle,
  CheckSquare,
  Lock,
  CloudOff,
  CheckCircle2,
  DollarSign,
  Archive,
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';
import Login from './components/Login';
import AccessCodeScreen from './components/AccessCodeScreen';
import BrandedLoading from './components/BrandedLoading';
import ZyqroLogo from './components/ZyqroLogo';
import zyqitekLogoImg from './assets/images/zyqitek_logo_1784722857265.jpg';
import { 
  subscribeToCollection, 
  getCollectionOnce,
  saveToFirestore, 
  saveBatchToFirestore,
  deleteFromFirestore, 
  seedCollectionIfEmpty,
  testFirestoreConnection,
  syncAllCollectionsToFirestore,
  resetAllCrmData
} from './lib/firebaseSync';

export default function App() {
  // Mock localStorage to guarantee all operations are directed only to the MySQL backend
  const localStorage = {
    getItem: (..._args: any[]): any => null,
    setItem: (..._args: any[]): void => {},
    removeItem: (..._args: any[]): void => {},
    clear: (): void => {}
  };

  // Authentication State - MUST ALWAYS start false on every page load/refresh (Access Code required first)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [crmAccessGranted, setCrmAccessGranted] = useState<boolean>(false);
  const [currentPathState, setCurrentPathState] = useState<string>(() => typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '');

  // Theme State - Persisted in window.localStorage so it survives refreshes, restarts, and re-logins
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('zyqro_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('theme-switching');
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('zyqro_theme', theme);
    }
    const timer = setTimeout(() => {
      root.classList.remove('theme-switching');
    }, 350);
    return () => clearTimeout(timer);
  }, [theme]);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPathState(window.location.pathname.toLowerCase());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Session Security Cleanup & Event Listeners (Requirements 1, 2, 3, 8)
  useEffect(() => {
    // Note: sessionStorage naturally clears on tab/browser close.
    // Manual cleanup is handled in handleLogout.
  }, []);
  
  // Dynamic branded loading screen state on first login entry
  const [isBrandedLoading, setIsBrandedLoading] = useState<boolean>(false);

  // Tabs correspond exactly to sidebar items:
  // 'dashboard' | 'leads' | 'calling' | 'clients' | 'goals' | 'forms' | 'website' | 'settings'
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [leadsFullScreen, setLeadsFullScreen] = useState(false);
  
  // Responsive sidebar toggles for mobile viewports
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Requirements: Access code must be required on every reload/refresh/open
  useEffect(() => {
    // Hide the initial splash loader when React successfully mounts and begins rendering
    const loader = document.getElementById('initial-loader');
    if (loader) {
      loader.style.display = 'none';
    }
  }, []);

  // Dynamic title management & portal route detection
  const [detectedPortalRoute, setDetectedPortalRoute] = useState(() => parsePortalRoute());

  useEffect(() => {
    const handleLocationChange = () => {
      setDetectedPortalRoute(parsePortalRoute());
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);
  useEffect(() => {
    if (detectedPortalRoute) {
      if (detectedPortalRoute.type === 'client') {
        document.title = "Zyqitek Client Portal";
        return;
      } else if (detectedPortalRoute.type === 'team') {
        document.title = "Zyqitek Team Portal";
        return;
      }
    }

    if (!isLoggedIn) {
      document.title = "Zyqitek — Customer Relationship Management";
    } else {
      const titleMap: Record<string, string> = {
        dashboard: 'Dashboard | Zyqitek — Customer Relationship Management',
        leads: 'Leads | Zyqitek — Customer Relationship Management',
        clients: 'Clients | Zyqitek — Customer Relationship Management',
        discussions: 'Projects | Zyqitek — Customer Relationship Management',
        team: 'Team | Zyqitek — Customer Relationship Management',
        goals: 'Goals | Zyqitek — Customer Relationship Management',
        forms: 'Forms | Zyqitek — Customer Relationship Management',
        website: 'Website | Zyqitek — Customer Relationship Management',
        settings: 'Settings | Zyqitek — Customer Relationship Management'
      };
      
      const currentTitle = titleMap[activeTab] || 'Zyqitek — Customer Relationship Management';
      document.title = currentTitle;
    }
  }, [isLoggedIn, activeTab, detectedPortalRoute]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  };

  const generateUniqueId = (prefix: string): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `${prefix}-${timestamp}-${random}`;
  };

  const secureFetch = async (url: string, options: RequestInit = {}) => {
    const token = sessionStorage.getItem('zyqro_session_token') || '';
    const csrfToken = sessionStorage.getItem('zyqro_csrf_token') || '';
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      'Authorization': `Bearer ${token}`,
      'X-CSRF-Token': csrfToken
    } as any;

    const res = await fetch(url, {
      ...options,
      headers
    });

    if (res.status === 401) {
      sessionStorage.removeItem('zyqro_logged_in');
      sessionStorage.removeItem('zyqro_session_token');
      sessionStorage.removeItem('zyqro_csrf_token');
      sessionStorage.removeItem('zyqro_user_role');
      setIsLoggedIn(false);
      showToast("Your session has expired. Please sign in again.", "error");
    }

    return res;
  };

  // State hooks loaded dynamically from MySQL
  const [leads, setLeads] = useState<Lead[]>([]);
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientProfileId, setSelectedClientProfileId] = useState<string | null>(null);
  const [selectedLeadProfileId, setSelectedLeadProfileId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [clientPayments, setClientPayments] = useState<ClientPaymentRecord[]>([]);
  const [teamPayments, setTeamPayments] = useState<TeamPaymentRecord[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [emailDiscussions, setEmailDiscussions] = useState<EmailDiscussion[]>([]);
  const [callDiscussions, setCallDiscussions] = useState<CallDiscussion[]>([]);
  const [conversationDiscussions, setConversationDiscussions] = useState<ConversationDiscussion[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [callScripts, setCallScripts] = useState<CallScript[]>([]);
  const [emailScripts, setEmailScripts] = useState<EmailScript[]>([]);
  const [proposals, setProposals] = useState<ProposalQuotation[]>([]);
  const [pricingCatalog, setPricingCatalog] = useState<PricingCatalog>(DEFAULT_PRICING_CATALOG);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [discussionPrefill, setDiscussionPrefill] = useState<{
    leadName: string;
    company?: string;
    email?: string;
    phone?: string;
    leadId?: string;
    clientId?: string;
    service?: string;
    assignedTeamMember?: string;
    type: 'Email' | 'Call' | 'Conversation';
  } | null>(null);

  const [portalUrl, setPortalUrl] = useState<string>('https://dash.infinityfree.com/accounts');
  const [previewUrl, setPreviewUrl] = useState<string>('https://zyqrodigi.site.je');
  const [redirectUrl, setRedirectUrl] = useState<string>('https://zyqrodigi.site.je/thank-you');
  const [redirectEnabled, setRedirectEnabled] = useState<boolean>(true);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'Synced' | 'Syncing' | 'Unsynced' | 'Error'>('Synced');
  const [isAutoSyncPaused, setIsAutoSyncPaused] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [syncError, setSyncError] = useState<boolean>(false);

  // Compute client statistics and status dynamically based on projects in real-time
  const enrichedClients = useMemo(() => {
    return clients.map(client => {
      const clientProjects = projects.filter(p => p.clientId === client.id);
      let calculatedStatus: Client['status'] = 'No Active Project';

      if (clientProjects.length === 0) {
        calculatedStatus = 'No Active Project';
      } else {
        const allCompleted = clientProjects.every(p => p.status === 'Completed' || p.status === 'Delivered');
        if (allCompleted) {
          calculatedStatus = 'Project Completed';
        } else {
          calculatedStatus = 'Active';
        }
      }

      // Preserve explicit user-configured or Firestore-saved status if present, otherwise default to calculated status
      const finalStatus = client.status ? client.status : calculatedStatus;

      // Calculate weighted progress of projects
      const activeProjs = clientProjects.filter(p => p.status !== 'Completed' && p.status !== 'Delivered' && p.status !== 'Cancelled');
      const progress = clientProjects.length > 0 
        ? Math.round(clientProjects.reduce((sum, p) => sum + Number(p.projectProgress || 0), 0) / clientProjects.length)
        : 0;

      return {
        ...client,
        status: finalStatus,
        activeProjects: activeProjs.length,
        projectProgress: progress,
        totalValue: clientProjects.reduce((sum, p) => sum + Number(p.budget || p.totalProjectValue || 0), 0)
      };
    });
  }, [clients, projects]);

  // Compute consolidated team activity from multiple sources
  const teamActivity = useMemo(() => {
    const activities: any[] = [];
    
    // 1. Basic Call Logs (from Leads)
    calls.forEach(call => {
      activities.push({
        id: `call-${call.id}`,
        type: 'Call',
        description: `Logged a ${call.duration}s call with ${call.leadName}. Status: ${call.status}`,
        timestamp: call.timestamp,
        teamMember: 'Admin',
        leadId: call.leadId,
        leadName: call.leadName
      });
    });

    // 2. Email Discussions (from Clients)
    emailDiscussions.forEach(disc => {
      // Try to find clientId by name if not present
      const client = clients.find(c => c.company === disc.clientName || c.name === disc.clientName);
      activities.push({
        id: `email-${disc.id}`,
        type: 'Email',
        description: `${disc.direction} email: "${disc.subject}" to/from ${disc.clientName}`,
        timestamp: disc.date,
        teamMember: 'Admin',
        clientId: client?.id,
        clientName: disc.clientName
      });
    });

    // 3. Call Discussions (from Clients)
    callDiscussions.forEach(disc => {
      const client = clients.find(c => c.company === disc.clientName || c.name === disc.clientName);
      activities.push({
        id: `calldisc-${disc.id}`,
        type: 'Call Discussion',
        description: `Detailed call review with ${disc.clientName} (${disc.duration})`,
        timestamp: disc.callDate,
        teamMember: 'Admin',
        clientId: client?.id,
        clientName: disc.clientName
      });
    });

    // 4. Conversation Discussions (from Leads/Clients)
    conversationDiscussions.forEach(disc => {
      activities.push({
        id: `conv-${disc.id}`,
        type: 'Conversation',
        description: `Meeting notes: "${disc.discussionTitle}" for ${disc.leadName || disc.company}`,
        timestamp: disc.date,
        teamMember: disc.assignedTeamMember || 'Admin',
        leadId: disc.leadId,
        clientId: disc.clientId,
        leadName: disc.leadName
      });
    });

    // 5. Support Tickets
    supportTickets.forEach(ticket => {
      activities.push({
        id: `ticket-${ticket.id}`,
        type: 'Support',
        description: `Support ticket ${ticket.ticketNumber} status: ${ticket.status}`,
        timestamp: ticket.updatedAt || ticket.createdAt,
        teamMember: ticket.assignedMemberName || 'Admin',
        clientId: ticket.clientId,
        projectId: ticket.projectId
      });
    });

    // Sort by timestamp descending
    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [calls, emailDiscussions, callDiscussions, conversationDiscussions, supportTickets, clients]);

  // Primary Firebase Data Synchronizer
  const fetchData = async () => {
    try {
      setIsLoadingData(true);
      await testFirestoreConnection();
      
      // Read directly from Firebase collections
      const [
        fbLeads,
        fbCalls,
        fbClients,
        fbProjects,
        fbTeam,
        fbGoals,
        fbEmails,
        fbCallDisc,
        fbConvs,
        fbMeetings,
        fbSettings,
        fbProposals,
        fbCatalog,
        fbCallScripts,
        fbEmailScripts,
        fbSupportTickets,
        fbClientPayments,
        fbTeamPayments
      ] = await Promise.all([
        getCollectionOnce<Lead>('leads'),
        getCollectionOnce<CallLog>('calls'),
        getCollectionOnce<Client>('clients'),
        getCollectionOnce<Project>('projects'),
        getCollectionOnce<TeamMember>('team'),
        getCollectionOnce<Goal>('goals'),
        getCollectionOnce<EmailDiscussion>('emailDiscussions'),
        getCollectionOnce<CallDiscussion>('callDiscussions'),
        getCollectionOnce<ConversationDiscussion>('conversationDiscussions'),
        getCollectionOnce<Meeting>('meetings'),
        getCollectionOnce<any>('settings'),
        getCollectionOnce<ProposalQuotation>('proposals'),
        getCollectionOnce<any>('pricingCatalog'),
        getCollectionOnce<CallScript>('callScripts'),
        getCollectionOnce<EmailScript>('emailScripts'),
        getCollectionOnce<SupportTicket>('supportTickets'),
        getCollectionOnce<ClientPaymentRecord>('clientPayments'),
        getCollectionOnce<TeamPaymentRecord>('teamPayments')
      ]);

      setLeads(fbLeads);
      setCalls(fbCalls);
      setClients(fbClients);
      setProjects(fbProjects);
      setTeamMembers(fbTeam);
      setClientPayments(fbClientPayments);
      setTeamPayments(fbTeamPayments);
      setGoals(fbGoals);
      setEmailDiscussions(fbEmails);
      setCallDiscussions(fbCallDisc);
      setConversationDiscussions(fbConvs);
      setMeetings(fbMeetings);
      setSupportTickets(fbSupportTickets);

      // Call Scripts
      if (Array.isArray(fbCallScripts)) {
        setCallScripts(fbCallScripts);
      }

      // Email Scripts
      if (Array.isArray(fbEmailScripts)) {
        setEmailScripts(fbEmailScripts);
      }
      if (fbProposals && fbProposals.length > 0) {
        setProposals(fbProposals);
      }
      if (fbCatalog && fbCatalog.length > 0) {
        const found = fbCatalog.find((c: any) => c.id === 'default') || fbCatalog[0];
        if (found && found.categories) {
          setPricingCatalog(found);
        }
      }

      if (fbSettings && fbSettings.length > 0) {
        const general = fbSettings.find((s: any) => s.id === 'general') || fbSettings[0];
        if (general.portalUrl) setPortalUrl(general.portalUrl);
        if (general.previewUrl) setPreviewUrl(general.previewUrl);
        if (general.redirectUrl) setRedirectUrl(general.redirectUrl);
        if (general.redirectEnabled !== undefined) setRedirectEnabled(general.redirectEnabled);

        const paymentDoc = fbSettings.find((s: any) => s.id === 'paymentDetails');
        if (paymentDoc) {
          setPaymentDetails(paymentDoc);
        }
      }

      setSyncError(false);
      setSyncStatus('Synced');
      setLastSyncTime(new Date());
    } catch (err) {
      console.warn('Firebase connection check:', err);
      setSyncError(true);
      setSyncStatus('Error');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSyncToCloud = async () => {
    try {
      setSyncStatus('Syncing');
      setIsAutoSyncPaused(false);
      showToast("Syncing local changes to Firestore...", "success");

      const isConnected = await testFirestoreConnection();
      
      const uploadSuccess = await syncAllCollectionsToFirestore({
        leads,
        calls,
        clients,
        projects,
        team: teamMembers,
        goals,
        emailDiscussions,
        callDiscussions,
        conversationDiscussions,
        settings: {
          portalUrl,
          previewUrl,
          redirectUrl,
          redirectEnabled,
          updatedAt: new Date().toISOString()
        }
      });
      await fetchData();

      

      if (isConnected && uploadSuccess) {
        setSyncStatus('Synced');
        setLastSyncTime(new Date());
        showToast("Cloud synchronization completed successfully!", "success");
      } else if (isConnected) {
        setSyncStatus('Synced');
        setLastSyncTime(new Date());
        showToast("Synchronized with Firestore cloud storage.", "success");
      } else {
        setSyncStatus('Error');
        showToast("Sync warning: Could not reach Firestore cloud database.", "error");
      }
    } catch (err) {
      console.error("Error during manual sync:", err);
      setSyncStatus('Error');
      showToast("Sync failed: Check network connection.", "error");
    }
  };

  const handleUnsync = () => {
    setIsAutoSyncPaused(true);
    setSyncStatus('Unsynced');
    showToast("Real-time cloud synchronization paused.", "success");
  };

  // Real-time active synchronizer triggers & Firebase listeners
  useEffect(() => {
    if (!isLoggedIn || isAutoSyncPaused) return;

    // First full load from Firebase
    fetchData();

    // Subscribe to Firebase Firestore real-time snapshot updates
    const unsubLeads = subscribeToCollection<Lead>('leads', items => setLeads(items));
    const unsubCalls = subscribeToCollection<CallLog>('calls', items => setCalls(items));
    const unsubClients = subscribeToCollection<Client>('clients', items => setClients(items));
    const unsubProjects = subscribeToCollection<Project>('projects', items => setProjects(items));
    const unsubTeam = subscribeToCollection<TeamMember>('team', items => setTeamMembers(items));
    const unsubGoals = subscribeToCollection<Goal>('goals', items => setGoals(items));
    const unsubEmails = subscribeToCollection<EmailDiscussion>('emailDiscussions', items => setEmailDiscussions(items));
    const unsubCallDisc = subscribeToCollection<CallDiscussion>('callDiscussions', items => setCallDiscussions(items));
    const unsubConvs = subscribeToCollection<ConversationDiscussion>('conversationDiscussions', items => setConversationDiscussions(items));
    const unsubMeetings = subscribeToCollection<Meeting>('meetings', items => setMeetings(items));
    const unsubSupportTickets = subscribeToCollection<SupportTicket>('supportTickets', items => setSupportTickets(items));
    const unsubClientPayments = subscribeToCollection<ClientPaymentRecord>('clientPayments', items => setClientPayments(items));
    const unsubTeamPayments = subscribeToCollection<TeamPaymentRecord>('teamPayments', items => setTeamPayments(items));
    const unsubCallScripts = subscribeToCollection<CallScript>('callScripts', items => {
      if (items && items.length > 0) setCallScripts(items);
    });
    const unsubEmailScripts = subscribeToCollection<EmailScript>('emailScripts', items => {
      if (items && items.length > 0) setEmailScripts(items);
    });

    return () => {
      unsubLeads();
      unsubCalls();
      unsubClients();
      unsubProjects();
      unsubTeam();
      unsubGoals();
      unsubEmails();
      unsubCallDisc();
      unsubConvs();
      unsubMeetings();
      unsubSupportTickets();
      unsubClientPayments();
      unsubTeamPayments();
      unsubCallScripts();
      unsubEmailScripts();
    };
  }, [isLoggedIn, isAutoSyncPaused]);

  const handleUpdateWebResponseRedirectSettings = async (url: string, enabled: boolean) => {
    setRedirectUrl(url);
    setRedirectEnabled(enabled);

    try {
      await saveToFirestore('settings', 'general', {
        portalUrl,
        previewUrl,
        redirectUrl: url,
        redirectEnabled: enabled,
        updatedAt: new Date().toISOString()
      });
      showToast("Web response redirect settings saved successfully.", "success");
    } catch (err) {
      showToast("Failed to save settings to Firebase.", "error");
    }
  };

  const handleUpdateRedirectUrls = async (newPortal: string, newPreview: string, newRedirect?: string) => {
    if (newPortal) setPortalUrl(newPortal);
    if (newPreview) setPreviewUrl(newPreview);
    if (newRedirect !== undefined) setRedirectUrl(newRedirect);

    try {
      await saveToFirestore('settings', 'general', {
        portalUrl: newPortal || portalUrl,
        previewUrl: newPreview || previewUrl,
        redirectUrl: newRedirect !== undefined ? newRedirect : redirectUrl,
        redirectEnabled,
        updatedAt: new Date().toISOString()
      });
      showToast("Redirect settings saved successfully.", "success");
    } catch (err) {
      showToast("Failed to save settings to Firebase.", "error");
    }
  };

  const handleUpdatePaymentDetails = async (updatedDetails: PaymentDetails): Promise<boolean> => {
    setPaymentDetails(updatedDetails);
    try {
      await saveToFirestore('settings', 'paymentDetails', {
        ...updatedDetails,
        id: 'paymentDetails',
        updatedAt: new Date().toISOString()
      });
      showToast("Payment details saved successfully.", "success");
      return true;
    } catch (err) {
      showToast("Failed to save payment details to Firebase.", "error");
      return false;
    }
  };

  const handleLogin = async (token?: string, csrfToken?: string, role?: string, skipBrandedLoading: boolean = false, firebaseToken?: string) => {
    sessionStorage.setItem('zyqro_logged_in', 'true');
    if (token) {
      sessionStorage.setItem('zyqro_session_token', token);
      document.cookie = `zyqro_session_token=${token}; path=/; max-age=86400; SameSite=None; Secure`;
    }
    if (csrfToken) {
      sessionStorage.setItem('zyqro_csrf_token', csrfToken);
    }
    if (role) {
      sessionStorage.setItem('zyqro_user_role', role);
    }

    // Removed debug log

    if (!skipBrandedLoading) {
      setIsBrandedLoading(true);
    } else {
      setIsBrandedLoading(false);
    }
    setIsLoggedIn(true);
    if (!skipBrandedLoading) {
      showToast("Signed in successfully.", "success");
    }
    
  };

  const handleLogout = () => {
    sessionStorage.removeItem('zyqro_logged_in');
    sessionStorage.removeItem('zyqro_session_token');
    sessionStorage.removeItem('zyqro_csrf_token');
    sessionStorage.removeItem('zyqro_user_role');
    sessionStorage.removeItem('zyqro_firebase_token');
    sessionStorage.removeItem('zyqro_crm_access_granted');
    sessionStorage.clear();
    document.cookie = "zyqro_session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure";
    setIsLoggedIn(false);
    setCrmAccessGranted(false);
    showToast("Signed out successfully.", "success");
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      console.warn("Zyqro: Received unauthorized 401 event, signing out.");
      handleLogout();
    };
    window.addEventListener('zyqro-unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('zyqro-unauthorized', handleUnauthorized);
    };
  }, []);

  const handleAddEmailDiscussion = async (newDisc: Omit<EmailDiscussion, 'id'>): Promise<boolean> => {
    try {
      const savedItem = { ...newDisc, id: `email-disc-${Date.now()}` };
      await saveToFirestore('emailDiscussions', savedItem.id, savedItem);
      setEmailDiscussions(prev => [savedItem, ...prev]);
      showToast("Email discussion saved successfully.", "success");
      secureFetch('/api/add_email_discussion.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDisc)
      }).catch(console.warn);
      
      return true;
    } catch (err) {
      showToast("Failed to save email discussion.", "error");
      return false;
    }
  };

  const handleDeleteEmailDiscussion = async (id: string) => {
    try {
      await deleteFromFirestore('emailDiscussions', id);
      const updated = emailDiscussions.filter(e => e.id !== id);
      setEmailDiscussions(updated);
      showToast("Email discussion record deleted.");
      secureFetch('/api/delete_email_discussion.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      }).catch(console.warn);
      
    } catch (err) {
      showToast("Failed to delete email record.", "error");
    }
  };

  const handleAddCallDiscussion = async (newDisc: Omit<CallDiscussion, 'id'>): Promise<boolean> => {
    try {
      const savedItem = { ...newDisc, id: `call-disc-${Date.now()}` };
      await saveToFirestore('callDiscussions', savedItem.id, savedItem);
      setCallDiscussions(prev => [savedItem, ...prev]);
      showToast("Call discussion record logged.", "success");
      secureFetch('/api/add_call_discussion.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDisc)
      }).catch(console.warn);
      
      return true;
    } catch (err) {
      showToast("Failed to log call discussion.", "error");
      return false;
    }
  };

  const handleDeleteCallDiscussion = async (id: string) => {
    try {
      await deleteFromFirestore('callDiscussions', id);
      const updated = callDiscussions.filter(c => c.id !== id);
      setCallDiscussions(updated);
      showToast("Call discussion record deleted.");
      secureFetch('/api/delete_call_discussion.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      }).catch(console.warn);
      
    } catch (err) {
      showToast("Failed to delete call record.", "error");
    }
  };

  const handleAddConversationDiscussion = async (newDisc: Omit<ConversationDiscussion, 'id'>): Promise<boolean> => {
    try {
      const savedItem = { ...newDisc, id: `disc-conv-${Date.now()}` };
      await saveToFirestore('conversationDiscussions', savedItem.id, savedItem);
      setConversationDiscussions(prev => [savedItem, ...prev]);
      showToast("Conversation record saved successfully.", "success");
      secureFetch('/api/add_conversation_discussion.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDisc)
      }).catch(console.warn);
      
      return true;
    } catch (err) {
      showToast("Failed to save conversation.", "error");
      return false;
    }
  };

  const handleDeleteConversationDiscussion = async (id: string) => {
    try {
      await deleteFromFirestore('conversationDiscussions', id);
      const updated = conversationDiscussions.filter(c => c.id !== id);
      setConversationDiscussions(updated);
      showToast("Conversation record deleted.");
      secureFetch('/api/delete_conversation_discussion.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      }).catch(console.warn);
      
    } catch (err) {
      showToast("Failed to delete conversation record.", "error");
    }
  };

  const handleDeleteMultipleConversations = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => deleteFromFirestore('conversationDiscussions', id)));
      const updated = conversationDiscussions.filter(c => !ids.includes(c.id));
      setConversationDiscussions(updated);
      showToast(`${ids.length} conversation records permanently deleted in bulk.`);
      secureFetch('/api/delete_conversation_discussion.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      }).catch(console.warn);
      
    } catch (err) {
      showToast("Failed to delete bulk conversation records.", "error");
    }
  };

  const handleAddMeeting = async (newMeeting: Omit<Meeting, 'id'>): Promise<boolean> => {
    try {
      const savedItem = { ...newMeeting, id: `meeting-${Date.now()}` };
      await saveToFirestore('meetings', savedItem.id, savedItem);
      setMeetings(prev => [savedItem, ...prev]);
      showToast("Meeting scheduled successfully.", "success");
      return true;
    } catch (err) {
      showToast("Failed to schedule meeting.", "error");
      return false;
    }
  };

  const handleUpdateMeeting = async (meeting: Meeting): Promise<boolean> => {
    try {
      await saveToFirestore('meetings', meeting.id, meeting);
      setMeetings(prev => prev.map(m => m.id === meeting.id ? meeting : m));
      showToast("Meeting updated successfully.", "success");
      return true;
    } catch (err) {
      showToast("Failed to update meeting.", "error");
      return false;
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    try {
      await deleteFromFirestore('meetings', id);
      setMeetings(prev => prev.filter(m => m.id !== id));
      showToast("Meeting deleted.");
    } catch (err) {
      showToast("Failed to delete meeting.", "error");
    }
  };

  // Call Scripts Handlers
  const handleAddCallScript = async (script: Omit<CallScript, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      const now = new Date().toISOString();
      const newScript: CallScript = {
        ...script,
        id: `CS-${Date.now()}`,
        createdAt: now,
        updatedAt: now
      };
      await saveToFirestore('callScripts', newScript.id, newScript);
      setCallScripts(prev => [newScript, ...prev]);
      showToast("Call script created successfully.", "success");
      return true;
    } catch (err) {
      showToast("Failed to create call script.", "error");
      return false;
    }
  };

  const handleUpdateCallScript = async (updatedScript: CallScript): Promise<boolean> => {
    try {
      await saveToFirestore('callScripts', updatedScript.id, updatedScript);
      setCallScripts(prev => prev.map(s => s.id === updatedScript.id ? updatedScript : s));
      showToast("Call script updated successfully.", "success");
      return true;
    } catch (err) {
      showToast("Failed to update call script.", "error");
      return false;
    }
  };

  const handleDeleteCallScript = async (id: string): Promise<boolean> => {
    try {
      await deleteFromFirestore('callScripts', id);
      setCallScripts(prev => prev.filter(s => s.id !== id));
      showToast("Call script deleted.", "success");
      return true;
    } catch (err) {
      showToast("Failed to delete call script.", "error");
      return false;
    }
  };

  const handleDuplicateCallScript = async (script: CallScript): Promise<boolean> => {
    try {
      const now = new Date().toISOString();
      const duplicatedScript: CallScript = {
        ...script,
        id: `CS-${Date.now()}`,
        title: `${script.title} (Copy)`,
        createdAt: now,
        updatedAt: now
      };
      await saveToFirestore('callScripts', duplicatedScript.id, duplicatedScript);
      setCallScripts(prev => [duplicatedScript, ...prev]);
      showToast("Call script duplicated successfully.", "success");
      return true;
    } catch (err) {
      showToast("Failed to duplicate call script.", "error");
      return false;
    }
  };

  // Email Scripts Handlers
  const handleAddEmailScript = async (script: Omit<EmailScript, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      const now = new Date().toISOString();
      const newScript: EmailScript = {
        ...script,
        id: `ES-${Date.now()}`,
        createdAt: now,
        updatedAt: now
      };
      await saveToFirestore('emailScripts', newScript.id, newScript);
      setEmailScripts(prev => [newScript, ...prev]);
      showToast("Email template created successfully.", "success");
      return true;
    } catch (err) {
      showToast("Failed to create email template.", "error");
      return false;
    }
  };

  const handleUpdateEmailScript = async (updatedScript: EmailScript): Promise<boolean> => {
    try {
      await saveToFirestore('emailScripts', updatedScript.id, updatedScript);
      setEmailScripts(prev => prev.map(s => s.id === updatedScript.id ? updatedScript : s));
      showToast("Email template updated successfully.", "success");
      return true;
    } catch (err) {
      showToast("Failed to update email template.", "error");
      return false;
    }
  };

  const handleDeleteEmailScript = async (id: string): Promise<boolean> => {
    try {
      await deleteFromFirestore('emailScripts', id);
      setEmailScripts(prev => prev.filter(s => s.id !== id));
      showToast("Email template deleted.", "success");
      return true;
    } catch (err) {
      showToast("Failed to delete email template.", "error");
      return false;
    }
  };

  const handleDuplicateEmailScript = async (script: EmailScript): Promise<boolean> => {
    try {
      const now = new Date().toISOString();
      const duplicatedScript: EmailScript = {
        ...script,
        id: `ES-${Date.now()}`,
        templateName: `${script.templateName} (Copy)`,
        createdAt: now,
        updatedAt: now
      };
      await saveToFirestore('emailScripts', duplicatedScript.id, duplicatedScript);
      setEmailScripts(prev => [duplicatedScript, ...prev]);
      showToast("Email template duplicated successfully.", "success");
      return true;
    } catch (err) {
      showToast("Failed to duplicate email template.", "error");
      return false;
    }
  };

  const handleResetData = async (): Promise<boolean> => {
    try {
      showToast("Resetting all CRM database records...", "success");
      const success = await resetAllCrmData();
      if (success) {
        setLeads([]);
        setCalls([]);
        setClients([]);
        setProjects([]);
        setTeamMembers([]);
        setGoals([]);
        setEmailDiscussions([]);
        setCallDiscussions([]);
        setConversationDiscussions([]);
        setCallScripts([]);
        setEmailScripts([]);
        setProposals([]);
        setSelectedClientProfileId(null);
        setSelectedLeadProfileId(null);
        showToast("All CRM data has been permanently deleted.", "success");
        await fetchData();
        return true;
      } else {
        showToast("Failed to reset CRM data. Please try again.", "error");
        return false;
      }
    } catch (err) {
      console.error("Error resetting CRM data:", err);
      showToast("Failed to reset CRM data.", "error");
      return false;
    }
  };

  // Auto trigger lead add modal
  const [triggerAddForm, setTriggerAddForm] = useState(false);

  // Actions
  const handleAddLead = async (newLead: Omit<Lead, 'createdAt' | 'updatedAt'> & { id?: string }): Promise<boolean> => {
    const tempId = newLead.id ? newLead.id.trim() : generateUniqueId('lead');
    const localItem: Lead = {
      name: newLead.name || '',
      email: newLead.email || '',
      phone: newLead.phone || '',
      company: newLead.company || '',
      status: newLead.status || 'New',
      value: newLead.value || 0,
      source: newLead.source || 'Direct',
      notes: newLead.notes || '',
      ...newLead,
      id: tempId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await saveToFirestore('leads', localItem.id, localItem);
      secureFetch('/api/add_lead.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localItem)
      }).catch(console.warn);

      const updated = [localItem, ...leads];
      setLeads(updated);
      showToast(`Lead "${newLead.name}" added successfully.`, 'success');
      
      return true;
    } catch (err) {
      showToast(`Failed to save lead "${newLead.name}".`, 'error');
      return false;
    }
  };

  const handleBulkImportLeads = async (leadsToImport: any[]): Promise<{
    success: boolean;
    total: number;
    imported: number;
    failed: number;
    duplicates: number;
    error?: string;
  }> => {
    console.log("=== CSV Import Process Started ===");
    console.log(`[CSV loaded] Total candidate lead records received: ${leadsToImport?.length || 0}`);

    if (!Array.isArray(leadsToImport) || leadsToImport.length === 0) {
      console.error("[CSV Import Error] No lead records provided to import.");
      return {
        success: false,
        total: 0,
        imported: 0,
        failed: 0,
        duplicates: 0,
        error: "No lead records to import"
      };
    }

    try {
      let importedCount = 0;
      let duplicateCount = 0;
      let failedCount = 0;

      const normalizePhone = (phone?: string) => (phone || '').replace(/\D/g, '').trim();
      const normalizeText = (txt?: string) => (txt || '').toLowerCase().replace(/\s+/g, ' ').trim();

      const existingLeadIds = new Set(leads.map(l => l.id));
      const existingEmails = new Set(leads.map(l => normalizeText(l.email)).filter(Boolean));
      const existingPhones = new Set(leads.map(l => normalizePhone(l.phone)).filter(Boolean));
      const existingNameCompany = new Set(leads.map(l => `${normalizeText(l.name)}|${normalizeText(l.company)}`).filter(Boolean));
      const existingPlaceIds = new Set(leads.map(l => l.customFields?.placeId || l.customFields?.googlePlaceId).filter(Boolean).map(String));

      // Batch tracking for intra-batch duplicate prevention
      const batchLeadIds = new Set<string>();
      const batchEmails = new Set<string>();
      const batchPhones = new Set<string>();
      const batchNameCompany = new Set<string>();
      const batchPlaceIds = new Set<string>();

      console.log(`[Rows parsed] Validating ${leadsToImport.length} parsed CSV/Places rows against ${leads.length} existing CRM leads...`);

      const newLeadsToInsert: Lead[] = [];

      for (let idx = 0; idx < leadsToImport.length; idx++) {
        const item = leadsToImport[idx];
        const cleanName = (
          item.name || 
          item.company || 
          (item.email ? item.email.split('@')[0] : '') || 
          (item.phone ? `Lead (${item.phone})` : '') ||
          ''
        ).trim();

        if (!cleanName && !item.email && !item.phone && !item.company) {
          console.warn(`[Validation failed] Row #${idx + 1} completely empty or missing identifying fields:`, item);
          failedCount++;
          continue;
        }

        const fallbackName = cleanName || `Imported Lead ${idx + 1}`;
        const cleanLeadId = item.id?.trim();
        const cleanEmail = normalizeText(item.email);
        const cleanPhone = normalizePhone(item.phone);
        const cleanCompany = normalizeText(item.company);
        const itemPlaceId = item.customFields?.placeId || item.customFields?.googlePlaceId ? String(item.customFields?.placeId || item.customFields?.googlePlaceId) : null;
        const nameCompanyKey = `${normalizeText(fallbackName)}|${cleanCompany}`;

        const isDuplicate = 
          (itemPlaceId && (existingPlaceIds.has(itemPlaceId) || batchPlaceIds.has(itemPlaceId))) ||
          (cleanLeadId && (existingLeadIds.has(cleanLeadId) || batchLeadIds.has(cleanLeadId))) ||
          (cleanEmail && (existingEmails.has(cleanEmail) || batchEmails.has(cleanEmail))) ||
          (cleanPhone && (existingPhones.has(cleanPhone) || batchPhones.has(cleanPhone))) ||
          (!cleanEmail && !cleanPhone && (existingNameCompany.has(nameCompanyKey) || batchNameCompany.has(nameCompanyKey)));

        if (isDuplicate) {
          console.log(`[Duplicate skipped] Row #${idx + 1} lead already exists in CRM or batch: ${fallbackName} (${cleanEmail || cleanPhone || itemPlaceId})`);
          duplicateCount++;
          continue;
        }

        if (cleanLeadId) batchLeadIds.add(cleanLeadId);
        if (cleanEmail) batchEmails.add(cleanEmail);
        if (cleanPhone) batchPhones.add(cleanPhone);
        if (itemPlaceId) batchPlaceIds.add(itemPlaceId);
        batchNameCompany.add(nameCompanyKey);

        const newId = cleanLeadId || ('lead-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7) + '-' + idx);
        const nowIso = new Date().toISOString();

        const newLeadItem: Lead = {
          ...item,
          id: newId,
          name: fallbackName,
          email: item.email?.trim() || '',
          phone: item.phone?.trim() || '',
          company: item.company || '',
          status: item.status || 'New',
          value: typeof item.value === 'number' ? item.value : (Number(String(item.value || '').replace(/[^0-9.]/g, '')) || 5000),
          source: item.source || 'CSV Import',
          category: item.category || 'Other',
          notes: item.notes || 'Imported via CSV file.',
          country: item.country || '',
          websiteUrl: item.websiteUrl || '',
          customFields: item.customFields || {},
          createdAt: nowIso,
          updatedAt: nowIso
        };

        newLeadsToInsert.push(newLeadItem);
        importedCount++;

        existingLeadIds.add(newLeadItem.id);
        if (cleanEmail) existingEmails.add(cleanEmail);
        if (cleanPhone) existingPhones.add(cleanPhone);
        existingNameCompany.add(nameCompanyKey);
      }

      console.log(`[Valid rows] Successfully processed ${newLeadsToInsert.length} leads for persistence.`);

      if (newLeadsToInsert.length > 0) {
        // Save batch to database/localStorage persistence
        await saveBatchToFirestore('leads', newLeadsToInsert);
        setLeads(prev => [...newLeadsToInsert, ...prev]);
        showToast(`CSV Import completed: ${importedCount} leads added successfully.`, 'success');
      } else if (duplicateCount > 0 && importedCount === 0) {
        showToast(`CSV Import result: ${duplicateCount} duplicate lead(s) skipped.`, 'success');
      } else if (failedCount > 0 && importedCount === 0) {
        showToast(`CSV Import failed: ${failedCount} rows contained invalid or missing fields.`, 'error');
      }

      // Also trigger background server sync notice if available
      if (newLeadsToInsert.length > 0) {
        secureFetch('/api/bulk_import_leads.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leads: newLeadsToInsert })
        }).catch(err => console.warn("Background API sync notice warning:", err));
      }

      return {
        success: importedCount > 0,
        total: leadsToImport.length,
        imported: importedCount,
        failed: failedCount,
        duplicates: duplicateCount
      };
    } catch (importErr: any) {
      console.error("[CSV Import Fatal Error]:", importErr);
      showToast(`CSV Import error: ${importErr?.message || "Firestore or network error"}`, 'error');
      return {
        success: false,
        total: leadsToImport.length,
        imported: 0,
        failed: leadsToImport.length,
        duplicates: 0,
        error: importErr?.message || "Import failure"
      };
    }
  };

  const handleUpdateLead = async (updatedLead: Lead): Promise<boolean> => {
    try {
      await saveToFirestore('leads', updatedLead.id, updatedLead);
      secureFetch('/api/update_lead.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedLead)
      }).catch(console.warn);

      const updated = leads.map(l => l.id === updatedLead.id ? updatedLead : l);
      setLeads(updated);
      showToast(`Lead "${updatedLead.name}" updated successfully.`, 'success');
      
      // Automatically convert to client when status shifts to Closed
      if (updatedLead.status === 'Closed') {
        const clientExists = clients.some(c => c.email === updatedLead.email);
        if (!clientExists) {
          const client: Omit<Client, 'id'> = {
            name: updatedLead.name,
            email: updatedLead.email,
            phone: updatedLead.phone,
            company: updatedLead.company,
            activeProjects: 0,
            totalValue: 0,
            status: 'No Active Project',
            projectProgress: 0,
            notes: `Project generated from closed-won pipeline lead. ${updatedLead.notes}`
          };
          handleAddClient(client);
        } else {
          
        }
      } else {
        
      }
      return true;
    } catch (err) {
      showToast(`Failed to update lead.`, 'error');
      return false;
    }
  };

  const handleDeleteLead = async (id: string): Promise<boolean> => {
    const leadToDelete = leads.find(l => l.id === id);
    const name = leadToDelete ? leadToDelete.name : "Lead";

    try {
      await deleteFromFirestore('leads', id);
      const updated = leads.filter(l => l.id !== id);
      setLeads(updated);
      showToast(`Lead "${name}" permanently deleted.`);
      secureFetch('/api/delete_lead.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      }).catch(console.warn);
      return true;
    } catch (err) {
      showToast(`Failed to delete lead.`, 'error');
      return false;
    }
  };

  const handleConvertLeadToClient = async (leadIdOrIds: string | string[]): Promise<boolean> => {
    const ids = Array.isArray(leadIdOrIds) ? leadIdOrIds : [leadIdOrIds];
    if (ids.length === 0) return false;

    // Filter valid lead objects from current state
    const targetLeads = leads.filter(l => ids.includes(l.id));
    if (targetLeads.length === 0) {
      showToast(ids.length === 1 ? "Lead not found." : "No valid leads found for conversion.", "error");
      return false;
    }

    try {
      const normalizeText = (txt?: string) => (txt || '').toLowerCase().trim();
      const normalizePhone = (p?: string) => (p || '').replace(/\D/g, '');

      // Process conversion tasks concurrently using Promise.all for near-instant performance
      const conversionPromises = targetLeads.map(async (lead) => {
        const leadEmail = normalizeText(lead.email);
        const leadPhone = normalizePhone(lead.phone);

        // Individual record validation & duplicate protection check against existing clients
        const existingClient = clients.find(c => {
          if (c.id === `client-${lead.id}` || c.id === lead.id) return true;
          if (leadEmail && normalizeText(c.email) === leadEmail) return true;
          if (leadPhone && normalizePhone(c.phone) === leadPhone && leadPhone.length >= 7) return true;
          return false;
        });

        const targetClientId = existingClient 
          ? existingClient.id 
          : lead.id;

        const clientData: Client = {
          id: targetClientId,
          masterClientId: lead.id,
          name: (lead.name || 'Unassigned Lead').trim(),
          email: (lead.email || '').trim(),
          phone: (lead.phone || '').trim(),
          company: (lead.company || '').trim(),
          activeProjects: existingClient ? (existingClient.activeProjects || 1) : 1,
          totalValue: typeof lead.value === 'number' && !isNaN(lead.value) && lead.value > 0 
            ? lead.value 
            : (existingClient?.totalValue || 0),
          status: existingClient ? existingClient.status : 'Active',
          projectProgress: existingClient ? (existingClient.projectProgress || 0) : 0,
          serviceType: lead.category || (existingClient?.serviceType || 'General Service'),
          notes: lead.notes 
            ? `${existingClient?.notes ? existingClient.notes + '\n\n' : ''}[Converted from Lead]: ${lead.notes}` 
            : (existingClient?.notes || ''),
          country: lead.country || (existingClient?.country || ''),
          assignedTeamMember: lead.assignedTeamMember || (existingClient?.assignedTeamMember || ''),
          role: lead.role || (existingClient?.role || ''),
          createdAt: existingClient?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          instagramLink: lead.instagramLink || (existingClient?.instagramLink || ''),
          facebookLink: lead.facebookLink || (existingClient?.facebookLink || ''),
          linkedinLink: lead.linkedinLink || (existingClient?.linkedinLink || ''),
          websiteUrl: lead.websiteUrl || (existingClient?.websiteUrl || ''),
          otherLink: lead.otherLink || (existingClient?.otherLink || ''),
          customLinks: existingClient?.customLinks || '',
          smmPlatformName: lead.smmPlatformName || (existingClient?.smmPlatformName || ''),
          smmPlannedPosts: typeof lead.smmPlannedPosts === 'number' && !isNaN(lead.smmPlannedPosts) 
            ? lead.smmPlannedPosts 
            : (existingClient?.smmPlannedPosts || 0),
          smmPostingFrequency: lead.smmPostingFrequency || (existingClient?.smmPostingFrequency || ''),
          smmContentNotes: lead.smmContentNotes || (existingClient?.smmContentNotes || ''),
          smmCampaignRequirements: lead.smmCampaignRequirements || (existingClient?.smmCampaignRequirements || '')
        };

        // Save Client to Firestore (primary cloud database)
        const clientSaved = await saveToFirestore('clients', clientData.id, clientData);
        if (!clientSaved) {
          return { success: false, lead, clientData: null, isExistingClient: false };
        }

        // Secondary MySQL API endpoint (non-blocking)
        secureFetch('/api/add_client.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(clientData)
        }).catch(console.warn);

        // Confirm Client creation BEFORE removing Lead from Firestore
        await deleteFromFirestore('leads', lead.id);
        secureFetch('/api/delete_lead.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: lead.id })
        }).catch(console.warn);

        return {
          success: true,
          lead,
          clientData,
          isExistingClient: !!existingClient
        };
      });

      // Execute conversions in parallel using Promise.all
      const results = await Promise.all(conversionPromises);

      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      if (successful.length > 0) {
        const newClients = successful.map(r => r.clientData!);
        const convertedLeadIds = new Set(successful.map(r => r.lead!.id));

        // Batch update Clients state & localStorage
        setClients(prev => {
          let updated = [...prev];
          for (const newClient of newClients) {
            const idx = updated.findIndex(c => c.id === newClient.id);
            if (idx >= 0) {
              updated[idx] = newClient;
            } else {
              updated.unshift(newClient);
            }
          }
          localStorage.setItem('zyqro_clients', JSON.stringify(updated));
          return updated;
        });

        // Batch update Leads state & localStorage so converted leads disappear instantly
        setLeads(prev => {
          const updated = prev.filter(l => !convertedLeadIds.has(l.id));
          localStorage.setItem('zyqro_leads', JSON.stringify(updated));
          return updated;
        });
      }

      // Feedback notification
      if (ids.length === 1) {
        const res = results[0];
        if (res && res.success) {
          showToast(
            res.isExistingClient
              ? `Lead "${res.lead!.name}" linked & updated existing Client record!`
              : `Lead "${res.lead!.name}" successfully converted to Client!`,
            "success"
          );
        } else {
          showToast(`Failed to convert lead "${targetLeads[0].name}". Firestore save failed.`, "error");
        }
      } else {
        if (failed.length === 0) {
          showToast(`Successfully converted all ${successful.length} leads to Clients!`, "success");
        } else if (successful.length > 0) {
          showToast(`Converted ${successful.length} leads to Clients (${failed.length} failed).`, "error");
        } else {
          showToast("Failed to convert selected leads.", "error");
        }
      }

      return successful.length > 0;
    } catch (err) {
      console.error("Error converting lead(s) to client:", err);
      showToast("Error occurred during lead conversion.", "error");
      return false;
    }
  };

  const handleDeleteMultipleLeads = async (ids: string[]) => {
    try {
      // Wait for all Firestore deletes to complete to prevent fetching stale data in subsequent fetchData()
      await Promise.all(ids.map(id => deleteFromFirestore('leads', id)));

      const response = await secureFetch('/api/delete_lead.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
      if (response.ok) {
        const updated = leads.filter(l => !ids.includes(l.id));
        setLeads(updated);
        localStorage.setItem('zyqro_leads', JSON.stringify(updated));
        showToast(`${ids.length} leads permanently deleted in bulk.`);
        
      } else {
        const errorData = await response.json().catch(() => ({}));
        showToast(errorData.error || `Failed to delete bulk leads from MySQL database.`, 'error');
      }
    } catch (err) {
      showToast(`Network error: Failed to delete bulk leads from MySQL.`, 'error');
    }
  };

  const handleDeleteMultipleClients = async (ids: string[]) => {
    try {
      // Wait for all Firestore deletes to complete to prevent fetching stale data in subsequent fetchData()
      await Promise.all(ids.map(id => deleteFromFirestore('clients', id)));

      const response = await secureFetch('/api/delete_client.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
      if (response.ok) {
        const updated = clients.filter(c => !ids.includes(c.id));
        setClients(updated);
        localStorage.setItem('zyqro_clients', JSON.stringify(updated));
        showToast(`${ids.length} clients permanently deleted in bulk.`);
        
      } else {
        const errorData = await response.json().catch(() => ({}));
        showToast(errorData.error || `Failed to delete bulk clients.`, 'error');
      }
    } catch (err) {
      showToast(`Network error: Failed to delete bulk clients.`, 'error');
    }
  };

  const handleDeleteMultipleTeamMembers = async (ids: string[]) => {
    try {
      // Wait for all Firestore deletes to complete to prevent fetching stale data in subsequent fetchData()
      await Promise.all(ids.map(id => deleteFromFirestore('team', id)));

      const response = await secureFetch('/api/delete_team.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
      if (response.ok) {
        const updated = teamMembers.filter(m => !ids.includes(m.id));
        setTeamMembers(updated);
        localStorage.setItem('zyqro_team', JSON.stringify(updated));
        showToast(`${ids.length} team members permanently deleted in bulk.`);
        
      } else {
        const errorData = await response.json().catch(() => ({}));
        showToast(errorData.error || `Failed to delete bulk team members.`, 'error');
      }
    } catch (err) {
      showToast(`Network error: Failed to delete bulk team members.`, 'error');
    }
  };

  const handleDeleteMultipleEmails = async (ids: string[]) => {
    try {
      // Wait for all Firestore deletes to complete to prevent fetching stale data in subsequent fetchData()
      await Promise.all(ids.map(id => deleteFromFirestore('emailDiscussions', id)));

      const response = await secureFetch('/api/delete_email_discussion.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
      if (response.ok) {
        const updated = emailDiscussions.filter(e => !ids.includes(e.id));
        setEmailDiscussions(updated);
        localStorage.setItem('zyqro_emails', JSON.stringify(updated));
        showToast(`${ids.length} email records permanently deleted in bulk.`);
        
      } else {
        const errorData = await response.json().catch(() => ({}));
        showToast(errorData.error || `Failed to delete bulk emails.`, 'error');
      }
    } catch (err) {
      showToast(`Network error: Failed to delete bulk emails.`, 'error');
    }
  };

  const handleDeleteMultipleCalls = async (ids: string[]) => {
    try {
      // Wait for all Firestore deletes to complete to prevent fetching stale data in subsequent fetchData()
      await Promise.all(ids.map(id => deleteFromFirestore('callDiscussions', id)));

      const response = await secureFetch('/api/delete_call_discussion.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
      if (response.ok) {
        const updated = callDiscussions.filter(c => !ids.includes(c.id));
        setCallDiscussions(updated);
        localStorage.setItem('zyqro_call_disc', JSON.stringify(updated));
        showToast(`${ids.length} call records permanently deleted in bulk.`);
        
      } else {
        const errorData = await response.json().catch(() => ({}));
        showToast(errorData.error || `Failed to delete bulk call records.`, 'error');
      }
    } catch (err) {
      showToast(`Network error: Failed to delete bulk call records.`, 'error');
    }
  };

  const handleAddCallLog = async (newCall: Omit<CallLog, 'id' | 'timestamp'>) => {
    const tempId = generateUniqueId('call');
    const localCall: CallLog = {
      ...newCall,
      id: tempId,
      timestamp: new Date().toISOString()
    };

    try {
      saveToFirestore('calls', localCall.id, localCall);
      const response = await secureFetch('/api/add_call.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localCall)
      });
      if (response.ok) {
        const updated = [localCall, ...calls];
        setCalls(updated);
        showToast("Call log saved successfully.");

        // Update status to contacted
        if (newCall.leadId) {
          const matchedLead = leads.find(l => l.id === newCall.leadId);
          if (matchedLead && matchedLead.status === 'New') {
            await handleUpdateLead({
              ...matchedLead,
              status: 'Contacted',
              notes: `${matchedLead.notes}\n[Call Logged]: ${newCall.notes}`,
              updatedAt: new Date().toISOString()
            });
          } else {
            
          }
        } else {
          
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        showToast(errorData.error || "Failed to save call log to MySQL database.", "error");
      }
    } catch (err) {
      showToast("Network error: Failed to log call to MySQL database.", "error");
    }
  };

  const handleAddClient = async (newClient: Omit<Client, 'id'>): Promise<boolean> => {
    const tempId = generateUniqueId('client');
    const localClient: Client = {
      ...newClient,
      id: tempId
    };

    try {
      await saveToFirestore('clients', localClient.id, localClient);
      secureFetch('/api/add_client.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localClient)
      }).catch(console.warn);

      const updated = [localClient, ...clients];
      setClients(updated);
      showToast(`Client "${newClient.company || newClient.name}" added successfully.`, 'success');
      
      return true;
    } catch (err) {
      showToast("Failed to save client.", "error");
      return false;
    }
  };

  const handleUpdateClient = async (updatedClient: Client): Promise<boolean> => {
    try {
      await saveToFirestore('clients', updatedClient.id, updatedClient);
      secureFetch('/api/update_client.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedClient)
      }).catch(console.warn);

      const updated = clients.map(c => c.id === updatedClient.id ? updatedClient : c);
      setClients(updated);
      showToast(`Client "${updatedClient.company || updatedClient.name}" updated successfully.`, 'success');
      
      return true;
    } catch (err) {
      showToast("Failed to update client.", "error");
      return false;
    }
  };

  const handleDeleteClient = async (id: string): Promise<boolean> => {
    const clientToDelete = clients.find(c => c.id === id);
    const company = clientToDelete ? clientToDelete.company : "Client";

    try {
      await deleteFromFirestore('clients', id);
      secureFetch('/api/delete_client.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      }).catch(console.warn);

      const updated = clients.filter(c => c.id !== id);
      setClients(updated);
      showToast(`Client "${company}" permanently deleted.`, 'success');
      return true;
    } catch (err) {
      showToast("Failed to delete client.", "error");
      return false;
    }
  };

  const handleAddProject = async (newProject: Omit<Project, 'id'>): Promise<boolean> => {
    try {
      const tempId = `proj-${Date.now()}`;
      const projectItem = { ...newProject, id: tempId };
      await saveToFirestore('projects', tempId, projectItem);
      secureFetch('/api/add_project.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject)
      }).catch(console.warn);

      const updated = [projectItem, ...projects];
      setProjects(updated as Project[]);
      showToast(`Project "${newProject.name}" added successfully.`, 'success');
      
      return true;
    } catch (err) {
      showToast("Failed to add project.", "error");
      return false;
    }
  };

  const handleUpdateProject = async (updatedProject: Project): Promise<boolean> => {
    try {
      await saveToFirestore('projects', updatedProject.id, updatedProject);
      secureFetch('/api/update_project.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProject)
      }).catch(console.warn);

      const updated = projects.map(p => p.id === updatedProject.id ? updatedProject : p);
      setProjects(updated);
      showToast(`Project "${updatedProject.name}" updated successfully.`, 'success');
      
      return true;
    } catch (err) {
      showToast("Failed to update project.", "error");
      return false;
    }
  };

  const handleDeleteProject = async (projectId: string): Promise<boolean> => {
    try {
      await deleteFromFirestore('projects', projectId);
      secureFetch('/api/delete_project.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: projectId })
      }).catch(console.warn);

      const updated = projects.filter(p => p.id !== projectId);
      setProjects(updated);
      showToast("Project deleted successfully.", 'success');
      
      return true;
    } catch (err) {
      showToast("Failed to delete project.", "error");
      return false;
    }
  };

  const handleSaveProposal = async (proposal: ProposalQuotation): Promise<boolean> => {
    try {
      const saved = await saveToFirestore('proposals', proposal.id, proposal);
      if (saved) {
        setProposals(prev => {
          const exists = prev.some(p => p.id === proposal.id);
          if (exists) return prev.map(p => p.id === proposal.id ? proposal : p);
          return [proposal, ...prev];
        });
      }
      return saved;
    } catch (err) {
      console.error("Error saving proposal:", err);
      showToast("Failed to save proposal to Firestore.", "error");
      return false;
    }
  };

  const handleDeleteProposal = async (proposalId: string): Promise<boolean> => {
    try {
      const deleted = await deleteFromFirestore('proposals', proposalId);
      if (deleted) {
        setProposals(prev => prev.filter(p => p.id !== proposalId));
        showToast("Proposal deleted successfully.", "success");
      }
      return deleted;
    } catch (err) {
      console.error("Error deleting proposal:", err);
      showToast("Failed to delete proposal.", "error");
      return false;
    }
  };

  const handleConvertProposalToProject = async (proposal: ProposalQuotation) => {
    try {
      const newProject: Omit<Project, 'id'> = {
        name: proposal.title || 'New Proposal Project',
        clientId: proposal.clientId || '',
        assignedTeamMember: '',
        deadline: proposal.validUntilDate || new Date().toISOString().split('T')[0],
        status: 'In Progress',
        budget: proposal.grandTotal,
        progress: 0,
        projectProgress: 0,
        notes: `Converted from Proposal ${proposal.proposalNumber}.\nClient: ${proposal.clientName} (${proposal.clientCompany || ''})\nTotal Value: $${proposal.grandTotal}`,
        totalProjectValue: proposal.grandTotal,
        advancePayment: 0,
        paymentStatus: 'Pending',
        paymentPlatform: 'Bank Transfer'
      };

      const added = await handleAddProject(newProject);
      if (added) {
        const updatedProp: ProposalQuotation = { ...proposal, status: 'Converted' };
        await handleSaveProposal(updatedProp);
      }
    } catch (err) {
      console.error("Error converting proposal to project:", err);
      showToast("Failed to convert proposal into a project.", "error");
    }
  };

  const handleUpdatePricingCatalog = async (updatedCatalog: PricingCatalog): Promise<boolean> => {
    try {
      const saved = await saveToFirestore('pricingCatalog', 'default', updatedCatalog);
      if (saved) {
        setPricingCatalog(updatedCatalog);
        showToast("Pricing Catalog rates updated in Firestore!", "success");
      }
      return saved;
    } catch (err) {
      console.error("Error updating pricing catalog:", err);
      showToast("Failed to update pricing catalog in Firestore.", "error");
      return false;
    }
  };

  const handleAddTeamMember = async (newMember: Omit<TeamMember, 'id' | 'createdAt'>): Promise<boolean> => {
    const tempId = generateUniqueId('member');
    const localMember: TeamMember = {
      ...newMember,
      id: tempId,
      createdAt: new Date().toISOString()
    };

    try {
      await saveToFirestore('team', localMember.id, localMember);
      secureFetch('/api/add_team.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localMember)
      }).catch(console.warn);

      const updated = [...teamMembers, localMember];
      setTeamMembers(updated);
      showToast(`Team member "${newMember.fullName}" added.`, 'success');
      
      return true;
    } catch (err) {
      showToast("Failed to add team member.", "error");
      return false;
    }
  };

  const handleUpdateTeamMember = async (updatedMember: TeamMember): Promise<boolean> => {
    try {
      await saveToFirestore('team', updatedMember.id, updatedMember);
      secureFetch('/api/update_team.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedMember)
      }).catch(console.warn);

      const updated = teamMembers.map(m => m.id === updatedMember.id ? updatedMember : m);
      setTeamMembers(updated);
      showToast(`Team member "${updatedMember.fullName}" updated.`, 'success');
      
      return true;
    } catch (err) {
      showToast("Failed to update team member.", "error");
      return false;
    }
  };

  const handleDeleteTeamMember = async (id: string): Promise<boolean> => {
    const memberToDelete = teamMembers.find(m => m.id === id);
    const name = memberToDelete ? memberToDelete.fullName : "Team member";

    try {
      await deleteFromFirestore('team', id);
      const updated = teamMembers.filter(m => m.id !== id);
      setTeamMembers(updated);
      showToast(`Team member "${name}" deleted.`);
      secureFetch('/api/delete_team.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      }).catch(console.warn);
      return true;
    } catch (err) {
      showToast("Failed to delete team member.", "error");
      return false;
    }
  };

  // Goals CRUD handlers using Firestore with background endpoint sync
  const handleAddGoal = async (newGoal: Omit<Goal, 'id'>): Promise<boolean> => {
    const tempId = generateUniqueId('goal');
    const localGoal: Goal = {
      ...newGoal,
      id: tempId
    };

    try {
      await saveToFirestore('goals', localGoal.id, localGoal);
      const updated = [...goals, localGoal];
      setGoals(updated);
      showToast(`Goal "${newGoal.title}" created.`);
      secureFetch('/api/add_goal.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localGoal)
      }).catch(console.warn);
      
      return true;
    } catch (err) {
      showToast("Failed to create goal.", "error");
      return false;
    }
  };

  const handleIncrementGoal = async (id: string, amount: number): Promise<boolean> => {
    try {
      const target = goals.find(g => g.id === id);
      if (target) {
        const updatedGoal = { ...target, current: target.current + amount };
        await saveToFirestore('goals', id, updatedGoal);
        setGoals(prev => prev.map(g => g.id === id ? updatedGoal : g));
        showToast("Goal progress tracked.");
      }
      secureFetch('/api/update_goal.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, amount })
      }).catch(console.warn);
      
      return true;
    } catch (err) {
      showToast("Failed to update goal progress.", "error");
      return false;
    }
  };

  const handleDeleteGoal = async (id: string) => {
    const goalToDelete = goals.find(g => g.id === id);
    const title = goalToDelete ? goalToDelete.title : "Goal";

    try {
      await deleteFromFirestore('goals', id);
      const updated = goals.filter(g => g.id !== id);
      setGoals(updated);
      showToast(`Goal "${title}" permanently deleted.`);
      secureFetch('/api/delete_goal.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      }).catch(console.warn);
      
    } catch (err) {
      showToast("Failed to delete goal.", "error");
    }
  };

  const handleAddSupportTicket = async (newTicket: Omit<SupportTicket, 'id'>): Promise<boolean> => {
    try {
      const tempId = `tkt-${Date.now()}`;
      const ticketItem = { ...newTicket, id: tempId };
      await saveToFirestore('supportTickets', tempId, ticketItem);
      setSupportTickets(prev => [ticketItem as SupportTicket, ...prev]);
      showToast(`Ticket #${newTicket.ticketNumber} created successfully.`, 'success');
      return true;
    } catch (err) {
      showToast("Failed to create support ticket.", "error");
      return false;
    }
  };

  const handleUpdateSupportTicket = async (updatedTicket: SupportTicket): Promise<boolean> => {
    try {
      await saveToFirestore('supportTickets', updatedTicket.id, updatedTicket);
      setSupportTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
      showToast(`Ticket #${updatedTicket.ticketNumber} updated successfully.`, 'success');
      return true;
    } catch (err) {
      showToast("Failed to update support ticket.", "error");
      return false;
    }
  };

  const handleDeleteSupportTicket = async (id: string): Promise<boolean> => {
    try {
      await deleteFromFirestore('supportTickets', id);
      setSupportTickets(prev => prev.filter(t => t.id !== id));
      showToast("Support ticket deleted successfully.", 'success');
      return true;
    } catch (err) {
      showToast("Failed to delete support ticket.", "error");
      return false;
    }
  };

  const handleFormSubmitSimulated = (newFormLead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
    handleAddLead(newFormLead);
  };

  const [isTabPending, startTabTransition] = useTransition();
  const [teamSubTab, setTeamSubTab] = useState<'members' | 'preHiring' | 'workload'>('members');

  const handleNavigateToTab = useCallback((tab: string, subTab?: 'members' | 'preHiring' | 'workload') => {
    setMobileMenuOpen(false);
    setActiveTab(tab);
    if (subTab) {
      setTeamSubTab(subTab);
    }
  }, []);

  const handleOpenAddLead = () => {
    setActiveTab('leads');
    setTriggerAddForm(true);
  };

  const userRole = typeof window !== 'undefined' ? sessionStorage.getItem('zyqro_user_role') : null;

  // Exact Navigation Items Structure ordered according to client specification
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'clients', label: 'Clients', icon: CheckCircle },
    { id: 'archive', label: 'Archive', icon: Archive },
    { id: 'projects', label: 'Project Management', icon: Briefcase },
    { id: 'portal', label: 'Portal', icon: ShieldCheck },
    { id: 'discussions', label: 'Discussions', icon: MessageSquare },
    { id: 'team', label: 'Team Management', icon: UserCheck },
    { id: 'payments', label: 'Payments', icon: DollarSign },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'website', label: 'Website Management', icon: Globe },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ].filter(item => {
    if (userRole === 'Team') {
      const blocked = ['leads', 'clients', 'archive', 'dashboard', 'goals', 'discussions', 'team', 'portal', 'settings'];
      return !blocked.includes(item.id);
    }
    return true;
  });

  // For Team role, we add the My Tasks module if it's not already there
  if (userRole === 'Team') {
    // Only keep Projects and Website if not blocked. 
    // Actually the user said "The Team Portal should only display: My Projects, My Tasks..."
    // If they are in the CRM, we should match that.
    
    // Check if 'my-tasks' is already in navigation
    if (!navigationItems.find(n => n.id === 'my-tasks')) {
      navigationItems.push({ id: 'my-tasks', label: 'My Tasks', icon: CheckSquare });
    }
  }

  const PortalAccessDenied = () => (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-sans relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800/90 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative z-10">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
            <ShieldAlert size={32} />
          </div>
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-semibold uppercase tracking-widest inline-block font-structure">
            Access Restricted
          </span>
          <h1 className="text-2xl font-semibold text-white tracking-tight uppercase font-structure">
            Invalid Portal URL
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            The portal link you entered is invalid or has been modified. Direct access to the system login is restricted from portal routes for security reasons.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 leading-normal text-left space-y-2">
          <p className="font-semibold text-slate-300 flex items-center gap-1.5 font-structure uppercase tracking-wider">
            <Lock size={12} className="text-red-400" /> Security Notice
          </p>
          <p>
            Client portals require an intact 256-bit secure access token. Please verify and use the exact full link provided by your administrator.
          </p>
        </div>

        <div className="pt-2 border-t border-slate-800/60">
          <p className="text-[10px] font-medium text-slate-500 ">
            Zyqitek Encrypted Secure Gateway Network
          </p>
        </div>
      </div>
    </div>
  );

  const currentPath = currentPathState;

  if (detectedPortalRoute) {
    if (detectedPortalRoute.type && detectedPortalRoute.type !== 'invalid') {
      return (
        <StandalonePortalGateway
          type={detectedPortalRoute.type as 'client' | 'team'}
          portalId={detectedPortalRoute.secureToken}
        />
      );
    }
  }

  // Step 1: Access Code Gate
  if (!crmAccessGranted && !isLoggedIn) {
    return <AccessCodeScreen onSuccess={() => setCrmAccessGranted(true)} />;
  }

  // Step 2: Existing CRM Username & Password Login Screen
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  // Helper to check if a tab is restricted for Team role
  const isRestrictedForTeam = (tab: string) => {
    if (userRole !== 'Team') return false;
    const blocked = ['leads', 'clients', 'archive', 'dashboard', 'goals', 'discussions', 'team', 'portal', 'settings'];
    return blocked.includes(tab);
  };

  const AccessDenied = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 p-8 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-3xl"
    >
      <div className="p-6 bg-rose-500/10 rounded-full border border-rose-500/20 text-rose-500">
        <Lock size={48} />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-[var(--crm-text)] tracking-tight uppercase">403 - Access Denied</h2>
        <p className="text-[var(--crm-text-secondary)] max-w-md">
          You do not have administrative permissions to access this module. Please contact your system administrator if you believe this is an error.
        </p>
      </div>
    </motion.div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: "easeOut" }}
      className="min-h-screen bg-[var(--crm-bg)] flex text-[var(--crm-text)] font-sans antialiased"
    >
      
      {/* 1. Left Sidebar (Compact refined width, light gray background) */}
      <motion.aside 
        animate={{ width: (leadsFullScreen && activeTab === 'leads') ? 0 : (sidebarCollapsed ? 76 : 256) }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className={`hidden lg:flex flex-col bg-[var(--crm-sidebar)] border-r border-[var(--crm-card-border)] shrink-0 h-screen sticky top-0 text-[var(--crm-sidebar-text)] overflow-hidden ${(leadsFullScreen && activeTab === 'leads') ? 'border-none w-0 !p-0 !m-0 pointer-events-none' : ''}`}
      >
        
        {/* Top: Zyqitek logo icon and Text: ZYQITEK CRM */}
        <div className={`p-6 flex items-center justify-between ${sidebarCollapsed ? 'px-0 justify-center' : 'gap-3'}`}>
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <ZyqroLogo className="h-8 w-8 shrink-0" iconSize="h-5 w-5" />
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15 }}
                className="truncate"
              >
                <h1 
                  className="font-bold not-italic text-black dark:text-black !text-black !font-bold text-[15px] tracking-[0.5px] leading-none font-structure"
                  style={{ color: '#000000', fontWeight: 700 }}
                >
                  Zyqitek
                </h1>
                <span className="text-[8px] font-bold text-lime-600 dark:text-lime-500 tracking-[0.5px] block mt-1.5 font-structure opacity-95">
                  Customer Relationship Management
                </span>
              </motion.div>
            )}
          </div>
          {!sidebarCollapsed && (
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 hover:bg-[var(--crm-sidebar-active-bg)] rounded-lg text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)] transition-colors cursor-pointer"
              title="Collapse Sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          {sidebarCollapsed && (
             <button 
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="absolute top-6 -right-3 p-1.5 bg-[var(--crm-card)] border border-[var(--crm-card-border)] shadow-sm hover:shadow-md rounded-full text-[var(--crm-text-secondary)] hover:text-[var(--crm-primary)] transition-all cursor-pointer z-50"
                title="Expand Sidebar"
              >
                <ChevronRight size={14} />
             </button>
          )}
        </div>

        {/* User Profile Section: Name: Admin, Role: Admin Access Crm */}
        <div className={`mx-4 mb-5 p-2.5 bg-[var(--crm-sidebar-active-bg)]/50 rounded-[14px] flex items-center border border-[var(--crm-card-border)]/50 ${sidebarCollapsed ? 'justify-center mx-3' : 'justify-between'}`}>
          <div className="flex items-center gap-3 min-w-0">
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="min-w-0"
              >
                <p className="font-medium text-[13px] text-[var(--crm-sidebar-active-text)] leading-tight truncate">
                  Admin
                </p>
                <p className="text-[10px] font-medium text-[#29292f] dark:text-[#9CA3AF] uppercase tracking-[0.5px] mt-0.5 truncate">
                  Admin Access Crm
                </p>
              </motion.div>
            )}
          </div>
          {!sidebarCollapsed && (
            <button
              onClick={handleLogout}
              title="Log Out"
              className="p-1.5 hover:bg-rose-500/10 rounded-lg text-[var(--crm-text-secondary)] hover:text-rose-600 transition-colors cursor-pointer shrink-0"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto overflow-x-hidden">
          {navigationItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <div key={item.id} className="space-y-1">
                <button
                  id={`sidebar-nav-${item.id}`}
                  onClick={() => handleNavigateToTab(item.id)}
                  className={`relative w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-start'} px-3 py-2.5 rounded-[12px] transition-all duration-150 active:scale-[0.98] cursor-pointer text-left z-0 ${
                    isActive 
                      ? 'text-[var(--crm-sidebar-active-text)] font-bold' 
                      : 'text-[var(--crm-sidebar-text)] font-medium hover:bg-[var(--crm-sidebar-active-bg)]/80 hover:text-[var(--crm-sidebar-active-text)]'
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-indicator"
                      className="absolute inset-0 bg-[var(--crm-sidebar-active-bg)] rounded-[12px] -z-10 border border-[var(--crm-card-border)]/80 shadow-xs"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <div className="w-6 flex justify-center items-center shrink-0">
                    <Icon size={18} className={`transition-colors ${isActive ? 'text-[var(--crm-sidebar-active-text)] stroke-[2.25]' : 'text-[var(--crm-sidebar-text)] opacity-80 stroke-[1.75]'}`} />
                  </div>
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className={`whitespace-nowrap font-structure tracking-[0.015em] text-[13.5px] min-w-0 truncate ml-3 ${isActive ? 'font-bold text-[var(--crm-sidebar-active-text)]' : 'font-medium'}`}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </button>

              </div>
            );
          })}
        </nav>

        {/* Footing info */}
        <div className={`mt-auto p-4 mx-4 mb-4 border-t border-[var(--crm-card-border)]/50 ${sidebarCollapsed ? 'px-0 mx-3 flex justify-center' : ''}`}>
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} font-medium text-[var(--crm-text-muted)]`}>
            <span className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
              {!sidebarCollapsed && <span className="text-[11px] whitespace-nowrap">Secure Workspace</span>}
            </span>
          </div>
        </div>
      </motion.aside>

      {/* Mobile Drawer Backdrops */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Navigation Drawer */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-[var(--crm-sidebar)] text-[var(--crm-text)] flex flex-col transform transition-transform duration-300 lg:hidden shadow-2xl ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 border-b border-[var(--crm-card-border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ZyqroLogo className="h-8 w-8 shrink-0" iconSize="h-5 w-5" />
            <div className="flex flex-col">
              <span className="font-bold text-[15px] tracking-[0.5px] text-[var(--crm-sidebar-active-text)] leading-none font-structure">Zyqitek</span>
              <span className="text-[8px] font-bold text-indigo-600 tracking-[0.5px] block mt-1.5 font-structure opacity-80">
                Customer Relationship Management
              </span>
            </div>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="text-[var(--crm-text-secondary)] hover:text-rose-500 cursor-pointer p-1.5 hover:bg-[var(--crm-sidebar-active-bg)] rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Profile Card on Mobile */}
        <div className="m-4 p-4 bg-[var(--crm-sidebar-active-bg)]/50 rounded-[16px] flex items-center justify-between border border-[var(--crm-card-border)]/50">
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              <p className="font-medium text-sm text-[var(--crm-sidebar-active-text)] truncate">Admin</p>
              <p className="text-[10px] text-[var(--crm-text-muted)] font-medium uppercase tracking-[0.5px] mt-0.5 truncate">Admin Access Crm</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-2 hover:bg-rose-500/10 rounded-xl text-[var(--crm-text-secondary)] hover:text-rose-600 transition-colors cursor-pointer"
          >
            <LogOut size={16} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto">
          {navigationItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <div key={item.id} className="space-y-1">
                <button
                  onClick={() => handleNavigateToTab(item.id)}
                  className={`relative w-full flex items-center px-4 py-3 rounded-[12px] cursor-pointer text-left text-[14px] transition-all active:scale-[0.98] ${
                    isActive 
                      ? 'bg-[var(--crm-sidebar-active-bg)] text-[var(--crm-sidebar-active-text)] font-bold border border-[var(--crm-card-border)]/80 shadow-xs' 
                      : 'text-[var(--crm-sidebar-text)] font-medium hover:bg-[var(--crm-sidebar-active-bg)]/80 hover:text-[var(--crm-sidebar-active-text)]'
                  }`}
                >
                  <div className="w-6 flex justify-center shrink-0">
                    <Icon size={18} className={`${isActive ? 'text-[var(--crm-sidebar-active-text)] stroke-[2.25]' : 'text-[var(--crm-sidebar-text)] opacity-80 stroke-[1.75]'}`} />
                  </div>
                  <span className={`font-structure tracking-[0.015em] ml-3 ${isActive ? 'font-bold text-[var(--crm-sidebar-active-text)]' : 'font-medium'}`}>{item.label}</span>
                </button>

              </div>
            );
          })}
        </nav>
      </aside>

      {/* 2. Main Content Frame (Theme-Aware background) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-[var(--crm-bg)] relative">

        {/* Mobile Header Bar */}
        {!(leadsFullScreen && activeTab === 'leads') && (
          <header className="h-16 bg-[var(--crm-sidebar)] border-b border-[var(--crm-card-border)] flex items-center justify-between px-6 shrink-0 lg:hidden text-[var(--crm-text)]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-1.5 text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar-active-bg)] rounded-md cursor-pointer"
              >
                <Menu size={20} />
              </button>
              <div className="font-extrabold text-[15px] tracking-tight flex items-center gap-1.5 font-structure">
                <span className="font-bold tracking-wider text-black dark:text-black" style={{ color: '#000000' }}>Zyqitek</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-[var(--crm-text)] rounded-full flex items-center justify-center text-xs font-medium border border-[var(--crm-card-border)] text-[var(--crm-bg)]">
                AH
              </div>
            </div>
          </header>
        )}

        {/* Main Content Area Container with exact spacing */}
        <main className={`flex-1 overflow-y-auto w-full mx-auto space-y-4 transition-all duration-300 ${
          leadsFullScreen && activeTab === 'leads'
            ? 'p-2 md:p-3 max-w-full'
            : `p-4 md:p-6 lg:p-8 3xl:p-10 4k:p-12 5k:p-16 max-w-full 4k:max-w-[3840px]`
        }`}>
          
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              isRestrictedForTeam('dashboard') ? <AccessDenied /> : (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.14 }}
              >
                <Dashboard 
                  leads={leads} 
                  teamMembers={teamMembers}
                  calls={calls} 
                  clients={enrichedClients} 
                  projects={projects}
                  emailDiscussions={emailDiscussions}
                  callDiscussions={callDiscussions}
                  conversationDiscussions={conversationDiscussions}
                  meetings={meetings}
                  clientPayments={clientPayments}
                  teamPayments={teamPayments}
                  onNavigate={handleNavigateToTab} 
                  onSelectClient={(clientId) => {
                    setSelectedClientProfileId(clientId);
                    handleNavigateToTab('clients');
                  }}
                  onSelectLead={(leadId) => {
                    setSelectedLeadProfileId(leadId);
                    handleNavigateToTab('leads');
                  }}
                  onAddLead={handleOpenAddLead}
                  onAddClient={() => handleNavigateToTab('clients')}
                  onAddProject={() => handleNavigateToTab('projects')}
                  onRecordPayment={() => handleNavigateToTab('payments')}
                  onAddDiscussion={() => handleNavigateToTab('discussions')}
                />
              </motion.div>
              )
            )}

            {activeTab === 'leads' && (
              isRestrictedForTeam('leads') ? <AccessDenied /> : (
              <motion.div
                key="leads"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.14 }}
              >
                <LeadManager 
                  leads={leads}
                  clients={clients}
                  teamMembers={teamMembers}
                  initialSelectedLeadId={selectedLeadProfileId}
                  onClearInitialSelectedLeadId={() => setSelectedLeadProfileId(null)}
                  onAddLead={handleAddLead}
                  onBulkImportLeads={handleBulkImportLeads}
                  onUpdateLead={handleUpdateLead}
                  onDeleteLead={handleDeleteLead}
                  onDeleteMultipleLeads={handleDeleteMultipleLeads}
                  onConvertLeadToClient={handleConvertLeadToClient}
                  showToast={showToast}
                  triggerAddForm={triggerAddForm}
                  setTriggerAddForm={setTriggerAddForm}
                  emailDiscussions={emailDiscussions}
                  callDiscussions={callDiscussions}
                  conversationDiscussions={conversationDiscussions}
                  isFullScreen={leadsFullScreen}
                  onToggleFullScreen={() => setLeadsFullScreen(!leadsFullScreen)}
                  onAddDiscussionRecord={(lead, type) => {
                    const client = clients.find(c => c.name.toLowerCase() === lead.name.toLowerCase() || (lead.company && c.company?.toLowerCase() === lead.company.toLowerCase()));
                    setDiscussionPrefill({
                      leadName: lead.name,
                      company: lead.company,
                      email: lead.email,
                      phone: lead.phone,
                      leadId: lead.id,
                      clientId: client?.id,
                      service: lead.category,
                      assignedTeamMember: client?.assignedTeamMember || (teamMembers.length > 0 ? teamMembers[0].fullName : undefined),
                      type: type
                    });
                    setActiveTab('discussions');
                  }}
                />
              </motion.div>
              )
            )}

            {activeTab === 'clients' && (
              isRestrictedForTeam('clients') ? <AccessDenied /> : (
              <motion.div
                key="clients"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.14 }}
              >
                <ClientManager 
                  clients={enrichedClients}
                  projects={projects}
                  teamMembers={teamMembers}
                  initialSelectedClientId={selectedClientProfileId}
                  onClearInitialSelectedClientId={() => setSelectedClientProfileId(null)}
                  onUpdateClient={handleUpdateClient}
                  onAddClient={handleAddClient}
                  onDeleteClient={handleDeleteClient}
                  onDeleteMultipleClients={handleDeleteMultipleClients}
                  emailDiscussions={emailDiscussions}
                  callDiscussions={callDiscussions}
                  conversationDiscussions={conversationDiscussions}
                  onAddDiscussionRecord={(client, type) => {
                    const lead = leads.find(l => l.name.toLowerCase() === client.name.toLowerCase() || (client.company && l.company?.toLowerCase() === client.company.toLowerCase()));
                    setDiscussionPrefill({
                      leadName: client.name,
                      company: client.company,
                      email: client.email,
                      phone: client.phone,
                      leadId: lead?.id,
                      clientId: client.id,
                      service: client.serviceType || lead?.category,
                      assignedTeamMember: client.assignedTeamMember || (teamMembers.length > 0 ? teamMembers[0].fullName : undefined),
                      type: type
                    });
                    setActiveTab('discussions');
                  }}
                />
              </motion.div>
              )
            )}

            {activeTab === 'archive' && (
              isRestrictedForTeam('archive') ? <AccessDenied /> : (
              <motion.div
                key="archive"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.14 }}
              >
                <ArchiveManager 
                  clients={enrichedClients}
                  projects={projects}
                  teamMembers={teamMembers}
                  clientPayments={clientPayments}
                  emailDiscussions={emailDiscussions}
                  callDiscussions={callDiscussions}
                  conversationDiscussions={conversationDiscussions}
                  onUpdateClient={handleUpdateClient}
                  onDeleteClient={handleDeleteClient}
                  onUpdateTeamMember={handleUpdateTeamMember}
                  onDeleteTeamMember={handleDeleteTeamMember}
                />
              </motion.div>
              )
            )}

            {activeTab === 'projects' && (
              <motion.div
                key="projects"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.14 }}
              >
                <ProjectManagement
                  clients={enrichedClients}
                  teamMembers={teamMembers}
                  projects={projects}
                  onAddProject={handleAddProject}
                  onUpdateProject={handleUpdateProject}
                  onDeleteProject={handleDeleteProject}
                  filterTeamMemberId={userRole === 'Team' ? sessionStorage.getItem('zyqro_user_id') || undefined : undefined}
                  proposals={proposals}
                  pricingCatalog={pricingCatalog}
                  onSaveProposal={handleSaveProposal}
                  onDeleteProposal={handleDeleteProposal}
                  onConvertProposalToProject={handleConvertProposalToProject}
                  onUpdatePricingCatalog={handleUpdatePricingCatalog}
                  showToast={showToast}
                  paymentDetails={paymentDetails}
                  supportTickets={supportTickets}
                  emailDiscussions={emailDiscussions}
                  callDiscussions={callDiscussions}
                  conversationDiscussions={conversationDiscussions}
                  teamActivity={teamActivity}
                  clientPayments={clientPayments}
                  onAddSupportTicket={handleAddSupportTicket}
                  onUpdateSupportTicket={handleUpdateSupportTicket}
                  onDeleteSupportTicket={handleDeleteSupportTicket}
                />
              </motion.div>
            )}

            {activeTab === 'my-tasks' && (
              <motion.div
                key="my-tasks"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.14 }}
              >
                <ProjectManagement
                  clients={enrichedClients}
                  teamMembers={teamMembers}
                  projects={projects}
                  onAddProject={handleAddProject}
                  onUpdateProject={handleUpdateProject}
                  onDeleteProject={handleDeleteProject}
                  filterTeamMemberId={sessionStorage.getItem('zyqro_user_id') || undefined}
                  proposals={proposals}
                  pricingCatalog={pricingCatalog}
                  onSaveProposal={handleSaveProposal}
                  onDeleteProposal={handleDeleteProposal}
                  onConvertProposalToProject={handleConvertProposalToProject}
                  onUpdatePricingCatalog={handleUpdatePricingCatalog}
                  showToast={showToast}
                  paymentDetails={paymentDetails}
                  supportTickets={supportTickets}
                  emailDiscussions={emailDiscussions}
                  callDiscussions={callDiscussions}
                  conversationDiscussions={conversationDiscussions}
                  teamActivity={teamActivity}
                  clientPayments={clientPayments}
                  onAddSupportTicket={handleAddSupportTicket}
                  onUpdateSupportTicket={handleUpdateSupportTicket}
                  onDeleteSupportTicket={handleDeleteSupportTicket}
                />
              </motion.div>
            )}

            {(activeTab === 'portal' || activeTab === 'clientPortal' || activeTab === 'teamPortal') && (
              isRestrictedForTeam('portal') ? <AccessDenied /> : (
              <motion.div
                key="portal"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <PortalModule 
                  clients={enrichedClients} 
                  projects={projects}
                  teamMembers={teamMembers}
                  showToast={showToast}
                />
              </motion.div>
              )
            )}

            {activeTab === 'discussions' && (
              isRestrictedForTeam('discussions') ? <AccessDenied /> : (
              <motion.div
                key="discussions"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.14 }}
              >
                <Discussions
                  leads={leads}
                  clients={enrichedClients}
                  projects={projects}
                  teamMembers={teamMembers}
                  emailDiscussions={emailDiscussions}
                  callDiscussions={callDiscussions}
                  conversationDiscussions={conversationDiscussions}
                  meetings={meetings}
                  callScripts={callScripts}
                  emailScripts={emailScripts}
                  onAddEmailDiscussion={handleAddEmailDiscussion}
                  onDeleteEmailDiscussion={handleDeleteEmailDiscussion}
                  onDeleteMultipleEmails={handleDeleteMultipleEmails}
                  onAddCallDiscussion={handleAddCallDiscussion}
                  onDeleteCallDiscussion={handleDeleteCallDiscussion}
                  onDeleteMultipleCalls={handleDeleteMultipleCalls}
                  onAddConversationDiscussion={handleAddConversationDiscussion}
                  onDeleteConversationDiscussion={handleDeleteConversationDiscussion}
                  onDeleteMultipleConversations={handleDeleteMultipleConversations}
                  onAddMeeting={handleAddMeeting}
                  onUpdateMeeting={handleUpdateMeeting}
                  onDeleteMeeting={handleDeleteMeeting}
                  onAddCallScript={handleAddCallScript}
                  onUpdateCallScript={handleUpdateCallScript}
                  onDeleteCallScript={handleDeleteCallScript}
                  onDuplicateCallScript={handleDuplicateCallScript}
                  onAddEmailScript={handleAddEmailScript}
                  onUpdateEmailScript={handleUpdateEmailScript}
                  onDeleteEmailScript={handleDeleteEmailScript}
                  onDuplicateEmailScript={handleDuplicateEmailScript}
                  prefill={discussionPrefill}
                  onClearPrefill={() => setDiscussionPrefill(null)}
                />
              </motion.div>
              )
            )}

            {activeTab === 'team' && (
              isRestrictedForTeam('team') ? <AccessDenied /> : (
              <motion.div
                key="team"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.14 }}
              >
                <TeamManager 
                  defaultSubTab={teamSubTab}
                  teamMembers={teamMembers}
                  onAddTeamMember={handleAddTeamMember}
                  onUpdateTeamMember={handleUpdateTeamMember}
                  onDeleteTeamMember={handleDeleteTeamMember}
                  onDeleteMultipleTeamMembers={handleDeleteMultipleTeamMembers}
                  clients={enrichedClients}
                  allProjects={projects}
                  allTasks={[]} // Tasks are inside projects
                  onUpdateProject={handleUpdateProject}
                />
              </motion.div>
              )
            )}

            {activeTab === 'payments' && (
              <motion.div
                key="payments"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.14 }}
              >
                <PaymentsManager 
                  clients={enrichedClients}
                  projects={projects}
                  teamMembers={teamMembers}
                  clientPayments={clientPayments}
                  showToast={showToast}
                  onUpdateProject={handleUpdateProject}
                />
              </motion.div>
            )}

            {activeTab === 'goals' && (
              isRestrictedForTeam('goals') ? <AccessDenied /> : (
              <motion.div
                key="goals"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.14 }}
              >
                <GoalsView 
                  goals={goals}
                  onAddGoal={handleAddGoal}
                  onIncrementGoal={handleIncrementGoal}
                  onDeleteGoal={handleDeleteGoal}
                />
              </motion.div>
              )
            )}

            {activeTab === 'website' && (
              <motion.div
                key="website"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.14 }}
              >
                <WebsiteView 
                  previewUrl={previewUrl} 
                  portalUrl={portalUrl} 
                  redirectUrl={redirectUrl} 
                />
              </motion.div>
            )}

            {activeTab === 'settings' && (
              isRestrictedForTeam('settings') ? <AccessDenied /> : (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.14 }}
              >
                <SettingsView 
                  theme={theme}
                  onThemeChange={setTheme}
                  onResetData={handleResetData} 
                  portalUrl={portalUrl}
                  previewUrl={previewUrl}
                  onUpdateRedirectUrls={handleUpdateRedirectUrls}
                  redirectUrl={redirectUrl}
                  syncStatus={syncStatus}
                  lastSyncTime={lastSyncTime}
                  onSyncToCloud={handleSyncToCloud}
                  onUnsync={handleUnsync}
                  pricingCatalog={pricingCatalog}
                  onUpdatePricingCatalog={handleUpdatePricingCatalog}
                  showToast={showToast}
                />
              </motion.div>
              )
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Toast Notification HUD */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl px-4 py-3.5 shadow-2xl flex items-center gap-3 pointer-events-auto"
          >
            <div className={`h-2 w-2 rounded-full shrink-0 ${toast.type === 'success' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-rose-500 shadow-[0_0_10px_#f43f5e]'}`} />
            <span className="text-xs font-normal italic font-sans tracking-wide text-slate-800 dark:text-blue-400">
              {toast.message}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
