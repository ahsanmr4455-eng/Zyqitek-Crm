import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Search, Archive, RefreshCw, ChevronRight, Briefcase, DollarSign, 
  Users, ShieldCheck, Mail, Phone, Building2, Calendar, FileText, Trash2,
  UserCheck, Key, Lock
} from 'lucide-react';
import { 
  Client, Project, TeamMember, EmailDiscussion, CallDiscussion, 
  ConversationDiscussion, ClientPaymentRecord, ClientPortalAccount, TeamPortalAccount 
} from '../types';
import { getMasterClientId, getMasterTeamMemberId } from '../lib/clientIdUtils';
import { getCollectionOnce, saveToFirestore } from '../lib/firebaseSync';
import CrmProfileView from './CrmProfileView';

interface ArchiveManagerProps {
  clients: Client[];
  projects: Project[];
  teamMembers: TeamMember[];
  clientPayments: ClientPaymentRecord[];
  emailDiscussions: EmailDiscussion[];
  callDiscussions: CallDiscussion[];
  conversationDiscussions: ConversationDiscussion[];
  onUpdateClient: (updatedClient: Client) => Promise<boolean | void>;
  onDeleteClient: (id: string) => Promise<boolean | void>;
  onUpdateTeamMember?: (updatedMember: TeamMember) => Promise<boolean | void>;
  onDeleteTeamMember?: (id: string) => Promise<boolean | void>;
}

