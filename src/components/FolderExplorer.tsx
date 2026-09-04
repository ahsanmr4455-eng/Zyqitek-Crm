import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Folder, 
  File, 
  ChevronRight, 
  Search, 
  LayoutGrid, 
  List, 
  Plus, 
  Trash2, 
  Edit, 
  Move, 
  UploadCloud, 
  Eye, 
  EyeOff,
  Download, 
  ChevronLeft,
  ArrowUpDown,
  FileText,
  FileSpreadsheet,
  FileArchive,
  Image,
  FolderOpen,
  ArrowLeftRight,
  Key,
  Globe,
  Server,
  Mail,
  FolderGit2,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  Info,
  Lock,
  X,
  AlertCircle
} from 'lucide-react';
import { InformationRecord, InformationRecordField } from '../types';
import { deletePortalFile, downloadPortalFile, uploadPortalFile, formatBytes } from '../lib/fileStorage';
import PortalFileTransferWidget, { FileTransferItem } from './PortalFileTransferWidget';

export interface PortalFolder {
  id: string;
  name: string;
  description?: string;
  parentId: string | null;
  createdAt: string;
}

export interface PortalFile {
  id: string;
  name: string;
  fileType: string;
  size: string;
  uploadedAt: string;
  fileUrl: string;
  downloadUrl?: string;
  storagePath?: string;
  category?: string;
  folderId?: string | null;
  uploadedBy?: string;
}

interface FolderExplorerProps {
  key?: React.Key;
  folders: PortalFolder[];
  files: PortalFile[];
  infoRecords?: InformationRecord[];
  initialFolderId?: string | null;
  onUpdateFoldersFilesAndRecords?: (
    updatedFolders: PortalFolder[],
    updatedFiles: PortalFile[],
    updatedRecords: InformationRecord[]
  ) => Promise<void>;
  onUpdateFoldersAndFiles?: (updatedFolders: PortalFolder[], updatedFiles: PortalFile[]) => Promise<void>;
  isReadOnly?: boolean;
  onUploadFile?: (
    file: File, 
    folderId: string | null,
    onProgress?: (progress: number, loaded: number, total: number) => void,
    abortController?: AbortController
  ) => Promise<void>;
  onUploadMultipleFiles?: (files: File[], folderId: string | null) => Promise<void>;
  isUploading?: boolean;
  uploadProgress?: number;
  userRole?: string; // 'admin' | 'client' | 'team'
  teamPermissions?: { canAccessFiles: boolean };
  showToast?: (msg: string, type?: 'success' | 'error') => void;
  portalContextPath?: string;
}

const PRESET_TEMPLATES: { [key: string]: { title: string; fields: { label: string; value: string; isSecret?: boolean }[] } } = {
  'domain': {
    title: 'Domain Information',
    fields: [
      { label: 'Domain Name', value: '' },
      { label: 'Registrar', value: '' },
      { label: 'Purchase Date', value: '' },
      { label: 'Expiry Date', value: '' },
      { label: 'DNS Notes', value: '' }
    ]
  },
  'hosting': {
    title: 'Hosting Information',
    fields: [
      { label: 'Hosting Provider', value: '' },
      { label: 'Server IP', value: '' },
      { label: 'Plan / Package', value: '' },
      { label: 'Renewal Date', value: '' },
      { label: 'SSH / Server Details', value: '', isSecret: true }
    ]
  },
  'cpanel': {
    title: 'cPanel Credentials',
    fields: [
      { label: 'cPanel Login URL', value: '' },
      { label: 'Username', value: '' },
      { label: 'Password', value: '', isSecret: true },
      { label: 'Server IP', value: '' }
    ]
  },
  'website': {
    title: 'Website Logins',
    fields: [
      { label: 'Admin Login URL', value: '' },
      { label: 'Username', value: '' },
      { label: 'Password', value: '', isSecret: true },
      { label: 'CMS Type (WordPress / Custom)', value: '' },
      { label: 'User Role', value: 'Administrator' }
    ]
  },
  'email': {
    title: 'Email Credentials',
    fields: [
      { label: 'Webmail URL', value: '' },
      { label: 'Email Address', value: '' },
      { label: 'Password', value: '', isSecret: true },
      { label: 'Incoming Server', value: '' },
      { label: 'Outgoing Server', value: '' }
    ]
  },
  'ftp': {
    title: 'FTP / SFTP Credentials',
    fields: [
      { label: 'Host / Server', value: '' },
      { label: 'Port', value: '21' },
      { label: 'Username', value: '' },
      { label: 'Password', value: '', isSecret: true },
      { label: 'Protocol', value: 'SFTP' }
    ]
  },
  'apikeys': {
    title: 'API Key Details',
    fields: [
      { label: 'Service Name', value: '' },
      { label: 'API Key', value: '', isSecret: true },
      { label: 'API Secret', value: '', isSecret: true },
      { label: 'Environment', value: 'Production' }
    ]
  },
  'custom': {
    title: 'Custom Information Record',
    fields: [
      { label: 'Title / Field Name', value: '' },
      { label: 'Value / Secret', value: '', isSecret: false }
    ]
  }
};

