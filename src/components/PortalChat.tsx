import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Send, 
  Paperclip, 
  FileText, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  Archive, 
  Download, 
  CheckCheck, 
  Check, 
  User, 
  Shield, 
  Search, 
  RefreshCw, 
  X, 
  MessageSquare,
  Clock,
  Sparkles,
  Briefcase,
  Eye,
  AlertCircle,
  ArrowDown,
  Wifi,
  MoreVertical,
  ChevronLeft,
  Copy,
  Pin,
  PinOff,
  Trash2,
  Eraser,
  Reply
} from 'lucide-react';
import { ZyqitekLogo } from './ZyqroLogo';
import chatDoodleBg from '../assets/images/chat_doodle_wallpaper_1788351021602.jpg';
import croppedChatIconImg from '../assets/images/cropped_chat_icon_1788410283440.jpg';

// Preload the background wallpaper image to ensure immediate availability in memory
const preloadedBg = new Image();
preloadedBg.src = chatDoodleBg;
import { uploadPortalFile } from '../lib/fileStorage';
import { useLongPress } from '../lib/useLongPress';
import { PortalMessage, PortalPresence, TeamPortalAccount, ClientPortalAccount } from '../types';
import { getCollectionOnce } from '../lib/firebaseSync';

interface PortalChatProps {
  mode: 'portal' | 'admin';
  portalId?: string;
  portalClientId?: string;
  portalTeamMemberId?: string;
  portalType?: 'client' | 'team';
  portalName?: string;
  currentUserId?: string;
  currentUserName?: string;
  currentUserRole?: 'Admin' | 'Client' | 'Team Member';
  initialConversationId?: string;
  initialPortalId?: string;
  initialPortalType?: 'client' | 'team';
  clients?: any[];
  teamMembers?: any[];
  projects?: any[];
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function PortalChat({
  mode = 'portal',
  portalId = '',
  portalClientId = '',
  portalTeamMemberId = '',
  portalType = 'client',
  portalName = '',
  currentUserId = '',
  currentUserName = '',
  currentUserRole = 'Client',
  initialConversationId = '',
  initialPortalId = '',
  initialPortalType = 'client',
  clients = [],
  teamMembers = [],
  projects = [],
  showToast = () => {}
}: PortalChatProps) {
  // Determine canonical effective portal ID
  const effectivePortalId = useMemo(() => {
    if (portalType === 'client') {
      return portalClientId || portalId;
    }
    return portalTeamMemberId || portalId;
  }, [portalType, portalClientId, portalTeamMemberId, portalId]);

  const [selectedConversationId, setSelectedConversationId] = useState<string>(() => {
    if (initialConversationId) return initialConversationId;
    if (initialPortalId) return `${initialPortalType}_${initialPortalId}`;
    if (mode === 'portal') {
      return `${portalType}_${effectivePortalId}`;
    }
    return '';
  });

  const [activePortalType, setActivePortalType] = useState<'client' | 'team'>(() => {
    if (initialPortalType) return initialPortalType;
    if (initialConversationId) return initialConversationId.startsWith('team_') ? 'team' : 'client';
    return 'client';
  });

  // Mobile navigation state: in admin mode, toggles between conversation list and chat pane
  const [mobileShowChat, setMobileShowChat] = useState<boolean>(() => mode === 'portal');

  // Additional dynamic team portal accounts & client portal accounts for Admin mode
  const [extraTeamPortals, setExtraTeamPortals] = useState<TeamPortalAccount[]>([]);
  const [extraClientPortals, setExtraClientPortals] = useState<ClientPortalAccount[]>([]);

  // Load portal accounts in Admin mode
  useEffect(() => {
    if (mode !== 'admin') return;
    let isMounted = true;

    const loadPortals = () => {
      Promise.all([
        getCollectionOnce<TeamPortalAccount>('teamPortals').catch(() => []),
        getCollectionOnce<ClientPortalAccount>('clientPortals').catch(() => [])
      ]).then(([teams, clientsRes]) => {
        if (isMounted) {
          if (Array.isArray(teams)) setExtraTeamPortals(teams);
          if (Array.isArray(clientsRes)) setExtraClientPortals(clientsRes);
        }
      });
    };

    loadPortals();
    const interval = setInterval(loadPortals, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [mode]);

  // Sync initial conversation ID if props change
  useEffect(() => {
    if (initialConversationId) {
      setSelectedConversationId(initialConversationId);
      setActivePortalType(initialConversationId.startsWith('team_') ? 'team' : 'client');
      setMobileShowChat(true);
    } else if (initialPortalId) {
      setSelectedConversationId(`${initialPortalType || 'client'}_${initialPortalId}`);
      setActivePortalType(initialPortalType || 'client');
      setMobileShowChat(true);
    }
  }, [initialConversationId, initialPortalId, initialPortalType]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [messages, setMessages] = useState<PortalMessage[]>([]);
  const [allMessagesList, setAllMessagesList] = useState<PortalMessage[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<PortalMessage[]>([]);
  const [presences, setPresences] = useState<Record<string, PortalPresence>>({});
  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageLimit, setMessageLimit] = useState<number>(40);
  const [isTyping, setIsTyping] = useState(false);

  // Clear messages and reset messageLimit instantly on conversation change to prevent lag/glitches
  useEffect(() => {
    setMessageLimit(40);
    setMessages([]);
  }, [selectedConversationId]);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [showScrollBottomButton, setShowScrollBottomButton] = useState(false);
  const [selectedMessageForAction, setSelectedMessageForAction] = useState<PortalMessage | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<PortalMessage | null>(null);
  const [isClearChatConfirmOpen, setIsClearChatConfirmOpen] = useState(false);
  const [replyingToMessage, setReplyingToMessage] = useState<PortalMessage | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number; isMine: boolean } | null>(null);

  // Unified WhatsApp-style Long Press Handler (1.5s press detection, preserves scrolling and normal taps)
  const {
    pressingItemId: activePressingMsgId,
    getHandlers: getMessageLongPressHandlers
  } = useLongPress<PortalMessage>({
    delay: 1500,
    moveThreshold: 10,
    haptic: true,
    onLongPress: (msg) => {
      if (msg.isDeleted) return;
      setSelectedMessageForAction(msg);
    }
  });

  // Audio / Voice Message Recording State
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isAtBottomRef = useRef(true);

  // Handle Scroll detection with lazy loading of older messages
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    
    // Check if scrolled near the top to load more historical messages (lazy load)
    if (scrollTop < 40 && !isLoadingMessages && messages.length >= messageLimit) {
      setIsLoadingMessages(true);
      // Wait a brief moment to simulate smooth paginated fetching and prevent rapid multi-triggers
      setTimeout(() => {
        setMessageLimit(prev => prev + 30);
        setIsLoadingMessages(false);
      }, 400);
    }

    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    const isAtBottom = distanceToBottom < 120;
    isAtBottomRef.current = isAtBottom;
    setShowScrollBottomButton(!isAtBottom);
  }, [messages.length, messageLimit, isLoadingMessages]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
      setShowScrollBottomButton(false);
    }
  }, []);

  // Format Bytes for attachments
  const formatBytes = (bytes: number = 0, decimals: number = 1) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };


  // Format Timestamps
  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // 1. Real-time Presence Heartbeat & Firestore Listener
  useEffect(() => {
    const myId = mode === 'portal' ? `${portalType}_${effectivePortalId}` : 'admin';
    const myName = mode === 'portal' ? (portalName || currentUserName || 'Portal User') : 'Zyqitek';
    const role = mode === 'portal' ? (portalType === 'client' ? 'client' : 'team') : 'admin';

    const sendPresence = async (isOffline = false) => {
      try {
        const presenceRecord: PortalPresence = {
          id: myId,
          portalId: effectivePortalId || 'admin',
          portalType: role as any,
          name: myName,
          lastActive: new Date().toISOString(),
          isOnline: !isOffline,
          isTyping: !isOffline && isTyping,
          activeConv: selectedConversationId
        };

        await fetch('/api/portal/presence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(presenceRecord)
        });

        setConnectionStatus('connected');
      } catch (err) {
        console.warn('Presence ping warning:', err);
      }
    };

    sendPresence();
    const interval = setInterval(() => sendPresence(false), 15000);

    const handleBeforeUnload = () => {
      sendPresence(true);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [mode, effectivePortalId, portalType, portalName, currentUserName, isTyping, selectedConversationId]);

  // Presence Polling Listener
  useEffect(() => {
    let isMounted = true;
    const fetchPresences = async () => {
      try {
        const res = await fetch('/api/portal/presence');
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.presence)) {
          const map: Record<string, PortalPresence> = {};
          data.presence.forEach((p: PortalPresence) => {
            map[p.id] = p;
          });
          setPresences(map);
          setConnectionStatus('connected');
        }
      } catch (err) {
        console.warn('Presence fetch warning:', err);
      }
    };

    fetchPresences();
    const interval = setInterval(fetchPresences, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);



  // Target Conversation IDs & Portal IDs computation (Canonical Alias Resolution)
  const targetConvIds = useMemo(() => {
    if (mode === 'portal') {
      const set = new Set<string>();
      if (effectivePortalId) {
        set.add(`${portalType}_${effectivePortalId}`);
        set.add(effectivePortalId);
      }
      if (portalId) {
        set.add(`${portalType}_${portalId}`);
        set.add(portalId);
      }

      if (portalType === 'client') {
        const allClients = [...clients, ...extraClientPortals];
        allClients.forEach(c => {
          if (c && (c.id === effectivePortalId || c.portalId === effectivePortalId || c.clientId === effectivePortalId || c.id === portalId || c.portalId === portalId)) {
            if (c.id) { set.add(`client_${c.id}`); set.add(c.id); }
            if (c.portalId) { set.add(`client_${c.portalId}`); set.add(c.portalId); }
            if (c.clientId) { set.add(`client_${c.clientId}`); set.add(c.clientId); }
          }
        });
      } else {
        const allTeams = [...teamMembers, ...extraTeamPortals];
        allTeams.forEach(m => {
          if (m && (m.id === effectivePortalId || m.memberId === effectivePortalId || m.teamMemberId === effectivePortalId || m.portalId === effectivePortalId || m.id === portalId || m.portalId === portalId)) {
            if (m.id) { set.add(`team_${m.id}`); set.add(m.id); }
            if (m.memberId) { set.add(`team_${m.memberId}`); set.add(m.memberId); }
            if (m.teamMemberId) { set.add(`team_${m.teamMemberId}`); set.add(m.teamMemberId); }
            if (m.portalId) { set.add(`team_${m.portalId}`); set.add(m.portalId); }
          }
        });
      }

      if (selectedProjectId && selectedProjectId !== 'all') {
        Array.from(set).forEach(base => {
          set.add(`${base}_project_${selectedProjectId}`);
        });
      }
      return Array.from(set).filter(Boolean);
    } else {
      if (!selectedConversationId) return [];
      const set = new Set<string>([selectedConversationId]);

      const rawId = selectedConversationId.replace(/^(client|team)_/, '').replace(/_project_.*/, '');
      const type = selectedConversationId.startsWith('client_') ? 'client' : 'team';

      if (type === 'client') {
        const allClients = [...clients, ...extraClientPortals];
        allClients.forEach(c => {
          if (c && (c.id === rawId || c.portalId === rawId || c.clientId === rawId)) {
            if (c.id) { set.add(`client_${c.id}`); set.add(c.id); }
            if (c.portalId) { set.add(`client_${c.portalId}`); set.add(c.portalId); }
            if (c.clientId) { set.add(`client_${c.clientId}`); set.add(c.clientId); }
          }
        });
      } else {
        const allTeams = [...teamMembers, ...extraTeamPortals];
        allTeams.forEach(m => {
          if (m && (m.id === rawId || m.memberId === rawId || m.teamMemberId === rawId || m.portalId === rawId)) {
            if (m.id) { set.add(`team_${m.id}`); set.add(m.id); }
            if (m.memberId) { set.add(`team_${m.memberId}`); set.add(m.memberId); }
            if (m.teamMemberId) { set.add(`team_${m.teamMemberId}`); set.add(m.teamMemberId); }
            if (m.portalId) { set.add(`team_${m.portalId}`); set.add(m.portalId); }
          }
        });
      }

      if (selectedProjectId && selectedProjectId !== 'all') {
        Array.from(set).forEach(base => {
          set.add(`${base}_project_${selectedProjectId}`);
        });
      }

      return Array.from(set).filter(Boolean);
    }
  }, [mode, portalType, effectivePortalId, portalId, selectedConversationId, selectedProjectId, clients, teamMembers, extraTeamPortals, extraClientPortals]);

  // Target Portal IDs
  const targetPortalIds = useMemo(() => {
    if (mode === 'admin') {
      if (!selectedConversationId) return [];
      const rawId = selectedConversationId.replace(/^(client|team)_/, '').replace(/_project_.*/, '');
      return [rawId];
    }
    const list = [
      portalId, 
      effectivePortalId, 
      portalClientId, 
      portalTeamMemberId,
      ...(portalType === 'client' 
        ? clients.map(c => c && (c.portalId || c.clientId || c.id)) 
        : teamMembers.map(m => m && (m.portalId || m.teamMemberId || m.memberId || m.id)))
    ];
    return Array.from(new Set(list)).filter(Boolean) as string[];
  }, [mode, selectedConversationId, portalId, effectivePortalId, portalClientId, portalTeamMemberId, portalType, clients, teamMembers]);

  const serializedConvIds = useMemo(() => targetConvIds.slice().sort().join('|'), [targetConvIds]);
  const serializedPortalIds = useMemo(() => targetPortalIds.slice().sort().join('|'), [targetPortalIds]);

  // REST Fallback for messages
  const fetchMessagesRest = useCallback(async (convId: string) => {
    if (!convId) return;
    try {
      const res = await fetch(`/api/portal/chat/messages?conversationId=${encodeURIComponent(convId)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.messages)) {
        const map = new Map<string, PortalMessage>();
        data.messages.forEach((m: PortalMessage) => map.set(m.id, { ...m, id: m.id }));
        setMessages(Array.from(map.values()).sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        ));
      }
    } catch (err) {
      console.warn('Fetch messages REST error:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  // Delivery & Read Receipt Tracking Ref
  const processedReceiptsRef = useRef<Set<string>>(new Set());

  // WhatsApp-Style: Delivery & Read Receipt Engine
  const processReceipts = useCallback(async (currentMsgs: PortalMessage[]) => {
    if (!currentMsgs || currentMsgs.length === 0) return;
    const nowIso = new Date().toISOString();

    const isIncoming = (m: PortalMessage) => {
      if (mode === 'admin') {
        return m.senderRole !== 'Admin' && m.senderId !== 'admin';
      } else {
        return m.senderRole === 'Admin' || (m.senderId !== effectivePortalId && m.senderId !== portalId && m.senderRole !== currentUserRole);
      }
    };

    // 1. Delivery Acknowledgment
    const undelivered = currentMsgs.filter(m => isIncoming(m) && (!m.deliveredAt || m.status === 'sent') && m.id && !processedReceiptsRef.current.has(m.id + '_del'));
    if (undelivered.length > 0) {
      undelivered.forEach(m => processedReceiptsRef.current.add(m.id + '_del'));
      fetch('/api/portal/chat/deliver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageIds: undelivered.map(m => m.id),
          recipientRole: currentUserRole
        })
      }).catch(() => {});
    }

    // 2. Read Acknowledgment
    const unread = currentMsgs.filter(m => isIncoming(m) && (!m.readStatus || !m.readAt || m.status !== 'read') && m.id && !processedReceiptsRef.current.has(m.id + '_read'));
    if (unread.length > 0) {
      unread.forEach(m => processedReceiptsRef.current.add(m.id + '_read'));
      fetch('/api/portal/chat/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageIds: unread.map(m => m.id),
          readerRole: currentUserRole,
          conversationId: targetConvIds[0] || selectedConversationId
        })
      }).catch(() => {});
    }
  }, [mode, currentUserRole, effectivePortalId, portalId, targetConvIds, selectedConversationId]);

  const processReceiptsRef = useRef(processReceipts);
  useEffect(() => {
    processReceiptsRef.current = processReceipts;
  });

  // Global messages polling in admin mode for sidebar previews & unread counter
  useEffect(() => {
    if (mode !== 'admin') return;
    let isMounted = true;

    const fetchAllMessages = async () => {
      try {
        const res = await fetch('/api/portal/chat/messages');
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.messages)) {
          const list: PortalMessage[] = data.messages;
          setAllMessagesList(list);
          setUnreadMessages(list.filter(m => !m.readStatus && m.senderRole !== 'Admin'));
        }
      } catch (err) {
        console.warn('Global messages poll error:', err);
      }
    };

    fetchAllMessages();
    const interval = setInterval(fetchAllMessages, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [mode]);

  // Messages polling for active conversation
  useEffect(() => {
    if (targetConvIds.length === 0 && targetPortalIds.length === 0) {
      setMessages([]);
      setIsLoadingMessages(false);
      return;
    }

    let isMounted = true;
    const fetchActiveMessages = async () => {
      const primaryConv = targetConvIds[0] || selectedConversationId;
      const primaryPortal = targetPortalIds[0] || '';
      try {
        const url = primaryConv 
          ? `/api/portal/chat/messages?conversationId=${encodeURIComponent(primaryConv)}`
          : `/api/portal/chat/messages?portalId=${encodeURIComponent(primaryPortal)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.messages)) {
          setMessages(data.messages);
          setIsLoadingMessages(false);
          setConnectionStatus('connected');
          processReceiptsRef.current?.(data.messages);
        }
      } catch (err) {
        console.warn('Active messages poll error:', err);
      }
    };

    setIsLoadingMessages(true);
    fetchActiveMessages();
    const interval = setInterval(fetchActiveMessages, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [mode, serializedConvIds, serializedPortalIds, selectedConversationId]);

  // Derived real-time active conversation messages
  const displayMessages = useMemo(() => {
    const myId = mode === 'portal' ? (effectivePortalId || portalId) : 'admin';
    
    // Sort all messages chronologically
    const sorted = [...messages].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    // Slice only the latest 'messageLimit' messages to satisfy pagination requirement seamlessly
    const paginated = sorted.slice(-messageLimit);
    
    return paginated.filter(m => !m.deletedFor?.includes(myId));
  }, [messages, messageLimit, mode, effectivePortalId, portalId]);

  // Pinned messages in current conversation
  const pinnedMessages = useMemo(() => {
    return displayMessages.filter(m => m.isPinned && !m.isDeleted);
  }, [displayMessages]);

  // Scroll to bottom when displayMessages update
  useEffect(() => {
    if (isAtBottomRef.current) {
      scrollToBottom(false);
    }
  }, [displayMessages, scrollToBottom]);

  // Trigger receipt processing for admin mode when viewing active conversation
  useEffect(() => {
    if (mode === 'admin' && displayMessages.length > 0) {
      processReceiptsRef.current?.(displayMessages);
    }
  }, [mode, displayMessages]);

  // Handle Typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2500);
  };

  // Helper to compute canonical portal ID and primary conv ID
  const computeCanonicalIds = useCallback(() => {
    let canonicalPortalId = mode === 'portal' ? (effectivePortalId || portalId) : selectedConversationId.replace(/^(client|team)_/, '').replace(/_project_.*/, '');
    let canonicalPortalType = mode === 'portal' ? portalType : (selectedConversationId.startsWith('team_') ? 'team' : 'client');

    if (mode === 'admin') {
      if (canonicalPortalType === 'client') {
        const allClients = [...clients, ...extraClientPortals];
        const matchWithPortal = allClients.find(c => c && c.portalId && (c.id === canonicalPortalId || c.portalId === canonicalPortalId || c.clientId === canonicalPortalId));
        if (matchWithPortal) {
          canonicalPortalId = matchWithPortal.portalId;
        } else {
          const match = allClients.find(c => c && (c.id === canonicalPortalId || c.portalId === canonicalPortalId || c.clientId === canonicalPortalId));
          if (match) canonicalPortalId = match.portalId || match.clientId || match.id;
        }
      } else {
        const allTeams = [...teamMembers, ...extraTeamPortals];
        const matchWithPortal = allTeams.find(m => m && m.portalId && (m.id === canonicalPortalId || m.memberId === canonicalPortalId || m.teamMemberId === canonicalPortalId || m.portalId === canonicalPortalId));
        if (matchWithPortal) {
          canonicalPortalId = matchWithPortal.portalId;
        } else {
          const match = allTeams.find(m => m && (m.id === canonicalPortalId || m.memberId === canonicalPortalId || m.teamMemberId === canonicalPortalId || m.portalId === canonicalPortalId));
          if (match) canonicalPortalId = match.portalId || match.teamMemberId || match.memberId || match.id;
        }
      }
    } else {
      if (portalType === 'client') {
        const allClients = [...clients, ...extraClientPortals];
        const matchWithPortal = allClients.find(c => c && c.portalId && (c.id === canonicalPortalId || c.portalId === canonicalPortalId || c.clientId === canonicalPortalId));
        if (matchWithPortal) {
          canonicalPortalId = matchWithPortal.portalId;
        }
      } else {
        const allTeams = [...teamMembers, ...extraTeamPortals];
        const matchWithPortal = allTeams.find(m => m && m.portalId && (m.id === canonicalPortalId || m.memberId === canonicalPortalId || m.teamMemberId === canonicalPortalId || m.portalId === canonicalPortalId));
        if (matchWithPortal) {
          canonicalPortalId = matchWithPortal.portalId;
        }
      }
    }

    let primaryConvId = `${canonicalPortalType}_${canonicalPortalId}`;
    if (selectedProjectId && selectedProjectId !== 'all') {
      primaryConvId += `_project_${selectedProjectId}`;
    }

    return { canonicalPortalId, canonicalPortalType, primaryConvId };
  }, [mode, effectivePortalId, portalId, selectedConversationId, portalType, selectedProjectId, clients, teamMembers, extraTeamPortals, extraClientPortals]);

  // Permission checker for deleting messages
  const canDeleteMessage = useCallback((msg: PortalMessage | null) => {
    if (!msg || msg.isDeleted) return false;
    if (mode === 'admin') return true;
    const myId = effectivePortalId || portalId;
    const isMine = msg.senderRole === currentUserRole || msg.senderId === myId || (msg.senderRole === currentUserRole && msg.senderName === (portalName || currentUserName));
    return isMine;
  }, [mode, effectivePortalId, portalId, currentUserRole, portalName, currentUserName]);

  // Handle Message Pinning
  const handlePinMessage = async (msg: PortalMessage) => {
    setSelectedMessageForAction(null);
    const newPinned = !msg.isPinned;
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isPinned: newPinned } : m));
    setAllMessagesList(prev => prev.map(m => m.id === msg.id ? { ...m, isPinned: newPinned } : m));
    try {
      await fetch(`/api/supabase/collection/portalMessages/${encodeURIComponent(msg.id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: newPinned })
      });
      showToast(newPinned ? 'Message pinned.' : 'Message unpinned.', 'success');
    } catch (err) {
      console.error('Pin error:', err);
    }
  };

  // Handle Clear Chat
  const handleClearChat = async () => {
    setIsClearChatConfirmOpen(false);
    setSelectedMessageForAction(null);
    try {
      const msgsToClear = displayMessages.filter(m => !m.isDeleted);
      if (msgsToClear.length === 0) {
        showToast('No active messages to clear.', 'info');
        return;
      }
      const myId = mode === 'portal' ? (effectivePortalId || portalId) : 'admin';
      const nowIso = new Date().toISOString();

      // Optimistic local state update
      setMessages(prev => prev.map(m => ({ ...m, isDeleted: true, deletedAt: nowIso, deletedBy: myId, deletedRole: currentUserRole })));
      setAllMessagesList(prev => prev.map(m => msgsToClear.some(tc => tc.id === m.id) ? { ...m, isDeleted: true, deletedAt: nowIso, deletedBy: myId, deletedRole: currentUserRole } : m));

      // Server REST batch
      const batchWrites = msgsToClear.map(msg => 
        fetch('/api/portal/chat/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageId: msg.id,
            deletedBy: myId,
            deletedRole: currentUserRole,
            deleteScope: 'for_everyone'
          })
        }).catch(() => {})
      );
      await Promise.all(batchWrites);

      showToast('Chat cleared.', 'success');
    } catch (err) {
      console.error('Clear chat error:', err);
      showToast('Failed to clear chat.', 'error');
    }
  };

  // Handle Message Soft Deletion
  const handleDeleteMessage = async (msg: PortalMessage, deleteScope: 'for_me' | 'for_everyone' = 'for_everyone') => {
    setSelectedMessageForAction(null);
    setMessageToDelete(null);
    const nowIso = new Date().toISOString();
    const myId = mode === 'portal' ? (effectivePortalId || portalId) : 'admin';

    // Optimistic local state update
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isDeleted: true, deletedAt: nowIso, deletedBy: myId, deletedRole: currentUserRole } : m));
    setAllMessagesList(prev => prev.map(m => m.id === msg.id ? { ...m, isDeleted: true, deletedAt: nowIso, deletedBy: myId, deletedRole: currentUserRole } : m));

    try {
      await fetch('/api/portal/chat/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: msg.id,
          deletedBy: myId,
          deletedRole: currentUserRole,
          deleteScope
        })
      });

      showToast('Message deleted.', 'success');
    } catch (err) {
      console.error('Delete message error:', err);
      showToast('Failed to delete message.', 'error');
    }
  };

  const handleCopyMessageText = (text: string) => {
    if (!text) return;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    showToast('Copied to clipboard', 'success');
    setSelectedMessageForAction(null);
  };

  // Handle Send Message (Text or Attachment)
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && !selectedFile) || isSending) return;

    setIsSending(true);
    setIsTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    const messageText = inputText.trim();
    const fileToUpload = selectedFile;

    // Reset input states immediately
    setInputText('');
    setSelectedFile(null);
    setReplyingToMessage(null);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
    const timestamp = new Date().toISOString();
    const msgId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    let attachmentObj: PortalMessage['attachment'] = undefined;

    const { canonicalPortalId, canonicalPortalType, primaryConvId } = computeCanonicalIds();

    // Process file attachment via uploadPortalFile
    if (fileToUpload) {
      setIsUploading(true);
      try {
        const folderPath = `portals/${canonicalPortalId}/chat_attachments`;
        const uploadRes = await uploadPortalFile(fileToUpload, folderPath);
        attachmentObj = {
          id: `att-${Date.now()}`,
          fileName: uploadRes.fileName,
          fileType: uploadRes.contentType || fileToUpload.type || 'application/octet-stream',
          fileSize: uploadRes.size,
          fileUrl: uploadRes.fileUrl,
          downloadUrl: uploadRes.downloadUrl,
          storagePath: uploadRes.storagePath
        };
      } catch (err) {
        console.error('Attachment upload error:', err);
        showToast('Failed to process attachment.', 'error');
        setIsUploading(false);
        setIsSending(false);
        return;
      }
      setIsUploading(false);
    }

    const senderId = mode === 'portal' ? (effectivePortalId || portalId) : 'admin';
    const senderName = mode === 'portal' ? (portalName || currentUserName || 'Portal User') : 'Zyqitek';
    const senderRole = mode === 'portal' ? (portalType === 'client' ? 'Client' : 'Team Member') : 'Admin';
    const receiverId = mode === 'portal' ? 'admin' : canonicalPortalId;

    const newMessage: PortalMessage = {
      id: msgId,
      conversationId: primaryConvId,
      portalId: canonicalPortalId,
      portalType: canonicalPortalType as any,
      senderId,
      senderName,
      senderRole,
      receiverId,
      message: messageText,
      timestamp,
      sentAt: timestamp,
      deliveredAt: null,
      readAt: null,
      readStatus: false,
      status: 'sent',
      type: attachmentObj ? 'file' : 'text',
      replyToMessageId: replyingToMessage ? replyingToMessage.id : undefined,
      ...(attachmentObj ? { attachment: attachmentObj } : {})
    };

    // Optimistic UI state update with unique messageId duplicate prevention
    setMessages(prev => {
      if (prev.some(m => m.id === newMessage.id)) return prev;
      return [...prev, newMessage];
    });
    setAllMessagesList(prev => {
      if (prev.some(m => m.id === newMessage.id)) return prev;
      return [...prev, newMessage];
    });

    try {
      const res = await fetch('/api/portal/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMessage)
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Server error');
      }
      scrollToBottom(true);
    } catch (err: any) {
      console.error('Send message error:', err);
      showToast('Message delivery failed. Please check your connection.', 'error');
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: 'failed' } : m));
    } finally {
      setIsSending(false);
    }
  };

  // Retry sending a failed message
  const handleRetryMessage = async (failedMsg: PortalMessage) => {
    setMessages(prev => prev.map(m => m.id === failedMsg.id ? { ...m, status: 'sending' } : m));
    try {
      const res = await fetch('/api/portal/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...failedMsg, status: 'sent', sentAt: new Date().toISOString() })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => prev.map(m => m.id === failedMsg.id ? { ...m, status: 'sent' } : m));
      } else {
        throw new Error(data.error || 'Retry failed');
      }
    } catch {
      setMessages(prev => prev.map(m => m.id === failedMsg.id ? { ...m, status: 'failed' } : m));
      showToast('Retry failed. Please check connection.', 'error');
    }
  };

  // Helper for file type icons
  const getFileIcon = (fileType?: string, fileName?: string) => {
    const ext = fileName?.split('.').pop()?.toLowerCase() || '';
    if (fileType?.includes('image') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) {
      return <ImageIcon className="w-5 h-5 text-indigo-500 shrink-0" />;
    }
    if (fileType?.includes('pdf') || ext === 'pdf') {
      return <FileText className="w-5 h-5 text-rose-500 shrink-0" />;
    }
    if (fileType?.includes('sheet') || fileType?.includes('csv') || ['xls', 'xlsx', 'csv'].includes(ext)) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-500 shrink-0" />;
    }
    if (fileType?.includes('zip') || fileType?.includes('rar') || ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return <Archive className="w-5 h-5 text-amber-500 shrink-0" />;
    }
    return <FileText className="w-5 h-5 text-slate-500 shrink-0" />;
  };

  // Clean presence status text helper (WhatsApp Style)
  const getPresenceText = (targetId: string) => {
    const p = presences[targetId];
    if (!p || !p.lastActive) return 'Offline';
    const diffMs = Date.now() - new Date(p.lastActive).getTime();
    if (diffMs < 45000) return 'Online';
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 60) return `Last active ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Last active ${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Last active yesterday';
    return `Last active ${diffDays} days ago`;
  };

  // Sidebar list of active conversations in Admin mode — ONLY ACTIVE PORTALS THAT EXIST (1 PORTAL = 1 CONVERSATION)
  const conversationsList = useMemo(() => {
    if (mode !== 'admin') return [];

    if (activePortalType === 'client') {
      const dedupMap = new Map<string, any>();

      // Source of truth: ONLY clients that have an actual Client Portal account in extraClientPortals
      extraClientPortals.forEach(portal => {
        if (!portal) return;

        // Match with linked CRM client record if available
        const linkedClient = clients.find(c => 
          c && (
            (portal.clientId && c.id === portal.clientId) ||
            (portal.id && c.id === portal.id) ||
            (portal.masterClientId && c.masterClientId === portal.masterClientId) ||
            (portal.clientId && c.masterClientId === portal.clientId) ||
            (portal.clientEmail && c.email && c.email.toLowerCase().trim() === portal.clientEmail.toLowerCase().trim()) ||
            (portal.clientName && c.name && c.name.toLowerCase().trim() === portal.clientName.toLowerCase().trim())
          )
        );

        // Determine business display ID (e.g. L005, CL-1001)
        let displayId = '';
        if (linkedClient && linkedClient.masterClientId && linkedClient.masterClientId.trim()) {
          displayId = linkedClient.masterClientId.trim().toUpperCase();
        } else if (portal.masterClientId && portal.masterClientId.trim()) {
          displayId = portal.masterClientId.trim().toUpperCase();
        } else if (portal.clientId && portal.clientId.trim() && !portal.clientId.startsWith('portal-') && portal.clientId.length <= 15) {
          displayId = portal.clientId.trim().toUpperCase();
        } else if (linkedClient && linkedClient.id) {
          displayId = linkedClient.id.startsWith('client-') ? `CL-${linkedClient.id.slice(-4).toUpperCase()}` : linkedClient.id.toUpperCase();
        } else if (portal.id) {
          displayId = portal.id.startsWith('client_portal_') ? `CL-${portal.id.slice(-4).toUpperCase()}` : (portal.id.length < 15 ? portal.id.toUpperCase() : `CL-${portal.id.slice(-4).toUpperCase()}`);
        } else {
          displayId = 'CL';
        }

        const name = portal.clientName || linkedClient?.name || portal.clientCompany || 'Client';
        const company = portal.clientCompany || linkedClient?.company || 'Client Organization';
        const avatar = linkedClient?.avatar || portal.avatar || '';
        const canonicalId = portal.id || portal.portalId || portal.clientId || linkedClient?.id;

        const key = (canonicalId || portal.username || portal.clientEmail || name).toLowerCase().trim();
        if (dedupMap.has(key)) return;

        const allIds = new Set<string>();
        if (portal.id) allIds.add(portal.id);
        if (portal.portalId) allIds.add(portal.portalId);
        if (portal.clientId) allIds.add(portal.clientId);
        if (linkedClient?.id) allIds.add(linkedClient.id);
        if (linkedClient?.masterClientId) allIds.add(linkedClient.masterClientId);

        dedupMap.set(key, {
          id: canonicalId,
          portalId: portal.portalId || portal.id,
          clientId: portal.clientId || linkedClient?.id,
          displayId,
          name,
          company,
          avatar,
          email: portal.clientEmail || linkedClient?.email || '',
          allIds
        });
      });

      return Array.from(dedupMap.values())
        .map(item => {
          const convId = `client_${item.id}`;
          const idArray = Array.from(item.allIds as Set<string>);

          // Check presence across all aliases
          let presence: PortalPresence | undefined;
          for (const alias of idArray) {
            if (presences[`client_${alias}`]) { presence = presences[`client_${alias}`]; break; }
            if (presences[alias]) { presence = presences[alias]; break; }
          }

          const isUserOnline = presence && presence.lastActive && (Date.now() - new Date(presence.lastActive).getTime() < 45000);

          const unreadCount = unreadMessages.filter(m => {
            const mConv = m.conversationId || '';
            const mPortal = m.portalId || '';
            const isMatch = idArray.some(alias => mConv.includes(alias) || mPortal === alias);
            return isMatch && !m.readStatus && m.senderRole !== 'Admin';
          }).length;

          const lastMsg = allMessagesList
            .filter(m => {
              const mConv = m.conversationId || '';
              const mPortal = m.portalId || '';
              return idArray.some(alias => mConv.includes(alias) || mPortal === alias);
            })
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

          return {
            id: item.id,
            convId,
            displayId: item.displayId,
            name: item.name,
            company: item.company,
            avatar: item.avatar,
            portalType: 'client' as const,
            isOnline: !!isUserOnline,
            isTyping: !!(isUserOnline && (presence as any)?.isTyping),
            presenceText: presence?.lastActive ? getPresenceText(presence.id) : 'Offline',
            unreadCount,
            lastMessageText: lastMsg ? (lastMsg.isDeleted ? 'Message deleted' : ((lastMsg.message || '[Attachment]'))) : '',
            lastMessageTime: lastMsg ? formatTimestamp(lastMsg.timestamp) : ''
          };
        })
        .filter(item => {
          if (!searchTerm) return true;
          const term = searchTerm.toLowerCase().trim();
          return item.name.toLowerCase().includes(term) || 
                 (item.displayId && item.displayId.toLowerCase().includes(term)) ||
                 (item.company && item.company.toLowerCase().includes(term)) || 
                 (item.id && item.id.toLowerCase().includes(term));
        });
    } else {
      // Source of truth: ONLY team members that have an actual Team Portal account in extraTeamPortals
      const dedupMap = new Map<string, any>();

      extraTeamPortals.forEach(portal => {
        if (!portal) return;

        // Match with linked CRM team member record if available
        const linkedMember = teamMembers.find(m => 
          m && (
            (portal.teamMemberId && m.id === portal.teamMemberId) ||
            (portal.teamMemberId && m.teamMemberId === portal.teamMemberId) ||
            (portal.id && m.id === portal.id) ||
            (portal.email && m.email && m.email.toLowerCase().trim() === portal.email.toLowerCase().trim()) ||
            (portal.fullName && m.fullName && m.fullName.toLowerCase().trim() === portal.fullName.toLowerCase().trim())
          )
        );

        // Determine standard team member display ID (e.g. TM-004, TM-1001)
        let displayId = '';
        if (linkedMember && linkedMember.teamMemberId && linkedMember.teamMemberId.trim()) {
          displayId = linkedMember.teamMemberId.trim().toUpperCase();
        } else if (portal.teamMemberId && portal.teamMemberId.trim() && !portal.teamMemberId.startsWith('portal-') && portal.teamMemberId.length <= 15) {
          displayId = portal.teamMemberId.trim().toUpperCase();
        } else if (linkedMember && linkedMember.id) {
          displayId = linkedMember.id.startsWith('team-') || linkedMember.id.startsWith('tm-') ? `TM-${linkedMember.id.slice(-4).toUpperCase()}` : linkedMember.id.toUpperCase();
        } else if (portal.id) {
          displayId = portal.id.startsWith('team_portal_') ? `TM-${portal.id.slice(-4).toUpperCase()}` : (portal.id.length < 15 ? portal.id.toUpperCase() : `TM-${portal.id.slice(-4).toUpperCase()}`);
        } else {
          displayId = 'TM';
        }

        const name = portal.fullName || linkedMember?.fullName || portal.username || 'Team Member';
        const role = portal.role || linkedMember?.role || 'Team Member';
        const avatar = linkedMember?.avatar || portal.avatar || '';
        const canonicalId = portal.id || portal.portalId || portal.teamMemberId || linkedMember?.id;

        const key = (canonicalId || portal.username || portal.email || name).toLowerCase().trim();
        if (dedupMap.has(key)) return;

        const allIds = new Set<string>();
        if (portal.id) allIds.add(portal.id);
        if (portal.portalId) allIds.add(portal.portalId);
        if (portal.teamMemberId) allIds.add(portal.teamMemberId);
        if (linkedMember?.id) allIds.add(linkedMember.id);
        if (linkedMember?.teamMemberId) allIds.add(linkedMember.teamMemberId);

        dedupMap.set(key, {
          id: canonicalId,
          portalId: portal.portalId || portal.id,
          teamMemberId: portal.teamMemberId || linkedMember?.id,
          displayId,
          name,
          company: role,
          avatar,
          email: portal.email || linkedMember?.email || '',
          allIds
        });
      });

      return Array.from(dedupMap.values())
        .map(item => {
          const convId = `team_${item.id}`;
          const idArray = Array.from(item.allIds as Set<string>);

          let presence: PortalPresence | undefined;
          for (const alias of idArray) {
            if (presences[`team_${alias}`]) { presence = presences[`team_${alias}`]; break; }
            if (presences[alias]) { presence = presences[alias]; break; }
          }

          const isUserOnline = presence && presence.lastActive && (Date.now() - new Date(presence.lastActive).getTime() < 45000);

          const unreadCount = unreadMessages.filter(m => {
            const mConv = m.conversationId || '';
            const mPortal = m.portalId || '';
            const isMatch = idArray.some(alias => mConv.includes(alias) || mPortal === alias);
            return isMatch && !m.readStatus && m.senderRole !== 'Admin';
          }).length;

          const lastMsg = allMessagesList
            .filter(m => {
              const mConv = m.conversationId || '';
              const mPortal = m.portalId || '';
              return idArray.some(alias => mConv.includes(alias) || mPortal === alias);
            })
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

          return {
            id: item.id,
            convId,
            displayId: item.displayId,
            name: item.name,
            company: item.company,
            avatar: item.avatar,
            portalType: 'team' as const,
            isOnline: !!isUserOnline,
            isTyping: !!(isUserOnline && (presence as any)?.isTyping),
            presenceText: presence?.lastActive ? getPresenceText(presence.id) : 'Offline',
            unreadCount,
            lastMessageText: lastMsg ? (lastMsg.isDeleted ? 'Message deleted' : ((lastMsg.message || '[Attachment]'))) : '',
            lastMessageTime: lastMsg ? formatTimestamp(lastMsg.timestamp) : ''
          };
        })
        .filter(item => {
          if (!searchTerm) return true;
          const term = searchTerm.toLowerCase().trim();
          return item.name.toLowerCase().includes(term) || 
                 (item.displayId && item.displayId.toLowerCase().includes(term)) ||
                 (item.company && item.company.toLowerCase().includes(term)) || 
                 (item.id && item.id.toLowerCase().includes(term));
        });
    }
  }, [mode, activePortalType, clients, teamMembers, extraClientPortals, extraTeamPortals, searchTerm, presences, allMessagesList]);

  // Active Recipient Presence
  const activeRecipientPresence = useMemo(() => {
    if (mode === 'portal') {
      return presences['admin'];
    }
    if (!selectedConversationId) return null;
    let p = presences[selectedConversationId];
    if (!p) {
      const rawId = selectedConversationId.replace(/^(client|team)_/, '').replace(/_project_.*/, '');
      p = presences[rawId] || presences[`client_${rawId}`] || presences[`team_${rawId}`];
    }
    return p;
  }, [mode, selectedConversationId, presences]);

  const isRecipientOnline = useMemo(() => {
    if (!activeRecipientPresence || !activeRecipientPresence.lastActive) return false;
    const diffMs = Date.now() - new Date(activeRecipientPresence.lastActive).getTime();
    return diffMs < 45000;
  }, [activeRecipientPresence]);

  const isRecipientTyping = useMemo(() => {
    if (!activeRecipientPresence || !activeRecipientPresence.lastActive) return false;
    const diffMs = Date.now() - new Date(activeRecipientPresence.lastActive).getTime();
    if (diffMs > 45000) return false;
    if (mode === 'portal') {
      const activeConv = (activeRecipientPresence as any).activeConv || '';
      return !!(activeRecipientPresence as any).isTyping && (!activeConv || activeConv.includes(effectivePortalId) || activeConv.includes(portalId));
    }
    return !!(activeRecipientPresence as any).isTyping;
  }, [activeRecipientPresence, mode, effectivePortalId, portalId]);

  return (
    <div className={`flex h-[750px] max-h-[88vh] w-full rounded-2xl overflow-hidden relative ${mode === 'admin' ? 'bg-[var(--crm-card)] border border-[var(--crm-card-border)] shadow-sm font-sans text-[var(--crm-text)]' : 'bg-white border border-slate-200 shadow-xl font-sans text-slate-800'}`}>
      
      {/* Admin Sidebar Conversations List (Compact & Narrower) */}
      {mode === 'admin' && (
        <div className={`w-full md:w-56 lg:w-60 border-r flex flex-col shrink-0 ${mode === 'admin' ? 'border-[var(--crm-card-border)] bg-[var(--crm-sidebar)]' : 'border-slate-200 bg-slate-50'} ${
          mobileShowChat ? 'hidden md:flex' : 'flex'
        }`}>
          
          {/* Header & Portal Switcher */}
          <div className={`p-2.5 border-b space-y-2 ${mode === 'admin' ? 'border-[var(--crm-card-border)]' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between">
              <h2 className={`text-xs font-bold flex items-center gap-1.5 ${mode === 'admin' ? 'text-[var(--crm-heading)]' : 'text-slate-900'}`}>
                <img src={croppedChatIconImg} alt="" className="w-3.5 h-3.5 object-contain" referrerPolicy="no-referrer" />
                Portal Chats
              </h2>
              <div className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-medium ${mode === 'admin' ? 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20' : 'text-emerald-600 bg-emerald-100 border border-emerald-200'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </div>
            </div>

            {/* Segmented Control: Client vs Team */}
            <div className={`grid grid-cols-2 p-0.5 rounded-lg border text-[11px] font-medium ${mode === 'admin' ? 'bg-[var(--crm-card)] border-[var(--crm-card-border)]' : 'bg-slate-200/60 border-slate-200/50'}`}>
              <button
                type="button"
                onClick={() => {
                  setActivePortalType('client');
                  setSelectedConversationId('');
                }}
                className={`py-1 rounded-md transition-all cursor-pointer ${activePortalType === 'client' ? (mode === 'admin' ? 'bg-[var(--crm-sidebar)] text-[var(--crm-heading)] shadow-xs ring-1 ring-white/5 font-bold' : 'bg-white text-indigo-700 font-bold shadow-xs border border-slate-200/60') : (mode === 'admin' ? 'text-[var(--crm-subtitle)] hover:text-[var(--crm-text)]' : 'text-slate-600 hover:text-slate-900')}`}
              >
                Clients ({extraClientPortals.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActivePortalType('team');
                  setSelectedConversationId('');
                }}
                className={`py-1 rounded-md transition-all cursor-pointer ${activePortalType === 'team' ? (mode === 'admin' ? 'bg-[var(--crm-sidebar)] text-[var(--crm-heading)] shadow-xs ring-1 ring-white/5 font-bold' : 'bg-white text-indigo-700 font-bold shadow-xs border border-slate-200/60') : (mode === 'admin' ? 'text-[var(--crm-subtitle)] hover:text-[var(--crm-text)]' : 'text-slate-600 hover:text-slate-900')}`}
              >
                Team ({extraTeamPortals.length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className={`w-3 h-3 absolute left-2.5 top-2 ${mode === 'admin' ? 'text-[var(--crm-text-muted)]' : 'text-slate-400'}`} />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by ID, name, role..."
                className={`w-full rounded-md pl-7 pr-2 py-1 text-xs focus:outline-none transition-all shadow-xs ${mode === 'admin' ? 'bg-[var(--crm-card)] border border-[var(--crm-card-border)] text-[var(--crm-text)] placeholder-[var(--crm-text-muted)] focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50' : 'bg-white border border-slate-200 text-slate-700 placeholder-slate-400 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400'}`}
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className={`flex-1 overflow-y-auto divide-y ${mode === 'admin' ? 'divide-[var(--crm-card-border)]' : 'divide-slate-100'}`}>
            {conversationsList.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No active {activePortalType} portals found.
              </div>
            ) : (
              conversationsList.map(item => {
                const isSelected = selectedConversationId === item.convId;
                return (
                  <button
                    key={item.convId}
                    type="button"
                    onClick={() => {
                      setSelectedConversationId(item.convId);
                      setMobileShowChat(true);
                    }}
                    className={`w-full p-2.5 px-3 flex items-center gap-2.5 text-left transition-all cursor-pointer relative ${
                      isSelected ? (mode === 'admin' ? 'bg-indigo-500/10 border-l-2 border-indigo-500' : 'bg-indigo-50 border-l-2 border-indigo-600') : (mode === 'admin' ? 'hover:bg-slate-800/40' : 'hover:bg-slate-100/60')
                    }`}
                  >
                    <div className="relative shrink-0">
                      {item.avatar ? (
                        <img 
                          src={item.avatar} 
                          alt="" 
                          className="w-8 h-8 rounded-full object-cover shadow-xs border border-[var(--crm-card-border)]"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <img 
                          src={croppedChatIconImg} 
                          alt="" 
                          className="w-8 h-8 rounded-full object-cover shadow-xs border border-[var(--crm-card-border)] bg-white p-0.5"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <div 
                        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-50 ${
                          item.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                        }`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold truncate ${mode === 'admin' ? 'text-[var(--crm-heading)]' : 'text-slate-900'}`}>
                          {item.displayId ? `${item.displayId} — ${item.name}` : item.name}
                        </span>
                        <span className={`text-[10px] shrink-0 ml-1 ${mode === 'admin' ? 'text-[var(--crm-text-muted)]' : 'text-slate-400'}`}>
                          {item.lastMessageTime || item.presenceText}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className={`text-[11px] truncate pr-1 ${isSelected ? (mode === 'admin' ? 'text-[var(--crm-text)]' : 'text-slate-700') : (mode === 'admin' ? 'text-[var(--crm-subtitle)]' : 'text-slate-500')}`}>
                          {item.isTyping ? (
                            <span className={`inline-flex items-center gap-1 font-medium ${mode === 'admin' ? 'text-indigo-400' : 'text-indigo-600'}`}>
                              <span className="w-1 h-1 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-1 h-1 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-1 h-1 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </span>
                          ) : (
                            item.lastMessageText || item.company
                          )}
                        </p>
                        {item.unreadCount > 0 && (
                          <span className="px-1.5 py-0.2 bg-indigo-500 text-white font-bold text-[9px] rounded-full shrink-0 animate-pulse">
                            {item.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col min-w-0 relative ${mode === 'admin' ? 'bg-[var(--crm-card)]' : 'bg-white'} ${
        mode === 'admin' && !mobileShowChat ? 'hidden md:flex' : 'flex'
      }`}>
        
        {/* Chat Header */}
        <div className={`h-16 px-4 sm:px-6 border-b flex items-center justify-between shrink-0 z-10 ${mode === 'admin' ? 'border-[var(--crm-card-border)] bg-[var(--crm-sidebar)]' : 'border-slate-200 bg-white/95 backdrop-blur-md'}`}>
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Back Button (Admin Mode) */}
            {mode === 'admin' && (
              <button
                type="button"
                onClick={() => setMobileShowChat(false)}
                className="md:hidden p-1.5 -ml-1 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                title="Back to conversation list"
              >
                <ChevronLeft size={20} />
              </button>
            )}

            {(() => {
              const activeItem = mode === 'admin' && selectedConversationId ? conversationsList.find(c => c.convId === selectedConversationId) : null;
              return (
                <>
                  <div className="relative shrink-0">
                    {mode === 'portal' ? (
                      <img 
                        src={croppedChatIconImg} 
                        alt="" 
                        className="w-10 h-10 rounded-full object-cover shadow-xs border border-slate-200 ring-1 ring-slate-200/50 bg-white p-0.5"
                        referrerPolicy="no-referrer"
                      />
                    ) : activeItem?.avatar ? (
                      <img 
                        src={activeItem.avatar} 
                        alt="" 
                        className="w-10 h-10 rounded-full object-cover shadow-xs border border-[var(--crm-card-border)] ring-1 ring-indigo-500/20" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <img 
                        src={croppedChatIconImg} 
                        alt="" 
                        className="w-10 h-10 rounded-full object-cover shadow-xs border border-[var(--crm-card-border)] ring-1 ring-indigo-500/20 bg-white p-0.5" 
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div 
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                        isRecipientOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                      }`}
                    />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 leading-tight truncate">
                      {mode === 'portal' 
                        ? 'Zyqitek' 
                        : (activeItem ? (activeItem.company ? `${activeItem.name} (${activeItem.company})` : activeItem.name) : (selectedConversationId ? 'Conversation' : 'Select a Conversation'))}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center gap-1.5 truncate">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isRecipientOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      {mode === 'portal' 
                        ? (isRecipientOnline ? 'Online' : getPresenceText('admin')) 
                        : (selectedConversationId ? (isRecipientOnline ? 'Online' : getPresenceText(selectedConversationId)) : 'No chat selected')}
                    </p>
                  </div>
                </>
              );
            })()}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Project-specific Conversation Filter */}
            {projects && projects.length > 0 && (
              <div className="flex items-center gap-1 sm:gap-2">
                <select
                  value={selectedProjectId}
                  onChange={e => setSelectedProjectId(e.target.value)}
                  className={`text-xs rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer shadow-xs font-medium max-w-[140px] sm:max-w-[200px] ${mode === 'admin' ? 'bg-[var(--crm-card)] border border-[var(--crm-card-border)] text-[var(--crm-text)] focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50' : 'bg-white border border-slate-200 text-slate-700 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400'}`}
                >
                  <option value="all">All / General</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name || p.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Pinned Messages Bar */}
        {pinnedMessages.length > 0 && (
          <div className={`px-4 py-2 border-b flex items-center justify-between text-xs shrink-0 z-10 transition-all ${mode === 'admin' ? 'bg-[var(--crm-sidebar)] border-[var(--crm-card-border)] text-[var(--crm-text)]' : 'bg-amber-50/90 border-amber-200/80 text-amber-900'}`}>
            <div className="flex items-center gap-2 truncate">
              <Pin size={13} className={mode === 'admin' ? 'text-amber-400 shrink-0' : 'text-amber-600 shrink-0'} />
              <span className="font-semibold shrink-0">Pinned ({pinnedMessages.length}):</span>
              <span className="truncate italic text-[11px] opacity-90">
                "{pinnedMessages[pinnedMessages.length - 1].message || 'Attachment'}"
              </span>
            </div>
            <button
              type="button"
              onClick={() => handlePinMessage(pinnedMessages[pinnedMessages.length - 1])}
              className={`p-1 rounded hover:bg-black/5 cursor-pointer ml-2 text-[10px] font-medium shrink-0 ${mode === 'admin' ? 'text-[var(--crm-subtitle)] hover:text-[var(--crm-text)]' : 'text-amber-700 hover:text-amber-900'}`}
              title="Unpin message"
            >
              Unpin
            </button>
          </div>
        )}

        {/* Message View Area */}
        <div 
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className={`flex-1 overflow-y-auto p-4 sm:p-5 relative flex flex-col ${mode === 'admin' ? 'bg-[var(--crm-card)]' : 'bg-[#0e161b]'}`}
        >
          {/* Subtle Custom Chat Wallpaper Pattern Tile (Doodle Wallpaper Background) */}
          <div 
            className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0"
            aria-hidden="true"
          >
            <div 
              className="absolute inset-0 w-full h-full opacity-[0.09] dark:opacity-[0.08]"
              style={{
                backgroundImage: `url(${chatDoodleBg})`,
                backgroundRepeat: 'repeat',
                backgroundSize: '360px 640px',
                backgroundPosition: 'top left',
              }}
            />
            <div className={`absolute inset-0 pointer-events-none ${
              mode === 'admin' 
                ? 'bg-gradient-to-b from-[var(--crm-card)]/30 via-transparent to-[var(--crm-card)]/30' 
                : 'bg-gradient-to-b from-black/20 via-transparent to-black/20'
            }`} />
          </div>
          {!selectedConversationId && mode === 'admin' ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4 text-slate-500">
              <div className="p-3 bg-[var(--crm-sidebar)] rounded-2xl border border-[var(--crm-card-border)] shadow-xs">
                <img 
                  src={croppedChatIconImg} 
                  alt="" 
                  className="w-12 h-12 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-[var(--crm-heading)]">No conversation selected</h4>
                <p className="text-xs text-[var(--crm-subtitle)] max-w-xs">
                  Select a Client or Team Member to start communicating.
                </p>
              </div>
            </div>
          ) : displayMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-3 text-slate-500">
              <div className="p-3 bg-indigo-50 rounded-full text-indigo-500">
                <Sparkles size={24} />
              </div>
              <p className="text-xs font-medium text-slate-600">
                No previous messages in this conversation.
              </p>
              <p className="text-[11px] text-slate-500">
                Send a message below to start communicating in real time!
              </p>
            </div>
          ) : (
            displayMessages.map((msg, idx) => {
              const isMine = mode === 'portal' 
                ? (msg.senderRole === currentUserRole || msg.senderId === effectivePortalId || msg.senderId === portalId) 
                : (msg.senderRole === 'Admin' || msg.senderId === 'admin');

              const prevMsg = idx > 0 ? displayMessages[idx - 1] : null;
              const nextMsg = idx < displayMessages.length - 1 ? displayMessages[idx + 1] : null;

              // Check if previous message was sent by the same person within a short time (e.g. 5 minutes)
              let isGroupedWithPrev = false;
              if (prevMsg && prevMsg.senderId === msg.senderId) {
                const prevTime = prevMsg.timestamp ? new Date(prevMsg.timestamp).getTime() : Date.now();
                const currTime = msg.timestamp ? new Date(msg.timestamp).getTime() : Date.now();
                if (currTime - prevTime < 5 * 60 * 1000) {
                  isGroupedWithPrev = true;
                }
              }

              let isGroupedWithNext = false;
              if (nextMsg && nextMsg.senderId === msg.senderId) {
                const currTime = msg.timestamp ? new Date(msg.timestamp).getTime() : Date.now();
                const nextTime = nextMsg.timestamp ? new Date(nextMsg.timestamp).getTime() : Date.now();
                if (nextTime - currTime < 5 * 60 * 1000) {
                  isGroupedWithNext = true;
                }
              }

              const isImage = msg.attachment?.fileType?.includes('image') || 
                ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].some(ext => msg.attachment?.fileName?.toLowerCase().endsWith(ext));

              const isRead = Boolean(msg.readStatus || msg.readAt || msg.status === 'read');
              const isDelivered = Boolean(isRead || msg.deliveredAt || msg.status === 'delivered');

              const pressHandlers = getMessageLongPressHandlers(msg, msg.id);

              return (
                <div
                  key={msg.id || idx}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} group relative select-none ${isGroupedWithPrev ? 'mt-1' : 'mt-3.5'}`}
                  {...pressHandlers}
                >
                  {!isGroupedWithPrev && (
                    <div className="flex items-center gap-2 px-1 mb-1">
                      <span className="text-[10px] font-semibold text-slate-500">
                        {isMine 
                          ? 'You' 
                          : (mode === 'portal' || msg.senderRole === 'Admin' || msg.senderId === 'admin' 
                            ? 'Zyqitek' 
                            : (msg.senderName && !msg.senderName.startsWith('portal-') && !msg.senderName.startsWith('client_portal_') && !msg.senderName.startsWith('team_portal_') && msg.senderName.length < 32 
                              ? msg.senderName 
                              : (portalName || currentUserName || (mode === 'admin' && selectedConversationId ? conversationsList.find(c => c.convId === selectedConversationId)?.name : null) || (portalType === 'team' ? 'Team Member' : 'Client'))))}
                      </span>
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] px-3.5 py-2.5 text-sm leading-relaxed shadow-xs relative transition-all duration-150 ${
                      activePressingMsgId === msg.id ? 'scale-[0.98] ring-2 ring-indigo-500/50 shadow-md opacity-95' : ''
                    } ${
                      selectedMessageForAction?.id === msg.id ? (mode === 'admin' ? 'ring-1 ring-[var(--crm-card-border)] brightness-110' : 'ring-2 ring-indigo-500/30 scale-[1.01]') : ''
                    } ${
                      msg.isDeleted ? (mode === 'admin' ? 'bg-[var(--crm-sidebar)] text-[var(--crm-subtitle)] italic border-[var(--crm-card-border)]' : 'bg-slate-100 text-slate-500 italic border-slate-200') : (isMine ? (mode === 'admin' ? 'bg-indigo-500/10 border border-indigo-500/20 text-[var(--crm-text)]' : 'bg-indigo-600 text-white') : (mode === 'admin' ? 'bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[var(--crm-text)]' : 'bg-white border border-slate-200 text-slate-800'))
                    } ${
                      isMine 
                        ? `rounded-l-2xl ${!isGroupedWithPrev ? 'rounded-tr-2xl' : 'rounded-tr-md'} ${!isGroupedWithNext ? 'rounded-br-2xl' : 'rounded-br-md'}` 
                        : `rounded-r-2xl ${!isGroupedWithPrev ? 'rounded-tl-2xl' : 'rounded-tl-md'} ${!isGroupedWithNext ? 'rounded-bl-2xl' : 'rounded-bl-md'}`
                    }`}
                  >
                    {/* Soft Deleted State */}
                    {msg.isDeleted ? (
                      <div className={`flex items-center gap-2 text-xs italic py-0.5 ${mode === 'admin' ? 'text-[var(--crm-text-muted)]' : 'text-slate-500'}`}>
                        <Trash2 size={13} className={mode === 'admin' ? 'text-[var(--crm-text-muted)]' : 'text-slate-400'} />
                        <span>This message was deleted</span>
                      </div>
                    ) : (
                      <>
                        {msg.isPinned && (
                          <div className={`flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider mb-1 ${isMine ? 'text-indigo-200' : 'text-slate-400'}`}>
                            <Paperclip size={10} />
                            <span>Pinned</span>
                          </div>
                        )}
                        
                        {msg.replyToMessageId && (
                          <div 
                            className={`mb-2 p-2 rounded flex flex-col gap-0.5 border-l-2 ${
                              isMine ? (mode === 'admin' ? 'bg-indigo-500/20 border-indigo-500/50 text-[var(--crm-text)]' : 'bg-indigo-700/40 border-indigo-300 text-indigo-100') : (mode === 'admin' ? 'bg-[var(--crm-card)] border-[var(--crm-card-border)] text-[var(--crm-text)]' : 'bg-slate-100 border-slate-300 text-slate-600')
                            }`}
                          >
                            <span className="text-[10px] font-bold">Replied Message</span>
                            <span className="text-xs truncate italic">
                              {allMessagesList.find(m => m.id === msg.replyToMessageId)?.message || 'Attachment'}
                            </span>
                          </div>
                        )}

                        {/* File Attachment Card */}
                        {msg.attachment && (
                          <div className={`mb-2 p-3 rounded-xl border flex flex-col gap-2 ${
                            isMine ? (mode === 'admin' ? 'bg-[var(--crm-sidebar)] border-indigo-500/30' : 'bg-indigo-700/50 border-indigo-500/40') : (mode === 'admin' ? 'bg-[var(--crm-card)] border-[var(--crm-card-border)]' : 'bg-slate-50 border-slate-200')
                          }`}>
                            {isImage && msg.attachment.fileUrl ? (
                              <div className="relative group rounded-lg overflow-hidden border border-slate-200 max-w-sm bg-slate-100">
                                <img 
                                  src={msg.attachment.fileUrl} 
                                  alt={msg.attachment.fileName} 
                                  className="w-full max-h-48 object-cover rounded-lg"
                                  loading="lazy"
                                />
                                <button
                                  type="button"
                                  onClick={() => setPreviewImageUrl(msg.attachment?.fileUrl || null)}
                                  className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer font-medium text-xs gap-1.5 backdrop-blur-xs"
                                >
                                  <Eye size={16} /> View Image
                                </button>
                              </div>
                            ) : null}

                            <div className="flex items-center justify-between gap-3 min-w-0">
                              <div className="flex items-center gap-2.5 min-w-0">
                                {getFileIcon(msg.attachment.fileType, msg.attachment.fileName)}
                                <div className="min-w-0">
                                  <p className={`text-xs font-semibold truncate ${isMine ? 'text-white' : 'text-slate-700'}`}>
                                    {msg.attachment.fileName}
                                  </p>
                                  <p className={`text-[10px] ${isMine ? 'opacity-75' : 'text-slate-500'}`}>
                                    {msg.attachment.fileSize}
                                  </p>
                                </div>
                              </div>
                              {msg.attachment.fileUrl && (
                                <a
                                  href={msg.attachment.downloadUrl || msg.attachment.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`p-2 rounded-lg transition-colors shrink-0 cursor-pointer shadow-xs ${
                                    isMine ? (mode === 'admin' ? 'bg-[var(--crm-sidebar)] hover:bg-[var(--crm-sidebar)]/80 text-[var(--crm-text)] border border-[var(--crm-card-border)]' : 'bg-indigo-800 hover:bg-indigo-900 text-white') : (mode === 'admin' ? 'bg-[var(--crm-card)] border border-[var(--crm-card-border)] hover:bg-[var(--crm-sidebar)] text-[var(--crm-text)]' : 'bg-white border border-slate-200 hover:bg-slate-50 text-indigo-600')
                                  }`}
                                  title="Download attachment"
                                >
                                  <Download size={15} />
                                </a>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Text Message Content */}
                        {msg.message && (
                          <p className="whitespace-pre-wrap break-words">
                            {msg.message}
                          </p>
                        )}
                      </>
                    )}

                    {/* Bottom Metadata: Timestamp + WhatsApp-Style Checkmarks */}
                    <div className={`flex items-center justify-end gap-1.5 mt-1 text-[10px] select-none ${
                      isMine ? 'text-indigo-100' : 'text-slate-500'
                    }`}>
                      <span>{formatTimestamp(msg.timestamp)}</span>

                      {isMine && !msg.isDeleted && (
                        <div className="flex items-center shrink-0">
                          {msg.status === 'sending' ? (
                            <span title="Sending...">
                              <Clock className="w-3 h-3 text-indigo-100 animate-spin" />
                            </span>
                          ) : msg.status === 'failed' ? (
                            <span className="flex items-center gap-1 text-rose-300 font-semibold" title="Delivery failed">
                              <AlertCircle className="w-3 h-3" />
                              <button
                                type="button"
                                onClick={() => handleRetryMessage(msg)}
                                className="underline hover:text-white cursor-pointer font-bold ml-0.5"
                              >
                                Retry
                              </button>
                            </span>
                          ) : isRead ? (
                            /* Double Sky Blue Ticks = READ */
                            <span title="Read by recipient" className="flex items-center text-sky-300">
                              <CheckCheck className="w-3.5 h-3.5 text-sky-300" />
                            </span>
                          ) : isDelivered ? (
                            /* Double Neutral Ticks = DELIVERED */
                            <span title="Delivered to recipient device" className="flex items-center text-indigo-100">
                              <CheckCheck className="w-3.5 h-3.5 text-indigo-100" />
                            </span>
                          ) : (
                            /* Single Neutral Tick = SENT */
                            <span title="Sent to server" className="flex items-center text-indigo-100">
                              <Check className="w-3.5 h-3.5 text-indigo-100" />
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Desktop Hover Action Menu Trigger */}
                  {!msg.isDeleted && (
                    <button
                      type="button"
                      onClick={() => setSelectedMessageForAction(msg)}
                      className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer ${
                        isMine ? 'mr-1' : 'ml-1'
                      }`}
                      title="Message actions"
                    >
                      <MoreVertical size={14} />
                    </button>
                  )}
                </div>
              );
            })
          )}

          {/* Simple Animated Three-Dots Typing Indicator Bubble (No "Admin is typing" text) */}
          {isRecipientTyping && (
            <div className="flex items-center gap-2 px-2 py-1">
              <div className={`rounded-2xl rounded-tl-md px-3.5 py-2.5 shadow-xs flex items-center gap-1.5 w-fit ${mode === 'admin' ? 'bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)]' : 'bg-white border border-slate-200'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Floating "Scroll to latest" button */}
        {showScrollBottomButton && (
          <button
            type="button"
            onClick={() => scrollToBottom(true)}
            className={`absolute bottom-20 right-8 p-2.5 rounded-full shadow-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold z-20 animate-in fade-in zoom-in ${mode === 'admin' ? 'bg-[var(--crm-card)] hover:bg-[var(--crm-sidebar)] border border-[var(--crm-card-border)] text-[var(--crm-text)]' : 'bg-white hover:bg-slate-50 border border-slate-200 text-indigo-600'}`}
          >
            <ArrowDown size={14} />
            <span>New messages</span>
          </button>
        )}

        {/* Selected File Preview Strip */}
        {selectedFile && (
          <div className={`px-6 py-2 flex items-center justify-between border-t ${mode === 'admin' ? 'bg-[var(--crm-sidebar)] border-[var(--crm-card-border)]' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium">
              <Paperclip size={14} />
              <span className="truncate max-w-xs">{selectedFile.name}</span>
              <span className={`text-[10px] ${mode === 'admin' ? 'text-[var(--crm-text-muted)]' : 'text-slate-500'}`}>({formatBytes(selectedFile.size)})</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="p-1 hover:bg-slate-200 rounded-md text-slate-500 hover:text-rose-500 transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Normal Bottom Input Composer */}
        <div className="flex flex-col">
          {replyingToMessage && (
              <div className={`px-4 py-2 flex items-center justify-between text-xs animate-in slide-in-from-bottom-2 border-t ${mode === 'admin' ? 'bg-[var(--crm-sidebar)] border-[var(--crm-card-border)] text-[var(--crm-text-secondary)]' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <div className="flex items-center gap-2 truncate">
                  <img src={croppedChatIconImg} alt="" className="w-3.5 h-3.5 object-contain shrink-0" referrerPolicy="no-referrer" />
                  <span className="font-semibold">{replyingToMessage.senderName}:</span>
                  <span className="truncate">{replyingToMessage.type === 'file' ? 'Attachment' : replyingToMessage.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingToMessage(null)}
                  className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          <form onSubmit={handleSendMessage} className={`p-3 sm:p-4 border-t flex items-center gap-2 ${mode === 'admin' ? 'bg-[var(--crm-sidebar)] border-[var(--crm-card-border)]' : 'bg-white border-slate-100'}`}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={e => setSelectedFile(e.target.files?.[0] || null)}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.zip,.rar,.txt"
            />

            <div className={`flex-1 min-w-0 flex items-center rounded-2xl px-2 transition-all shadow-xs border ${mode === 'admin' ? 'bg-[var(--crm-card)] border-[var(--crm-card-border)] focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50' : 'bg-slate-50 border-slate-200/60 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400'}`}>
              {/* File Attachment Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={(!selectedConversationId && mode === 'admin') || isSending}
                className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                title="Attach File"
              >
                <Paperclip size={18} />
              </button>

              <input
                type="text"
                ref={inputRef}
                value={inputText}
                onChange={handleInputChange}
                disabled={(!selectedConversationId && mode === 'admin') || isUploading || isSending}
                placeholder={
                  isUploading 
                    ? 'Uploading file...' 
                    : isSending 
                      ? 'Sending message...'
                      : (!selectedConversationId && mode === 'admin' ? 'Select a chat first...' : 'Type a message...')
                }
                className="flex-1 min-w-0 bg-transparent px-2 py-2.5 sm:py-3 text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={(!inputText.trim() && !selectedFile) || isUploading || isSending || (!selectedConversationId && mode === 'admin')}
              className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl transition-all cursor-pointer shadow-md shadow-indigo-600/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[44px] h-[44px] shrink-0"
            >
              {isSending ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <Send size={18} className="ml-0.5" />
              )}
            </button>
          </form>
        </div>
      </div>

      {/* WhatsApp-Style Message Context Action Menu */}
      {selectedMessageForAction && !messageToDelete && (
        <div 
          className="fixed inset-0 z-[9999] bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedMessageForAction(null)}
        >
          <div 
            className={`rounded-2xl shadow-2xl p-2.5 max-w-[260px] w-full space-y-1 animate-in zoom-in-95 duration-150 ${mode === 'admin' ? 'bg-[var(--crm-card)] border border-[var(--crm-card-border)]' : 'bg-white border border-slate-200'}`}
            onClick={e => e.stopPropagation()}
          >
            <div className={`px-3 py-2 text-xs font-semibold border-b flex items-center justify-between ${mode === 'admin' ? 'text-[var(--crm-text-muted)] border-[var(--crm-card-border)]' : 'text-slate-500 border-slate-100'}`}>
              <span className="truncate max-w-[180px]">
                {selectedMessageForAction.message 
                  ? `"${selectedMessageForAction.message.slice(0, 22)}${selectedMessageForAction.message.length > 22 ? '...' : ''}"`
                  : selectedMessageForAction.attachment?.fileName || 'Message Actions'}
              </span>
              <button
                type="button"
                onClick={() => setSelectedMessageForAction(null)}
                className={`p-1 rounded-lg transition-colors cursor-pointer ${mode === 'admin' ? 'hover:bg-[var(--crm-sidebar)] text-[var(--crm-text-muted)] hover:text-[var(--crm-text)]' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'}`}
              >
                <X size={14} />
              </button>
            </div>

            {/* 1. Reply */}
            <button
              type="button"
              onClick={() => {
                const target = selectedMessageForAction;
                setSelectedMessageForAction(null);
                setReplyingToMessage(target);
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium text-xs transition-colors cursor-pointer text-left ${mode === 'admin' ? 'hover:bg-[var(--crm-sidebar)] text-[var(--crm-text)]' : 'hover:bg-slate-50 text-slate-700'}`}
            >
              <Reply size={15} className="text-indigo-500 shrink-0" />
              <span>Reply</span>
            </button>

            {/* 2. Copy */}
            <button
              type="button"
              onClick={() => {
                const textToCopy = selectedMessageForAction.message || selectedMessageForAction.attachment?.fileName || '';
                if (textToCopy) {
                  if (navigator.clipboard?.writeText) {
                    navigator.clipboard.writeText(textToCopy);
                  }
                  showToast('Copied to clipboard', 'success');
                }
                setSelectedMessageForAction(null);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium text-xs transition-colors cursor-pointer text-left ${mode === 'admin' ? 'hover:bg-[var(--crm-sidebar)] text-[var(--crm-text)]' : 'hover:bg-slate-50 text-slate-700'}`}
            >
              <Copy size={15} className="text-slate-400 shrink-0" />
              <span>Copy</span>
            </button>
            
            {/* 3. Pin */}
            <button
              type="button"
              onClick={() => handlePinMessage(selectedMessageForAction)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium text-xs transition-colors cursor-pointer text-left ${mode === 'admin' ? 'hover:bg-[var(--crm-sidebar)] text-[var(--crm-text)]' : 'hover:bg-slate-50 text-slate-700'}`}
            >
              {selectedMessageForAction.isPinned ? (
                <PinOff size={15} className="text-amber-500 shrink-0" />
              ) : (
                <Pin size={15} className="text-amber-500 shrink-0" />
              )}
              <span>{selectedMessageForAction.isPinned ? 'Unpin' : 'Pin'}</span>
            </button>

            {/* 4. Delete */}
            <button
              type="button"
              onClick={() => {
                const targetMsg = selectedMessageForAction;
                setSelectedMessageForAction(null);
                setMessageToDelete(targetMsg);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium text-xs transition-colors cursor-pointer text-left ${mode === 'admin' ? 'hover:bg-rose-500/10 text-rose-400' : 'hover:bg-rose-50 text-rose-600'}`}
            >
              <Trash2 size={15} className="text-rose-500 shrink-0" />
              <span>Delete</span>
            </button>

            {/* 5. Clear Data */}
            <button
              type="button"
              onClick={() => {
                setSelectedMessageForAction(null);
                setIsClearChatConfirmOpen(true);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium text-xs transition-colors cursor-pointer text-left ${mode === 'admin' ? 'hover:bg-rose-500/10 text-rose-400' : 'hover:bg-rose-50 text-rose-600'}`}
            >
              <Eraser size={15} className="text-rose-500 shrink-0" />
              <span>Clear Data</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMessageForAction(null)}
              className={`w-full px-3 py-1.5 rounded-xl font-medium text-xs transition-colors cursor-pointer text-center ${mode === 'admin' ? 'text-[var(--crm-text-muted)] hover:bg-[var(--crm-sidebar)] hover:text-[var(--crm-text)]' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {messageToDelete && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setMessageToDelete(null)}
        >
          <div 
            className={`rounded-2xl shadow-2xl p-5 max-w-sm w-full space-y-4 animate-in zoom-in-95 duration-150 ${mode === 'admin' ? 'bg-[var(--crm-card)] border border-[var(--crm-card-border)]' : 'bg-white border border-slate-200'}`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${mode === 'admin' ? 'bg-rose-500/10 text-rose-500' : 'bg-rose-100 text-rose-600'}`}>
                <Trash2 size={20} />
              </div>
              <div>
                <h4 className={`text-sm font-bold ${mode === 'admin' ? 'text-[var(--crm-heading)]' : 'text-slate-900'}`}>Delete this message?</h4>
                <p className={`text-xs mt-0.5 ${mode === 'admin' ? 'text-[var(--crm-subtitle)]' : 'text-slate-500'}`}>
                  This will remove the message for everyone in this conversation.
                </p>
              </div>
            </div>

            <div className={`flex items-center justify-end gap-2 pt-2 border-t ${mode === 'admin' ? 'border-[var(--crm-card-border)]' : 'border-slate-100'}`}>
              <button
                type="button"
                onClick={() => setMessageToDelete(null)}
                className={`px-4 py-2 rounded-xl font-medium text-xs transition-colors cursor-pointer ${mode === 'admin' ? 'bg-[var(--crm-sidebar)] hover:bg-slate-200/10 text-[var(--crm-text)]' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteMessage(messageToDelete)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold text-xs transition-colors cursor-pointer shadow-sm shadow-rose-600/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Chat Confirmation Dialog */}
      {isClearChatConfirmOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setIsClearChatConfirmOpen(false)}
        >
          <div 
            className={`rounded-2xl shadow-2xl p-5 max-w-sm w-full space-y-4 animate-in zoom-in-95 duration-150 ${mode === 'admin' ? 'bg-[var(--crm-card)] border border-[var(--crm-card-border)]' : 'bg-white border border-slate-200'}`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${mode === 'admin' ? 'bg-rose-500/10 text-rose-500' : 'bg-rose-100 text-rose-600'}`}>
                <Trash2 size={20} />
              </div>
              <div>
                <h4 className={`text-sm font-bold ${mode === 'admin' ? 'text-[var(--crm-heading)]' : 'text-slate-900'}`}>Clear chat?</h4>
                <p className={`text-xs mt-0.5 ${mode === 'admin' ? 'text-[var(--crm-text-muted)]' : 'text-slate-500'}`}>
                  This will clear all messages in this conversation.
                </p>
              </div>
            </div>
            <div className={`flex items-center justify-end gap-2 pt-2 border-t ${mode === 'admin' ? 'border-[var(--crm-card-border)]' : 'border-slate-100'}`}>
              <button
                type="button"
                onClick={() => setIsClearChatConfirmOpen(false)}
                className={`px-4 py-2 rounded-xl font-medium text-xs transition-colors cursor-pointer ${mode === 'admin' ? 'bg-[var(--crm-sidebar)] hover:bg-slate-200/10 text-[var(--crm-text)]' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearChat}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold text-xs transition-colors cursor-pointer shadow-sm shadow-rose-600/20"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Preview Modal */}
      {previewImageUrl && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div className="relative max-w-4xl max-h-full" onClick={e => e.stopPropagation()}>
            <img src={previewImageUrl} alt="Attachment Full Preview" className={`max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain border border-slate-200/20 ${mode === 'admin' ? 'bg-[var(--crm-card)]' : 'bg-white'}`} />
            <button
              type="button"
              onClick={() => setPreviewImageUrl(null)}
              className={`absolute -top-4 -right-4 p-2 rounded-full shadow-xl border transition-colors cursor-pointer ${mode === 'admin' ? 'bg-[var(--crm-card)] hover:bg-[var(--crm-sidebar)] text-[var(--crm-text)] border-[var(--crm-card-border)]' : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200'}`}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