export default function ArchiveManager({
  clients,
  projects,
  teamMembers,
  clientPayments,
  emailDiscussions,
  callDiscussions,
  conversationDiscussions,
  onUpdateClient,
  onDeleteClient,
  onUpdateTeamMember,
  onDeleteTeamMember
}: ArchiveManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Clients' | 'Team Members' | 'Portals'>('All');
  
  const [selectedClientProfile, setSelectedClientProfile] = useState<Client | null>(null);
  const [selectedTeamProfile, setSelectedTeamProfile] = useState<TeamMember | null>(null);

  // Portal records loaded from Firestore
  const [clientPortals, setClientPortals] = useState<ClientPortalAccount[]>([]);
  const [teamPortals, setTeamPortals] = useState<TeamPortalAccount[]>([]);
  const [isLoadingPortals, setIsLoadingPortals] = useState(true);

  const fetchPortals = async () => {
    setIsLoadingPortals(true);
    try {
      const [cp, tp] = await Promise.all([
        getCollectionOnce<ClientPortalAccount>('clientPortals').catch(() => []),
        getCollectionOnce<TeamPortalAccount>('teamPortals').catch(() => [])
      ]);
      setClientPortals(cp);
      setTeamPortals(tp);
    } catch (err) {
      console.error('Failed to load portal accounts for archive:', err);
    } finally {
      setIsLoadingPortals(false);
    }
  };

  useEffect(() => {
    fetchPortals();
  }, []);

  // Filtered Archived Records
  const archivedClients = useMemo(() => {
    let list = clients.filter(c => c.status === 'Archived');
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(client => {
        const clientProjects = projects.filter(p => p.clientId === client.id);
        const masterId = getMasterClientId(client).toLowerCase();
        const leadId = ((client as any).leadId || '').toLowerCase();
        return masterId.includes(q) || leadId.includes(q) || client.id.toLowerCase().includes(q) ||
               (client.name || '').toLowerCase().includes(q) ||
               (client.company || '').toLowerCase().includes(q) ||
               (client.email || '').toLowerCase().includes(q) ||
               (client.phone || '').toLowerCase().includes(q) ||
               clientProjects.some(p => p.name.toLowerCase().includes(q));
      });
    }
    return list;
  }, [clients, searchQuery, projects]);

  const archivedTeamMembers = useMemo(() => {
    let list = teamMembers.filter(m => (m.status || 'Active') === 'Archived');
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(m => {
        const id = getMasterTeamMemberId(m).toLowerCase();
        return id.includes(q) || m.id.toLowerCase().includes(q) ||
               (m.fullName || '').toLowerCase().includes(q) ||
               (m.role || '').toLowerCase().includes(q) ||
               (m.service || '').toLowerCase().includes(q) ||
               (m.email || '').toLowerCase().includes(q);
      });
    }
    return list;
  }, [teamMembers, searchQuery]);

  const archivedClientPortals = useMemo(() => {
    let list = clientPortals.filter(p => p.status === 'Archived');
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(p => 
        (p.portalId || '').toLowerCase().includes(q) ||
        (p.clientName || '').toLowerCase().includes(q) ||
        (p.clientCompany || '').toLowerCase().includes(q) ||
        (p.username || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [clientPortals, searchQuery]);

  const archivedTeamPortals = useMemo(() => {
    let list = teamPortals.filter(p => p.status === 'Archived');
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(p => {
        const matchedMember = teamMembers.find(m => m.id === p.teamMemberId);
        const name = matchedMember ? matchedMember.fullName : '';
        return (p.id || '').toLowerCase().includes(q) ||
               (p.username || '').toLowerCase().includes(q) ||
               name.toLowerCase().includes(q);
      });
    }
    return list;
  }, [teamPortals, teamMembers, searchQuery]);

  // Counts
  const totalArchivedCount = archivedClients.length + archivedTeamMembers.length + archivedClientPortals.length + archivedTeamPortals.length;

  // Reactivate Handlers
  const handleReactivateClient = async (client: Client, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Are you sure you want to reactivate ${client.name}? This will restore their status to Active.`)) {
      try {
        await onUpdateClient({
          ...client,
          status: 'Active',
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error("Failed to reactivate client", err);
      }
    }
  };

  const handleReactivateTeamMember = async (member: TeamMember, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Are you sure you want to reactivate ${member.fullName}? This will restore their status to Active.`)) {
      if (onUpdateTeamMember) {
        try {
          await onUpdateTeamMember({
            ...member,
            status: 'Active',
            updatedAt: new Date().toISOString()
          });
        } catch (err) {
          console.error("Failed to reactivate team member", err);
        }
      }
    }
  };

  const handleReactivateClientPortal = async (portal: ClientPortalAccount, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Are you sure you want to reactivate the portal for ${portal.clientName}?`)) {
      try {
        const updated = { ...portal, status: 'Active', updatedAt: new Date().toISOString() };
        await saveToFirestore('clientPortals', portal.id, updated);
        setClientPortals(prev => prev.map(p => p.id === portal.id ? updated : p));
      } catch (err) {
        console.error("Failed to reactivate client portal", err);
      }
    }
  };

  const handleReactivateTeamPortal = async (portal: TeamPortalAccount, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Are you sure you want to reactivate this team portal?`)) {
      try {
        const updated = { ...portal, status: 'Active', updatedAt: new Date().toISOString() };
        await saveToFirestore('teamPortals', portal.id, updated);
        setTeamPortals(prev => prev.map(p => p.id === portal.id ? updated : p));
      } catch (err) {
        console.error("Failed to reactivate team portal", err);
      }
    }
  };

  const showClients = typeFilter === 'All' || typeFilter === 'Clients';
  const showTeam = typeFilter === 'All' || typeFilter === 'Team Members';
  const showPortals = typeFilter === 'All' || typeFilter === 'Portals';

  return (
    <div className="space-y-6 text-xs text-[var(--crm-text-secondary)] font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-[30px] sm:text-[32px] font-bold tracking-tight text-[var(--crm-heading)] font-structure leading-[1.2]">
            Archive
          </h1>
          <p className="!text-white text-white text-sm font-normal italic mt-1 section-sub-heading" style={{ color: '#ffffff' }}>
            Access and manage archived historical records across Clients, Team Members, and Portals.
          </p>
        </div>
      </div>

      {/* Control Panel: Filters & Search */}
      <div className="bg-[var(--crm-card)] rounded-xl border border-[var(--crm-card-border)] p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Record Type Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['All', 'Clients', 'Team Members', 'Portals'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setTypeFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                typeFilter === tab
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-[var(--crm-sidebar)] text-[var(--crm-text-muted)] hover:text-[var(--crm-text)] hover:bg-[var(--crm-card-input-bg-hover)]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80 shrink-0">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--crm-text-muted)]">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Search by ID, Name, Email, Role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[var(--crm-card-input-bg)] hover:bg-[var(--crm-card-input-bg-hover)] focus:bg-[var(--crm-card-input-bg-focus)] text-[var(--crm-text)] placeholder-[var(--crm-text-muted)] text-xs rounded-lg border border-[var(--crm-card-border)] focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Content Grid */}
      <div className="space-y-6">
        {totalArchivedCount === 0 ? (
          <div className="text-center py-16 bg-[var(--crm-card)] rounded-xl border border-[var(--crm-card-border)] text-[var(--crm-text-muted)] shadow-xs">
            <Archive size={40} className="mx-auto mb-3 opacity-30 text-indigo-500" />
            <p className="text-sm font-semibold text-[var(--crm-text)]">No archived records found.</p>
            <p className="text-xs text-[var(--crm-text-muted)] mt-1.5">
              {searchQuery ? 'Try adjusting your search keywords or filter tab.' : 'Records archived from operational lists will appear here.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {/* 1. ARCHIVED CLIENTS */}
            {showClients && archivedClients.map((client) => {
              const clientProjects = projects.filter(p => p.clientId === client.id);
              const totalProjectValue = clientProjects.reduce((sum, p) => sum + Number(p.totalProjectValue || p.budget || 0), 0) || Number(client.totalValue || 0);
              const linkedPayments = clientPayments.filter(p => p.clientId === client.id || p.clientName.toLowerCase() === client.name.toLowerCase());
              const totalReceived = linkedPayments.reduce((sum, p) => sum + Number(p.totalPaid || 0), 0);
              const masterId = getMasterClientId(client);

              return (
                <motion.div
                  key={`client-${client.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedClientProfile(client)}
                  className="bg-[var(--crm-card)] hover:bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between h-full hover:shadow-md hover:scale-[1.01] relative overflow-hidden group select-none"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-mono text-[9px] text-[var(--crm-text-muted)] font-bold tracking-wide block uppercase">
                          {masterId}
                        </span>
                        <h4 className="font-bold text-sm text-[var(--crm-text)] truncate mt-1 group-hover:text-indigo-500 transition-colors">
                          {client.name}
                        </h4>
                        {client.company && (
                          <p className="text-[10px] text-[var(--crm-text-muted)] truncate flex items-center gap-1 mt-0.5">
                            <Building2 size={10} className="shrink-0" />
                            <span>{client.company}</span>
                          </p>
                        )}
                      </div>

                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
                        <Users size={8} /> Client
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-2 border-t border-[var(--crm-card-border)] pt-3 mt-3 text-[10px]">
                      <div>
                        <span className="text-[9px] text-[var(--crm-text-muted)] uppercase tracking-wider block">Total Value</span>
                        <span className="font-semibold text-[var(--crm-text)] font-mono">${totalProjectValue.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[var(--crm-text-muted)] uppercase tracking-wider block">Received</span>
                        <span className="font-semibold text-emerald-600 font-mono">${totalReceived.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[var(--crm-card-border)] flex items-center justify-between gap-2">
                    <button
                      onClick={(e) => handleReactivateClient(client, e)}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[10px] rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm cursor-pointer shrink-0"
                      title="Restore client account to active list"
                    >
                      <RefreshCw size={11} />
                      <span>Reactivate</span>
                    </button>

                    <div className="text-indigo-500 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 text-[10px] font-medium">
                      <span>View Profile</span>
                      <ChevronRight size={12} />
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* 2. ARCHIVED TEAM MEMBERS */}
            {showTeam && archivedTeamMembers.map((member) => {
              const displayId = getMasterTeamMemberId(member);

              return (
                <motion.div
                  key={`team-${member.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedTeamProfile(member)}
                  className="bg-[var(--crm-card)] hover:bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between h-full hover:shadow-md hover:scale-[1.01] relative overflow-hidden group select-none"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-mono text-[9px] text-[var(--crm-text-muted)] font-bold tracking-wide block uppercase">
                          {displayId}
                        </span>
                        <h4 className="font-bold text-sm text-[var(--crm-text)] truncate mt-1 group-hover:text-indigo-500 transition-colors">
                          {member.fullName}
                        </h4>
                        <p className="text-[10px] text-[var(--crm-text-muted)] truncate mt-0.5 font-medium">
                          {member.role} {member.service ? `• ${member.service}` : ''}
                        </p>
                      </div>

                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                        <UserCheck size={8} /> Team Member
                      </span>
                    </div>

                    <div className="space-y-1.5 border-t border-[var(--crm-card-border)] pt-3 mt-3 text-[10px]">
                      {member.email && (
                        <p className="text-[var(--crm-text-muted)] truncate flex items-center gap-1.5">
                          <Mail size={11} className="shrink-0 text-indigo-500" />
                          <span>{member.email}</span>
                        </p>
                      )}
                      {member.phone && (
                        <p className="text-[var(--crm-text-muted)] truncate flex items-center gap-1.5">
                          <Phone size={11} className="shrink-0 text-indigo-500" />
                          <span>{member.phone}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[var(--crm-card-border)] flex items-center justify-between gap-2">
                    <button
                      onClick={(e) => handleReactivateTeamMember(member, e)}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[10px] rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm cursor-pointer shrink-0"
                      title="Restore team member to active roster"
                    >
                      <RefreshCw size={11} />
                      <span>Reactivate</span>
                    </button>

                    <div className="text-indigo-500 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 text-[10px] font-medium">
                      <span>View Profile</span>
                      <ChevronRight size={12} />
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* 3. ARCHIVED CLIENT PORTALS */}
            {showPortals && archivedClientPortals.map((portal) => (
              <motion.div
                key={`cp-${portal.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[var(--crm-card)] hover:bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl p-4 transition-all duration-200 flex flex-col justify-between h-full relative overflow-hidden group select-none"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-mono text-[9px] text-[var(--crm-text-muted)] font-bold tracking-wide block uppercase">
                        {portal.portalId}
                      </span>
                      <h4 className="font-bold text-sm text-[var(--crm-text)] truncate mt-1">
                        {portal.clientName}
                      </h4>
                      {portal.clientCompany && (
                        <p className="text-[10px] text-[var(--crm-text-muted)] truncate mt-0.5">
                          {portal.clientCompany}
                        </p>
                      )}
                    </div>

                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 shrink-0">
                      <ShieldCheck size={8} /> Client Portal
                    </span>
                  </div>

                  <div className="space-y-1 border-t border-[var(--crm-card-border)] pt-3 mt-3 text-[10px]">
                    <p className="text-[var(--crm-text-muted)] truncate flex items-center gap-1.5">
                      <Key size={11} className="shrink-0 text-indigo-500" />
                      <span>User: <strong className="text-[var(--crm-text)]">{portal.username}</strong></span>
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--crm-card-border)] flex items-center justify-between gap-2">
                  <button
                    onClick={(e) => handleReactivateClientPortal(portal, e)}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[10px] rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm cursor-pointer shrink-0"
                    title="Reactivate client portal access"
                  >
                    <RefreshCw size={11} />
                    <span>Reactivate</span>
                  </button>
                </div>
              </motion.div>
            ))}

            {/* 4. ARCHIVED TEAM PORTALS */}
            {showPortals && archivedTeamPortals.map((portal) => {
              const matchedMember = teamMembers.find(m => m.id === portal.teamMemberId);
              const name = matchedMember ? matchedMember.fullName : portal.username;

              return (
                <motion.div
                  key={`tp-${portal.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[var(--crm-card)] hover:bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] rounded-xl p-4 transition-all duration-200 flex flex-col justify-between h-full relative overflow-hidden group select-none"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-mono text-[9px] text-[var(--crm-text-muted)] font-bold tracking-wide block uppercase">
                          {portal.id}
                        </span>
                        <h4 className="font-bold text-sm text-[var(--crm-text)] truncate mt-1">
                          {name}
                        </h4>
                        <p className="text-[10px] text-[var(--crm-text-muted)] truncate mt-0.5 font-medium">
                          {matchedMember?.role || 'Team Workspace'}
                        </p>
                      </div>

                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                        <Briefcase size={8} /> Team Portal
                      </span>
                    </div>

                    <div className="space-y-1 border-t border-[var(--crm-card-border)] pt-3 mt-3 text-[10px]">
                      <p className="text-[var(--crm-text-muted)] truncate flex items-center gap-1.5">
                        <Key size={11} className="shrink-0 text-indigo-500" />
                        <span>User: <strong className="text-[var(--crm-text)]">{portal.username}</strong></span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[var(--crm-card-border)] flex items-center justify-between gap-2">
                    <button
                      onClick={(e) => handleReactivateTeamPortal(portal, e)}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[10px] rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm cursor-pointer shrink-0"
                      title="Reactivate team portal access"
                    >
                      <RefreshCw size={11} />
                      <span>Reactivate</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Historical Client Profile View Modal */}
      {selectedClientProfile && (
        <CrmProfileView
          isOpen={!!selectedClientProfile}
          onClose={() => setSelectedClientProfile(null)}
          type="Client"
          data={selectedClientProfile}
          emailDiscussions={emailDiscussions}
          callDiscussions={callDiscussions}
          conversationDiscussions={conversationDiscussions}
          projects={projects}
          teamMembers={teamMembers}
          clients={clients}
          clientPayments={clientPayments}
          onUpdateClient={async (updatedClient) => {
            await onUpdateClient(updatedClient);
            setSelectedClientProfile(updatedClient.status === 'Archived' ? updatedClient : null);
          }}
          onDelete={async (id) => {
            const success = await onDeleteClient(id);
            if (success) {
              setSelectedClientProfile(null);
            }
          }}
        />
      )}

      {/* Historical Team Member Profile View Modal */}
      {selectedTeamProfile && (
        <CrmProfileView
          isOpen={!!selectedTeamProfile}
          onClose={() => setSelectedTeamProfile(null)}
          type="Team Member"
          data={selectedTeamProfile}
          emailDiscussions={emailDiscussions}
          callDiscussions={callDiscussions}
          conversationDiscussions={conversationDiscussions}
          projects={projects}
          teamMembers={teamMembers}
          clients={clients}
          clientPayments={clientPayments}
          onUpdateTeamMember={async (updatedMember) => {
            if (onUpdateTeamMember) {
              await onUpdateTeamMember(updatedMember);
              setSelectedTeamProfile(updatedMember.status === 'Archived' ? updatedMember : null);
            }
          }}
          onDelete={async (id) => {
            if (onDeleteTeamMember) {
              const success = await onDeleteTeamMember(id);
              if (success) {
                setSelectedTeamProfile(null);
              }
            }
          }}
        />
      )}
    </div>
  );
}