export default function FolderExplorer({
  folders = [],
  files = [],
  infoRecords = [],
  initialFolderId = null,
  onUpdateFoldersFilesAndRecords,
  onUpdateFoldersAndFiles,
  isReadOnly = false,
  onUploadFile,
  isUploading = false,
  uploadProgress = 0,
  userRole = 'admin',
  showToast,
  portalContextPath
}: FolderExplorerProps) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(initialFolderId || null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (initialFolderId !== undefined) {
      setCurrentFolderId(initialFolderId);
    }
  }, [initialFolderId]);

  // Modals / Action States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');

  // Info Record Modal State
  const [showAddInfoModal, setShowAddInfoModal] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('custom');
  const [infoTitle, setInfoTitle] = useState('');
  const [infoFields, setInfoFields] = useState<InformationRecordField[]>([
    { label: '', value: '', isSecret: false }
  ]);
  const [infoNotes, setInfoNotes] = useState('');
  const [editingInfoId, setEditingInfoId] = useState<string | null>(null);

  const [editingItem, setEditingItem] = useState<{ id: string; name: string; type: 'folder' | 'file' } | null>(null);
  const [movingItem, setMovingItem] = useState<{ id: string; type: 'folder' | 'file'; currentParentId: string | null } | null>(null);
  const [selectedPreviewFile, setSelectedPreviewFile] = useState<PortalFile | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Secret toggles & copy indicators
  const [visibleSecrets, setVisibleSecrets] = useState<{ [key: string]: boolean }>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const canManageFolders = (userRole === 'admin' || userRole === 'team') && !isReadOnly;
  const canUpload = userRole === 'client' ? !!onUploadFile : (!isReadOnly && !!onUploadFile);

  const triggerToast = (msg: string) => {
    if (showToast) {
      showToast(msg, 'success');
    }
  };

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    triggerToast('Copied to clipboard!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleSecretVisibility = (key: string) => {
    setVisibleSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Helper sync logic
  const saveState = async (
    updatedFolders: PortalFolder[],
    updatedFiles: PortalFile[],
    updatedRecords: InformationRecord[]
  ) => {
    if (onUpdateFoldersFilesAndRecords) {
      await onUpdateFoldersFilesAndRecords(updatedFolders, updatedFiles, updatedRecords);
    } else if (onUpdateFoldersAndFiles) {
      await onUpdateFoldersAndFiles(updatedFolders, updatedFiles);
    }
  };

  // Active items in current folder
  const currentFolders = useMemo(() => {
    return folders.filter(f => f.parentId === currentFolderId);
  }, [folders, currentFolderId]);

  const currentFiles = useMemo(() => {
    return files.filter(f => (f.folderId || null) === currentFolderId);
  }, [files, currentFolderId]);

  const currentInfoRecords = useMemo(() => {
    return infoRecords.filter(r => (r.folderId || null) === currentFolderId);
  }, [infoRecords, currentFolderId]);

  // Construct Breadcrumbs
  const breadcrumbs = useMemo(() => {
    const crumbs: Array<{ id: string | null; name: string }> = [{ id: null, name: 'Root Workspace' }];
    if (!currentFolderId) return crumbs;

    const path: Array<{ id: string; name: string }> = [];
    let currId: string | null = currentFolderId;
    let safeguard = 0;

    while (currId && safeguard < 50) {
      safeguard++;
      const folder = folders.find(f => f.id === currId);
      if (folder) {
        path.unshift({ id: folder.id, name: folder.name });
        currId = folder.parentId;
      } else {
        break;
      }
    }

    return [...crumbs, ...path];
  }, [folders, currentFolderId]);

  // Search filter
  const filteredFolders = useMemo(() => {
    if (!searchQuery) return currentFolders;
    return folders.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [currentFolders, folders, searchQuery]);

  const filteredFiles = useMemo(() => {
    if (!searchQuery) return currentFiles;
    return files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [currentFiles, files, searchQuery]);

  const filteredInfoRecords = useMemo(() => {
    if (!searchQuery) return currentInfoRecords;
    return currentInfoRecords.filter(r => 
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.fields.some(field => field.label.toLowerCase().includes(searchQuery.toLowerCase()) || field.value.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [currentInfoRecords, searchQuery]);

  // Sort helper
  const sortedFolders = useMemo(() => {
    return [...filteredFolders].sort((a, b) => {
      const compare = a.name.localeCompare(b.name);
      return sortOrder === 'asc' ? compare : -compare;
    });
  }, [filteredFolders, sortOrder]);

  const sortedFiles = useMemo(() => {
    return [...filteredFiles].sort((a, b) => {
      let compare = 0;
      if (sortBy === 'name') {
        compare = a.name.localeCompare(b.name);
      } else if (sortBy === 'date') {
        compare = (a.uploadedAt || '').localeCompare(b.uploadedAt || '');
      } else if (sortBy === 'type') {
        compare = a.fileType.localeCompare(b.fileType);
      }
      return sortOrder === 'asc' ? compare : -compare;
    });
  }, [filteredFiles, sortBy, sortOrder]);

  // Transfer Manager State (Real-time Uploads & Downloads)
  const [transfers, setTransfers] = useState<FileTransferItem[]>([]);

  const updateTransfer = (id: string, updates: Partial<FileTransferItem>) => {
    setTransfers(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)));
  };

  const handleCancelTransfer = (id: string) => {
    const item = transfers.find(t => t.id === id);
    if (item?.abortController) {
      item.abortController.abort();
    }
    setTransfers(prev => prev.map(t => (t.id === id ? { ...t, status: 'cancelled', errorMessage: 'Cancelled by user' } : t)));
  };

  const handleDismissTransfer = (id: string) => {
    setTransfers(prev => prev.filter(t => t.id !== id));
  };

  const handleClearCompletedTransfers = () => {
    setTransfers(prev => prev.filter(t => t.status !== 'completed'));
  };

  const handleDownloadFile = async (file: PortalFile) => {
    const transferId = `dl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const abortController = new AbortController();

    const transferItem: FileTransferItem = {
      id: transferId,
      type: 'download',
      fileName: file.name,
      fileUrl: file.downloadUrl || file.fileUrl,
      totalBytes: 0,
      loadedBytes: 0,
      progress: 0,
      status: 'transferring',
      abortController,
      createdAt: Date.now()
    };

    setTransfers(prev => [transferItem, ...prev]);

    try {
      await downloadPortalFile(
        file.downloadUrl || file.fileUrl,
        file.name,
        (progress, loaded, total) => {
          updateTransfer(transferId, {
            progress,
            loadedBytes: loaded,
            totalBytes: total || loaded,
            status: progress >= 100 ? 'completed' : 'transferring'
          });
        },
        abortController
      );
      updateTransfer(transferId, { status: 'completed', progress: 100 });
      triggerToast(`Downloaded "${file.name}"`);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        updateTransfer(transferId, { status: 'cancelled', errorMessage: 'Download cancelled' });
      } else {
        updateTransfer(transferId, { status: 'failed', errorMessage: err.message || 'Download failed' });
        if (showToast) showToast(`Failed to download ${file.name}`, 'error');
      }
    }
  };

  const processUploadFile = async (file: File, folderId: string | null) => {
    const transferId = `up-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const abortController = new AbortController();

    const transferItem: FileTransferItem = {
      id: transferId,
      type: 'upload',
      file,
      fileName: file.name,
      totalBytes: file.size,
      loadedBytes: 0,
      progress: 0,
      status: 'transferring',
      abortController,
      createdAt: Date.now(),
      onRetry: () => processUploadFile(file, folderId)
    };

    setTransfers(prev => [transferItem, ...prev]);

    try {
      if (onUploadFile) {
        await onUploadFile(
          file, 
          folderId,
          (progress, loaded, total) => {
            updateTransfer(transferId, {
              progress,
              loadedBytes: loaded,
              totalBytes: total || file.size,
              status: progress >= 100 ? 'completed' : 'transferring'
            });
          },
          abortController
        );
        updateTransfer(transferId, {
          progress: 100,
          loadedBytes: file.size,
          totalBytes: file.size,
          status: 'completed'
        });
      } else {
        const destPath = portalContextPath 
          ? `${portalContextPath}/${folderId || 'root'}` 
          : `generalUploads/${folderId || 'root'}`;

        const uploadRes = await uploadPortalFile(
          file,
          destPath,
          (progress, loaded, total) => {
            updateTransfer(transferId, {
              progress,
              loadedBytes: loaded,
              totalBytes: total,
              status: progress >= 100 ? 'completed' : 'transferring'
            });
          },
          abortController
        );

        const newFileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
        const newFileObj: PortalFile = {
          id: newFileId,
          name: uploadRes.fileName,
          fileType: file.type || file.name.split('.').pop() || 'document',
          size: uploadRes.size,
          uploadedAt: new Date().toISOString().split('T')[0],
          fileUrl: uploadRes.fileUrl,
          downloadUrl: uploadRes.downloadUrl || uploadRes.fileUrl,
          storagePath: uploadRes.storagePath,
          category: 'Uploaded Asset',
          folderId: folderId
        };

        const updatedFiles = [newFileObj, ...files];
        await saveState(folders, updatedFiles, infoRecords);
        updateTransfer(transferId, {
          progress: 100,
          loadedBytes: file.size,
          totalBytes: file.size,
          status: 'completed'
        });
        triggerToast(`Uploaded "${file.name}"`);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        updateTransfer(transferId, { status: 'cancelled', errorMessage: 'Upload cancelled' });
      } else {
        const errMsg = err.message || 'Upload failed';
        updateTransfer(transferId, { 
          status: 'failed', 
          errorMessage: errMsg,
          onRetry: () => processUploadFile(file, folderId)
        });
        if (showToast) showToast(`Failed to upload ${file.name}: ${errMsg}`, 'error');
      }
    }
  };

  const handleUploadMultipleFiles = async (fileList: FileList | File[]) => {
    const filesArray = Array.from(fileList);
    if (filesArray.length === 0) return;

    for (const file of filesArray) {
      processUploadFile(file, currentFolderId);
    }
  };

  // Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadMultipleFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUploadMultipleFiles(e.target.files);
    }
    e.target.value = '';
  };

  // Create Folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const newFolder: PortalFolder = {
      id: `folder-${Date.now()}`,
      name: newFolderName.trim(),
      description: newFolderDescription.trim() || undefined,
      parentId: currentFolderId,
      createdAt: new Date().toISOString()
    };

    const updatedFolders = [...folders, newFolder];
    await saveState(updatedFolders, files, infoRecords);
    setNewFolderName('');
    setNewFolderDescription('');
    setShowCreateModal(false);
    triggerToast('Folder created successfully!');
  };

  // Open Preset for Info Record Modal
  const handleOpenInfoModal = (presetKey: string = 'custom') => {
    setSelectedPreset(presetKey);
    const tmpl = PRESET_TEMPLATES[presetKey] || PRESET_TEMPLATES['custom'];
    setInfoTitle(tmpl.title);
    setInfoFields(tmpl.fields.map(f => ({ ...f })));
    setInfoNotes('');
    setEditingInfoId(null);
    setShowAddInfoModal(true);
  };

  const handlePresetChange = (presetKey: string) => {
    setSelectedPreset(presetKey);
    const tmpl = PRESET_TEMPLATES[presetKey] || PRESET_TEMPLATES['custom'];
    setInfoTitle(tmpl.title);
    setInfoFields(tmpl.fields.map(f => ({ ...f })));
  };

  const handleAddInfoField = () => {
    setInfoFields(prev => [...prev, { label: '', value: '', isSecret: false }]);
  };

  const handleRemoveInfoField = (index: number) => {
    setInfoFields(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveInfoRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!infoTitle.trim()) return;

    const cleanedFields = infoFields.filter(f => f.label.trim() || f.value.trim());

    if (editingInfoId) {
      const updatedRecords = infoRecords.map(r => r.id === editingInfoId ? {
        ...r,
        title: infoTitle.trim(),
        fields: cleanedFields,
        notes: infoNotes.trim() || undefined,
        updatedAt: new Date().toISOString()
      } : r);
      await saveState(folders, files, updatedRecords);
      triggerToast('Information record updated!');
    } else {
      const newRecord: InformationRecord = {
        id: `info-${Date.now()}`,
        title: infoTitle.trim(),
        folderId: currentFolderId,
        fields: cleanedFields,
        notes: infoNotes.trim() || undefined,
        createdAt: new Date().toISOString()
      };
      const updatedRecords = [...infoRecords, newRecord];
      await saveState(folders, files, updatedRecords);
      triggerToast('Information record created!');
    }

    setShowAddInfoModal(false);
    setEditingInfoId(null);
  };

  const handleEditInfoRecord = (record: InformationRecord) => {
    setEditingInfoId(record.id);
    setInfoTitle(record.title);
    setInfoFields(record.fields.map(f => ({ ...f })));
    setInfoNotes(record.notes || '');
    setShowAddInfoModal(true);
  };

  const handleDeleteInfoRecord = async (recordId: string) => {
    if (confirm('Are you sure you want to delete this information record?')) {
      const updatedRecords = infoRecords.filter(r => r.id !== recordId);
      await saveState(folders, files, updatedRecords);
      triggerToast('Record deleted');
    }
  };

  // Rename Folder or File
  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.name.trim()) return;

    if (editingItem.type === 'folder') {
      const updatedFolders = folders.map(f => f.id === editingItem.id ? { ...f, name: editingItem.name.trim() } : f);
      await saveState(updatedFolders, files, infoRecords);
    } else {
      const updatedFiles = files.map(f => f.id === editingItem.id ? { ...f, name: editingItem.name.trim() } : f);
      await saveState(folders, updatedFiles, infoRecords);
    }
    setEditingItem(null);
  };

  // Delete Folder or File
  const handleDelete = async (itemId: string, itemType: 'folder' | 'file') => {
    if (itemType === 'folder') {
      const getNestedIds = (folderId: string): { folderIds: string[]; fileIds: string[]; recordIds: string[] } => {
        let folderIds = [folderId];
        let fileIds = files.filter(f => f.folderId === folderId).map(f => f.id);
        let recordIds = infoRecords.filter(r => r.folderId === folderId).map(r => r.id);

        const subFolders = folders.filter(f => f.parentId === folderId);
        subFolders.forEach(sub => {
          const nested = getNestedIds(sub.id);
          folderIds = [...folderIds, ...nested.folderIds];
          fileIds = [...fileIds, ...nested.fileIds];
          recordIds = [...recordIds, ...nested.recordIds];
        });

        return { folderIds, fileIds, recordIds };
      };

      const { folderIds, fileIds, recordIds } = getNestedIds(itemId);

      const filesToDelete = files.filter(f => fileIds.includes(f.id));
      for (const file of filesToDelete) {
        if (file.fileUrl) {
          await deletePortalFile(file.fileUrl).catch(() => {});
        }
      }

      const updatedFolders = folders.filter(f => !folderIds.includes(f.id));
      const updatedFiles = files.filter(f => !fileIds.includes(f.id));
      const updatedRecords = infoRecords.filter(r => !recordIds.includes(r.id));

      await saveState(updatedFolders, updatedFiles, updatedRecords);
    } else {
      const fileToDelete = files.find(f => f.id === itemId);
      if (fileToDelete && fileToDelete.fileUrl) {
        await deletePortalFile(fileToDelete.fileUrl).catch(() => {});
      }
      const updatedFiles = files.filter(f => f.id !== itemId);
      await saveState(folders, updatedFiles, infoRecords);
    }
  };

  // Move Folder or File
  const handleMoveItem = async (destinationParentId: string | null) => {
    if (!movingItem) return;

    if (movingItem.type === 'folder') {
      if (destinationParentId === movingItem.id) return;
      const isSubfolder = (parent: string | null, target: string): boolean => {
        if (!parent) return false;
        if (parent === target) return true;
        const parentFolder = folders.find(f => f.id === parent);
        return parentFolder ? isSubfolder(parentFolder.parentId, target) : false;
      };
      if (isSubfolder(destinationParentId, movingItem.id)) return;

      const updatedFolders = folders.map(f => f.id === movingItem.id ? { ...f, parentId: destinationParentId } : f);
      await saveState(updatedFolders, files, infoRecords);
    } else {
      const updatedFiles = files.map(f => f.id === movingItem.id ? { ...f, folderId: destinationParentId } : f);
      await saveState(folders, updatedFiles, infoRecords);
    }

    setMovingItem(null);
  };

  const getFileIcon = (fileName: string, type: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const t = type.toLowerCase();
    if (t.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')) {
      return <Image size={18} className="text-rose-500" />;
    }
    if (t.includes('pdf') || ext === 'pdf') {
      return <FileText size={18} className="text-red-500" />;
    }
    if (t.includes('sheet') || t.includes('csv') || ['xls', 'xlsx', 'csv'].includes(ext || '')) {
      return <FileSpreadsheet size={18} className="text-emerald-500" />;
    }
    if (t.includes('zip') || t.includes('archive') || ['zip', 'rar', '7z', 'tar'].includes(ext || '')) {
      return <FileArchive size={18} className="text-indigo-500" />;
    }
    return <File size={18} className="text-[var(--crm-text-secondary)] " />;
  };

  const availableMoveDestinations = useMemo(() => {
    if (!movingItem) return [];
    const isSub = (folderId: string, testParentId: string): boolean => {
      const f = folders.find(x => x.id === folderId);
      if (!f) return false;
      if (f.parentId === testParentId) return true;
      return f.parentId ? isSub(f.parentId, testParentId) : false;
    };
    return folders.filter(f => {
      if (movingItem.type === 'folder') {
        if (f.id === movingItem.id) return false;
        if (isSub(f.id, movingItem.id)) return false;
      }
      return true;
    });
  }, [folders, movingItem]);

  return (
    <div className="space-y-6">
      {/* Search & Actions Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--crm-text-muted)] " />
          <input
            type="text"
            placeholder="Search folders, files, and credentials..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all text-[var(--crm-text)] text-[var(--crm-text)]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto shrink-0">
          {!isReadOnly && (
            <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)]">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-transparent text-[var(--crm-text)]  text-xs outline-none px-2 cursor-pointer"
              >
                <option value="name">Sort by Name</option>
                <option value="date">Sort by Date</option>
                <option value="type">Sort by Type</option>
              </select>
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="p-1 rounded-md hover:bg-[var(--crm-card)] hover:dark:bg-[var(--crm-card)] text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)] transition-all cursor-pointer"
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                <ArrowUpDown size={13} />
              </button>
            </div>
          )}

          {/* Grid/List Toggle */}
          <div className="p-1 bg-slate-100/80 rounded-xl border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] flex items-center shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-[var(--crm-card)] dark:bg-[var(--crm-card)] text-slate-950 shadow-xs' : 'text-[var(--crm-text-muted)] hover:text-[var(--crm-text-secondary)]'}`}
              title="Grid View"
            >
              <LayoutGrid size={13} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'list' ? 'bg-[var(--crm-card)] dark:bg-[var(--crm-card)] text-slate-950 shadow-xs' : 'text-[var(--crm-text-muted)] hover:text-[var(--crm-text-secondary)]'}`}
              title="List View"
            >
              <List size={13} />
            </button>
          </div>

          {/* Context Actions (Admin or Client Upload) */}
          {canManageFolders ? (
            <div className="flex items-center gap-2">
              {currentFolderId === null ? (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-medium rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Plus size={14} />
                  <span>New Folder</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleOpenInfoModal('custom')}
                    className="px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Add Information</span>
                  </button>
                  {canUpload && (
                    <label className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-medium rounded-xl flex items-center gap-1.5 shadow-xs transition-all whitespace-nowrap cursor-pointer">
                      <UploadCloud size={14} />
                      <span>Upload File</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                    </label>
                  )}
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-3 py-1.5 bg-[var(--crm-sidebar)] hover:bg-[var(--crm-card-border)] text-[var(--crm-text)] text-[var(--crm-text)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)]/80 text-xs font-medium rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>New Subfolder</span>
                  </button>
                </>
              )}
            </div>
          ) : (
            canUpload && (
              <label className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-medium rounded-xl flex items-center gap-1.5 shadow-xs transition-all whitespace-nowrap cursor-pointer">
                <UploadCloud size={14} />
                <span>Upload File</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            )
          )}
        </div>
      </div>

      {/* Breadcrumbs Navigation */}
      <div className="flex items-center flex-wrap gap-1.5 text-xs font-medium text-[var(--crm-text-secondary)] bg-slate-100/50 px-4 py-2.5 rounded-2xl border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)]/60 shadow-2xs">
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={crumb.id || 'root'}>
            {idx > 0 && <ChevronRight size={12} className="text-[var(--crm-text-muted)] shrink-0" />}
            <button
              onClick={() => {
                setCurrentFolderId(crumb.id);
                setSearchQuery('');
              }}
              className={`hover:text-[var(--crm-text)] cursor-pointer shrink-0 transition-colors ${
                crumb.id === currentFolderId ? 'text-slate-950 font-semibold' : ''
              }`}
            >
              {crumb.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Uploading Status Indicator */}
      {isUploading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 rounded-2xl flex items-center gap-4 shadow-2xs"
        >
          <div className="h-2 w-2 rounded-full bg-emerald-50 dark:bg-emerald-500/10 animate-ping shrink-0" />
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between text-xs font-medium text-[var(--crm-text)] text-[var(--crm-text)]">
              <span>Uploading document securely to cloud workspace...</span>
              <span className="font-mono text-emerald-700">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-[var(--crm-card-border)] h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Canvas Area */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative min-h-[340px] transition-all rounded-3xl ${
          dragActive ? 'bg-emerald-50/40 dark:bg-emerald-500/10 border-2 border-dashed border-emerald-400' : ''
        }`}
      >
        {dragActive && (
          <div className="absolute inset-0 z-40 bg-emerald-50/70 dark:bg-emerald-500/10 backdrop-blur-3xs rounded-3xl flex flex-col items-center justify-center pointer-events-none text-center p-6 space-y-2">
            <UploadCloud size={44} className="text-emerald-600 animate-bounce" />
            <h4 className="text-sm font-medium text-[var(--crm-text)] text-[var(--crm-text)]">Drop your file to upload inside this folder</h4>
            <p className="text-xs text-[var(--crm-text-muted)] ">Directly syncs with client portals instantly.</p>
          </div>
        )}

        {/* Root Empty State (No folders created at all yet) */}
        {folders.length === 0 && files.length === 0 && infoRecords.length === 0 ? (
          <div className="p-16 border border-dashed border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] bg-[var(--crm-sidebar)]/4 rounded-3xl text-center space-y-6">
            <div className="h-16 w-16 bg-[var(--crm-sidebar)] rounded-2xl flex items-center justify-center mx-auto text-[var(--crm-text-muted)] shadow-inner">
              <FolderOpen size={32} />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h5 className="font-semibold text-[var(--crm-text)] text-base">
                No folders yet
              </h5>
              <p className="text-xs text-[var(--crm-subtitle)] leading-relaxed">
                {userRole === 'client' 
                  ? 'No shared folders or files are available in this portal yet.' 
                  : 'Create your first folder to organize this client portal.'}
              </p>
            </div>
            {canManageFolders && (
              <div className="flex justify-center">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-medium rounded-2xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Plus size={16} />
                  <span>+ New Folder</span>
                </button>
              </div>
            )}
          </div>
        ) : sortedFolders.length === 0 && sortedFiles.length === 0 && filteredInfoRecords.length === 0 ? (
          /* Empty Folder State */
          <div className="p-14 border border-dashed border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] bg-[var(--crm-sidebar)]/3 /30 rounded-3xl text-center space-y-5">
            <div className="h-14 w-14 bg-[var(--crm-sidebar)] rounded-2xl flex items-center justify-center mx-auto text-[var(--crm-text-muted)] ">
              <FolderOpen size={28} />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h5 className="font-medium text-[var(--crm-text)] text-sm">This folder is currently empty</h5>
              <p className="text-xs text-[var(--crm-text-muted)] ">
                {canManageFolders 
                  ? 'Add structured information records, upload client files, or create subfolders using the toolbar above.'
                  : 'No files or documents have been added to this folder.'}
              </p>
            </div>
            {canManageFolders && (
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                <button
                  onClick={() => handleOpenInfoModal('custom')}
                  className="px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 text-indigo-700 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Information</span>
                </button>
                {canUpload && (
                  <label className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-medium rounded-xl flex items-center gap-1.5 transition-all cursor-pointer">
                    <UploadCloud size={14} />
                    <span>Upload File</span>
                    <input type="file" className="hidden" onChange={handleFileSelect} />
                  </label>
                )}
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-[var(--crm-sidebar)] hover:bg-[var(--crm-card-border)] text-[var(--crm-text)] text-xs  rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Plus size={14} />
                  <span>New Subfolder</span>
                </button>
              </div>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="space-y-8">
            {/* Information Records Section */}
            {filteredInfoRecords.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-semibold text-[var(--crm-text-secondary)]   flex items-center gap-1.5">
                  <Key size={12} className="text-indigo-500" />
                  <span>Information & Credentials ({filteredInfoRecords.length})</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 4k:grid-cols-7 5k:grid-cols-10 gap-4">
                  {filteredInfoRecords.map(record => (
                    <div
                      key={record.id}
                      className="p-4 bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)]/90 rounded-2xl shadow-2xs hover:shadow-xs transition-all space-y-3 relative group"
                    >
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-[var(--crm-card-border)] pb-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-medium shrink-0">
                            <Key size={16} />
                          </div>
                          <div>
                            <h5 className="font-medium text-xs text-[var(--crm-text)] block truncate max-w-[180px] 2xl:max-w-[300px] 3xl:max-w-[500px] 4k:max-w-none" title={record.title}>
                              {record.title}
                            </h5>
                            <span className="text-[9px] text-[var(--crm-text-muted)] block">
                              Created {new Date(record.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Admin Action Buttons */}
                        {canManageFolders && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEditInfoRecord(record)}
                              className="p-1 hover:bg-[var(--crm-sidebar-active-bg)] rounded text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)] cursor-pointer"
                              title="Edit Record"
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteInfoRecord(record.id)}
                              className="p-1 hover:bg-rose-50 dark:bg-rose-500/10 rounded text-[var(--crm-text-muted)] hover:text-rose-600 cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Record Fields */}
                      <div className="space-y-2 text-xs">
                        {record.fields.map((f, i) => {
                          const secretKey = `${record.id}-${i}`;
                          const isRevealed = visibleSecrets[secretKey];

                          return (
                            <div key={i} className="flex items-center justify-between gap-2 p-2 bg-[var(--crm-sidebar)] rounded-xl border border-slate-100 dark:border-[var(--crm-card-border)]">
                              <div className="min-w-0 flex-1">
                                <span className="text-[9px] font-medium text-[var(--crm-text-muted)] block truncate">
                                  {f.label || 'Value'}
                                </span>
                                <span className="font-mono font-medium text-[var(--crm-text)] text-[var(--crm-text)] text-xs truncate block">
                                  {f.isSecret && !isRevealed ? '••••••••' : f.value || '-'}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {f.isSecret && (
                                  <button
                                    onClick={() => toggleSecretVisibility(secretKey)}
                                    className="p-1 hover:bg-[var(--crm-card-border)] rounded text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] cursor-pointer"
                                    title={isRevealed ? 'Hide Secret' : 'Reveal Secret'}
                                  >
                                    {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                                  </button>
                                )}
                                {f.value && (
                                  <button
                                    onClick={() => handleCopy(f.value, f.label || 'Value')}
                                    className="p-1 hover:bg-[var(--crm-card-border)] rounded text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] text-[var(--crm-text)] cursor-pointer"
                                    title="Copy to clipboard"
                                  >
                                    {copiedKey === (f.label || 'Value') ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {record.notes && (
                        <div className="pt-2 border-t border-slate-100 dark:border-[var(--crm-card-border)] text-[11px] text-[var(--crm-text-secondary)] bg-amber-50/50 dark:bg-amber-500/10 p-2 rounded-xl border border-[var(--crm-card-border)]">
                          <span className="font-semibold text-amber-800 text-[9px]   block mb-0.5">Notes</span>
                          <p className="leading-snug text-[var(--crm-text)] ">{record.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Folders Section */}
            {sortedFolders.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-semibold text-[var(--crm-text-secondary)]  ">Folders ({sortedFolders.length})</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-8 4k:grid-cols-12 5k:grid-cols-16 gap-3">
                  {sortedFolders.map(folder => (
                    <div
                      key={folder.id}
                      onClick={() => {
                        setCurrentFolderId(folder.id);
                        setSearchQuery('');
                      }}
                      className="p-3.5 bg-[var(--crm-card)] dark:bg-[var(--crm-card)] hover:bg-slate-50 dark:hover:bg-[var(--crm-sidebar)]/30 border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)]/80 rounded-2xl text-left transition-all duration-150 shadow-2xs hover:shadow-xs group flex flex-col justify-between h-28 relative overflow-hidden cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div
                          className="h-10 w-10 rounded-xl bg-amber-50/80 dark:bg-amber-500/10 border border-amber-200/60 flex items-center justify-center text-amber-600 group-hover:scale-105 group-hover:bg-amber-100 dark:group-hover:bg-amber-500/20 transition-all shrink-0"
                        >
                          <Folder size={20} className="fill-amber-500/20" />
                        </div>

                        {canManageFolders && (
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setMovingItem({ id: folder.id, type: 'folder', currentParentId: folder.parentId })}
                              className="p-1 hover:bg-[var(--crm-sidebar-active-bg)] rounded text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)] cursor-pointer"
                              title="Move Folder"
                            >
                              <Move size={11} />
                            </button>
                            <button
                              onClick={() => setEditingItem({ id: folder.id, name: folder.name, type: 'folder' })}
                              className="p-1 hover:bg-[var(--crm-sidebar-active-bg)] rounded text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)] cursor-pointer"
                              title="Rename"
                            >
                              <Edit size={11} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete "${folder.name}" and ALL its nested contents?`)) {
                                  handleDelete(folder.id, 'folder');
                                }
                              }}
                              className="p-1 hover:bg-rose-50 dark:bg-rose-500/10 rounded text-[var(--crm-text-muted)] hover:text-rose-600 cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="pt-2">
                        <span
                          className="font-semibold text-[var(--crm-text)] text-xs block truncate leading-snug"
                          title={folder.name}
                        >
                          {folder.name}
                        </span>
                        <span className="text-[9px] font-medium text-[var(--crm-text-muted)] block mt-0.5">
                          {files.filter(f => f.folderId === folder.id).length} files • {infoRecords.filter(r => r.folderId === folder.id).length} records
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Files Section */}
            {sortedFiles.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[10px] font-semibold text-[var(--crm-text-secondary)]  ">Files ({sortedFiles.length})</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 4k:grid-cols-8 5k:grid-cols-12 gap-3">
                  {sortedFiles.map(file => {
                    const isImage = file.fileType.toLowerCase().includes('image') || file.name.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i);
                    return (
                      <div
                        key={file.id}
                        className="p-3 bg-[var(--crm-card)] dark:bg-[var(--crm-card)] hover:bg-[var(--crm-sidebar)]/5 hover:bg-[var(--crm-sidebar-active-bg)]/50 bg-[var(--crm-sidebar)]/50 border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] hover:border-slate-300 dark:border-[var(--crm-card-border)] rounded-2xl shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between h-40 group relative"
                      >
                        <div className="flex items-start justify-between gap-2">
                          {isImage ? (
                            <div className="h-14 w-full bg-[var(--crm-sidebar)] rounded-lg overflow-hidden border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)]/50 relative">
                              <img
                                src={file.fileUrl}
                                alt={file.name}
                                referrerPolicy="no-referrer"
                                className="h-full w-full object-cover group-hover:scale-102 transition-transform duration-200"
                              />
                            </div>
                          ) : (
                            <div className="h-9 w-9 rounded-lg bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)]/60 flex items-center justify-center shrink-0">
                              {getFileIcon(file.name, file.fileType)}
                            </div>
                          )}

                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 bg-[var(--crm-card)] dark:bg-[var(--crm-card)]/90 p-1 rounded-lg shadow-sm border border-slate-100 dark:border-[var(--crm-card-border)]">
                            {canManageFolders && (
                              <>
                                <button
                                  onClick={() => setMovingItem({ id: file.id, type: 'file', currentParentId: file.folderId || null })}
                                  className="p-1 hover:bg-[var(--crm-sidebar-active-bg)] rounded text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)] cursor-pointer"
                                  title="Move File"
                                >
                                  <Move size={11} />
                                </button>
                                <button
                                  onClick={() => setEditingItem({ id: file.id, name: file.name, type: 'file' })}
                                  className="p-1 hover:bg-[var(--crm-sidebar-active-bg)] rounded text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)] cursor-pointer"
                                  title="Rename"
                                >
                                  <Edit size={11} />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to permanently delete "${file.name}"?`)) {
                                      handleDelete(file.id, 'file');
                                    }
                                  }}
                                  className="p-1 hover:bg-rose-50 dark:bg-rose-500/10 rounded text-[var(--crm-text-muted)] hover:text-rose-600 cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="space-y-0.5 mt-2">
                          <span
                            onClick={() => setSelectedPreviewFile(file)}
                            className="font-medium text-[var(--crm-text)] text-xs block truncate leading-tight cursor-pointer hover:text-[var(--crm-text)]"
                            title={file.name}
                          >
                            {file.name}
                          </span>
                          <span className="text-[9px] text-[var(--crm-text-muted)] block ">
                            {file.size} • Uploaded {file.uploadedAt}
                          </span>
                        </div>

                        <div className="pt-2 flex items-center gap-1.5 border-t border-slate-100 dark:border-[var(--crm-card-border)] mt-2">
                          <button
                            onClick={() => setSelectedPreviewFile(file)}
                            className="flex-1 py-1 px-2.5 bg-[var(--crm-sidebar)] hover:bg-[var(--crm-sidebar-active-bg)] text-[var(--crm-text)] rounded-lg text-[9px]  transition-all cursor-pointer text-center"
                          >
                            Preview
                          </button>
                          <button
                            onClick={() => handleDownloadFile(file)}
                            className="p-1 px-2 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[9px] font-semibold flex items-center gap-1 cursor-pointer"
                            title="Download File"
                          >
                            <Download size={10} />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* LIST VIEW */
          <div className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)]/80 rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] bg-[var(--crm-sidebar)] text-[10px] font-semibold  text-[var(--crm-text-secondary)] ">
                  <th className="p-3 pl-4">Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Uploaded At</th>
                  <th className="p-3">Size</th>
                  <th className="p-3 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#30353D] text-[var(--crm-text)] ">
                {/* Information Records */}
                {filteredInfoRecords.map(record => (
                  <tr key={record.id} className="hover:bg-[var(--crm-sidebar)]/5 hover:bg-[var(--crm-sidebar-active-bg)]/50 bg-[var(--crm-sidebar)]/50 transition-colors group">
                    <td className="p-2.5 pl-4">
                      <div className="flex items-center gap-2">
                        <Key size={14} className="text-indigo-500 shrink-0" />
                        <span className="font-semibold text-[var(--crm-text)] truncate max-w-xs block">
                          {record.title}
                        </span>
                      </div>
                    </td>
                    <td className="p-2.5 text-indigo-600 font-medium">Credential Record</td>
                    <td className="p-2.5 text-[var(--crm-text-muted)] ">{new Date(record.createdAt).toLocaleDateString()}</td>
                    <td className="p-2.5">
                      <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 text-[9px] font-medium text-indigo-700">
                        {record.fields.length} fields
                      </span>
                    </td>
                    <td className="p-2.5 text-right pr-4">
                      {canManageFolders && (
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditInfoRecord(record)}
                            className="p-1 rounded text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar-active-bg)] hover:text-[var(--crm-text)] cursor-pointer"
                            title="Edit"
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteInfoRecord(record.id)}
                            className="p-1 rounded text-[var(--crm-text-muted)] hover:bg-rose-50 dark:bg-rose-500/10 hover:text-rose-600 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}

                {/* Folders */}
                {sortedFolders.map(folder => (
                  <tr 
                    key={folder.id} 
                    onClick={() => {
                      setCurrentFolderId(folder.id);
                      setSearchQuery('');
                    }}
                    className="hover:bg-slate-50 dark:hover:bg-[var(--crm-sidebar)]/30 bg-[var(--crm-sidebar)]/30 transition-colors group cursor-pointer"
                  >
                    <td className="p-2.5 pl-4">
                      <div className="flex items-center gap-2">
                        <Folder size={14} className="text-[var(--crm-text-muted)] shrink-0" />
                        <span className="font-semibold text-[var(--crm-text)] truncate max-w-xs block">
                          {folder.name}
                        </span>
                      </div>
                    </td>
                    <td className="p-2.5 text-[var(--crm-text-muted)] ">Folder</td>
                    <td className="p-2.5 text-[var(--crm-text-muted)] ">-</td>
                    <td className="p-2.5">
                      <span className="px-1.5 py-0.5 rounded bg-[var(--crm-sidebar)] border border-slate-100 dark:border-[var(--crm-card-border)] text-[9px] font-medium text-[var(--crm-text-secondary)] ">
                        {files.filter(f => f.folderId === folder.id).length} files
                      </span>
                    </td>
                    <td className="p-2.5 text-right pr-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setCurrentFolderId(folder.id);
                            setSearchQuery('');
                          }}
                          className="p-1 rounded text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar-active-bg)] hover:text-[var(--crm-text)] cursor-pointer"
                          title="Open Folder"
                        >
                          <ChevronRight size={13} />
                        </button>
                        {canManageFolders && (
                          <>
                            <button
                              onClick={() => setMovingItem({ id: folder.id, type: 'folder', currentParentId: folder.parentId })}
                              className="p-1 rounded text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar-active-bg)] hover:text-[var(--crm-text)] cursor-pointer"
                              title="Move Folder"
                            >
                              <Move size={13} />
                            </button>
                            <button
                              onClick={() => setEditingItem({ id: folder.id, name: folder.name, type: 'folder' })}
                              className="p-1 rounded text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar-active-bg)] hover:text-[var(--crm-text)] cursor-pointer"
                              title="Rename"
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete "${folder.name}"?`)) {
                                  handleDelete(folder.id, 'folder');
                                }
                              }}
                              className="p-1 rounded text-[var(--crm-text-muted)] hover:bg-rose-50 dark:bg-rose-500/10 hover:text-rose-600 cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Files */}
                {sortedFiles.map(file => (
                  <tr key={file.id} className="hover:bg-[var(--crm-sidebar)]/5 hover:bg-[var(--crm-sidebar-active-bg)]/50 bg-[var(--crm-sidebar)]/50 transition-colors group">
                    <td className="p-2.5 pl-4">
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.name, file.fileType)}
                        <span
                          onClick={() => setSelectedPreviewFile(file)}
                          className="font-medium text-[var(--crm-text)] text-[var(--crm-text)] cursor-pointer hover:text-slate-950 truncate max-w-xs block"
                        >
                          {file.name}
                        </span>
                      </div>
                    </td>
                    <td className="p-2.5 text-[var(--crm-text-secondary)] capitalize truncate max-w-[120px] 2xl:max-w-[240px] 3xl:max-w-[400px] 4k:max-w-none">
                      {file.fileType.split('/').pop() || 'document'}
                    </td>
                    <td className="p-2.5 text-[var(--crm-text-muted)] ">{file.uploadedAt}</td>
                    <td className="p-2.5">
                      <span className="px-1.5 py-0.5 rounded bg-[var(--crm-sidebar)] border border-slate-100 dark:border-[var(--crm-card-border)] text-[10px] font-medium text-[var(--crm-text-secondary)] ">
                        {file.size}
                      </span>
                    </td>
                    <td className="p-2.5 text-right pr-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedPreviewFile(file)}
                          className="p-1 rounded text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar-active-bg)] hover:text-[var(--crm-text)] cursor-pointer"
                          title="Preview"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() => handleDownloadFile(file)}
                          className="p-1 rounded text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-500/10 cursor-pointer"
                          title="Download"
                        >
                          <Download size={13} />
                        </button>
                        {canManageFolders && (
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setMovingItem({ id: file.id, type: 'file', currentParentId: file.folderId || null })}
                              className="p-1 rounded text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar-active-bg)] hover:text-[var(--crm-text)] cursor-pointer"
                              title="Move File"
                            >
                              <Move size={13} />
                            </button>
                            <button
                              onClick={() => setEditingItem({ id: file.id, name: file.name, type: 'file' })}
                              className="p-1 rounded text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar-active-bg)] hover:text-[var(--crm-text)] cursor-pointer"
                              title="Rename"
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
                                  handleDelete(file.id, 'file');
                                }
                              }}
                              className="p-1 rounded text-[var(--crm-text-muted)] hover:bg-rose-50 dark:bg-rose-500/10 hover:text-rose-600 cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / NEW FOLDER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] rounded-3xl border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] max-w-sm w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[var(--crm-card-border)]">
              <h3 className="font-medium text-sm text-[var(--crm-text)] font-structure">
                {currentFolderId ? 'Create New Subfolder' : 'Create New Folder'}
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[var(--crm-text)] mb-1.5">Folder Name</label>
                <input
                  type="text"
                  placeholder="e.g. Website Logins"
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  className="w-full p-2.5 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-xl font-medium text-[var(--crm-text)] focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-medium text-[var(--crm-text)] mb-1.5">Description (optional)</label>
                <textarea
                  placeholder="Short description of folder contents..."
                  value={newFolderDescription}
                  onChange={e => setNewFolderDescription(e.target.value)}
                  className="w-full p-2.5 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-xl font-medium text-[var(--crm-text)] focus:outline-none focus:ring-2 focus:ring-slate-900/10 h-20 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-[var(--crm-sidebar)] hover:bg-[var(--crm-card-border)] text-[var(--crm-text)]  cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold cursor-pointer shadow-sm"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* CREATE / EDIT INFORMATION RECORD MODAL */}
      {showAddInfoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] rounded-3xl border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] max-w-lg 2xl:max-w-xl 3xl:max-w-2xl 4k:max-w-3xl 5k:max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[var(--crm-card-border)] shrink-0">
              <div className="flex items-center gap-2">
                <Key size={18} className="text-indigo-600" />
                <h3 className="font-medium text-sm text-[var(--crm-text)] font-structure">
                  {editingInfoId ? 'Edit Information Record' : 'Add Information Record'}
                </h3>
              </div>
              <button onClick={() => setShowAddInfoModal(false)} className="text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveInfoRecord} className="space-y-4 text-xs overflow-y-auto pr-1 flex-1">
              {/* Preset Selector */}
              {!editingInfoId && (
                <div>
                  <label className="block font-medium text-[var(--crm-text)] mb-1.5">Record Template / Preset</label>
                  <select
                    value={selectedPreset}
                    onChange={e => handlePresetChange(e.target.value)}
                    className="w-full p-2.5 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-xl font-medium text-[var(--crm-text)] text-[var(--crm-text)] cursor-pointer"
                  >
                    <option value="custom">Custom Record</option>
                    <option value="domain">Domain Information</option>
                    <option value="hosting">Hosting Information</option>
                    <option value="cpanel">cPanel Credentials</option>
                    <option value="website">Website Logins</option>
                    <option value="email">Email Credentials</option>
                    <option value="ftp">FTP / SFTP Credentials</option>
                    <option value="apikeys">API Key Details</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block font-medium text-[var(--crm-text)] mb-1.5">Record Title</label>
                <input
                  type="text"
                  placeholder="e.g. Main Website Logins"
                  value={infoTitle}
                  onChange={e => setInfoTitle(e.target.value)}
                  className="w-full p-2.5 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-xl font-medium text-[var(--crm-text)]"
                  required
                />
              </div>

              {/* Dynamic Key-Value Fields */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block font-medium text-[var(--crm-text)]">Fields & Credentials</label>
                  <button
                    type="button"
                    onClick={handleAddInfoField}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>Add Field</span>
                  </button>
                </div>

                {infoFields.map((field, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-[var(--crm-sidebar)] p-2.5 rounded-xl border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)]/80">
                    <input
                      type="text"
                      placeholder="Label (e.g. Username)"
                      value={field.label}
                      onChange={e => {
                        const updated = [...infoFields];
                        updated[idx].label = e.target.value;
                        setInfoFields(updated);
                      }}
                      className="w-1/3 p-2 bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-lg text-xs font-medium text-[var(--crm-text)] text-[var(--crm-text)]"
                    />
                    <input
                      type={field.isSecret && !visibleSecrets[`edit-${idx}`] ? 'password' : 'text'}
                      placeholder="Value"
                      value={field.value}
                      onChange={e => {
                        const updated = [...infoFields];
                        updated[idx].value = e.target.value;
                        setInfoFields(updated);
                      }}
                      className="flex-1 p-2 bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-lg text-xs font-mono font-medium text-[var(--crm-text)]"
                    />
                    <label className="flex items-center gap-1 text-[10px] font-medium text-[var(--crm-text-secondary)] cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={field.isSecret || false}
                        onChange={e => {
                          const updated = [...infoFields];
                          updated[idx].isSecret = e.target.checked;
                          setInfoFields(updated);
                        }}
                        className="rounded border-slate-300 dark:border-[var(--crm-card-border)] text-indigo-600"
                      />
                      <span>Secret</span>
                    </label>
                    {infoFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveInfoField(idx)}
                        className="p-1.5 text-[var(--crm-text-muted)] hover:text-rose-600 cursor-pointer"
                        title="Remove Field"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-medium text-[var(--crm-text)] mb-1.5">Additional Notes (optional)</label>
                <textarea
                  placeholder="Special instructions, server details, or access notes..."
                  value={infoNotes}
                  onChange={e => setInfoNotes(e.target.value)}
                  className="w-full p-2.5 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-xl font-medium text-[var(--crm-text)] text-[var(--crm-text)] h-20 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddInfoModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-[var(--crm-sidebar)] hover:bg-[var(--crm-card-border)] text-[var(--crm-text)]  cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer shadow-sm"
                >
                  Save Record
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* RENAME ITEM MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] rounded-3xl border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] max-w-sm w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[var(--crm-card-border)]">
              <h3 className="font-medium text-sm text-[var(--crm-text)] font-structure">Rename Item</h3>
              <button onClick={() => setEditingItem(null)} className="text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRename} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-[var(--crm-text)] mb-1.5">New Name</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full p-2.5 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-xl font-medium text-[var(--crm-text)]"
                  required
                  autoFocus
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl bg-[var(--crm-sidebar)] hover:bg-[var(--crm-card-border)] text-[var(--crm-text)]  cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-medium cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MOVE ITEM DIALOG */}
      {movingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] rounded-3xl border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[var(--crm-card-border)]">
              <div className="flex items-center gap-2">
                <ArrowLeftRight size={16} className="text-[var(--crm-text-secondary)] " />
                <h3 className="font-medium text-sm text-[var(--crm-text)] font-structure">Move to Different Folder</h3>
              </div>
              <button onClick={() => setMovingItem(null)} className="text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-[var(--crm-subtitle)] ">
                Choose the destination folder to move this {movingItem.type}:
              </p>

              <div className="border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] rounded-2xl max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-[#30353D]">
                <button
                  onClick={() => handleMoveItem(null)}
                  className={`w-full text-left p-3 flex items-center justify-between hover:bg-[var(--crm-sidebar)] ${
                    movingItem.currentParentId === null ? 'bg-[var(--crm-sidebar)]/7 /70 font-medium' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Folder size={14} className="text-[var(--crm-text-muted)] " />
                    <span>Root Workspace</span>
                  </div>
                  {movingItem.currentParentId === null && (
                    <span className="text-[10px] text-[var(--crm-text-muted)] ">Current</span>
                  )}
                </button>

                {availableMoveDestinations.map(folder => (
                  <button
                    key={folder.id}
                    onClick={() => handleMoveItem(folder.id)}
                    className={`w-full text-left p-3 flex items-center justify-between hover:bg-[var(--crm-sidebar)] ${
                      movingItem.currentParentId === folder.id ? 'bg-[var(--crm-sidebar)]/7 /70 font-medium' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Folder size={14} className="text-[var(--crm-text-muted)] " />
                      <span>{folder.name}</span>
                    </div>
                    {movingItem.currentParentId === folder.id && (
                      <span className="text-[10px] text-[var(--crm-text-muted)] ">Current</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setMovingItem(null)}
                  className="px-4 py-2 rounded-xl bg-[var(--crm-sidebar)] hover:bg-[var(--crm-card-border)] text-[var(--crm-text)]  cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* FILE PREVIEW MODAL */}
      {selectedPreviewFile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--crm-card)] dark:bg-[var(--crm-card)] rounded-3xl border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] max-w-2xl 3xl:max-w-4xl 4k:max-w-5xl 5k:max-w-7xl w-full overflow-hidden shadow-2xl flex flex-col"
          >
            <div className="bg-[var(--crm-sidebar)] p-4 border-b border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-[var(--crm-text-secondary)] " />
                <span className="font-semibold text-[var(--crm-text)] text-xs truncate max-w-xs block">
                  {selectedPreviewFile.name}
                </span>
              </div>
              <button
                onClick={() => setSelectedPreviewFile(null)}
                className="text-[var(--crm-text-muted)] hover:text-[var(--crm-text-secondary)] text-xs  p-1 cursor-pointer"
              >
                Close (Esc)
              </button>
            </div>

            <div className="p-6 bg-[var(--crm-sidebar)] flex-1 flex items-center justify-center min-h-[250px] max-h-[450px] overflow-auto">
              {selectedPreviewFile.fileType.toLowerCase().includes('image') || selectedPreviewFile.name.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i) ? (
                <img
                  src={selectedPreviewFile.fileUrl}
                  alt={selectedPreviewFile.name}
                  referrerPolicy="no-referrer"
                  className="max-h-full max-w-full rounded-xl object-contain border border-[var(--crm-card-border)] dark:border-[var(--crm-card-border)]/50 shadow-sm"
                />
              ) : (
                <div className="text-center space-y-3">
                  <FileText size={48} className="text-[var(--crm-text-muted)] mx-auto animate-pulse" />
                  <div className="text-xs font-medium text-[var(--crm-text-secondary)]">No layout visual preview available</div>
                  <p className="text-[11px] text-[var(--crm-text-muted)] max-w-xs">
                    Since this is a document file, you can download it using the button below.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-[var(--crm-card)] dark:bg-[var(--crm-card)] border-t border-slate-100 dark:border-[var(--crm-card-border)] flex items-center justify-between text-xs font-medium">
              <div className="text-[var(--crm-text-muted)] ">
                Size: <span className="text-[var(--crm-text)] text-[var(--crm-text)] font-semibold">{selectedPreviewFile.size}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedPreviewFile(null)}
                  className="px-4 py-2 bg-[var(--crm-sidebar)] hover:bg-[var(--crm-card-border)] text-[var(--crm-text)] rounded-xl transition-all cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => handleDownloadFile(selectedPreviewFile)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download size={12} />
                  <span>Download File</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Real-time File Transfer Progress Widget */}
      <PortalFileTransferWidget
        transfers={transfers}
        onCancel={handleCancelTransfer}
        onRetry={(id) => {
          const item = transfers.find(t => t.id === id);
          if (item?.onRetry) item.onRetry();
        }}
        onDismiss={handleDismissTransfer}
        onClearCompleted={handleClearCompletedTransfers}
      />
    </div>
  );
}
