import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Plus,
  Search,
  Lock,
  Unlock,
  Key,
  UserCog,
  FileText,
  UploadCloud,
  Eye,
  EyeOff,
  Check,
  Trash2,
  Edit,
  Send,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Users,
  MessageSquare,
  Target,
  DollarSign,
  Download,
  X,
  Sparkles,
  RefreshCw,
  Copy,
  ExternalLink,
  Link as LinkIcon,
  FolderGit2
} from 'lucide-react';
import { TeamPortalAccount, TeamInternalFile, TeamMember, Project } from '../types';
import { saveToFirestore, deleteFromFirestore, getCollectionOnce } from '../lib/firebaseSync';
import { generatePortalLink } from '../lib/portalRouter';
import { deletePortalFile, uploadPortalFile } from '../lib/fileStorage';
import FolderExplorer from './FolderExplorer';
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

interface TeamPortalManagerProps {
  teamMembers: TeamMember[];
  projects: Project[];
  showToast: (message: string, type?: 'success' | 'error') => void;
  onOpenChat?: (portalId: string, type: 'client' | 'team') => void;
}

export default function TeamPortalManager({ teamMembers, projects, showToast, onOpenChat }: TeamPortalManagerProps) {
  const [teamAccounts, setTeamAccounts] = useState<TeamPortalAccount[]>([]);
  const [internalFiles, setInternalFiles] = useState<TeamInternalFile[]>([]);
  const [teamSyncStatus, setTeamSyncStatus] = useState<Record<string, 'Synced' | 'Syncing' | 'Failed'>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');

  // Selected Team Account for Management or Live Team Preview
  const [selectedAccount, setSelectedAccount] = useState<TeamPortalAccount | null>(null);
  const [selectedAccountProfile, setSelectedAccountProfile] = useState<TeamPortalAccount | null>(null);

  // Modals state
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [showUploadFileModal, setShowUploadFileModal] = useState(false);
  const [showSendCredsModal, setShowSendCredsModal] = useState<TeamPortalAccount | null>(null);
  const [editCredsUsername, setEditCredsUsername] = useState('');
  const [editCredsPassword, setEditCredsPassword] = useState('');
  const [editCredsFullName, setEditCredsFullName] = useState('');
  const [showCredsPassword, setShowCredsPassword] = useState(false);
  const [isSavingCreds, setIsSavingCreds] = useState(false);
  const [showDeleteConfirmAccount, setShowDeleteConfirmAccount] = useState<TeamPortalAccount | null>(null);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);

  const handleOpenCredsModal = (acc: TeamPortalAccount) => {
    setShowSendCredsModal(acc);
    setEditCredsUsername(acc.username || '');
    setEditCredsPassword(acc.password || '');
    setEditCredsFullName(acc.fullName || '');
    setShowCredsPassword(false);
  };

  const handleSaveCredentials = async () => {
    if (!showSendCredsModal) return;
    if (!editCredsUsername.trim() || !editCredsPassword.trim()) {
      showToast('Username and password cannot be empty', 'error');
      return;
    }
    setIsSavingCreds(true);
    try {
      const updated: TeamPortalAccount = {
        ...showSendCredsModal,
        username: editCredsUsername.trim(),
        password: editCredsPassword.trim(),
        fullName: editCredsFullName.trim() || showSendCredsModal.fullName,
        updatedAt: new Date().toISOString()
      };
      await saveToFirestore('teamPortals', showSendCredsModal.id, updated);
      setTeamAccounts(prev => prev.map(a => a.id === updated.id ? updated : a));
      setShowSendCredsModal(updated);
      showToast('Portal credentials updated successfully!', 'success');
    } catch (err) {
      console.error('Error saving credentials:', err);
      showToast('Failed to update credentials', 'error');
    } finally {
      setIsSavingCreds(false);
    }
  };



  // Context Action Menu State for Team Portals
  const [actionMenuAccount, setActionMenuAccount] = useState<TeamPortalAccount | null>(null);
  const accountLongPressTimer = useRef<NodeJS.Timeout | null>(null);
  const accountLongPressTriggered = useRef<string | null>(null);

  const startAccountPress = (account: TeamPortalAccount) => {
    accountLongPressTriggered.current = null;
    if (accountLongPressTimer.current) clearTimeout(accountLongPressTimer.current);
    accountLongPressTimer.current = setTimeout(() => {
      accountLongPressTriggered.current = account.id;
      setActionMenuAccount(account);
    }, 500);
  };

  const cancelAccountPress = () => {
    if (accountLongPressTimer.current) {
      clearTimeout(accountLongPressTimer.current);
      accountLongPressTimer.current = null;
    }
  };

  const getTeamPortalPressHandlers = (account: TeamPortalAccount, normalClick: () => void) => {
    return {
      onMouseDown: (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('a') || target.closest('svg')) return;
        startAccountPress(account);
      },
      onMouseUp: cancelAccountPress,
      onMouseLeave: cancelAccountPress,
      onTouchStart: (e: React.TouchEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('a') || target.closest('svg')) return;
        startAccountPress(account);
      },
      onTouchEnd: cancelAccountPress,
      onTouchMove: cancelAccountPress,
      onContextMenu: (e: React.MouseEvent) => {
        e.preventDefault();
        setActionMenuAccount(account);
      },
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (accountLongPressTriggered.current === account.id) {
          accountLongPressTriggered.current = null;
          return;
        }
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('a')) return;
        normalClick();
      }
    };
  };

  // Admin Toggle: View Team Portals vs All Team Uploads Feed
  const [adminActiveView, setAdminActiveView] = useState<'accounts' | 'uploads'>('accounts');

  const handleAdminDeleteTeamUpload = async (account: TeamPortalAccount, fileId: string, fileUrl: string) => {
    if (!confirm('Are you sure you want to delete this file uploaded by the team member?')) return;
    try {
      if (fileUrl) {
        await deletePortalFile(fileUrl);
      }
      const updatedFiles = (account.projectFiles || []).filter(f => f.id !== fileId);
      const updatedAcc = {
        ...account,
        projectFiles: updatedFiles,
        updatedAt: new Date().toISOString()
      };
      await saveToFirestore('teamPortals', account.id, updatedAcc);
      setTeamAccounts(prev => prev.map(a => (a.id === account.id ? updatedAcc : a)));
      showToast('Uploaded file deleted successfully.', 'success');
    } catch (err) {
      showToast('Failed to delete uploaded file.', 'error');
    }
  };

  // New Team Account Form
  const [newAccountForm, setNewAccountForm] = useState({
    teamMemberId: '',
    username: '',
    password: '',
    permissions: {
      canAccessFiles: true,
      canUploadFiles: true,
      canCreateFolders: true
    }
  });

  // New File Upload Form
  const [fileUploadForm, setFileUploadForm] = useState({
    targetMemberId: 'ALL',
    notes: '',
    file: null as File | null
  });

  // Helper to resolve linked team member data dynamically from Team Management
  const getAccountMemberData = (acc: TeamPortalAccount) => {
    const linked = teamMembers.find(m => m.id === acc.teamMemberId);
    return {
      fullName: linked?.fullName || acc.fullName || 'Team Member',
      role: linked?.role || acc.role || 'Developer',
      email: linked?.email || acc.email || '',
      whatsapp: linked?.whatsapp || acc.whatsapp || '',
      avatar: linked?.avatar,
      service: linked?.service,
      linkedMember: linked
    };
  };

  // Fetch Team Accounts and Internal Files from Firestore
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [accs, files] = await Promise.all([
        getCollectionOnce<TeamPortalAccount>('teamPortals'),
        getCollectionOnce<TeamInternalFile>('teamInternalFiles')
      ]);
      
      // Auto-assign secureToken to existing team accounts if missing
      const validatedAccs = await Promise.all((accs || []).map(async a => {
        if (!a.secureToken) {
          const secureToken = generateUUID();
          const updated = { ...a, secureToken };
          await saveToFirestore('teamPortals', a.id, updated);
          return updated;
        }
        return a;
      }));

      setTeamAccounts(validatedAccs);
      setInternalFiles(files || []);
    } catch (err) {
      console.error('Failed to load team portal data:', err);
      showToast('Failed to load team portal data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Member Select Change -> Auto-Imports Team Member CRM data & generates portal username
  const handleMemberSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const member = teamMembers.find(m => m.id === selectedId);
    if (member) {
      const generatedUsername = member.fullName
        ? member.fullName.toLowerCase().trim().replace(/[^a-z0-9]/g, '_')
        : '';
      setNewAccountForm(prev => ({
        ...prev,
        teamMemberId: member.id,
        username: generatedUsername,
        password: prev.password || 'TeamPass123!'
      }));
    } else {
      setNewAccountForm(prev => ({
        ...prev,
        teamMemberId: '',
        username: '',
        password: ''
      }));
    }
  };

  // Handle Create Team Account (Links to existing Team Member record without duplicating)
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newAccountForm.teamMemberId) {
      showToast('Please select a Team Member from Team Management', 'error');
      return;
    }

    const selectedMember = teamMembers.find(m => m.id === newAccountForm.teamMemberId);
    if (!selectedMember) {
      showToast('Selected Team Member not found in Team Management', 'error');
      return;
    }

    if (!newAccountForm.username.trim() || !newAccountForm.password.trim()) {
      showToast('Please specify Username and Password for the portal', 'error');
      return;
    }

    // Check if a portal account already exists for this team member
    const existingPortal = teamAccounts.find(a => a.teamMemberId === selectedMember.id);
    if (existingPortal) {
      showToast(`A Team Portal already exists for ${selectedMember.fullName}`, 'error');
      return;
    }

    const accountId = `team-${Date.now()}`;
    const secureToken = generateUUID();
    const newAcc: TeamPortalAccount = {
      id: accountId,
      secureToken: secureToken,
      teamMemberId: selectedMember.id,
      fullName: selectedMember.fullName,
      email: selectedMember.email || '',
      whatsapp: selectedMember.whatsapp || '',
      role: (selectedMember.role || 'Developer') as any,
      username: newAccountForm.username.trim(),
      password: newAccountForm.password.trim(),
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      permissions: newAccountForm.permissions,
      assignedProjectIds: [],
      assignedClientIds: [],
      folders: [],
      projectFiles: []
    };

    try {
      await saveToFirestore('teamPortals', accountId, newAcc);
      setTeamAccounts(prev => [newAcc, ...prev]);
      setShowCreateAccountModal(false);
      setNewAccountForm({
        teamMemberId: '',
        username: '',
        password: '',
        permissions: {
          canAccessFiles: true,
          canUploadFiles: true,
          canCreateFolders: true
        }
      });
      showToast(`Created Team Portal for ${selectedMember.fullName}`, 'success');
    } catch (err) {
      console.error('Create account error:', err);
      showToast('Failed to create team portal account', 'error');
    }
  };

  // Handle Internal File Upload
  const handleUploadInternalFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileUploadForm.file) {
      showToast('Please select a file to upload', 'error');
      return;
    }

    const file = fileUploadForm.file;
    
    try {
      const uploadRes = await uploadPortalFile(
        file, 
        `teamInternalFiles/${fileUploadForm.targetMemberId}`
      );
      
      const fileId = `tfile-${Date.now()}`;
      const newFile: TeamInternalFile = {
        id: fileId,
        fileName: file.name,
        fileType: file.type || file.name.split('.').pop() || 'document',
        size: uploadRes.size,
        fileUrl: uploadRes.fileUrl,
        storagePath: uploadRes.storagePath,
        uploadedBy: 'CRM Admin',
        uploadedAt: new Date().toISOString().split('T')[0],
        targetMemberId: fileUploadForm.targetMemberId,
        notes: fileUploadForm.notes
      };

      await saveToFirestore('teamInternalFiles', fileId, newFile);
      setInternalFiles(prev => [newFile, ...prev]);
      setShowUploadFileModal(false);
      setFileUploadForm({ targetMemberId: 'ALL', notes: '', file: null });
      showToast('Internal file uploaded to Team Vault successfully', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to upload file to Team Vault', 'error');
    }
  };

  // Toggle Status
  const handleToggleStatus = async (account: TeamPortalAccount) => {
    setTeamSyncStatus(prev => ({ ...prev, [account.id]: 'Syncing' }));
    const updatedStatus = account.status === 'Active' ? 'Inactive' : 'Active';
    const updatedAcc = { ...account, status: updatedStatus, updatedAt: new Date().toISOString() };
    try {
      await saveToFirestore('teamPortals', account.id, updatedAcc);
      setTeamAccounts(prev => prev.map(a => (a.id === account.id ? updatedAcc : a)));
      setTeamSyncStatus(prev => ({ ...prev, [account.id]: 'Synced' }));
      showToast(`Account set to ${updatedStatus}`, 'success');
    } catch (err) {
      setTeamSyncStatus(prev => ({ ...prev, [account.id]: 'Failed' }));
      showToast('Failed to update status', 'error');
    }
  };

  // Delete Account
  const handleDeleteAccount = async (id: string) => {
    setDeletingAccountId(id);
    setTeamSyncStatus(prev => ({ ...prev, [id]: 'Syncing' }));

    try {
      const accountToDelete = teamAccounts.find(a => a.id === id);
      if (accountToDelete && accountToDelete.projectFiles && Array.isArray(accountToDelete.projectFiles)) {
        for (const file of accountToDelete.projectFiles) {
          if (file.fileUrl) {
            await deletePortalFile(file.fileUrl);
          }
        }
      }

      const memberSpecificFiles = internalFiles.filter(f => f.targetMemberId === id);
      for (const file of memberSpecificFiles) {
        if (file.fileUrl) {
          await deletePortalFile(file.fileUrl);
        }
        await deleteFromFirestore('teamInternalFiles', file.id);
      }
      setInternalFiles(prev => prev.filter(f => f.targetMemberId !== id));
      
      const success = await deleteFromFirestore('teamPortals', id);
      if (!success) {
        throw new Error('Database rejected account deletion.');
      }
      
      setTeamAccounts(prev => prev.filter(a => a.id !== id));
      if (selectedAccount?.id === id) setSelectedAccount(null);
      showToast('Team account deleted successfully', 'success');
      setDeletingAccountId(null);
    } catch (err: any) {
      console.error("Delete account error:", err);
      setTeamSyncStatus(prev => ({ ...prev, [id]: 'Failed' }));
      showToast(err.message || 'Failed to delete account', 'error');
      setDeletingAccountId(null);
    }
  };

  // Copy Portal Link
  const handleCopyLink = async (url: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        showToast('Portal URL copied to clipboard!', 'success');
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
          showToast('Portal URL copied to clipboard!', 'success');
        } catch (error) {
          showToast('Failed to copy URL', 'error');
        }
        document.body.removeChild(textArea);
      }
    } catch (err) {
      showToast('Failed to copy URL', 'error');
    }
  };

  // Delete Internal File
  const handleDeleteFile = async (id: string) => {
    if (!confirm('Are you sure you want to delete this internal file?')) return;

    try {
      const fileToDelete = internalFiles.find(f => f.id === id);
      if (fileToDelete && fileToDelete.fileUrl) {
        await deletePortalFile(fileToDelete.fileUrl);
      }
      await deleteFromFirestore('teamInternalFiles', id);
      setInternalFiles(prev => prev.filter(f => f.id !== id));
      showToast('Internal file deleted from Team Vault', 'success');
    } catch (err) {
      showToast('Failed to delete file', 'error');
    }
  };

  // Handle Admin Folder Sync for Team Members
  const handleAdminTeamUpdateFoldersAndFiles = async (
    updatedFolders: any[],
    updatedFiles: any[]
  ) => {
    if (!selectedAccount) return;

    const updatedAcc = {
      ...selectedAccount,
      folders: updatedFolders,
      projectFiles: updatedFiles,
      updatedAt: new Date().toISOString()
    };

    try {
      await saveToFirestore('teamPortals', selectedAccount.id, updatedAcc);
      setTeamAccounts(prev => prev.map(a => (a.id === selectedAccount.id ? updatedAcc : a)));
      setSelectedAccount(updatedAcc);
    } catch (err) {
      showToast('Failed to sync team folder structure', 'error');
    }
  };

  const handleAdminTeamFolderUploadFile = async (
    file: File, 
    folderId: string | null,
    onProgress?: (progress: number, loaded: number, total: number) => void,
    abortController?: AbortController
  ): Promise<void> => {
    if (!selectedAccount) return;

    try {
      const uploadRes = await uploadPortalFile(
        file, 
        `teamPortals/${selectedAccount.id}/${folderId || 'root'}`,
        onProgress,
        abortController
      );
      
      const fileId = `file-${Date.now()}`;
      const newFile = {
        id: fileId,
        fileId: fileId,
        projectId: selectedAccount.id,
        name: uploadRes.fileName,
        fileName: uploadRes.fileName,
        fileType: file.type || file.name.split('.').pop() || 'document',
        size: uploadRes.size,
        fileSize: uploadRes.size,
        storagePath: uploadRes.storagePath,
        downloadUrl: uploadRes.downloadUrl || uploadRes.fileUrl,
        fileUrl: uploadRes.fileUrl,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'CRM Admin',
        folderId: folderId,
        category: 'Admin Uploaded'
      };

      const updatedAcc = {
        ...selectedAccount,
        projectFiles: [newFile, ...(selectedAccount.projectFiles || [])],
        updatedAt: new Date().toISOString()
      };

      await saveToFirestore('teamPortals', selectedAccount.id, updatedAcc);
      setTeamAccounts(prev => prev.map(a => (a.id === selectedAccount.id ? updatedAcc : a)));
      setSelectedAccount(updatedAcc);
      showToast(`Uploaded ${file.name} to team portal!`, 'success');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        showToast('Upload was cancelled.', 'error');
        throw err;
      }
      showToast(err.message || 'Failed to upload file to team member vault', 'error');
      throw err;
    }
  };

  // Filtered Accounts
  const filteredAccounts = teamAccounts.filter(acc => {
    if (acc.status === 'Archived') return false;
    const data = getAccountMemberData(acc);
    const matchesSearch =
      data.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      data.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'All' || data.role === roleFilter || acc.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 text-[var(--crm-text)] w-full max-w-[98%] mx-auto font-sans">
      {!selectedAccount ? (
        <div className="space-y-6">
          {/* TAB BAR FOR ADMIN VIEW */}
          <div className="flex items-center gap-1 bg-[var(--crm-sidebar)] p-1 rounded-xl border border-[var(--crm-card-border)] w-fit">
            <button
              type="button"
              onClick={() => setAdminActiveView('accounts')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                adminActiveView === 'accounts'
                  ? 'bg-[var(--crm-card)] text-indigo-600 border border-[var(--crm-card-border)] shadow-xs'
                  : 'text-[var(--crm-text-muted)] hover:text-[var(--crm-text)]'
              }`}
            >
              Team Portal Accounts
            </button>
            <button
              type="button"
              onClick={() => setAdminActiveView('uploads')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                adminActiveView === 'uploads'
                  ? 'bg-[var(--crm-card)] text-indigo-600 border border-[var(--crm-card-border)] shadow-xs'
                  : 'text-[var(--crm-text-muted)] hover:text-[var(--crm-text)]'
              }`}
            >
              Team Uploaded Files Feed
            </button>
          </div>

          {adminActiveView === 'accounts' ? (
            <>
              {/* Header & Controls Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--crm-card)] p-5 rounded-[24px] border border-[var(--crm-card-border)] shadow-sm">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--crm-text-muted)]" size={18} />
                <input
                  type="text"
                  placeholder="Search Team Portals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all text-[var(--crm-text)] font-medium"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2.5 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl text-sm text-[var(--crm-text)] focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-semibold cursor-pointer"
              >
                <option value="All">All Roles</option>
                <option value="Developer">Developer</option>
                <option value="Designer">Designer</option>
                <option value="Video Editor">Video Editor</option>
                <option value="Motion Designer">Motion Designer</option>
                <option value="Support Agent">Support Agent</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowUploadFileModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[var(--crm-sidebar-active-bg)] hover:bg-[var(--crm-sidebar-active-bg)]/80 text-[var(--crm-text)] rounded-xl text-xs font-medium transition-all border border-[var(--crm-card-border)] cursor-pointer"
              >
                <UploadCloud size={16} className="text-[var(--crm-text-muted)]" />
                <span>Upload Document</span>
              </button>
              <button
                onClick={() => setShowCreateAccountModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition-all shadow-md shadow-indigo-600/15 cursor-pointer"
              >
                <Plus size={16} />
                <span>Create Team Account</span>
              </button>
            </div>
          </div>

          {/* Accounts Directory Table */}
          <div className="bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-[24px] overflow-hidden shadow-sm">
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
            ) : filteredAccounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <div className="w-16 h-16 bg-[var(--crm-sidebar)] rounded-2xl flex items-center justify-center mb-4 border border-[var(--crm-card-border)] text-[var(--crm-text-muted)]">
                  <Users size={32} />
                </div>
                <h3 className="text-base font-medium text-[var(--crm-text)] font-structure">No Team Portals Created Yet</h3>
                <p className="text-xs text-[var(--crm-text-muted)] mt-1 mb-6 max-w-xs leading-relaxed ">
                  Create a dedicated portal account to give team members secure workspace access.
                </p>
                <button
                  onClick={() => setShowCreateAccountModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition-all cursor-pointer shadow-md"
                >
                  <Plus size={16} />
                  <span>Create First Account</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-[var(--crm-sidebar)] border-b border-[var(--crm-card-border)]">
                      <th className="px-6 py-4 text-[10px] font-semibold text-[var(--crm-text-muted)]   font-structure">Portal ID</th>
                      <th className="px-6 py-4 text-[10px] font-semibold text-[var(--crm-text-muted)]   font-structure">Member / Role</th>
                      <th className="px-6 py-4 text-[10px] font-semibold text-[var(--crm-text-muted)]   font-structure">Portal Type</th>
                      <th className="px-6 py-4 text-[10px] font-semibold text-[var(--crm-text-muted)]   font-structure">Status</th>
                      <th className="px-6 py-4 text-[10px] font-semibold text-[var(--crm-text-muted)]   font-structure text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--crm-card-border)]">
                    <AnimatePresence>
                      {filteredAccounts.map((acc, index) => {
                        const memberData = getAccountMemberData(acc);
                        const displayPortalId = acc.id && /^TP-\d{3,5}$/i.test(acc.id) ? acc.id.toUpperCase() : `TP-${1001 + index}`;
                        const portalUrl = generatePortalLink('team', acc.id, acc.secureToken).primaryUrl;

                        return (
                          <motion.tr
                            key={acc.id}
                            layout
                            initial={{ opacity: 1 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="hover:bg-[var(--crm-sidebar-active-bg)] transition-colors cursor-pointer group select-none"
                            {...getTeamPortalPressHandlers(acc, () => setSelectedAccountProfile(acc))}
                          >
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-lg text-[11px] font-mono  inline-block">
                                {displayPortalId}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {memberData.avatar ? (
                                  <img
                                    src={memberData.avatar}
                                    alt={memberData.fullName}
                                    className="h-9 w-9 rounded-xl object-cover border border-indigo-100"
                                  />
                                ) : (
                                  <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 flex items-center justify-center font-medium text-xs">
                                    {memberData.fullName.split(' ').map(n => n[0]).join('')}
                                  </div>
                                )}
                                <div>
                                  <div className="text-sm font-medium text-[var(--crm-text)]">{memberData.fullName}</div>
                                  <div className="text-[10px] text-[var(--crm-text-muted)]   ">
                                    {memberData.role} {memberData.service ? `• ${memberData.service}` : ''}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="p-1 rounded bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                                  <Briefcase size={14} />
                                </div>
                                <span className="text-xs font-medium text-[var(--crm-text)]">Team Workspace</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                                acc.status === 'Active' 
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                                  : 'bg-[var(--crm-sidebar)] text-[var(--crm-text-muted)] border-[var(--crm-card-border)]'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${acc.status === 'Active' ? 'bg-emerald-500' : 'bg-[var(--crm-text-muted)]'}`} />
                                {acc.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                {onOpenChat && (
                                  <button
                                    onClick={() => onOpenChat(acc.teamMemberId || acc.id, 'team')}
                                    className="p-2 text-[var(--crm-text-muted)] hover:text-indigo-600 hover:bg-indigo-500/10 rounded-lg transition-all cursor-pointer"
                                    title="Open Portal Chat"
                                  >
                                    <MessageSquare size={16} />
                                  </button>
                                )}

                                <button
                                  onClick={() => handleOpenCredsModal(acc)}
                                  className="p-2 text-[var(--crm-text-muted)] hover:text-indigo-600 hover:bg-indigo-500/10 rounded-lg transition-all"
                                  title="View & Edit Credentials"
                                >
                                  <Key size={16} />
                                </button>
                                <a
                                  href={portalUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-2 text-[var(--crm-text-muted)] hover:text-emerald-600 hover:bg-emerald-500/10 rounded-lg transition-all"
                                  title="Open Portal Link"
                                >
                                  <ExternalLink size={16} />
                                </a>
                                <button
                                  onClick={() => setShowDeleteConfirmAccount(acc)}
                                  className="p-2 text-[var(--crm-text-muted)] hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-all"
                                  title="Delete Account"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Internal Shared Vault Files Section */}
          <div className="p-6 bg-[var(--crm-card)] border border-[var(--crm-card-border)]/80 /80 rounded-[24px] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--crm-card-border)]">
              <div>
                <h3 className="font-semibold text-base text-[var(--crm-text)] font-structure flex items-center gap-2 tracking-tight ">
                  <UploadCloud size={18} className="text-indigo-600" /> Internal Document Vault
                </h3>
                <p className="text-xs text-[var(--crm-subtitle)]  mt-0.5">Documents shared securely across authorized team members.</p>
              </div>

              <button
                onClick={() => setShowUploadFileModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[var(--crm-sidebar)] hover:bg-zinc-200 text-[var(--crm-text)] rounded-xl text-xs font-medium transition-all cursor-pointer"
              >
                <Plus size={14} />
                <span>Upload File</span>
              </button>
            </div>

            {internalFiles.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-xs text-[var(--crm-text-muted)] ">No internal files uploaded yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 4k:grid-cols-7 5k:grid-cols-10 gap-3">
                {internalFiles.map(file => (
                  <div key={file.id} className="p-3.5 bg-[var(--crm-sidebar)] rounded-xl border border-[var(--crm-card-border)]/70 flex items-center justify-between text-sm hover:border-[var(--crm-card-border)] transition-colors">
                    <div>
                      <span className="font-semibold text-[var(--crm-text)] block truncate max-w-[170px] 2xl:max-w-[280px] 3xl:max-w-[450px] 4k:max-w-none text-xs font-structure">{file.fileName}</span>
                      <span className="text-[var(--crm-text-muted)] text-[10px] ">Recipient: {file.targetMemberId} • {file.size}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <a href={file.fileUrl} download={file.fileName} className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:bg-indigo-500/10 rounded-lg transition-all">
                        <Download size={15} />
                      </a>
                      <button onClick={() => handleDeleteFile(file.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:bg-rose-500/10 rounded-lg transition-all cursor-pointer">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        /* TEAM UPLOADED FILES FEED VIEW */
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--crm-card)] p-5 rounded-[24px] border border-[var(--crm-card-border)] shadow-sm">
                <div>
                  <h3 className="font-semibold text-base text-[var(--crm-text)] font-structure flex items-center gap-2 tracking-tight">
                    <FolderGit2 size={18} className="text-indigo-600" />
                    <span>Team Uploaded Files Feed</span>
                  </h3>
                  <p className="text-xs text-[var(--crm-subtitle)] mt-0.5">
                    Real-time consolidated feed of all files uploaded by authorized team members from their portals.
                  </p>
                </div>
              </div>

              {/* Uploads list / table */}
              {(() => {
                // Flatten all files from all team portals
                const allTeamUploads = teamAccounts.flatMap(acc => {
                  const files = acc.projectFiles || [];
                  return files.map(f => ({
                    ...f,
                    account: acc
                  }));
                }).sort((a, b) => new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime());

                if (allTeamUploads.length === 0) {
                  return (
                    <div className="p-8 text-center bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-[24px]">
                      <p className="text-xs text-[var(--crm-text-muted)]">No team files have been uploaded yet.</p>
                    </div>
                  );
                }

                return (
                  <div className="bg-[var(--crm-card)] rounded-[24px] border border-[var(--crm-card-border)] overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[var(--crm-card-border)] bg-[var(--crm-sidebar)] text-[10px] font-semibold text-[var(--crm-text-muted)] uppercase tracking-wider">
                            <th className="p-4">File Name</th>
                            <th className="p-4">Uploaded By</th>
                            <th className="p-4">Date & Time</th>
                            <th className="p-4">Size</th>
                            <th className="p-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--crm-card-border)]">
                          {allTeamUploads.map((file, idx) => (
                            <tr key={idx} className="text-xs hover:bg-[var(--crm-sidebar)] transition-colors">
                              <td className="p-4 font-semibold text-[var(--crm-text)]">
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg">
                                    <FileText size={14} />
                                  </div>
                                  <span className="truncate max-w-[200px] md:max-w-xs block" title={file.name}>
                                    {file.name}
                                  </span>
                                </div>
                              </td>
                              <td className="p-4 text-[var(--crm-text-secondary)] font-medium">
                                {file.account.fullName}
                              </td>
                              <td className="p-4 text-[var(--crm-text-muted)]">
                                {file.uploadedAt ? new Date(file.uploadedAt).toLocaleString() : 'N/A'}
                              </td>
                              <td className="p-4 text-[var(--crm-text-muted)] font-mono">
                                {file.size || 'N/A'}
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <a
                                    href={file.fileUrl}
                                    download={file.name}
                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-all"
                                    title="Download File"
                                  >
                                    <Download size={14} />
                                  </a>
                                  <button
                                    onClick={() => handleAdminDeleteTeamUpload(file.account, file.id, file.fileUrl)}
                                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                                    title="Delete File"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      ) : (
        /* Team Portal Interactive Workspace Mode */
        <div className="p-6 bg-[var(--crm-card)] rounded-[24px] border border-[var(--crm-card-border)]/80 /80 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--crm-card-border)]">
            <div>
              <button
                onClick={() => setSelectedAccount(null)}
                className="text-xs font-medium text-indigo-600 hover:underline mb-1.5 flex items-center gap-1 transition-colors"
              >
                ← Back to Team Accounts
              </button>
              <h2 className="text-xl font-bold !text-white text-white font-structure flex items-center gap-2 tracking-tight">
                <span>Account Workspace: {selectedAccount.fullName}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 border border-indigo-200 text-[10px] font-medium ">
                  {selectedAccount.role}
                </span>
              </h2>
            </div>

            <button
              onClick={() => setSelectedAccount(null)}
              className="px-4 py-2 bg-[var(--crm-sidebar)] text-zinc-700 hover:bg-zinc-200 rounded-xl text-xs  transition-all cursor-pointer"
            >
              Exit Workspace
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[var(--crm-sidebar)] rounded-2xl border border-[var(--crm-card-border)]/80 /80">
              <span className="text-[10px] font-semibold text-[var(--crm-text-muted)]   block mb-1">Assigned Role</span>
              <span className="text-sm font-medium text-[var(--crm-text)]">{selectedAccount.role}</span>
            </div>
            <div className="p-4 bg-[var(--crm-sidebar)] rounded-2xl border border-[var(--crm-card-border)]/80 /80">
              <span className="text-[10px] font-semibold text-[var(--crm-text-muted)]   block mb-1">Portal Username</span>
              <span className="text-sm font-mono font-semibold text-indigo-600">{selectedAccount.username}</span>
            </div>
            <div className="p-4 bg-[var(--crm-sidebar)] rounded-2xl border border-[var(--crm-card-border)]/80 /80">
              <span className="text-[10px] font-semibold text-[var(--crm-text-muted)]   block mb-1">Portal Status</span>
              <span className="text-sm font-medium text-emerald-600">{selectedAccount.status}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-xs text-[var(--crm-text-secondary)]   font-structure">Workspace Access Permissions:</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px] font-medium  ">
              <div className={`p-3 rounded-xl border flex items-center gap-2 ${selectedAccount.permissions.canAccessFiles ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 border-emerald-200' : 'bg-[var(--crm-sidebar)] text-[var(--crm-text-muted)] border-[var(--crm-card-border)]'}`}>
                {selectedAccount.permissions.canAccessFiles ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />} File Access
              </div>
              <div className={`p-3 rounded-xl border flex items-center gap-2 ${selectedAccount.permissions.canUploadFiles ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 border-emerald-200' : 'bg-[var(--crm-sidebar)] text-[var(--crm-text-muted)] border-[var(--crm-card-border)]'}`}>
                {selectedAccount.permissions.canUploadFiles ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />} Can Upload
              </div>
              <div className={`p-3 rounded-xl border flex items-center gap-2 ${selectedAccount.permissions.canCreateFolders ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 border-emerald-200' : 'bg-[var(--crm-sidebar)] text-[var(--crm-text-muted)] border-[var(--crm-card-border)]'}`}>
                {selectedAccount.permissions.canCreateFolders ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />} Manage Folders
              </div>
            </div>
          </div>

          {/* File Vault Directories */}
          <div className="space-y-3 pt-4 border-t border-[var(--crm-card-border)]">
            <div>
              <h4 className="font-medium text-sm text-[var(--crm-text)]  tracking-tight font-structure">Workspace Files & Directories:</h4>
              <p className="text-xs text-[var(--crm-subtitle)] ">Manage folders and files visible to this team member in their portal.</p>
            </div>

            <div className="p-2 bg-[var(--crm-sidebar)] rounded-2xl border border-[var(--crm-card-border)]/80 /80 min-h-[380px]">
              <FolderExplorer
                folders={selectedAccount.folders || []}
                files={selectedAccount.projectFiles || []}
                onUpdateFoldersAndFiles={handleAdminTeamUpdateFoldersAndFiles}
                onUploadFile={handleAdminTeamFolderUploadFile}
                isReadOnly={false}
                userRole="admin"
              />
            </div>
          </div>
        </div>
      )}

      {/* Team Account Profile Modal */}
      <CrmProfileView
        isOpen={!!selectedAccountProfile}
        onClose={() => setSelectedAccountProfile(null)}
        type="Portal"
        data={selectedAccountProfile}
        teamMembers={teamMembers}
        projects={projects}
        onEdit={() => {
          if (selectedAccountProfile) {
            setShowSendCredsModal(selectedAccountProfile);
            setSelectedAccountProfile(null);
          }
        }}
        onDelete={(id) => {
          const acc = teamAccounts.find(a => a.id === id);
          if (acc) {
            setShowDeleteConfirmAccount(acc);
            setSelectedAccountProfile(null);
          }
        }}
      />

      {/* Modal: Create Team Account */}
      {showCreateAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
          <div className="w-full max-w-lg 2xl:max-w-xl 3xl:max-w-2xl 4k:max-w-3xl 5k:max-w-4xl bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-[24px] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-[var(--crm-card-border)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-xl border border-indigo-100">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--crm-text)] font-structure tracking-tight ">Create Team Portal</h3>
                  <p className="text-xs text-[var(--crm-subtitle)] ">Link a Team Member to give them portal access</p>
                </div>
              </div>
              <button onClick={() => setShowCreateAccountModal(false)} className="p-2 text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateAccount} className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-medium text-[var(--crm-text-secondary)]   mb-1.5">Select Team Member *</label>
                <select
                  value={newAccountForm.teamMemberId}
                  onChange={handleMemberSelectChange}
                  className="w-full p-3 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl text-sm font-medium text-[var(--crm-text)] focus:bg-[var(--crm-card)] focus:focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  <option value="">-- Select Existing Team Member --</option>
                  {teamMembers.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.fullName} ({member.role || member.service || 'Team Member'})
                    </option>
                  ))}
                </select>
                {teamMembers.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1.5  flex items-center gap-1">
                    <AlertCircle size={14} /> No team members found in Team Management. Please add team members first.
                  </p>
                )}
              </div>

              {/* Auto-Imported Team Member Preview Card */}
              {(() => {
                const selectedMember = teamMembers.find(m => m.id === newAccountForm.teamMemberId);
                if (!selectedMember) return null;
                return (
                  <div className="p-4 bg-indigo-50/70 dark:bg-indigo-500/10 border border-indigo-200/80 rounded-2xl space-y-3">
                    <div className="flex items-center gap-3">
                      {selectedMember.avatar && !selectedMember.avatar.includes('/_/upload') ? (
                        <img
                          src={selectedMember.avatar}
                          alt={selectedMember.fullName}
                          className="w-12 h-12 rounded-xl object-cover border border-indigo-200 shadow-xs"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-semibold text-base flex items-center justify-center border border-indigo-700 shadow-xs">
                          {selectedMember.fullName.split(' ').map(n => n[0]).join('')}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium text-sm text-[var(--crm-text)] truncate">{selectedMember.fullName}</h4>
                          <span className="px-2 py-0.5 text-[10px] font-semibold text-indigo-700 bg-indigo-100 rounded-md  shrink-0">
                            {selectedMember.role || selectedMember.service || 'Team Member'}
                          </span>
                        </div>
                        <div className="text-xs text-[var(--crm-text-secondary)]  mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                          {selectedMember.whatsapp && (
                            <span>Phone/WA: <strong className="text-[var(--crm-text)] ">{selectedMember.whatsapp}</strong></span>
                          )}
                          {selectedMember.service && selectedMember.service !== selectedMember.role && (
                            <span>Category: <strong className="text-[var(--crm-text)] ">{selectedMember.service}</strong></span>
                          )}
                          <span className="font-mono text-[10px] text-[var(--crm-text-muted)]">ID: {selectedMember.id}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-[11px] font-medium text-indigo-900 bg-indigo-100/70 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-indigo-600 shrink-0" />
                      <span>CRM Data Auto-Imported from Team Management</span>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-medium text-[var(--crm-text-secondary)]   mb-1.5">Portal Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. john_doe"
                    value={newAccountForm.username}
                    onChange={e => setNewAccountForm({ ...newAccountForm, username: e.target.value })}
                    className="w-full p-2.5 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl text-sm font-mono font-medium text-[var(--crm-text)] focus:bg-[var(--crm-card)] focus:focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-[var(--crm-text-secondary)]   mb-1.5">Portal Password *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TeamPass123!"
                    value={newAccountForm.password}
                    onChange={e => setNewAccountForm({ ...newAccountForm, password: e.target.value })}
                    className="w-full p-2.5 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl text-sm font-mono font-medium text-[var(--crm-text)] focus:bg-[var(--crm-card)] focus:focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateAccountModal(false)}
                  className="px-5 py-2.5 bg-[var(--crm-sidebar)] hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs  transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition-all cursor-pointer shadow-md shadow-indigo-600/15"
                >
                  Create Team Portal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Upload Internal Document */}
      {showUploadFileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
          <div className="w-full max-w-lg 2xl:max-w-xl 3xl:max-w-2xl 4k:max-w-3xl 5k:max-w-4xl bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-[24px] overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-[var(--crm-card-border)] flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--crm-text)] font-structure tracking-tight ">Upload Internal File</h3>
              <button onClick={() => setShowUploadFileModal(false)} className="p-2 text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUploadInternalFile} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-medium text-[var(--crm-text-secondary)]   mb-1.5">Select File *</label>
                <input
                  type="file"
                  onChange={e => setFileUploadForm({ ...fileUploadForm, file: e.target.files?.[0] || null })}
                  className="w-full p-2.5 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl text-sm font-medium text-[var(--crm-text)] focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-[var(--crm-text-secondary)]   mb-1.5">Target Recipient</label>
                <select
                  value={fileUploadForm.targetMemberId}
                  onChange={e => setFileUploadForm({ ...fileUploadForm, targetMemberId: e.target.value })}
                  className="w-full p-2.5 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl text-sm font-medium text-[var(--crm-text)] focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  <option value="ALL">All Team Members</option>
                  {teamAccounts.map(a => (
                    <option key={a.id} value={a.id}>{a.fullName} ({a.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-medium text-[var(--crm-text-secondary)]   mb-1.5">Notes / Description</label>
                <input
                  type="text"
                  placeholder="Optional internal file description"
                  value={fileUploadForm.notes}
                  onChange={e => setFileUploadForm({ ...fileUploadForm, notes: e.target.value })}
                  className="w-full p-2.5 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl text-sm font-medium text-[var(--crm-text)] focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowUploadFileModal(false)}
                  className="px-5 py-2.5 bg-[var(--crm-sidebar)] hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs  transition-all"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition-all">
                  Upload File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Team Portal Details & Credentials Modal */}
      {showSendCredsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg 2xl:max-w-xl 3xl:max-w-2xl 4k:max-w-3xl 5k:max-w-4xl bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-2xl overflow-hidden shadow-2xl p-6 space-y-5 text-[var(--crm-text)] animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--crm-card-border)]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-xl">
                  <Key size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-[var(--crm-text)] tracking-tight leading-tight font-structure">Team Portal Credentials</h3>
                  <p className="text-[var(--crm-text-muted)] text-xs mt-0.5">View, edit, and copy access credentials for this team portal account.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSendCredsModal(null)} 
                className="p-1.5 text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] rounded-lg hover:bg-[var(--crm-sidebar-active-bg)] transition-colors cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Editable Fields Section */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Member Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[var(--crm-text-muted)] block uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editCredsFullName}
                    onChange={(e) => setEditCredsFullName(e.target.value)}
                    className="w-full h-10 px-3 text-xs font-medium text-[var(--crm-text)] bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                    placeholder="Full Name"
                  />
                </div>

                {/* Role (Read-only badge) */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[var(--crm-text-muted)] block uppercase tracking-wider">
                    Assigned Role
                  </label>
                  <div className="w-full h-10 px-3 flex items-center text-xs font-medium text-[var(--crm-text-secondary)] bg-[var(--crm-sidebar-active-bg)] border border-[var(--crm-card-border)] rounded-xl">
                    {showSendCredsModal.role || 'Team Member'}
                  </div>
                </div>

                {/* Username */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[var(--crm-text-muted)] block uppercase tracking-wider">
                    Portal Username
                  </label>
                  <input
                    type="text"
                    value={editCredsUsername}
                    onChange={(e) => setEditCredsUsername(e.target.value)}
                    className="w-full h-10 px-3 text-xs font-mono font-semibold text-[var(--crm-text)] bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                    placeholder="Username"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[var(--crm-text-muted)] block uppercase tracking-wider">
                    Portal Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCredsPassword ? "text" : "password"}
                      value={editCredsPassword}
                      onChange={(e) => setEditCredsPassword(e.target.value)}
                      className="w-full h-10 pl-3 pr-9 text-xs font-mono font-semibold text-[var(--crm-text)] bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                      placeholder="Password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCredsPassword(!showCredsPassword)}
                      className="absolute right-2.5 top-2.5 text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] cursor-pointer"
                    >
                      {showCredsPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Read-Only Portal URL */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-[var(--crm-text-muted)] block uppercase tracking-wider">
                  Portal Gateway URL (Read-Only)
                </label>
                <div className="w-full min-h-[40px] px-3 py-2 text-xs font-mono text-[var(--crm-text-secondary)] bg-[var(--crm-sidebar-active-bg)] border border-[var(--crm-card-border)] rounded-xl break-all select-all flex items-center">
                  {generatePortalLink('team', showSendCredsModal.id, showSendCredsModal.secureToken).primaryUrl}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--crm-card-border)]">
              {/* Copy / Test Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const textToCopy = `Zyqitek Team Portal Credentials\nName: ${editCredsFullName || showSendCredsModal.fullName}\nUsername: ${editCredsUsername}\nPassword: ${editCredsPassword}\nPortal URL: ${generatePortalLink('team', showSendCredsModal.id, showSendCredsModal.secureToken).primaryUrl}`;
                    navigator.clipboard.writeText(textToCopy);
                    showToast('Credentials copied to clipboard!', 'success');
                  }}
                  className="px-3.5 py-2 bg-slate-900 dark:bg-[#111827] hover:bg-slate-800 dark:hover:bg-[#1A1D23] text-white rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-xs border border-transparent dark:border-[var(--crm-card-border)]"
                >
                  <Copy size={13} />
                  <span>Copy Credentials Message</span>
                </button>

                <a
                  href={generatePortalLink('team', showSendCredsModal.id, showSendCredsModal.secureToken).primaryUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 bg-[var(--crm-sidebar-active-bg)] hover:bg-[var(--crm-sidebar-active-bg)]/80 text-[var(--crm-text)] rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 border border-[var(--crm-card-border)]"
                >
                  <ExternalLink size={13} />
                  <span>Test Gateway</span>
                </a>
              </div>

              {/* Save / Close Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSendCredsModal(null)}
                  className="px-3 py-2 text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar-active-bg)] rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={handleSaveCredentials}
                  disabled={isSavingCreds}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSavingCreds ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmAccount && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-[24px] overflow-hidden shadow-2xl text-center p-6 space-y-5"
          >
            <div className="w-14 h-14 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 rounded-2xl flex items-center justify-center mx-auto text-rose-600">
              <Trash2 size={28} />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-semibold text-[var(--crm-text)] font-structure tracking-tight ">Terminate Portal</h3>
              <p className="text-xs text-[var(--crm-subtitle)] leading-relaxed px-2 ">
                Are you sure you want to delete the portal for <strong className="text-[var(--crm-text)]">{showDeleteConfirmAccount.fullName}</strong>? This action is permanent.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowDeleteConfirmAccount(null)}
                className="py-2.5 bg-[var(--crm-sidebar)] hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs  transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const targetId = showDeleteConfirmAccount.id;
                  setShowDeleteConfirmAccount(null);
                  handleDeleteAccount(targetId);
                }}
                className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-medium transition-all cursor-pointer"
              >
                Delete Account
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Team Portal Long-Press / Context Action Menu Modal */}
      {actionMenuAccount && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs" 
          onClick={() => setActionMenuAccount(null)}
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
                  {actionMenuAccount.id}
                </span>
                <h4 className="font-bold text-sm text-[var(--crm-heading)] truncate">
                  {getAccountMemberData(actionMenuAccount).fullName}
                </h4>
                <p className="text-[10px] text-[var(--crm-text-muted)] truncate">{getAccountMemberData(actionMenuAccount).role}</p>
              </div>
              <button 
                onClick={() => setActionMenuAccount(null)} 
                className="p-1 text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] rounded-lg hover:bg-[var(--crm-sidebar)] transition-colors cursor-pointer shrink-0"
              >
                <X size={14} />
              </button>
            </div>

            <div className="py-1 space-y-0.5">
              <button 
                onClick={() => { 
                  const acc = actionMenuAccount;
                  setActionMenuAccount(null); 
                  setSelectedAccount(acc); 
                }} 
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-left cursor-pointer transition-colors font-medium"
              >
                <Briefcase size={15} className="text-indigo-500 shrink-0" />
                <div>
                  <span className="block text-xs font-semibold">Open Team Workspace</span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400">Access team portal workspace</span>
                </div>
              </button>

              <button 
                onClick={() => { 
                  const acc = actionMenuAccount;
                  setActionMenuAccount(null); 
                  setSelectedAccountProfile(acc); 
                }} 
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-left cursor-pointer transition-colors font-medium"
              >
                <Eye size={15} className="text-indigo-500 shrink-0" />
                <div>
                  <span className="block text-xs font-semibold">View Account Credentials</span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400">Inspect login credentials</span>
                </div>
              </button>

              <button 
                onClick={async () => { 
                  const acc = actionMenuAccount;
                  setActionMenuAccount(null); 
                  await handleToggleStatus(acc);
                }} 
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-left cursor-pointer transition-colors font-medium"
              >
                <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                <div>
                  <span className="block text-xs font-semibold">Toggle Active / Inactive</span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400">Current: {actionMenuAccount.status || 'Active'}</span>
                </div>
              </button>

              <button 
                onClick={async () => { 
                  const acc = actionMenuAccount;
                  setActionMenuAccount(null); 
                  const updatedAcc = { ...acc, status: 'Archived', updatedAt: new Date().toISOString() };
                  await saveToFirestore('teamPortals', acc.id, updatedAcc);
                  setTeamAccounts(prev => prev.map(a => (a.id === acc.id ? updatedAcc : a)));
                  showToast('Team Portal moved to Archive', 'success');
                }} 
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-left cursor-pointer transition-colors font-medium"
              >
                <Briefcase size={15} className="text-indigo-500 shrink-0" />
                <div>
                  <span className="block text-xs font-semibold">Archive Team Portal</span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400">Move portal to Central Archive</span>
                </div>
              </button>
            </div>

            <div className="border-t border-[var(--crm-card-border)] pt-1">
              <button 
                onClick={() => { 
                  const acc = actionMenuAccount;
                  setActionMenuAccount(null); 
                  setShowDeleteConfirmAccount(acc); 
                }} 
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-rose-500/10 text-rose-600 text-left cursor-pointer transition-colors font-medium"
              >
                <Trash2 size={15} className="text-rose-500 shrink-0" />
                <div>
                  <span className="block text-xs font-semibold">Delete Team Portal</span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400">Permanently delete portal</span>
                </div>
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
