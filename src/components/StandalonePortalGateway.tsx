import * as LucideIcons from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Eye,
  EyeOff,
  User,
  Key,
  Globe,
  Server,
  Mail,
  FolderGit2,
  FileText,
  FileSpreadsheet,
  HelpCircle,
  StickyNote,
  Download,
  UploadCloud,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  Send,
  Plus,
  Trash2,
  RefreshCw,
  LogOut,
  Briefcase,
  DollarSign,
  Building,
  Check,
  Copy,
  Sparkles,
  Users,
  LayoutGrid,
  List,
  Search,
  Folder,
  FolderOpen,
  File,
  ChevronRight,
  ArrowRight,
  Calendar,
  Bell,
  UserCircle,
  MessageSquare,
  LayoutDashboard,
  CheckSquare,
  Activity,
  AlertTriangle,
  Layers,
  X,
  Menu
} from 'lucide-react';
import { ClientPortalAccount, TeamPortalAccount } from '../types';
import { uploadPortalFile, deletePortalFile } from '../lib/fileStorage';
import FolderExplorer from './FolderExplorer';
import ZyqroLogo from './ZyqroLogo';
import PortalChat from './PortalChat';
import croppedChatIconImg from '../assets/images/cropped_chat_icon_1788410283440.jpg';

// Custom Chat icon replacing MessageSquare in sidebar / portal section
function ChatIconComponent({ size = 16, className = "" }: { size?: number; className?: string }) {
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
import { EnterpriseBackgroundAnimation } from './EnterpriseBackgroundAnimation';
import { getMasterTeamMemberId } from '../lib/clientIdUtils';

interface StandalonePortalGatewayProps {
  type: 'client' | 'team';
  portalId: string;
  onExitToCrm?: () => void;
}

const AVAILABLE_SECTIONS = [
  { id: "overview", label: "Overview", icon: "LayoutDashboard" },
  { id: "projects", label: "Projects", icon: "Activity" },
  { id: "files", label: "Files & Documents", icon: "FolderOpen" },
  { id: "chat", label: "Chat & Communication", icon: "MessageSquare" },

  { id: "website", label: "Website", icon: "Globe" },
  { id: "ecommerce", label: "E-Commerce", icon: "ShoppingCart" },
  { id: "domain", label: "Domain & DNS", icon: "Globe" },
  { id: "hosting", label: "Hosting", icon: "Server" },
  { id: "ssl", label: "SSL", icon: "Lock" },
  { id: "deployment", label: "Deployment", icon: "Rocket" },
  { id: "maintenance_web", label: "Maintenance", icon: "Settings" },

  { id: "graphic_design", label: "Graphic Design", icon: "PenTool" },
  { id: "logo_brand", label: "Logo & Brand Identity", icon: "Image" },
  { id: "branding_assets", label: "Branding Assets", icon: "Image" },
  { id: "design_deliverables", label: "Design Deliverables", icon: "Image" },
  { id: "brand_guidelines", label: "Brand Guidelines", icon: "BookOpen" },

  { id: "video_editing", label: "Video Editing", icon: "Video" },
  { id: "video_projects", label: "Video Projects", icon: "Video" },
  { id: "raw_footage", label: "Raw Footage", icon: "Film" },
  { id: "edited_videos", label: "Edited Videos", icon: "Video" },
  { id: "final_deliverables", label: "Final Deliverables", icon: "CheckCircle" },
  { id: "thumbnails", label: "Thumbnails", icon: "Image" },
  { id: "motion_graphics", label: "Motion Graphics", icon: "Activity" },

  { id: "digital_marketing", label: "Digital Marketing", icon: "TrendingUp" },
  { id: "seo", label: "SEO", icon: "Search" },
  { id: "social_media", label: "Social Media", icon: "Share2" },
  { id: "campaigns", label: "Campaigns", icon: "Target" },
  { id: "reports", label: "Reports", icon: "PieChart" },
  { id: "analytics", label: "Analytics", icon: "BarChart" },

  { id: "ugc_ads", label: "UGC Ads", icon: "Video" },
  { id: "ad_creatives", label: "Ad Creatives", icon: "Image" },
  { id: "campaign_assets", label: "Campaign Assets", icon: "FolderOpen" },
  { id: "ad_reports", label: "Ad Reports", icon: "PieChart" },
  { id: "deliverables", label: "Deliverables", icon: "CheckCircle" },
  { id: "feedback_ugc", label: "Feedback", icon: "MessageSquare" },

  { id: "software_development", label: "Software Development", icon: "Code" },
  { id: "app_web_dev", label: "App/Web Development", icon: "Smartphone" },
  { id: "development_files", label: "Development Files", icon: "FolderOpen" },
  { id: "technical_docs", label: "Technical Documents", icon: "FileText" },
  { id: "releases", label: "Releases", icon: "Package" },

  { id: "ai_automation", label: "AI Automation", icon: "Cpu" },
  { id: "chatbots", label: "Chatbots", icon: "MessageCircle" },
  { id: "automation_projects", label: "Automation Projects", icon: "Activity" },
  { id: "workflow_docs", label: "Workflow Documents", icon: "FileText" },
  { id: "api_docs", label: "API/Integration Documents", icon: "Code" },

  { id: "services", label: "Services & Requests", icon: "Briefcase" },
  { id: "support", label: "Support", icon: "LifeBuoy" },
  { id: "maintenance_support", label: "Maintenance", icon: "Settings" },
  { id: "tickets", label: "Tickets", icon: "Ticket" },
  { id: "feedback_support", label: "Feedback", icon: "MessageSquare" }
];


export default function StandalonePortalGateway({ type, portalId, onExitToCrm }: StandalonePortalGatewayProps) {
  // Real-time fetched data
  const [clientAccount, setClientAccount] = useState<ClientPortalAccount | null>(null);
  const [teamAccount, setTeamAccount] = useState<TeamPortalAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  // Portal Authentication State
  const [isPortalAuthenticated, setIsPortalAuthenticated] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // 15-Minute Portal Lockout State
  const [isLocked, setIsLocked] = useState(false);
  const [lockRemainingSeconds, setLockRemainingSeconds] = useState(0);

  const lockStorageKey = `zyqitek_portal_lock_${type}_${String(portalId || '').trim().toLowerCase()}`;

  const formatTimer = (totalSeconds: number) => {
    const m = Math.floor(Math.max(0, totalSeconds) / 60);
    const s = Math.max(0, totalSeconds) % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Sync lockout state from localStorage on mount or key change
  useEffect(() => {
    try {
      const stored = localStorage.getItem(lockStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        const until = Number(parsed.lockUntil) || 0;
        const now = Date.now();
        if (until > now) {
          const remaining = Math.max(0, Math.ceil((until - now) / 1000));
          setIsLocked(true);
          setLockRemainingSeconds(remaining);
        } else {
          localStorage.removeItem(lockStorageKey);
          setIsLocked(false);
          setLockRemainingSeconds(0);
        }
      }
    } catch (e) {}
  }, [lockStorageKey]);

  // Active Countdown Timer for 15-Minute Lockout
  useEffect(() => {
    if (!isLocked) return;

    const tick = () => {
      try {
        let until = 0;
        const stored = localStorage.getItem(lockStorageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          until = Number(parsed.lockUntil) || 0;
        }

        const now = Date.now();
        if (until && until > now) {
          const remaining = Math.max(0, Math.ceil((until - now) / 1000));
          setLockRemainingSeconds(remaining);
        } else {
          // Timer reached 00:00! Automatically unlock the login form & enable inputs/button
          setIsLocked(false);
          setLockRemainingSeconds(0);
          setLoginError('');
          try {
            localStorage.removeItem(lockStorageKey);
          } catch (e) {}
        }
      } catch (e) {
        setIsLocked(false);
        setLockRemainingSeconds(0);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isLocked, lockStorageKey]);

  // Client Portal Selected Folder State
  const [selectedPortalFolderId, setSelectedPortalFolderId] = useState<string | null>(null);
  const [clientActiveTab, setClientActiveTab] = useState<string>('overview');

  // Support Ticket Submission states
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketPriority, setNewTicketPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [newReplyMessage, setNewReplyMessage] = useState('');
  const [replyingToTicket, setReplyingToTicket] = useState(false);

  // Team Portal Active Tab and UI controls
  const [teamActiveTab, setTeamActiveTab] = useState('dashboard');
  const [teamMobileMenuOpen, setTeamMobileMenuOpen] = useState(false);
  const [teamProjectSearch, setTeamProjectSearch] = useState('');
  const [teamProjectFilter, setTeamProjectFilter] = useState<'all' | 'active' | 'completed'>('all');

  // UI state for password visibility toggles
  const [visiblePasswords, setVisiblePasswords] = useState<{ [key: string]: boolean }>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Gateway Security State
  const [portalExists, setPortalExists] = useState<boolean | null>(null);
  const [portalStatus, setPortalStatus] = useState<'Active' | 'Inactive' | 'Live' | 'Draft' | null>(null);
  const [portalName, setPortalName] = useState<string | null>(null);

  // File Upload States
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Helper to build headers with portal session token
  const getPortalHeaders = () => {
    const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('zyqro_portal_session_token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['X-Portal-Session-Token'] = token;
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  // Secure Portal Info & Handshake on Mount
  useEffect(() => {
    const initPortal = async () => {
      try {
        setIsLoading(true);
        setLoginError('');

        // 1. Fetch portal info and check if a valid session exists via secure token
        let foundPortalInfo: { 
          exists: boolean; 
          status?: 'Active' | 'Inactive' | 'Live' | 'Draft'; 
          name?: string; 
          authenticated?: boolean; 
          account?: any;
          locked?: boolean;
          lockUntil?: number;
          lockRemainingSeconds?: number;
        } | null = null;

        try {
          const infoRes = await fetch('/api/portal/info', {
            method: 'POST',
            headers: getPortalHeaders(),
            body: JSON.stringify({ type, secureToken: portalId })
          });

          if (infoRes.ok) {
            const infoData = await infoRes.json();
            if (infoData && infoData.exists) {
              foundPortalInfo = infoData;
            }
          }
        } catch (err) {
          console.warn('Backend portal info lookup failed:', err);
        }

        if (!foundPortalInfo || !foundPortalInfo.exists) {
          setPortalExists(false);
          setIsLoading(false);
          return;
        }

        setPortalExists(true);
        setPortalStatus(foundPortalInfo.status as any);
        setPortalName(foundPortalInfo.name || null);

        // Check if portal is currently locked
        if (foundPortalInfo.locked && foundPortalInfo.lockUntil && foundPortalInfo.lockUntil > Date.now()) {
          const remaining = Math.max(0, Math.ceil((foundPortalInfo.lockUntil - Date.now()) / 1000));
          setIsLocked(true);
          setLockRemainingSeconds(remaining);
          try {
            localStorage.setItem(lockStorageKey, JSON.stringify({ lockUntil: foundPortalInfo.lockUntil }));
          } catch (e) {}
        } else if (!foundPortalInfo.locked) {
          try {
            const stored = localStorage.getItem(lockStorageKey);
            if (stored) {
              const parsed = JSON.parse(stored);
              if (!parsed.lockUntil || Date.now() >= parsed.lockUntil) {
                setIsLocked(false);
                setLockRemainingSeconds(0);
                localStorage.removeItem(lockStorageKey);
              }
            }
          } catch (e) {}
        }

        if (foundPortalInfo.status === 'Inactive') {
          setIsLoading(false);
          return;
        }

        // Only authorize direct access if session is explicitly authenticated on the backend
        if (foundPortalInfo.authenticated && foundPortalInfo.account) {
          setIsPortalAuthenticated(true);
          if (type === 'client') {
            setClientAccount(foundPortalInfo.account);
          } else {
            setTeamAccount(foundPortalInfo.account);
          }
        } else {
          setIsPortalAuthenticated(false);
          if (type === 'client') setClientAccount(null);
          else setTeamAccount(null);
        }
      } catch (err) {
        console.error('Portal initialization failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initPortal();
  }, [type, portalId]);

  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (clientAccount && type === 'client') {
      const enabled = clientAccount.enabledSections || ['overview', 'files', 'domain', 'services', 'chat'];
      if (!enabled.includes(clientActiveTab) && enabled.length > 0) {
        setClientActiveTab(enabled[0] as any);
      }
    }
  }, [clientAccount, clientActiveTab, type]);

  useEffect(() => {
    if (!isPortalAuthenticated && !isLoading && portalExists && portalStatus !== 'Inactive' && portalStatus !== 'Draft') {
      const timer = setTimeout(() => {
        if (usernameRef.current) {
          usernameRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isPortalAuthenticated, isLoading, portalExists, portalStatus]);

  // Handle Secure Portal Login without full page loading flicker
  const handlePortalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    setLoginError('');

    try {
      setIsSubmittingLogin(true);
      const res = await fetch('/api/portal/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          secureToken: portalId,
          username: usernameInput.trim(),
          password: passwordInput.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Reset lock on successful login
        setIsLocked(false);
        setLockRemainingSeconds(0);
        try {
          localStorage.removeItem(lockStorageKey);
        } catch (e) {}

        if (data.sessionToken) {
          sessionStorage.setItem('zyqro_portal_session_token', data.sessionToken);
        }
        setIsPortalAuthenticated(true);
        if (type === 'client') {
          setClientAccount(data.account);
        } else {
          setTeamAccount(data.account);
        }
        showToast('Access Granted! Welcome to your Portal.');
      } else {
        // Check if locked
        if (data.locked || res.status === 429) {
          const lockUntil = data.lockUntil || (Date.now() + 15 * 60 * 1000);
          const remaining = data.lockRemainingSeconds || Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000));
          setIsLocked(true);
          setLockRemainingSeconds(remaining);
          try {
            localStorage.setItem(lockStorageKey, JSON.stringify({ lockUntil }));
          } catch (e) {}
          setLoginError('');
        } else {
          setLoginError(data.error || 'Invalid username or password.');
        }
      }
    } catch (err: any) {
      console.error(err);
      setLoginError('Server connection error. Please try again.');
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  // Handle Portal Logout
  const handlePortalLogout = async () => {
    try {
      await fetch('/api/portal/logout', { method: 'POST', headers: getPortalHeaders() });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      sessionStorage.removeItem('zyqro_portal_session_token');
      setIsPortalAuthenticated(false);
      if (type === 'client') setClientAccount(null);
      if (type === 'team') setTeamAccount(null);
      setPasswordInput('');
    }
  };

  // Firestore & Folder Sync Helpers (Server-Side)
  const handlePortalUpdateFoldersAndFiles = async (updatedFolders: any[], updatedFiles: any[]) => {
    try {
      const res = await fetch('/api/portal/update', {
        method: 'POST',
        headers: getPortalHeaders(),
        body: JSON.stringify({
          type,
          secureToken: portalId,
          folders: updatedFolders,
          projectFiles: updatedFiles
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to sync with backend.');
      }

      if (type === 'client' && clientAccount) {
        setClientAccount({
          ...clientAccount,
          folders: updatedFolders,
          projectFiles: updatedFiles
        });
      } else if (type === 'team' && teamAccount) {
        setTeamAccount({
          ...teamAccount,
          folders: updatedFolders,
          projectFiles: updatedFiles
        });
      }
      showToast('Changes saved securely!');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to update folder structure.');
    }
  };

  const handleCreateSupportTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientAccount) return;
    if (!newTicketSubject.trim() || !newTicketMessage.trim()) {
      showToast('Please fill out all required fields.');
      return;
    }
    setSubmittingTicket(true);
    try {
      const tickets = clientAccount.supportTickets || [];
      const newTicket = {
        id: 'tkt_' + Math.random().toString(36).substr(2, 9),
        ticketId: 'TKT-' + (1001 + tickets.length),
        subject: newTicketSubject.trim(),
        priority: newTicketPriority,
        status: 'Open' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [
          {
            id: 'msg_' + Math.random().toString(36).substr(2, 9),
            sender: 'Client' as const,
            senderName: clientAccount.clientName || 'Client',
            message: newTicketMessage.trim(),
            timestamp: new Date().toISOString()
          }
        ]
      };

      const updatedTickets = [newTicket, ...tickets];
      
      const res = await fetch('/api/portal/update', {
        method: 'POST',
        headers: getPortalHeaders(),
        body: JSON.stringify({
          type: 'client',
          secureToken: portalId,
          supportTickets: updatedTickets
        })
      });

      if (!res.ok) {
        throw new Error('Failed to submit request.');
      }

      setClientAccount({
        ...clientAccount,
        supportTickets: updatedTickets
      });

      setNewTicketSubject('');
      setNewTicketMessage('');
      setShowNewTicketModal(false);
      showToast('Support request submitted successfully.');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit support request.');
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleReplyToTicket = async (ticketId: string) => {
    if (!clientAccount || !newReplyMessage.trim()) return;
    setReplyingToTicket(true);
    try {
      const tickets = clientAccount.supportTickets || [];
      const updatedTickets = tickets.map(t => {
        if (t.id === ticketId) {
          return {
            ...t,
            updatedAt: new Date().toISOString(),
            messages: [
              ...(t.messages || []),
              {
                id: 'msg_' + Math.random().toString(36).substr(2, 9),
                sender: 'Client' as const,
                senderName: clientAccount.clientName || 'Client',
                message: newReplyMessage.trim(),
                timestamp: new Date().toISOString()
              }
            ]
          };
        }
        return t;
      });

      const res = await fetch('/api/portal/update', {
        method: 'POST',
        headers: getPortalHeaders(),
        body: JSON.stringify({
          type: 'client',
          secureToken: portalId,
          supportTickets: updatedTickets
        })
      });

      if (!res.ok) throw new Error('Failed to send reply.');

      setClientAccount({
        ...clientAccount,
        supportTickets: updatedTickets
      });
      setNewReplyMessage('');
      showToast('Reply sent successfully.');
    } catch (err: any) {
      showToast(err.message || 'Failed to send reply.');
    } finally {
      setReplyingToTicket(false);
    }
  };

  const handlePortalFolderUploadFile = async (
    file: File, 
    folderId: string | null,
    onProgress?: (progress: number, loaded: number, total: number) => void,
    abortController?: AbortController
  ) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const storagePathPrefix = type === 'client' ? 'clientPortals' : 'teamPortals';
      const uploadRes = await uploadPortalFile(
        file, 
        `${storagePathPrefix}/${portalId}/${folderId || 'root'}`,
        (pct, loaded, total) => {
          setUploadProgress(pct);
          if (onProgress) onProgress(pct, loaded, total);
        },
        abortController
      );
      
      const fileId = `file-${Date.now()}`;
      const fileType = file.type || file.name.split('.').pop() || 'document';

      const newFile = {
        id: fileId,
        fileId: fileId,
        projectId: portalId,
        folderId: folderId,
        name: uploadRes.fileName,
        fileName: uploadRes.fileName,
        fileType,
        size: uploadRes.size,
        fileSize: uploadRes.size,
        storagePath: uploadRes.storagePath,
        downloadUrl: uploadRes.downloadUrl || uploadRes.fileUrl,
        fileUrl: uploadRes.fileUrl,
        uploadedAt: new Date().toISOString(),
        uploadedBy: type === 'client' ? (clientAccount?.clientName || 'Client') : (teamAccount?.fullName || 'Team Member'),
        uploadedByTeamMemberId: type === 'team' ? teamAccount?.id : null,
        category: type === 'client' ? 'Client Uploaded' : 'Team Uploaded'
      };

      if (type === 'client' && clientAccount) {
        const updatedFiles = [newFile, ...(clientAccount.projectFiles || [])];
        const res = await fetch('/api/portal/update', {
          method: 'POST',
          headers: getPortalHeaders(),
          body: JSON.stringify({
            type,
            secureToken: portalId,
            projectFiles: updatedFiles
          })
        });
        if (res.ok) {
          setClientAccount({
            ...clientAccount,
            projectFiles: updatedFiles
          });
          showToast('File uploaded successfully!');
        } else {
          showToast('Failed to sync uploaded file with server.');
        }
      } else if (type === 'team' && teamAccount) {
        const updatedFiles = [newFile, ...(teamAccount.projectFiles || [])];
        const res = await fetch('/api/portal/update', {
          method: 'POST',
          headers: getPortalHeaders(),
          body: JSON.stringify({
            type,
            secureToken: portalId,
            projectFiles: updatedFiles
          })
        });
        if (res.ok) {
          setTeamAccount({
            ...teamAccount,
            projectFiles: updatedFiles
          });
          showToast('File uploaded successfully!');
        } else {
          showToast('Failed to sync uploaded file with server.');
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        showToast('File upload was cancelled.');
        throw err;
      }
      console.error("[UPLOAD ERROR]", err);
      showToast(err.message || 'File upload failed. Please try again.');
      throw err;
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 800);
    }
  };

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const togglePasswordVisibility = (key: string) => {
    setVisiblePasswords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Initial Loading View - Clean, branded loading animation matching workspace theme
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-sans relative select-none animate-in fade-in duration-200">
        <div className="flex flex-col items-center space-y-4 max-w-xs text-center">
          <div className="relative flex items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center p-2.5">
              <ZyqroLogo className="w-full h-full text-slate-800" />
            </div>
            <div className="absolute -inset-1.5 rounded-2xl border-2 border-indigo-100 border-t-indigo-600 animate-spin"></div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-900 tracking-wider uppercase">
              Zyqitek Portal
            </p>
            <p className="text-[11px] font-medium text-slate-500">
              Verifying workspace credentials...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Not Found Screen (Premium Dark Theme)
  if (portalExists === false) {
    return (
      <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center p-6 text-center font-sans relative overflow-hidden">
        <EnterpriseBackgroundAnimation intensity="subtle" />
        <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in duration-500">
          <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-10 sm:p-12 shadow-2xl">
            <div className="flex justify-center mb-6">
              <ZyqroLogo className="w-12 h-12 text-white opacity-80" />
            </div>
            <div className="space-y-3">
              <h1 className="text-xl font-bold tracking-[0.2em] text-white">
                Zyqitek
              </h1>
              <h2 className="text-sm font-semibold text-white/70 uppercase tracking-widest">
                Access Restricted
              </h2>
              <p className="text-sm text-rose-400 font-medium">
                Portal Not Found
              </p>
            </div>
            <div className="mt-12 space-y-1">
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Protected Connection</p>
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Powered by Zyqitek</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Inactive / Draft Screen (Premium Dark Theme)
  if (portalStatus === 'Inactive' || portalStatus === 'Draft') {
    return (
      <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center p-6 text-center font-sans relative overflow-hidden">
        <EnterpriseBackgroundAnimation intensity="subtle" />
        <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in duration-500">
          <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-10 sm:p-12 shadow-2xl">
            <div className="flex justify-center mb-6">
              <ZyqroLogo className="w-12 h-12 text-white opacity-80" />
            </div>
            <div className="space-y-3">
              <h1 className="text-xl font-bold tracking-[0.2em] text-white">
                Zyqitek
              </h1>
              <h2 className="text-sm font-semibold text-white/70 uppercase tracking-widest">
                {portalStatus === 'Draft' ? 'Portal Not Live' : 'Portal Inactive'}
              </h2>
              <p className="text-sm text-amber-400 font-medium">
                Access Disabled
              </p>
            </div>
            <div className="mt-12 space-y-1">
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Protected Connection</p>
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Powered by Zyqitek</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Gateway Login Screen (Simplified Light Theme for Client & Team Portals)
  if (!isPortalAuthenticated) {
    const isClient = type === 'client';

    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-sans relative select-none">
        
        {/* Simple Toast Notification */}
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 bg-white border border-slate-200 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 text-xs animate-in slide-in-from-top-2">
            <CheckCircle2 size={16} className="text-emerald-500 animate-pulse shrink-0" />
            <span className="italic font-normal text-slate-800 tracking-wide">{toastMessage}</span>
          </div>
        )}

        <div className="w-full max-w-[420px] animate-in fade-in duration-300">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-semibold tracking-wide text-[#00104a]">
              Login Page
            </h1>
          </div>
          
          <div className="bg-[#f2f4f7] rounded-3xl p-10 sm:p-12 shadow-[0_10px_40px_rgb(0,0,0,0.08)]">
            
            {isLocked ? (
              <div className="mb-6 p-4 bg-amber-50/90 border border-amber-200 rounded-2xl text-center space-y-2.5 animate-in fade-in duration-200">
                <p className="text-xs sm:text-sm font-semibold text-amber-900 leading-snug">
                  Login temporarily locked. Please try again after the timer expires.
                </p>
                <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 bg-white border border-amber-300/80 rounded-full shadow-2xs">
                  <Clock size={16} className="text-amber-700 animate-pulse shrink-0" />
                  <span className="font-mono font-bold text-lg text-amber-950 tracking-wider">
                    {formatTimer(lockRemainingSeconds)}
                  </span>
                </div>
              </div>
            ) : loginError ? (
              <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold text-center flex items-center justify-center gap-2">
                <AlertCircle size={14} className="text-rose-600 shrink-0" />
                <span>{loginError}</span>
              </div>
            ) : null}

            <form onSubmit={handlePortalLogin} className="space-y-6">
              
              <div className="space-y-2">
                <label className="block text-xl font-medium text-[#00104a] ml-2">
                  Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    ref={usernameRef}
                    value={usernameInput}
                    disabled={isLocked || isSubmittingLogin}
                    onChange={e => setUsernameInput(e.target.value)}
                    className="w-full px-5 py-3.5 bg-transparent border-[1.5px] border-[#00104a] rounded-full text-base text-[#00104a] font-medium focus:outline-none focus:ring-1 focus:ring-[#00104a] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xl font-medium text-[#00104a] ml-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={passwordInput}
                    disabled={isLocked || isSubmittingLogin}
                    onChange={e => setPasswordInput(e.target.value)}
                    className="w-full px-5 py-3.5 bg-transparent border-[1.5px] border-[#00104a] rounded-full text-base text-[#00104a] font-medium focus:outline-none focus:ring-1 focus:ring-[#00104a] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-center pt-6">
                <button
                  type="submit"
                  disabled={isLocked || isSubmittingLogin}
                  className="px-14 py-3 bg-[#00104a] hover:bg-[#00104a]/90 text-white font-medium text-xl rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer tracking-wide flex items-center justify-center shadow-md"
                >
                  {isSubmittingLogin ? (
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <span>Login</span>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <a
                href="mailto:support@zyqitek.com?subject=ZYQITEK%20Portal%20Login%20Support"
                className="text-sm font-medium text-[#00104a]/75 hover:text-[#00104a] underline underline-offset-4 transition-colors cursor-pointer inline-block"
              >
                Contact ZYQITEK Team
              </a>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // AUTHENTICATED CLIENT PORTAL VIEW
  if (type === 'client' && clientAccount) {
    const topLevelFolders = (clientAccount.folders || []).filter(f => !f.parentId);

    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
        {/* Top Navbar Header */}
        <header className="bg-white text-slate-900 sticky top-0 z-40 border-b border-slate-200 shadow-2xs">
          <div className="max-w-7xl 3xl:max-w-[1600px] 4k:max-w-[2200px] 5k:max-w-[3400px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ZyqroLogo className="h-8 w-8 shrink-0" iconSize="h-5 w-5" />
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-sm text-slate-900 tracking-tight">
                  Zyqitek
                </span>
                <span className="text-slate-500 text-xs font-medium">{clientAccount.clientService || 'Client Portal'}</span>
                <span className="hidden md:inline text-slate-300">|</span>
                <span className="hidden md:inline text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md font-medium">
                  {clientAccount.clientCompany || clientAccount.clientName}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Connected</span>
              </div>
              <button
                onClick={handlePortalLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Workspace Body */}
        <div className="max-w-7xl 3xl:max-w-[1600px] 4k:max-w-[2200px] 5k:max-w-[3400px] mx-auto px-4 sm:px-6 py-8 space-y-6">
          
          {/* Client Portal Tab Selector */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar flex-nowrap sm:flex-wrap">
            {(clientAccount.enabledSections || ["overview", "files", "domain", "services", "chat"]).map(sectionId => {
              const sectionInfo = AVAILABLE_SECTIONS.find(s => s.id === sectionId);
              if (!sectionInfo) return null;
              const IconComponent = (LucideIcons as any)[sectionInfo.icon] || LucideIcons.LayoutDashboard;
              const isActive = clientActiveTab === sectionId || (sectionId === "projects" && clientActiveTab === "overview");
              return (
                <button
                  key={sectionId}
                  onClick={() => setClientActiveTab(sectionId === "projects" ? "overview" : sectionId)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer ${isActive ? "bg-slate-900 text-white shadow-sm" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"}`}
                >
                  <IconComponent size={15} />
                  <span>{sectionInfo.label}</span>
                </button>
              );
            })}
          </div>

          {(clientAccount.enabledSections || ['overview', 'files', 'domain', 'services', 'chat']).includes('overview') && clientActiveTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Active Projects */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Activity size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">Active Projects</span>
                    <span className="text-xl font-bold text-slate-800">
                      {(clientAccount.projectDetails || []).filter(p => p.status !== 'Completed').length}
                    </span>
                  </div>
                </div>

                {/* Pending Requests */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                    <Clock size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">Pending Requests</span>
                    <span className="text-xl font-bold text-slate-800">
                      {(clientAccount.supportTickets || []).filter(t => t.status === 'Open' || t.status === 'In Progress').length}
                    </span>
                  </div>
                </div>

                {/* Available Files */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <FileText size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">Available Files</span>
                    <span className="text-xl font-bold text-slate-800">
                      {(clientAccount.projectFiles || []).length}
                    </span>
                  </div>
                </div>

                {/* Upcoming Deadline */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">Next Deadline</span>
                    <span className="text-xs font-bold text-slate-800 line-clamp-1 mt-0.5">
                      {(() => {
                        const deadlines = (clientAccount.projectDetails || [])
                          .map(p => p.deadline)
                          .filter((d): d is string => !!d)
                          .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
                        return deadlines[0] ? new Date(deadlines[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No deadlines';
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Projects Progress */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Project Workspace Overview</h3>
                      <p className="text-xs text-slate-400">Track milestones and progress of your currently active campaigns.</p>
                    </div>
                    <button 
                      onClick={() => setClientActiveTab('files')}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      View Files &rarr;
                    </button>
                  </div>

                  <div className="space-y-4">
                    {(clientAccount.projectDetails || []).length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs">No active projects linked to this workspace.</div>
                    ) : (
                      (clientAccount.projectDetails || []).map(project => (
                        <div key={project.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">{project.name}</span>
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                              {project.stage || 'In Progress'}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold text-slate-400">
                              <span>Milestone Progress</span>
                              <span>{project.progress}%</span>
                            </div>
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div className="bg-indigo-600 h-full transition-all duration-500" style={{ width: `${project.progress}%` }} />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Quick Actions & Recent Updates */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Quick Workspace Shortcuts</h3>
                    <p className="text-xs text-slate-400">Instantly perform common tasks inside your client workspace.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <button
                      onClick={() => setClientActiveTab('chat')}
                      className="w-full p-3.5 bg-slate-950 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-all flex items-center justify-between shadow-xs cursor-pointer"
                    >
                      <span>Direct Message Support</span>
                      <MessageSquare size={14} />
                    </button>

                    <button
                      onClick={() => setClientActiveTab('services')}
                      className="w-full p-3.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all flex items-center justify-between shadow-xs cursor-pointer"
                    >
                      <span>Request Web Dev / Service</span>
                      <Plus size={14} />
                    </button>

                    <button
                      onClick={() => setClientActiveTab('domain')}
                      className="w-full p-3.5 bg-white text-slate-700 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all flex items-center justify-between cursor-pointer"
                    >
                      <span>Check Domain / DNS records</span>
                      <Globe size={14} />
                    </button>
                  </div>

                  {/* Account Metadata */}
                  <div className="border-t border-slate-100 pt-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Client ID:</span>
                      <span className="font-mono font-medium text-slate-800">{clientAccount.clientId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Company:</span>
                      <span className="font-medium text-slate-800">{clientAccount.clientCompany || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Primary Email:</span>
                      <span className="font-medium text-slate-800">{clientAccount.clientEmail}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {((clientAccount.enabledSections || ['overview', 'files', 'domain', 'services', 'chat']).includes('files')) && clientActiveTab === 'files' && (
            <>
              {/* Dynamic Top Navigation Scroll Bar */}
              {topLevelFolders.length > 0 && (
                <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-1 overflow-x-auto">
                  <button
                    onClick={() => setSelectedPortalFolderId(null)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                      selectedPortalFolderId === null
                        ? 'bg-slate-900 text-white shadow-sm font-semibold'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <FolderOpen size={14} className={selectedPortalFolderId === null ? 'text-white' : 'text-slate-400'} />
                    <span>All Files & Folders</span>
                  </button>
                  {topLevelFolders.map(folder => {
                    const isActive = selectedPortalFolderId === folder.id;
                    return (
                      <button
                        key={folder.id}
                        onClick={() => setSelectedPortalFolderId(folder.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                          isActive
                            ? 'bg-slate-900 text-white shadow-sm font-semibold'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <Folder size={14} className={isActive ? 'text-white fill-white/10' : 'text-slate-400'} />
                        <span>{folder.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Files & Documents Section */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Files & Documents
                  </h2>
                  <p className="text-xs text-slate-500">
                    Private workspace for client review, downloads, and collaboration.
                  </p>
                </div>

                {/* Folder Workspace */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs min-h-[450px]">
                  <FolderExplorer
                    key={selectedPortalFolderId || 'root'}
                    folders={clientAccount.folders || []}
                    files={clientAccount.projectFiles || []}
                    initialFolderId={selectedPortalFolderId}
                    onUpdateFoldersAndFiles={handlePortalUpdateFoldersAndFiles}
                    onUploadFile={clientAccount.clientUploadEnabled ? handlePortalFolderUploadFile : undefined}
                    isUploading={isUploading}
                    uploadProgress={uploadProgress}
                    isReadOnly={true}
                    userRole="client"
                  />
                </div>
              </div>
            </>
          )}

          {((clientAccount.enabledSections || ['overview', 'files', 'domain', 'services', 'chat']).includes('domain')) && clientActiveTab === 'domain' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Domain & DNS Management
                </h2>
                <p className="text-xs text-slate-500">
                  View your current active domains, status, name servers, and configured DNS values.
                </p>
              </div>

              {/* Domain Details Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Domain info card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 md:col-span-2">
                  <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider pb-2 border-b border-slate-100">
                    <Globe size={16} />
                    <span>Domain Configurations</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">Registered Domain</span>
                      <span className="text-sm font-mono font-bold text-slate-800">
                        {clientAccount.domainInfo?.domainName || 'Not configured'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">Registrar</span>
                      <span className="text-sm font-semibold text-slate-800">
                        {clientAccount.domainInfo?.registrar || 'Not configured'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">Domain Expiry</span>
                      <span className="text-sm font-semibold text-slate-800">
                        {clientAccount.domainInfo?.expiryDate 
                          ? new Date(clientAccount.domainInfo.expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'Not configured'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">Domain Status</span>
                      <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-md mt-0.5 ${
                        clientAccount.domainInfo?.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {clientAccount.domainInfo?.status || 'Not configured'}
                      </span>
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">Active Name Servers</span>
                      <div className="text-xs font-mono font-medium text-slate-600 bg-slate-50 border border-slate-100 p-3 rounded-xl mt-1 space-y-1">
                        {clientAccount.domainInfo?.nameservers && clientAccount.domainInfo.nameservers.length > 0 ? (
                          clientAccount.domainInfo.nameservers.map((ns, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                              <span>{ns}</span>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(ns);
                                  showToast('Nameserver copied to clipboard.');
                                }} 
                                className="text-slate-400 hover:text-slate-800 transition-colors text-[10px]"
                              >
                                Copy
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="text-slate-400">Not configured</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Extra hosting metadata card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider pb-2 border-b border-slate-100">
                    <Server size={16} />
                    <span>Hosting & Security</span>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">Hosting Provider</span>
                      <span className="text-sm font-semibold text-slate-800">
                        {clientAccount.hostingInfo?.provider || 'Not configured'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">SSL Status</span>
                      <span className="flex items-center gap-1.5 mt-0.5">
                        <ShieldCheck size={16} className={clientAccount.domainInfo?.sslStatus === 'Active' ? 'text-emerald-600' : 'text-slate-300'} />
                        <span className="text-sm font-semibold text-slate-800">
                          {clientAccount.domainInfo?.sslStatus || 'Not configured'}
                        </span>
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">Deployment Status</span>
                      <span className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 mt-1">
                        {clientAccount.domainInfo?.deploymentStatus || 'Not configured'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* DNS Records list */}
                <div className="md:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
                      <FileText size={16} />
                      <span>DNS Records</span>
                    </div>
                    <span className="text-[10px] text-slate-400">VIEW ONLY</span>
                  </div>

                  {!clientAccount.dnsRecords || clientAccount.dnsRecords.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs">
                      No DNS records configured.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="py-2.5 px-3">Type</th>
                            <th className="py-2.5 px-3">Name</th>
                            <th className="py-2.5 px-3">Value</th>
                            <th className="py-2.5 px-3">TTL</th>
                            <th className="py-2.5 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                          {clientAccount.dnsRecords.map((record, index) => (
                            <tr key={index} className="hover:bg-slate-50">
                              <td className="py-3 px-3 font-bold text-indigo-600">{record.type}</td>
                              <td className="py-3 px-3 text-slate-900">{record.name}</td>
                              <td className="py-3 px-3 text-slate-600 max-w-xs truncate" title={record.value}>{record.value}</td>
                              <td className="py-3 px-3 text-slate-400">{record.ttl || 'Auto'}</td>
                              <td className="py-3 px-3 text-right font-sans">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(record.value);
                                    showToast('Value copied to clipboard.');
                                  }}
                                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                                >
                                  Copy
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {((clientAccount.enabledSections || ['overview', 'files', 'domain', 'services', 'chat']).includes('services')) && clientActiveTab === 'services' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Services & Requests
                  </h2>
                  <p className="text-xs text-slate-500">
                    Submit new development requirements, ongoing maintenance requests, or check active service updates.
                  </p>
                </div>

                <button
                  onClick={() => setShowNewTicketModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap self-start sm:self-auto"
                >
                  <Plus size={14} />
                  <span>New Service Request</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Tickets Sidebar / List */}
                <div className="lg:col-span-1 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 max-h-[600px] overflow-y-auto">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider px-2">Current Service Tickets</span>

                  {(!clientAccount.supportTickets || clientAccount.supportTickets.length === 0) ? (
                    <div className="text-center py-10 text-slate-400 text-xs">
                      No service requests submitted yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {clientAccount.supportTickets.map(ticket => {
                        const isActive = selectedTicketId === ticket.id;
                        return (
                          <button
                            key={ticket.id}
                            onClick={() => {
                              setSelectedTicketId(ticket.id);
                              setNewReplyMessage('');
                            }}
                            className={`w-full text-left p-3 rounded-xl border text-xs transition-all cursor-pointer block ${
                              isActive
                                ? 'bg-indigo-50 border-indigo-200'
                                : 'bg-white hover:bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-mono font-bold text-slate-500 text-[10px]">{ticket.ticketId}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                ticket.status === 'Open'
                                  ? 'bg-blue-50 text-blue-700'
                                  : ticket.status === 'In Progress'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}>
                                {ticket.status}
                              </span>
                            </div>
                            <h4 className="font-bold text-slate-800 line-clamp-1 mb-1">{ticket.subject}</h4>
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span>Priority: {ticket.priority}</span>
                              <span>{new Date(ticket.createdAt).toLocaleDateString('en-US')}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Ticket Details Workspace */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs min-h-[400px] flex flex-col">
                  {(() => {
                    const activeTicket = (clientAccount.supportTickets || []).find(t => t.id === selectedTicketId);
                    if (!activeTicket) {
                      return (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-2">
                          <Layers size={32} className="text-slate-300" />
                          <div className="text-xs font-semibold">No Ticket Selected</div>
                          <p className="text-[11px] max-w-xs">Select an active service request from the list to view conversations and add replies.</p>
                        </div>
                      );
                    }

                    return (
                      <div className="flex-1 flex flex-col h-full space-y-4">
                        {/* Ticket Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono font-bold text-slate-400 text-xs">{activeTicket.ticketId}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                activeTicket.status === 'Open'
                                  ? 'bg-blue-50 text-blue-700'
                                  : activeTicket.status === 'In Progress'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}>
                                {activeTicket.status}
                              </span>
                            </div>
                            <h3 className="text-sm font-bold text-slate-800">{activeTicket.subject}</h3>
                          </div>
                          <div className="text-right sm:text-right text-[10px] text-slate-400">
                            <div>Submitted: {new Date(activeTicket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                            <div>Priority: <span className="font-bold">{activeTicket.priority}</span></div>
                          </div>
                        </div>

                        {/* Conversations List */}
                        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 max-h-[350px] min-h-[250px]">
                          {(activeTicket.messages || []).map((msg, idx) => {
                            const isClient = msg.sender === 'Client';
                            return (
                              <div key={idx} className={`flex flex-col ${isClient ? 'items-end' : 'items-start'}`}>
                                <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                                  <span>{msg.senderName}</span>
                                  <span>&bull;</span>
                                  <span>{new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                                </div>
                                <div className={`p-3 rounded-2xl text-xs max-w-md ${
                                  isClient 
                                    ? 'bg-slate-900 text-white rounded-tr-none' 
                                    : 'bg-slate-100 text-slate-800 rounded-tl-none'
                                }`}>
                                  {msg.message}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Ticket Reply Input */}
                        <div className="pt-3 border-t border-slate-100 flex gap-2">
                          <input
                            type="text"
                            value={newReplyMessage}
                            onChange={(e) => setNewReplyMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleReplyToTicket(activeTicket.id)}
                            placeholder="Type a message or response..."
                            className="flex-1 h-10 px-3.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                          />
                          <button
                            onClick={() => handleReplyToTicket(activeTicket.id)}
                            disabled={replyingToTicket || !newReplyMessage.trim()}
                            className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center transition-all cursor-pointer whitespace-nowrap shadow-xs"
                          >
                            {replyingToTicket ? 'Sending...' : 'Send Reply'}
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* NEW REQUEST MODAL */}
              {showNewTicketModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                          <Briefcase size={18} />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-slate-800">Submit Service Request</h3>
                          <p className="text-[10px] text-slate-400">Describe your web development or content request.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowNewTicketModal(false)}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <form onSubmit={handleCreateSupportTicket} className="space-y-4 text-slate-700">
                      {/* Subject */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Subject / Feature Name</label>
                        <input
                          type="text"
                          required
                          value={newTicketSubject}
                          onChange={(e) => setNewTicketSubject(e.target.value)}
                          placeholder="e.g. Set up Facebook Pixel, Fix Footer Link"
                          className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                        />
                      </div>

                      {/* Priority */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Priority Urgency</label>
                        <select
                          value={newTicketPriority}
                          onChange={(e) => setNewTicketPriority(e.target.value as any)}
                          className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                        >
                          <option value="Low">Low (General updates)</option>
                          <option value="Medium">Medium (Fixes within 48h)</option>
                          <option value="High">High (Urgent fixes within 12h)</option>
                          <option value="Urgent">Urgent (Immediate critical blocker)</option>
                        </select>
                      </div>

                      {/* Description */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Requirement Details</label>
                        <textarea
                          required
                          value={newTicketMessage}
                          onChange={(e) => setNewTicketMessage(e.target.value)}
                          rows={4}
                          placeholder="Provide all specific instructions, URLs, copy/text changes, or credential notes for this development task..."
                          className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all placeholder:text-slate-400/60"
                        />
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowNewTicketModal(false)}
                          className="px-4 py-2 hover:bg-slate-50 rounded-xl text-xs text-slate-500 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submittingTicket}
                          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          {submittingTicket ? <RefreshCw size={13} className="animate-spin" /> : <Plus size={13} />}
                          <span>Submit Request</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {((clientAccount.enabledSections || ['overview', 'files', 'domain', 'services', 'chat']).includes('chat')) && clientActiveTab === 'chat' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                  Chat & Communication
                </h2>
                <p className="text-xs text-slate-500">
                  Direct real-time communication channel with Zyqitek CRM Admin.
                </p>
              </div>
              <PortalChat
                mode="portal"
                portalId={portalId}
                portalClientId={clientAccount.clientId || clientAccount.id}
                portalType="client"
                portalName={clientAccount.clientCompany || clientAccount.clientName}
                currentUserId={clientAccount.clientId || portalId}
                currentUserName={clientAccount.clientName || 'Client'}
                currentUserRole="Client"
                clients={[{ id: clientAccount.id, portalId: portalId, clientId: clientAccount.clientId, name: clientAccount.clientName, company: clientAccount.clientCompany }]}
                projects={clientAccount.projectDetails || []}
                showToast={showToast}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // AUTHENTICATED TEAM PORTAL VIEW (PRISTINE ENTERPRISE WORKSPACE THEME)
  if (type === 'team' && teamAccount) {
    const filteredFolders = teamAccount.folders && teamAccount.folders.length > 0 
      ? teamAccount.folders 
      : [];

    const teamFiles = teamAccount.projectFiles || [];
    const assignedProjectIds = teamAccount.assignedProjectIds || [];
    const fullProjects = teamAccount.projects || [];

    // Helper to format or extract rich project information
    const getProjectInfo = (projId: string) => {
      const found = fullProjects.find(p => p.id === projId);
      return {
        id: projId,
        name: found?.name || `Project ${projId.slice(-6).toUpperCase()}`,
        clientName: found?.clientName || 'Zyqitek Client',
        status: found?.status || 'In Progress',
        progress: typeof found?.projectProgress === 'number' 
          ? found.projectProgress 
          : typeof found?.progress === 'number' 
            ? found.progress 
            : 60,
        priority: found?.priority || 'Medium',
        deadline: found?.deadline || null,
        budget: found?.budget || null,
      };
    };

    // Filter projects based on search & filter tab
    const filteredProjects = assignedProjectIds
      .map(getProjectInfo)
      .filter(proj => {
        const matchesSearch = !teamProjectSearch.trim() || 
          proj.name.toLowerCase().includes(teamProjectSearch.toLowerCase()) || 
          proj.id.toLowerCase().includes(teamProjectSearch.toLowerCase()) ||
          proj.clientName.toLowerCase().includes(teamProjectSearch.toLowerCase());
        
        if (!matchesSearch) return false;
        if (teamProjectFilter === 'active') return proj.status !== 'Completed' && proj.status !== 'Delivered';
        if (teamProjectFilter === 'completed') return proj.status === 'Completed' || proj.status === 'Delivered';
        return true;
      });

    const teamNavigationItems = [
      { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard, badge: null },
      { id: 'projects', label: 'Assigned Projects', shortLabel: 'Projects', icon: FolderGit2, badge: assignedProjectIds.length > 0 ? String(assignedProjectIds.length) : null },
      { id: 'files', label: 'Workspace Files', shortLabel: 'Files', icon: Folder, badge: teamFiles.length > 0 ? String(teamFiles.length) : null },
      { id: 'chat', label: 'Team Chat', shortLabel: 'Chat', icon: MessageSquare, badge: null },
      { id: 'profile', label: 'My Profile', shortLabel: 'Profile', icon: UserCircle, badge: null },
    ];

    const currentTabInfo = teamNavigationItems.find(n => n.id === teamActiveTab) || teamNavigationItems[0];
    const userInitials = teamAccount.fullName
      ? teamAccount.fullName.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
      : 'TM';

    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex antialiased overflow-hidden">
        {/* Mobile Navigation Drawer */}
        {teamMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex animate-in fade-in duration-200">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity cursor-pointer"
              onClick={() => setTeamMobileMenuOpen(false)}
            />
            {/* Drawer */}
            <div className="relative w-72 max-w-[82vw] bg-white h-full flex flex-col z-10 shadow-2xl border-r border-slate-200 animate-in slide-in-from-left duration-300">
              <div className="p-5 flex items-center justify-between border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <ZyqroLogo className="h-8 w-8 shrink-0" iconSize="h-4.5 w-4.5" />
                  <div>
                    <h1 className="font-extrabold text-xs text-slate-900 tracking-wider leading-none">
                      ZYQITEK
                    </h1>
                    <span className="text-[10px] font-bold text-indigo-600 tracking-wider uppercase">
                      Team Workspace
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setTeamMobileMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto">
                {teamNavigationItems.map(item => {
                  const Icon = item.icon;
                  const isActive = teamActiveTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setTeamActiveTab(item.id);
                        setTeamMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs font-semibold' 
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={16} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                        <span className="text-xs">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-slate-200 space-y-3 bg-slate-50/50">
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs border border-indigo-200 shrink-0">
                      {userInitials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-900 font-bold truncate">{teamAccount.fullName}</p>
                      <p className="text-[10px] text-indigo-600 font-medium truncate">{teamAccount.role || 'Team Member'}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handlePortalLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all font-semibold text-xs cursor-pointer"
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Left Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 hidden lg:flex text-slate-900 shadow-2xs">
          <div className="p-5 flex items-center gap-3 border-b border-slate-200">
            <ZyqroLogo className="h-9 w-9 shrink-0" iconSize="h-5 w-5" />
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-xs text-slate-900 tracking-wider leading-none">
                  ZYQITEK
                </h1>
                <span className="px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-[9px] font-bold text-indigo-700 leading-none">
                  PORTAL
                </span>
              </div>
              <p className="text-[10px] font-semibold text-slate-500 mt-1 leading-none">
                Team Workspace
              </p>
            </div>
          </div>

          <div className="px-4 pt-4 pb-1">
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200/70 text-[10px]">
              <span className="text-slate-500 font-medium">Session Status</span>
              <div className="flex items-center gap-1 text-emerald-700 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Encrypted</span>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto">
            {teamNavigationItems.map(item => {
              const Icon = item.icon;
              const isActive = teamActiveTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setTeamActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs font-semibold' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon size={16} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                    <span className="text-xs truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                      isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-200 space-y-2.5 bg-slate-50/50">
            <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs border border-indigo-200 shrink-0">
                  {userInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-900 font-bold truncate leading-tight">{teamAccount.fullName}</p>
                  <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded inline-block mt-0.5">
                    {teamAccount.role || 'Team Member'}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                <span className="truncate font-mono">
                  ID: {teamAccount.teamMemberId || getMasterTeamMemberId(teamAccount)}
                </span>
                <button
                  onClick={() => {
                    const idToCopy = teamAccount.teamMemberId || getMasterTeamMemberId(teamAccount);
                    navigator.clipboard.writeText(idToCopy);
                    showToast('Team Member ID copied to clipboard');
                  }}
                  title="Copy ID"
                  className="hover:text-indigo-600 text-slate-400 transition-colors cursor-pointer"
                >
                  <Copy size={12} />
                </button>
              </div>
            </div>
            <button
              onClick={handlePortalLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-left text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all font-medium text-xs cursor-pointer"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Workspace Area */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#F8FAFC] text-slate-900">
          {/* Header */}
          <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between shrink-0 text-slate-900 shadow-2xs z-10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setTeamMobileMenuOpen(true)}
                className="p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl lg:hidden transition-colors cursor-pointer"
                aria-label="Open navigation menu"
              >
                <Menu size={20} />
              </button>
              <div className="flex items-center gap-2">
                <currentTabInfo.icon size={16} className="text-indigo-600 shrink-0" />
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-slate-400 hidden sm:inline">Workspace</span>
                  <span className="text-slate-300 hidden sm:inline">/</span>
                  <h2 className="font-bold text-slate-900 tracking-tight">
                    {currentTabInfo.label}
                  </h2>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-200/80">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-semibold text-emerald-800">Online Sync Active</span>
              </div>
              
              <button
                onClick={() => setTeamActiveTab('profile')}
                className="flex items-center gap-2.5 p-1 pl-1.5 sm:pr-3 rounded-full hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                title="View My Profile"
              >
                <div className="h-8 w-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                  {userInitials}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-slate-900 leading-none truncate max-w-[120px]">{teamAccount.fullName}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-none">{teamAccount.role || 'Member'}</p>
                </div>
              </button>
            </div>
          </header>

          {/* Content Scroll Area */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-8 pb-24 lg:pb-8">
            <div className="max-w-6xl 3xl:max-w-7xl 4k:max-w-[2000px] 5k:max-w-[3000px] mx-auto space-y-8">
              
              {/* DASHBOARD TAB */}
              {teamActiveTab === 'dashboard' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Hero Greeting Banner */}
                  <div className="p-6 sm:p-7 bg-white rounded-3xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative overflow-hidden">
                    <div className="space-y-1.5 relative z-10">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                          Welcome back, {teamAccount.fullName.split(' ')[0]} 👋
                        </h2>
                        <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
                          {teamAccount.role || 'Team Member'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                        Your workspace is active. You have access to {assignedProjectIds.length} assigned project workspace(s) and {teamFiles.length} shared team documents.
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5 w-full sm:w-auto relative z-10">
                      <button
                        onClick={() => setTeamActiveTab('files')}
                        className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#00104a] hover:bg-[#00104a]/90 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                      >
                        <Folder size={15} />
                        <span>Workspace Files</span>
                      </button>
                      <button
                        onClick={() => setTeamActiveTab('chat')}
                        className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
                      >
                        <MessageSquare size={15} className="text-indigo-600" />
                        <span>Team Chat</span>
                      </button>
                    </div>
                  </div>

                  {/* High-Craft Metrics Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* ASSIGNED PROJECTS */}
                    <div 
                      onClick={() => setTeamActiveTab('projects')}
                      className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Projects</span>
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-105 transition-transform">
                          <Briefcase size={18} />
                        </div>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">{assignedProjectIds.length}</h3>
                        <span className="text-[11px] font-semibold text-indigo-600 group-hover:underline flex items-center gap-0.5">
                          View Workspaces →
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Active project workspaces</p>
                    </div>

                    {/* WORKSPACE FILES */}
                    <div 
                      onClick={() => setTeamActiveTab('files')}
                      className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Workspace Files</span>
                        <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl group-hover:scale-105 transition-transform">
                          <Folder size={18} />
                        </div>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">{teamFiles.length}</h3>
                        <span className="text-[11px] font-semibold text-sky-600 group-hover:underline flex items-center gap-0.5">
                          Browse Files →
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Shared project assets & docs</p>
                    </div>

                    {/* UPLOAD CLEARANCE */}
                    <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Upload Clearance</span>
                        <div className={`p-2.5 rounded-xl ${
                          teamAccount.permissions?.canUploadFiles ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                        }`}>
                          <UploadCloud size={18} />
                        </div>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <h3 className={`text-xl font-black ${
                          teamAccount.permissions?.canUploadFiles ? 'text-emerald-700' : 'text-slate-600'
                        }`}>
                          {teamAccount.permissions?.canUploadFiles ? 'Authorized' : 'Read-Only'}
                        </h3>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {teamAccount.permissions?.canUploadFiles ? 'File uploading enabled' : 'File viewing permitted'}
                      </p>
                    </div>

                    {/* SECURITY & STATUS */}
                    <div 
                      onClick={() => setTeamActiveTab('profile')}
                      className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Security Clearance</span>
                        <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl group-hover:scale-105 transition-transform">
                          <ShieldCheck size={18} />
                        </div>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <h3 className="text-xl font-black text-slate-900">{teamAccount.status || 'Active'}</h3>
                        <span className="text-[11px] font-semibold text-violet-600 group-hover:underline">
                          Details →
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Verified team member account</p>
                    </div>
                  </div>

                  {/* Recent Assigned Projects Showcase */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                          Assigned Project Workspaces
                        </h3>
                        <p className="text-xs text-slate-500">
                          Direct access to your dedicated workspace folders
                        </p>
                      </div>
                      {assignedProjectIds.length > 0 && (
                        <button 
                          onClick={() => setTeamActiveTab('projects')}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>View All ({assignedProjectIds.length})</span>
                          <ArrowRight size={14} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {assignedProjectIds.length > 0 ? (
                        assignedProjectIds.slice(0, 3).map(projId => {
                          const proj = getProjectInfo(projId);
                          return (
                            <div 
                              key={projId}
                              onClick={() => {
                                setSelectedPortalFolderId(projId);
                                setTeamActiveTab('files');
                              }}
                              className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                            >
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="h-10 w-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform shrink-0">
                                    <FolderGit2 size={20} />
                                  </div>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    proj.status === 'Completed' ? 'bg-slate-100 text-slate-700' :
                                    proj.status === 'Review' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                    'bg-blue-50 text-blue-700 border border-blue-200'
                                  }`}>
                                    {proj.status}
                                  </span>
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                                    {proj.name}
                                  </h4>
                                  <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 font-medium">
                                    <Building size={12} className="text-slate-400" />
                                    <span>{proj.clientName}</span>
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-2 pt-3 border-t border-slate-100">
                                <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                                  <span>Progress</span>
                                  <span>{proj.progress}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${Math.max(5, Math.min(100, proj.progress))}%` }}
                                  />
                                </div>
                                <div className="flex items-center justify-between pt-1 text-[11px] font-bold text-indigo-600">
                                  <span className="text-[10px] text-slate-400 font-mono">ID: {projId.slice(-8)}</span>
                                  <span className="flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                    Open Files →
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="col-span-full py-12 bg-white rounded-3xl border border-slate-200 border-dashed text-center space-y-3">
                          <FolderGit2 className="mx-auto text-slate-300" size={36} />
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">No Projects Assigned Yet</h4>
                            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                              Your account is ready. Project folders assigned by your administrator will appear here automatically.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Security & Support Quick Card */}
                  <div className="p-4 sm:p-5 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-white text-indigo-600 rounded-xl shadow-2xs shrink-0">
                        <ShieldCheck size={20} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-indigo-950">Encrypted Workspace Safeguards</h4>
                        <p className="text-[11px] text-indigo-800/80 mt-0.5">
                          Files and communication are protected by brute-force protection and role-based clearance.
                        </p>
                      </div>
                    </div>
                    <a
                      href="mailto:support@zyqitek.com?subject=Team%20Portal%20Inquiry"
                      className="px-4 py-2 bg-white hover:bg-slate-50 text-indigo-950 text-xs font-bold rounded-xl border border-indigo-200 shadow-2xs transition-all shrink-0 cursor-pointer"
                    >
                      Contact Administrator
                    </a>
                  </div>
                </div>
              )}

              {/* PROJECTS TAB */}
              {teamActiveTab === 'projects' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 tracking-tight">Assigned Projects</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Access dedicated workspace folders and shared files for your assigned client projects.
                      </p>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl shadow-2xs self-start sm:self-auto">
                      <button
                        onClick={() => setTeamProjectFilter('all')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          teamProjectFilter === 'all' 
                            ? 'bg-[#00104a] text-white shadow-2xs' 
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        All ({assignedProjectIds.length})
                      </button>
                      <button
                        onClick={() => setTeamProjectFilter('active')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          teamProjectFilter === 'active' 
                            ? 'bg-[#00104a] text-white shadow-2xs' 
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        Active
                      </button>
                      <button
                        onClick={() => setTeamProjectFilter('completed')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                          teamProjectFilter === 'completed' 
                            ? 'bg-[#00104a] text-white shadow-2xs' 
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        Completed
                      </button>
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search assigned projects by title, client name, or ID..."
                      value={teamProjectSearch}
                      onChange={e => setTeamProjectSearch(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-2xs"
                    />
                    {teamProjectSearch && (
                      <button
                        onClick={() => setTeamProjectSearch('')}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Projects Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredProjects.length > 0 ? (
                      filteredProjects.map(proj => (
                        <div 
                          key={proj.id}
                          onClick={() => {
                            setSelectedPortalFolderId(proj.id);
                            setTeamActiveTab('files');
                          }}
                          className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                        >
                          <div className="space-y-3.5">
                            <div className="flex items-center justify-between">
                              <div className="h-12 w-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform shrink-0">
                                <FolderGit2 size={24} />
                              </div>
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                proj.status === 'Completed' ? 'bg-slate-100 text-slate-700' :
                                proj.status === 'Review' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}>
                                {proj.status}
                              </span>
                            </div>

                            <div>
                              <h3 className="font-extrabold text-slate-900 text-base group-hover:text-indigo-600 transition-colors line-clamp-1">
                                {proj.name}
                              </h3>
                              <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                                <Building size={13} className="text-slate-400" />
                                <span>{proj.clientName}</span>
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2 text-[11px]">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-mono">
                                ID: {proj.id.slice(-8)}
                              </span>
                              {proj.deadline && (
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md flex items-center gap-1 font-medium">
                                  <Calendar size={11} className="text-slate-400" />
                                  <span>{proj.deadline}</span>
                                </span>
                              )}
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-semibold">
                                {proj.priority} Priority
                              </span>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-slate-100 space-y-3">
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                                <span>Completion</span>
                                <span className="text-slate-800">{proj.progress}%</span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                                  style={{ width: `${Math.max(5, Math.min(100, proj.progress))}%` }}
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-xs pt-1">
                              <span className="text-slate-400 text-[11px]">Shared Workspace</span>
                              <span className="font-bold text-indigo-600 group-hover:text-indigo-800 flex items-center gap-1">
                                <span>Open Folder</span>
                                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full py-16 bg-white rounded-3xl border border-slate-200 border-dashed text-center space-y-3">
                        <FolderGit2 className="mx-auto text-slate-300" size={44} />
                        <h3 className="text-base font-bold text-slate-900">
                          {teamProjectSearch ? 'No Matching Projects Found' : 'No Projects Assigned'}
                        </h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          {teamProjectSearch 
                            ? `No projects matched "${teamProjectSearch}". Try a different search term or clear the filter.`
                            : 'Projects assigned to your account by a Zyqitek administrator will be listed here.'}
                        </p>
                        {teamProjectSearch && (
                          <button
                            onClick={() => setTeamProjectSearch('')}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                          >
                            Clear Search Filter
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* FILES TAB */}
              {teamActiveTab === 'files' && (
                <div className="h-full flex flex-col space-y-5 animate-in fade-in duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 tracking-tight">Workspace Files & Documents</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Secure repository for assigned project deliverables, specifications, and client assets.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs">
                        {teamFiles.length} file(s) available
                      </span>
                      <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold border shadow-2xs ${
                        teamAccount.permissions?.canUploadFiles 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {teamAccount.permissions?.canUploadFiles ? '✓ Uploads Allowed' : 'Read-Only'}
                      </span>
                      {selectedPortalFolderId && (
                        <button 
                          onClick={() => setSelectedPortalFolderId(null)}
                          className="px-3.5 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <List size={14} />
                          <span>All Folders</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {selectedPortalFolderId && (
                    <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-2xl flex items-center justify-between text-xs text-indigo-900">
                      <div className="flex items-center gap-2 font-medium truncate">
                        <FolderOpen size={16} className="text-indigo-600 shrink-0" />
                        <span>Filtered to Folder / Project: <strong className="font-mono">{selectedPortalFolderId}</strong></span>
                      </div>
                      <button
                        onClick={() => setSelectedPortalFolderId(null)}
                        className="text-xs font-bold text-indigo-700 hover:text-indigo-950 underline underline-offset-2 shrink-0 cursor-pointer ml-3"
                      >
                        Reset Filter
                      </button>
                    </div>
                  )}

                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs min-h-[520px]">
                    <FolderExplorer
                      folders={filteredFolders}
                      files={teamFiles}
                      onUpdateFoldersAndFiles={handlePortalUpdateFoldersAndFiles}
                      onUploadFile={teamAccount.permissions?.canUploadFiles ? handlePortalFolderUploadFile : undefined}
                      isUploading={isUploading}
                      uploadProgress={uploadProgress}
                      isReadOnly={!teamAccount.permissions?.canCreateFolders && !teamAccount.permissions?.canUploadFiles}
                      initialFolderId={selectedPortalFolderId}
                      userRole="team"
                    />
                  </div>
                </div>
              )}

              {/* CHAT TAB */}
              {teamActiveTab === 'chat' && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
                        <MessageSquare className="w-5 h-5 text-indigo-600" />
                        Team Communication Channel
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Encrypted internal real-time discussion channel with Zyqitek CRM Administrators.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[11px] font-bold text-emerald-800">Admin Connection Ready</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs p-2 sm:p-4">
                    <PortalChat
                      mode="portal"
                      portalId={portalId}
                      portalTeamMemberId={teamAccount.teamMemberId || teamAccount.id}
                      portalType="team"
                      portalName={teamAccount.fullName}
                      currentUserId={teamAccount.teamMemberId || portalId}
                      currentUserName={teamAccount.fullName}
                      currentUserRole="Team Member"
                      teamMembers={[{ id: teamAccount.id, portalId: portalId, memberId: teamAccount.teamMemberId, name: teamAccount.fullName }]}
                      projects={teamAccount.projects || []}
                      showToast={showToast}
                    />
                  </div>
                </div>
              )}

              {/* PROFILE TAB */}
              {teamActiveTab === 'profile' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 tracking-tight font-sans">My Team Profile</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Your verified account details, security clearance, and system permission matrix.
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 rounded-full flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Verified Active</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Identity Details Card */}
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 space-y-6 shadow-2xs">
                      <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                        <div className="h-16 w-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xl shadow-xs shrink-0">
                          {userInitials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-lg font-black text-slate-900 truncate">{teamAccount.fullName}</h4>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                              {teamAccount.teamMemberId || getMasterTeamMemberId(teamAccount)}
                            </span>
                            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              {teamAccount.role || 'Team Member'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                          <UserCircle size={15} className="text-indigo-600" />
                          <span>Account Identity</span>
                        </h4>
                        
                        <div className="grid grid-cols-1 gap-3">
                          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Full Legal Name</span>
                            <p className="text-sm font-bold text-slate-900">{teamAccount.fullName}</p>
                          </div>
                          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Username</span>
                            <p className="text-sm font-mono font-bold text-slate-900">{teamAccount.username}</p>
                          </div>
                          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Email Address</span>
                            <p className="text-sm font-medium text-slate-900">{teamAccount.email || 'None on file'}</p>
                          </div>
                          {teamAccount.whatsapp && (
                            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">WhatsApp / Mobile</span>
                              <p className="text-sm font-medium text-slate-900">{teamAccount.whatsapp}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Permissions & Clearance Card */}
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 space-y-6 shadow-2xs flex flex-col justify-between">
                      <div className="space-y-5">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-3 flex items-center gap-2">
                          <Shield size={15} className="text-indigo-600" />
                          <span>Clearance & Permissions</span>
                        </h4>
                        
                        <div className="space-y-3">
                          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                            <div>
                              <span className="text-xs font-bold text-slate-800 block">Workspace Role</span>
                              <span className="text-[10px] text-slate-500">Security Clearance Level</span>
                            </div>
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold">
                              {teamAccount.role || 'Team Member'}
                            </span>
                          </div>

                          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                            <div>
                              <span className="text-xs font-bold text-slate-800 block">File Access & Viewing</span>
                              <span className="text-[10px] text-slate-500">Access to project files</span>
                            </div>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1">
                              <CheckCircle2 size={13} />
                              <span>Granted</span>
                            </span>
                          </div>

                          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                            <div>
                              <span className="text-xs font-bold text-slate-800 block">File Upload Rights</span>
                              <span className="text-[10px] text-slate-500">Upload to project repository</span>
                            </div>
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border ${
                              teamAccount.permissions?.canUploadFiles 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {teamAccount.permissions?.canUploadFiles ? (
                                <>
                                  <CheckCircle2 size={13} />
                                  <span>Enabled</span>
                                </>
                              ) : (
                                <span>Restricted</span>
                              )}
                            </span>
                          </div>

                          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                            <div>
                              <span className="text-xs font-bold text-slate-800 block">Folder Management</span>
                              <span className="text-[10px] text-slate-500">Create & organize folders</span>
                            </div>
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 border ${
                              teamAccount.permissions?.canCreateFolders 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {teamAccount.permissions?.canCreateFolders ? (
                                <>
                                  <CheckCircle2 size={13} />
                                  <span>Enabled</span>
                                </>
                              ) : (
                                <span>Restricted</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-3 mt-4">
                        <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-900 leading-relaxed font-medium">
                          To request permission changes, role elevation, or password reset, please contact your Zyqitek administrator directly.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-3 flex items-center justify-around shadow-lg">
          {teamNavigationItems.map(item => {
            const Icon = item.icon;
            const isActive = teamActiveTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTeamActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer relative ${
                  isActive ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon size={18} />
                <span className="text-[10px] mt-0.5 tracking-tight">{item.shortLabel}</span>
                {item.badge && (
                  <span className="absolute top-1 right-2.5 w-1.5 h-1.5 rounded-full bg-indigo-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
