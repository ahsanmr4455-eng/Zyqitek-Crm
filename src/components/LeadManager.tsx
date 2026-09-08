import React, { useState, useRef, useMemo, useDeferredValue } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lead, Client, EmailDiscussion, CallDiscussion, TeamMember, ConversationDiscussion } from '../types';
import { exportToCSV } from '../utils';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  X, 
  ChevronDown, 
  Upload, 
  Sliders,
  Instagram,
  Facebook,
  Mail,
  Building2,
  Phone,
  Globe,
  ExternalLink,
  Eye,
  Check,
  Columns,
  ChevronRight,
  ChevronLeft,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Lock,
  Download,
  UserCheck,
  AlertCircle,
  CheckSquare,
  Square,
  RefreshCw,
  Sparkles,
  MapPin,
  Maximize2,
  Minimize2,
  Calendar,
  UploadCloud,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Users
} from 'lucide-react';
import CrmProfileView from './CrmProfileView';

const WhatsAppIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984 0 1.764.459 3.487 1.333 5.006L2 22l5.127-1.336A9.927 9.927 0 0 0 12.006 22c5.507 0 9.991-4.478 9.991-9.986 0-5.507-4.484-9.986-9.985-9.986zm5.82 14.161c-.246.689-1.229 1.261-2.007 1.428-.532.115-1.227.208-3.568-.762-2.993-1.242-4.919-4.281-5.068-4.48-.148-.198-1.215-1.618-1.215-3.086 0-1.468.769-2.19 1.042-2.488.272-.298.595-.373.793-.373.198 0 .396.002.57.01.185.008.434-.07.68.521.247.595.842 2.054.917 2.203.074.148.124.322.025.521-.099.198-.149.322-.297.496-.148.173-.312.387-.446.521-.148.148-.303.31-.13.606.173.297.77 1.272 1.652 2.058 1.134 1.011 2.091 1.325 2.388 1.473.298.148.471.124.645-.074.173-.198.743-.867.941-1.164.198-.298.396-.248.669-.148.272.099 1.734.818 2.031.966.298.148.496.223.57.347.074.124.074.715-.172 1.404z" />
  </svg>
);

interface LeadManagerProps {
  leads: Lead[];
  clients?: Client[];
  initialSelectedLeadId?: string | null;
  onClearInitialSelectedLeadId?: () => void;
  onAddLead: (lead: Omit<Lead, 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<boolean>;
  onBulkImportLeads?: (leads: any[]) => Promise<{ success: boolean; total: number; imported: number; failed: number; duplicates: number; error?: string }>;
  onUpdateLead: (lead: Lead) => void;
  onDeleteLead: (id: string) => Promise<boolean>;
  onDeleteMultipleLeads?: (ids: string[]) => void;
  triggerAddForm: boolean;
  setTriggerAddForm: (val: boolean) => void;
  emailDiscussions?: EmailDiscussion[];
  callDiscussions?: CallDiscussion[];
  conversationDiscussions?: ConversationDiscussion[];
  teamMembers?: TeamMember[];
  onAddDiscussionRecord?: (lead: Lead, type: 'Email' | 'Call' | 'Conversation') => void;
  onConvertLeadToClient?: (leadId: string | string[]) => Promise<boolean>;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

const SocialButtons = ({ email, instagram, facebook }: { email?: string; instagram?: string; facebook?: string }) => {
  const handleOpenLink = (url?: string) => {
    if (!url) return;
    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="flex items-center gap-1.5 justify-center md:justify-start">
      {/* Instagram Button */}
      {instagram && instagram.trim() ? (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleOpenLink(instagram); }}
          className="p-1.5 text-pink-600 hover:bg-pink-500/10 rounded-md transition-all cursor-pointer hover:scale-105 active:scale-95"
          title={`Open Instagram: ${instagram}`}
        >
          <Instagram size={15} />
        </button>
      ) : (
        <button
          type="button"
          disabled
          className="p-1.5 text-[var(--crm-text-muted)] rounded-md cursor-not-allowed opacity-40"
          title="Instagram Not Available"
        >
          <Instagram size={15} />
        </button>
      )}

      {/* Facebook Button */}
      {facebook && facebook.trim() ? (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleOpenLink(facebook); }}
          className="p-1.5 text-blue-600 hover:bg-blue-500/10 rounded-md transition-all cursor-pointer hover:scale-105 active:scale-95"
          title={`Open Facebook: ${facebook}`}
        >
          <Facebook size={15} />
        </button>
      ) : (
        <button
          type="button"
          disabled
          className="p-1.5 text-[var(--crm-text-muted)] rounded-md cursor-not-allowed opacity-40"
          title="Facebook Not Available"
        >
          <Facebook size={15} />
        </button>
      )}

      {/* Email Button */}
      {email && email.trim() ? (
        <a
          href={`mailto:${email.trim()}`}
          onClick={(e) => e.stopPropagation()}
          className="p-1.5 text-indigo-600 hover:bg-indigo-500/10 rounded-md transition-all cursor-pointer hover:scale-105 active:scale-95 inline-flex items-center"
          title={`Send Email to: ${email}`}
        >
          <Mail size={15} />
        </a>
      ) : (
        <button
          type="button"
          disabled
          className="p-1.5 text-[var(--crm-text-muted)] rounded-md cursor-not-allowed opacity-40"
          title="Email Not Available"
        >
          <Mail size={15} />
        </button>
      )}
    </div>
  );
};

const getInitials = (name: string) => {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
};

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

