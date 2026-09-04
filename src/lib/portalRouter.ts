export interface PortalRouteInfo {
  type: 'client' | 'team' | 'invalid';
  secureToken: string;
}

/**
 * Parses current window URL to check if an external user opened a direct browser portal link.
 * STRICT ISOLATION: The CRM is only accessible via explicit /admin or /crm paths.
 * ALL other paths are evaluated as portal links. If a portal link is missing a valid token, it is rejected.
 */
export function parsePortalRoute(pathInput?: string): PortalRouteInfo | null {
  const rawPathname = pathInput ?? (typeof window !== 'undefined' ? window.location.pathname : '');
  if (!rawPathname) return null;

  try {
    const lowerPathname = rawPathname.toLowerCase();

    // Check if the current route is a portal route attempt (/p or /portal)
    const isPortalRoute = lowerPathname === '/p' || lowerPathname.startsWith('/p/') || lowerPathname.startsWith('/portal/');
    
    if (!isPortalRoute) {
      return null; // CRM route (including /portal or /dashboard, etc.)
    }

    const rawParts = rawPathname.split('/').filter(Boolean);
    const lowerParts = lowerPathname.split('/').filter(Boolean);
    // e.g. ['p', 'c', 'token'] or ['portal', 'c', 'token']
    
    // 1. Path structure: /p/c/:token or /portal/c/:token or /p/t/:token or /portal/t/:token
    // Must be exactly 3 parts: ['p', 'c', 'token'] or ['portal', 'c', 'token']
    if (lowerParts.length === 3 && (lowerParts[0] === 'p' || lowerParts[0] === 'portal')) {
      const typeChar = lowerParts[1];
      const secureToken = rawParts[2] ? rawParts[2].trim() : '';
      
      if (secureToken) {
        if (typeChar === 'c' || typeChar === 'client') return { type: 'client', secureToken };
        if (typeChar === 't' || typeChar === 'team') return { type: 'team', secureToken };
      }
    }

    // 2. Query parameter fallback only for /p, /portal, /p/c, /portal/c, /p/t, /portal/t (parts <= 2)
    if (lowerParts.length <= 2 && (lowerParts[0] === 'p' || lowerParts[0] === 'portal')) {
      const searchParams = new URLSearchParams(window.location.search);
      const idParam = searchParams.get('token') || searchParams.get('id') || searchParams.get('portalId');

      if (idParam && idParam.trim() !== '') {
        const typeChar = lowerParts[1] || (searchParams.get('type') === 'team' ? 't' : 'c');
        const type = (typeChar === 't' || typeChar === 'team') ? 'team' : 'client';
        return { type, secureToken: idParam.trim() };
      }
    }

    // Any other /p/... or /portal/... route with extra subpaths (length > 3) or missing/invalid token is an invalid/tampered portal route
    return { type: 'invalid', secureToken: '' };

  } catch (err) {
    console.error('Error parsing portal route:', err);
    return { type: 'invalid', secureToken: '' };
  }
}

/**
 * Generates the secure, non-predictable URL for a Client or Team Portal.
 */
export function generatePortalLink(type: 'client' | 'team', portalId: string, secureToken?: string): { primaryUrl: string; cleanPathUrl: string } {
  const origin = (typeof window !== 'undefined' && window.location && window.location.origin)
    ? window.location.origin
    : '';

  // MUST use secureToken for link generation to prevent enumeration.
  // If no secure token is provided (legacy), we use the portalId, but ideally it should always exist.
  const token = secureToken || portalId;
  const typeChar = type === 'client' ? 'c' : 't';

  const cleanPathUrl = origin ? `${origin}/p/${typeChar}/${token}` : `/p/${typeChar}/${token}`;

  return { primaryUrl: cleanPathUrl, cleanPathUrl };
}
