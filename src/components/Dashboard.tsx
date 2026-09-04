import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Lead, CallLog, Client, Project, TeamMember, EmailDiscussion, CallDiscussion, ConversationDiscussion, ClientPaymentRecord, TeamPaymentRecord, Meeting } from '../types';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { getCollectionOnce } from '../lib/firebaseSync';
import { 
  Users, 
  TrendingUp, 
  CheckCircle, 
  DollarSign, 
  ArrowRight, 
  Activity, 
  ChevronRight, 
  Briefcase,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle2,
  PhoneCall,
  Mail,
  MessageSquare,
  CreditCard,
  UserCheck,
  Percent,
  Calendar,
  Layers,
  FolderKanban,
  Video
} from 'lucide-react';

interface DashboardProps {
  leads: Lead[];
  calls?: CallLog[];
  clients: Client[];
  projects?: Project[];
  teamMembers?: TeamMember[];
  emailDiscussions?: EmailDiscussion[];
  callDiscussions?: CallDiscussion[];
  conversationDiscussions?: ConversationDiscussion[];
  meetings?: Meeting[];
  clientPayments?: ClientPaymentRecord[];
  teamPayments?: TeamPaymentRecord[];
  onNavigate: (tab: string) => void;
  onSelectClient?: (clientId: string) => void;
  onSelectLead?: (leadId: string) => void;
  onAddLead: () => void;
  onAddClient?: () => void;
  onAddProject?: () => void;
  onRecordPayment?: () => void;
  onAddDiscussion?: () => void;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.01
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.22, ease: [0, 0, 0.2, 1] }
  }
};

function AnimatedNumber({ value, prefix = "", suffix = "", duration = 650 }: { value: number; prefix?: string; suffix?: string; duration?: number; }) {
  const [displayVal, setDisplayVal] = useState<number>(0);
  const lastValRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayVal(value);
      lastValRef.current = value;
      return;
    }

    if (lastValRef.current === value) {
      setDisplayVal(value);
      return;
    }

    const startValue = lastValRef.current || 0;
    const targetValue = value || 0;
    let startTime: number | null = null;

    const animateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      const easePercentage = percentage * (2 - percentage); // easeOutQuad
      const currentValue = startValue + (targetValue - startValue) * easePercentage;
      
      setDisplayVal(currentValue);

      if (percentage < 1) {
        requestAnimationFrame(animateCount);
      } else {
        setDisplayVal(targetValue);
        lastValRef.current = targetValue;
      }
    };

    requestAnimationFrame(animateCount);
  }, [value, duration]);

  const roundedVal = Math.round(displayVal);
  return (
    <span>{prefix}{roundedVal.toLocaleString()}{suffix}</span>
  );
}

