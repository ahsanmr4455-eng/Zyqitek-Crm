import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ExternalLink,
  ShieldCheck,
  Search,
  Plus,
  Copy,
  Check,
  Eye,
  EyeOff,
  User,
  Building,
  Key,
  UserCog,
  Globe,
  Server,
  Mail,
  FolderGit2,
  FileText,
  FileSpreadsheet,
  HelpCircle,
  MessageSquare,
  StickyNote,
  Download,
  Trash2,
  RefreshCw,
  Send,
  Lock,
  Unlock,
  UploadCloud,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  ChevronRight,
  Sparkles,
  Link as LinkIcon,
  DollarSign,
  Briefcase,
  Layers,
  ArrowLeft,
  Settings
} from 'lucide-react';
import { ClientPortalAccount, Client, Project, InformationRecord } from '../types';
import { saveToFirestore, deleteFromFirestore, getCollectionOnce } from '../lib/firebaseSync';
import { generatePortalLink } from '../lib/portalRouter';
import { uploadPortalFile, deletePortalFile } from '../lib/fileStorage';
import FolderExplorer, { PortalFolder, PortalFile } from './FolderExplorer';

import CrmProfileView from './CrmProfileView';

function generateUUID(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from(array).map(byte => chars[byte % chars.length]).join('');
  }
  return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/[x]/g, function() {
    return (Math.random() * 62 | 0).toString(36);
  });
}

interface ClientPortalManagerProps {
  clients: Client[];
  projects: Project[];
  showToast: (message: string, type?: 'success' | 'error') => void;
  onOpenChat?: (portalId: string, type: 'client' | 'team') => void;
}

const AVAILABLE_SECTIONS = [
  { id: "overview", label: "Overview", category: "GENERAL" },
  { id: "projects", label: "Projects", category: "GENERAL" },
  { id: "files", label: "Files & Documents", category: "GENERAL" },
  { id: "chat", label: "Chat & Communication", category: "GENERAL" },

  { id: "website", label: "Website", category: "WEBSITE / E-COMMERCE" },
  { id: "ecommerce", label: "E-Commerce", category: "WEBSITE / E-COMMERCE" },
  { id: "domain", label: "Domain & DNS", category: "WEBSITE / E-COMMERCE" },
  { id: "hosting", label: "Hosting", category: "WEBSITE / E-COMMERCE" },
  { id: "ssl", label: "SSL", category: "WEBSITE / E-COMMERCE" },
  { id: "deployment", label: "Deployment", category: "WEBSITE / E-COMMERCE" },
  { id: "maintenance_web", label: "Maintenance", category: "WEBSITE / E-COMMERCE" },

  { id: "graphic_design", label: "Graphic Design", category: "DESIGN" },
  { id: "logo_brand", label: "Logo & Brand Identity", category: "DESIGN" },
  { id: "branding_assets", label: "Branding Assets", category: "DESIGN" },
  { id: "design_deliverables", label: "Design Deliverables", category: "DESIGN" },
  { id: "brand_guidelines", label: "Brand Guidelines", category: "DESIGN" },

  { id: "video_editing", label: "Video Editing", category: "VIDEO / CREATIVE" },
  { id: "video_projects", label: "Video Projects", category: "VIDEO / CREATIVE" },
  { id: "raw_footage", label: "Raw Footage", category: "VIDEO / CREATIVE" },
  { id: "edited_videos", label: "Edited Videos", category: "VIDEO / CREATIVE" },
  { id: "final_deliverables", label: "Final Deliverables", category: "VIDEO / CREATIVE" },
  { id: "thumbnails", label: "Thumbnails", category: "VIDEO / CREATIVE" },
  { id: "motion_graphics", label: "Motion Graphics", category: "VIDEO / CREATIVE" },

  { id: "digital_marketing", label: "Digital Marketing", category: "MARKETING" },
  { id: "seo", label: "SEO", category: "MARKETING" },
  { id: "social_media", label: "Social Media", category: "MARKETING" },
  { id: "campaigns", label: "Campaigns", category: "MARKETING" },
  { id: "reports", label: "Reports", category: "MARKETING" },
  { id: "analytics", label: "Analytics", category: "MARKETING" },

  { id: "ugc_ads", label: "UGC Ads", category: "UGC / ADVERTISING" },
  { id: "ad_creatives", label: "Ad Creatives", category: "UGC / ADVERTISING" },
  { id: "campaign_assets", label: "Campaign Assets", category: "UGC / ADVERTISING" },
  { id: "ad_reports", label: "Ad Reports", category: "UGC / ADVERTISING" },
  { id: "deliverables", label: "Deliverables", category: "UGC / ADVERTISING" },
  { id: "feedback_ugc", label: "Feedback", category: "UGC / ADVERTISING" },

  { id: "software_development", label: "Software Development", category: "SOFTWARE / DEVELOPMENT" },
  { id: "app_web_dev", label: "App/Web Development", category: "SOFTWARE / DEVELOPMENT" },
  { id: "development_files", label: "Development Files", category: "SOFTWARE / DEVELOPMENT" },
  { id: "technical_docs", label: "Technical Documents", category: "SOFTWARE / DEVELOPMENT" },
  { id: "releases", label: "Releases", category: "SOFTWARE / DEVELOPMENT" },

  { id: "ai_automation", label: "AI Automation", category: "AI / AUTOMATION" },
  { id: "chatbots", label: "Chatbots", category: "AI / AUTOMATION" },
  { id: "automation_projects", label: "Automation Projects", category: "AI / AUTOMATION" },
  { id: "workflow_docs", label: "Workflow Documents", category: "AI / AUTOMATION" },
  { id: "api_docs", label: "API/Integration Documents", category: "AI / AUTOMATION" },

  { id: "services", label: "Services & Requests", category: "SUPPORT" },
  { id: "support", label: "Support", category: "SUPPORT" },
  { id: "maintenance_support", label: "Maintenance", category: "SUPPORT" },
  { id: "tickets", label: "Tickets", category: "SUPPORT" },
  { id: "feedback_support", label: "Feedback", category: "SUPPORT" }
];

const PRESET_FOLDERS = [
  "Project Files", "Final Deliverables", "Raw Files", "Brand Assets", "Logos",
  "Videos", "Thumbnails", "Documents", "Contracts", "Credentials", "Reports",
  "Marketing", "UGC", "SEO", "Development", "Automation", "Designs", "Other"
];


