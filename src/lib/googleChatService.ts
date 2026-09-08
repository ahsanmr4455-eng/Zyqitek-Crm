// In-memory access token cache (Strictly in-memory, NOT in localStorage / sessionStorage)
let cachedAccessToken: string | null = null;
let currentUser: any = null;

export interface GoogleChatSpace {
  name: string; // e.g. "spaces/AAAAAAAAAAA"
  displayName?: string;
  spaceType?: 'SPACE' | 'GROUP_CHAT' | 'DIRECT_MESSAGE' | string;
  type?: string;
  singleUserBotDm?: boolean;
  threaded?: boolean;
  spaceHistoryState?: string;
  activeView?: boolean;
  createTime?: string;
}

export interface GoogleChatMessage {
  name: string; // e.g. "spaces/AAA/messages/BBB"
  sender?: {
    name: string;
    displayName?: string;
    avatarUrl?: string;
    type?: 'HUMAN' | 'BOT';
  };
  text?: string;
  createTime?: string;
  thread?: {
    name: string;
  };
  space?: {
    name: string;
  };
}

export interface GoogleChatMember {
  name: string;
  state?: string;
  role?: string;
  member?: {
    name: string;
    displayName?: string;
    type?: string;
    avatarUrl?: string;
  };
}

/**
 * Initialize Auth State listener for Google Workspace
 */
export const initChatAuth = (
  onAuthSuccess?: (user: any, token: string) => void,
  onAuthFailure?: () => void
) => {
  if (cachedAccessToken && currentUser) {
    if (onAuthSuccess) onAuthSuccess(currentUser, cachedAccessToken);
  } else {
    if (onAuthFailure) onAuthFailure();
  }
  return () => {};
};

/**
 * Sign in with Google to obtain Google Chat Access Token
 */
export const signInWithGoogleChat = async (): Promise<{ user: any; accessToken: string } | null> => {
  try {
    // In-memory token acquisition
    if (cachedAccessToken) {
      return { user: currentUser || { displayName: 'Zyqitek User' }, accessToken: cachedAccessToken };
    }
    return null;
  } catch (error: any) {
    console.error('Google Chat Sign In Error:', error);
    throw error;
  }
};

export const setChatAccessToken = (token: string | null, user?: any): void => {
  cachedAccessToken = token;
  currentUser = user || null;
};

export const getChatAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const signOutChat = async (): Promise<void> => {
  cachedAccessToken = null;
  currentUser = null;
};

/**
 * List all Google Chat spaces accessible by the authenticated user
 */
export const listGoogleChatSpaces = async (): Promise<GoogleChatSpace[]> => {
  if (!cachedAccessToken) {
    throw new Error('No Google Chat access token available. Please sign in with Google.');
  }

  const response = await fetch('https://chat.googleapis.com/v1/spaces?pageSize=100', {
    headers: {
      Authorization: `Bearer ${cachedAccessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to fetch Google Chat spaces (${response.status})`);
  }

  const data = await response.json();
  return data.spaces || [];
};

/**
 * Create a new Google Chat Space
 */
export const createGoogleChatSpace = async (displayName: string, spaceType: 'SPACE' | 'GROUP_CHAT' = 'SPACE'): Promise<GoogleChatSpace> => {
  if (!cachedAccessToken) {
    throw new Error('No Google Chat access token available. Please sign in with Google.');
  }

  const response = await fetch('https://chat.googleapis.com/v1/spaces', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cachedAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      displayName,
      spaceType,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to create Google Chat space (${response.status})`);
  }

  return await response.json();
};

/**
 * List messages in a specific Google Chat space
 */
export const listGoogleChatMessages = async (spaceName: string): Promise<GoogleChatMessage[]> => {
  if (!cachedAccessToken) {
    throw new Error('No Google Chat access token available. Please sign in with Google.');
  }

  const cleanSpace = spaceName.startsWith('spaces/') ? spaceName : `spaces/${spaceName}`;
  const response = await fetch(`https://chat.googleapis.com/v1/${cleanSpace}/messages?pageSize=50`, {
    headers: {
      Authorization: `Bearer ${cachedAccessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to list messages (${response.status})`);
  }

  const data = await response.json();
  return data.messages || [];
};

/**
 * Send a message to a Google Chat space
 */
export const sendGoogleChatMessage = async (spaceName: string, text: string): Promise<GoogleChatMessage> => {
  if (!cachedAccessToken) {
    throw new Error('No Google Chat access token available. Please sign in with Google.');
  }

  const cleanSpace = spaceName.startsWith('spaces/') ? spaceName : `spaces/${spaceName}`;
  const response = await fetch(`https://chat.googleapis.com/v1/${cleanSpace}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cachedAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to send Google Chat message (${response.status})`);
  }

  return await response.json();
};

/**
 * List members in a Google Chat space
 */
export const listGoogleChatMembers = async (spaceName: string): Promise<GoogleChatMember[]> => {
  if (!cachedAccessToken) {
    throw new Error('No Google Chat access token available. Please sign in with Google.');
  }

  const cleanSpace = spaceName.startsWith('spaces/') ? spaceName : `spaces/${spaceName}`;
  const response = await fetch(`https://chat.googleapis.com/v1/${cleanSpace}/members?pageSize=100`, {
    headers: {
      Authorization: `Bearer ${cachedAccessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to list space members (${response.status})`);
  }

  const data = await response.json();
  return data.memberships || [];
};

/**
 * Delete a message from Google Chat
 */
export const deleteGoogleChatMessage = async (messageName: string): Promise<void> => {
  if (!cachedAccessToken) {
    throw new Error('No Google Chat access token available. Please sign in with Google.');
  }

  const cleanName = messageName.startsWith('spaces/') ? messageName : `spaces/${messageName}`;
  const response = await fetch(`https://chat.googleapis.com/v1/${cleanName}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${cachedAccessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to delete message (${response.status})`);
  }
};