export default function LeadManager({ 
  leads, 
  clients = [],
  initialSelectedLeadId,
  onClearInitialSelectedLeadId,
  onAddLead, 
  onBulkImportLeads,
  onUpdateLead, 
  onDeleteLead, 
  onDeleteMultipleLeads,
  triggerAddForm, 
  setTriggerAddForm,
  emailDiscussions = [],
  callDiscussions = [],
  conversationDiscussions = [],
  teamMembers = [],
  onAddDiscussionRecord,
  onConvertLeadToClient,
  isFullScreen = false,
  onToggleFullScreen,
  showToast = () => {}
}: LeadManagerProps) {
  
  // State variables
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sourceFilter, setSourceFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [isImporting, setIsImporting] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);

  // Expandable Filter panel state and draft variables
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [assignedToFilter, setAssignedToFilter] = useState<string>('All');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('All');
  const [activityFilter, setActivityFilter] = useState<string>('All');

  const [draftStatusFilter, setDraftStatusFilter] = useState('All');
  const [draftSourceFilter, setDraftSourceFilter] = useState('All');
  const [draftCategoryFilter, setDraftCategoryFilter] = useState('All');
  const [draftPriorityFilter, setDraftPriorityFilter] = useState('All');
  const [draftAssignedToFilter, setDraftAssignedToFilter] = useState('All');
  const [draftDateRangeFilter, setDraftDateRangeFilter] = useState('All');
  const [draftActivityFilter, setDraftActivityFilter] = useState<string>('All');

  const handleToggleFilter = () => {
    if (!isFilterOpen) {
      setDraftStatusFilter(statusFilter);
      setDraftSourceFilter(sourceFilter);
      setDraftCategoryFilter(categoryFilter);
      setDraftPriorityFilter(priorityFilter);
      setDraftAssignedToFilter(assignedToFilter);
      setDraftDateRangeFilter(dateRangeFilter);
      setDraftActivityFilter(activityFilter);
    }
    setIsFilterOpen(!isFilterOpen);
  };

  const handleApplyFilters = () => {
    setStatusFilter(draftStatusFilter);
    setSourceFilter(draftSourceFilter);
    setCategoryFilter(draftCategoryFilter);
    setPriorityFilter(draftPriorityFilter);
    setAssignedToFilter(draftAssignedToFilter);
    setDateRangeFilter(draftDateRangeFilter);
    setActivityFilter(draftActivityFilter);
    setIsFilterOpen(false);
  };

  const handleClearFilters = () => {
    setStatusFilter('All');
    setSourceFilter('All');
    setCategoryFilter('All');
    setPriorityFilter('All');
    setAssignedToFilter('All');
    setDateRangeFilter('All');
    setActivityFilter('All');

    setDraftStatusFilter('All');
    setDraftSourceFilter('All');
    setDraftCategoryFilter('All');
    setDraftPriorityFilter('All');
    setDraftAssignedToFilter('All');
    setDraftDateRangeFilter('All');
    setDraftActivityFilter('All');

    setIsFilterOpen(false);
  };

  const activeFiltersCount =
    (statusFilter !== 'All' ? 1 : 0) +
    (sourceFilter !== 'All' ? 1 : 0) +
    (categoryFilter !== 'All' ? 1 : 0) +
    (priorityFilter !== 'All' ? 1 : 0) +
    (assignedToFilter !== 'All' ? 1 : 0) +
    (dateRangeFilter !== 'All' ? 1 : 0) +
    (activityFilter !== 'All' ? 1 : 0);

  // Spreadsheet-style custom state variables
  const [columnOrder, setColumnOrder] = useState<string[]>([
    'id',
    'name',
    'company',
    'value',
    'createdAt',
    'email',
    'phone',
    'source',
    'status',
    'actions'
  ]);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    id: 110,
    name: 180,
    company: 150,
    value: 120,
    createdAt: 125,
    email: 180,
    phone: 180,
    source: 130,
    status: 120,
    actions: 110
  });
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    id: true,
    name: true,
    company: true,
    value: true,
    createdAt: true,
    email: true,
    phone: true,
    source: true,
    status: true,
    actions: true
  });

  // Dynamic CSV Import Preview State
  const [csvPreviewData, setCsvPreviewData] = useState<{
    fileName: string;
    headers: string[];
    columnMapping: Record<string, string>;
    selectedHeaders: string[];
    parsedRows: Record<string, string>[];
    previewRows: Record<string, string>[];
    totalRows: number;
    leadsToImport: any[];
  } | null>(null);

  // Sorting state (A-Z, Z-A, Newest, Oldest etc.)
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Inline editing state
  const [editingCell, setEditingCell] = useState<{ leadId: string; field: string } | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);

  // Column drag and drop
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Bulk operation popups / states
  const [showBulkAssignDropdown, setShowBulkAssignDropdown] = useState(false);
  const [showBulkStatusDropdown, setShowBulkStatusDropdown] = useState(false);
  const [bulkAssignTarget, setBulkAssignTarget] = useState('');
  const [bulkStatusTarget, setBulkStatusTarget] = useState<Lead['status']>('New');
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [expandedLeads, setExpandedLeads] = useState<Record<string, boolean>>({});

  const toggleExpandLead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedLeads(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const [importSummary, setImportSummary] = useState<{
    total: number;
    imported: number;
    failed: number;
    duplicates: number;
    show: boolean;
    error?: string;
  } | null>(null);
  
  // File import ref and drag-and-drop states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [showDropZoneModal, setShowDropZoneModal] = useState(false);

  // Download sample CSV template helper
  const handleDownloadSampleCSV = () => {
    const sampleData = "Name,Email,Phone,Company,Value,Status,Category,Source,Notes\n" +
      "John Doe,john@example.com,+1 555-0192,Acme Corp,12000,New,Web Development,Website,Interested in full stack rework\n" +
      "Sarah Smith,sarah@innovate.co,+1 555-0148,Innovate LLC,8500,Contacted,SEO,LinkedIn,Met at tech summit\n" +
      "Michael Brown,mbrown@apex.io,+1 555-0173,Apex Digital,15000,Proposal,Mobile App,Referral,Proposal sent yesterday";
    
    const blob = new Blob([sampleData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'crm_leads_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Options for mapping CSV columns to Lead fields
  const LEAD_FIELD_MAPPING_OPTIONS: { key: string; label: string }[] = [
    { key: 'name', label: 'Lead / Contact Name' },
    { key: 'company', label: 'Company Name' },
    { key: 'email', label: 'Email Address' },
    { key: 'phone', label: 'Phone Number' },
    { key: 'value', label: 'Budget / Estimated Value' },
    { key: 'status', label: 'Lead Status' },
    { key: 'source', label: 'Lead Source' },
    { key: 'category', label: 'Service / Category' },
    { key: 'country', label: 'Location / Country' },
    { key: 'websiteUrl', label: 'Website URL' },
    { key: 'notes', label: 'Notes / Description' },
    { key: 'priority', label: 'Priority' },
    { key: 'role', label: 'Role' },
    { key: 'assignedTeamMember', label: 'Assigned Team Member' },
    { key: 'unmapped', label: 'Custom Field (Unmapped)' },
  ];

  // Auto-detect Lead Field key based on CSV header name
  const autoDetectLeadFieldKey = (headerName: string): string => {
    const norm = headerName.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (['name', 'fullname', 'contactname', 'clientname', 'leadname', 'prospect', 'contactperson', 'contact', 'reviewername', 'lead', 'person', 'client'].includes(norm)) return 'name';
    if (['company', 'companyname', 'business', 'organization', 'org', 'agency', 'businessname', 'store', 'shop', 'brand'].includes(norm)) return 'company';
    if (['email', 'emailaddress', 'contactemail', 'mail', 'emailid', 'e-mail'].includes(norm)) return 'email';
    if (['phone', 'phonenumber', 'telephone', 'mobile', 'cell', 'whatsapp', 'tel', 'contactphone', 'mobilephone'].includes(norm)) return 'phone';
    if (['value', 'budget', 'estimatedvalue', 'estvalue', 'dealvalue', 'price', 'amount', 'revenue', 'leadvalue', 'cost', 'val'].includes(norm)) return 'value';
    if (['status', 'stage', 'leadstatus', 'pipelinestage', 'pipelinestatus', 'phase'].includes(norm)) return 'status';
    if (['source', 'leadsource', 'channel', 'origin', 'platform', 'leadchannel'].includes(norm)) return 'source';
    if (['service', 'servicetype', 'primaryservice', 'category', 'industry', 'niche', 'services', 'type', 'nichetype'].includes(norm)) return 'category';
    if (['country', 'city', 'location', 'address', 'state', 'region', 'area'].includes(norm)) return 'country';
    if (['website', 'websiteurl', 'url', 'site', 'domain', 'link', 'web', 'page'].includes(norm)) return 'websiteUrl';
    if (['notes', 'description', 'comment', 'comments', 'detail', 'details', 'review', 'message', 'note', 'summary', 'remark', 'remarks'].includes(norm)) return 'notes';
    if (['priority', 'urgency'].includes(norm)) return 'priority';
    if (['role', 'jobtitle', 'title', 'position'].includes(norm)) return 'role';
    if (['assigned', 'assignedto', 'team', 'teammember', 'assignedmember', 'owner'].includes(norm)) return 'assignedTeamMember';

    if (norm.includes('email') || norm.includes('mail')) return 'email';
    if (norm.includes('phone') || norm.includes('mobile') || norm.includes('tel')) return 'phone';
    if (norm.includes('company') || norm.includes('org') || norm.includes('business')) return 'company';
    if (norm.includes('name') || norm.includes('person')) return 'name';
    if (norm.includes('budget') || norm.includes('value') || norm.includes('amount')) return 'value';
    if (norm.includes('website') || norm.includes('url') || norm.includes('site') || norm.includes('link')) return 'websiteUrl';
    if (norm.includes('service') || norm.includes('industry') || norm.includes('category')) return 'category';
    if (norm.includes('status') || norm.includes('stage')) return 'status';
    if (norm.includes('source') || norm.includes('channel')) return 'source';
    if (norm.includes('note') || norm.includes('comment') || norm.includes('detail') || norm.includes('description')) return 'notes';
    if (norm.includes('country') || norm.includes('city') || norm.includes('location') || norm.includes('address')) return 'country';

    return 'unmapped';
  };

  // Helper to build lead items dynamically from parsed CSV rows based on current column mapping
  const buildLeadItemsFromParsedRows = (
    parsedRows: Record<string, string>[],
    columnMapping: Record<string, string>,
    selectedHeaders: string[]
  ): any[] => {
    return parsedRows.map((row, idx) => {
      const itemData: Record<string, any> = { customFields: {} };

      selectedHeaders.forEach(header => {
        const cellVal = (row[header] || '').trim();
        if (!cellVal) return;

        const fieldKey = columnMapping[header] || 'unmapped';

        if (fieldKey === 'value') {
          const num = Number(cellVal.replace(/[^0-9.]/g, ''));
          if (!isNaN(num) && num > 0) itemData.value = num;
        } else if (fieldKey === 'status') {
          const normStatus = cellVal.charAt(0).toUpperCase() + cellVal.slice(1).toLowerCase();
          const validStatuses = ['New', 'Contacted', 'Follow Up', 'Qualified', 'Converted', 'Lost', 'Proposal', 'Closed'];
          const matched = validStatuses.find(s => s.toLowerCase() === normStatus.toLowerCase());
          itemData.status = matched || 'New';
        } else if (fieldKey === 'priority') {
          const normP = cellVal.charAt(0).toUpperCase() + cellVal.slice(1).toLowerCase();
          if (['High', 'Medium', 'Low'].includes(normP)) {
            itemData.priority = normP;
          }
        } else if (fieldKey !== 'unmapped') {
          itemData[fieldKey] = cellVal;
        } else {
          itemData.customFields[header] = cellVal;
        }
      });

      let leadName = itemData.name || '';
      if (!leadName) {
        if (itemData.company) {
          leadName = itemData.company;
        } else if (itemData.email) {
          leadName = itemData.email.split('@')[0];
        } else if (itemData.phone) {
          leadName = `Lead (${itemData.phone})`;
        } else {
          const firstVal = selectedHeaders.map(h => row[h]).find(v => v && !v.includes('@') && !/^[0-9+\-()\s]{7,}$/.test(v));
          leadName = firstVal || `Imported Lead ${idx + 1}`;
        }
      }

      return {
        name: leadName.trim(),
        email: itemData.email || '',
        phone: itemData.phone || '',
        company: itemData.company || '',
        value: typeof itemData.value === 'number' ? itemData.value : 5000,
        status: itemData.status || 'New',
        source: itemData.source || 'CSV Import',
        category: itemData.category || 'Other',
        country: itemData.country || '',
        websiteUrl: itemData.websiteUrl || '',
        notes: itemData.notes || 'Imported via CSV file.',
        priority: itemData.priority || 'Medium',
        role: itemData.role || '',
        assignedTeamMember: itemData.assignedTeamMember || '',
        customFields: itemData.customFields || {}
      };
    });
  };

  const handleUpdateColumnMapping = (header: string, newFieldKey: string) => {
    setCsvPreviewData(prev => {
      if (!prev) return null;
      const updatedMapping = { ...prev.columnMapping, [header]: newFieldKey };
      const updatedLeads = buildLeadItemsFromParsedRows(prev.parsedRows, updatedMapping, prev.selectedHeaders);
      return {
        ...prev,
        columnMapping: updatedMapping,
        leadsToImport: updatedLeads,
        totalRows: updatedLeads.length
      };
    });
  };

  const handleToggleHeaderSelection = (header: string) => {
    setCsvPreviewData(prev => {
      if (!prev) return null;
      const isSelected = prev.selectedHeaders.includes(header);
      const updatedSelected = isSelected
        ? prev.selectedHeaders.filter(h => h !== header)
        : [...prev.selectedHeaders, header];
      const updatedLeads = buildLeadItemsFromParsedRows(prev.parsedRows, prev.columnMapping, updatedSelected);
      return {
        ...prev,
        selectedHeaders: updatedSelected,
        leadsToImport: updatedLeads,
        totalRows: updatedLeads.length
      };
    });
  };

  // Centralized CSV File Processing Logic with Dynamic Header Detection & Preview
  const processCSVFile = (file: File) => {
    if (!file) return;

    setIsImporting(true);
    setShowDropZoneModal(false);
    setIsDraggingFile(false);

    console.log("=== CSV Import Process Started ===");
    console.log(`[CSV loaded] File: ${file.name}, Size: ${file.size} bytes`);

    const reader = new FileReader();
    reader.onerror = (evt) => {
      console.error("[CSV loaded] FileReader error:", evt);
      showToast("Failed to read selected CSV file.", "error");
      setImportSummary({
        total: 0,
        imported: 0,
        failed: 0,
        duplicates: 0,
        show: true,
        error: "FileReader could not read the selected file."
      });
      setIsImporting(false);
    };

    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        if (!text || text.trim().length === 0) {
          console.warn("[Rows parsed] File content is blank or empty.");
          showToast("The selected CSV file is empty.", "error");
          setImportSummary({
            total: 0,
            imported: 0,
            failed: 0,
            duplicates: 0,
            show: true,
            error: "The CSV file is empty or contains no readable text."
          });
          setIsImporting(false);
          return;
        }

        const parseCSV = (textVal: string): string[][] => {
          const result: string[][] = [];
          let r: string[] = [];
          let cell = '';
          let inQuotes = false;
          
          for (let i = 0; i < textVal.length; i++) {
            const char = textVal[i];
            const nextChar = textVal[i + 1];
            
            if (char === '"') {
              if (inQuotes && nextChar === '"') {
                cell += '"';
                i++; // skip next quote
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              r.push(cell.trim().replace(/^["']|["']$/g, ''));
              cell = '';
            } else if ((char === '\r' || char === '\n') && !inQuotes) {
              if (char === '\r' && nextChar === '\n') {
                i++;
              }
              r.push(cell.trim().replace(/^["']|["']$/g, ''));
              if (r.length > 0 && !r.every(v => !v)) {
                result.push(r);
              }
              r = [];
              cell = '';
            } else {
              cell += char;
            }
          }
          
          if (cell !== '' || r.length > 0) {
            r.push(cell.trim().replace(/^["']|["']$/g, ''));
            if (r.length > 0 && !r.every(v => !v)) {
              result.push(r);
            }
          }
          
          return result;
        };

        const parsedAll = parseCSV(text);
        console.log(`[Rows parsed] Parsed ${parsedAll.length} data rows from CSV file.`);

        if (parsedAll.length < 1) {
          console.warn("[Rows parsed] No rows present in CSV file.");
          showToast("No data rows found in CSV.", "error");
          setImportSummary({
            total: 0,
            imported: 0,
            failed: 0,
            duplicates: 0,
            show: true,
            error: "No valid rows found in CSV."
          });
          setIsImporting(false);
          return;
        }

        const rawFirstRow = parsedAll[0];
        // Extract headers exactly as named in the CSV, preserving casing and symbols
        const rawHeaders = rawFirstRow.map(h => h.trim()).filter(Boolean);
        
        // Auto-detect header presence or generate fallback column names
        const hasHeader = rawHeaders.length > 0;
        const headers = hasHeader ? rawHeaders : rawFirstRow.map((_, idx) => `Column ${idx + 1}`);
        const startIdx = hasHeader ? 1 : 0;

        const parsedRows: Record<string, string>[] = [];

        for (let i = startIdx; i < parsedAll.length; i++) {
          const values = parsedAll[i];
          if (values.length === 0 || values.every(v => !v)) {
            continue;
          }

          const rowData: Record<string, string> = {};
          headers.forEach((header, index) => {
            const val = values[index] !== undefined ? values[index].trim() : '';
            rowData[header] = val;
          });

          parsedRows.push(rowData);
        }

        // Auto-detect initial column mappings
        const initialMapping: Record<string, string> = {};
        headers.forEach(h => {
          initialMapping[h] = autoDetectLeadFieldKey(h);
        });

        const leadsToImport = buildLeadItemsFromParsedRows(parsedRows, initialMapping, headers);

        console.log(`[Valid rows] Formatted ${leadsToImport.length} valid lead candidates for preview.`);

        if (leadsToImport.length === 0) {
          console.error("[Valid rows] No valid lead rows could be extracted from CSV.");
          setImportSummary({
            total: parsedAll.length - startIdx,
            imported: 0,
            failed: parsedAll.length - startIdx,
            duplicates: 0,
            show: true,
            error: "No valid lead records could be parsed from the CSV file."
          });
          setIsImporting(false);
          return;
        }

        // Set preview data to display the CSV dynamic column preview & confirmation modal
        setCsvPreviewData({
          fileName: file.name,
          headers,
          columnMapping: initialMapping,
          selectedHeaders: [...headers],
          parsedRows,
          previewRows: parsedRows.slice(0, 5),
          totalRows: leadsToImport.length,
          leadsToImport
        });
        setIsImporting(false);

      } catch (err: any) {
        console.error("[CSV Import Exception]:", err);
        showToast(`CSV Import error: ${err?.message || "Invalid CSV format"}`, "error");
        setImportSummary({
          total: 0,
          imported: 0,
          failed: 0,
          duplicates: 0,
          show: true,
          error: err?.message || "Failed to process CSV file."
        });
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsText(file);
  };

  // Handle Dynamic CSV Import Confirmation
  const handleConfirmCSVImport = async () => {
    if (!csvPreviewData) return;
    const { selectedHeaders, leadsToImport } = csvPreviewData;
    const newDynamicColIds = selectedHeaders.map(h => `cf_${h}`);
    
    // Update active visible columns in LeadManager
    setColumnOrder(prev => {
      const existing = new Set(prev);
      const toAdd = newDynamicColIds.filter(id => !existing.has(id));
      const actionsIdx = prev.indexOf('actions');
      if (actionsIdx > -1) {
        const next = [...prev];
        next.splice(actionsIdx, 0, ...toAdd);
        return next;
      }
      return [...prev, ...toAdd];
    });
    
    setVisibleColumns(prev => {
      const next = { ...prev };
      newDynamicColIds.forEach(id => {
        if (next[id] === undefined) next[id] = true;
      });
      return next;
    });

    // Filter dynamic custom fields to only include those that are selected by the user
    const finalLeads = leadsToImport.map(lead => {
      const filteredCustomFields: Record<string, any> = {};
      selectedHeaders.forEach(h => {
        if (lead.customFields && lead.customFields[h] !== undefined) {
          filteredCustomFields[h] = lead.customFields[h];
        }
      });
      return {
        ...lead,
        customFields: filteredCustomFields
      };
    });

    try {
      setIsImporting(true);
      if (onBulkImportLeads) {
        const res = await onBulkImportLeads(finalLeads);
        setImportSummary({
          total: res.total || finalLeads.length,
          imported: res.imported,
          failed: res.failed || 0,
          duplicates: res.duplicates || 0,
          show: true,
          error: res.error
        });
      } else {
        let importedCount = 0;
        let failedCount = 0;
        for (const item of finalLeads) {
          const success = await onAddLead(item);
          if (success) {
            importedCount++;
          } else {
            failedCount++;
          }
        }
        setImportSummary({
          total: finalLeads.length,
          imported: importedCount,
          failed: failedCount,
          duplicates: 0,
          show: true
        });
      }
      showToast(`Imported ${finalLeads.length} records into CRM!`, "success");
    } catch (err: any) {
      console.error("[CSV Import Execution Error]:", err);
      showToast(`Import failed: ${err?.message || "Unknown error"}`, "error");
      setImportSummary({
        total: finalLeads.length,
        imported: 0,
        failed: finalLeads.length,
        duplicates: 0,
        show: true,
        error: err?.message || "Failed to save leads."
      });
    } finally {
      setIsImporting(false);
      setCsvPreviewData(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle CSV File Input Change
  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processCSVFile(file);
    }
    if (e.target) e.target.value = '';
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Drag and Drop Event Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer?.types?.includes('Files')) {
      setIsDraggingFile(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDraggingFile(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);

    const file = e.dataTransfer?.files?.[0];
    if (file) {
      processCSVFile(file);
    }
  };

  // Selected lead for detail/edit modal
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);

  // SMM Campaign State (Leads)
  const [smmPlatformName, setSmmPlatformName] = useState('');
  const [smmPlannedPosts, setSmmPlannedPosts] = useState<number>(12);
  const [smmPostingFrequency, setSmmPostingFrequency] = useState('');
  const [smmContentNotes, setSmmContentNotes] = useState('');
  const [smmCampaignRequirements, setSmmCampaignRequirements] = useState('');

  // Bulk selection and profile modal states
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [profileTab, setProfileTab] = useState<'overview' | 'contact' | 'history' | 'discussions'>('overview');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  React.useEffect(() => {
    if (initialSelectedLeadId) {
      const match = leads.find(l => l.id === initialSelectedLeadId);
      if (match) {
        setSelectedLead(match);
      }
      if (onClearInitialSelectedLeadId) {
        onClearInitialSelectedLeadId();
      }
    }
  }, [initialSelectedLeadId, leads, onClearInitialSelectedLeadId]);

  React.useEffect(() => {
    const isAnyModalOpen = isImporting || triggerAddForm || !!selectedLead || !!leadToDelete || showBulkDeleteConfirm || showDropZoneModal || !!(importSummary && importSummary.show);
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isImporting, triggerAddForm, selectedLead, leadToDelete, showBulkDeleteConfirm, showDropZoneModal, importSummary]);

  // Escape key listener to exit Selection Mode
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedLeadIds.length > 0) {
        setSelectedLeadIds([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLeadIds]);

  // Long press selection helper
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggeredForId = useRef<string | null>(null);
  const isTouchDevice = useRef(false);

  const startPress = (id: string) => {
    longPressTriggeredForId.current = null;
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    longPressTimer.current = setTimeout(() => {
      longPressTriggeredForId.current = id;
      handleToggleSelectLead(id);
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
    if (selectedLeadIds.length > 0) {
      handleToggleSelectLead(id);
    } else {
      normalClick();
    }
  };

  const getPressHandlers = (id: string, normalClick: () => void) => {
    return {
      onMouseDown: (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('a')) {
          return;
        }
        startPress(id);
      },
      onMouseUp: cancelPress,
      onMouseLeave: cancelPress,
      onTouchStart: (e: React.TouchEvent) => {
        isTouchDevice.current = true;
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('a')) {
          return;
        }
        startPress(id);
      },
      onTouchEnd: cancelPress,
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

  // Match related discussions dynamically
  const relatedEmails = useMemo(() => {
    if (!selectedLead) return [];
    return emailDiscussions.filter(disc => 
      (disc.clientName || '').toLowerCase() === (selectedLead.name || '').toLowerCase() ||
      (selectedLead.company && (disc.clientName || '').toLowerCase() === (selectedLead.company || '').toLowerCase())
    );
  }, [selectedLead, emailDiscussions]);

  const relatedCalls = useMemo(() => {
    if (!selectedLead) return [];
    return callDiscussions.filter(disc => 
      (disc.clientName || '').toLowerCase() === (selectedLead.name || '').toLowerCase() ||
      (selectedLead.company && (disc.clientName || '').toLowerCase() === (selectedLead.company || '').toLowerCase())
    );
  }, [selectedLead, callDiscussions]);

  const relatedConversations = useMemo(() => {
    if (!selectedLead) return [];
    return conversationDiscussions.filter(disc => 
      (disc.leadName || '').toLowerCase() === (selectedLead.name || '').toLowerCase() ||
      (selectedLead.company && (disc.company || '').toLowerCase() === (selectedLead.company || '').toLowerCase()) ||
      disc.leadId === selectedLead.id
    );
  }, [selectedLead, conversationDiscussions]);

  const unifiedTimeline = useMemo(() => {
    const timelineItems: Array<{
      id: string;
      type: 'Email' | 'Call' | 'Conversation';
      date: string;
      title: string;
      summary: string;
      meta?: string;
      notes?: string;
    }> = [];

    relatedEmails.forEach(email => {
      timelineItems.push({
        id: email.id,
        type: 'Email',
        date: email.date || '',
        title: email.subject || 'Email Discussion',
        summary: email.content || '',
        meta: `Direction: ${email.direction} | Follow-up: ${email.followUpStatus}`,
        notes: email.notes
      });
    });

    relatedCalls.forEach(call => {
      timelineItems.push({
        id: call.id,
        type: 'Call',
        date: call.callDate || '',
        title: `Call (${call.duration || 'N/A'})`,
        summary: call.summary || '',
        meta: `Status: ${call.status} | Requirements: ${call.requirements || 'N/A'}`,
        notes: call.notes
      });
    });

    relatedConversations.forEach(conv => {
      timelineItems.push({
        id: conv.id,
        type: 'Conversation',
        date: conv.date && conv.time ? `${conv.date}T${conv.time}` : conv.date || '',
        title: conv.discussionTitle || 'Conversation',
        summary: conv.conversationSummary || '',
        meta: `Priority: ${conv.priority} | Status: ${conv.status} | Next Action: ${conv.nextAction || 'None'}`,
        notes: conv.notes
      });
    });

    return timelineItems.sort((a, b) => {
      const timeA = a.date ? new Date(a.date).getTime() : 0;
      const timeB = b.date ? new Date(b.date).getTime() : 0;
      return timeB - timeA;
    });
  }, [relatedEmails, relatedCalls, relatedConversations]);

  const leadTimelineEvents = useMemo(() => {
    if (!selectedLead) return [];
    
    const events: Array<{
      id: string;
      type: 'created' | 'discussion' | 'status_change';
      date: string;
      title: string;
      description: string;
      iconType: 'plus' | 'message' | 'stage';
    }> = [];

    // 1. Created Event
    events.push({
      id: `create-${selectedLead.id}`,
      type: 'created',
      date: selectedLead.createdAt || new Date().toISOString(),
      title: 'Lead Created',
      description: 'Lead was registered in the Zyqitek CRM pipeline.',
      iconType: 'plus',
    });

    // 2. Status stage event
    events.push({
      id: `stage-${selectedLead.id}`,
      type: 'status_change',
      date: selectedLead.updatedAt || selectedLead.createdAt || new Date().toISOString(),
      title: `Pipeline Stage: ${selectedLead.status}`,
      description: `Current pipeline stage is set to "${selectedLead.status}".`,
      iconType: 'stage',
    });

    // 3. Discussion events
    relatedEmails.forEach(email => {
      events.push({
        id: `email-${email.id}`,
        type: 'discussion',
        date: email.date || '',
        title: `Email Sent/Received: ${email.subject}`,
        description: email.content ? (email.content.length > 80 ? email.content.substring(0, 80) + '...' : email.content) : 'No description available.',
        iconType: 'message',
      });
    });

    relatedCalls.forEach(call => {
      events.push({
        id: `call-${call.id}`,
        type: 'discussion',
        date: call.callDate || '',
        title: `Call logged (${call.duration || 'N/A'})`,
        description: call.summary ? (call.summary.length > 80 ? call.summary.substring(0, 80) + '...' : call.summary) : 'No summary available.',
        iconType: 'message',
      });
    });

    relatedConversations.forEach(conv => {
      events.push({
        id: `conv-${conv.id}`,
        type: 'discussion',
        date: conv.date && conv.time ? `${conv.date}T${conv.time}` : conv.date || '',
        title: `Conversation: ${conv.discussionTitle || 'Status Update'}`,
        description: conv.conversationSummary ? (conv.conversationSummary.length > 80 ? conv.conversationSummary.substring(0, 80) + '...' : conv.conversationSummary) : 'No summary available.',
        iconType: 'message',
      });
    });

    // Sort events chronologically (newest first)
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedLead, relatedEmails, relatedCalls, relatedConversations]);

  // Form State for Adding / Editing
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formValue, setFormValue] = useState<number>(0);
  const [formPriority, setFormPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [formLeadScore, setFormLeadScore] = useState<number>(75);
  const [formRole, setFormRole] = useState('CEO');
  const [formOtherRoleText, setFormOtherRoleText] = useState('');
  const [formStatus, setFormStatus] = useState<Lead['status']>('New');
  const [formSource, setFormSource] = useState('Website');
  const [formCategory, setFormCategory] = useState('Other');
  const [customServiceText, setCustomServiceText] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formCountry, setFormCountry] = useState('');

  // New Upgrade Fields State
  const [formInstagramLink, setFormInstagramLink] = useState('');
  const [formFacebookLink, setFormFacebookLink] = useState('');
  const [formLinkedInLink, setFormLinkedInLink] = useState('');
  const [formWebsiteUrl, setFormWebsiteUrl] = useState('');
  const [formOtherLink, setFormOtherLink] = useState('');
  const [formOtherSourceText, setFormOtherSourceText] = useState('');
  const [formLeadId, setFormLeadId] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Handle open add modal
  const openAddModal = () => {
    setFormLeadId('');
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormCompany('');
    setFormValue(0);
    setFormPriority('Medium');
    setFormLeadScore(75);
    setFormRole('CEO');
    setFormOtherRoleText('');
    setFormStatus('New');
    setFormSource('Website');
    setFormCategory('Other');
    setCustomServiceText('');
    setFormNotes('');
    setFormCountry('');
    setSmmPlatformName('');
    setSmmPlannedPosts(12);
    setSmmPostingFrequency('3 times a week');
    setSmmContentNotes('');
    setSmmCampaignRequirements('');
    
    // Reset upgrades fields
    setFormInstagramLink('');
    setFormFacebookLink('');
    setFormLinkedInLink('');
    setFormWebsiteUrl('');
    setFormOtherLink('');
    setFormOtherSourceText('');
    setValidationError(null);

    setIsEditing(false);
    setTriggerAddForm(true);
  };

  // Handle open edit modal
  const openEditModal = (lead: Lead) => {
    setFormName(lead.name);
    setFormEmail(lead.email);
    setFormPhone(lead.phone);
    setFormCompany(lead.company);
    setFormValue(lead.value || 0);
    setFormPriority(lead.priority || 'Medium');
    setFormLeadScore(lead.leadScore ?? 75);
    
    const standardRoles = ['CEO', 'Founder/Owner', 'Marketing Manager'];
    if (standardRoles.includes(lead.role || '')) {
      setFormRole(lead.role || 'CEO');
      setFormOtherRoleText('');
    } else if (lead.role) {
      setFormRole('Other');
      setFormOtherRoleText(lead.role);
    } else {
      setFormRole('CEO');
      setFormOtherRoleText('');
    }

    setFormStatus(lead.status);
    
    const isPredefined = PREDEFINED_SERVICES.includes(lead.category || '');
    if (isPredefined) {
      setFormCategory(lead.category || 'Other');
      setCustomServiceText('');
    } else {
      setFormCategory('Other');
      setCustomServiceText(lead.category || '');
    }
    setFormNotes(lead.notes);
    setFormCountry(lead.country || '');
    setSmmPlatformName(lead.smmPlatformName || '');
    setSmmPlannedPosts(lead.smmPlannedPosts || 12);
    setSmmPostingFrequency(lead.smmPostingFrequency || '');
    setSmmContentNotes(lead.smmContentNotes || '');
    setSmmCampaignRequirements(lead.smmCampaignRequirements || '');
    
    // Populating upgrade fields
    setFormInstagramLink(lead.instagramLink || '');
    setFormFacebookLink(lead.facebookLink || '');
    setFormLinkedInLink(lead.linkedinLink || '');
    setFormWebsiteUrl(lead.websiteUrl || '');
    setFormOtherLink(lead.otherLink || '');
    
    const standardSources = ['Facebook', 'Instagram', 'LinkedIn', 'Website', 'Referral', 'WhatsApp', 'Email', 'Cold Call', 'Walk-in'];
    if (standardSources.includes(lead.source)) {
      setFormSource(lead.source);
      setFormOtherSourceText('');
    } else {
      setFormSource('Other');
      setFormOtherSourceText(lead.source);
    }

    setValidationError(null);
    setFormLeadId(lead.id);
    setIsEditing(true);
    setSelectedLead(lead);
    setTriggerAddForm(true);
  };

  // Toggle single lead selection
  const handleToggleSelectLead = (id: string) => {
    if (!id) return;
    setSelectedLeadIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Toggle all visible leads
  const handleToggleSelectAll = (visibleLeads: Lead[]) => {
    const visibleIds = visibleLeads.map(l => l.id);
    const allSelected = visibleIds.every(id => selectedLeadIds.includes(id));
    if (allSelected) {
      setSelectedLeadIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedLeadIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  // Bulk delete action
  const handleDeleteBulk = () => {
    if (selectedLeadIds.length === 0) return;
    setShowBulkDeleteConfirm(true);
  };

  const handleExecuteBulkDelete = () => {
    if (onDeleteMultipleLeads) {
      onDeleteMultipleLeads(selectedLeadIds);
    } else {
      selectedLeadIds.forEach(id => onDeleteLead(id));
    }
    setSelectedLeadIds([]);
    setShowBulkDeleteConfirm(false);
  };

  // Submit Lead Form
  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEditing) {
      if (!formLeadId.trim()) {
        setValidationError("Lead ID is required.");
        return;
      }
      const enteredId = formLeadId.trim();
      const duplicateInLeads = leads.some(l => l.id.toLowerCase() === enteredId.toLowerCase());
      const duplicateInClients = clients?.some(c => c.id.toLowerCase() === enteredId.toLowerCase() || (c.masterClientId && c.masterClientId.toLowerCase() === enteredId.toLowerCase()));
      if (duplicateInLeads || duplicateInClients) {
        setValidationError("Lead ID already exists.");
        return;
      }
    }
    
    if (!formName.trim()) {
      setValidationError("Full Name is required.");
      return;
    }
    if (!formEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail.trim())) {
      setValidationError("Please enter a valid Email Address.");
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

    if (formInstagramLink && !isValidUrl(formInstagramLink)) {
      setValidationError("Please enter a valid Instagram Profile Link.");
      return;
    }
    if (formFacebookLink && !isValidUrl(formFacebookLink)) {
      setValidationError("Please enter a valid Facebook Profile Link.");
      return;
    }
    if (formLinkedInLink && !isValidUrl(formLinkedInLink)) {
      setValidationError("Please enter a valid LinkedIn Profile Link.");
      return;
    }
    if (formWebsiteUrl && !isValidUrl(formWebsiteUrl)) {
      setValidationError("Please enter a valid Website URL.");
      return;
    }
    if (formOtherLink && !isValidUrl(formOtherLink)) {
      setValidationError("Please enter a valid Other Social/Profile Link.");
      return;
    }

    if (formRole === 'Other' && !formOtherRoleText.trim()) {
      setValidationError("Please specify the role since 'Other' was selected.");
      return;
    }

    setValidationError(null);
    setIsSaving(true);

    const actualSource = formSource === 'Other' ? formOtherSourceText.trim() || 'Other' : formSource;
    const actualCategory = formCategory === 'Other' ? customServiceText.trim() || 'Other' : formCategory;
    const actualRole = formRole === 'Other' ? formOtherRoleText.trim() : formRole;

    try {
      if (isEditing && selectedLead) {
        // Update
        await onUpdateLead({
          ...selectedLead,
          name: formName,
          email: formEmail,
          phone: formPhone,
          company: formCompany,
          value: Number(formValue) || 0,
          priority: formPriority,
          leadScore: Number(formLeadScore),
          role: actualRole,
          status: formStatus,
          source: actualSource,
          category: actualCategory,
          notes: formNotes,
          country: formCountry,
          instagramLink: formInstagramLink,
          facebookLink: formFacebookLink,
          linkedinLink: formLinkedInLink,
          websiteUrl: formWebsiteUrl,
          otherLink: formOtherLink,
          smmPlatformName: formCategory === 'Social Media Management' ? smmPlatformName : undefined,
          smmPlannedPosts: formCategory === 'Social Media Management' ? Number(smmPlannedPosts) : undefined,
          smmPostingFrequency: formCategory === 'Social Media Management' ? smmPostingFrequency : undefined,
          smmContentNotes: formCategory === 'Social Media Management' ? smmContentNotes : undefined,
          smmCampaignRequirements: formCategory === 'Social Media Management' ? smmCampaignRequirements : undefined,
          updatedAt: new Date().toISOString()
        });
      } else {
        // Create
        await onAddLead({
          id: formLeadId.trim(),
          name: formName,
          email: formEmail,
          phone: formPhone,
          company: formCompany,
          value: Number(formValue) || 0,
          priority: formPriority,
          leadScore: Number(formLeadScore),
          role: actualRole,
          status: formStatus,
          source: actualSource,
          category: actualCategory,
          notes: formNotes,
          country: formCountry,
          instagramLink: formInstagramLink,
          facebookLink: formFacebookLink,
          linkedinLink: formLinkedInLink,
          websiteUrl: formWebsiteUrl,
          otherLink: formOtherLink,
          smmPlatformName: formCategory === 'Social Media Management' ? smmPlatformName : undefined,
          smmPlannedPosts: formCategory === 'Social Media Management' ? Number(smmPlannedPosts) : undefined,
          smmPostingFrequency: formCategory === 'Social Media Management' ? smmPostingFrequency : undefined,
          smmContentNotes: formCategory === 'Social Media Management' ? smmContentNotes : undefined,
          smmCampaignRequirements: formCategory === 'Social Media Management' ? smmCampaignRequirements : undefined,
        });
      }
      setTriggerAddForm(false);
      setSelectedLead(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Advanced, spreadsheet-style filtering & sorting
  const deferredSearch = useDeferredValue(search);
  const filteredAndSortedLeads = useMemo(() => {
    // 1. Filter leads
    const filtered = leads.filter(lead => {
      const query = (deferredSearch || '').toLowerCase();
      const matchesSearch = 
        (lead.name || '').toLowerCase().includes(query) ||
        (lead.email || '').toLowerCase().includes(query) ||
        (lead.company || '').toLowerCase().includes(query) ||
        (lead.notes || '').toLowerCase().includes(query) ||
        (lead.id || '').toLowerCase().includes(query) ||
        (lead.customFields ? Object.values(lead.customFields).some(val => String(val || '').toLowerCase().includes(query)) : false);
      
      const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
      const matchesSource = sourceFilter === 'All' || lead.source === sourceFilter;
      const isPredefined = PREDEFINED_SERVICES.includes(lead.category || '');
      const matchesCategory = categoryFilter === 'All' || 
        (categoryFilter === 'Other' ? (!lead.category || !isPredefined) : lead.category === categoryFilter);

      // Advanced Filters
      const matchesPriority = priorityFilter === 'All' || (lead.priority || 'Medium') === priorityFilter;
      
      let matchesAssignedTo = true;
      if (assignedToFilter !== 'All') {
        if (assignedToFilter === 'Unassigned') {
          matchesAssignedTo = !lead.assignedTeamMember || lead.assignedTeamMember === 'Unassigned';
        } else {
          matchesAssignedTo = lead.assignedTeamMember === assignedToFilter;
        }
      }

      let matchesDateRange = true;
      if (dateRangeFilter !== 'All') {
        const leadTime = lead.createdAt ? new Date(lead.createdAt).getTime() : 0;
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        if (dateRangeFilter === 'today') {
          matchesDateRange = now - leadTime <= oneDay;
        } else if (dateRangeFilter === '7days') {
          matchesDateRange = now - leadTime <= oneDay * 7;
        } else if (dateRangeFilter === '30days') {
          matchesDateRange = now - leadTime <= oneDay * 30;
        } else if (dateRangeFilter === 'thismonth') {
          const createdDate = lead.createdAt ? new Date(lead.createdAt) : new Date(0);
          const currentDate = new Date();
          matchesDateRange = createdDate.getMonth() === currentDate.getMonth() && createdDate.getFullYear() === currentDate.getFullYear();
        } else if (dateRangeFilter === 'thisyear') {
          const createdDate = lead.createdAt ? new Date(lead.createdAt) : new Date(0);
          const currentDate = new Date();
          matchesDateRange = createdDate.getFullYear() === currentDate.getFullYear();
        }
      }

      let matchesActivity = true;
      if (activityFilter !== 'All') {
        const act = lead.leadActivity;
        if (activityFilter === 'Contacted') {
          matchesActivity = !!(act?.contacted || act?.emailStatus === 'Sent' || act?.callStatus === 'Completed' || act?.whatsappStatus === 'Sent' || (act?.totalEmails || 0) > 0 || (act?.totalCalls || 0) > 0 || (act?.totalWhatsapp || 0) > 0);
        } else if (activityFilter === 'Not Contacted') {
          matchesActivity = !act?.contacted && !act?.emailStatus && !act?.callStatus && !act?.whatsappStatus && (act?.totalEmails || 0) === 0 && (act?.totalCalls || 0) === 0 && (act?.totalWhatsapp || 0) === 0;
        } else if (activityFilter === 'Has Email') {
          matchesActivity = act?.emailStatus === 'Sent' || (act?.totalEmails || 0) > 0;
        } else if (activityFilter === 'Has Call') {
          matchesActivity = act?.callStatus === 'Completed' || (act?.totalCalls || 0) > 0;
        } else if (activityFilter === 'Has Conversation') {
          matchesActivity = act?.whatsappStatus === 'Sent' || (act?.totalWhatsapp || 0) > 0;
        }
      }

      return matchesSearch && matchesStatus && matchesSource && matchesCategory && matchesPriority && matchesAssignedTo && matchesDateRange && matchesActivity;
    });

    // 2. Sort leads
    return filtered.sort((a, b) => {
      let fieldA: any = '';
      let fieldB: any = '';
      
      switch (sortField) {
        case 'id':
          fieldA = a.id;
          fieldB = b.id;
          break;
        case 'name':
          fieldA = a.name;
          fieldB = b.name;
          break;
        case 'company':
          fieldA = a.company || '';
          fieldB = b.company || '';
          break;
        case 'category':
          fieldA = a.category || '';
          fieldB = b.category || '';
          break;
        case 'source':
          fieldA = a.source || '';
          fieldB = b.source || '';
          break;
        case 'priority':
          const prioMap = { High: 3, Medium: 2, Low: 1 };
          fieldA = prioMap[a.priority || 'Medium'] || 2;
          fieldB = prioMap[b.priority || 'Medium'] || 2;
          break;
        case 'leadScore':
          fieldA = a.leadScore ?? 75;
          fieldB = b.leadScore ?? 75;
          break;
        case 'value':
        case 'dealValue':
          fieldA = a.value ?? 0;
          fieldB = b.value ?? 0;
          break;
        case 'country':
          fieldA = a.country || a.city || '';
          fieldB = b.country || b.city || '';
          break;
        case 'phone':
          fieldA = a.phone || '';
          fieldB = b.phone || '';
          break;
        case 'email':
          fieldA = a.email || '';
          fieldB = b.email || '';
          break;
        case 'status':
          fieldA = a.status || '';
          fieldB = b.status || '';
          break;
        case 'assignedTo':
          fieldA = a.assignedTeamMember || '';
          fieldB = b.assignedTeamMember || '';
          break;
        case 'createdAt':
          fieldA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          fieldB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          break;
        case 'updatedAt':
          fieldA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          fieldB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          break;
        default:
          if (sortField.startsWith('cf_')) {
            const k = sortField.substring(3);
            fieldA = a.customFields?.[k] || '';
            fieldB = b.customFields?.[k] || '';
          } else {
            return 0;
          }
      }
      
      if (typeof fieldA === 'string') {
        return sortDirection === 'asc' 
          ? fieldA.localeCompare(fieldB)
          : fieldB.localeCompare(fieldA);
      } else {
        return sortDirection === 'asc'
          ? fieldA - fieldB
          : fieldB - fieldA;
      }
    });
  }, [leads, deferredSearch, statusFilter, sourceFilter, categoryFilter, priorityFilter, assignedToFilter, dateRangeFilter, sortField, sortDirection]);

  // Handle column header sorting click
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Cell editing submit helper
  const handleSaveCell = async (lead: Lead, field: string, value: any) => {
    setEditingCell(null);
    let updatedValue = value;
    if (field === 'leadScore') {
      updatedValue = Number(value) || 0;
    } else if (field === 'value') {
      updatedValue = Number(value) || 0;
    }

    if (field.startsWith('cf_')) {
      const fieldKey = field.substring(3);
      const updatedCustomFields = {
        ...(lead.customFields || {}),
        [fieldKey]: updatedValue
      };
      await onUpdateLead({
        ...lead,
        customFields: updatedCustomFields,
        updatedAt: new Date().toISOString()
      });
      return;
    }
    
    const propMap: Record<string, string> = {
      id: 'id',
      name: 'name',
      company: 'company',
      category: 'category',
      source: 'source',
      priority: 'priority',
      leadScore: 'leadScore',
      phone: 'phone',
      email: 'email',
      country: 'country',
      status: 'status',
      assignedTo: 'assignedTeamMember',
      assignedTeamMember: 'assignedTeamMember',
      websiteUrl: 'websiteUrl',
      value: 'value'
    };

    const targetProp = propMap[field];
    if (!targetProp) return;

    await onUpdateLead({
      ...lead,
      [targetProp]: updatedValue,
      updatedAt: new Date().toISOString()
    });
  };

  // Paginated leads slicing
  const paginatedLeads = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredAndSortedLeads.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAndSortedLeads, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedLeads.length / rowsPerPage) || 1;

  // Reset pagination page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, sourceFilter, categoryFilter, priorityFilter, assignedToFilter, dateRangeFilter, sortField, sortDirection]);

  // Bulk actions operations
  const handleBulkStatusChange = async (newStatus: Lead['status']) => {
    if (selectedLeadIds.length === 0) return;
    setIsSaving(true);
    for (const leadId of selectedLeadIds) {
      const lead = leads.find(l => l.id === leadId);
      if (lead) {
        await onUpdateLead({
          ...lead,
          status: newStatus,
          updatedAt: new Date().toISOString()
        });
      }
    }
    setSelectedLeadIds([]);
    setShowBulkStatusDropdown(false);
    setIsSaving(false);
  };

  const handleBulkAssign = async (memberName: string) => {
    if (selectedLeadIds.length === 0) return;
    setIsSaving(true);
    const actualMember = memberName === 'Unassigned' ? '' : memberName;
    for (const leadId of selectedLeadIds) {
      const lead = leads.find(l => l.id === leadId);
      if (lead) {
        await onUpdateLead({
          ...lead,
          assignedTeamMember: actualMember,
          updatedAt: new Date().toISOString()
        });
      }
    }
    setSelectedLeadIds([]);
    setShowBulkAssignDropdown(false);
    setIsSaving(false);
  };

  const handleBulkConvert = async () => {
    if (selectedLeadIds.length === 0) return;
    setIsSaving(true);
    const idsToConvert = [...selectedLeadIds];

    if (onConvertLeadToClient) {
      await onConvertLeadToClient(idsToConvert);
    }

    setSelectedLeadIds([]);
    setIsSaving(false);
  };

  // Reorder columns handler
  const handleReorderColumns = (sourceId: string, targetId: string) => {
    if (sourceId === 'checkbox' || sourceId === 'actions' || targetId === 'checkbox' || targetId === 'actions') return;
    setColumnOrder(prev => {
      const next = [...prev];
      const sourceIdx = next.indexOf(sourceId);
      const targetIdx = next.indexOf(targetId);
      if (sourceIdx > -1 && targetIdx > -1) {
        next.splice(sourceIdx, 1);
        next.splice(targetIdx, 0, sourceId);
      }
      return next;
    });
  };

  // Column resize mouse down handler
  const handleResizeStart = (colId: string, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    const startX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
    const startWidth = columnWidths[colId] || 150;
    
    const handleMouseMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currentX = 'clientX' in moveEvent ? moveEvent.clientX : moveEvent.touches[0].clientX;
      const deltaX = currentX - startX;
      const newWidth = Math.max(60, startWidth + deltaX);
      setColumnWidths(prev => ({
        ...prev,
        [colId]: newWidth
      }));
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleMouseMove);
      document.removeEventListener('touchend', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleMouseMove);
    document.addEventListener('touchend', handleMouseUp);
  };

  // Define static fallback for compilation
  const filteredLeads = filteredAndSortedLeads;

  // Unique sources list for filter
  const sourcesList = Array.from(new Set(leads.map(l => l.source)));

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'New':
        return 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 border-blue-200';
      case 'Contacted':
        return 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 border-indigo-200';
      case 'Follow Up':
        return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 border-amber-200';
      case 'Qualified':
        return 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 border-purple-200';
      case 'Converted':
      case 'Closed':
        return 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 border-teal-200';
      case 'Lost':
        return 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 border-rose-200';
      default:
        return 'bg-[var(--crm-sidebar)] text-[var(--crm-text-secondary)] border-[var(--crm-card-border)]';
    }
  };

  const getServiceBadgeColor = (service?: string) => {
    const s = (service || 'Other').toLowerCase();
    if (s.includes('video')) return 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 border-blue-200/60';
    if (s.includes('graphic')) return 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 border-purple-200/60';
    if (s.includes('logo') || s.includes('brand')) return 'bg-pink-50 dark:bg-pink-900/20 text-pink-700 border-pink-200/60';
    if (s.includes('web') && s.includes('dev')) return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 border-emerald-200/60';
    if (s.includes('software')) return 'bg-cyan-50 text-cyan-700 border-cyan-200/60';
    if (s.includes('seo')) return 'bg-orange-50 text-orange-700 border-orange-200/60';
    if (s.includes('marketing')) return 'bg-violet-50 text-violet-700 border-violet-200/60';
    if (s.includes('social') || s.includes('smm')) return 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 border-amber-200/60';
    if (s.includes('commerce') || s.includes('shopify')) return 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 border-teal-200/60';
    if (s.includes('ugc')) return 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 border-rose-200/60';
    if (s.includes('ai') || s.includes('chatbot')) return 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200/60';
    return 'bg-[var(--crm-sidebar)] text-[var(--crm-text-secondary)] border-[var(--crm-card-border)]/60';
  };

  // Sticky offset calculation for frozen left columns
  const getStickyLeftOffset = (colId: string) => {
    const showCheckbox = selectedLeadIds.length > 0;
    const checkboxWidth = showCheckbox ? 48 : 0;
    if (colId === 'checkbox') return 0;
    if (colId === 'id') return checkboxWidth; // checkbox column is 48px wide if shown
    if (colId === 'name') return checkboxWidth + (columnWidths['id'] || 115);
    return null;
  };

  // Check if columns is frozen
  const isColumnFrozen = (colId: string) => {
    return ['checkbox', 'id', 'name'].includes(colId);
  };

  // Compute dynamic custom columns derived from all leads
  const dynamicCustomKeys = useMemo(() => {
    const keys = new Set<string>();
    leads.forEach(lead => {
      if (lead.customFields && typeof lead.customFields === 'object') {
        Object.keys(lead.customFields).forEach(k => {
          if (k && k.trim()) keys.add(k.trim());
        });
      }
    });
    return Array.from(keys);
  }, [leads]);

  const columnsDef = useMemo(() => {
    const baseColumns = [
      { id: 'id', label: 'Lead ID' },
      { id: 'name', label: 'Name' },
      { id: 'company', label: 'Company' },
      { id: 'value', label: 'Value' },
      { id: 'createdAt', label: 'Date' },
      { id: 'email', label: 'Email' },
      { id: 'phone', label: 'Phone' },
      { id: 'source', label: 'Source' },
      { id: 'status', label: 'Status' }
    ];

    const dynamicCols = dynamicCustomKeys.map(key => ({
      id: `cf_${key}`,
      label: key
    }));

    return [...baseColumns, ...dynamicCols, { id: 'actions', label: 'Actions' }];
  }, [dynamicCustomKeys]);

  const renderCellContent = (lead: Lead, colId: string) => {
    const isEditingThisCell = editingCell?.leadId === lead.id && editingCell?.field === colId;

    // Handle dynamic customField columns (prefixed with cf_)
    if (colId.startsWith('cf_')) {
      const fieldKey = colId.substring(3);
      const customVal = lead.customFields?.[fieldKey];
      const displayVal = customVal !== undefined && customVal !== null ? String(customVal) : '';

      if (isEditingThisCell) {
        return (
          <input
            type="text"
            defaultValue={displayVal}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSaveCell(lead, colId, (e.target as any).value);
              } else if (e.key === 'Escape') {
                setEditingCell(null);
              }
            }}
            onBlur={(e) => handleSaveCell(lead, colId, e.target.value)}
            className="w-full h-7 px-2 text-xs bg-[var(--crm-card)] text-[var(--crm-text)] border border-indigo-500 rounded focus:outline-none shadow-inner"
          />
        );
      }

      return (
        <span className="text-[var(--crm-text-secondary)] truncate block text-xs" title={displayVal || undefined}>
          {displayVal || <span className="text-[var(--crm-text-muted)] font-light">—</span>}
        </span>
      );
    }

    if (isEditingThisCell) {
      const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (e.key === 'Enter') {
          handleSaveCell(lead, colId, (e.target as any).value);
        } else if (e.key === 'Escape') {
          setEditingCell(null);
        }
      };

      const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
        handleSaveCell(lead, colId, e.target.value);
      };

      switch (colId) {
        case 'name':
          return (
            <input
              autoFocus
              type="text"
              defaultValue={lead.name}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              className="w-full px-2 py-1 text-xs border border-indigo-500 rounded focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-[var(--crm-card)]"
              onClick={(e) => e.stopPropagation()}
            />
          );
        case 'company':
          return (
            <input
              autoFocus
              type="text"
              defaultValue={lead.company || ''}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              className="w-full px-2 py-1 text-xs border border-indigo-500 rounded focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-[var(--crm-card)]"
              onClick={(e) => e.stopPropagation()}
            />
          );
        case 'source':
          return (
            <select
              autoFocus
              defaultValue={lead.source || 'Website'}
              onChange={(e) => handleSaveCell(lead, colId, e.target.value)}
              onBlur={handleBlur}
              className="w-full px-1 py-0.5 text-xs border border-indigo-500 rounded focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-[var(--crm-card)] cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="Facebook">Facebook</option>
              <option value="Instagram">Instagram</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Website">Website</option>
              <option value="Referral">Referral</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Email">Email</option>
              <option value="Cold Call">Cold Call</option>
              <option value="Walk-in">Walk-in</option>
              <option value="Other">Other</option>
            </select>
          );
        case 'priority':
          return (
            <select
              autoFocus
              defaultValue={lead.priority || 'Medium'}
              onChange={(e) => handleSaveCell(lead, colId, e.target.value)}
              onBlur={handleBlur}
              className="w-full px-1 py-0.5 text-xs border border-indigo-500 rounded focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-[var(--crm-card)] cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          );
        case 'leadScore':
          return (
            <input
              autoFocus
              type="number"
              min={0}
              max={100}
              defaultValue={lead.leadScore ?? 75}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              className="w-full px-2 py-1 text-xs border border-indigo-500 rounded focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-[var(--crm-card)]"
              onClick={(e) => e.stopPropagation()}
            />
          );
        case 'phone':
          return (
            <input
              autoFocus
              type="text"
              defaultValue={lead.phone || ''}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              className="w-full px-2 py-1 text-xs border border-indigo-500 rounded focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-[var(--crm-card)]"
              onClick={(e) => e.stopPropagation()}
            />
          );
        case 'email':
          return (
            <input
              autoFocus
              type="email"
              defaultValue={lead.email || ''}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              className="w-full px-2 py-1 text-xs border border-indigo-500 rounded focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-[var(--crm-card)]"
              onClick={(e) => e.stopPropagation()}
            />
          );
        case 'country':
          return (
            <input
              autoFocus
              type="text"
              defaultValue={lead.country || ''}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              className="w-full px-2 py-1 text-xs border border-indigo-500 rounded focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-[var(--crm-card)]"
              onClick={(e) => e.stopPropagation()}
            />
          );
        case 'status':
          return (
            <select
              autoFocus
              defaultValue={lead.status}
              onChange={(e) => handleSaveCell(lead, colId, e.target.value)}
              onBlur={handleBlur}
              className="w-full px-1 py-0.5 text-xs border border-indigo-500 rounded focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-[var(--crm-card)] cursor-pointer font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Follow Up">Follow Up</option>
              <option value="Qualified">Qualified</option>
              <option value="Closed">Closed</option>
              <option value="Lost">Lost</option>
            </select>
          );
        case 'category':
          return (
            <select
              autoFocus
              defaultValue={lead.category || 'Other'}
              onChange={(e) => handleSaveCell(lead, colId, e.target.value)}
              onBlur={handleBlur}
              className="w-full px-1 py-0.5 text-xs border border-indigo-500 rounded focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-[var(--crm-card)] cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              {PREDEFINED_SERVICES.map(svc => (
                <option key={svc} value={svc}>{svc}</option>
              ))}
              <option value="Other">Other</option>
            </select>
          );
        case 'websiteUrl':
          return (
            <input
              autoFocus
              type="text"
              defaultValue={lead.websiteUrl || ''}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              className="w-full px-2 py-1 text-xs border border-indigo-500 rounded focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-[var(--crm-card)]"
              onClick={(e) => e.stopPropagation()}
            />
          );
        case 'assignedTeamMember':
          return (
            <select
              autoFocus
              defaultValue={lead.assignedTeamMember || ''}
              onChange={(e) => handleSaveCell(lead, colId, e.target.value)}
              onBlur={handleBlur}
              className="w-full px-1 py-0.5 text-xs border border-indigo-500 rounded focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-[var(--crm-card)] cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="">Unassigned</option>
              {teamMembers.map(tm => (
                <option key={tm.id} value={tm.fullName}>{tm.fullName}</option>
              ))}
            </select>
          );
        case 'value':
          return (
            <input
              autoFocus
              type="number"
              defaultValue={lead.value || 0}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              className="w-full px-2 py-1 text-xs border border-indigo-500 rounded focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-[var(--crm-card)]"
              onClick={(e) => e.stopPropagation()}
            />
          );
        default:
          break;
      }
    }

    switch (colId) {
      case 'id':
        return (
          <div className="font-mono text-[10px] text-indigo-700 font-medium bg-indigo-50/70 dark:bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-100 inline-block">
            {lead.id.startsWith('lead-') ? `LD-${lead.id.split('-')[1]?.substring(0,4).toUpperCase() || lead.id.substring(5,9).toUpperCase()}` : lead.id.substring(0,6).toUpperCase()}
          </div>
        );
      case 'name':
        return (
          <div className="font-semibold text-[var(--crm-text)] truncate max-w-[170px] 2xl:max-w-[280px] 3xl:max-w-[450px] 4k:max-w-none" title={lead.name}>
            {lead.name}
          </div>
        );
      case 'company':
        return (
          <div className="text-[var(--crm-text-secondary)] flex items-center gap-1 text-xs">
            <Building2 size={12} className="text-[var(--crm-text-muted)] shrink-0" />
            <span className="truncate max-w-[130px] 2xl:max-w-[200px] 2xl:max-w-[350px] 3xl:max-w-[600px] 4k:max-w-none">{lead.company || '—'}</span>
          </div>
        );
      case 'category':
        return (
          <span className={`text-[10px] font-medium border px-1.5 py-0.5 rounded-full inline-block truncate max-w-full ${getServiceBadgeColor(lead.category)}`}>
            {lead.category || 'Other'}
          </span>
        );
      case 'source':
        return (
          <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 text-indigo-700 text-[10px]  font-medium truncate max-w-full inline-block">
            {lead.source || 'Website'}
          </span>
        );
      case 'priority': {
        const prio = lead.priority || 'Medium';
        return (
          <span className={`text-[10px] font-semibold border px-2 py-0.5 rounded-md inline-block ${
            prio === 'High' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 border-rose-200' :
            prio === 'Low' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 border-blue-200' :
            'bg-amber-50 dark:bg-amber-500/10 text-amber-700 border-amber-200'
          }`}>
            {prio === 'High' ? '🔥 High' : prio === 'Low' ? '🔹 Low' : '⚡ Medium'}
          </span>
        );
      }
      case 'leadScore': {
        const score = lead.leadScore ?? (lead.status === 'Qualified' ? 90 : lead.status === 'Follow Up' ? 75 : lead.status === 'Contacted' ? 65 : 50);
        return (
          <div className="flex items-center gap-1.5  text-xs">
            <div className="w-10 bg-[var(--crm-sidebar)] h-2 rounded-full overflow-hidden border border-[var(--crm-card-border)] shrink-0">
              <div 
                className={`h-full ${score >= 80 ? 'bg-emerald-50 dark:bg-emerald-500/10' : score >= 50 ? 'bg-amber-50 dark:bg-amber-500/10' : 'bg-rose-50 dark:bg-rose-500/10'}`} 
                style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
              />
            </div>
            <span className="text-[var(--crm-text)] text-[11px] font-semibold">{score}</span>
          </div>
        );
      }
      case 'phone': {
        const phoneVal = lead.phone || '';
        const cleanPhone = phoneVal.replace(/[^0-9]/g, '');
        const hasValidPhone = cleanPhone.length >= 7;
        const whatsappUrl = `https://wa.me/${cleanPhone}`;
        
        const rawWeb = lead.websiteUrl || (lead as any).website || '';
        const hasWebsite = Boolean(rawWeb && rawWeb.trim());
        const webUrl = hasWebsite ? (/^https?:\/\//i.test(rawWeb.trim()) ? rawWeb.trim() : `https://${rawWeb.trim()}`) : '';

        return (
          <div className="flex items-center justify-between gap-1.5 text-xs w-full">
            <div className="flex items-center gap-1 min-w-0 truncate text-[var(--crm-text-secondary)] ">
              <Phone size={12} className="text-[var(--crm-text-muted)] shrink-0" />
              <span className="truncate">{phoneVal || '—'}</span>
            </div>

            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              {/* WhatsApp Button */}
              {hasValidPhone ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-500/10 active:bg-emerald-100 rounded-md transition-colors inline-flex items-center justify-center h-6 w-6"
                  title={`Open WhatsApp chat (${phoneVal})`}
                >
                  <WhatsAppIcon className="w-3.5 h-3.5" />
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="p-1 text-[var(--crm-text-muted)] rounded-md cursor-not-allowed opacity-40 inline-flex items-center justify-center h-6 w-6"
                  title="WhatsApp unavailable (no valid phone number)"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Website Button */}
              {hasWebsite ? (
                <a
                  href={webUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:bg-blue-500/10 active:bg-blue-100 rounded-md transition-colors inline-flex items-center justify-center h-6 w-6"
                  title={`Visit website: ${rawWeb}`}
                >
                  <Globe size={13} />
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="p-1 text-[var(--crm-text-muted)] rounded-md cursor-not-allowed opacity-40 inline-flex items-center justify-center h-6 w-6"
                  title="Website unavailable"
                >
                  <Globe size={13} />
                </button>
              )}
            </div>
          </div>
        );
      }
      case 'email':
        return (
          <div className="text-[var(--crm-text-secondary)] flex items-center gap-1 text-xs">
            <Mail size={12} className="text-[var(--crm-text-muted)] shrink-0" />
            <span className="truncate max-w-[180px] 2xl:max-w-[300px] 3xl:max-w-[500px] 4k:max-w-none" title={lead.email}>{lead.email || '—'}</span>
          </div>
        );
      case 'country':
        return (
          <div className="text-[var(--crm-text-secondary)] flex items-center gap-1 text-xs">
            <MapPin size={12} className="text-[var(--crm-text-muted)] shrink-0" />
            <span className="truncate max-w-[110px]">{lead.country || lead.city || '—'}</span>
          </div>
        );
      case 'nextFollowUp': {
        const fuDate = lead.leadActivity?.followUpDate;
        return (
          <div className="text-xs flex items-center gap-1">
            <Calendar size={12} className="text-purple-500 shrink-0" />
            <span className={fuDate ? "font-semibold text-purple-700 text-[11px]" : "text-[var(--crm-text-muted)] text-[11px]"}>
              {fuDate ? new Date(fuDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Not set'}
            </span>
          </div>
        );
      }
      case 'status':
        return (
          <span className={`text-[10px] font-medium border px-2 py-0.5 rounded-full inline-block ${getStatusBadgeClass(lead.status)}`}>
            {lead.status}
          </span>
        );
      case 'leadActivity': {
        const act = lead.leadActivity || {};
        const isContacted = act.contacted ?? (lead.status !== 'New');
        const isCall = act.callStatus === 'Completed';
        const isWa = act.whatsappStatus === 'Sent';
        const isEmail = act.emailStatus === 'Sent';
        const isFollowUp = act.followUpStatus === 'Scheduled' || act.followUpStatus === 'Completed';
        const isMeeting = act.meetingStatus === 'Scheduled' || act.meetingStatus === 'Completed';
        const isProposal = act.proposalStatus === 'Sent';

        const toggleActivity = (key: string, e: React.MouseEvent) => {
          e.stopPropagation();
          let updatedAct = { ...act };
          let newStatus = lead.status;

          if (key === 'contacted') {
            updatedAct.contacted = !isContacted;
            if (!isContacted && lead.status === 'New') {
              newStatus = 'Contacted';
            }
          } else if (key === 'call') {
            updatedAct.callStatus = isCall ? 'Pending' : 'Completed';
            updatedAct.totalCalls = Math.max(0, (updatedAct.totalCalls || 0) + (isCall ? -1 : 1));
          } else if (key === 'whatsapp') {
            updatedAct.whatsappStatus = isWa ? 'Pending' : 'Sent';
            updatedAct.totalWhatsapp = Math.max(0, (updatedAct.totalWhatsapp || 0) + (isWa ? -1 : 1));
          } else if (key === 'email') {
            updatedAct.emailStatus = isEmail ? 'Pending' : 'Sent';
            updatedAct.totalEmails = Math.max(0, (updatedAct.totalEmails || 0) + (isEmail ? -1 : 1));
          } else if (key === 'followUp') {
            updatedAct.followUpStatus = isFollowUp ? 'Pending' : 'Scheduled';
            if (!isFollowUp && lead.status === 'New') newStatus = 'Follow Up';
          } else if (key === 'meeting') {
            updatedAct.meetingStatus = isMeeting ? 'Pending' : 'Scheduled';
          } else if (key === 'proposal') {
            updatedAct.proposalStatus = isProposal ? 'Pending' : 'Sent';
            if (!isProposal && lead.status !== 'Closed') newStatus = 'Proposal';
          }

          updatedAct.lastActivityAt = new Date().toISOString();
          onUpdateLead({
            ...lead,
            status: newStatus,
            leadActivity: updatedAct,
            updatedAt: new Date().toISOString()
          });
        };

        return (
          <div className="flex flex-wrap items-center gap-1 py-1 text-[10px]" onClick={(e) => e.stopPropagation()}>
            {/* Contacted Badge */}
            <button
              type="button"
              onClick={(e) => toggleActivity('contacted', e)}
              title={isContacted ? "✓ Contacted (Click to set Not Contacted)" : "Not Contacted (Click to set Contacted)"}
              className={`px-1.5 py-0.5 rounded-md border flex items-center gap-1 font-medium transition-all cursor-pointer ${
                isContacted ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-[var(--crm-sidebar)] text-[var(--crm-text-muted)] border-[var(--crm-card-border)] hover:bg-[var(--crm-sidebar)]/80'
              }`}
            >
              <span className="text-[9px]">{isContacted ? '✓' : '✗'}</span>
              <span>{isContacted ? 'Contacted' : 'Not Contacted'}</span>
            </button>

            {/* Call Badge */}
            <button
              type="button"
              onClick={(e) => toggleActivity('call', e)}
              title={isCall ? "📞 Call Completed (Click to mark Pending)" : "📞 Call Pending (Click to mark Completed)"}
              className={`px-1.5 py-0.5 rounded-md border flex items-center gap-1 font-medium transition-all cursor-pointer ${
                isCall ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 border-blue-200 hover:bg-blue-100' : 'bg-[var(--crm-sidebar)] text-[var(--crm-text-muted)] border-[var(--crm-card-border)] hover:bg-[var(--crm-sidebar)]/80'
              }`}
            >
              <span>📞</span>
              <span>{isCall ? 'Call Completed' : 'Call Pending'}</span>
            </button>

            {/* WhatsApp Badge */}
            <button
              type="button"
              onClick={(e) => toggleActivity('whatsapp', e)}
              title={isWa ? "💬 WhatsApp Sent (Click to mark Pending)" : "💬 WhatsApp Pending (Click to mark Sent)"}
              className={`px-1.5 py-0.5 rounded-md border flex items-center gap-1 font-medium transition-all cursor-pointer ${
                isWa ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 border-teal-200 hover:bg-teal-100' : 'bg-[var(--crm-sidebar)] text-[var(--crm-text-muted)] border-[var(--crm-card-border)] hover:bg-[var(--crm-sidebar)]/80'
              }`}
            >
              <span>💬</span>
              <span>{isWa ? 'WhatsApp Sent' : 'WhatsApp Pending'}</span>
            </button>

            {/* Email Badge */}
            <button
              type="button"
              onClick={(e) => toggleActivity('email', e)}
              title={isEmail ? "✉️ Email Sent (Click to mark Pending)" : "✉️ Email Pending (Click to mark Sent)"}
              className={`px-1.5 py-0.5 rounded-md border flex items-center gap-1 font-medium transition-all cursor-pointer ${
                isEmail ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 border-indigo-200 hover:bg-indigo-100' : 'bg-[var(--crm-sidebar)] text-[var(--crm-text-muted)] border-[var(--crm-card-border)] hover:bg-[var(--crm-sidebar)]/80'
              }`}
            >
              <span>✉️</span>
              <span>{isEmail ? 'Email Sent' : 'Email Pending'}</span>
            </button>

            {/* Follow-up Badge */}
            <button
              type="button"
              onClick={(e) => toggleActivity('followUp', e)}
              title={isFollowUp ? "📅 Follow-up Scheduled (Click to mark Pending)" : "📅 Follow-up Pending (Click to mark Scheduled)"}
              className={`px-1.5 py-0.5 rounded-md border flex items-center gap-1 font-medium transition-all cursor-pointer ${
                isFollowUp ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 border-purple-200 hover:bg-purple-100' : 'bg-[var(--crm-sidebar)] text-[var(--crm-text-muted)] border-[var(--crm-card-border)] hover:bg-[var(--crm-sidebar)]/80'
              }`}
            >
              <span>📅</span>
              <span>{isFollowUp ? 'Follow-up Scheduled' : 'Follow-up Pending'}</span>
            </button>

            {/* Meeting Badge */}
            <button
              type="button"
              onClick={(e) => toggleActivity('meeting', e)}
              title={isMeeting ? "🤝 Meeting Scheduled (Click to mark Pending)" : "🤝 Meeting Pending (Click to mark Scheduled)"}
              className={`px-1.5 py-0.5 rounded-md border flex items-center gap-1 font-medium transition-all cursor-pointer ${
                isMeeting ? 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100' : 'bg-[var(--crm-sidebar)] text-[var(--crm-text-muted)] border-[var(--crm-card-border)] hover:bg-[var(--crm-sidebar)]/80'
              }`}
            >
              <span>🤝</span>
              <span>{isMeeting ? 'Meeting Scheduled' : 'Meeting Pending'}</span>
            </button>

            {/* Proposal Badge */}
            <button
              type="button"
              onClick={(e) => toggleActivity('proposal', e)}
              title={isProposal ? "🏷️ Proposal Sent (Click to mark Pending)" : "🏷️ Proposal Pending (Click to mark Sent)"}
              className={`px-1.5 py-0.5 rounded-md border flex items-center gap-1 font-medium transition-all cursor-pointer ${
                isProposal ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 border-amber-200 hover:bg-amber-100' : 'bg-[var(--crm-sidebar)] text-[var(--crm-text-muted)] border-[var(--crm-card-border)] hover:bg-[var(--crm-sidebar)]/80'
              }`}
            >
              <span>🏷️</span>
              <span>{isProposal ? 'Proposal Sent' : 'Proposal Pending'}</span>
            </button>
          </div>
        );
      }
      case 'updatedAt':
        return (
          <div className="text-[var(--crm-text-muted)] text-xs ">
            {lead.updatedAt ? new Date(lead.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
          </div>
        );
      case 'websiteUrl':
        return (
          <div className="text-[var(--crm-text-secondary)] flex items-center gap-1 text-xs">
            <ExternalLink size={12} className="text-[var(--crm-text-muted)] shrink-0" />
            {lead.websiteUrl ? (
              <a 
                href={lead.websiteUrl.startsWith('http') ? lead.websiteUrl : `https://${lead.websiteUrl}`} 
                target="_blank" 
                rel="noreferrer" 
                className="text-indigo-600 hover:underline truncate max-w-[150px] 2xl:max-w-[250px] 3xl:max-w-[400px] 4k:max-w-none"
                onClick={(e) => e.stopPropagation()}
              >
                {lead.websiteUrl}
              </a>
            ) : (
              <span className="text-[var(--crm-text-muted)]">—</span>
            )}
          </div>
        );
      case 'assignedTeamMember':
        return (
          <div className="text-[var(--crm-text-secondary)]  text-xs truncate max-w-[130px] 2xl:max-w-[200px] 3xl:max-w-[380px] 4k:max-w-none">
            {lead.assignedTeamMember || <span className="text-[var(--crm-text-muted)]">—</span>}
          </div>
        );
      case 'value':
        return (
          <div className="text-[var(--crm-text)] text-xs">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(lead.value || 0)}
          </div>
        );
      case 'createdAt':
        return (
          <div className="text-[var(--crm-text-muted)] text-xs">
            {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
          </div>
        );
      case 'actions':
        return (
          <div 
            className="flex items-center gap-0.5" 
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedLead(lead)}
              className="p-1 text-[var(--crm-text-muted)] hover:text-indigo-600 hover:bg-[var(--crm-sidebar)] rounded-md transition-colors"
              title="View Profile"
            >
              <ExternalLink size={13} />
            </button>
            <button
              onClick={() => openEditModal(lead)}
              className="p-1 text-[var(--crm-text-muted)] hover:text-indigo-600 hover:bg-indigo-50 dark:bg-indigo-500/10 rounded-md transition-colors"
              title="Edit Lead"
            >
              <Edit3 size={13} />
            </button>
            <button
              onClick={() => onConvertLeadToClient?.(lead.id)}
              className="p-1 text-[var(--crm-text-muted)] hover:text-teal-600 hover:bg-teal-50 dark:bg-teal-900/20 rounded-md transition-colors"
              title="Convert to Client"
            >
              <UserCheck size={13} />
            </button>
            <button
              onClick={() => setLeadToDelete(lead)}
              className="p-1 text-[var(--crm-text-muted)] hover:text-rose-600 hover:bg-rose-50 dark:bg-rose-500/10 rounded-md transition-colors"
              title="Delete Lead"
            >
              <Trash2 size={13} />
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className="space-y-4 relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isImporting && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="bg-[var(--crm-card)] p-6 rounded-xl shadow-2xl flex flex-col items-center gap-4 max-w-xs w-full text-center border border-[var(--crm-card-border)]">
            <div className="relative flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-4 border-[var(--crm-card-border)] animate-spin border-t-indigo-600" />
            </div>
            <div>
              <h4 className="font-medium text-[var(--crm-text)]">Importing CSV Leads...</h4>
              <p className="text-xs text-[var(--crm-subtitle)] mt-1">Reading records, checking duplicates, and inserting leads.</p>
            </div>
          </div>
        </div>
      )}

      {/* Header controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-[30px] sm:text-[32px] font-bold tracking-tight !text-white text-white font-structure leading-[1.2] section-main-heading">Leads</h1>
          <p className="!text-white text-white text-sm font-normal italic mt-1 section-sub-heading">Manage and track your agency leads and follow-ups.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleCSVImport} 
            accept=".csv" 
            className="hidden" 
          />

          <button
            id="leads-btn-import-csv"
            onClick={() => setShowDropZoneModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500/80 rounded-xl text-xs font-medium transition-all cursor-pointer shadow-sm shadow-emerald-600/20"
            title="Import leads from a CSV spreadsheet"
          >
            <UploadCloud size={16} className="text-white shrink-0" />
            <span className="text-white font-medium ">Import CSV</span>
          </button>

          <button
            id="leads-btn-add"
            onClick={openAddModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/20 cursor-pointer"
          >
            <Plus size={16} className="text-white shrink-0" />
            <span className="text-white font-medium ">Add Lead</span>
          </button>
          {onToggleFullScreen && (
            <button
              onClick={onToggleFullScreen}
              className={`px-3.5 py-2 text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer border ${
                isFullScreen 
                  ? 'bg-amber-600 text-white border-amber-600 hover:bg-amber-700' 
                  : 'bg-[var(--crm-card)] text-[var(--crm-text)] border-[var(--crm-card-border)] hover:bg-[var(--crm-sidebar)]'
              }`}
            >
              {isFullScreen ? (
                <>
                  <Minimize2 size={15} className="text-white shrink-0" />
                  <span className="text-white font-medium">Exit Full Screen</span>
                </>
              ) : (
                <>
                  <Maximize2 size={15} className="shrink-0" />
                  <span className="font-medium">Full Screen</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Search and Advanced Filters Toggle, and Columns Visibility Toggler */}
      <div className="bg-[var(--crm-card)] p-3 rounded-xl border border-[var(--crm-card-border)] shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-2.5 text-[var(--crm-text-secondary)]" size={16} />
          <input 
            id="global-lead-search"
            type="text"
            placeholder="Search leads by name, email, company, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2 bg-[var(--crm-sidebar)] hover:bg-[var(--crm-sidebar)]/80 focus:bg-[var(--crm-card)] text-[var(--crm-text)] placeholder-[var(--crm-text-secondary)] border border-[var(--crm-card-border)] rounded-lg outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs font-medium"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2.5 text-[var(--crm-text-muted)] hover:text-slate-600 dark:hover:text-[var(--crm-text)] p-0.5 rounded-full transition-colors cursor-pointer"
              title="Clear search filter"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {/* Advanced Filters Trigger */}
          <div className="relative">
            <button
              onClick={handleToggleFilter}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer select-none active:scale-95 ${
                isFilterOpen || activeFiltersCount > 0
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 text-indigo-700 shadow-xs animate-in'
                  : 'bg-[var(--crm-card)] border-[var(--crm-card-border)] text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar)]'
              }`}
            >
              <Filter size={13} />
              <span>Filter{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}</span>
            </button>

            {/* Filter Panel / Dropdown (Desktop and Mobile overlay) */}
            <AnimatePresence>
              {isFilterOpen && (
                <>
                  {/* Backdrop for click-outside */}
                  <div className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent" onClick={() => setIsFilterOpen(false)} />

                  {/* Desktop Dropdown Panel */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="hidden sm:block absolute right-0 top-full mt-2 w-[420px] bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl shadow-xl p-5 z-50 space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-[var(--crm-card-border)] pb-2">
                      <h4 className="font-medium text-[var(--crm-text)] text-sm">Lead Filters</h4>
                      <button onClick={() => setIsFilterOpen(false)} className="text-[var(--crm-text-muted)] hover:text-[var(--crm-text)]">
                        <X size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Pipeline Status */}
                      <div className="space-y-1 text-xs">
                        <label className="font-medium text-[var(--crm-text-secondary)] block">Pipeline Status</label>
                        <select
                          value={draftStatusFilter}
                          onChange={(e) => setDraftStatusFilter(e.target.value)}
                          className="w-full px-2 py-1.5 bg-[var(--crm-sidebar)] text-[var(--crm-text)] border border-[var(--crm-card-border)] rounded-md outline-hidden text-xs cursor-pointer"
                        >
                          <option value="All">All Stages</option>
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Follow Up">Follow Up</option>
                          <option value="Qualified">Qualified</option>
                          <option value="Closed">Closed</option>
                          <option value="Lost">Lost</option>
                        </select>
                      </div>

                      {/* Service Type */}
                      <div className="space-y-1 text-xs">
                        <label className="font-medium text-[var(--crm-text-secondary)] block">Service Type</label>
                        <select
                          value={draftCategoryFilter}
                          onChange={(e) => setDraftCategoryFilter(e.target.value)}
                          className="w-full px-2 py-1.5 bg-[var(--crm-sidebar)] text-[var(--crm-text)] border border-[var(--crm-card-border)] rounded-md outline-hidden text-xs cursor-pointer"
                        >
                          <option value="All">All Services</option>
                          {PREDEFINED_SERVICES.map(svc => (
                            <option key={svc} value={svc}>{svc}</option>
                          ))}
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {/* Lead Source */}
                      <div className="space-y-1 text-xs">
                        <label className="font-medium text-[var(--crm-text-secondary)] block">Lead Source</label>
                        <select
                          value={draftSourceFilter}
                          onChange={(e) => setDraftSourceFilter(e.target.value)}
                          className="w-full px-2 py-1.5 bg-[var(--crm-sidebar)] text-[var(--crm-text)] border border-[var(--crm-card-border)] rounded-md outline-hidden text-xs cursor-pointer"
                        >
                          <option value="All">All Sources</option>
                          {sourcesList.map(src => src && (
                            <option key={src} value={src}>{src}</option>
                          ))}
                        </select>
                      </div>

                      {/* Created Date */}
                      <div className="space-y-1 text-xs">
                        <label className="font-medium text-[var(--crm-text-secondary)] block">Created Date</label>
                        <select
                          value={draftDateRangeFilter}
                          onChange={(e) => setDraftDateRangeFilter(e.target.value)}
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

                      {/* Assigned Team Member */}
                      <div className="space-y-1 text-xs">
                        <label className="font-medium text-[var(--crm-text-secondary)] block">Assigned Team Member</label>
                        <select
                          value={draftAssignedToFilter}
                          onChange={(e) => setDraftAssignedToFilter(e.target.value)}
                          className="w-full px-2 py-1.5 bg-[var(--crm-sidebar)] text-[var(--crm-text)] border border-[var(--crm-card-border)] rounded-md outline-hidden text-xs cursor-pointer"
                        >
                          <option value="All">All Team Members</option>
                          <option value="Unassigned">Unassigned</option>
                          {teamMembers.map(m => (
                            <option key={m.id} value={m.fullName}>{m.fullName}</option>
                          ))}
                        </select>
                      </div>

                      {/* Lead Priority */}
                      <div className="space-y-1 text-xs">
                        <label className="font-medium text-[var(--crm-text-secondary)] block">Lead Priority</label>
                        <select
                          value={draftPriorityFilter}
                          onChange={(e) => setDraftPriorityFilter(e.target.value)}
                          className="w-full px-2 py-1.5 bg-[var(--crm-sidebar)] text-[var(--crm-text)] border border-[var(--crm-card-border)] rounded-md outline-hidden text-xs cursor-pointer font-medium"
                        >
                          <option value="All">All Priorities</option>
                          <option value="High">🔥 High Priority</option>
                          <option value="Medium">⚡ Medium Priority</option>
                          <option value="Low">🔹 Low Priority</option>
                        </select>
                      </div>

                      {/* Activity History */}
                      <div className="space-y-1 text-xs">
                        <label className="font-medium text-[var(--crm-text-secondary)] block">Activity History</label>
                        <select
                          value={draftActivityFilter}
                          onChange={(e) => setDraftActivityFilter(e.target.value)}
                          className="w-full px-2 py-1.5 bg-[var(--crm-sidebar)] text-[var(--crm-text)] border border-[var(--crm-card-border)] rounded-md outline-hidden text-xs cursor-pointer"
                        >
                          <option value="All">All Activity</option>
                          <option value="Contacted">Contacted (Any)</option>
                          <option value="Not Contacted">Not Contacted</option>
                          <option value="Has Email">Has Email</option>
                          <option value="Has Call">Has Call</option>
                          <option value="Has Conversation">Has Conversation</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-[var(--crm-card-border)] pt-3">
                      <button
                        onClick={handleClearFilters}
                        className="px-3 py-1.5 hover:bg-[var(--crm-sidebar)] text-[var(--crm-text-secondary)] text-xs rounded-lg transition-colors border border-[var(--crm-card-border)] cursor-pointer"
                      >
                        Clear Filters
                      </button>
                      <button
                        onClick={handleApplyFilters}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                      >
                        Apply Filters
                      </button>
                    </div>
                  </motion.div>

                  {/* Mobile Bottom Sheet/Modal */}
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="sm:hidden fixed bottom-0 left-0 right-0 bg-[var(--crm-card)] rounded-t-2xl shadow-2xl p-5 z-50 max-h-[85vh] overflow-y-auto space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-[var(--crm-card-border)] pb-2">
                      <h4 className="font-medium text-[var(--crm-text)] text-sm">Lead Filters</h4>
                      <button onClick={() => setIsFilterOpen(false)} className="text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] p-1">
                        <X size={18} />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {/* Pipeline Status */}
                      <div className="space-y-1 text-xs">
                        <label className="font-medium text-[var(--crm-text-secondary)] block">Pipeline Status</label>
                        <select
                          value={draftStatusFilter}
                          onChange={(e) => setDraftStatusFilter(e.target.value)}
                          className="w-full px-3 py-2 bg-[var(--crm-sidebar)] text-[var(--crm-text)] border border-[var(--crm-card-border)] rounded-lg outline-hidden text-xs cursor-pointer"
                        >
                          <option value="All">All Stages</option>
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Follow Up">Follow Up</option>
                          <option value="Qualified">Qualified</option>
                          <option value="Closed">Closed</option>
                          <option value="Lost">Lost</option>
                        </select>
                      </div>

                      {/* Service Type */}
                      <div className="space-y-1 text-xs">
                        <label className="font-medium text-[var(--crm-text-secondary)] block">Service Type</label>
                        <select
                          value={draftCategoryFilter}
                          onChange={(e) => setDraftCategoryFilter(e.target.value)}
                          className="w-full px-3 py-2 bg-[var(--crm-sidebar)] text-[var(--crm-text)] border border-[var(--crm-card-border)] rounded-lg outline-hidden text-xs cursor-pointer"
                        >
                          <option value="All">All Services</option>
                          {PREDEFINED_SERVICES.map(svc => (
                            <option key={svc} value={svc}>{svc}</option>
                          ))}
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {/* Lead Source */}
                      <div className="space-y-1 text-xs">
                        <label className="font-medium text-[var(--crm-text-secondary)] block">Lead Source</label>
                        <select
                          value={draftSourceFilter}
                          onChange={(e) => setDraftSourceFilter(e.target.value)}
                          className="w-full px-3 py-2 bg-[var(--crm-sidebar)] text-[var(--crm-text)] border border-[var(--crm-card-border)] rounded-lg outline-hidden text-xs cursor-pointer"
                        >
                          <option value="All">All Sources</option>
                          {sourcesList.map(src => src && (
                            <option key={src} value={src}>{src}</option>
                          ))}
                        </select>
                      </div>

                      {/* Created Date */}
                      <div className="space-y-1 text-xs">
                        <label className="font-medium text-[var(--crm-text-secondary)] block">Created Date</label>
                        <select
                          value={draftDateRangeFilter}
                          onChange={(e) => setDraftDateRangeFilter(e.target.value)}
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

                      {/* Assigned Team Member */}
                      <div className="space-y-1 text-xs">
                        <label className="font-medium text-[var(--crm-text-secondary)] block">Assigned Team Member</label>
                        <select
                          value={draftAssignedToFilter}
                          onChange={(e) => setDraftAssignedToFilter(e.target.value)}
                          className="w-full px-3 py-2 bg-[var(--crm-sidebar)] text-[var(--crm-text)] border border-[var(--crm-card-border)] rounded-lg outline-hidden text-xs cursor-pointer"
                        >
                          <option value="All">All Team Members</option>
                          <option value="Unassigned">Unassigned</option>
                          {teamMembers.map(m => (
                            <option key={m.id} value={m.fullName}>{m.fullName}</option>
                          ))}
                        </select>
                      </div>

                      {/* Lead Priority */}
                      <div className="space-y-1 text-xs">
                        <label className="font-medium text-[var(--crm-text-secondary)] block">Lead Priority</label>
                        <select
                          value={draftPriorityFilter}
                          onChange={(e) => setDraftPriorityFilter(e.target.value)}
                          className="w-full px-3 py-2 bg-[var(--crm-sidebar)] text-[var(--crm-text)] border border-[var(--crm-card-border)] rounded-lg outline-hidden text-xs cursor-pointer font-medium"
                        >
                          <option value="All">All Priorities</option>
                          <option value="High">🔥 High Priority</option>
                          <option value="Medium">⚡ Medium Priority</option>
                          <option value="Low">🔹 Low Priority</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t border-[var(--crm-card-border)]">
                      <button
                        onClick={handleClearFilters}
                        className="flex-1 py-2.5 bg-[var(--crm-sidebar)] hover:bg-[var(--crm-sidebar)]/80 text-[var(--crm-text-secondary)] text-xs rounded-xl transition-all text-center cursor-pointer"
                      >
                        Clear Filters
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

          {/* Column Visibility Selector Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowColumnDropdown(!showColumnDropdown)}
              className="px-3 py-1.5 bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-lg text-xs font-medium text-[var(--crm-text)] hover:bg-[var(--crm-sidebar)] flex items-center gap-1.5 cursor-pointer"
            >
              <Columns size={13} />
              <span>Columns</span>
              <ChevronDown size={11} className="text-[var(--crm-text-muted)]" />
            </button>

            {showColumnDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowColumnDropdown(false)} />
                <div className="absolute right-0 mt-1.5 w-52 bg-[var(--crm-card)] rounded-lg border border-[var(--crm-card-border)] shadow-lg z-50 p-2 space-y-1">
                  <div className="text-[10px]  font-medium text-[var(--crm-text-muted)] px-2 py-1 border-b border-[var(--crm-card-border)]">
                    Toggle Column Visibility
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1">
                    {columnsDef.map(col => {
                      if (col.id === 'checkbox' || col.id === 'actions') return null;
                      return (
                        <label key={col.id} className="flex items-center gap-2 px-2 py-1 hover:bg-[var(--crm-sidebar)] rounded text-xs text-[var(--crm-text-secondary)] cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={visibleColumns[col.id] !== false}
                            onChange={() => setVisibleColumns(prev => ({
                              ...prev,
                              [col.id]: !prev[col.id]
                            }))}
                            disabled={col.id === 'name'}
                            className="rounded border-[var(--crm-card-border)] text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                          />
                          <span>{col.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  <div className="pt-1.5 border-t border-[var(--crm-card-border)] flex justify-between px-2">
                    <button
                      onClick={() => {
                        const allVisible: Record<string, boolean> = {};
                        columnsDef.forEach(c => allVisible[c.id] = true);
                        setVisibleColumns(allVisible);
                      }}
                      className="text-[10px] font-semibold text-indigo-600 hover:underline"
                    >
                      Show All
                    </button>
                    <button
                      onClick={() => {
                        const defaults: Record<string, boolean> = {};
                        columnsDef.forEach(c => {
                          defaults[c.id] = ['id', 'name', 'company', 'category', 'source', 'priority', 'status', 'actions'].includes(c.id);
                        });
                        setVisibleColumns(defaults);
                      }}
                      className="text-[10px] font-medium text-[var(--crm-text-muted)] hover:underline"
                    >
                      Reset Defaults
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Reset Filters Shortcut */}
          {(search || statusFilter !== 'All' || sourceFilter !== 'All' || categoryFilter !== 'All' || priorityFilter !== 'All' || assignedToFilter !== 'All' || dateRangeFilter !== 'All') && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('All');
                setSourceFilter('All');
                setCategoryFilter('All');
                setPriorityFilter('All');
                setAssignedToFilter('All');
                setDateRangeFilter('All');
                setSortField('createdAt');
                setSortDirection('desc');
                setSelectedLeadIds([]);
              }}
              className="p-1.5 text-[var(--crm-text-secondary)] hover:text-[var(--crm-text)] hover:bg-[var(--crm-sidebar)] rounded-lg transition-colors cursor-pointer"
              title="Reset All Filters"
            >
              <RefreshCw size={14} className="animate-spin-once" />
            </button>
          )}
        </div>
      </div>



      {/* Sticky/Responsive Batch Actions Banner */}
      {selectedLeadIds.length > 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-md animate-in fade-in slide-in-from-top-3 duration-200 z-30 relative">
          <div className="flex items-center gap-2">
            <span className="h-5 w-5 bg-indigo-600 text-white text-[10px] font-semibold rounded-full flex items-center justify-center shadow-xs shrink-0">
              {selectedLeadIds.length}
            </span>
            <span className="text-xs font-semibold text-indigo-950 dark:text-indigo-200">leads selected inside spreadsheet</span>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap gap-1.5">
            {/* Convert to Client */}
            <button
              onClick={handleBulkConvert}
              className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-xs active:scale-98"
              title="Add these leads as active clients"
            >
              <UserCheck size={13} /> Convert to Client
            </button>

            {/* Bulk Assign dropdown trigger */}
            <div className="relative">
              <button
                onClick={() => { setShowBulkAssignDropdown(!showBulkAssignDropdown); setShowBulkStatusDropdown(false); }}
                className="px-2.5 py-1.5 bg-[var(--crm-card)] hover:bg-[var(--crm-sidebar)] text-slate-800 dark:text-slate-100 border border-[var(--crm-card-border)] text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-xs font-medium"
              >
                <span>Assign To</span>
                <ChevronDown size={11} className="text-slate-500 dark:text-slate-400" />
              </button>
              {showBulkAssignDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowBulkAssignDropdown(false)} />
                  <div className="absolute right-0 bottom-full mb-1.5 w-48 bg-[var(--crm-card)] rounded-lg border border-[var(--crm-card-border)] shadow-lg z-50 p-1">
                    <button
                      onClick={() => handleBulkAssign('Unassigned')}
                      className="w-full text-left px-2 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-800 dark:text-slate-100 font-medium"
                    >
                      Unassign Leads
                    </button>
                    {teamMembers.map(member => (
                      <button
                        key={member.id}
                        onClick={() => handleBulkAssign(member.fullName)}
                        className="w-full text-left px-2 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-800 dark:text-slate-100 font-medium flex items-center gap-1.5"
                      >
                        <div className="h-4 w-4 rounded-full bg-indigo-600 text-white text-[8px] font-medium flex items-center justify-center">
                          {getInitials(member.fullName)}
                        </div>
                        <span className="truncate">{member.fullName}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Change Status dropdown trigger */}
            <div className="relative">
              <button
                onClick={() => { setShowBulkStatusDropdown(!showBulkStatusDropdown); setShowBulkAssignDropdown(false); }}
                className="px-2.5 py-1.5 bg-[var(--crm-card)] hover:bg-[var(--crm-sidebar)] text-[var(--crm-text-secondary)] border border-[var(--crm-card-border)] text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <span>Change Status</span>
                <ChevronDown size={11} className="text-[var(--crm-text-muted)]" />
              </button>
              {showBulkStatusDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowBulkStatusDropdown(false)} />
                  <div className="absolute right-0 bottom-full mb-1.5 w-44 bg-[var(--crm-card)] rounded-lg border border-[var(--crm-card-border)] shadow-lg z-50 p-1 space-y-0.5">
                    {['New', 'Contacted', 'Follow Up', 'Qualified', 'Closed', 'Lost'].map(status => (
                      <button
                        key={status}
                        onClick={() => handleBulkStatusChange(status as Lead['status'])}
                        className="w-full text-left px-2 py-1 text-xs hover:bg-[var(--crm-sidebar)] rounded text-[var(--crm-text-secondary)] flex items-center justify-between"
                      >
                        <span>{status}</span>
                        <span className={`h-2 w-2 rounded-full ${
                          status === 'New' ? 'bg-blue-50 dark:bg-blue-500/10' :
                          status === 'Contacted' ? 'bg-indigo-50 dark:bg-indigo-500/10' :
                          status === 'Follow Up' ? 'bg-amber-50 dark:bg-amber-500/10' :
                          status === 'Qualified' ? 'bg-purple-50 dark:bg-purple-900/20' :
                          status === 'Closed' ? 'bg-teal-50 dark:bg-teal-900/20' : 'bg-rose-50 dark:bg-rose-500/10'
                        }`} />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Export Selected */}
            <button
              onClick={() => {
                const selectedLeads = leads.filter(l => selectedLeadIds.includes(l.id));
                exportToCSV(selectedLeads, 'leads_export');
              }}
              className="px-2.5 py-1.5 bg-[var(--crm-card)] hover:bg-[var(--crm-sidebar)] text-[var(--crm-text-secondary)] border border-[var(--crm-card-border)] text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
              title="Download selected as CSV spreadsheet file"
            >
              <Download size={13} /> Export CSV
            </button>

            {/* Delete Selected */}
            <button
              onClick={handleDeleteBulk}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-xs shadow-rose-600/10 active:scale-98"
            >
              <Trash2 size={13} /> Delete
            </button>

            <button
              onClick={() => setSelectedLeadIds([])}
              className="px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100/50 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Spreadsheet Main Grid Table with column headers, sticky left cols, sorting and dnd */}
      {filteredAndSortedLeads.length === 0 ? (
        <div className="bg-[var(--crm-card)] p-12 text-center rounded-xl border border-[var(--crm-card-border)] shadow-xs flex flex-col items-center justify-center space-y-3">
          <div className="p-3 bg-[var(--crm-sidebar)] text-[var(--crm-text-muted)] rounded-full">
            <Search size={24} />
          </div>
          <div>
            <h4 className="text-sm font-medium text-[var(--crm-text)]">No leads matched your filter criteria</h4>
            <p className="text-[var(--crm-subtitle)] text-xs mt-0.5">Try broadening your search query or reset filters using the button below.</p>
          </div>
          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('All');
              setSourceFilter('All');
              setCategoryFilter('All');
              setPriorityFilter('All');
              setAssignedToFilter('All');
              setDateRangeFilter('All');
              setSelectedLeadIds([]);
            }}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-50 dark:bg-indigo-500/10 text-white text-xs font-medium rounded-lg transition-all shadow-xs cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="bg-[var(--crm-card)] rounded-xl border border-[var(--crm-card-border)] shadow-xs overflow-hidden flex flex-col">
          {/* DESKTOP SPREADSHEET GRID */}
          <div 
            className="hidden md:block overflow-x-auto overflow-y-auto w-full relative scroll-smooth border-b border-[var(--crm-card-border)]" 
            style={{ maxHeight: isFullScreen ? 'calc(100vh - 170px)' : 'calc(100vh - 280px)' }}
          >
            <table id="leads-table-light" className="w-full text-left border-collapse text-xs table-fixed">
              {/* Sticky Header Row */}
              <thead className="sticky top-0 z-30 bg-[var(--crm-sidebar)] border-b border-[var(--crm-card-border)] shadow-[0_1px_0_0_var(--crm-card-border)]">
                <tr>
                  {/* Pinned Checkbox Header Column (Visible only in Selection Mode) */}
                  {selectedLeadIds.length > 0 && (
                    <th 
                      className="sticky left-0 bg-[var(--crm-sidebar)] z-40 text-center border-r border-[var(--crm-card-border)]"
                      style={{ width: '48px', minWidth: '48px' }}
                    >
                      <div className="flex items-center justify-center h-9">
                        <input 
                          type="checkbox" 
                          checked={paginatedLeads.length > 0 && paginatedLeads.every(l => selectedLeadIds.includes(l.id))}
                          onChange={() => handleToggleSelectAll(paginatedLeads)}
                          className="rounded border-[var(--crm-card-border)] text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                        />
                      </div>
                    </th>
                  )}

                  {/* Dynamic mapped headers according to order & visibility */}
                  {columnOrder.map((colId) => {
                    const isVisible = visibleColumns[colId] !== false;
                    if (!isVisible) return null;

                    const isFrozen = isColumnFrozen(colId);
                    const leftOffset = getStickyLeftOffset(colId);
                    const colWidth = columnWidths[colId] || 150;
                    const colLabel = columnsDef.find(c => c.id === colId)?.label || '';

                    const isBeingDragged = draggedColumn === colId;
                    const isDraggedOver = dragOverColumn === colId;

                    return (
                      <th
                        key={colId}
                        draggable={colId !== 'actions'}
                        onDragStart={(e) => {
                          setDraggedColumn(colId);
                          e.dataTransfer.setData('text/plain', colId);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (draggedColumn && draggedColumn !== colId) {
                            setDragOverColumn(colId);
                          }
                        }}
                        onDragEnd={() => {
                          setDraggedColumn(null);
                          setDragOverColumn(null);
                        }}
                        onDrop={() => {
                          if (draggedColumn && draggedColumn !== colId) {
                            handleReorderColumns(draggedColumn, colId);
                          }
                        }}
                        className={`p-0 h-9 relative border-b border-r border-[var(--crm-card-border)] group select-none font-semibold text-[var(--crm-text)] text-[10px] ${
                          isFrozen ? 'sticky z-40 bg-[var(--crm-sidebar)] ' : ''
                        } ${isBeingDragged ? 'opacity-30' : ''} ${
                          isDraggedOver ? 'border-l-2 border-l-indigo-600' : ''
                        }`}
                        style={{
                          width: `${colWidth}px`,
                          minWidth: `${colWidth}px`,
                          left: isFrozen && leftOffset !== null ? `${leftOffset}px` : undefined
                        }}
                      >
                        {/* Header inner content layout */}
                        <div 
                          onClick={() => colId !== 'actions' && handleSort(colId)}
                          className={`flex items-center justify-between px-3 h-full w-full ${
                            colId !== 'actions' ? 'cursor-pointer hover:bg-zinc-100/80 hover:bg-[var(--crm-sidebar-active-bg)]/60 transition-colors' : ''
                          }`}
                          title={colId !== 'actions' ? `Click to sort by ${colLabel}` : undefined}
                        >
                          <span className="truncate">{colLabel}</span>
                          
                          {/* Sort indicators */}
                          {colId !== 'actions' && (
                            <div className="flex items-center text-[var(--crm-text-muted)] ml-1 shrink-0">
                              {sortField === colId ? (
                                sortDirection === 'asc' ? (
                                  <ArrowUp size={12} className="text-indigo-600 dark:text-indigo-400 font-medium stroke-[3]" />
                                ) : (
                                  <ArrowDown size={12} className="text-indigo-600 dark:text-indigo-400 font-medium stroke-[3]" />
                                )
                              ) : (
                                <ArrowUpDown size={11} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                              )}
                            </div>
                          )}
                        </div>

                        {/* Frozen indicator locked visual cue */}
                        {isFrozen && colId !== 'checkbox' && (
                          <div className="absolute top-1 right-2 text-slate-300 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                            <Lock size={8} />
                          </div>
                        )}

                        {/* Column resizer drag handle */}
                        <div
                          onMouseDown={(e) => handleResizeStart(colId, e)}
                          onTouchStart={(e) => handleResizeStart(colId, e)}
                          className="absolute right-0 top-0 bottom-0 w-2 hover:bg-indigo-600 cursor-col-resize z-45 group/handle"
                        >
                          <div className="absolute right-0 top-1.5 bottom-1.5 w-[1px] bg-[var(--crm-card-border)] group-hover/handle:bg-indigo-600" />
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Grid Body */}
              <tbody className="divide-y divide-zinc-100 dark:divide-[#30353D] text-[var(--crm-text)]">
                {paginatedLeads.map((lead, rowIndex) => {
                  const isSelected = selectedLeadIds.includes(lead.id);
                  // Row highlight and hover styles
                  const rowBgClass = isSelected 
                    ? 'bg-indigo-50/70 dark:bg-indigo-500/10 hover:bg-indigo-100/50 ' 
                    : rowIndex % 2 === 0 
                      ? 'bg-[var(--crm-card)] hover:bg-[var(--crm-sidebar)]/50 ' 
                      : 'bg-[var(--crm-sidebar)]/30 hover:bg-[var(--crm-sidebar)]/50 ';

                  return (
                    <tr
                      key={lead.id}
                      className={`cursor-pointer group transition-colors select-text text-xs border-b border-[var(--crm-card-border)] ${rowBgClass} ${isSelected ? 'selected-row' : ''}`}
                      {...getPressHandlers(lead.id, () => setSelectedLead(lead))}
                    >
                      {/* Frozen Checkbox Column (Visible only in Selection Mode) */}
                      {selectedLeadIds.length > 0 && (
                        <td 
                          className={`sticky left-0 text-center border-r border-[var(--crm-card-border)] z-20 transition-colors ${
                            isSelected 
                              ? 'bg-indigo-50 dark:bg-indigo-500/10 border-l-2 border-l-indigo-600 ' 
                              : rowIndex % 2 === 0 
                                ? 'bg-[var(--crm-card)] group-hover:bg-[var(--crm-sidebar)]/50 ' 
                                : 'bg-[var(--crm-sidebar)] group-hover:bg-[var(--crm-sidebar)]/50 '
                          }`}
                          style={{ width: '48px', minWidth: '48px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSelectLead(lead.id);
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-center h-9">
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => handleToggleSelectLead(lead.id)}
                              className="rounded border-[var(--crm-card-border)] text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                            />
                          </div>
                        </td>
                      )}

                      {/* Dynamic columns mapping */}
                      {columnOrder.map((colId) => {
                        const isVisible = visibleColumns[colId] !== false;
                        if (!isVisible) return null;

                        const isFrozen = isColumnFrozen(colId);
                        const leftOffset = getStickyLeftOffset(colId);
                        const colWidth = columnWidths[colId] || 150;

                        // Solid opaque backgrounds for frozen columns on scroll & hover
                        const frozenCellBgClass = isFrozen
                          ? isSelected
                            ? 'bg-indigo-50/70 dark:bg-indigo-500/10 group-hover:bg-indigo-100/50 '
                            : rowIndex % 2 === 0
                              ? 'bg-[var(--crm-card)] group-hover:bg-[var(--crm-sidebar)]/50 '
                              : 'bg-[var(--crm-sidebar)]/30 group-hover:bg-[var(--crm-sidebar)]/50 '
                          : '';

                        return (
                          <td
                            key={colId}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              if (colId !== 'actions' && colId !== 'createdAt' && colId !== 'updatedAt') {
                                setEditingCell({ leadId: lead.id, field: colId });
                              }
                            }}
                            className={`px-3 py-1.5 h-9 align-middle border-b border-r border-[var(--crm-card-border)] truncate text-[var(--crm-text)] font-medium transition-colors ${
                              isFrozen ? `sticky z-20 font-semibold ${frozenCellBgClass}` : ''
                            }`}
                            style={{
                              width: `${colWidth}px`,
                              minWidth: `${colWidth}px`,
                              left: isFrozen && leftOffset !== null ? `${leftOffset}px` : undefined
                            }}
                            title="Double-click cell to edit inline"
                          >
                            {renderCellContent(lead, colId)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARD/TABLE HYBRID LIST */}
          <div id="leads-mobile-list" className="block md:hidden p-3 bg-[var(--crm-sidebar)] border-b border-[var(--crm-card-border)] space-y-3 max-h-[calc(100vh-360px)] overflow-y-auto scroll-smooth">
            {/* Mobile Selection Action Bar */}
            {selectedLeadIds.length > 0 && (
              <div className="bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl p-3 flex items-center justify-between text-xs text-[var(--crm-text-secondary)] shadow-2xs">
                <label className="flex items-center gap-2 cursor-pointer font-medium select-none">
                  <input 
                    type="checkbox" 
                    checked={paginatedLeads.length > 0 && paginatedLeads.every(l => selectedLeadIds.includes(l.id))}
                    onChange={() => handleToggleSelectAll(paginatedLeads)}
                    className="rounded border-[var(--crm-card-border)] text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                  />
                  <span>Select All ({paginatedLeads.length})</span>
                </label>
                <div className="text-[10px] font-semibold text-[var(--crm-text-muted)]  ">
                  {filteredAndSortedLeads.length} Total Leads
                </div>
              </div>
            )}

            {/* List of Mobile Cards */}
            <div className="space-y-2.5">
              {paginatedLeads.map((lead, rowIndex) => {
                const isSelected = selectedLeadIds.includes(lead.id);
                const isExpanded = !!expandedLeads[lead.id];
                
                const cardBg = isSelected 
                  ? 'bg-indigo-50/70 dark:bg-indigo-500/10 border-indigo-300 shadow-sm  ' 
                  : 'bg-[var(--crm-card)] border-[var(--crm-card-border)] hover:border-[var(--crm-card-border)] hover:bg-[var(--crm-sidebar)]/50 ';

                return (
                  <div 
                    key={lead.id}
                    className={`mobile-card rounded-xl border p-4 transition-all cursor-pointer ${cardBg} ${isSelected ? 'selected-card' : ''}`}
                    {...getPressHandlers(lead.id, () => setSelectedLead(lead))}
                  >
                    {/* Card Title & Checkbox */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        {selectedLeadIds.length > 0 && (
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => handleToggleSelectLead(lead.id)}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            className="rounded border-[var(--crm-card-border)] text-indigo-600 focus:ring-indigo-500 h-4 w-4 shrink-0 cursor-pointer"
                          />
                        )}
                        <div className="min-w-0">
                          <h4 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLead(lead);
                            }} 
                            className="font-medium text-[var(--crm-text)] truncate hover:text-indigo-600 cursor-pointer text-sm"
                          >
                            {lead.name}
                          </h4>
                          <span className="font-mono text-[9px] text-indigo-600 font-semibold bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-100 inline-block mt-0.5">
                            {lead.id.startsWith('lead-') ? `LD-${lead.id.split('-')[1]?.substring(0,4).toUpperCase() || lead.id.substring(5,9).toUpperCase()}` : lead.id.substring(0,6).toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Card Header Actions */}
                      <div 
                        className="flex items-center gap-1 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setSelectedLead(lead)}
                          className="p-1.5 text-[var(--crm-text-muted)] hover:text-indigo-600 hover:bg-[var(--crm-sidebar-active-bg)] rounded-lg transition-colors"
                          title="View Profile"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => openEditModal(lead)}
                          className="p-1.5 text-[var(--crm-text-muted)] hover:text-indigo-600 hover:bg-[var(--crm-sidebar-active-bg)] rounded-lg transition-colors"
                          title="Edit Lead"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => onConvertLeadToClient?.(lead.id)}
                          className="p-1.5 text-[var(--crm-text-muted)] hover:text-teal-600 hover:bg-teal-50 dark:bg-teal-900/20 rounded-lg transition-colors"
                          title="Convert to Client"
                        >
                          <UserCheck size={14} />
                        </button>
                        <button
                          onClick={() => setLeadToDelete(lead)}
                          className="p-1.5 text-[var(--crm-text-muted)] hover:text-rose-600 hover:bg-rose-50 dark:bg-rose-500/10 rounded-lg transition-colors"
                          title="Delete Lead"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Direct Contact Details & Actions Row */}
                    <div className="mt-3 pt-2 border-t border-[var(--crm-card-border)] flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0 flex-1 space-y-1">
                        {lead.company && (
                          <div className="flex items-center gap-1.5 text-[var(--crm-text)]  text-xs truncate">
                            <Building2 size={12} className="text-[var(--crm-text-muted)] shrink-0" />
                            <span className="truncate">{lead.company}</span>
                          </div>
                        )}
                        {lead.email && (
                          <div className="flex items-center gap-1.5 text-[var(--crm-text-secondary)] text-xs truncate">
                            <Mail size={12} className="text-[var(--crm-text-muted)] shrink-0" />
                            <span className="truncate">{lead.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-[var(--crm-text)] text-xs truncate ">
                          <Phone size={12} className="text-[var(--crm-text-muted)] shrink-0" />
                          <span className="truncate">{lead.phone || '—'}</span>
                        </div>
                      </div>

                      {/* Touch-Friendly Action Buttons (WhatsApp & Website) */}
                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {(() => {
                          const cleanPhone = (lead.phone || '').replace(/[^0-9]/g, '');
                          const hasValidPhone = cleanPhone.length >= 7;
                          const whatsappUrl = `https://wa.me/${cleanPhone}`;
                          return hasValidPhone ? (
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 hover:bg-emerald-100 active:scale-95 rounded-lg transition-all flex items-center justify-center min-w-[34px] min-h-[34px]"
                              title={`WhatsApp ${lead.phone}`}
                            >
                              <WhatsAppIcon className="w-4 h-4" />
                            </a>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="p-2 bg-[var(--crm-sidebar)] text-slate-300 rounded-lg opacity-40 cursor-not-allowed flex items-center justify-center min-w-[34px] min-h-[34px]"
                              title="WhatsApp Unavailable"
                            >
                              <WhatsAppIcon className="w-4 h-4" />
                            </button>
                          );
                        })()}

                        {(() => {
                          const rawWeb = lead.websiteUrl || (lead as any).website || '';
                          const hasWebsite = Boolean(rawWeb && rawWeb.trim());
                          const webUrl = hasWebsite ? (/^https?:\/\//i.test(rawWeb.trim()) ? rawWeb.trim() : `https://${rawWeb.trim()}`) : '';
                          return hasWebsite ? (
                            <a
                              href={webUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 hover:bg-blue-100 active:scale-95 rounded-lg transition-all flex items-center justify-center min-w-[34px] min-h-[34px]"
                              title={`Open Website: ${rawWeb}`}
                            >
                              <Globe size={16} />
                            </a>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="p-2 bg-[var(--crm-sidebar)] text-slate-300 rounded-lg opacity-40 cursor-not-allowed flex items-center justify-center min-w-[34px] min-h-[34px]"
                              title="Website Unavailable"
                            >
                              <Globe size={16} />
                            </button>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Source & Status Badges */}
                    <div className="flex flex-wrap items-center gap-2 mt-2.5">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 text-indigo-700 text-[10px]  font-medium">
                        {lead.source || 'Website'}
                      </span>
                      <span className={`text-[10px] font-medium border px-2 py-0.5 rounded-full ${getStatusBadgeClass(lead.status)}`}>
                        {lead.status}
                      </span>
                    </div>

                    {/* Extra details expanded view */}
                    {isExpanded && (
                      <div className="mt-4 pt-3 border-t border-zinc-150 text-xs space-y-2 text-[var(--crm-text-secondary)] animate-in fade-in duration-200">
                        {lead.company && (
                          <div className="flex justify-between py-1 border-b border-[var(--crm-card-border)]/50">
                            <span className="text-[var(--crm-text-muted)] ">Company:</span>
                            <span className="font-medium text-[var(--crm-text)]">{lead.company}</span>
                          </div>
                        )}
                        {lead.phone && (
                          <div className="flex justify-between py-1 border-b border-[var(--crm-card-border)]/50">
                            <span className="text-[var(--crm-text-muted)] ">Phone:</span>
                            <span className="font-medium text-[var(--crm-text)]">{lead.phone}</span>
                          </div>
                        )}
                        {lead.email && (
                          <div className="flex justify-between py-1 border-b border-[var(--crm-card-border)]/50">
                            <span className="text-[var(--crm-text-muted)] ">Email:</span>
                            <span className="font-medium text-[var(--crm-text)] truncate max-w-[200px] 2xl:max-w-[350px] 3xl:max-w-[600px] 4k:max-w-none">{lead.email}</span>
                          </div>
                        )}
                        {lead.value !== undefined && (
                          <div className="flex justify-between py-1 border-b border-[var(--crm-card-border)]/50">
                            <span className="text-[var(--crm-text-muted)] ">Budget:</span>
                            <span className="font-semibold text-[var(--crm-text)]">${Number(lead.value).toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between py-1 border-b border-[var(--crm-card-border)]/50">
                          <span className="text-[var(--crm-text-muted)] ">Assigned To:</span>
                          <span className="font-medium text-[var(--crm-text)]">{lead.assignedTeamMember || 'Unassigned'}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-[var(--crm-text-muted)] ">Created Date:</span>
                          <span className="text-[var(--crm-text-secondary)] ">
                            {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                          </span>
                        </div>
                        {lead.notes && (
                          <div className="bg-[var(--crm-sidebar)] p-2.5 rounded-lg border border-zinc-150 mt-2 text-[11px] leading-relaxed text-[var(--crm-text)]">
                            <span className="font-medium text-[var(--crm-text-secondary)] block mb-0.5">Notes:</span>
                            {lead.notes}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bottom triggers */}
                    <div 
                      className="flex items-center justify-between gap-2 mt-4 pt-2 border-t border-[var(--crm-card-border)]"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLead(lead);
                        }}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        <ExternalLink size={12} /> Profile
                      </button>
                      <button
                        onClick={(e) => toggleExpandLead(lead.id, e)}
                        className="px-3 py-1 bg-[var(--crm-sidebar)] hover:bg-slate-200 text-[var(--crm-text)] text-xs  rounded-lg border border-[var(--crm-card-border)] flex items-center gap-1 active:scale-95 transition-all"
                      >
                        <span>{isExpanded ? 'View Less' : 'View More'}</span>
                        <ChevronDown size={12} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid Footer with pagination and total items */}
          <div className="bg-[#F8FAFC] px-4 py-2.5 border-t border-[var(--crm-card-border)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--crm-text-secondary)] ">
            {/* Total items display */}
            <div className="flex items-center gap-1.5">
              <span>Showing</span>
              <span className="font-medium text-[var(--crm-text)]">
                {filteredAndSortedLeads.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}
              </span>
              <span>to</span>
              <span className="font-medium text-[var(--crm-text)]">
                {Math.min(currentPage * rowsPerPage, filteredAndSortedLeads.length)}
              </span>
              <span>of</span>
              <span className="font-medium text-[var(--crm-text)] bg-slate-200/60 px-2 py-0.5 rounded-full text-[11px]">
                {filteredAndSortedLeads.length} leads
              </span>
              {selectedLeadIds.length > 0 && (
                <span className="text-indigo-600 font-medium bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 px-2 py-0.5 rounded-full text-[10px]">
                  {selectedLeadIds.length} selected
                </span>
              )}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-4">
              {/* Rows Per Page */}
              <div className="flex items-center gap-1.5">
                <span>Rows per page:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-[#FFFFFF] border border-[#E2E8F0] border-[var(--crm-card-border)] rounded px-1.5 py-0.5 text-xs text-[var(--crm-text)] outline-hidden focus:ring-1 focus:ring-indigo-500  cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* Arrow navigation buttons */}
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  className="p-1 rounded bg-[var(--crm-card)] hover:bg-[var(--crm-sidebar-active-bg)] border border-[var(--crm-card-border)] text-[var(--crm-text)] disabled:opacity-40 disabled:hover:bg-[var(--crm-card)] hover:bg-[var(--crm-sidebar-active-bg)] cursor-pointer"
                  title="First Page"
                >
                  <ChevronLeft size={13} className="stroke-[2.5]" />
                </button>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="px-2 py-1 rounded bg-[var(--crm-card)] hover:bg-[var(--crm-sidebar-active-bg)] border border-[var(--crm-card-border)] text-[var(--crm-text)]  text-xs disabled:opacity-40 disabled:hover:bg-[var(--crm-card)] hover:bg-[var(--crm-sidebar-active-bg)] flex items-center gap-0.5 cursor-pointer"
                >
                  <ChevronLeft size={13} /> Prev
                </button>
                
                <span className="text-[var(--crm-text)] px-1 ">
                  Page {currentPage} <span className="text-[var(--crm-text-muted)]">/</span> {totalPages}
                </span>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="px-2 py-1 rounded bg-[var(--crm-card)] hover:bg-[var(--crm-sidebar-active-bg)] border border-[var(--crm-card-border)] text-[var(--crm-text)]  text-xs disabled:opacity-40 disabled:hover:bg-[var(--crm-card)] hover:bg-[var(--crm-sidebar-active-bg)] flex items-center gap-0.5 cursor-pointer"
                >
                  Next <ChevronRight size={13} />
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className="p-1 rounded bg-[var(--crm-card)] hover:bg-[var(--crm-sidebar-active-bg)] border border-[var(--crm-card-border)] text-[var(--crm-text)] disabled:opacity-40 disabled:hover:bg-[var(--crm-card)] hover:bg-[var(--crm-sidebar-active-bg)] cursor-pointer"
                  title="Last Page"
                >
                  <ChevronRight size={13} className="stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal Backdrop */}
      {triggerAddForm && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="bg-[var(--crm-card)] rounded-xl shadow-2xl border border-[var(--crm-card-border)] max-w-lg 2xl:max-w-xl 3xl:max-w-2xl 4k:max-w-3xl 5k:max-w-4xl w-full overflow-hidden text-[var(--crm-text)]"
          >
            <div className="bg-[var(--crm-sidebar)] text-[var(--crm-text)] p-4 flex items-center justify-between border-b border-[var(--crm-card-border)]">
              <h3 className="font-medium tracking-tight text-sm  text-[var(--crm-text)]">
                {isEditing ? 'Edit Existing Lead' : 'Add New Lead Prospect'}
              </h3>
              <button 
                onClick={() => { setTriggerAddForm(false); setSelectedLead(null); }}
                className="text-[var(--crm-text-muted)] hover:text-[var(--crm-text-secondary)] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitLead} className="p-6 space-y-4 text-sm text-[var(--crm-text)] max-h-[80vh] overflow-y-auto bg-[var(--crm-card)]">
              {validationError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium">
                  {validationError}
                </div>
              )}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Lead ID */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--crm-text-secondary)] block">Lead ID *</label>
                  <input 
                    type="text"
                    required
                    disabled={isEditing}
                    value={formLeadId}
                    onChange={(e) => setFormLeadId(e.target.value)}
                    placeholder="e.g. L005"
                    className="w-full px-3 py-2 border border-[var(--crm-card-border)] rounded-lg outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-[var(--crm-card)] text-[var(--crm-text)] disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--crm-text-secondary)]   block">Contact Name *</label>
                  <input 
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 border border-[var(--crm-card-border)] rounded-lg outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-[var(--crm-card)] text-[var(--crm-text)]"
                  />
                </div>

                {/* Company */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--crm-text-secondary)]   block">Company (Optional)</label>
                  <input 
                    type="text"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="w-full px-3 py-2 border border-[var(--crm-card-border)] rounded-lg outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-[var(--crm-card)] text-[var(--crm-text)]"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--crm-text-secondary)]   block">Email Address *</label>
                  <input 
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="e.g. john@acme.com"
                    className="w-full px-3 py-2 border border-[var(--crm-card-border)] rounded-lg outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-[var(--crm-card)] text-[var(--crm-text)]"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--crm-text-secondary)]   block">Phone Number (Optional)</label>
                  <input 
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="e.g. +1 (555) 019-2233"
                    className="w-full px-3 py-2 border border-[var(--crm-card-border)] rounded-lg outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-[var(--crm-card)] text-[var(--crm-text)]"
                  />
                </div>

                {/* Country */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--crm-text-secondary)]   block">Country</label>
                  <input 
                    type="text"
                    value={formCountry}
                    onChange={(e) => setFormCountry(e.target.value)}
                    placeholder="e.g. United States, Germany"
                    className="w-full px-3 py-2 border border-[var(--crm-card-border)] rounded-lg outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-[var(--crm-card)] text-[var(--crm-text)]"
                  />
                </div>

                {/* Role dropdown */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--crm-text-secondary)]   block">Role *</label>
                  <select 
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--crm-card-border)] rounded-lg outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-[var(--crm-card)] text-[var(--crm-text)]"
                    required
                  >
                    <option value="CEO">CEO</option>
                    <option value="Founder/Owner">Founder/Owner</option>
                    <option value="Marketing Manager">Marketing Manager</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Other Role Text Input if Other is selected */}
                {formRole === 'Other' && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[var(--crm-text-secondary)]   block">What is the role? *</label>
                    <input 
                      type="text"
                      required
                      value={formOtherRoleText}
                      onChange={(e) => setFormOtherRoleText(e.target.value)}
                      placeholder="Specify the role"
                      className="w-full px-3 py-2 border border-[var(--crm-card-border)] rounded-lg outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-[var(--crm-card)] text-[var(--crm-text)]"
                    />
                  </div>
                )}

                {/* Status Selection */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--crm-text-secondary)]   block">Pipeline Stage *</label>
                  <select 
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as Lead['status'])}
                    className="w-full px-3 py-2 border border-[var(--crm-card-border)] rounded-lg outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-[var(--crm-card)] text-[var(--crm-text)]"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                {/* Lead Source */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--crm-text-secondary)]   block">Lead Source *</label>
                  <select 
                    value={formSource}
                    onChange={(e) => setFormSource(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--crm-card-border)] rounded-lg outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-[var(--crm-card)] text-[var(--crm-text)]"
                  >
                    <option value="Facebook">Facebook</option>
                    <option value="Instagram">Instagram</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Website">Website</option>
                    <option value="Referral">Referral</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Email">Email</option>
                    <option value="Cold Call">Cold Call</option>
                    <option value="Walk-in">Walk-in</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Lead Category */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--crm-text-secondary)]   block">Service Type</label>
                  <select 
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--crm-card-border)] rounded-lg outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-[var(--crm-card)] text-[var(--crm-text)]"
                  >
                    {PREDEFINED_SERVICES.map(service => (
                      <option key={service} value={service}>{service}</option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                </div>



                {/* Conditional "Other" Lead Source Input */}
                {formSource === 'Other' && (
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-medium text-indigo-700   block">Please specify the lead source *</label>
                    <input 
                      type="text"
                      required
                      value={formOtherSourceText}
                      onChange={(e) => setFormOtherSourceText(e.target.value)}
                      placeholder="e.g. TikTok, Billboard, Event"
                      className="w-full px-3 py-2 border border-indigo-200 rounded-lg outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-indigo-50/20 dark:bg-indigo-500/10 text-[var(--crm-text)]"
                    />
                  </div>
                )}

                {/* Optional Social Profiles Section */}
                <div className="sm:col-span-2 border-t border-[var(--crm-card-border)] pt-3">
                  <h4 className="text-xs font-medium text-[var(--crm-text-secondary)]   mb-2">Social Profiles & Website (Optional)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-[var(--crm-text-secondary)] block">Instagram Profile Link</label>
                      <input 
                        type="text"
                        value={formInstagramLink}
                        onChange={(e) => setFormInstagramLink(e.target.value)}
                        placeholder="e.g. instagram.com/username"
                        className="w-full px-3 py-1.5 border border-[var(--crm-card-border)] rounded-lg outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs bg-[var(--crm-card)] text-[var(--crm-text)]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-[var(--crm-text-secondary)] block">Facebook Profile Link</label>
                      <input 
                        type="text"
                        value={formFacebookLink}
                        onChange={(e) => setFormFacebookLink(e.target.value)}
                        placeholder="e.g. facebook.com/username"
                        className="w-full px-3 py-1.5 border border-[var(--crm-card-border)] rounded-lg outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs bg-[var(--crm-card)] text-[var(--crm-text)]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-[var(--crm-text-secondary)] block">LinkedIn Profile Link</label>
                      <input 
                        type="text"
                        value={formLinkedInLink}
                        onChange={(e) => setFormLinkedInLink(e.target.value)}
                        placeholder="e.g. linkedin.com/in/username"
                        className="w-full px-3 py-1.5 border border-[var(--crm-card-border)] rounded-lg outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs bg-[var(--crm-card)] text-[var(--crm-text)]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-[var(--crm-text-secondary)] block">Website URL</label>
                      <input 
                        type="text"
                        value={formWebsiteUrl}
                        onChange={(e) => setFormWebsiteUrl(e.target.value)}
                        placeholder="e.g. www.company.com"
                        className="w-full px-3 py-1.5 border border-[var(--crm-card-border)] rounded-lg outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs bg-[var(--crm-card)] text-[var(--crm-text)]"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-medium text-[var(--crm-text-secondary)] block">Other Social/Profile Link</label>
                      <input 
                        type="text"
                        value={formOtherLink}
                        onChange={(e) => setFormOtherLink(e.target.value)}
                        placeholder="e.g. linktr.ee/username"
                        className="w-full px-3 py-1.5 border border-[var(--crm-card-border)] rounded-lg outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs bg-[var(--crm-card)] text-[var(--crm-text)]"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Conditional SMM Configuration Fields inside Lead Modal */}
              {formCategory === 'Social Media Management' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-indigo-50/50 dark:bg-indigo-500/10 p-4 rounded-xl border border-indigo-100 animate-in fade-in duration-300">
                  <div className="sm:col-span-3 text-[10px] font-semibold text-indigo-900   border-b border-indigo-100 pb-1 flex items-center gap-1">
                    <Sliders size={13} className="text-indigo-600" /> SMM Campaign Details
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-[var(--crm-text-secondary)] ">SMM Platform Name</label>
                    <input 
                      type="text" 
                      value={smmPlatformName} 
                      onChange={(e) => setSmmPlatformName(e.target.value)}
                      placeholder="e.g., Instagram & TikTok"
                      className="w-full px-3 py-1.5 border border-[var(--crm-card-border)] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs bg-[var(--crm-card)] text-[var(--crm-text)] font-semibold"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-[var(--crm-text-secondary)] ">Number of Planned Posts</label>
                    <input 
                      type="number" 
                      value={smmPlannedPosts} 
                      onChange={(e) => setSmmPlannedPosts(Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-[var(--crm-card-border)] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs bg-[var(--crm-card)] text-[var(--crm-text)] font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-[var(--crm-text-secondary)] ">Posting Frequency</label>
                    <input 
                      type="text" 
                      value={smmPostingFrequency} 
                      onChange={(e) => setSmmPostingFrequency(e.target.value)}
                      placeholder="e.g., 3 posts / wk"
                      className="w-full px-3 py-1.5 border border-[var(--crm-card-border)] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs bg-[var(--crm-card)] text-[var(--crm-text)] font-semibold"
                    />
                  </div>

                  <div className="sm:col-span-1.5 space-y-1">
                    <label className="text-[10px] font-medium text-[var(--crm-text-secondary)] ">Content Style Guidelines</label>
                    <textarea 
                      rows={2}
                      value={smmContentNotes} 
                      onChange={(e) => setSmmContentNotes(e.target.value)}
                      placeholder="Visual colors, sound bites, mood boards..."
                      className="w-full px-3 py-1.5 border border-[var(--crm-card-border)] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs bg-[var(--crm-card)] text-[var(--crm-text)] leading-normal"
                    />
                  </div>

                  <div className="sm:col-span-1.5 space-y-1">
                    <label className="text-[10px] font-medium text-[var(--crm-text-secondary)] ">Campaign Guidelines & CTAs</label>
                    <textarea 
                      rows={2}
                      value={smmCampaignRequirements} 
                      onChange={(e) => setSmmCampaignRequirements(e.target.value)}
                      placeholder="Target demographic, bios links, call to actions..."
                      className="w-full px-3 py-1.5 border border-[var(--crm-card-border)] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs bg-[var(--crm-card)] text-[var(--crm-text)] leading-normal"
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--crm-text-secondary)]   block">Inquiry Details / CRM Notes</label>
                <textarea 
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Record communication updates, product interests, client budgets..."
                  rows={3}
                  className="w-full px-3 py-2 border border-[var(--crm-card-border)] rounded-lg outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none bg-[var(--crm-card)] text-[var(--crm-text)]"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end items-center gap-3 pt-3 border-t border-[var(--crm-card-border)]">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => { setTriggerAddForm(false); setSelectedLead(null); }}
                  className="px-4 py-2 border border-[var(--crm-card-border)] text-[var(--crm-text-secondary)] text-xs  rounded-lg hover:bg-[var(--crm-sidebar)] transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-50 dark:bg-indigo-500/10 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
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
                    <span>{isEditing ? 'Save Changes' : 'Create Lead'}</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Details View Modal Backdrop */}
      <CrmProfileView
        isOpen={!!selectedLead && !triggerAddForm}
        onClose={() => setSelectedLead(null)}
        type="Lead"
        data={selectedLead}
        emailDiscussions={emailDiscussions}
        callDiscussions={callDiscussions}
        conversationDiscussions={conversationDiscussions}
        teamMembers={teamMembers}
        leads={leads}
        onUpdateLead={(updatedLead) => {
          onUpdateLead(updatedLead);
          setSelectedLead(updatedLead);
        }}
        onEdit={() => {
          if (selectedLead) {
            const target = selectedLead;
            setSelectedLead(null);
            openEditModal(target);
          }
        }}
        onDelete={async (id) => {
          return await onDeleteLead(id);
        }}
      />

      {/* Custom Delete Confirmation Modal */}
      {leadToDelete && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="bg-[var(--crm-card)] rounded-xl shadow-2xl border border-[var(--crm-card-border)] max-w-sm w-full overflow-hidden text-[var(--crm-text)]"
          >
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-lg">
                  <Trash2 size={24} />
                </div>
                <h3 className="text-base font-semibold tracking-tight">Delete Lead</h3>
              </div>
              <p className="text-xs text-[var(--crm-subtitle)] leading-relaxed">
                Are you sure you want to permanently delete the lead <strong className="text-[var(--crm-text)] font-medium">"{leadToDelete.name}"</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setLeadToDelete(null)}
                  className="px-4 py-2 bg-[var(--crm-sidebar)] hover:bg-[var(--crm-sidebar)]/80 text-[var(--crm-text)] text-xs  rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={async () => {
                    setIsDeleting(true);
                    try {
                      const success = await onDeleteLead(leadToDelete.id);
                      if (success !== false) {
                        setLeadToDelete(null);
                        // Also clear selected lead if we are viewing it
                        if (selectedLead && selectedLead.id === leadToDelete.id) {
                          setSelectedLead(null);
                        }
                      }
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                  className={`px-4 py-2 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer ${isDeleting ? 'bg-rose-400 opacity-70 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700 dark:hover:bg-rose-500'}`}
                >
                  {isDeleting ? "Deleting..." : "Delete Lead"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Custom Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="bg-[var(--crm-card)] rounded-xl shadow-2xl border border-[var(--crm-card-border)] max-w-sm w-full overflow-hidden text-[var(--crm-text)]"
          >
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-lg">
                  <Trash2 size={24} />
                </div>
                <h3 className="text-base font-semibold tracking-tight">Bulk Delete Leads</h3>
              </div>
              <p className="text-xs text-[var(--crm-subtitle)] leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-[var(--crm-text)] font-medium">{selectedLeadIds.length}</strong> selected leads? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  className="px-4 py-2 bg-[var(--crm-sidebar)] hover:bg-[var(--crm-sidebar)]/80 text-[var(--crm-text)] text-xs  rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBulkDelete}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-50 dark:bg-rose-500/10 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer shadow-md shadow-rose-600/10"
                >
                  Delete Selected
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* CSV Preview & Dynamic Column Confirmation Modal */}
      {csvPreviewData && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="bg-[var(--crm-card)] rounded-2xl shadow-2xl border border-[var(--crm-card-border)] max-w-4xl 2xl:max-w-5xl 3xl:max-w-7xl 3xl:max-w-[1600px] 4k:max-w-[2200px] 5k:max-w-[3400px] 4k:max-w-[1600px] 5k:max-w-[2400px] w-full overflow-hidden text-[var(--crm-text)] my-8 flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-[var(--crm-card-border)] bg-[var(--crm-sidebar)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-xl border border-indigo-100 dark:border-indigo-800">
                  <FileSpreadsheet size={22} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[var(--crm-text)] flex items-center gap-2">
                    <span>CSV Column Detection & Mapping</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800">
                      {csvPreviewData.totalRows} records detected
                    </span>
                  </h3>
                  <p className="text-xs text-[var(--crm-subtitle)] mt-0.5">
                    File: <strong className="text-[var(--crm-text)]">{csvPreviewData.fileName}</strong> — Automatically mapped {csvPreviewData.headers.length} columns to Lead fields.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCsvPreviewData(null)}
                className="p-1.5 text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: Column Toggles & Mapping Cards & Data Preview */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
              {/* Detected Column Cards with Mapping Dropdowns */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="font-semibold text-[var(--crm-text)] text-xs flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    <span>Detected Columns & Auto-Field Mappings ({csvPreviewData.selectedHeaders.length} / {csvPreviewData.headers.length} Active):</span>
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCsvPreviewData(prev => prev ? { ...prev, selectedHeaders: [...prev.headers] } : null)}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <button
                      type="button"
                      onClick={() => setCsvPreviewData(prev => prev ? { ...prev, selectedHeaders: [] } : null)}
                      className="text-[11px] text-[var(--crm-text-muted)] hover:underline"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 4k:grid-cols-7 5k:grid-cols-10 gap-2.5 p-3.5 bg-[var(--crm-sidebar)] rounded-xl border border-[var(--crm-card-border)] max-h-56 overflow-y-auto">
                  {csvPreviewData.headers.map(header => {
                    const isSelected = csvPreviewData.selectedHeaders.includes(header);
                    const currentMappedKey = csvPreviewData.columnMapping[header] || 'unmapped';
                    const isMapped = currentMappedKey !== 'unmapped';
                    
                    return (
                      <div 
                        key={header} 
                        className={`p-2.5 rounded-xl border transition-all flex flex-col gap-2 ${
                          isSelected 
                            ? 'bg-[var(--crm-card)] border-indigo-200 dark:border-indigo-800/80 shadow-xs' 
                            : 'bg-[var(--crm-card)]/50 border-[var(--crm-card-border)] opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleHeaderSelection(header)}
                            className={`px-2 py-0.5 rounded-md font-semibold text-xs flex items-center gap-1.5 cursor-pointer truncate max-w-[150px] 2xl:max-w-[250px] 3xl:max-w-[400px] 4k:max-w-none ${ 
                              isSelected 
                                ? 'bg-indigo-600 text-white' 
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                            title={header}
                          >
                            <Check size={11} className={isSelected ? 'opacity-100' : 'opacity-0'} />
                            <span className="truncate">{header}</span>
                          </button>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold shrink-0 ${
                            isMapped 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60' 
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {isMapped ? 'Auto Mapped' : 'Custom Field'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-[var(--crm-subtitle)] shrink-0 font-medium">Map to:</span>
                          <select
                            value={currentMappedKey}
                            onChange={(e) => handleUpdateColumnMapping(header, e.target.value)}
                            className="w-full text-[11px] bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[var(--crm-text)] rounded-md px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer font-medium"
                          >
                            {LEAD_FIELD_MAPPING_OPTIONS.map(opt => (
                              <option key={opt.key} value={opt.key}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Data Table Preview (First 5 Rows) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-[var(--crm-text)] text-xs">
                    Data Preview (First {csvPreviewData.previewRows.length} Rows):
                  </span>
                  <span className="text-[11px] text-[var(--crm-text-muted)] italic">
                    Scroll horizontally to inspect all records
                  </span>
                </div>

                <div className="border border-[var(--crm-card-border)] rounded-xl overflow-hidden shadow-xs overflow-x-auto max-h-60">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[var(--crm-sidebar)] text-[var(--crm-text)] border-b border-[var(--crm-card-border)] sticky top-0">
                      <tr>
                        <th className="p-2.5 border-r border-[var(--crm-card-border)] text-[var(--crm-text-muted)] text-center w-10">#</th>
                        {csvPreviewData.headers.map(h => {
                          const isSelected = csvPreviewData.selectedHeaders.includes(h);
                          const mappedKey = csvPreviewData.columnMapping[h];
                          const option = LEAD_FIELD_MAPPING_OPTIONS.find(o => o.key === mappedKey);
                          const mappedLabel = option ? option.label : 'Custom Field';
                          return (
                            <th 
                              key={h} 
                              className={`p-2.5 border-r border-[var(--crm-card-border)] whitespace-nowrap ${
                                isSelected ? 'text-[var(--crm-text)] font-semibold' : 'text-[var(--crm-text-muted)] line-through'
                              }`}
                            >
                              <div className="text-[11px]">{h}</div>
                              <div className="text-[9px] font-medium text-indigo-600 dark:text-indigo-400">➔ {mappedLabel}</div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#30353D]">
                      {csvPreviewData.previewRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-[var(--crm-sidebar)] transition-colors">
                          <td className="p-2.5 border-r border-[var(--crm-card-border)] text-[var(--crm-text-muted)] font-mono text-center">{idx + 1}</td>
                          {csvPreviewData.headers.map(h => (
                            <td 
                              key={h} 
                              className={`p-2.5 border-r border-[var(--crm-card-border)] truncate max-w-xs ${
                                csvPreviewData.selectedHeaders.includes(h) ? 'text-[var(--crm-text)]' : 'text-slate-300 dark:text-slate-600'
                              }`}
                            >
                              {row[h] || <span className="text-slate-300 dark:text-slate-600 font-light">—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl p-3 text-indigo-900 dark:text-indigo-200 flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  All active columns will automatically map to your Lead fields. Unmapped fields will be preserved as custom Lead attributes.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[var(--crm-card-border)] bg-[var(--crm-sidebar)] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCsvPreviewData(null)}
                className="px-4 py-2 bg-[var(--crm-card)] border border-[var(--crm-card-border)] hover:bg-[var(--crm-sidebar-active-bg)] text-[var(--crm-text)] text-xs rounded-lg transition-colors cursor-pointer font-medium"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={csvPreviewData.selectedHeaders.length === 0}
                onClick={handleConfirmCSVImport}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
              >
                <UploadCloud size={15} />
                <span>Import {csvPreviewData.totalRows} Leads Now</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* CSV Import Summary Modal */}
      {importSummary && importSummary.show && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="bg-[var(--crm-card)] rounded-xl shadow-2xl border border-[var(--crm-card-border)] max-w-md w-full overflow-hidden text-[var(--crm-text)]"
          >
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${
                  importSummary.imported > 0 
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400'
                }`}>
                  {importSummary.imported > 0 ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight text-[var(--crm-heading)]">
                    {importSummary.imported > 0 ? 'CSV Import Successful' : 'CSV Import Result'}
                  </h3>
                  <p className="text-xs text-[var(--crm-subtitle)] mt-0.5">
                    {importSummary.imported > 0 ? 'Leads were saved to your CRM database.' : 'Review import details below.'}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {importSummary.imported > 0 ? (
                  <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 rounded-xl p-4 space-y-2 text-emerald-950 dark:text-emerald-100">
                    <div className="flex items-center justify-between font-bold text-emerald-900 dark:text-emerald-200 text-sm">
                      <span>Successfully Imported:</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">{importSummary.imported} Lead{importSummary.imported === 1 ? '' : 's'}</span>
                    </div>
                    {(importSummary.failed > 0 || importSummary.duplicates > 0) && (
                      <div className="pt-2 border-t border-emerald-200/80 dark:border-emerald-800/60 text-xs space-y-1">
                        <p className="font-semibold text-emerald-900 dark:text-emerald-200">Skipped Rows:</p>
                        {importSummary.duplicates > 0 && <p className="text-amber-800 dark:text-amber-300 font-medium">• {importSummary.duplicates} Duplicate Lead{importSummary.duplicates === 1 ? '' : 's'} (already in CRM)</p>}
                        {importSummary.failed > 0 && <p className="text-rose-800 dark:text-rose-300 font-medium">• {importSummary.failed} Invalid Row{importSummary.failed === 1 ? '' : 's'}</p>}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 rounded-xl p-4 space-y-1 text-rose-900 dark:text-rose-100">
                    <p className="font-bold text-rose-900 dark:text-rose-200">No new leads were added:</p>
                    <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
                      {(importSummary as any).error || `${importSummary.duplicates} duplicate lead(s) skipped. All rows were already present in your CRM.`}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div className="p-2.5 bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl text-center">
                  <span className="block text-lg font-bold text-[var(--crm-text)]">{importSummary.total}</span>
                  <span className="text-[10px] font-semibold text-[var(--crm-text-secondary)] uppercase tracking-wider">Total</span>
                </div>
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-center">
                  <span className="block text-lg font-bold text-emerald-600 dark:text-emerald-400">{importSummary.imported}</span>
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Imported</span>
                </div>
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-center">
                  <span className="block text-lg font-bold text-amber-600 dark:text-amber-400">{importSummary.duplicates}</span>
                  <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">Skipped</span>
                </div>
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-center">
                  <span className="block text-lg font-bold text-rose-600 dark:text-rose-400">{importSummary.failed}</span>
                  <span className="text-[10px] font-semibold text-rose-700 dark:text-rose-300 uppercase tracking-wider">Failed</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setImportSummary(null)}
                  className={`px-6 py-2.5 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md ${
                    importSummary.imported > 0 
                      ? 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white shadow-emerald-600/20' 
                      : 'bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white shadow-slate-800/20'
                  }`}
                >
                  Close & View Leads
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Full-screen Drag & Drop Overlay */}
      <AnimatePresence>
        {isDraggingFile && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[120] bg-indigo-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center border-4 border-dashed border-indigo-400 m-4 rounded-3xl shadow-2xl pointer-events-auto"
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="p-6 bg-indigo-600/30 rounded-full border border-indigo-400/40 text-white mb-4 animate-bounce">
              <UploadCloud size={56} />
            </div>
            <h3 className="text-2xl font-medium text-white tracking-tight mb-2 font-structure">
              Drop Your CSV File Here
            </h3>
            <p className="text-sm text-indigo-200 max-w-md ">
              Release the file to instantly parse and import leads into your CRM database with duplicate detection.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-lg 2xl:max-w-xl 3xl:max-w-2xl 4k:max-w-3xl 5k:max-w-4xl">
              {['Name', 'Email', 'Phone', 'Company', 'Status', 'Value', 'Source', 'Notes'].map((col) => (
                <span key={col} className="px-3 py-1 bg-[var(--crm-card)]/10 text-indigo-100 rounded-md text-xs font-medium border border-[var(--crm-card-border)]">
                  {col}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive CSV Drop Zone Modal */}
      <AnimatePresence>
        {showDropZoneModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowDropZoneModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="bg-[var(--crm-card)] rounded-2xl shadow-2xl border border-[var(--crm-card-border)] max-w-lg 2xl:max-w-xl 3xl:max-w-2xl 4k:max-w-3xl 5k:max-w-4xl w-full overflow-hidden text-[var(--crm-text)]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-[var(--crm-card-border)] flex items-center justify-between bg-slate-50/5 bg-[var(--crm-sidebar)]/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-xl border border-[var(--crm-card-border)]">
                    <FileSpreadsheet size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-[var(--crm-text)] font-structure">Import Leads from CSV</h3>
                    <p className="text-xs text-[var(--crm-subtitle)]">Drag & drop your CSV file or click to select</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDropZoneModal(false)}
                  className="p-1.5 text-[var(--crm-text-muted)] hover:text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar-active-bg)] rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body: Drop Zone */}
              <div className="p-6 space-y-5">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      processCSVFile(file);
                    }
                  }}
                  className="group border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-500/10 hover:bg-indigo-50/8 dark:hover:bg-indigo-900/20 dark:bg-indigo-500/10 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-all duration-200 shadow-xs hover:shadow-md"
                >
                  <div className="p-4 bg-[var(--crm-card)] rounded-full shadow-sm border border-indigo-100 group-hover:scale-110 group-hover:shadow-md transition-all text-indigo-600">
                    <UploadCloud size={38} />
                  </div>
                  <div>
                    <p className="text-sm  text-[var(--crm-text)] group-hover:text-indigo-600 transition-colors">
                      Drag & drop CSV file here, or click to browse
                    </p>
                    <p className="text-xs text-[var(--crm-subtitle)] mt-1">
                      Supports standard .csv files with automatic column detection
                    </p>
                  </div>
                  <span className="px-4 py-1.5 bg-indigo-600 text-white font-medium text-xs rounded-lg shadow-sm group-hover:bg-indigo-50 dark:bg-indigo-500/10 transition-colors flex items-center gap-1.5 mt-1">
                    <Upload size={13} /> Select CSV File
                  </span>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleDownloadSampleCSV}
                    className="px-3.5 py-2 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:bg-indigo-500/10 rounded-lg transition-colors flex items-center gap-1.5 border border-indigo-100 cursor-pointer"
                  >
                    <Download size={14} /> Sample Template
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDropZoneModal(false)}
                    className="px-4 py-2 bg-[var(--crm-sidebar)] hover:bg-slate-200 text-[var(--crm-text)] text-xs  rounded-lg transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
