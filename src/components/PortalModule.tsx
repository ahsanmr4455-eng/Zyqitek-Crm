import React, { useState } from 'react';
import ClientPortalManager from './ClientPortalManager';
import TeamPortalManager from './TeamPortalManager';
import PortalChat from './PortalChat';
import { MessageSquare } from 'lucide-react';

interface PortalModuleProps {
  clients?: any[];
  projects?: any[];
  teamMembers?: any[];
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export default function PortalModule({ 
  clients = [], 
  projects = [], 
  teamMembers = [], 
  showToast = () => {} 
}: PortalModuleProps) {
  const [activeSubTab, setActiveSubTab] = useState<'client' | 'team' | 'chat'>('client');
  const [selectedChatConvId, setSelectedChatConvId] = useState<string>('');

  const handleOpenChat = (portalId: string, type: 'client' | 'team') => {
    setSelectedChatConvId(`${type}_${portalId}`);
    setActiveSubTab('chat');
  };

  return (
    <div className="max-w-7xl 3xl:max-w-[1600px] 4k:max-w-[2200px] 5k:max-w-[3400px] mx-auto space-y-8 p-6">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-[30px] sm:text-[32px] font-bold tracking-tight !text-white text-white font-structure leading-[1.2] section-main-heading">Portal</h1>
          <p className="!text-white text-white text-sm font-normal italic mt-1 section-sub-heading">
            Manage client and team portals securely.
          </p>
        </div>

        {/* Segmented Control */}
        <div className="flex bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveSubTab('client')}
            className={`px-6 py-2 rounded-lg text-sm transition-all duration-150 active:scale-[0.98] cursor-pointer ${
              activeSubTab === 'client'
                ? 'bg-[var(--crm-card)] text-[var(--crm-text)] font-bold shadow-sm ring-1 ring-black/5'
                : 'text-[var(--crm-subtitle)] hover:text-[var(--crm-heading)] font-medium'
            }`}
          >
            Client Portals
          </button>
          <button
            onClick={() => setActiveSubTab('team')}
            className={`px-6 py-2 rounded-lg text-sm transition-all duration-150 active:scale-[0.98] cursor-pointer ${
              activeSubTab === 'team'
                ? 'bg-[var(--crm-card)] text-[var(--crm-text)] font-bold shadow-sm ring-1 ring-black/5'
                : 'text-[var(--crm-subtitle)] hover:text-[var(--crm-heading)] font-medium'
            }`}
          >
            Team Portals
          </button>
          <button
            onClick={() => setActiveSubTab('chat')}
            className={`px-6 py-2 rounded-lg text-sm transition-all duration-150 active:scale-[0.98] cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'chat'
                ? 'bg-[var(--crm-card)] text-[var(--crm-text)] font-bold shadow-sm ring-1 ring-black/5'
                : 'text-[var(--crm-subtitle)] hover:text-[var(--crm-heading)] font-medium'
            }`}
          >
            <MessageSquare size={15} className="text-indigo-400" />
            <span>CHAT</span>
          </button>
        </div>
      </div>

      {/* Active Sub-Tab View */}
      <div className="pt-2">
        {activeSubTab === 'client' ? (
          <ClientPortalManager 
            clients={clients} 
            projects={projects}
            showToast={showToast}
            onOpenChat={handleOpenChat}
          />
        ) : activeSubTab === 'team' ? (
          <TeamPortalManager 
            teamMembers={teamMembers}
            projects={projects}
            showToast={showToast}
            onOpenChat={handleOpenChat}
          />
        ) : (
          <PortalChat
            mode="admin"
            currentUserId="admin"
            currentUserName="Zyqitek Administrator"
            currentUserRole="Admin"
            initialConversationId={selectedChatConvId}
            clients={clients}
            teamMembers={teamMembers}
            projects={projects}
            showToast={showToast}
          />
        )}
      </div>
    </div>
  );
}
