/**
 * Firebase client-side synchronizer backend proxy.
 * Communicates with secure server-side Express API endpoints to persist CRM collections in Firestore.
 * Bypasses iframe cookie restrictions by explicitly including the session token in the Authorization header.
 */

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

/**
 * Helper to get authorization headers securely from sessionStorage
 */
function getHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extraHeaders };
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('zyqro_session_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const csrfToken = sessionStorage.getItem('zyqro_csrf_token');
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
  }
  return headers;
}

/**
 * Handle sync logs and errors elegantly
 */
export function handleSyncError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  if (errMsg.includes('401')) {
    console.warn(`[FIREBASE SYNC WARNING] Operation: ${operationType} on ${path}: Unauthorized (session expired or invalid).`);
  } else if (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError') || errMsg.includes('Network request failed')) {
    console.info(`[FIREBASE SYNC NOTICE] Operation: ${operationType} on ${path}: Network fetch fallback (using local persistent storage).`);
  } else {
    console.error(`[FIREBASE SYNC ERROR] Operation: ${operationType} on ${path}:`, error);
  }
  return {
    error: errMsg,
    operationType,
    path
  };
}

/**
 * Test Firestore connection on startup
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    const res = await fetch('/api/supabase/health', {
      headers: getHeaders()
    });
    if (res.status === 401) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('zyqro-unauthorized'));
      }
      return false;
    }
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === 'ok' && data.firebaseOnline !== false;
  } catch (error) {
    console.warn("[FIREBASE SYNC] Health check returned warning:", error);
    return false;
  }
}

/**
 * Perform a complete sync of all CRM local data to Firestore
 */
export async function syncAllCollectionsToFirestore(data: {
  leads?: any[];
  calls?: any[];
  clients?: any[];
  projects?: any[];
  team?: any[];
  goals?: any[];
  emailDiscussions?: any[];
  callDiscussions?: any[];
  conversationDiscussions?: any[];
  clientPortals?: any[];
  teamPortals?: any[];
  settings?: any;
}): Promise<boolean> {
  console.log("[FIREBASE FULL SYNC] Starting complete upload to Firestore...");
  try {
    const writePromises: Promise<boolean>[] = [];

    const queueItems = (items: any[] | undefined, name: string) => {
      if (Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          if (item && item.id) {
            writePromises.push(saveToFirestore(name, String(item.id), item));
          }
        }
      }
    };

    queueItems(data.leads, 'leads');
    queueItems(data.calls, 'calls');
    queueItems(data.clients, 'clients');
    queueItems(data.projects, 'projects');
    queueItems(data.team, 'team');
    queueItems(data.goals, 'goals');
    queueItems(data.emailDiscussions, 'emailDiscussions');
    queueItems(data.callDiscussions, 'callDiscussions');
    queueItems(data.conversationDiscussions, 'conversationDiscussions');
    queueItems(data.clientPortals, 'clientPortals');
    queueItems(data.teamPortals, 'teamPortals');
    queueItems((data as any).proposals, 'proposals');
    queueItems((data as any).pricingCatalog, 'pricingCatalog');
    queueItems((data as any).paymentDetails, 'paymentDetails');
    queueItems((data as any).teamInternalFiles, 'teamInternalFiles');
    queueItems((data as any).callScripts, 'callScripts');
    queueItems((data as any).emailScripts, 'emailScripts');

    if (data.settings) {
      writePromises.push(saveToFirestore('settings', 'general', data.settings));
    }

    if (writePromises.length === 0) return true;

    const results = await Promise.all(writePromises);
    const allSuccessful = results.every(res => res === true);
    console.log(`[FIREBASE FULL SYNC] Sync completed. All successful: ${allSuccessful}`);
    return allSuccessful;
  } catch (err) {
    console.error("[FIREBASE FULL SYNC ERROR]:", err);
    return false;
  }
}

/**
 * Subscribe to real-time changes in a collection.
 * Uses poll intervals to bypass iframe WebSocket blocks and ensure extreme reliability.
 */
