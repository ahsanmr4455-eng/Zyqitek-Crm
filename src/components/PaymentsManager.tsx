import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DollarSign, Wallet, Coins, TrendingUp, Globe, Landmark, 
  Calendar, CheckCircle2, Clock, AlertCircle, Plus, Search, 
  Filter, Trash2, Edit2, X, Briefcase, User, Award, Check, 
  ArrowLeft, ChevronRight, CreditCard, Building2, Eye, ArrowUpRight
} from 'lucide-react';
import { Client, Project, TeamMember, ClientPaymentRecord, TeamPaymentRecord } from '../types';
import { getCollectionOnce, saveToFirestore, deleteFromFirestore } from '../lib/firebaseSync';
import { getMasterClientId, getMasterTeamMemberId } from '../lib/clientIdUtils';

interface PaymentsManagerProps {
  clients: Client[];
  projects: Project[];
  teamMembers: TeamMember[];
  clientPayments?: ClientPaymentRecord[];
  showToast: (message: string, type?: 'success' | 'error') => void;
  onUpdateProject: (updated: Project) => Promise<boolean>;
}

const CLIENT_PAYMENT_PLATFORMS = [
  { id: 'Wise', name: 'Wise' },
  { id: 'Elevate Pay', name: 'Elevate Pay' },
  { id: 'Payoneer', name: 'Payoneer' },
  { id: 'Bank Transfer', name: 'Bank Transfer' },
  { id: 'Other', name: 'Other' }
];

const TEAM_PAYMENT_PLATFORMS = [
  { id: 'SadaPay', name: 'SadaPay' },
  { id: 'Other', name: 'Other' },
  { id: 'Bank Transfer', name: 'Bank Transfer' },
  { id: 'JazzCash', name: 'JazzCash' },
  { id: 'EasyPaisa', name: 'EasyPaisa' },
  { id: 'Payoneer', name: 'Payoneer' }
];

const ALL_PLATFORMS_MERGED = [
  { id: 'SadaPay', name: 'SadaPay' },
  { id: 'Payoneer', name: 'Payoneer' },
  { id: 'Elevate Pay', name: 'Elevate Pay' },
  { id: 'Wise', name: 'Wise' },
  { id: 'JazzCash', name: 'JazzCash' },
  { id: 'EasyPaisa', name: 'EasyPaisa' },
  { id: 'Bank Transfer', name: 'Bank Transfer' },
  { id: 'Other', name: 'Other' }
];

