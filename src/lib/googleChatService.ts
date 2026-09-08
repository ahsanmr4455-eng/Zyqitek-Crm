import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import firebaseConfig from './firebase-applet-config.json';

// Reuse initialized Firebase app if present
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Provider with requested Google Chat scopes
const chatProvider = new GoogleAuthProvider();
chatProvider.addScope('https://www.googleapis.com/auth/chat.spaces');
chatProvider.addScope('https://www.googleapis.com/auth/chat.spaces.readonly');
chatProvider.addScope('https://www.googleapis.com/auth/chat.spaces.create');
chatProvider.addScope('https://www.googleapis.com/auth/chat.messages');
chatProvider.addScope('https://www.googleapis.com/auth/chat.messages.create');
chatProvider.addScope('https://www.googleapis.com/auth/chat.messages.readonly');
chatProvider.addScope('https://www.googleapis.com/auth/chat.messages.reactions');
chatProvider.addScope('https://www.googleapis.com/auth/chat.messages.reactions.create');
chatProvider.addScope('https://www.googleapis.com/auth/chat.messages.reactions.readonly');
chatProvider.addScope('https://www.googleapis.com/auth/chat.memberships');
chatProvider.addScope('https://www.googleapis.com/auth/chat.memberships.readonly');
chatProvider.addScope('https://www.googleapis.com/auth/chat.customemojis.readonly');
chatProvider.addScope('https://www.googleapis.com/auth/chat.users.readstate');
chatProvider.addScope('https://www.googleapis.com/auth/chat.users.readstate.readonly');
chatProvider.addScope('https://www.googleapis.com/auth/chat.users.spacesettings');

// In-memory access token cache (Strictly in-memory, NOT in localStorage / sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

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
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token must be refreshed or acquired through explicit user interaction
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Sign in with Google to obtain Google Chat Access Token
 */
export const signInWithGoogleChat = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, chatProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google Chat access token from OAuth credential');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Chat Sign In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getChatAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const signOutChat = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
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

  // Format: spaces/{spaceId}
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
 * Delete a message from Google Chat with destructive action requirement
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