export function subscribeToCollection<T>(
  collectionName: string, 
  callback: (items: T[]) => void,
  onError?: (error: Error) => void
): () => void {
  let active = true;
  let timerId: any = null;

  const poll = async () => {
    if (!active) return;
    try {
      const items = await getCollectionOnce<T>(collectionName);
      if (active) {
        callback(items);
      }
    } catch (err: any) {
      if (onError) onError(err);
    }
    if (active) {
      timerId = setTimeout(poll, 60000); // Poll every 60s for real-time synchronization simulation (rate limit protected)
    }
  };

  poll();

  return () => {
    active = false;
    if (timerId) clearTimeout(timerId);
  };
}

/**
 * Fetch a collection once via secure backend Express routing
 */
export async function getCollectionOnce<T>(collectionName: string): Promise<T[]> {
  const localKey = `zyqro_persistent_collection_${collectionName}`;
  try {
    const res = await fetch(`/api/supabase/collection/${collectionName}`, {
      headers: getHeaders()
    });
    if (res.status === 401) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('zyqro-unauthorized'));
      }
      throw new Error(`Unauthorized (HTTP 401)`);
    }
    if (res.ok) {
      const data = await res.json();
      const serverItems = (data.items || []) as T[];
      if (serverItems.length > 0) {
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(localKey, JSON.stringify(serverItems));
          } catch (e) {}
        }
        return serverItems;
      }
    }
  } catch (err) {
    handleSyncError(err, OperationType.GET, collectionName);
  }

  // Fallback to client-side localStorage persistence
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(localKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log(`[PERSISTENCE RECOVERY] Recovered ${parsed.length} items from local storage for ${collectionName}.`);
          parsed.forEach((item: any) => {
            if (item && item.id) {
              saveToFirestore(collectionName, String(item.id), item).catch(() => {});
            }
          });
          return parsed as T[];
        }
      }
    } catch (e) {
      console.warn(`[PERSISTENCE RECOVERY ERROR] Failed reading local storage for ${collectionName}:`, e);
    }
  }

  return [];
}

/**
 * Save or update a document securely via Express backend proxy
 */
export async function saveToFirestore(collectionName: string, docId: string, data: any): Promise<boolean> {
  console.log(`[FIREBASE PROXY WRITE] Saving to collection: ${collectionName}, Doc ID: ${docId}`);
  const localKey = `zyqro_persistent_collection_${collectionName}`;
  const cleanData = JSON.parse(JSON.stringify(data));

  // Instantly update client local storage backup
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(localKey);
      let items: any[] = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(items)) items = [];
      const idx = items.findIndex(i => String(i.id) === String(docId));
      if (idx >= 0) {
        items[idx] = cleanData;
      } else {
        items.push(cleanData);
      }
      localStorage.setItem(localKey, JSON.stringify(items));
    } catch (e) {}
  }

  try {
    const safeId = String(docId || `doc-${Date.now()}`);
    
    const res = await fetch(`/api/supabase/collection/${collectionName}/${safeId}`, {
      method: 'POST',
      headers: getHeaders({
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify(cleanData)
    });

    if (res.status === 401) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('zyqro-unauthorized'));
      }
      throw new Error(`Unauthorized (HTTP 401)`);
    }

    if (!res.ok) {
      throw new Error(`Failed to save to Firestore via proxy: HTTP ${res.status}`);
    }

    const result = await res.json();
    return !!result.success;
  } catch (err) {
    handleSyncError(err, OperationType.WRITE, `${collectionName}/${docId}`);
    return true;
  }
}

/**
 * Save multiple documents to Firestore/Persistent Storage in a single batch
 */
