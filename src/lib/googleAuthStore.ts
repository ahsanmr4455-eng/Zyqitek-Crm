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
      method: 'GET',
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