export default function Dashboard({ 
  leads = [], 
  calls = [], 
  clients = [], 
  projects = [], 
  teamMembers = [], 
  emailDiscussions = [],
  callDiscussions = [],
  conversationDiscussions = [],
  meetings = [],
  clientPayments: propsClientPayments,
  teamPayments: propsTeamPayments,
  onNavigate, 
  onSelectClient, 
  onSelectLead, 
  onAddLead,
  onAddClient,
  onAddProject,
  onRecordPayment,
  onAddDiscussion
}: DashboardProps) {
  const [localClientPayments, setLocalClientPayments] = useState<ClientPaymentRecord[]>([]);
  const [localTeamPayments, setLocalTeamPayments] = useState<TeamPaymentRecord[]>([]);
  const [showRevenueModal, setShowRevenueModal] = useState(false);

  // If props are provided use them, otherwise fallback to local state fetched from Firestore
  const clientPayments = propsClientPayments ?? localClientPayments;
  const teamPayments = propsTeamPayments ?? localTeamPayments;

  // Load real Firestore Payments Data on Mount if not provided by parent
  useEffect(() => {
    if (propsClientPayments && propsTeamPayments) return;
    let isMounted = true;
    Promise.all([
      getCollectionOnce<ClientPaymentRecord>('clientPayments'),
      getCollectionOnce<TeamPaymentRecord>('teamPayments')
    ])
      .then(([cpData, tpData]) => {
        if (!isMounted) return;
        if (cpData && Array.isArray(cpData)) setLocalClientPayments(cpData);
        if (tpData && Array.isArray(tpData)) setLocalTeamPayments(tpData);
      })
      .catch(err => {
        console.error("Failed to fetch payments for Dashboard:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [propsClientPayments, propsTeamPayments]);

  // Helper: Date checks
  const isApproachingDeadline = (dateString?: string) => {
    if (!dateString) return false;
    const deadline = new Date(dateString);
    if (isNaN(deadline.getTime())) return false;
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    return diff > 0 && diff <= 172800000; // 48 hours in ms
  };

  const isOverdue = (dateString?: string) => {
    if (!dateString) return false;
    const deadline = new Date(dateString);
    if (isNaN(deadline.getTime())) return false;
    return deadline.getTime() < Date.now();
  };

  const getDaysDiff = (dateString?: string) => {
    if (!dateString) return '';
    const target = new Date(dateString);
    if (isNaN(target.getTime())) return '';
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
    if (diffDays === 0) return 'Due today';
    return `${diffDays}d remaining`;
  };

  const isToday = (dateString?: string) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  };

  // Deduplicated list of client payments
  const uniqueClientPayments = useMemo(() => {
    const seen = new Set<string>();
    const list: ClientPaymentRecord[] = [];
    (clientPayments || []).forEach(cp => {
      if (cp && cp.id && !seen.has(cp.id)) {
        seen.add(cp.id);
        list.push(cp);
      }
    });
    return list;
  }, [clientPayments]);

  // 1. TOP DASHBOARD METRICS CALCULATIONS (Real Client Payments Source of Truth)
  const metrics = useMemo(() => {
    // Total Clients
    const totalClientsCount = clients.length;
    const activeClients = clients.filter(c => c.status === 'Active');
    const activeClientsCount = activeClients.length;

    // Active Projects (exclude Completed, Delivered, Cancelled)
    const activeProjectsList = projects.filter(p => 
      p.status === 'Active' || 
      p.status === 'In Progress' || 
      p.status === 'Review' || 
      p.status === 'Revision' ||
      p.status === 'Not Started'
    );
    const activeProjectsCount = projects.length > 0 
      ? activeProjectsList.length 
      : activeClients.reduce((sum, c) => sum + (Number(c.activeProjects) || 0), 0);

    const avgProjectProgress = activeProjectsList.length > 0
      ? Math.round(activeProjectsList.reduce((s, p) => s + (Number(p.projectProgress || p.progress) || 0), 0) / activeProjectsList.length)
      : (clients.length > 0 ? Math.round(clients.reduce((s, c) => s + (Number(c.projectProgress) || 0), 0) / clients.length) : 0);

    // Leads in Pipeline
    const pipelineLeads = leads.filter(l => 
      l.status === 'New' || 
      l.status === 'Contacted' || 
      l.status === 'Follow Up' || 
      l.status === 'Qualified' ||
      l.status === 'Proposal'
    );
    const leadsInPipelineCount = pipelineLeads.length;

    // PROJECT-LEVEL REVENUE & PAYMENT AGGREGATION
    // Map of projectId -> collected revenue
    const projectPaymentsMap = new Map<string, number>();
    const projectsWithPaymentRecords = new Set<string>();

    let totalDirectClientPayments = 0;
    let pendingPaymentRecordsCount = 0;

    uniqueClientPayments.forEach(cp => {
      const isCancelled = (cp.status as string) === 'Cancelled';
      const isPendingOnly = cp.status === 'Pending' || (cp.status as string) === 'Unpaid';
      const paidVal = Number(cp.totalPaid || 0);

      // Only count valid, received/collected payments
      if (!isCancelled && !isPendingOnly && paidVal > 0) {
        totalDirectClientPayments += paidVal;
        if (cp.projectId) {
          projectsWithPaymentRecords.add(String(cp.projectId));
          const curr = projectPaymentsMap.get(String(cp.projectId)) || 0;
          projectPaymentsMap.set(String(cp.projectId), curr + paidVal);
        }
      }

      if (cp.status === 'Pending' || cp.status === 'Partially Paid' || Number(cp.balance || 0) > 0) {
        pendingPaymentRecordsCount++;
      }
    });

    // For projects with NO records in clientPayments, check if advancePayment was recorded on project
    let totalProjectAdvanceOnlyPayments = 0;
    projects.forEach(p => {
      const pId = String(p.id);
      if (!projectsWithPaymentRecords.has(pId)) {
        const isProjectPaid = p.paymentStatus === 'Paid';
        const isProjectPartial = p.paymentStatus === 'Partial';
        const adv = Number(p.advancePayment || 0);
        const budgetVal = Number(p.totalProjectValue || p.budget || 0);

        if (isProjectPaid && budgetVal > 0) {
          const collected = adv > 0 ? adv : budgetVal;
          totalProjectAdvanceOnlyPayments += collected;
          projectPaymentsMap.set(pId, collected);
        } else if (isProjectPartial && adv > 0) {
          totalProjectAdvanceOnlyPayments += adv;
          projectPaymentsMap.set(pId, adv);
        }
      }
    });

    // TOTAL REVENUE = Actual client payments received / collected
    const totalCollectedRevenue = totalDirectClientPayments + totalProjectAdvanceOnlyPayments;
    const totalRevenue = totalCollectedRevenue;
    const collectedRevenue = totalCollectedRevenue;

    // TOTAL CONTRACT VALUE & PENDING BALANCE
    const totalProjectContractValue = projects.reduce((sum, p) => sum + (Number(p.totalProjectValue || p.budget) || 0), 0);
    const totalClientContractValue = clients.reduce((sum, c) => sum + (Number(c.totalValue) || 0), 0);
    const totalContractValue = totalProjectContractValue > 0 ? totalProjectContractValue : totalClientContractValue;

    // Pending Balance: Unpaid portion of project budgets / client contracts
    let totalPendingBalance = 0;
    if (projects.length > 0) {
      projects.forEach(p => {
        const pId = String(p.id);
        const budgetVal = Number(p.totalProjectValue || p.budget || 0);
        const collectedForP = projectPaymentsMap.get(pId) || 0;
        const remaining = Math.max(0, budgetVal - collectedForP);
        totalPendingBalance += remaining;
      });
    } else if (totalContractValue > 0) {
      totalPendingBalance = Math.max(0, totalContractValue - totalCollectedRevenue);
    }

    const pendingPayments = totalPendingBalance;

    // AVG REVENUE / PROJECT:
    // Actual collected revenue divided by number of projects with valid client payment revenue
    let projectsWithCollectedRevenueCount = 0;
    projectPaymentsMap.forEach((collectedAmt) => {
      if (collectedAmt > 0) {
        projectsWithCollectedRevenueCount++;
      }
    });

    const avgRevenuePerProject = projectsWithCollectedRevenueCount > 0 
      ? (totalCollectedRevenue / projectsWithCollectedRevenueCount) 
      : 0;

    // Lead Conversion Rate: Converted Leads ÷ Total Leads × 100
    const convertedLeadsCount = leads.filter(l => l.status === 'Converted' || l.status === 'Closed').length;
    const leadConversionRate = leads.length > 0 
      ? Math.round((convertedLeadsCount / leads.length) * 100) 
      : null;

    const hasRevenueData = totalRevenue > 0;
    const hasProjectsData = projects.length > 0 || clients.length > 0;
    const hasLeadsData = leads.length > 0;

    return {
      totalRevenue,
      collectedRevenue,
      totalContractValue,
      pendingPayments,
      pendingPaymentRecordsCount,
      activeProjectsCount,
      avgProjectProgress,
      leadsInPipelineCount,
      totalClientsCount,
      activeClientsCount,
      avgRevenuePerProject,
      numProjectsWithRev: projectsWithCollectedRevenueCount,
      leadConversionRate,
      hasRevenueData,
      hasProjectsData,
      hasLeadsData
    };
  }, [leads, clients, projects, uniqueClientPayments]);

  // 2. TODAY'S SNAPSHOT (Read-only real counts)
  const todaySnapshot = useMemo(() => {
    const newLeadsToday = leads.filter(l => isToday(l.createdAt)).length;
    const newClientsToday = clients.filter(c => isToday(c.createdAt)).length;
    
    const paymentsToday = clientPayments.filter(cp => 
      isToday(cp.createdAt) || 
      isToday(cp.updatedAt) || 
      (Array.isArray(cp.paymentDates) && cp.paymentDates.some(pd => isToday(pd)))
    ).length + teamPayments.filter(tp => isToday(tp.paymentDate) || isToday(tp.createdAt)).length;

    const projectsUpdatedToday = projects.filter(p => 
      isToday(p.createdAt) || 
      isToday((p as any).updatedAt)
    ).length;

    return {
      newLeadsToday,
      newClientsToday,
      paymentsToday,
      projectsUpdatedToday
    };
  }, [leads, clients, clientPayments, teamPayments, projects]);

  // 3. DEAL PIPELINE STAGES (Dynamic based on existing leads)
  const pipelineStages = useMemo(() => {
    const stageDefs: { key: string; label: string; dotColor: string }[] = [
      { key: 'New', label: 'New Lead', dotColor: 'bg-emerald-500' },
      { key: 'Contacted', label: 'Contacted', dotColor: 'bg-blue-500' },
      { key: 'Follow Up', label: 'Follow Up', dotColor: 'bg-cyan-500' }
    ];

    const totalLeads = leads.length;

    return stageDefs.map(st => {
      const count = leads.filter(l => {
        if (st.key === 'Closed') return l.status === 'Closed' || l.status === 'Converted';
        return l.status === st.key;
      }).length;

      const percentage = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;

      return {
        ...st,
        count,
        percentage
      };
    });
  }, [leads]);

  // 4. PROJECT HEALTH (Grouped by existing real status)
  const projectHealth = useMemo(() => {
    let onTrack = 0;
    let inProgress = 0;
    let pending = 0;
    let completed = 0;
    let overdue = 0;

    projects.forEach(p => {
      const isProjectCompleted = p.status === 'Completed' || p.status === 'Delivered';
      const isProjectOverdue = !isProjectCompleted && isOverdue(p.deadline || p.expectedDeliveryDate);

      if (isProjectCompleted) {
        completed++;
      } else if (isProjectOverdue) {
        overdue++;
      } else if (p.status === 'In Progress' || p.status === 'Active') {
        inProgress++;
        if (!isApproachingDeadline(p.deadline)) {
          onTrack++;
        }
      } else if (p.status === 'Not Started' || p.status === 'Review' || p.status === 'Revision' || p.status === 'On Hold') {
        pending++;
      } else {
        inProgress++;
      }
    });

    // Fallback to client data if projects array is empty
    if (projects.length === 0 && clients.length > 0) {
      clients.forEach(c => {
        if (c.projectProgress === 100) completed++;
        else if (c.status === 'Active') inProgress++;
        else pending++;
      });
      onTrack = inProgress;
    }

    const total = projects.length > 0 ? projects.length : clients.length;

    return {
      total,
      onTrack,
      inProgress,
      pending,
      completed,
      overdue
    };
  }, [projects, clients]);

  // 5. TEAM WORKLOAD SNAPSHOT
  const teamWorkload = useMemo(() => {
    let available = 0;
    let atCapacity = 0;
    let overloaded = 0;
    let activeAssignments = 0;

    teamMembers.forEach(tm => {
      // Check explicit workloadStatus or infer from assigned projects
      const assignedProjects = projects.filter(p => 
        (p.assignedTeamMemberId === tm.id || p.assignedTeamMember === tm.fullName) &&
        p.status !== 'Completed' &&
        p.status !== 'Delivered'
      );
      activeAssignments += assignedProjects.length;

      if (tm.workloadStatus === 'Overloaded' || assignedProjects.length >= 4) {
        overloaded++;
      } else if (tm.workloadStatus === 'At Capacity' || assignedProjects.length >= 2) {
        atCapacity++;
      } else {
        available++;
      }
    });

    return {
      totalMembers: teamMembers.length,
      available,
      atCapacity,
      overloaded,
      activeAssignments
    };
  }, [teamMembers, projects]);

  // 6. CRITICAL DEADLINES (Compact, only urgent/overdue)
  const criticalDeadlines = useMemo(() => {
    const list: {
      id: string;
      name: string;
      client: string;
      deadline: string;
      status: 'Overdue' | 'Due Soon';
      daysText: string;
      isOverdue: boolean;
      projectId?: string;
    }[] = [];

    projects.forEach(p => {
      if (p.status !== 'Completed' && p.status !== 'Delivered' && p.deadline) {
        const itemOverdue = isOverdue(p.deadline);
        const itemDueSoon = isApproachingDeadline(p.deadline);

        if (itemOverdue || itemDueSoon) {
          list.push({
            id: `p-${p.id}`,
            name: p.name || 'Unnamed Project',
            client: p.clientName || 'Direct Client',
            deadline: p.deadline,
            status: itemOverdue ? 'Overdue' : 'Due Soon',
            daysText: getDaysDiff(p.deadline),
            isOverdue: itemOverdue,
            projectId: p.id
          });
        }
      }

      // Check tasks
      if (Array.isArray(p.tasks)) {
        p.tasks.forEach((t: any) => {
          const isDone = t.completed || t.status === 'Completed' || t.status === 'Done';
          const tDeadline = t.deadline || t.dueDate;
          if (!isDone && tDeadline) {
            const tOverdue = isOverdue(tDeadline);
            const tDueSoon = isApproachingDeadline(tDeadline);
            if (tOverdue || tDueSoon) {
              list.push({
                id: `t-${t.id || Math.random()}`,
                name: t.title || t.text || 'Project Task',
                client: p.clientName || p.name,
                deadline: tDeadline,
                status: tOverdue ? 'Overdue' : 'Due Soon',
                daysText: getDaysDiff(tDeadline),
                isOverdue: tOverdue,
                projectId: p.id
              });
            }
          }
        });
      }
    });

    // Sort: Overdue first, then soonest
    return list.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }).slice(0, 6);
  }, [projects]);

  // 7. RECENT CRM ACTIVITY (5–8 latest real useful events)
  const recentCrmActivity = useMemo(() => {
    const events: {
      id: string;
      type: 'lead' | 'client' | 'project' | 'payment' | 'discussion' | 'team';
      title: string;
      subtitle: string;
      timestamp: Date;
      entityId?: string;
    }[] = [];

    // Leads events
    leads.forEach(l => {
      if (l.createdAt) {
        events.push({
          id: `lead-cr-${l.id}`,
          type: 'lead',
          title: `New lead created: ${l.name}`,
          subtitle: `${l.company ? l.company + ' • ' : ''}Status: ${l.status || 'New'}`,
          timestamp: new Date(l.createdAt),
          entityId: l.id
        });
      }
    });

    // Clients events
    clients.forEach(c => {
      if (c.createdAt) {
        events.push({
          id: `client-cr-${c.id}`,
          type: 'client',
          title: `Client onboarded: ${c.company || c.name}`,
          subtitle: `${c.serviceType || 'Client'} • Progress: ${c.projectProgress || 0}%`,
          timestamp: new Date(c.createdAt),
          entityId: c.id
        });
      }
    });

    // Projects events
    projects.forEach(p => {
      if (p.createdAt) {
        events.push({
          id: `proj-cr-${p.id}`,
          type: 'project',
          title: `Project: ${p.name}`,
          subtitle: `Status: ${p.status} • Client: ${p.clientName || 'Direct'}`,
          timestamp: new Date(p.createdAt),
          entityId: p.id
        });
      }
    });

    // Payments events
    uniqueClientPayments.forEach(cp => {
      if (cp.createdAt) {
        events.push({
          id: `cp-${cp.id}`,
          type: 'payment',
          title: `Payment recorded: $${Number(cp.totalPaid || 0).toLocaleString()}`,
          subtitle: `${cp.clientName || 'Client'} • ${cp.projectName || 'Project'} (${cp.status})`,
          timestamp: new Date(cp.createdAt),
          entityId: cp.id
        });
      }
    });

    // Discussions events
    emailDiscussions.forEach(ed => {
      if (ed.date) {
        events.push({
          id: `ed-${ed.id}`,
          type: 'discussion',
          title: `Email: ${ed.subject || 'Discussion'}`,
          subtitle: `${ed.clientName} • ${ed.direction || 'Sent'}`,
          timestamp: new Date(ed.date),
          entityId: ed.id
        });
      }
    });

    callDiscussions.forEach(cd => {
      if (cd.callDate) {
        events.push({
          id: `cd-${cd.id}`,
          type: 'discussion',
          title: `Call with ${cd.clientName}`,
          subtitle: `Status: ${cd.status || 'Connected'} • Duration: ${cd.duration || 'N/A'}`,
          timestamp: new Date(cd.callDate),
          entityId: cd.id
        });
      }
    });

    conversationDiscussions.forEach(conv => {
      if (conv.date) {
        events.push({
          id: `conv-${conv.id}`,
          type: 'discussion',
          title: `Discussion: ${conv.discussionTitle || conv.leadName}`,
          subtitle: `${conv.leadName} • ${conv.status || 'Open'}`,
          timestamp: new Date(conv.date),
          entityId: conv.id
        });
      }
    });

    // Filter valid dates and sort descending
    return events
      .filter(e => !isNaN(e.timestamp.getTime()))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 7);
  }, [leads, clients, projects, clientPayments, emailDiscussions, callDiscussions, conversationDiscussions]);

  // Map of client collected payments for modal breakdown
  const clientReceivedMap = useMemo(() => {
    const map = new Map<string, { totalBudget: number; paid: number }>();
    
    // Sum from uniqueClientPayments
    const clientPaidRecorded = new Map<string, number>();
    uniqueClientPayments.forEach(cp => {
      if (cp && (cp.status as string) !== 'Cancelled' && cp.status !== 'Pending' && (cp.status as string) !== 'Unpaid') {
        const paid = Number(cp.totalPaid || 0);
        if (paid > 0 && cp.clientId) {
          const curr = clientPaidRecorded.get(cp.clientId) || 0;
          clientPaidRecorded.set(cp.clientId, curr + paid);
        }
      }
    });

    // For projects without clientPayments, check project advance / paid status
    projects.forEach(p => {
      if (p.clientId) {
        const pId = String(p.id);
        const hasCp = uniqueClientPayments.some(cp => String(cp.projectId) === pId);
        if (!hasCp) {
          const adv = Number(p.advancePayment || 0);
          const isPaid = p.paymentStatus === 'Paid';
          const budgetVal = Number(p.totalProjectValue || p.budget || 0);
          const collected = isPaid ? (adv > 0 ? adv : budgetVal) : (p.paymentStatus === 'Partial' ? adv : 0);
          if (collected > 0) {
            const curr = clientPaidRecorded.get(p.clientId) || 0;
            clientPaidRecorded.set(p.clientId, curr + collected);
          }
        }
      }
    });

    clients.forEach(c => {
      const paid = clientPaidRecorded.get(c.id) || 0;
      const clientProjects = projects.filter(p => p.clientId === c.id);
      const projectBudgetSum = clientProjects.reduce((s, p) => s + (Number(p.totalProjectValue || p.budget) || 0), 0);
      const totalBudget = projectBudgetSum > 0 ? projectBudgetSum : Number(c.totalValue || 0);
      map.set(c.id, { totalBudget, paid });
    });

    return map;
  }, [clients, projects, uniqueClientPayments]);

  // 8. LATEST CLIENTS & RECENT LEADS (Cleaned)
  const latestClients = useMemo(() => {
    return [...clients]
      .sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, 5);
  }, [clients]);

  const recentLeads = useMemo(() => {
    return [...leads]
      .sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, 5);
  }, [leads]);

  const todayMeetings = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return meetings.filter(m => m.date === today && m.status !== 'Cancelled')
                   .sort((a, b) => a.time.localeCompare(b.time));
  }, [meetings]);

  return (
    <motion.div 
      id="dashboard-view" 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 text-[var(--crm-text)]"
    >
      
      {/* 1. HEADER SECTION */}
      <motion.div variants={itemVariants} id="dashboard-header" className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
        <div>
          <h1 className="text-[30px] sm:text-[32px] font-bold tracking-tight !text-white text-white font-structure leading-[1.2] section-main-heading">
            Dashboard
          </h1>
          <p className="!text-white text-white text-sm font-normal italic mt-1 section-sub-heading" style={{ color: '#fcf9f9' }}>
            System pulse, pipeline analytics, and client delivery tracking.
          </p>
        </div>
      </motion.div>

      {/* TODAY'S MEETINGS ALERT */}
      {sessionStorage.getItem('zyqro_user_role') !== 'Team' && todayMeetings.length > 0 && (
        <motion.div variants={itemVariants} className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-500 shrink-0">
              <Video size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--crm-heading)]">You have {todayMeetings.length} meeting{todayMeetings.length > 1 ? 's' : ''} today</h3>
              <p className="text-xs text-[var(--crm-subtitle)] mt-0.5">Check the Discussions tab for join links and details.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {todayMeetings.slice(0, 3).map(m => (
              <div key={m.id} className="bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-lg px-3 py-1.5 flex flex-col justify-center min-w-[120px]">
                <span className="text-[10px] text-[var(--crm-text-muted)] font-medium mb-0.5">{m.time}</span>
                <span className="text-xs font-semibold text-[var(--crm-text)] truncate max-w-[120px] 2xl:max-w-[180px] 2xl:max-w-[300px] 3xl:max-w-[500px] 4k:max-w-none 3xl:max-w-[350px] 4k:max-w-none" title={m.clientName}>{m.clientName}</span>
              </div>
            ))}
            {todayMeetings.length > 3 && (
              <div className="bg-[var(--crm-card)] border border-[var(--crm-card-border)] rounded-lg px-3 py-1.5 flex items-center justify-center text-xs font-medium text-[var(--crm-subtitle)]">
                +{todayMeetings.length - 3} more
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* 3. TODAY'S SNAPSHOT (Compact 4-stat bar) */}
      <motion.div variants={itemVariants} className="bg-[var(--crm-card)] rounded-xl p-4 border border-[var(--crm-card-border)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1 shrink-0">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold tracking-wider uppercase text-[var(--crm-heading)] font-structure">
              Today's Snapshot
            </span>
          </div>
          <span className="text-[11px] text-[var(--crm-subtitle)] font-medium">
            {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1 w-full md:w-auto">
          <div className="flex flex-col p-3 bg-[var(--crm-sidebar)] rounded-lg border border-[var(--crm-card-border)]">
            <span className="text-[11px] font-medium text-[var(--crm-subtitle)] mb-1 uppercase tracking-wide">New Leads</span>
            <span className="font-semibold text-lg text-[var(--crm-heading)] leading-none">{todaySnapshot.newLeadsToday}</span>
          </div>

          <div className="flex flex-col p-3 bg-[var(--crm-sidebar)] rounded-lg border border-[var(--crm-card-border)]">
            <span className="text-[11px] font-medium text-[var(--crm-subtitle)] mb-1 uppercase tracking-wide">New Clients</span>
            <span className="font-semibold text-lg text-[var(--crm-heading)] leading-none">{todaySnapshot.newClientsToday}</span>
          </div>

          <div className="flex flex-col p-3 bg-[var(--crm-sidebar)] rounded-lg border border-[var(--crm-card-border)]">
            <span className="text-[11px] font-medium text-[var(--crm-subtitle)] mb-1 uppercase tracking-wide">Payments</span>
            <span className="font-semibold text-lg text-[var(--crm-heading)] leading-none">{todaySnapshot.paymentsToday}</span>
          </div>

          <div className="flex flex-col p-3 bg-[var(--crm-sidebar)] rounded-lg border border-[var(--crm-card-border)]">
            <span className="text-[11px] font-medium text-[var(--crm-subtitle)] mb-1 uppercase tracking-wide">Proj. Updated</span>
            <span className="font-semibold text-lg text-[var(--crm-heading)] leading-none">{todaySnapshot.projectsUpdatedToday}</span>
          </div>
        </div>
      </motion.div>

      {/* 4. TOP 4 DASHBOARD METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Metric 1: TOTAL REVENUE */}
        <motion.div 
          variants={itemVariants}
          onClick={() => setShowRevenueModal(true)}
          className="group bg-[var(--crm-card)] rounded-xl p-4 border border-[var(--crm-card-border)] shadow-xs hover:border-[var(--crm-heading)]/20 hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col gap-3"
        >
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400">
              <DollarSign size={15} strokeWidth={2.5} />
            </div>
            <p className="text-[11px] font-semibold text-[var(--crm-subtitle)] uppercase tracking-wide truncate">
              Total Revenue
            </p>
          </div>
          <div className="text-2xl font-bold text-[var(--crm-heading)] leading-none tracking-tight">
            {metrics.hasRevenueData ? (
              <AnimatedNumber value={Math.round(metrics.totalRevenue)} prefix="$" />
            ) : (
              <span className="text-sm font-medium text-[var(--crm-subtitle)]">No data</span>
            )}
          </div>
        </motion.div>

        {/* Metric 2: ACTIVE PROJECTS */}
        <motion.div 
          variants={itemVariants}
          onClick={() => onNavigate('projects')}
          className="group bg-[var(--crm-card)] rounded-xl p-4 border border-[var(--crm-card-border)] shadow-xs hover:border-[var(--crm-heading)]/20 hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col gap-3"
        >
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400">
              <Briefcase size={15} strokeWidth={2.5} />
            </div>
            <p className="text-[11px] font-semibold text-[var(--crm-subtitle)] uppercase tracking-wide truncate">
              Active Projects
            </p>
          </div>
          <div className="text-2xl font-bold text-[var(--crm-heading)] leading-none tracking-tight">
            {metrics.hasProjectsData ? (
              <AnimatedNumber value={metrics.activeProjectsCount} />
            ) : (
              <span className="text-sm font-medium text-[var(--crm-subtitle)]">No data</span>
            )}
          </div>
        </motion.div>

        {/* Metric 3: LEADS IN PIPELINE */}
        <motion.div 
          variants={itemVariants}
          onClick={() => onNavigate('leads')}
          className="group bg-[var(--crm-card)] rounded-xl p-4 border border-[var(--crm-card-border)] shadow-xs hover:border-[var(--crm-heading)]/20 hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col gap-3"
        >
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
              <TrendingUp size={15} strokeWidth={2.5} />
            </div>
            <p className="text-[11px] font-semibold text-[var(--crm-subtitle)] uppercase tracking-wide truncate">
              Pipeline Leads
            </p>
          </div>
          <div className="text-2xl font-bold text-[var(--crm-heading)] leading-none tracking-tight">
            {metrics.hasLeadsData ? (
              <AnimatedNumber value={metrics.leadsInPipelineCount} />
            ) : (
              <span className="text-sm font-medium text-[var(--crm-subtitle)]">No data</span>
            )}
          </div>
        </motion.div>

        {/* Metric 4: TOTAL CLIENTS */}
        <motion.div 
          variants={itemVariants}
          onClick={() => onNavigate('clients')}
          className="group bg-[var(--crm-card)] rounded-xl p-4 border border-[var(--crm-card-border)] shadow-xs hover:border-[var(--crm-heading)]/20 hover:shadow-sm transition-all duration-200 cursor-pointer flex flex-col gap-3"
        >
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-indigo-500/10 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-400">
              <Users size={15} strokeWidth={2.5} />
            </div>
            <p className="text-[11px] font-semibold text-[var(--crm-subtitle)] uppercase tracking-wide truncate">
              Total Clients
            </p>
          </div>
          <div className="text-2xl font-bold text-[var(--crm-heading)] leading-none tracking-tight">
            {clients.length > 0 ? (
              <AnimatedNumber value={metrics.totalClientsCount} />
            ) : (
              <span className="text-sm font-medium text-[var(--crm-subtitle)]">No data</span>
            )}
          </div>
        </motion.div>
      </div>

      {/* 5. MAIN ANALYTICS ROW (Deal Pipeline) */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        
        {/* LEFT: DEAL PIPELINE STAGES & CONVERSION RATE (12 cols) */}
        <div className="lg:col-span-12 bg-[var(--crm-card)] rounded-xl p-5 border border-[var(--crm-card-border)] shadow-xs flex flex-col justify-between">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[13px] font-bold uppercase tracking-wider text-[var(--crm-heading)] font-structure">
                Deal Pipeline Stages
              </h3>
              
              {/* LEAD CONVERSION RATE BADGE */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--crm-sidebar)] rounded-lg border border-[var(--crm-card-border)]">
                <Percent size={12} className="text-emerald-500" />
                <span className="text-xs font-medium text-[var(--crm-subtitle)]">Conversion Rate:</span>
                <span className="font-bold text-xs text-[var(--crm-heading)]">
                  {metrics.leadConversionRate !== null ? `${metrics.leadConversionRate}%` : 'No data'}
                </span>
              </div>
            </div>
            <p className="text-xs text-[var(--crm-subtitle)]">
              Distribution of prospective leads and qualification progress across current stages.
            </p>
          </div>

          {/* Pipeline stages list - Compact Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {pipelineStages.map((stage) => {
              return (
                <div key={stage.key} className="p-3 bg-[var(--crm-sidebar)] rounded-xl border border-[var(--crm-card-border)] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider mb-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${stage.dotColor}`} />
                      <span className="text-[var(--crm-subtitle)] truncate">{stage.label}</span>
                    </div>
                  </div>
                  <div className="flex items-end justify-between mt-1">
                    <div className="text-2xl font-bold text-[var(--crm-heading)] leading-none">
                      {stage.count}
                    </div>
                    <div className="text-xs font-mono font-medium text-[var(--crm-subtitle)] bg-[var(--crm-card)] px-1.5 py-0.5 rounded border border-[var(--crm-card-border)]">
                      {stage.percentage}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-[var(--crm-card-border)] pt-4 mt-5 flex justify-between items-center">
            <span className="text-xs font-medium text-[var(--crm-subtitle)] tracking-wide">
              Active Pipeline Leads: <strong className="text-[var(--crm-heading)]">{metrics.leadsInPipelineCount}</strong>
            </span>
          </div>
        </div>
      </motion.div>

      {/* 7. CRITICAL DEADLINES */}
      <motion.div variants={itemVariants} className="bg-[var(--crm-card)] rounded-xl p-5 border border-[var(--crm-card-border)] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock size={16} className={criticalDeadlines.some(d => d.isOverdue) ? 'text-rose-500' : 'text-amber-500'} />
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-[var(--crm-heading)] font-structure">
              Critical Deadlines
            </h3>
          </div>
          <span className="text-xs text-[var(--crm-subtitle)]">
            Tracking urgent deliverables within 48 hours or overdue
          </span>
        </div>

        {criticalDeadlines.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center bg-[var(--crm-sidebar)] rounded-xl border border-dashed border-[var(--crm-card-border)] text-center">
            <div className="h-10 w-10 bg-emerald-500/10 rounded-full flex items-center justify-center mb-2">
              <CheckCircle size={20} className="text-emerald-500" />
            </div>
            <p className="text-xs font-semibold text-[var(--crm-heading)]">All schedules are clear</p>
            <p className="text-[11px] text-[var(--crm-subtitle)] mt-1">No urgent or overdue deliverables recorded.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 4k:grid-cols-7 5k:grid-cols-10 gap-3">
            {criticalDeadlines.map((item) => (
              <div 
                key={item.id}
                onClick={() => onNavigate('projects')}
                className={`p-3 rounded-xl border flex flex-col justify-between gap-3 cursor-pointer hover:shadow-xs hover:border-[var(--crm-heading)]/20 transition-all ${
                  item.isOverdue ? 'bg-rose-500/5 border-rose-500/30' : 'bg-[var(--crm-sidebar)] border-[var(--crm-card-border)]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      item.isOverdue ? 'bg-rose-600 text-white' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                    }`}>
                      {item.status}
                    </span>
                    <span className="text-[11px] font-mono font-medium text-[var(--crm-subtitle)]">
                      {item.daysText}
                    </span>
                  </div>
                  <h4 className="font-semibold text-[var(--crm-heading)] text-[13px] truncate leading-snug">
                    {item.name}
                  </h4>
                  <p className="text-xs text-[var(--crm-subtitle)] truncate mt-1">
                    Client: {item.client}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-[var(--crm-card-border)] flex items-center justify-between text-[11px] text-[var(--crm-subtitle)] font-medium">
                  <span>Deadline: <span className="text-[var(--crm-heading)]">{item.deadline}</span></span>
                  <ArrowRight size={14} className="text-[var(--crm-text-secondary)] group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* 9. LATEST CLIENTS + RECENT LEADS ROW */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        
        {/* LATEST CLIENTS */}
        <div className="bg-[var(--crm-card)] rounded-xl p-5 border border-[var(--crm-card-border)] shadow-xs flex flex-col justify-between">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[13px] font-bold uppercase tracking-wider text-[var(--crm-heading)] font-structure">
                Latest Clients
              </h3>
              <button onClick={() => onNavigate('clients')} className="text-xs font-semibold text-indigo-500 hover:text-indigo-600">View All</button>
            </div>
          </div>

          <div className="space-y-2 flex-1">
            {latestClients.length === 0 ? (
              <div className="py-4 flex flex-col items-center justify-center bg-[var(--crm-sidebar)] rounded-xl border border-dashed border-[var(--crm-card-border)] text-center">
                <p className="text-xs text-[var(--crm-subtitle)] font-medium">No clients registered</p>
              </div>
            ) : (
              latestClients.map((client) => {
                const hasValidValue = typeof client.totalValue === 'number' && client.totalValue > 0;
                return (
                  <div
                    key={client.id}
                    onClick={() => {
                      if (onSelectClient) {
                        onSelectClient(client.id);
                      } else {
                        onNavigate('clients');
                      }
                    }}
                    className="p-2.5 bg-[var(--crm-sidebar)] hover:bg-[var(--crm-sidebar-active-bg)] rounded-xl border border-[var(--crm-card-border)] transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-[12px] text-[var(--crm-heading)] truncate">{client.company || client.name}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[var(--crm-subtitle)]">
                        <span className="font-mono text-[10px] font-medium text-slate-500">#{client.id}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <span className="font-bold text-[12px] text-[var(--crm-heading)] block">
                        {hasValidValue ? `$${client.totalValue.toLocaleString()}` : '-'}
                      </span>
                      <span className="inline-block px-1.5 py-0.5 rounded bg-[var(--crm-card)] border border-[var(--crm-card-border)] text-[9px] font-bold uppercase text-[var(--crm-subtitle)]">{client.status || 'Active'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RECENT LEADS */}
        <div className="bg-[var(--crm-card)] rounded-xl p-5 border border-[var(--crm-card-border)] shadow-xs flex flex-col justify-between">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[13px] font-bold uppercase tracking-wider text-[var(--crm-heading)] font-structure">
                Recent Leads
              </h3>
              <button onClick={() => onNavigate('leads')} className="text-xs font-semibold text-indigo-500 hover:text-indigo-600">View All</button>
            </div>
          </div>

          <div className="space-y-2 flex-1">
            {recentLeads.length === 0 ? (
              <div className="py-4 flex flex-col items-center justify-center bg-[var(--crm-sidebar)] rounded-xl border border-dashed border-[var(--crm-card-border)] text-center">
                <p className="text-xs text-[var(--crm-subtitle)] font-medium">No leads recorded</p>
              </div>
            ) : (
              recentLeads.map((lead) => {
                const hasValidBudget = typeof lead.value === 'number' && lead.value > 0;
                return (
                  <div
                    key={lead.id}
                    onClick={() => {
                      if (onSelectLead) {
                        onSelectLead(lead.id);
                      } else {
                        onNavigate('leads');
                      }
                    }}
                    className="p-2.5 bg-[var(--crm-sidebar)] hover:bg-[var(--crm-sidebar-active-bg)] rounded-xl border border-[var(--crm-card-border)] transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-[12px] text-[var(--crm-heading)] truncate">{lead.name}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[var(--crm-subtitle)]">
                        <span className="font-mono text-[10px] font-medium text-slate-500">#{lead.id}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <span className="font-bold text-[12px] text-indigo-500 block">
                        {hasValidBudget ? `$${lead.value.toLocaleString()}` : '-'}
                      </span>
                      <span className="inline-block px-1.5 py-0.5 rounded bg-[var(--crm-card)] border border-[var(--crm-card-border)] text-[9px] font-bold uppercase text-[var(--crm-subtitle)] mt-1">
                        {lead.status || 'New'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </motion.div>



      {/* 11. REVENUE BREAKDOWN MODAL */}
      <AnimatePresence>
        {showRevenueModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 4 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="bg-[var(--crm-card)] rounded-xl max-w-xl 2xl:max-w-2xl 3xl:max-w-3xl 4k:max-w-5xl 5k:max-w-6xl w-full p-5 shadow-2xl border border-[var(--crm-card-border)] space-y-4 text-xs"
            >
              <div className="flex items-center justify-between border-b border-[var(--crm-card-border)] pb-3">
                <div className="flex items-center gap-2">
                  <DollarSign size={18} className="text-emerald-500" />
                  <h3 className="text-sm font-semibold text-[var(--crm-text)] font-structure">
                    Total Revenue Breakdown
                  </h3>
                </div>
                <button 
                  onClick={() => setShowRevenueModal(false)}
                  className="p-1 text-[var(--crm-subtitle)] hover:text-[var(--crm-text)] rounded transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 bg-[var(--crm-sidebar)] rounded-lg border border-[var(--crm-card-border)]">
                  <span className="text-[10px] text-[var(--crm-subtitle)] uppercase block">Total Contract</span>
                  <span className="text-sm font-semibold text-[var(--crm-text)] mt-1 block">
                    ${Math.round(metrics.totalContractValue).toLocaleString()}
                  </span>
                </div>

                <div className="p-3 bg-[var(--crm-sidebar)] rounded-lg border border-[var(--crm-card-border)]">
                  <span className="text-[10px] text-emerald-500 uppercase block">Received</span>
                  <span className="text-sm font-semibold text-emerald-500 mt-1 block">
                    ${Math.round(metrics.collectedRevenue).toLocaleString()}
                  </span>
                </div>

                <div className="p-3 bg-[var(--crm-sidebar)] rounded-lg border border-[var(--crm-card-border)]">
                  <span className="text-[10px] text-amber-500 uppercase block">Pending</span>
                  <span className="text-sm font-semibold text-amber-500 mt-1 block">
                    ${Math.round(metrics.pendingPayments).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-[11px] font-medium text-[var(--crm-subtitle)] uppercase">Client Contracts & Collections</h4>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {clients.length === 0 ? (
                    <p className="text-[11px] text-[var(--crm-subtitle)] py-2">No client contracts recorded.</p>
                  ) : (
                    clients.map(client => {
                      const clientFin = clientReceivedMap.get(client.id) || { totalBudget: Number(client.totalValue || 0), paid: 0 };
                      return (
                        <div key={client.id} className="flex items-center justify-between p-2.5 bg-[var(--crm-sidebar)] rounded-lg border border-[var(--crm-card-border)]">
                          <div>
                            <p className="font-medium text-[var(--crm-text)]">{client.company || client.name}</p>
                            <p className="text-[10px] text-[var(--crm-subtitle)]">{client.serviceType || 'Client'} • {client.projectProgress || 0}% progress</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-[var(--crm-text)]">${clientFin.totalBudget.toLocaleString()}</p>
                            <p className="text-[10px] text-emerald-500">
                              ${Math.round(clientFin.paid).toLocaleString()} received
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2.5 border-t border-[var(--crm-card-border)]">
                <button
                  onClick={() => {
                    setShowRevenueModal(false);
                    onNavigate('payments');
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer text-xs font-medium"
                >
                  Go to Payments Ledger
                </button>
                <button
                  onClick={() => setShowRevenueModal(false)}
                  className="px-3 py-1.5 bg-[var(--crm-sidebar)] hover:bg-[var(--crm-sidebar-active-bg)] text-[var(--crm-text)] rounded-lg transition-colors cursor-pointer text-xs"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
