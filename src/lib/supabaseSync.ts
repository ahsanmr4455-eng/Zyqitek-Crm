/**
 * Supabase client-side synchronizer.
 * Communicates with secure server-side Express API endpoints to persist CRM collections in Supabase PostgreSQL.
 * Transparently falls back to local/memory states if server-side database connectivity is offline.
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
    console.warn(`[SUPABASE SYNC WARNING] Operation: ${operationType} on ${path}: Unauthorized (session expired or invalid).`);
  } else {
    console.error(`[SUPABASE SYNC ERROR] Operation: ${operationType} on ${path}:`, error);
  }
  return {
    error: errMsg,
    operationType,
    path
  };
}

/**
 * Test Supabase connection on startup
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
    }
    return res.ok;
  } catch (error) {
    console.warn("Supabase health check returned warning (CRM may be operating in fallback mode):", error);
    return false;
  }
}

/**
 * Subscribe to real-time changes in a collection.
 * Since real-time sync is secured behind backend endpoints and RLS, we simulate live updates using interval-based polling.
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
      timerId = setTimeout(poll, 10000); // Poll every 10s for real-time synchronization simulation
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
    if (!res.ok) {
      throw new Error(`Failed to fetch collection ${collectionName}: HTTP ${res.status}`);
    }
    const data = await res.json();
    return (data.items || []) as T[];
  } catch (err) {
    handleSyncError(err, OperationType.GET, collectionName);
    return [];
  }
}

/**
 * Save or update a document in Supabase
 */
export async function saveToFirestore(collectionName: string, docId: string, data: any): Promise<boolean> {
  try {
    const safeId = String(docId || `doc-${Date.now()}`);
    // Clean undefined values for JSON serialization
    const cleanData = JSON.parse(JSON.stringify(data));
    
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
      throw new Error(`Failed to save to Supabase: HTTP ${res.status}`);
    }

    const result = await res.json();
    return !!result.success;
  } catch (err) {
    handleSyncError(err, OperationType.WRITE, `${collectionName}/${docId}`);
    return false;
  }
}

/**
 * Delete a document from Supabase securely via the Express server.
 * Returns true if the server/database confirms successful deletion.
 */
export async function deleteFromFirestore(collectionName: string, docId: string): Promise<boolean> {
  console.log("=== SUPABASE DELETE START ===");
  console.log("Collection:", collectionName);
  console.log("Doc ID:", docId);
  try {
    if (!docId) return false;
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
      throw new Error(errorMsg || `HTTP ${res.status}`);
    }

    const result = await res.json();
    if (result.success) {
      console.log("=== SUPABASE DELETE SUCCESS ===");
      return true;
    }
    return false;
  } catch (err) {
    console.error(`=== SUPABASE DELETE FAILED for ${collectionName}/${docId}:`, err);
    return false;
  }
}

/**
 * Sync array of items to Supabase if collection is empty
 */
export async function seedCollectionIfEmpty(collectionName: string, initialItems: any[]): Promise<void> {
  try {
    if (!initialItems || initialItems.length === 0) return;
    const current = await getCollectionOnce(collectionName);
    if (current.length === 0) {
      console.log(`Seeding empty Supabase collection [${collectionName}] with ${initialItems.length} items.`);
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
