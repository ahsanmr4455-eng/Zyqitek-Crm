import { auth } from './googleChatService';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

interface TokenEntry {
  accessToken: string;
  user: any;
  verifiedAt: number;
}

// In-memory token store (no hardcoded credentials, no secrets in localStorage)
const tokenStore = new Map<string, TokenEntry>();

/**
 * Endpoint map for verifying Google API access tokens
 */
const VERIFICATION_PROBES: Record<string, string> = {
  drive: 'https://www.googleapis.com/drive/v3/about?fields=user',
  picker: 'https://www.googleapis.com/drive/v3/about?fields=user',
  gmail: 'https://gmail.googleapis.com/gmail/v1/users/me/profile',
  sheets: 'https://sheets.googleapis.com/v4/spreadsheets',
  calendar: 'https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=1',
  contacts: 'https://people.googleapis.com/v1/people/me?personFields=names',
  tasks: 'https://tasks.googleapis.com/tasks/v1/users/@me/lists',
};

/**
 * Verifies a Google OAuth access token against official Google API endpoints
 */
export async function verifyGoogleToken(integrationId: string, accessToken: string): Promise<{ valid: boolean; error?: string }> {
  if (!accessToken || typeof accessToken !== 'string' || accessToken.trim().length < 10) {
    return { valid: false, error: 'No active OAuth access token held.' };
  }

  const probeUrl = VERIFICATION_PROBES[integrationId] || `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(accessToken)}`;

  try {
    const response = await fetch(probeUrl, {
      method: probeUrl.includes('tokeninfo') ? 'GET' : 'GET',
      headers: probeUrl.includes('tokeninfo') ? {} : {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      return { valid: true };
    }

    const errData = await response.json().catch(() => ({}));
    const errMsg = errData?.error?.message || errData?.error_description || `HTTP ${response.status}: Google API verification failed.`;
    return { valid: false, error: errMsg };
  } catch (err: any) {
    return { valid: false, error: err?.message || 'Network error verifying Google API token.' };
  }
}

/**
 * Gets cached token if held and valid
 */
export function getIntegrationToken(integrationId: string): string | null {
  const entry = tokenStore.get(integrationId);
  if (!entry) return null;
  // Consider token expired if older than 55 minutes
  if (Date.now() - entry.verifiedAt > 55 * 60 * 1000) {
    tokenStore.delete(integrationId);
    return null;
  }
  return entry.accessToken;
}

/**
 * Sets validated token in memory
 */
export function setIntegrationToken(integrationId: string, accessToken: string, user?: any): void {
  tokenStore.set(integrationId, {
    accessToken,
    user: user || null,
    verifiedAt: Date.now()
  });
}

/**
 * Clears token from memory
 */
export function clearIntegrationToken(integrationId: string): void {
  tokenStore.delete(integrationId);
}

/**
 * Connects a Google OAuth integration using Firebase Auth signInWithPopup
 * and verifies the acquired token against Google APIs.
 */
export async function connectGoogleOAuthIntegration(
  integrationId: string,
  scopes: string[]
): Promise<{ success: boolean; accessToken?: string; error?: string }> {
  try {
    const provider = new GoogleAuthProvider();
    scopes.forEach(scope => provider.addScope(scope));

    // Force prompt account selection if needed
    provider.setCustomParameters({
      prompt: 'consent',
      access_type: 'online'
    });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;

    if (!token) {
      return { success: false, error: 'OAuth popup completed but no access token was returned.' };
    }

    // Live probe test token against Google API
    const verification = await verifyGoogleToken(integrationId, token);
    if (!verification.valid) {
      return { 
        success: false, 
        error: `Token acquired but Google API verification failed: ${verification.error || 'Access denied or API not enabled.'}` 
      };
    }

    // Save token in memory
    setIntegrationToken(integrationId, token, result.user);
    return { success: true, accessToken: token };
  } catch (error: any) {
    console.error(`[Google Integration] OAuth Error for ${integrationId}:`, error);
    if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
      return { success: false, error: 'Connection cancelled: Google authentication popup was closed.' };
    }
    return { success: false, error: error?.message || 'Google OAuth connection failed.' };
  }
}