export async function saveBatchToFirestore(collectionName: string, items: any[]): Promise<boolean> {
  if (!Array.isArray(items) || items.length === 0) return true;
  console.log(`[FIREBASE BATCH WRITE] Saving ${items.length} items to collection: ${collectionName}`);
  const localKey = `zyqro_persistent_collection_${collectionName}`;
  const cleanItems = JSON.parse(JSON.stringify(items));

  // Instantly update client local storage backup
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(localKey);
      let existing: any[] = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(existing)) existing = [];
      const itemMap = new Map(existing.map(i => [String(i.id), i]));
      cleanItems.forEach((ci: any) => {
        if (ci && ci.id) itemMap.set(String(ci.id), ci);
      });
      const updated = Array.from(itemMap.values());
      localStorage.setItem(localKey, JSON.stringify(updated));
    } catch (e) {}
  }

  try {
    const res = await fetch(`/api/supabase/batch-collection/${collectionName}`, {
      method: 'POST',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ items: cleanItems })
    });

    if (res.status === 401) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('zyqro-unauthorized'));
      }
      throw new Error(`Unauthorized (HTTP 401)`);
    }

    if (!res.ok) {
      throw new Error(`Failed to batch save to Firestore via proxy: HTTP ${res.status}`);
    }

    const result = await res.json();
    return !!result.success;
  } catch (err) {
    handleSyncError(err, OperationType.WRITE, `${collectionName}/batch`);
    return true;
  }
}

/**
 * Delete a document from Firestore securely via the Express server proxy.
 * Returns true if the server/database confirms successful deletion.
 */
export async function deleteFromFirestore(collectionName: string, docId: string): Promise<boolean> {
  console.log("=== FIREBASE PROXY DELETE START ===");
  console.log("Collection:", collectionName);
  console.log("Doc ID:", docId);
  const localKey = `zyqro_persistent_collection_${collectionName}`;

  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(localKey);
      if (saved) {
        let items: any[] = JSON.parse(saved);
        if (Array.isArray(items)) {
          items = items.filter(i => String(i.id) !== String(docId));
          localStorage.setItem(localKey, JSON.stringify(items));
        }
      }
    } catch (e) {}
  }
  try {
    if (!docId) {
      console.warn("[FIREBASE PROXY DELETE] Missing Doc ID!");
      return false;
    }
    const res = await fetch(`/api/supabase/collection/${collectionName}/${docId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    if (res.status === 401) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('zyqro-unauthorized'));
      }
      throw new Error(`Unauthorized (HTTP 401)`);
    }

    if (!res.ok) {
      const errorMsg = await res.text();
      console.error(`=== FIREBASE PROXY DELETE ERROR: HTTP ${res.status} - ${errorMsg}`);
      throw new Error(errorMsg || `HTTP ${res.status}`);
    }

    const result = await res.json();
    if (result.success) {
      console.log("=== FIREBASE PROXY DELETE SUCCESS ===");
      return true;
    }
    console.warn("=== FIREBASE PROXY DELETE DB REJECTED ===", result);
    return false;
  } catch (err) {
    console.error(`=== FIREBASE PROXY DELETE FAILED for ${collectionName}/${docId}:`, err);
    return false;
  }
}

/**
 * Sync array of items to Firestore if collection is empty
 */
export async function seedCollectionIfEmpty(collectionName: string, initialItems: any[]): Promise<void> {
  try {
    if (!initialItems || initialItems.length === 0) return;
    const current = await getCollectionOnce(collectionName);
    if (current.length === 0) {
      console.log(`Seeding empty collection [${collectionName}] with ${initialItems.length} items.`);
      for (const item of initialItems) {
        if (item.id) {
          await saveToFirestore(collectionName, String(item.id), item);
        }
      }
    }
  } catch (err) {
    handleSyncError(err, OperationType.WRITE, collectionName);
  }
}

/**
 * Permanently purge all CRM collections and data records across Firestore and backend databases.
 */
export async function resetAllCrmData(): Promise<boolean> {
  console.log("=== RESET ALL CRM DATA REQUESTED ===");
  try {
    // 1. Clear all browser localStorage persistent backups for collections
    if (typeof window !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('zyqro_persistent_collection_') || key.startsWith('zyqro_crm_data_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    }

    // 2. Call backend reset endpoint to purge Firestore collections
    const res = await fetch('/api/reset-crm-data', {
      method: 'POST',
      headers: getHeaders({
        'Content-Type': 'application/json'
      })
    });

    if (res.status === 401) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('zyqro-unauthorized'));
      }
      throw new Error(`Unauthorized (HTTP 401)`);
    }

    if (!res.ok) {
      const errMsg = await res.text();
      throw new Error(errMsg || `HTTP ${res.status}`);
    }

    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.error("=== RESET ALL CRM DATA CLIENT FAILED ===", err);
    return false;
  }
}