export default function PaymentsManager({ 
  clients, 
  projects, 
  teamMembers, 
  clientPayments: passedClientPayments,
  showToast, 
  onUpdateProject 
}: PaymentsManagerProps) {
  // Navigation: 'client-payments' (DEFAULT) | 'team-payments'
  const [activeView, setActiveView] = useState<'client-payments' | 'team-payments'>('client-payments');

  const [clientPayments, setClientPayments] = useState<ClientPaymentRecord[]>(passedClientPayments || []);
  const [teamPayments, setTeamPayments] = useState<TeamPaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state for Client Payments
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [clientStatusFilter, setClientStatusFilter] = useState<'All' | 'Paid' | 'Partially Paid' | 'Pending'>('All');

  // Search & Filter state for Team Payments
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [teamStatusFilter, setTeamStatusFilter] = useState<'All' | 'Paid' | 'Partially Paid' | 'Pending'>('All');

  // Selected detail modal states
  const [selectedClientDetail, setSelectedClientDetail] = useState<any | null>(null);
  const [selectedTeamDetail, setSelectedTeamDetail] = useState<any | null>(null);
  const [selectedPaymentRecord, setSelectedPaymentRecord] = useState<ClientPaymentRecord | null>(null);
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);

  // Modal for recording new Client Payment
  const [showRecordClientModal, setShowRecordClientModal] = useState(false);
  // Modal for recording new Team Payment
  const [showRecordTeamModal, setShowRecordTeamModal] = useState(false);

  useEffect(() => {
    if (passedClientPayments && passedClientPayments.length > 0) {
      setClientPayments(passedClientPayments);
    }
  }, [passedClientPayments]);

  // Client Payments Form states
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [cpAmount, setCpAmount] = useState<number | ''>('');
  const [cpDate, setCpDate] = useState(new Date().toISOString().split('T')[0]);
  const [cpTime, setCpTime] = useState(new Date().toISOString().split('T')[1].slice(0, 5));
  const [cpType, setCpType] = useState<'Advance' | 'Partial Payment' | 'Final Payment' | 'Refund'>('Advance');
  const [cpPlatform, setCpPlatform] = useState('Wise');
  const [showCpPlatformDropdown, setShowCpPlatformDropdown] = useState(false);
  const [cpCurrency, setCpCurrency] = useState('USD');
  const [cpStatus, setCpStatus] = useState<'Pending' | 'Completed' | 'Failed' | 'Cancelled' | 'Refunded'>('Completed');
  const [cpTransactionId, setCpTransactionId] = useState('');
  const [cpNotes, setCpNotes] = useState('');
  const [cpReceiptUrl, setCpReceiptUrl] = useState('');

  // Team Monthly Form states
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [tmMonth, setTmMonth] = useState('August 2026');
  const [tmDueDate, setTmDueDate] = useState('2026-08-31');
  const [tmPaidAmount, setTmPaidAmount] = useState<number | ''>('');
  const [tmPaymentDate, setTmPaymentDate] = useState('2026-08-28');
  const [tmPlatform, setTmPlatform] = useState('SadaPay');
  const [showTmPlatformDropdown, setShowTmPlatformDropdown] = useState(false);
  const [tmNotes, setTmNotes] = useState('');

  // Load Firestore Data on Mount
  useEffect(() => {
    let isMounted = true;
    if (passedClientPayments && passedClientPayments.length > 0) {
      setClientPayments(passedClientPayments);
      setLoading(false);
    }

    const loadPaymentsData = async () => {
      try {
        const [cpData, tpData] = await Promise.all([
          getCollectionOnce<ClientPaymentRecord>('clientPayments'),
          getCollectionOnce<TeamPaymentRecord>('teamPayments')
        ]);
        if (isMounted) {
          if (cpData && cpData.length > 0) setClientPayments(cpData);
          if (tpData) setTeamPayments(tpData);
        }
      } catch (err) {
        console.error("Error loading payments data from Firebase:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadPaymentsData();
    return () => {
      isMounted = false;
    };
  }, [passedClientPayments]);

  // Platform Logo Helper
  const getPlatformLogo = (platform: string) => {
    const norm = (platform || '').toLowerCase();
    if (norm.includes('sadapay')) {
      return (
        <svg viewBox="0 0 100 100" className="w-5 h-5 select-none shrink-0 inline-block align-middle" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M34 26C20 34 16 54 26 68C36 82 56 86 70 76C80 68 76 52 66 44C56 36 44 42 38 52" stroke="#16D3B4" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M66 74C80 66 84 46 74 32C64 18 44 14 30 24C20 32 24 48 34 56C44 64 56 58 62 48" stroke="#FF7F63" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }
    if (norm.includes('payoneer')) {
      return (
        <svg viewBox="0 0 100 100" className="w-5 h-5 select-none shrink-0 inline-block align-middle" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="payoneerGradUnified" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF4E50" />
              <stop offset="35%" stopColor="#F9D423" />
              <stop offset="70%" stopColor="#20E2D7" />
              <stop offset="100%" stopColor="#B06AB3" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="36" stroke="url(#payoneerGradUnified)" strokeWidth="12" />
        </svg>
      );
    }
    if (norm.includes('elevate')) {
      return (
        <svg viewBox="0 0 100 100" className="w-5 h-5 select-none shrink-0 inline-block align-middle" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="elevateGradUnified" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0B0947" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" rx="26" fill="url(#elevateGradUnified)" />
          <path d="M28 66L50 34L72 66" stroke="white" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }
    if (norm.includes('wise')) {
      return (
        <svg viewBox="0 0 100 100" className="w-5 h-5 select-none shrink-0 inline-block align-middle" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" rx="26" fill="#96F250" />
          <path d="M 28 64 L 46 36 L 60 36 L 50 51 H 72 L 62 64 H 36" stroke="#003B2F" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );
    }
    if (norm.includes('bank') || norm.includes('transfer') || norm.includes('account')) {
      return (
        <svg viewBox="0 0 100 100" className="w-5 h-5 select-none shrink-0 inline-block align-middle" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bankGradUnified" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>
          </defs>
          <path d="M 18,50 A 32,32 0 0,1 75,23" stroke="url(#bankGradUnified)" strokeWidth="5.5" strokeLinecap="round" />
          <path d="M 75,23 L 61,22 M 75,23 L 74,37" stroke="url(#bankGradUnified)" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 82,50 A 32,32 0 0,1 25,77" stroke="url(#bankGradUnified)" strokeWidth="5.5" strokeLinecap="round" />
          <path d="M 25,77 L 39,78 M 25,77 L 26,63" stroke="url(#bankGradUnified)" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 32,62 H 68 M 36,62 V 46 M 44,62 V 46 M 52,62 V 46 M 60,62 V 46 M 34,46 H 66 M 50,32 L 32,42 L 68,42 Z" stroke="url(#bankGradUnified)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );
    }
    if (norm.includes('jazzcash')) {
      return (
        <svg viewBox="0 0 100 100" className="w-5 h-5 select-none shrink-0 inline-block align-middle" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 50 C30 30, 20 50, 20 70 C20 90, 50 90, 50 50 Z" fill="#FFC107" />
          <path d="M50 50 C70 70, 80 50, 80 30 C80 10, 50 10, 50 50 Z" fill="#E53935" />
        </svg>
      );
    }
    if (norm.includes('easypaisa')) {
      return (
        <svg viewBox="0 0 100 100" className="w-5 h-5 select-none shrink-0 inline-block align-middle" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M25 50 C25 20, 85 20, 85 50 C85 65, 75 70, 50 70 C35 70, 25 60, 25 50 Z" stroke="#2D2A3B" strokeWidth="15" />
          <path d="M25 65 C35 85, 65 85, 85 65" stroke="#10B981" strokeWidth="14" strokeLinecap="round" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 100 100" className="w-5 h-5 select-none shrink-0 inline-block align-middle" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="15" y="25" width="70" height="50" rx="12" fill="#6366F1" />
        <rect x="15" y="35" width="70" height="10" fill="#312E81" opacity="0.3" />
        <rect x="25" y="55" width="12" height="10" rx="3" fill="#E0E7FF" opacity="0.8" />
        <circle cx="63" cy="60" r="8" fill="#E0E7FF" opacity="0.4" />
        <circle cx="71" cy="60" r="8" fill="#E0E7FF" opacity="0.6" />
      </svg>
    );
  };

  // Helper date and time formatters
  const formatPaymentDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatPaymentTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return '';
    }
  };

  // ----------------------------------------------------
  // COMPUTED REAL METRICS FOR PAYMENTS DASHBOARD
  // ----------------------------------------------------
  const totalClientValue = useMemo(() => {
    return projects.reduce((sum, p) => sum + Number(p.budget || p.totalProjectValue || 0), 0);
  }, [projects]);

  const totalClientReceived = useMemo(() => {
    return clientPayments.reduce((sum, p) => sum + Number(p.totalPaid || p.advance || 0), 0);
  }, [clientPayments]);

  const totalClientOutstanding = useMemo(() => {
    return Math.max(0, totalClientValue - totalClientReceived);
  }, [totalClientValue, totalClientReceived]);

  const totalTeamCommitted = useMemo(() => {
    const fromMembers = teamMembers.reduce((sum, m) => sum + Number(m.monthlySalary || 0), 0);
    const fromRecords = teamPayments.reduce((sum, p) => {
      if (p.type === 'Monthly') return sum + Number(p.monthlySalary || 0);
      return sum + Number(p.teamPaymentAmount || 0);
    }, 0);
    return Math.max(fromMembers, fromRecords);
  }, [teamMembers, teamPayments]);

  const totalTeamPaid = useMemo(() => {
    return teamPayments.reduce((sum, p) => sum + Number(p.totalPaid || p.advance || 0), 0);
  }, [teamPayments]);

  const totalPaymentVolume = useMemo(() => {
    return totalClientValue + totalTeamPaid;
  }, [totalClientValue, totalTeamPaid]);

  // ----------------------------------------------------
  // CLIENT PAYMENTS AGGREGATION & SUMMARY LIST
  // ----------------------------------------------------
  const clientSummaryList = useMemo(() => {
    const projectSummaries = projects.map(proj => {
      const client = clients.find(c => c.id === proj.clientId);
      const mClientId = client?.masterClientId || (client ? getMasterClientId(client) : 'CL-1001');
      const budget = Number(proj.budget || proj.totalProjectValue || 0);
      
      const linkedPayments = clientPayments.filter(cp => 
        cp.projectId === proj.id || (cp.clientId === proj.clientId && cp.projectName === proj.name)
      );

      const totalReceived = linkedPayments
        .filter(p => p.status === 'Paid' || p.status === 'Completed' || p.status === 'Partially Paid' || !p.status)
        .reduce((sum, p) => sum + Number(p.totalPaid || p.advance || 0), 0);
      const outstanding = Math.max(0, budget - totalReceived);
      
      let status: 'Paid' | 'Partially Paid' | 'Pending' = 'Pending';
      if (totalReceived >= budget && budget > 0) status = 'Paid';
      else if (totalReceived > 0) status = 'Partially Paid';

      return {
        id: proj.id,
        clientId: proj.clientId,
        masterClientId: mClientId,
        clientName: client?.name || proj.clientName || 'Unknown Client',
        company: client?.company || 'N/A',
        projectId: proj.id,
        projectName: proj.name,
        totalBudget: budget,
        totalReceived,
        outstanding,
        status,
        payments: linkedPayments
      };
    });

    const existingProjIds = new Set(projects.map(p => p.id));
    const orphanPayments = clientPayments.filter(cp => cp.projectId && !existingProjIds.has(cp.projectId));
    
    const orphanGroups: Record<string, typeof projectSummaries[0]> = {};
    orphanPayments.forEach(cp => {
      const key = cp.projectId || cp.clientId || cp.id;
      if (!orphanGroups[key]) {
        const client = clients.find(c => c.id === cp.clientId);
        const mClientId = cp.masterClientId || (client ? getMasterClientId(client) : 'CL-1001');
        orphanGroups[key] = {
          id: key,
          clientId: cp.clientId,
          masterClientId: mClientId,
          clientName: cp.clientName || client?.name || 'Unknown Client',
          company: cp.company || client?.company || 'N/A',
          projectId: cp.projectId || key,
          projectName: cp.projectName || 'Project',
          totalBudget: Number(cp.totalAmount || cp.totalPaid || 0),
          totalReceived: 0,
          outstanding: 0,
          status: (cp.status as any) || 'Paid',
          payments: []
        };
      }
      orphanGroups[key].payments.push(cp);
      orphanGroups[key].totalReceived += Number(cp.totalPaid || cp.advance || 0);
      orphanGroups[key].totalBudget = Math.max(orphanGroups[key].totalBudget, orphanGroups[key].totalReceived);
      orphanGroups[key].outstanding = Math.max(0, orphanGroups[key].totalBudget - orphanGroups[key].totalReceived);
      if (orphanGroups[key].totalReceived >= orphanGroups[key].totalBudget && orphanGroups[key].totalBudget > 0) {
        orphanGroups[key].status = 'Paid';
      } else if (orphanGroups[key].totalReceived > 0) {
        orphanGroups[key].status = 'Partially Paid';
      }
    });

    return [...projectSummaries, ...Object.values(orphanGroups)];
  }, [projects, clients, clientPayments]);

  // Filtered Client Summary List for UI Search / Filter
  const filteredClientSummaries = useMemo(() => {
    return clientSummaryList.filter(item => {
      if (clientStatusFilter !== 'All' && item.status !== clientStatusFilter) {
        return false;
      }
      if (!clientSearchQuery.trim()) return true;
      const q = clientSearchQuery.trim().toLowerCase();
      const mId = (item.masterClientId || '').toLowerCase();
      const cId = (item.clientId || '').toLowerCase();
      const cName = (item.clientName || '').toLowerCase();
      const company = (item.company || '').toLowerCase();
      const pId = (item.projectId || '').toLowerCase();
      const pName = (item.projectName || '').toLowerCase();
      const matchesPlatform = (item.payments || []).some(p => (p.paymentPlatform || '').toLowerCase().includes(q));

      return mId.includes(q) || cId.includes(q) || cName.includes(q) || company.includes(q) || pId.includes(q) || pName.includes(q) || matchesPlatform;
    });
  }, [clientSummaryList, clientSearchQuery, clientStatusFilter]);

  // ----------------------------------------------------
  // TEAM PAYMENTS AGGREGATION & SUMMARY LIST
  // ----------------------------------------------------
  const teamSummaryList = useMemo(() => {
    return teamMembers.map(member => {
      const tmId = member.teamMemberId || getMasterTeamMemberId(member);
      const linkedPayments = teamPayments.filter(tp => tp.teamMemberId === member.id || tp.teamMemberName === member.fullName);
      
      const monthlySalary = Number(member.monthlySalary || 0);
      const totalPaid = linkedPayments.reduce((sum, p) => sum + Number(p.totalPaid || p.advance || 0), 0);
      
      const totalCommitted = linkedPayments.reduce((sum, p) => {
        if (p.type === 'Monthly') return sum + Number(p.monthlySalary || monthlySalary || 0);
        return sum + Number(p.teamPaymentAmount || 0);
      }, 0) || monthlySalary;

      const outstanding = Math.max(0, totalCommitted - totalPaid);
      let status: 'Paid' | 'Partially Paid' | 'Pending' = 'Pending';
      if (totalPaid >= totalCommitted && totalCommitted > 0) status = 'Paid';
      else if (totalPaid > 0) status = 'Partially Paid';

      const projectNames = Array.from(new Set(linkedPayments.map(p => p.projectName).filter(Boolean))).join(', ') || 'Monthly Payroll';
      const clientNames = Array.from(new Set(linkedPayments.map(p => p.clientName).filter(Boolean))).join(', ') || 'Internal';

      return {
        id: member.id,
        teamMemberId: tmId,
        teamMemberName: member.fullName,
        role: member.role || 'Team Member',
        projectName: projectNames,
        clientName: clientNames,
        totalCommitted,
        totalPaid,
        outstanding,
        status,
        payments: linkedPayments
      };
    });
  }, [teamMembers, teamPayments]);

  // Filtered Team Summary List for UI Search / Filter
  const filteredTeamSummaries = useMemo(() => {
    return teamSummaryList.filter(item => {
      if (teamStatusFilter !== 'All' && item.status !== teamStatusFilter) {
        return false;
      }
      if (!teamSearchQuery.trim()) return true;
      const q = teamSearchQuery.trim().toLowerCase();
      const tmId = (item.teamMemberId || '').toLowerCase();
      const name = (item.teamMemberName || '').toLowerCase();
      const role = (item.role || '').toLowerCase();
      const proj = (item.projectName || '').toLowerCase();
      const client = (item.clientName || '').toLowerCase();
      const matchesPlatform = (item.payments || []).some(p => (p.paymentPlatform || '').toLowerCase().includes(q));

      return tmId.includes(q) || name.includes(q) || role.includes(q) || proj.includes(q) || client.includes(q) || matchesPlatform;
    });
  }, [teamSummaryList, teamSearchQuery, teamStatusFilter]);

  // ----------------------------------------------------
  // RECORD PAYMENT HANDLERS
  // ----------------------------------------------------
  const handleRecordClientPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !selectedProjectId || !cpAmount || Number(cpAmount) <= 0) {
      showToast("Please select client, project, and enter a valid amount.", "error");
      return;
    }

    const client = clients.find(c => c.id === selectedClientId);
    const proj = projects.find(p => p.id === selectedProjectId);

    const paymentVal = Number(cpAmount);
    
    let tzOffset = new Date().getTimezoneOffset() * 60000;
    let localISOTime = new Date(Date.now() - tzOffset).toISOString().slice(0, -1);
    let creationDateIso = new Date().toISOString();
    
    let combinedDateStr = cpDate;
    if (cpTime) {
      try {
        combinedDateStr = new Date(`${cpDate}T${cpTime}:00`).toISOString();
      } catch (err) {}
    }

    const masterCId = client?.masterClientId || getMasterClientId(client);
    const txnId = cpTransactionId.trim() || `TXN-CL-${Date.now().toString().slice(-6)}`;
    const totalAmt = Number(proj?.budget || proj?.totalProjectValue || 0);

    const linkedPayments = clientPayments.filter(cp => 
      (cp.projectId === selectedProjectId || (cp.clientId === selectedClientId && cp.projectName === proj?.name)) && cp.id !== editingPaymentId
    );
    const prevReceived = linkedPayments
        .filter(p => p.status === 'Paid' || p.status === 'Completed' || p.status === 'Partially Paid' || !p.status)
        .reduce((sum, p) => sum + Number(p.totalPaid || p.advance || 0), 0);
        
    const newTotalReceived = prevReceived + (cpStatus === 'Completed' || (cpStatus as string) === 'Paid' ? paymentVal : 0);
    const bal = Math.max(0, totalAmt - newTotalReceived);

    const newRecord: ClientPaymentRecord = {
      id: editingPaymentId || `cp-${Date.now()}`,
      clientId: selectedClientId,
      masterClientId: masterCId,
      clientName: client?.name || 'Unknown Client',
      company: client?.company || 'N/A',
      projectId: selectedProjectId,
      projectName: proj?.name || 'Unknown Project',
      service: proj?.service || client?.serviceType || 'Services',
      transactionId: txnId,
      totalAmount: totalAmt,
      advance: cpType === 'Advance' ? paymentVal : 0,
      totalPaid: paymentVal,
      balance: bal,
      status: cpStatus as any,
      paymentPlatform: cpPlatform,
      paymentType: cpType,
      paymentDates: [combinedDateStr],
      notes: cpNotes.trim(),
      currency: cpCurrency,
      receiptUrl: cpReceiptUrl,
      createdAt: creationDateIso,
      updatedAt: creationDateIso
    };

    try {
      await saveToFirestore('clientPayments', newRecord.id, newRecord);
      setClientPayments(prev => {
        if (editingPaymentId) {
          return prev.map(p => p.id === editingPaymentId ? newRecord : p);
        }
        return [newRecord, ...prev];
      });
      
      setCpAmount('');
      setCpNotes('');
      setCpTransactionId('');
      setCpReceiptUrl('');
      setEditingPaymentId(null);
      setShowRecordClientModal(false);
      showToast("Client payment recorded successfully.", "success");
    } catch (err) {
      showToast("Failed to record client payment.", "error");
    }
  };


  const handleDeleteClientPayment = async (id: string) => {
    try {
      await deleteFromFirestore('clientPayments', id);
      setClientPayments(prev => prev.filter(p => p.id !== id));
      if (selectedClientDetail) {
        setSelectedClientDetail((prev: any) => {
          if (!prev) return null;
          const updatedPayments = prev.payments.filter((p: any) => p.id !== id);
          const newReceived = updatedPayments
            .filter((p: any) => p.status === 'Paid' || p.status === 'Completed' || p.status === 'Partially Paid' || !p.status)
            .reduce((s: number, p: any) => s + Number(p.totalPaid || p.advance || 0), 0);
          const newOutstanding = Math.max(0, prev.totalBudget - newReceived);
          return {
            ...prev,
            totalReceived: newReceived,
            outstanding: newOutstanding,
            payments: updatedPayments
          };
        });
      }
      showToast("Payment record deleted.", "success");
    } catch (err) {
      showToast("Failed to delete payment record.", "error");
    }
  };

  const handleRecordMonthlySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId || !tmPaidAmount || Number(tmPaidAmount) <= 0) {
      showToast("Please select team member and enter paid amount.", "error");
      return;
    }

    const selectedMemberObj = teamMembers.find(m => m.id === selectedMemberId);
    const activeMonthlySalary = Number(selectedMemberObj?.monthlySalary || 0);
    const paid = Number(tmPaidAmount);
    const balance = Math.max(0, activeMonthlySalary - paid);
    const status = balance === 0 ? 'Paid' : (paid > 0 ? 'Partially Paid' : 'Pending');
    const nowIso = new Date().toISOString();
    const tmId = selectedMemberObj?.teamMemberId || getMasterTeamMemberId(selectedMemberObj);
    const txnId = `TXN-TM-${Date.now().toString().slice(-6)}`;

    const newRecord: TeamPaymentRecord = {
      id: `tmp-m-${Date.now()}`,
      type: 'Monthly',
      teamMemberId: tmId || selectedMemberId,
      teamMemberName: selectedMemberObj?.fullName || 'Unknown Member',
      transactionId: txnId,
      monthlySalary: activeMonthlySalary,
      month: tmMonth,
      totalPaid: paid,
      advance: paid,
      balance: balance,
      status: status,
      paymentPlatform: tmPlatform,
      paymentDate: tmPaymentDate,
      dueDate: tmDueDate,
      notes: tmNotes.trim(),
      createdAt: nowIso,
      updatedAt: nowIso
    };

    try {
      await saveToFirestore('teamPayments', newRecord.id, newRecord);
      setTeamPayments(prev => [newRecord, ...prev]);
      setTmPaidAmount('');
      setTmNotes('');
      setShowRecordTeamModal(false);
      showToast("Team salary payment recorded.", "success");
    } catch (err) {
      showToast("Failed to record salary payment.", "error");
    }
  };

  const handleDeleteTeamPayment = async (id: string) => {
    try {
      await deleteFromFirestore('teamPayments', id);
      setTeamPayments(prev => prev.filter(p => p.id !== id));
      if (selectedTeamDetail) {
        setSelectedTeamDetail((prev: any) => {
          if (!prev) return null;
          const updatedPayments = prev.payments.filter((p: any) => p.id !== id);
          const newPaid = updatedPayments.reduce((s: number, p: any) => s + Number(p.totalPaid || p.advance || 0), 0);
          const newOutstanding = Math.max(0, prev.totalCommitted - newPaid);
          return {
            ...prev,
            totalPaid: newPaid,
            outstanding: newOutstanding,
            payments: updatedPayments
          };
        });
      }
      showToast("Team payment record deleted.", "success");
    } catch (err) {
      showToast("Failed to delete record.", "error");
    }
  };

  // Helper projects dropdown for selected client in forms
  const filteredProjectsForForm = useMemo(() => {
    if (!selectedClientId) return [];
    return projects.filter(p => p.clientId === selectedClientId);
  }, [projects, selectedClientId]);

  return (
    <div className="space-y-6">

      {/* ====================================================
          1. PAYMENTS PAGE HEADER (NO SEARCH BAR beside heading!)
          ==================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--crm-heading)] font-structure">
            Payments
          </h1>
          <p className="text-sm font-normal italic mt-1 !text-white text-white section-sub-heading" style={{ color: '#fcf9f9' }}>
            Manage client financial transactions, revenue tracking, and team payroll distributions.
          </p>
        </div>
      </div>

      {/* ====================================================
          2. PAYMENTS DASHBOARD (COMPACT REAL METRICS)
          ==================================================== */}
      <div className="bg-[var(--crm-card)] rounded-2xl border border-[var(--crm-card-border)] p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--crm-text-muted)] flex items-center gap-1.5">
            <TrendingUp size={14} className="text-indigo-500" /> Payments Dashboard
          </h2>
          <span className="text-[10px] text-[var(--crm-text-muted)] font-mono">Live Firestore Accounting</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Total Payment Volume */}
          <div className="bg-[var(--crm-sidebar)] rounded-xl border border-[var(--crm-card-border)] p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-[var(--crm-text-muted)]">Total Payment Volume</span>
              <div className="p-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-lg">
                <Coins size={14} />
              </div>
            </div>
            <p className="text-sm sm:text-base font-bold font-mono text-[var(--crm-text)] mt-1">
              ${totalPaymentVolume.toLocaleString()}
            </p>
          </div>

          {/* Total Received */}
          <div className="bg-[var(--crm-sidebar)] rounded-xl border border-[var(--crm-card-border)] p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-emerald-600">Total Received</span>
              <div className="p-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-lg">
                <CheckCircle2 size={14} />
              </div>
            </div>
            <p className="text-sm sm:text-base font-bold font-mono text-emerald-600 mt-1">
              ${totalClientReceived.toLocaleString()}
            </p>
          </div>

          {/* Pending / Outstanding */}
          <div className="bg-[var(--crm-sidebar)] rounded-xl border border-[var(--crm-card-border)] p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-amber-600">Pending / Outstanding</span>
              <div className="p-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 rounded-lg">
                <Clock size={14} />
              </div>
            </div>
            <p className="text-sm sm:text-base font-bold font-mono text-amber-600 mt-1">
              ${totalClientOutstanding.toLocaleString()}
            </p>
          </div>

          {/* Client Payment Volume */}
          <div className="bg-[var(--crm-sidebar)] rounded-xl border border-[var(--crm-card-border)] p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-[var(--crm-text-muted)]">Client Payment Volume</span>
              <div className="p-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-lg">
                <Building2 size={14} />
              </div>
            </div>
            <p className="text-sm sm:text-base font-bold font-mono text-[var(--crm-text)] mt-1">
              ${totalClientValue.toLocaleString()}
            </p>
          </div>

          {/* Team Payment Volume */}
          <div className="bg-[var(--crm-sidebar)] rounded-xl border border-[var(--crm-card-border)] p-3 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-[var(--crm-text-muted)]">Team Payment Volume</span>
              <div className="p-1.5 bg-purple-50 dark:bg-purple-500/10 text-purple-600 rounded-lg">
                <User size={14} />
              </div>
            </div>
            <p className="text-sm sm:text-base font-bold font-mono text-[var(--crm-text)] mt-1">
              ${totalTeamPaid.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* ====================================================
          3. MAIN SUBSECTION NAVIGATION TABS (ACTIVE DEFAULT = CLIENT PAYMENTS)
          ==================================================== */}
      <div className="flex items-center justify-between border-b border-[var(--crm-card-border)] pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('client-payments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeView === 'client-payments'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-[var(--crm-sidebar)] text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar-active-bg)] hover:text-[var(--crm-text)] border border-[var(--crm-card-border)]'
            }`}
          >
            <Building2 size={15} /> Client Payments
          </button>
          <button
            onClick={() => setActiveView('team-payments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeView === 'team-payments'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-[var(--crm-sidebar)] text-[var(--crm-text-secondary)] hover:bg-[var(--crm-sidebar-active-bg)] hover:text-[var(--crm-text)] border border-[var(--crm-card-border)]'
            }`}
          >
            <User size={15} /> Team Payments
          </button>
        </div>

        {activeView === 'client-payments' && (
          <button
            onClick={() => {
              setEditingPaymentId(null);
              setCpAmount('');
              setCpTransactionId('');
              setCpNotes('');
              setCpReceiptUrl('');
              setCpStatus('Completed');
              setShowRecordClientModal(true);
            }}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={15} /> Record Client Payment
          </button>
        )}

        {activeView === 'team-payments' && (
          <button
            onClick={() => setShowRecordTeamModal(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={15} /> Record Team Payment
          </button>
        )}
      </div>

      {/* ====================================================
          4. CLIENT PAYMENTS SUBSECTION (DEFAULT ACTIVE)
          ==================================================== */}
      {activeView === 'client-payments' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          
          {/* Compact Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--crm-card)] p-3 rounded-2xl border border-[var(--crm-card-border)]">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--crm-text-muted)]" />
              <input 
                type="text"
                value={clientSearchQuery}
                onChange={(e) => setClientSearchQuery(e.target.value)}
                placeholder="Filter Client Payments (Client ID, Name, Company, Project)..."
                className="w-full pl-9 pr-4 py-2 border border-[var(--crm-card-border)] rounded-xl focus:outline-hidden focus:ring-1 focus:ring-indigo-500 text-xs bg-[var(--crm-sidebar)] text-[var(--crm-text)]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-[var(--crm-text-muted)] shrink-0" />
              <select
                value={clientStatusFilter}
                onChange={(e) => setClientStatusFilter(e.target.value as any)}
                className="bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[var(--crm-text)] text-xs rounded-xl px-3 py-2 font-medium focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Client Payments Main Table / List */}
          <div className="border border-[var(--crm-card-border)] rounded-2xl overflow-hidden bg-[var(--crm-card)] shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[var(--crm-sidebar)] border-b border-[var(--crm-card-border)] text-[var(--crm-text-muted)] text-[9px] uppercase tracking-wider">
                    <th className="p-3.5">Client ID</th>
                    <th className="p-3.5">Client Name</th>
                    <th className="p-3.5">Company</th>
                    <th className="p-3.5">Project</th>
                    <th className="p-3.5">Total Project Value</th>
                    <th className="p-3.5">Total Received</th>
                    <th className="p-3.5">Outstanding</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--crm-card-border)] font-medium text-[var(--crm-text-secondary)]">
                  {filteredClientSummaries.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-[var(--crm-text-muted)]">
                        No client payment records match your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredClientSummaries.map((item) => (
                      <tr key={item.id} className="hover:bg-[var(--crm-sidebar-active-bg)] transition-colors">
                        <td className="p-3.5 font-mono font-bold text-indigo-600">
                          {item.masterClientId}
                        </td>
                        <td className="p-3.5 font-bold text-[var(--crm-text)]">
                          {item.clientName}
                        </td>
                        <td className="p-3.5 text-[var(--crm-text-muted)]">
                          {item.company}
                        </td>
                        <td className="p-3.5">
                          {item.projectName}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-[var(--crm-text)]">
                          ${item.totalBudget.toLocaleString()}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-emerald-600 whitespace-nowrap">
                          ${item.totalReceived.toLocaleString()} received
                        </td>
                        <td className="p-3.5 font-mono font-bold text-amber-600 whitespace-nowrap">
                          ${item.outstanding.toLocaleString()} outstanding
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold ${
                            item.status === 'Paid' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 border border-emerald-200' :
                            item.status === 'Partially Paid' ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' :
                            'bg-amber-50 dark:bg-amber-500/10 text-amber-700 border border-amber-200'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setSelectedClientDetail(item)}
                            className="px-3 py-1.5 bg-[var(--crm-sidebar)] hover:bg-[var(--crm-sidebar-active-bg)] text-[var(--crm-text)] text-xs font-semibold rounded-xl border border-[var(--crm-card-border)] transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <Eye size={13} /> Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ====================================================
          5. TEAM PAYMENTS SUBSECTION
          ==================================================== */}
      {activeView === 'team-payments' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          
          {/* Compact Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--crm-card)] p-3 rounded-2xl border border-[var(--crm-card-border)]">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--crm-text-muted)]" />
              <input 
                type="text"
                value={teamSearchQuery}
                onChange={(e) => setTeamSearchQuery(e.target.value)}
                placeholder="Filter Team Payments (TM ID, Name, Role, Project)..."
                className="w-full pl-9 pr-4 py-2 border border-[var(--crm-card-border)] rounded-xl focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-xs bg-[var(--crm-sidebar)] text-[var(--crm-text)]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-[var(--crm-text-muted)] shrink-0" />
              <select
                value={teamStatusFilter}
                onChange={(e) => setTeamStatusFilter(e.target.value as any)}
                className="bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[var(--crm-text)] text-xs rounded-xl px-3 py-2 font-medium focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Team Payments Main Table / List */}
          <div className="border border-[var(--crm-card-border)] rounded-2xl overflow-hidden bg-[var(--crm-card)] shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[var(--crm-sidebar)] border-b border-[var(--crm-card-border)] text-[var(--crm-text-muted)] text-[9px] uppercase tracking-wider">
                    <th className="p-3.5">Team Member ID</th>
                    <th className="p-3.5">Team Member Name</th>
                    <th className="p-3.5">Project</th>
                    <th className="p-3.5">Client</th>
                    <th className="p-3.5">Total Value / Salary</th>
                    <th className="p-3.5">Total Paid</th>
                    <th className="p-3.5">Outstanding</th>
                    <th className="p-3.5">Payment Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--crm-card-border)] font-medium text-[var(--crm-text-secondary)]">
                  {filteredTeamSummaries.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-[var(--crm-text-muted)]">
                        No team payment records match your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredTeamSummaries.map((item) => (
                      <tr key={item.id} className="hover:bg-[var(--crm-sidebar-active-bg)] transition-colors">
                        <td className="p-3.5 font-mono font-bold text-emerald-600">
                          {item.teamMemberId}
                        </td>
                        <td className="p-3.5 font-bold text-[var(--crm-text)]">
                          {item.teamMemberName}
                          <span className="text-[10px] text-[var(--crm-text-muted)] block font-normal">{item.role}</span>
                        </td>
                        <td className="p-3.5">
                          {item.projectName}
                        </td>
                        <td className="p-3.5 text-[var(--crm-text-muted)]">
                          {item.clientName}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-[var(--crm-text)]">
                          ${item.totalCommitted.toLocaleString()}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-emerald-600 whitespace-nowrap">
                          ${item.totalPaid.toLocaleString()} Paid
                        </td>
                        <td className="p-3.5 font-mono font-bold text-amber-600 whitespace-nowrap">
                          ${item.outstanding.toLocaleString()} Outstanding
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold ${
                            item.status === 'Paid' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 border border-emerald-200' :
                            item.status === 'Partially Paid' ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' :
                            'bg-amber-50 dark:bg-amber-500/10 text-amber-700 border border-amber-200'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setSelectedTeamDetail(item)}
                            className="px-3 py-1.5 bg-[var(--crm-sidebar)] hover:bg-[var(--crm-sidebar-active-bg)] text-[var(--crm-text)] text-xs font-semibold rounded-xl border border-[var(--crm-card-border)] transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <Eye size={13} /> Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ====================================================
          6. CLIENT PAYMENT DETAILS MODAL / TIMELINE
          ==================================================== */}
      {selectedClientDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--crm-card-border)] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-200">
                    {selectedClientDetail.masterClientId}
                  </span>
                  <span className="text-xs text-[var(--crm-text-muted)]">• {selectedClientDetail.company}</span>
                </div>
                <h3 className="text-lg font-bold text-[var(--crm-text)] mt-1">
                  {selectedClientDetail.clientName}
                </h3>
                <p className="text-xs text-[var(--crm-subtitle)] mt-0.5">
                  Project: <span className="font-semibold text-[var(--crm-text)]">{selectedClientDetail.projectName}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedClientDetail(null)}
                className="p-1.5 text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] bg-[var(--crm-sidebar)] rounded-xl hover:bg-[var(--crm-sidebar-active-bg)] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Compact Financial Summary */}
            <div className="bg-[var(--crm-sidebar)] rounded-2xl p-4 border border-[var(--crm-card-border)] space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[9px] font-semibold text-[var(--crm-text-muted)] uppercase tracking-wider block">Total Value</span>
                  <span className="text-sm font-mono font-bold text-[var(--crm-text)] mt-0.5 block">
                    ${selectedClientDetail.totalBudget.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-semibold text-emerald-600 uppercase tracking-wider block">Total Received</span>
                  <span className="text-sm font-mono font-bold text-emerald-600 mt-0.5 block">
                    ${selectedClientDetail.totalReceived.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-semibold text-amber-600 uppercase tracking-wider block">Outstanding</span>
                  <span className="text-sm font-mono font-bold text-amber-600 mt-0.5 block">
                    ${selectedClientDetail.outstanding.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-semibold text-indigo-600 uppercase tracking-wider block">Progress</span>
                  <span className="text-sm font-mono font-bold text-indigo-600 mt-0.5 block">
                    {selectedClientDetail.totalBudget > 0 ? Math.round((selectedClientDetail.totalReceived / selectedClientDetail.totalBudget) * 100) : 0}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[var(--crm-card)] rounded-full h-2 overflow-hidden border border-[var(--crm-card-border)]">
                <div 
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, selectedClientDetail.totalBudget > 0 ? (selectedClientDetail.totalReceived / selectedClientDetail.totalBudget) * 100 : 0)}%` }}
                />
              </div>
            </div>

            {/* Chronological Payment History Timeline / Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--crm-heading)] flex items-center gap-1.5">
                  <Clock size={14} className="text-indigo-500" /> Payment History & Timeline
                </h4>
                <button
                  onClick={() => {
                    setSelectedClientId(selectedClientDetail.clientId);
                    setSelectedProjectId(selectedClientDetail.projectId);
                    setSelectedClientDetail(null);
                    setShowRecordClientModal(true);
                  }}
                  className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold cursor-pointer flex items-center gap-1"
                >
                  <Plus size={13} /> Add Transaction
                </button>
              </div>

              <div className="border border-[var(--crm-card-border)] rounded-2xl overflow-hidden bg-[var(--crm-card)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[var(--crm-sidebar)] border-b border-[var(--crm-card-border)] text-[var(--crm-text-muted)] text-[9px] uppercase tracking-wider">
                        <th className="p-3">Type</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Date & Time</th>
                        <th className="p-3">Platform</th>
                        <th className="p-3">Txn ID</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--crm-card-border)] font-medium text-[var(--crm-text-secondary)]">
                      {selectedClientDetail.payments.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-[var(--crm-text-muted)]">
                            No payment transactions recorded for this client yet.
                          </td>
                        </tr>
                      ) : (
                        selectedClientDetail.payments.map((record: ClientPaymentRecord) => {
                          const timeStr = formatPaymentTime(record.createdAt);
                          const rawType = record.paymentType || (record.advance > 0 ? 'Advance' : (record.notes?.toLowerCase().includes('final') ? 'Final Payment' : 'Milestone'));
                          const pType = rawType === 'Final' ? 'Final Payment' : rawType;
                          return (
                            <tr key={record.id} className="hover:bg-[var(--crm-sidebar-active-bg)] transition-colors">
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  pType === 'Advance' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 border border-indigo-200' :
                                  pType === 'Final Payment' || pType === 'Final' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 border border-emerald-200' :
                                  'bg-cyan-50 text-cyan-700 border border-cyan-200'
                                }`}>
                                  {pType}
                                </span>
                              </td>
                              <td className="p-3 font-mono font-bold text-emerald-600">
                                ${(record.totalPaid || record.advance || 0).toLocaleString()}
                              </td>
                              <td className="p-3">
                                <span className="font-mono text-[var(--crm-text)] block">{record.paymentDates?.[0] || formatPaymentDate(record.createdAt)}</span>
                                {timeStr && <span className="text-[10px] text-[var(--crm-text-muted)] font-mono block">{timeStr}</span>}
                              </td>
                              <td className="p-3">
                                <span className="inline-flex items-center gap-1.5 font-medium">
                                  {getPlatformLogo(record.paymentPlatform)}
                                  <span>{ALL_PLATFORMS_MERGED.find(p => p.id === record.paymentPlatform)?.name || record.paymentPlatform}</span>
                                </span>
                              </td>
                              <td className="p-3 font-mono text-[10px] text-[var(--crm-text-muted)]">
                                <div>{record.transactionId || record.id}</div>
                                {record.notes && <span className="text-[9px] text-[var(--crm-text-muted)] block mt-0.5 font-sans font-normal truncate max-w-[150px]" title={record.notes}>{record.notes}</span>}
                              </td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700">
                                  {record.status || 'Received'}
                                </span>
                              </td>
                              <td className="p-3 text-right flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => { setSelectedPaymentRecord(record); setIsEditingPayment(false); }}
                                  className="p-1 text-indigo-500 hover:bg-indigo-50 dark:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer"
                                  title="View Details"
                                >
                                  <Eye size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingPaymentId(record.id);
                                    setSelectedClientId(record.clientId);
                                    setSelectedProjectId(record.projectId);
                                    setCpAmount(record.totalPaid || record.advance || '');
                                    const dateStr = record.paymentDates?.[0] || record.createdAt;
                                    setCpDate(dateStr.split('T')[0]);
                                    if (dateStr.includes('T')) {
                                      setCpTime(dateStr.split('T')[1].slice(0, 5));
                                    }
                                    setCpType(record.paymentType as any || 'Advance');
                                    setCpPlatform(record.paymentPlatform || 'Wise');
                                    setCpCurrency(record.currency || 'USD');
                                    setCpStatus(record.status as any || 'Completed');
                                    setCpTransactionId(record.transactionId || '');
                                    setCpNotes(record.notes || '');
                                    setCpReceiptUrl(record.receiptUrl || '');
                                    setShowRecordClientModal(true);
                                  }}
                                  className="p-1 text-emerald-500 hover:bg-emerald-50 dark:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Payment"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteClientPayment(record.id)}
                                  className="p-1 text-rose-500 hover:bg-rose-50 dark:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                  title="Delete Payment"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedClientDetail(null)}
                className="px-4 py-2 bg-[var(--crm-sidebar)] hover:bg-[var(--crm-sidebar-active-bg)] text-[var(--crm-text)] text-xs font-semibold rounded-xl border border-[var(--crm-card-border)] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          7. TEAM PAYMENT DETAILS MODAL / TIMELINE
          ==================================================== */}
      {selectedTeamDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--crm-card-border)] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-200">
                    {selectedTeamDetail.teamMemberId}
                  </span>
                  <span className="text-xs text-[var(--crm-text-muted)]">• {selectedTeamDetail.role}</span>
                </div>
                <h3 className="text-lg font-bold text-[var(--crm-text)] mt-1">
                  {selectedTeamDetail.teamMemberName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTeamDetail(null)}
                className="p-1.5 text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] bg-[var(--crm-sidebar)] rounded-xl hover:bg-[var(--crm-sidebar-active-bg)] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Compact Financial Summary */}
            <div className="bg-[var(--crm-sidebar)] rounded-2xl p-4 border border-[var(--crm-card-border)] space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[9px] font-semibold text-[var(--crm-text-muted)] uppercase tracking-wider block">Total Payroll / Contract</span>
                  <span className="text-sm font-mono font-bold text-[var(--crm-text)] mt-0.5 block">
                    ${selectedTeamDetail.totalCommitted.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-semibold text-emerald-600 uppercase tracking-wider block">Total Paid</span>
                  <span className="text-sm font-mono font-bold text-emerald-600 mt-0.5 block">
                    ${selectedTeamDetail.totalPaid.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-semibold text-amber-600 uppercase tracking-wider block">Outstanding</span>
                  <span className="text-sm font-mono font-bold text-amber-600 mt-0.5 block">
                    ${selectedTeamDetail.outstanding.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-semibold text-purple-600 uppercase tracking-wider block">Progress</span>
                  <span className="text-sm font-mono font-bold text-purple-600 mt-0.5 block">
                    {selectedTeamDetail.totalCommitted > 0 ? Math.round((selectedTeamDetail.totalPaid / selectedTeamDetail.totalCommitted) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Chronological Payment History Timeline / Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--crm-heading)] flex items-center gap-1.5">
                  <Clock size={14} className="text-emerald-500" /> Payment History & Timeline
                </h4>
                <button
                  onClick={() => {
                    setSelectedMemberId(selectedTeamDetail.id);
                    setSelectedTeamDetail(null);
                    setShowRecordTeamModal(true);
                  }}
                  className="text-emerald-600 hover:text-emerald-800 text-xs font-semibold cursor-pointer flex items-center gap-1"
                >
                  <Plus size={13} /> Add Payout
                </button>
              </div>

              <div className="border border-[var(--crm-card-border)] rounded-2xl overflow-hidden bg-[var(--crm-card)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[var(--crm-sidebar)] border-b border-[var(--crm-card-border)] text-[var(--crm-text-muted)] text-[9px] uppercase tracking-wider">
                        <th className="p-3">Type</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Payment Date</th>
                        <th className="p-3">Platform</th>
                        <th className="p-3">Txn ID</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--crm-card-border)] font-medium text-[var(--crm-text-secondary)]">
                      {selectedTeamDetail.payments.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-[var(--crm-text-muted)]">
                            No payment transactions recorded for this team member yet.
                          </td>
                        </tr>
                      ) : (
                        selectedTeamDetail.payments.map((record: TeamPaymentRecord) => {
                          const timeStr = formatPaymentTime(record.createdAt);
                          const pType = record.type === 'Monthly' ? `Salary (${record.month || 'Monthly'})` : `Project (${record.projectName || 'Contract'})`;
                          return (
                            <tr key={record.id} className="hover:bg-[var(--crm-sidebar-active-bg)] transition-colors">
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  record.type === 'Monthly' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 border border-indigo-200' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 border border-emerald-200'
                                }`}>
                                  {pType}
                                </span>
                              </td>
                              <td className="p-3 font-mono font-bold text-emerald-600">
                                ${(record.totalPaid || record.advance || 0).toLocaleString()}
                              </td>
                              <td className="p-3">
                                <span className="font-mono text-[var(--crm-text)] block">{record.paymentDate || formatPaymentDate(record.createdAt)}</span>
                                {timeStr && <span className="text-[10px] text-[var(--crm-text-muted)] font-mono block">{timeStr}</span>}
                              </td>
                              <td className="p-3">
                                <span className="inline-flex items-center gap-1.5 font-medium">
                                  {getPlatformLogo(record.paymentPlatform)}
                                  <span>{ALL_PLATFORMS_MERGED.find(p => p.id === record.paymentPlatform)?.name || record.paymentPlatform}</span>
                                </span>
                              </td>
                              <td className="p-3 font-mono text-[10px] text-[var(--crm-text-muted)]">
                                <div>{record.transactionId || record.id}</div>
                                {record.notes && <span className="text-[9px] text-[var(--crm-text-muted)] block mt-0.5 font-sans font-normal truncate max-w-[150px]" title={record.notes}>{record.notes}</span>}
                              </td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700">
                                  {record.status || 'Paid'}
                                </span>
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTeamPayment(record.id)}
                                  className="p-1 text-rose-500 hover:bg-rose-50 dark:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedTeamDetail(null)}
                className="px-4 py-2 bg-[var(--crm-sidebar)] hover:bg-[var(--crm-sidebar-active-bg)] text-[var(--crm-text)] text-xs font-semibold rounded-xl border border-[var(--crm-card-border)] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          8. RECORD CLIENT PAYMENT MODAL
          ==================================================== */}
      {showRecordClientModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[var(--crm-card-border)] pb-4">
              <h3 className="text-base font-bold text-[var(--crm-text)] flex items-center gap-2">
                <Building2 className="text-indigo-600" size={18} /> Record Client Payment
              </h3>
              <button
                onClick={() => setShowRecordClientModal(false)}
                className="p-1 text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordClientPaymentSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-[var(--crm-text-muted)] block">Client *</label>
                <select
                  required
                  value={selectedClientId}
                  onChange={(e) => {
                    setSelectedClientId(e.target.value);
                    setSelectedProjectId('');
                  }}
                  className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-medium text-[var(--crm-text)] focus:outline-none focus:border-indigo-600"
                >
                  <option value="">-- Select Client --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.company ? `${c.company} (${c.name})` : c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-[var(--crm-text-muted)] block">Project *</label>
                <select
                  required
                  disabled={!selectedClientId}
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-medium text-[var(--crm-text)] focus:outline-none focus:border-indigo-600 disabled:opacity-50"
                >
                  <option value="">-- Select Project --</option>
                  {filteredProjectsForForm.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {selectedProjectId && (() => {
                const proj = projects.find(p => p.id === selectedProjectId);
                const projectTotal = Number(proj?.budget || proj?.totalProjectValue || 0);
                const prevLinked = clientPayments.filter(cp => cp.projectId === selectedProjectId && cp.id !== editingPaymentId);
                const prevReceived = prevLinked
                  .filter(p => p.status === 'Paid' || p.status === 'Completed' || p.status === 'Partially Paid' || !p.status)
                  .reduce((sum, p) => sum + Number(p.totalPaid || p.advance || 0), 0);
                
                const currentAmt = Number(cpAmount || 0);
                const newTotalReceived = prevReceived + (cpStatus === 'Completed' || (cpStatus as string) === 'Paid' ? currentAmt : 0);
                const remaining = Math.max(0, projectTotal - newTotalReceived);
                const overpay = newTotalReceived > projectTotal ? newTotalReceived - projectTotal : 0;
                const paidPct = projectTotal > 0 ? (newTotalReceived / projectTotal) * 100 : 0;
                
                return (
                  <div className="bg-[var(--crm-sidebar)] p-4 rounded-xl border border-[var(--crm-card-border)] space-y-3">
                    <h4 className="text-[10px] uppercase font-bold text-[var(--crm-text-muted)] tracking-wider">Project Financial Summary</h4>
                    <div className="grid grid-cols-2 gap-y-2 text-xs">
                      <div className="text-[var(--crm-text-secondary)]">Project Total:</div>
                      <div className="text-right font-mono font-medium text-[var(--crm-text)]">${projectTotal.toLocaleString()}</div>
                      
                      <div className="text-[var(--crm-text-secondary)]">Previously Received:</div>
                      <div className="text-right font-mono font-medium text-[var(--crm-text)]">${prevReceived.toLocaleString()}</div>
                      
                      <div className="text-indigo-600 dark:text-indigo-400 font-semibold pt-2 border-t border-[var(--crm-card-border)]">Current Payment:</div>
                      <div className="text-right font-mono font-bold text-indigo-600 dark:text-indigo-400 pt-2 border-t border-[var(--crm-card-border)]">
                        ${currentAmt.toLocaleString()}
                      </div>
                      
                      <div className="text-[var(--crm-text-secondary)] font-medium pt-2">Total Received:</div>
                      <div className="text-right font-mono font-bold text-[var(--crm-text)] pt-2">${newTotalReceived.toLocaleString()}</div>
                      
                      <div className="text-[var(--crm-text-secondary)] font-medium">Remaining Balance:</div>
                      <div className="text-right font-mono font-bold text-[var(--crm-text)]">${remaining.toLocaleString()}</div>
                      
                      {overpay > 0 && (
                        <>
                          <div className="text-amber-600 dark:text-amber-500 font-medium">Overpayment:</div>
                          <div className="text-right font-mono font-bold text-amber-600 dark:text-amber-500">${overpay.toLocaleString()}</div>
                        </>
                      )}
                      
                      <div className="text-[var(--crm-text-secondary)]">Paid Percentage:</div>
                      <div className="text-right font-mono font-medium text-[var(--crm-text)]">{paidPct.toFixed(1)}%</div>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-[var(--crm-text-muted)] block">Amount *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 1500"
                    value={cpAmount}
                    onChange={(e) => setCpAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 text-xs font-medium text-[var(--crm-text)] focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-[var(--crm-text-muted)] block">Currency</label>
                  <select
                    value={cpCurrency}
                    onChange={(e) => setCpCurrency(e.target.value)}
                    className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 text-xs font-medium text-[var(--crm-text)] focus:outline-none focus:border-indigo-600"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="PKR">PKR</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-[var(--crm-text-muted)] block">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={cpDate}
                    onChange={(e) => setCpDate(e.target.value)}
                    className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 text-xs font-medium text-[var(--crm-text)] focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-[var(--crm-text-muted)] block">Payment Time</label>
                  <input
                    type="time"
                    value={cpTime}
                    onChange={(e) => setCpTime(e.target.value)}
                    className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 text-xs font-medium text-[var(--crm-text)] focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-[var(--crm-text-muted)] block">Payment Type *</label>
                  <select
                    value={cpType}
                    onChange={(e) => setCpType(e.target.value as any)}
                    className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 text-xs font-medium text-[var(--crm-text)] focus:outline-none focus:border-indigo-600"
                  >
                    <option value="Advance">Advance</option>
                    <option value="Partial Payment">Partial Payment</option>
                    <option value="Final Payment">Final Payment</option>
                    <option value="Refund">Refund</option>
                  </select>
                </div>
                
                <div className="space-y-1.5 relative">
                  <label className="text-[10px] font-semibold text-[var(--crm-text-muted)] block">Payment Method *</label>
                  <button
                    type="button"
                    onClick={() => setShowCpPlatformDropdown(!showCpPlatformDropdown)}
                    className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 text-xs font-medium text-[var(--crm-text)] flex items-center justify-between hover:bg-[var(--crm-sidebar-active-bg)] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {getPlatformLogo(cpPlatform)}
                      <span className="truncate">{CLIENT_PAYMENT_PLATFORMS.find(p => p.id === cpPlatform)?.name || cpPlatform}</span>
                    </div>
                    <ChevronRight size={14} className={`shrink-0 transition-transform ${showCpPlatformDropdown ? 'rotate-90' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {showCpPlatformDropdown && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setShowCpPlatformDropdown(false)} />
                        <motion.div 
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="absolute left-0 right-0 mt-1 bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl shadow-lg z-40 max-h-48 overflow-y-auto py-1 divide-y divide-[var(--crm-card-border)]"
                        >
                          {CLIENT_PAYMENT_PLATFORMS.map((platform) => (
                            <button
                              key={platform.id}
                              type="button"
                              onClick={() => {
                                setCpPlatform(platform.id);
                                setShowCpPlatformDropdown(false);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-[var(--crm-sidebar-active-bg)] flex items-center justify-between font-medium text-[var(--crm-text-secondary)] text-xs"
                            >
                              <span>{platform.name}</span>
                              {getPlatformLogo(platform.id)}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-[var(--crm-text-muted)] block">Transaction ID / Ref (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. TRX-1001"
                    value={cpTransactionId}
                    onChange={(e) => setCpTransactionId(e.target.value)}
                    className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 text-xs font-medium text-[var(--crm-text)] focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-[var(--crm-text-muted)] block">Payment Status *</label>
                  <select
                    value={cpStatus}
                    onChange={(e) => setCpStatus(e.target.value as any)}
                    className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 text-xs font-medium text-[var(--crm-text)] focus:outline-none focus:border-indigo-600"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Failed">Failed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Refunded">Refunded</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-[var(--crm-text-muted)] block">Payment Proof / Receipt</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setCpReceiptUrl(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl px-3 py-1.5 text-xs font-medium text-[var(--crm-text)] focus:outline-none focus:border-indigo-600 file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:bg-indigo-600 file:text-white file:text-[10px] file:font-semibold hover:file:bg-indigo-700 file:cursor-pointer file:transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-[var(--crm-text-muted)] block">Payment Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. 50% project advance received through Wise."
                  value={cpNotes}
                  onChange={(e) => setCpNotes(e.target.value)}
                  className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 text-xs font-medium text-[var(--crm-text)] focus:outline-none focus:border-indigo-600 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--crm-card-border)]">
                <button
                  type="button"
                  onClick={() => setShowRecordClientModal(false)}
                  className="px-4 py-2 bg-[var(--crm-sidebar)] hover:bg-[var(--crm-sidebar-active-bg)] text-[var(--crm-text)] text-xs font-semibold rounded-xl border border-[var(--crm-card-border)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================
          9. RECORD TEAM PAYMENT MODAL
          ==================================================== */}
      {showRecordTeamModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[var(--crm-card-border)] pb-4">
              <h3 className="text-base font-bold text-[var(--crm-text)] flex items-center gap-2">
                <User className="text-emerald-600" size={18} /> Record Team Payment
              </h3>
              <button
                onClick={() => setShowRecordTeamModal(false)}
                className="p-1 text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordMonthlySubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-[var(--crm-text-muted)] block">Select Team Member *</label>
                <select
                  required
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-medium text-[var(--crm-text)] focus:outline-none focus:border-emerald-600"
                >
                  <option value="">-- Choose Member --</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.fullName} ({m.role || 'Team Member'})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-[var(--crm-text-muted)] block">Payment Month / Period *</label>
                <select
                  value={tmMonth}
                  onChange={(e) => setTmMonth(e.target.value)}
                  className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 font-medium text-[var(--crm-text)] focus:outline-none focus:border-emerald-600"
                >
                  <option value="August 2026">August 2026</option>
                  <option value="September 2026">September 2026</option>
                  <option value="October 2026">October 2026</option>
                  <option value="November 2026">November 2026</option>
                  <option value="December 2026">December 2026</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-[var(--crm-text-muted)] block">Amount Paid ($) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 1200"
                    value={tmPaidAmount}
                    onChange={(e) => setTmPaidAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 text-xs font-medium text-[var(--crm-text)] focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold text-[var(--crm-text-muted)] block">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={tmPaymentDate}
                    onChange={(e) => setTmPaymentDate(e.target.value)}
                    className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 text-xs font-medium text-[var(--crm-text)] focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Platform selector */}
              <div className="space-y-1.5 relative">
                <label className="text-[10px] font-semibold text-[var(--crm-text-muted)] block">Payment Platform *</label>
                <button
                  type="button"
                  onClick={() => setShowTmPlatformDropdown(!showTmPlatformDropdown)}
                  className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 text-xs font-medium text-[var(--crm-text)] flex items-center justify-between hover:bg-[var(--crm-sidebar-active-bg)] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {getPlatformLogo(tmPlatform)}
                    <span>{TEAM_PAYMENT_PLATFORMS.find(p => p.id === tmPlatform)?.name || tmPlatform}</span>
                  </div>
                  <ChevronRight size={14} className={`transition-transform ${showTmPlatformDropdown ? 'rotate-90' : ''}`} />
                </button>
                <AnimatePresence>
                  {showTmPlatformDropdown && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setShowTmPlatformDropdown(false)} />
                      <motion.div 
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute left-0 right-0 mt-1 bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-xl shadow-lg z-40 max-h-48 overflow-y-auto py-1 divide-y divide-[var(--crm-card-border)]"
                      >
                        {TEAM_PAYMENT_PLATFORMS.map((platform) => (
                          <button
                            key={platform.id}
                            type="button"
                            onClick={() => {
                              setTmPlatform(platform.id);
                              setShowTmPlatformDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-[var(--crm-sidebar-active-bg)] flex items-center justify-between font-medium text-[var(--crm-text-secondary)] text-xs"
                          >
                            <span>{platform.name}</span>
                            {getPlatformLogo(platform.id)}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-[var(--crm-text-muted)] block">Transaction Notes</label>
                <input
                  type="text"
                  placeholder="e.g. SadaPay Ref #98124"
                  value={tmNotes}
                  onChange={(e) => setTmNotes(e.target.value)}
                  className="w-full bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl px-3 py-2 text-xs font-medium text-[var(--crm-text)] focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--crm-card-border)]">
                <button
                  type="button"
                  onClick={() => setShowRecordTeamModal(false)}
                  className="px-4 py-2 bg-[var(--crm-sidebar)] text-[var(--crm-text)] text-xs font-semibold rounded-xl border border-[var(--crm-card-border)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Save Salary Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