export default function ClientPortalManager({ clients, projects, showToast, onOpenChat }: ClientPortalManagerProps) {
  const [portals, setPortals] = useState<ClientPortalAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [portalSyncStatus, setPortalSyncStatus] = useState<Record<string, 'Synced' | 'Syncing' | 'Failed'>>({});

  // Selected Portal for Portal Workspace View
  const [selectedPortal, setSelectedPortal] = useState<ClientPortalAccount | null>(null);
  const [selectedPortalProfile, setSelectedPortalProfile] = useState<ClientPortalAccount | null>(null);

  // Multi-select and Long-press system for Portals
  const [selectedPortalIds, setSelectedPortalIds] = useState<string[]>([]);
  const [showBulkDeletePortalsConfirm, setShowBulkDeletePortalsConfirm] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggeredForId = useRef<string | null>(null);
  const isTouchDevice = useRef(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedPortalIds.length > 0) {
        setSelectedPortalIds([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPortalIds]);

  const handleToggleSelectPortal = (id: string) => {
    if (!id) return;
    setSelectedPortalIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllPortals = (filtered: ClientPortalAccount[]) => {
    const filteredIds = filtered.map(p => p.id);
    const allSelected = filteredIds.every(id => selectedPortalIds.includes(id));
    if (allSelected) {
      setSelectedPortalIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedPortalIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  // Context Action Menu state
  const [actionMenuPortal, setActionMenuPortal] = useState<ClientPortalAccount | null>(null);

  const startPress = (portal: ClientPortalAccount) => {
    longPressTriggeredForId.current = null;
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      longPressTriggeredForId.current = portal.id;
      setActionMenuPortal(portal);
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
    if (selectedPortalIds.length > 0) {
      handleToggleSelectPortal(id);
    } else {
      normalClick();
    }
  };

  const getPressHandlers = (portal: ClientPortalAccount, normalClick: () => void) => {
    return {
      onMouseDown: (e: React.MouseEvent) => {
        if (isTouchDevice.current) return;
        if (e.button !== 0) return;
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('a') || target.closest('svg')) {
          return;
        }
        startPress(portal);
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
        startPress(portal);
      },
      onTouchEnd: () => {
        cancelPress();
      },
      onTouchMove: cancelPress,
      onContextMenu: (e: React.MouseEvent) => {
        e.preventDefault();
        setActionMenuPortal(portal);
      },
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('a')) {
          return;
        }
        handleRowClick(portal.id, normalClick);
      }
    };
  };

  const handleExecuteBulkDeletePortals = async () => {
    for (const id of selectedPortalIds) {
      try {
        await handleDeletePortal(id);
      } catch (err) {
        console.error('Error deleting portal:', err);
      }
    }
    setSelectedPortalIds([]);
    setShowBulkDeletePortalsConfirm(false);
    showToast('Selected portals deleted successfully.', 'success');
  };

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditPortalModal, setShowEditPortalModal] = useState<ClientPortalAccount | null>(null);
  const [editPortalForm, setEditPortalForm] = useState<{
    clientService: string;
    enabledSections: string[];
    folders: string[];
    customFolders: string[];
    newCustomFolder: string;
    clientUploadEnabled?: boolean;
    clientDownloadEnabled?: boolean;
  }>({ clientService: '', enabledSections: ['overview', 'projects', 'files', 'chat'], folders: ['Project Files', 'Final Deliverables', 'Raw Files'], customFolders: [], newCustomFolder: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [deletingPortalId, setDeletingPortalId] = useState<string | null>(null);
  const [showSendModal, setShowSendModal] = useState<ClientPortalAccount | null>(null);
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [showDeleteConfirmPortal, setShowDeleteConfirmPortal] = useState<ClientPortalAccount | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Client Portal Details Card Modal States
  const [detailsModalPortal, setDetailsModalPortal] = useState<ClientPortalAccount | null>(null);
  const [editClientName, setEditClientName] = useState('');
  const [editClientId, setEditClientId] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [showDetailsPassword, setShowDetailsPassword] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  // New Domain & DNS States for Admin Editing
  const [editDomainName, setEditDomainName] = useState('');
  const [editRegistrar, setEditRegistrar] = useState('');
  const [editExpiryDate, setEditExpiryDate] = useState('');
  const [editDomainStatus, setEditDomainStatus] = useState('');
  const [editNameservers, setEditNameservers] = useState('');
  const [editHostingProvider, setEditHostingProvider] = useState('');
  const [editSslStatus, setEditSslStatus] = useState('');
  const [editDeploymentStatus, setEditDeploymentStatus] = useState('');
  const [editDnsRecordsText, setEditDnsRecordsText] = useState('');

  useEffect(() => {
    if (detailsModalPortal) {
      setEditClientName(detailsModalPortal.clientName || '');
      setEditClientId(detailsModalPortal.clientId || detailsModalPortal.portalId || '');
      setEditUsername(detailsModalPortal.username || '');
      setEditPassword(detailsModalPortal.password || '');
      setShowDetailsPassword(false);

      // Populate Domain & DNS states
      setEditDomainName(detailsModalPortal.domainInfo?.domainName || '');
      setEditRegistrar(detailsModalPortal.domainInfo?.registrar || '');
      setEditExpiryDate(detailsModalPortal.domainInfo?.expiryDate || '');
      setEditDomainStatus(detailsModalPortal.domainInfo?.status || '');
      setEditNameservers((detailsModalPortal.domainInfo?.nameservers || []).join(', '));
      setEditHostingProvider(detailsModalPortal.hostingInfo?.provider || '');
      setEditSslStatus(detailsModalPortal.domainInfo?.sslStatus || '');
      setEditDeploymentStatus(detailsModalPortal.domainInfo?.deploymentStatus || '');
      setEditDnsRecordsText(
        detailsModalPortal.dnsRecords && detailsModalPortal.dnsRecords.length > 0
          ? detailsModalPortal.dnsRecords.map(r => `${r.type} | ${r.name} | ${r.value} | ${r.ttl || 'Auto'}`).join('\n')
          : ''
      );
    }
  }, [detailsModalPortal]);



  const handleCopyCredentialsMessage = (portal: ClientPortalAccount) => {
    const portalUrl = generatePortalLink('client', portal.portalId, portal.secureToken).primaryUrl;
    const msg = `Hello ${editClientName},\n\nYour Client Portal is now ready.\n\nClient ID:\n${editClientId}\n\nUsername:\n${editUsername}\n\nPassword:\n${editPassword}\n\nPortal URL:\n${portalUrl}\n\nPlease keep these credentials secure.\n\nRegards,\nZyqitek CRM`;
    
    handleCopy(msg, 'Credentials Message');
  };

  const handleSaveDetailsModal = async () => {
    if (!detailsModalPortal) return;
    setIsSavingDetails(true);
    try {
      const parsedNs = editNameservers ? editNameservers.split(',').map(n => n.trim()).filter(Boolean) : [];
      const parsedDnsRecords = editDnsRecordsText
        ? editDnsRecordsText.split('\n').map(line => {
            const parts = line.split('|').map(p => p.trim());
            if (parts.length >= 3) {
              return {
                type: parts[0] || 'A',
                name: parts[1] || '@',
                value: parts[2] || '',
                ttl: parts[3] || 'Auto'
              };
            }
            return null;
          }).filter((r): r is { type: string, name: string, value: string, ttl: string } => r !== null)
        : [];

      const updated: ClientPortalAccount = {
        ...detailsModalPortal,
        clientName: editClientName,
        clientId: editClientId,
        username: editUsername,
        password: editPassword,
        domainInfo: {
          ...detailsModalPortal.domainInfo,
          domainName: editDomainName,
          registrar: editRegistrar,
          expiryDate: editExpiryDate,
          status: editDomainStatus,
          nameservers: parsedNs,
          sslStatus: editSslStatus,
          deploymentStatus: editDeploymentStatus
        },
        hostingInfo: {
          ...detailsModalPortal.hostingInfo,
          provider: editHostingProvider
        },
        dnsRecords: parsedDnsRecords
      };
      await handleSavePortalData(updated);
      setDetailsModalPortal(null);
      showToast('Client portal details and Domain/DNS updated successfully.', 'success');
    } catch (err) {
      showToast('Failed to save portal details.', 'error');
    } finally {
      setIsSavingDetails(false);
    }
  };

  // Admin Folder Explorer States
  const [isAdminUploading, setIsAdminUploading] = useState(false);
  const [adminUploadProgress, setAdminUploadProgress] = useState(0);

  const handleAdminFolderUploadFile = async (
    file: File, 
    folderId: string | null,
    onProgress?: (progress: number, loaded: number, total: number) => void,
    abortController?: AbortController
  ) => {
    if (!selectedPortal) return;
    setIsAdminUploading(true);
    setAdminUploadProgress(0);

    try {
      const uploadRes = await uploadPortalFile(
        file,
        `clientPortals/${selectedPortal.portalId || selectedPortal.id}/${folderId || 'root'}`,
        (pct, loaded, total) => {
          setAdminUploadProgress(pct);
          if (onProgress) onProgress(pct, loaded, total);
        },
        abortController
      );

      const fileId = `file-${Date.now()}`;
      const fileType = file.type || file.name.split('.').pop() || 'document';

      const newFile: PortalFile = {
        id: fileId,
        name: uploadRes.fileName,
        fileType,
        size: uploadRes.size,
        uploadedAt: new Date().toISOString().split('T')[0],
        fileUrl: uploadRes.fileUrl,
        downloadUrl: uploadRes.downloadUrl || uploadRes.fileUrl,
        storagePath: uploadRes.storagePath,
        category: 'General Asset',
        folderId: folderId,
        uploadedBy: 'CRM Admin'
      };

      const updated = {
        ...selectedPortal,
        projectFiles: [newFile, ...(selectedPortal.projectFiles || [])]
      };

      await handleSavePortalData(updated);
      setIsAdminUploading(false);
      setAdminUploadProgress(0);
      showToast(`Uploaded "${file.name}" to workspace folder successfully`, 'success');
    } catch (err: any) {
      setIsAdminUploading(false);
      setAdminUploadProgress(0);
      if (err.name === 'AbortError') {
        showToast('Upload was cancelled', 'error');
        throw err;
      }
      showToast(err.message || 'Failed to upload file to workspace folder', 'error');
      throw err;
    }
  };

  const handleAdminUpdateFoldersFilesAndRecords = async (
    updatedFolders: PortalFolder[],
    updatedFiles: PortalFile[],
    updatedRecords: InformationRecord[]
  ) => {
    if (!selectedPortal) return;
    const updated = {
      ...selectedPortal,
      folders: updatedFolders,
      projectFiles: updatedFiles,
      infoRecords: updatedRecords
    };
    await handleSavePortalData(updated);
  };

  // New Portal Form State
  const [newPortalForm, setNewPortalForm] = useState({
    clientId: '',
    username: '',
    password: '',
    status: 'Active' as 'Active' | 'Inactive'
  });

  // Load Portals from Firestore
  const fetchPortals = async () => {
    try {
      setIsLoading(true);
      const data = await getCollectionOnce<ClientPortalAccount>('clientPortals');
      
      let updatedSome = false;
      const validatedData = await Promise.all((data || []).map(async p => {
        if (!p.secureToken) {
          const secureToken = generateUUID();
          const updated = { ...p, secureToken };
          await saveToFirestore('clientPortals', p.id, updated);
          updatedSome = true;
          return updated;
        }
        return p;
      }));
      
      setPortals(validatedData);
      if (updatedSome) {
        showToast('Secure access tokens generated for all portals.', 'success');
      }
    } catch (err) {
      console.error('Failed to load client portals:', err);
      showToast('Failed to load client portals', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPortals();
  }, []);

  useEffect(() => {
    if (showSendModal) {
      setShowModalPassword(false);
    }
  }, [showSendModal]);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showToast(`Copied ${fieldName} to clipboard!`, 'success');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleQuickCopy = async (portal: ClientPortalAccount) => {
    const url = generatePortalLink('client', portal.portalId, portal.secureToken).primaryUrl;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        showToast('Portal URL copied.', 'success');
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          showToast('Portal URL copied.', 'success');
        } catch (error) {
          showToast('Failed to copy URL', 'error');
        } finally {
          textArea.remove();
        }
      }
    } catch (err) {
      showToast('Failed to copy URL', 'error');
    }
  };

  // Format short human-readable Portal ID (e.g., CP-1001)
  const getDisplayPortalId = (portal: ClientPortalAccount | null, index: number = 0) => {
    if (!portal) return 'CP-1001';
    if (portal.portalId && /^CP-\d{3,5}$/i.test(portal.portalId)) {
      return portal.portalId.toUpperCase();
    }
    return `CP-${1001 + index}`;
  };

  // Generate Unique Portal ID
  const generatePortalId = () => {
    const nextNum = 1001 + portals.length;
    return `CP-${nextNum}`;
  };

  // Handle Save Edit Portal
  const handleSaveEditPortal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditPortalModal) return;

    try {
      setIsCreating(true);
      const updatedPortal: ClientPortalAccount = {
        ...showEditPortalModal,
        clientService: editPortalForm.clientService,
        enabledSections: editPortalForm.enabledSections,
        folders: editPortalForm.folders,
        customFolders: editPortalForm.customFolders,
        updatedAt: new Date().toISOString()
      };

      setPortalSyncStatus(prev => ({ ...prev, [updatedPortal.id]: 'Syncing' }));
      await saveToFirestore('clientPortals', updatedPortal.id, updatedPortal);
      setPortals(prev => prev.map(p => (p.id === updatedPortal.id ? updatedPortal : p)));
      setPortalSyncStatus(prev => ({ ...prev, [updatedPortal.id]: 'Synced' }));
      setShowEditPortalModal(null);
      showToast('Portal configuration updated successfully!', 'success');
    } catch (err: any) {
      console.error('Error saving portal:', err);
      showToast(err.message || 'Failed to update portal', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  // Handle Create Portal
  const handleCreatePortal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortalForm.clientId || !newPortalForm.username || !newPortalForm.password) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    const selectedClient = clients.find(c => c.id === newPortalForm.clientId);
    if (!selectedClient) {
      showToast('Invalid client selected', 'error');
      return;
    }

    // Check if portal already exists for this client
    const existingPortal = portals.find(p => p.clientId === selectedClient.id);
    if (existingPortal) {
      showToast('A portal already exists for this client', 'error');
      return;
    }

    const portalId = generatePortalId();
    const secureToken = generateUUID();

    const newPortal: ClientPortalAccount = {
      id: portalId,
      portalId: portalId,
      secureToken: secureToken,
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      clientCompany: selectedClient.company || '',
      clientEmail: selectedClient.email || '',
      username: newPortalForm.username,
      password: newPortalForm.password,
      status: newPortalForm.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      profileInfo: {
        company: selectedClient.company || '',
        contactPerson: selectedClient.name,
        email: selectedClient.email || '',
        phone: selectedClient.phone || '',
        country: selectedClient.country || '',
        websiteUrl: '',
        serviceType: selectedClient.serviceType || '',
        status: 'Active'
      },
      projectDetails: [],
      folders: [],
      projectFiles: [],
      infoRecords: [],
      documents: [],
      contracts: [],
      invoices: [],
      progressUpdates: [],
      supportTickets: [],
      notes: [],
      downloads: []
    };

    try {
      setIsCreating(true);
      setPortalSyncStatus(prev => ({ ...prev, [portalId]: 'Syncing' }));
      await saveToFirestore('clientPortals', portalId, newPortal);
      setPortals(prev => [newPortal, ...prev]);
      setPortalSyncStatus(prev => ({ ...prev, [portalId]: 'Synced' }));
      setShowCreateModal(false);
      setNewPortalForm({ clientId: '', username: '', password: '', status: 'Active' });
      showToast(`Created Client Portal for ${selectedClient.name}`, 'success');
    } catch (err) {
      console.error('Error saving portal:', err);
      setPortalSyncStatus(prev => ({ ...prev, [portalId]: 'Failed' }));
      showToast('Failed to create portal in Firestore', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  // Toggle Portal Status
  const handleToggleStatus = async (portal: ClientPortalAccount) => {
    setPortalSyncStatus(prev => ({ ...prev, [portal.id]: 'Syncing' }));
    const nextStatus = (portal.status === 'Live' || portal.status === 'Active') ? 'Inactive' : 'Active';
    const updatedPortal = { ...portal, status: nextStatus, updatedAt: new Date().toISOString() };
    try {
      await saveToFirestore('clientPortals', portal.id, updatedPortal);
      setPortals(prev => prev.map(p => (p.id === portal.id ? updatedPortal : p)));
      if (selectedPortal?.id === portal.id) {
        setSelectedPortal(updatedPortal);
      }
      setPortalSyncStatus(prev => ({ ...prev, [portal.id]: 'Synced' }));
      showToast(`Portal status updated to ${nextStatus}`, 'success');
    } catch (err) {
      console.error('Failed to update portal status:', err);
      setPortalSyncStatus(prev => ({ ...prev, [portal.id]: 'Failed' }));
      showToast('Failed to update portal status in Firestore', 'error');
    }
  };

  // Delete Portal
  const handleDeletePortal = async (portalId: string) => {
    const portalToDelete = portals.find(p => p.id === portalId);
    setDeletingPortalId(portalId);
    setPortalSyncStatus(prev => ({ ...prev, [portalId]: 'Syncing' }));

    try {
      if (portalToDelete && portalToDelete.projectFiles && Array.isArray(portalToDelete.projectFiles)) {
        for (const file of portalToDelete.projectFiles) {
          if (file.fileUrl) {
            await deletePortalFile(file.fileUrl);
          }
        }
      }

      const success = await deleteFromFirestore('clientPortals', portalId);
      if (!success) {
        throw new Error('Failed to delete portal from database');
      }

      setPortals(prev => prev.filter(p => p.id !== portalId));
      if (selectedPortal?.id === portalId) setSelectedPortal(null);
      showToast('Client Portal deleted successfully', 'success');
    } catch (err: any) {
      console.error('Delete portal failed:', err);
      setPortalSyncStatus(prev => ({ ...prev, [portalId]: 'Failed' }));
      showToast(err.message || 'Failed to delete portal', 'error');
    } finally {
      setDeletingPortalId(null);
    }
  };

  // Save Portal Updates
  const handleSavePortalData = async (updatedPortal: ClientPortalAccount) => {
    try {
      setPortalSyncStatus(prev => ({ ...prev, [updatedPortal.id]: 'Syncing' }));
      const payload = { ...updatedPortal, updatedAt: new Date().toISOString() };
      await saveToFirestore('clientPortals', updatedPortal.id, payload);
      setPortals(prev => prev.map(p => (p.id === updatedPortal.id ? payload : p)));
      setSelectedPortal(payload);
      setPortalSyncStatus(prev => ({ ...prev, [updatedPortal.id]: 'Synced' }));
      showToast('Portal updated in real-time', 'success');
    } catch (err) {
      setPortalSyncStatus(prev => ({ ...prev, [updatedPortal.id]: 'Failed' }));
      showToast('Failed to save portal changes', 'error');
    }
  };

  // Filtered Portals
  const filteredPortals = portals.filter((p, idx) => {
    if (p.status === 'Archived') return false;
    const displayId = getDisplayPortalId(p, idx);
    const matchesSearch =
      p.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.clientCompany && p.clientCompany.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.portalId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      displayId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Active' && (p.status === 'Active' || p.status === 'Live')) ||
      (statusFilter === 'Inactive' && p.status === 'Inactive');
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 text-[var(--crm-text)]">
      {/* IF A PORTAL IS SELECTED: SHOW FULL WORKSPACE VIEW */}
      {selectedPortal ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="space-y-6"
        >
          {/* WORKSPACE HEADER BAR */}
          <div className="bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedPortal(null)}
                className="p-2.5 bg-[var(--crm-sidebar-active-bg)] hover:bg-[var(--crm-sidebar-active-bg)]/80 text-[var(--crm-text-secondary)] rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs  shrink-0"
              >
                <ArrowLeft size={16} />
                <span>Back to Portals</span>
              </button>

              <div className="border-l border-[var(--crm-card-border)] pl-4 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium   text-[var(--crm-text-muted)]">Client Portal</span>
                  <span className="text-[var(--crm-text-muted)]">•</span>
                  <span className="font-mono text-xs font-medium text-[var(--crm-text-muted)]">{selectedPortal.portalId}</span>
                </div>
                <h2 className="text-xl font-bold !text-white text-white leading-tight">
                  {selectedPortal.clientName}
                </h2>
                <div className="flex items-center gap-3 text-xs !text-white text-white italic font-normal">
                  <span>Company: <strong className="!text-white text-white not-italic font-bold">{selectedPortal.clientCompany || selectedPortal.profileInfo?.company || 'No Company'}</strong></span>
                  <span>•</span>
                  <span>Username: <strong className="font-mono !text-white text-white not-italic font-bold">{selectedPortal.username}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              {/* Status Toggle */}
              <button
                onClick={() => handleToggleStatus(selectedPortal)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  selectedPortal.status === 'Active' || selectedPortal.status === 'Live'
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-600 border-rose-500/20 hover:bg-rose-500/20'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${selectedPortal.status === 'Active' || selectedPortal.status === 'Live' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <span>{selectedPortal.status || 'Active'}</span>
              </button>

              <button
                onClick={() => setDetailsModalPortal(selectedPortal)}
                className="px-4 py-2 bg-[var(--crm-sidebar-active-bg)] hover:bg-[var(--crm-sidebar-active-bg)]/80 text-[var(--crm-text)] rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 border border-[var(--crm-card-border)] cursor-pointer"
              >
                <LinkIcon size={14} />
                <span>Portal Details</span>
              </button>
            </div>
          </div>

          {/* MAIN WORKSPACE CONTENT AREA (Embedded FolderExplorer) */}
          <div className="bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-3xl p-6 shadow-xs">
            <FolderExplorer
              folders={selectedPortal.folders || []}
              files={selectedPortal.projectFiles || []}
              infoRecords={selectedPortal.infoRecords || []}
              onUpdateFoldersFilesAndRecords={handleAdminUpdateFoldersFilesAndRecords}
              onUploadFile={handleAdminFolderUploadFile}
              isReadOnly={false}
              userRole="admin"
              showToast={showToast}
            />
          </div>
        </motion.div>
      ) : (
        /* PORTALS MANAGEMENT TABLE VIEW */
        <>
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--crm-text-secondary)]" size={18} />
                <input
                  type="text"
                  placeholder="Search Portal..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl text-sm text-[var(--crm-text)] focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center justify-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-sm cursor-pointer"
            >
              <Plus size={18} />
              <span>Create Portal</span>
            </button>
          </div>

          {/* Portal List Table */}
          <div className="bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-2xl overflow-hidden shadow-sm">
            {isLoading ? (
              <div className="w-full animate-pulse p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-[var(--crm-card-border)] pb-4">
                  <div className="h-4 bg-[var(--crm-card-border)]/60 rounded w-1/4" />
                  <div className="h-4 bg-[var(--crm-card-border)]/60 rounded w-1/6" />
                  <div className="h-4 bg-[var(--crm-card-border)]/60 rounded w-1/6" />
                </div>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between py-3">
                    <div className="space-y-2 w-1/3">
                      <div className="h-5 bg-[var(--crm-card-border)]/50 rounded w-5/6" />
                      <div className="h-3.5 bg-[var(--crm-card-border)]/30 rounded w-1/2" />
                    </div>
                    <div className="h-4 bg-[var(--crm-card-border)]/40 rounded w-1/6" />
                    <div className="h-4 bg-[var(--crm-card-border)]/40 rounded w-1/6" />
                  </div>
                ))}
              </div>
            ) : filteredPortals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <div className="w-20 h-20 bg-[var(--crm-sidebar)] rounded-full flex items-center justify-center mb-6">
                  <Layers className="text-[var(--crm-text-muted)] opacity-40" size={40} />
                </div>
                <h3 className="text-lg font-medium text-[var(--crm-text)]">No portals created yet.</h3>
                <p className="text-sm text-[var(--crm-subtitle)] mt-2 mb-8 max-w-xs">
                  Grant your clients secure access to their project updates and files.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-all cursor-pointer"
                >
                  <Plus size={18} />
                  <span>Create Portal</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Bulk Action Bar for Portals */}
                {selectedPortalIds.length > 0 && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 rounded-xl p-3 flex items-center justify-between shadow-xs mb-3 animate-in fade-in duration-200 mx-2 mt-2">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 bg-emerald-600 text-white text-[10px] font-semibold rounded-full flex items-center justify-center shrink-0">
                        {selectedPortalIds.length}
                      </span>
                      <span className="text-xs font-medium text-emerald-950 dark:text-emerald-500">portals selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowBulkDeletePortalsConfirm(true)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Trash2 size={13} /> Delete Selected
                      </button>
                      <button
                        onClick={() => setSelectedPortalIds([])}
                        className="px-2 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 rounded-lg transition-colors cursor-pointer"
                      >
                        Cancel (ESC)
                      </button>
                    </div>
                  </div>
                )}

                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[var(--crm-sidebar)] border-b border-[var(--crm-card-border)]">
                      {selectedPortalIds.length > 0 && (
                        <th className="px-4 py-4 w-10 text-center">
                          <input 
                            type="checkbox"
                            checked={filteredPortals.length > 0 && filteredPortals.every(p => selectedPortalIds.includes(p.id))}
                            onChange={() => handleToggleSelectAllPortals(filteredPortals)}
                            className="rounded border-[var(--crm-card-border)] text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                          />
                        </th>
                      )}
                      <th className="px-6 py-4 text-xs font-medium text-[var(--crm-text-secondary)]  ">Portal ID</th>
                      <th className="px-6 py-4 text-xs font-medium text-[var(--crm-text-secondary)]  ">Client / Company</th>
                      <th className="px-6 py-4 text-xs font-medium text-[var(--crm-text-secondary)]  ">Portal Type</th>
                      <th className="px-6 py-4 text-xs font-medium text-[var(--crm-text-secondary)]  ">Status</th>
                      <th className="px-6 py-4 text-xs font-medium text-[var(--crm-text-secondary)]  ">Live to Cloud</th>
                      <th className="px-6 py-4 text-xs font-medium text-[var(--crm-text-secondary)]  ">Created</th>
                      <th className="px-6 py-4 text-xs font-medium text-[var(--crm-text-secondary)]   text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--crm-card-border)]">
                    <AnimatePresence>
                      {filteredPortals.map((portal) => {
                        const isDeleting = deletingPortalId === portal.id;
                        const portalIndex = portals.findIndex(p => p.id === portal.id);
                        const displayPortalId = getDisplayPortalId(portal, portalIndex >= 0 ? portalIndex : 0);
                        const syncState = portalSyncStatus[portal.id] || 'Synced';
                        const isSelected = selectedPortalIds.includes(portal.id);
                        const portalUrl = generatePortalLink('client', portal.portalId, portal.secureToken).primaryUrl;

                        return (
                          <tr
                            key={portal.id}
                            className={`transition-colors group cursor-pointer select-none ${isSelected ? 'bg-emerald-50 dark:bg-emerald-900/10 border-l-2 border-l-emerald-500' : 'bg-[var(--crm-card)] hover:bg-[var(--crm-sidebar)]'}`}
                            {...getPressHandlers(portal, () => setSelectedPortalProfile(portal))}
                          >
                            {selectedPortalIds.length > 0 && (
                              <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                <input 
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleSelectPortal(portal.id)}
                                  className="rounded border-[var(--crm-card-border)] text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                                />
                              </td>
                            )}
                            <td className="px-6 py-4 text-sm font-mono font-medium text-[var(--crm-text)]">
                              <span className="px-2.5 py-1 bg-[var(--crm-sidebar-active-bg)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-md text-xs font-medium font-mono inline-block">
                                {displayPortalId}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-[var(--crm-text)] group-hover:text-indigo-600 transition-colors">{portal.clientName}</div>
                              <div className="text-xs text-[var(--crm-text-secondary)]">{portal.profileInfo?.company || portal.clientCompany || 'No Company'}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-lg text-[10px] font-semibold  ">
                                Client Portal
                              </span>
                            </td>
                            <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(portal)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer shadow-2xs ${
                                  portal.status === 'Live' || portal.status === 'Active'
                                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20'
                                    : 'bg-rose-500/10 text-rose-600 border-rose-500/20 hover:bg-rose-500/20'
                                }`}
                                title={`Click to change status to ${portal.status === 'Active' || portal.status === 'Live' ? 'Inactive' : 'Active'}`}
                              >
                                <span className={`h-2 w-2 rounded-full ${portal.status === 'Active' || portal.status === 'Live' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                <span>{portal.status === 'Live' || portal.status === 'Active' ? 'Active' : 'Inactive'}</span>
                              </button>
                            </td>
                            <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                              {syncState === 'Syncing' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-700 border border-amber-200 rounded-full text-xs font-medium">
                                  <RefreshCw size={12} className="animate-spin text-amber-600" />
                                  <span>Syncing</span>
                                </span>
                              ) : syncState === 'Failed' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 dark:bg-rose-500/10 text-rose-700 border border-rose-200 rounded-full text-xs font-medium">
                                  <AlertCircle size={12} className="text-rose-600" />
                                  <span>Failed</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium">
                                  <CheckCircle2 size={12} className="text-emerald-600" />
                                  <span>Synced</span>
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-[var(--crm-text-secondary)]">
                              {new Date(portal.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </td>
                            <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                {onOpenChat && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onOpenChat(portal.portalId || portal.id, 'client');
                                    }}
                                    className="p-1.5 text-[var(--crm-text-secondary)] hover:text-indigo-600 hover:bg-indigo-50 dark:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer"
                                    title="Open Portal Chat"
                                  >
                                    <MessageSquare size={16} />
                                  </button>
                                )}

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowEditPortalModal(portal);
                                    setEditPortalForm({
                                      clientService: portal.clientService || '',
                                      enabledSections: portal.enabledSections || ['overview', 'projects', 'files', 'chat'],
                                      folders: (portal.folders || ['Project Files', 'Final Deliverables', 'Raw Files']).map((f: any) => typeof f === 'string' ? f : f.name),
                                      customFolders: portal.customFolders || [],
                                      newCustomFolder: ''
                                    });
                                  }}
                                  className="p-1.5 text-[var(--crm-text-secondary)] hover:text-indigo-600 hover:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Portal Configuration"
                                >
                                  <Settings size={16} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDetailsModalPortal(portal);
                                  }}
                                  className="p-1.5 text-[var(--crm-text-secondary)] hover:text-indigo-600 hover:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer"
                                  title="Change Credentials"
                                >
                                  <Key size={16} />
                                </button>
                                <a
                                  href={generatePortalLink('client', portal.portalId, portal.secureToken).primaryUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1.5 text-[var(--crm-text-secondary)] hover:text-emerald-600 hover:bg-emerald-500/10 rounded-lg transition-all"
                                  title="Open Portal Link"
                                >
                                  <ExternalLink size={16} />
                                </a>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDeleteConfirmPortal(portal);
                                  }}
                                  disabled={isDeleting}
                                  className="p-1.5 text-[var(--crm-text-secondary)] hover:text-[#D0021B] hover:bg-[#D0021B]/10 rounded-lg transition-all duration-150 active:scale-95 disabled:opacity-50 cursor-pointer"
                                  title="Delete Portal"
                                >
                                  {isDeleting ? (
                                    <RefreshCw size={16} className="animate-spin text-rose-600" />
                                  ) : (
                                    <Trash2 size={16} />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* CREATE PORTAL MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-[var(--crm-card)] rounded-2xl border border-[var(--crm-card-border)] max-w-md w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--crm-card-border)]">
                <h3 className="font-semibold text-base text-[var(--crm-text)] font-structure">Create New Client Portal</h3>
                <button 
                  onClick={() => !isCreating && setShowCreateModal(false)} 
                  disabled={isCreating}
                  className="text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] disabled:opacity-50 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreatePortal} className="space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-[var(--crm-text-secondary)] mb-1">Select Client *</label>
                  <select
                    value={newPortalForm.clientId}
                    onChange={e => setNewPortalForm({ ...newPortalForm, clientId: e.target.value })}
                    className="w-full p-2.5 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl font-semibold text-[var(--crm-text)] focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                    required
                    disabled={isCreating}
                  >
                    <option value="" disabled>Select a client...</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name} {client.company ? `(${client.company})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[var(--crm-text-secondary)] mb-1">Username *</label>
                  <input
                    type="text"
                    placeholder="e.g. acme_client"
                    value={newPortalForm.username}
                    onChange={e => setNewPortalForm({ ...newPortalForm, username: e.target.value })}
                    className="w-full p-2.5 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl font-mono font-semibold text-[var(--crm-text)] focus:outline-none focus:ring-2 focus:ring-[#7ED321]/20"
                    required
                    disabled={isCreating}
                  />
                </div>

                <div>
                  <label className="block font-medium text-[var(--crm-text-secondary)] mb-1">Password *</label>
                  <input
                    type="text"
                    placeholder="e.g. Password123!"
                    value={newPortalForm.password}
                    onChange={e => setNewPortalForm({ ...newPortalForm, password: e.target.value })}
                    className="w-full p-2.5 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl font-mono font-semibold text-[var(--crm-text)] focus:outline-none focus:ring-2 focus:ring-[#7ED321]/20"
                    required
                    disabled={isCreating}
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    disabled={isCreating}
                    className="px-4 py-2 rounded-xl bg-[var(--crm-sidebar-active-bg)] hover:bg-[var(--crm-sidebar-active-bg)]/80 text-[var(--crm-text-secondary)] disabled:opacity-50 cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center gap-2 disabled:opacity-75 cursor-pointer transition-all shadow-xs"
                  >
                    {isCreating ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <span>Create Portal</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EDIT PORTAL CONFIGURATION MODAL */}
      <AnimatePresence>
        {showEditPortalModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[var(--crm-card)] rounded-2xl border border-[var(--crm-card-border)] w-full max-w-md p-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-[var(--crm-text)]">Edit Portal Configuration</h3>
                  <p className="text-[var(--crm-text-muted)] text-xs mt-1">Select the visible sections for this client.</p>
                </div>
                <button
                  onClick={() => !isCreating && setShowEditPortalModal(null)}
                  className="p-2 bg-[var(--crm-sidebar)] hover:bg-[var(--crm-sidebar-active-bg)] text-[var(--crm-text-secondary)] rounded-full transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveEditPortal} className="space-y-4 text-xs">
                <div>
                  <label className="block font-medium text-[var(--crm-text-secondary)] mb-1">Client Service / Portal Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Video Editing, Website Development"
                    value={editPortalForm.clientService}
                    onChange={e => setEditPortalForm({ ...editPortalForm, clientService: e.target.value })}
                    className="w-full p-2.5 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl font-semibold text-[var(--crm-text)] focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                    disabled={isCreating}
                  />
                </div>

                <div>
                  <label className="block font-medium text-[var(--crm-text-secondary)] mb-2">Enabled Sections</label>
                  <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                    {Array.from(new Set(AVAILABLE_SECTIONS.map(s => s.category))).map(category => (
                      <div key={category} className="space-y-2">
                        <h4 className="text-[10px] font-bold text-[var(--crm-text-muted)] uppercase tracking-wider">{category}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {AVAILABLE_SECTIONS.filter(s => s.category === category).map(section => (
                            <label key={section.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-[var(--crm-sidebar)] rounded-lg transition-colors border border-transparent hover:border-[var(--crm-card-border)]">
                              <input
                                type="checkbox"
                                checked={editPortalForm.enabledSections.includes(section.id)}
                                onChange={(e) => {
                                  const current = editPortalForm.enabledSections;
                                  if (e.target.checked) {
                                    setEditPortalForm({ ...editPortalForm, enabledSections: [...current, section.id] });
                                  } else {
                                    setEditPortalForm({ ...editPortalForm, enabledSections: current.filter(id => id !== section.id) });
                                  }
                                }}
                                className="rounded border-[var(--crm-card-border)] text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                              />
                              <span className="text-[var(--crm-text)] font-medium text-xs truncate">{section.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-[var(--crm-text-secondary)] mb-2 mt-4">Folders</label>
                  <div className="space-y-4 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {PRESET_FOLDERS.map(folder => (
                        <label key={folder} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-[var(--crm-sidebar)] rounded-lg transition-colors border border-transparent hover:border-[var(--crm-card-border)]">
                          <input
                            type="checkbox"
                            checked={editPortalForm.folders.includes(folder)}
                            onChange={(e) => {
                              const current = editPortalForm.folders;
                              if (e.target.checked) {
                                setEditPortalForm({ ...editPortalForm, folders: [...current, folder] });
                              } else {
                                setEditPortalForm({ ...editPortalForm, folders: current.filter(f => f !== folder) });
                              }
                            }}
                            className="rounded border-[var(--crm-card-border)] text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                          />
                          <span className="text-[var(--crm-text)] font-medium text-xs truncate">{folder}</span>
                        </label>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-[var(--crm-card-border)]">
                      <label className="block text-[10px] font-bold text-[var(--crm-text-muted)] uppercase tracking-wider mb-2">Custom Folders</label>
                      <div className="flex gap-2 mb-3">
                        <input
                          type="text"
                          placeholder="Add custom folder..."
                          value={editPortalForm.newCustomFolder}
                          onChange={e => setEditPortalForm({ ...editPortalForm, newCustomFolder: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              if (editPortalForm.newCustomFolder.trim()) {
                                setEditPortalForm({
                                  ...editPortalForm,
                                  customFolders: [...editPortalForm.customFolders, editPortalForm.newCustomFolder.trim()],
                                  newCustomFolder: ""
                                });
                              }
                            }
                          }}
                          className="flex-1 p-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-lg text-xs text-[var(--crm-text)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (editPortalForm.newCustomFolder.trim()) {
                              setEditPortalForm({
                                ...editPortalForm,
                                customFolders: [...editPortalForm.customFolders, editPortalForm.newCustomFolder.trim()],
                                newCustomFolder: ""
                              });
                            }
                          }}
                          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                        >
                          Add
                        </button>
                      </div>
                      {editPortalForm.customFolders.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {editPortalForm.customFolders.map(folder => (
                            <div key={folder} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-lg text-xs">
                              <span className="text-[var(--crm-text)] font-medium">{folder}</span>
                              <button
                                type="button"
                                onClick={() => setEditPortalForm({ ...editPortalForm, customFolders: editPortalForm.customFolders.filter(f => f !== folder) })}
                                className="text-[var(--crm-text-muted)] hover:text-rose-500 transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditPortalModal(null)}
                    disabled={isCreating}
                    className="px-4 py-2 rounded-xl bg-[var(--crm-sidebar-active-bg)] hover:bg-[var(--crm-sidebar-active-bg)]/80 text-[var(--crm-text-secondary)] disabled:opacity-50 cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center gap-2 disabled:opacity-75 cursor-pointer transition-all shadow-xs"
                  >
                    {isCreating ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CLIENT PORTAL DETAILS MODAL */}
      {detailsModalPortal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--crm-card)] rounded-2xl border border-[var(--crm-card-border)] max-w-lg 2xl:max-w-xl 3xl:max-w-2xl 4k:max-w-3xl 5k:max-w-4xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 text-[var(--crm-text)]">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--crm-card-border)]">
              <div className="flex items-center gap-2.5 text-[var(--crm-text)]">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 rounded-xl">
                  <Key size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-[var(--crm-text)] tracking-tight leading-tight font-structure">Client Portal Details</h3>
                  <p className="text-[var(--crm-text-muted)] text-xs mt-0.5">View, edit, and copy client portal access credentials.</p>
                </div>
              </div>
              <button 
                onClick={() => setDetailsModalPortal(null)} 
                className="p-1.5 text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] rounded-lg hover:bg-[var(--crm-sidebar-active-bg)] transition-colors cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Editable Fields Section */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Client Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[var(--crm-text-muted)] block uppercase tracking-wider">
                    Client Name
                  </label>
                  <input
                    type="text"
                    value={editClientName}
                    onChange={(e) => setEditClientName(e.target.value)}
                    className="w-full h-10 px-3 text-xs font-medium text-[var(--crm-text)] bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                    placeholder="Client Name"
                  />
                </div>

                {/* Client ID */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[var(--crm-text-muted)] block uppercase tracking-wider">
                    Client ID
                  </label>
                  <input
                    type="text"
                    value={editClientId}
                    onChange={(e) => setEditClientId(e.target.value)}
                    className="w-full h-10 px-3 text-xs font-medium text-[var(--crm-text)] bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                    placeholder="Client ID"
                  />
                </div>

                {/* Username */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[var(--crm-text-muted)] block uppercase tracking-wider">
                    Username
                  </label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full h-10 px-3 text-xs font-mono font-semibold text-[var(--crm-text)] bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                    placeholder="Username"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[var(--crm-text-muted)] block uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showDetailsPassword ? "text" : "password"}
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      className="w-full h-10 pl-3 pr-9 text-xs font-mono font-semibold text-[var(--crm-text)] bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                      placeholder="Password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDetailsPassword(!showDetailsPassword)}
                      className="absolute right-2.5 top-2.5 text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] cursor-pointer"
                    >
                      {showDetailsPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Domain & DNS Management Section */}
              <div className="border-t border-[var(--crm-card-border)] pt-4 mt-4 space-y-3.5">
                <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
                  <Globe size={14} />
                  <span>Domain & DNS Configuration</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[300px] overflow-y-auto pr-1">
                  {/* Domain Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-muted)] block uppercase tracking-wider">
                      Domain Name
                    </label>
                    <input
                      type="text"
                      value={editDomainName}
                      onChange={(e) => setEditDomainName(e.target.value)}
                      className="w-full h-10 px-3 text-xs font-mono font-medium text-[var(--crm-text)] bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                      placeholder="e.g. example.com"
                    />
                  </div>

                  {/* Registrar */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-muted)] block uppercase tracking-wider">
                      Registrar
                    </label>
                    <input
                      type="text"
                      value={editRegistrar}
                      onChange={(e) => setEditRegistrar(e.target.value)}
                      className="w-full h-10 px-3 text-xs font-medium text-[var(--crm-text)] bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                      placeholder="e.g. Namecheap, GoDaddy"
                    />
                  </div>

                  {/* Expiry Date */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-muted)] block uppercase tracking-wider">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={editExpiryDate}
                      onChange={(e) => setEditExpiryDate(e.target.value)}
                      className="w-full h-10 px-3 text-xs font-medium text-[var(--crm-text)] bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                    />
                  </div>

                  {/* Domain Status */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-muted)] block uppercase tracking-wider">
                      Domain Status
                    </label>
                    <select
                      value={editDomainStatus}
                      onChange={(e) => setEditDomainStatus(e.target.value)}
                      className="w-full h-10 px-3 text-xs font-medium text-[var(--crm-text)] bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                    >
                      <option value="">Select Status</option>
                      <option value="Active">Active</option>
                      <option value="Pending SSL">Pending SSL</option>
                      <option value="Expired">Expired</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  {/* Nameservers */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-muted)] block uppercase tracking-wider">
                      Nameservers (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={editNameservers}
                      onChange={(e) => setEditNameservers(e.target.value)}
                      className="w-full h-10 px-3 text-xs font-mono text-[var(--crm-text)] bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                      placeholder="e.g. ns1.vercel-dns.com, ns2.vercel-dns.com"
                    />
                  </div>

                  {/* Hosting Provider */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-muted)] block uppercase tracking-wider">
                      Hosting Provider
                    </label>
                    <input
                      type="text"
                      value={editHostingProvider}
                      onChange={(e) => setEditHostingProvider(e.target.value)}
                      className="w-full h-10 px-3 text-xs font-medium text-[var(--crm-text)] bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                      placeholder="e.g. Vercel, Hostinger, AWS"
                    />
                  </div>

                  {/* SSL Status */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-muted)] block uppercase tracking-wider">
                      SSL Status
                    </label>
                    <select
                      value={editSslStatus}
                      onChange={(e) => setEditSslStatus(e.target.value)}
                      className="w-full h-10 px-3 text-xs font-medium text-[var(--crm-text)] bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                    >
                      <option value="">Select Status</option>
                      <option value="Active">Active</option>
                      <option value="Pending">Pending</option>
                      <option value="None">None</option>
                    </select>
                  </div>

                  {/* Deployment Status */}
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-semibold text-[var(--crm-text-muted)] block uppercase tracking-wider">
                      Deployment Status
                    </label>
                    <select
                      value={editDeploymentStatus}
                      onChange={(e) => setEditDeploymentStatus(e.target.value)}
                      className="w-full h-10 px-3 text-xs font-medium text-[var(--crm-text)] bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                    >
                      <option value="">Select Status</option>
                      <option value="Live">Live</option>
                      <option value="Development">Development</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>

                  {/* DNS Records Text Area */}
                  <div className="space-y-1 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-semibold text-[var(--crm-text-muted)] block uppercase tracking-wider">
                        DNS Records
                      </label>
                      <span className="text-[9px] text-[var(--crm-text-muted)]">
                        Format: Type | Name | Value | TTL
                      </span>
                    </div>
                    <textarea
                      value={editDnsRecordsText}
                      onChange={(e) => setEditDnsRecordsText(e.target.value)}
                      rows={4}
                      className="w-full p-3 text-xs font-mono text-[var(--crm-text)] bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all placeholder:text-[var(--crm-text-muted)]/50"
                      placeholder={"A | @ | 123.123.123.123 | Auto\nCNAME | www | example.vercel.app | 3600\nMX | @ | mail.example.com | 3600"}
                    />
                  </div>
                </div>
              </div>

              {/* Read-Only Portal URL */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-[var(--crm-text-muted)] block uppercase tracking-wider">
                  Portal URL (Read-Only)
                </label>
                <div className="w-full min-h-[40px] px-3 py-2 text-xs font-mono text-[var(--crm-text-secondary)] bg-[var(--crm-sidebar-active-bg)] border border-[var(--crm-card-border)] rounded-xl break-all select-all flex items-center">
                  {generatePortalLink('client', detailsModalPortal.portalId, detailsModalPortal.secureToken).primaryUrl}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--crm-card-border)]">
              {/* Copy Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      generatePortalLink('client', detailsModalPortal.portalId, detailsModalPortal.secureToken).primaryUrl,
                      'Portal URL'
                    )
                  }
                  className="px-3.5 py-2 bg-[var(--crm-sidebar-active-bg)] hover:bg-[var(--crm-sidebar-active-bg)]/80 text-[var(--crm-text)] rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 border border-[var(--crm-card-border)] cursor-pointer"
                >
                  {copiedField === 'Portal URL' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  <span>Copy Portal URL</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyCredentialsMessage(detailsModalPortal)}
                  className="px-3.5 py-2 bg-slate-900 dark:bg-[#111827] hover:bg-slate-800 dark:hover:bg-[#1A1D23] text-white rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-xs border border-transparent dark:border-[var(--crm-card-border)]"
                >
                  {copiedField === 'Credentials Message' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>Copy Credentials Message</span>
                </button>
              </div>

              {/* Save / Close Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDetailsModalPortal(null)}
                  className="px-3 py-2 text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar-active-bg)] rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={handleSaveDetailsModal}
                  disabled={isSavingDetails}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSavingDetails ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Portal Profile Card Modal */}
      <CrmProfileView
        isOpen={!!selectedPortalProfile}
        onClose={() => setSelectedPortalProfile(null)}
        type="Portal"
        data={selectedPortalProfile}
        clients={clients}
        projects={projects}
        onEdit={() => {
          if (selectedPortalProfile) {
            setDetailsModalPortal(selectedPortalProfile);
            setSelectedPortalProfile(null);
          }
        }}
        onDelete={(id) => {
          const portal = portals.find(p => p.id === id);
          if (portal) {
            setShowDeleteConfirmPortal(portal);
            setSelectedPortalProfile(null);
          }
        }}
      />

      {/* BULK DELETE CONFIRMATION MODAL */}
      {showBulkDeletePortalsConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[var(--crm-card)] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-[var(--crm-card-border)] p-6 space-y-4"
          >
            <div className="flex items-center gap-3 text-rose-600">
              <Trash2 size={24} />
              <h3 className="text-lg font-medium text-[var(--crm-text)] font-structure">Delete Selected Portals?</h3>
            </div>
            <p className="text-xs text-[var(--crm-subtitle)] leading-relaxed">
              Are you sure you want to permanently delete <strong>{selectedPortalIds.length} selected portal{selectedPortalIds.length === 1 ? '' : 's'}</strong>? This will permanently remove all associated files and access records.
            </p>

            <div className="flex gap-3 justify-end pt-2 border-t border-[var(--crm-card-border)]">
              <button
                type="button"
                onClick={() => setShowBulkDeletePortalsConfirm(false)}
                className="px-4 py-2 border border-[var(--crm-card-border)] text-[var(--crm-text-secondary)] rounded-xl text-xs hover:bg-[var(--crm-sidebar-active-bg)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkDeletePortals}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs transition-colors font-medium cursor-pointer shadow-xs"
              >
                Delete Portals
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirmPortal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[var(--crm-card)] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-[var(--crm-card-border)] p-6 space-y-4"
          >
            <div className="flex items-center gap-3 text-rose-600">
              <Trash2 size={24} />
              <h3 className="text-lg font-medium text-[var(--crm-text)] font-structure">Delete this portal?</h3>
            </div>
            <p className="text-xs text-[var(--crm-subtitle)] leading-relaxed">
              Are you sure you want to permanently delete the client portal for <strong>{showDeleteConfirmPortal.clientName}</strong>? This will permanently remove all associated files and information records.
            </p>

            <div className="flex gap-3 justify-end pt-2 border-t border-[var(--crm-card-border)]">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmPortal(null)}
                className="px-4 py-2 border border-[var(--crm-card-border)] text-[var(--crm-text-secondary)] rounded-xl text-xs hover:bg-[var(--crm-sidebar-active-bg)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetId = showDeleteConfirmPortal.id;
                  setShowDeleteConfirmPortal(null);
                  handleDeletePortal(targetId);
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs transition-colors font-medium cursor-pointer shadow-xs"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Client Portal Long-Press / Context Action Menu Modal */}
      {actionMenuPortal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs" 
          onClick={() => setActionMenuPortal(null)}
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
                  {actionMenuPortal.portalId}
                </span>
                <h4 className="font-bold text-sm text-[var(--crm-heading)] truncate">
                  {actionMenuPortal.clientName}
                </h4>
                {actionMenuPortal.clientCompany && (
                  <p className="text-[10px] text-[var(--crm-text-muted)] truncate">{actionMenuPortal.clientCompany}</p>
                )}
              </div>
              <button 
                onClick={() => setActionMenuPortal(null)} 
                className="p-1 text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] rounded-lg hover:bg-[var(--crm-sidebar)] transition-colors cursor-pointer shrink-0"
              >
                <X size={14} />
              </button>
            </div>

            <div className="py-1 space-y-0.5">
              <button 
                onClick={() => { 
                  const portal = actionMenuPortal;
                  setActionMenuPortal(null); 
                  setSelectedPortal(portal); 
                }} 
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-left cursor-pointer transition-colors font-medium"
              >
                <ShieldCheck size={15} className="text-indigo-500 shrink-0" />
                <div>
                  <span className="block text-xs font-semibold">Open Portal Workspace</span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400">Access full client portal hub</span>
                </div>
              </button>

              <button 
                onClick={() => { 
                  const portal = actionMenuPortal;
                  setActionMenuPortal(null); 
                  setShowEditPortalModal(portal);
                  setEditPortalForm({
                    clientService: portal.clientService || '',
                    enabledSections: portal.enabledSections || ['overview', 'files', 'domain', 'services', 'chat'],
                    folders: portal.folders?.map(f => f.name) || PRESET_FOLDERS.slice(0, 5),
                    customFolders: (portal.folders?.map(f => f.name) || []).filter(f => !PRESET_FOLDERS.includes(f)),
                    newCustomFolder: '',
                    clientUploadEnabled: portal.clientUploadEnabled ?? true,
                    clientDownloadEnabled: portal.clientDownloadEnabled ?? true,
                  });
                }} 
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-left cursor-pointer transition-colors font-medium"
              >
                <Settings size={15} className="text-indigo-500 shrink-0" />
                <div>
                  <span className="block text-xs font-semibold">Edit Portal Configuration</span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400">Customize enabled sections & folders</span>
                </div>
              </button>

              <button 
                onClick={() => { 
                  const portal = actionMenuPortal;
                  setActionMenuPortal(null); 
                  setSelectedPortalProfile(portal); 
                }} 
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-left cursor-pointer transition-colors font-medium"
              >
                <Eye size={15} className="text-indigo-500 shrink-0" />
                <div>
                  <span className="block text-xs font-semibold">View Account Credentials</span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400">Inspect login credentials & details</span>
                </div>
              </button>

              <button 
                onClick={async () => { 
                  const portal = actionMenuPortal;
                  setActionMenuPortal(null); 
                  await handleSavePortalData({
                    ...portal,
                    status: 'Active',
                    updatedAt: new Date().toISOString()
                  });
                }} 
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-left cursor-pointer transition-colors font-medium"
              >
                <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                <div>
                  <span className="block text-xs font-semibold">Set Status to Active</span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400">Enable portal access</span>
                </div>
              </button>

              <button 
                onClick={async () => { 
                  const portal = actionMenuPortal;
                  setActionMenuPortal(null); 
                  await handleSavePortalData({
                    ...portal,
                    status: 'Inactive',
                    updatedAt: new Date().toISOString()
                  });
                }} 
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-left cursor-pointer transition-colors font-medium"
              >
                <Lock size={15} className="text-amber-500 shrink-0" />
                <div>
                  <span className="block text-xs font-semibold">Set Status to Inactive</span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400">Disable portal access</span>
                </div>
              </button>

              <button 
                onClick={async () => { 
                  const portal = actionMenuPortal;
                  setActionMenuPortal(null); 
                  await handleSavePortalData({
                    ...portal,
                    status: 'Archived',
                    updatedAt: new Date().toISOString()
                  });
                  showToast('Client Portal moved to Archive', 'success');
                }} 
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-left cursor-pointer transition-colors font-medium"
              >
                <ShieldCheck size={15} className="text-indigo-500 shrink-0" />
                <div>
                  <span className="block text-xs font-semibold">Archive Portal Account</span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400">Move portal to Central Archive</span>
                </div>
              </button>
            </div>

            <div className="border-t border-[var(--crm-card-border)] pt-1">
              <button 
                onClick={async () => { 
                  const portal = actionMenuPortal;
                  setActionMenuPortal(null); 
                  setShowDeleteConfirmPortal(portal);
                }} 
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-rose-500/10 text-rose-600 text-left cursor-pointer transition-colors font-medium"
              >
                <Trash2 size={15} className="text-rose-500 shrink-0" />
                <div>
                  <span className="block text-xs">Delete Portal</span>
                  <span className="block text-[10px] text-[var(--crm-text-muted)]">Permanently delete portal</span>
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
