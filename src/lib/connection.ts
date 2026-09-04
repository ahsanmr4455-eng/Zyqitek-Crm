/**
 * Centralized ConnectionManager Utility
 * Handles WebSocket lifecycle, silent connection drop cleanup, and error suppression.
 */

export class ConnectionManager {
  private static instance: ConnectionManager;
  private activeSockets: Set<WebSocket> = new Set();
  private isInitialized = false;

  private constructor() {
    this.setupGlobalSuppression();
  }

  public static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  /**
   * Registers a WebSocket instance for tracking and automatic clean shutdown.
   */
  public registerSocket(ws: WebSocket): void {
    this.activeSockets.add(ws);

    // Attach error listener to prevent unhandled error events
    ws.addEventListener('error', (event) => {
      console.warn('[ConnectionManager] Non-fatal WebSocket error intercepted:', event);
    });

    ws.addEventListener('close', () => {
      this.activeSockets.delete(ws);
    });
  }

  /**
   * Gracefully closes a specific socket.
   */
  public closeSocket(ws: WebSocket, code = 1000, reason = 'Normal closure'): void {
    try {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close(code, reason);
      }
    } catch (err) {
      console.warn('[ConnectionManager] Error while closing WebSocket:', err);
    } finally {
      this.activeSockets.delete(ws);
    }
  }

  /**
   * Gracefully closes all active WebSockets managed by this manager.
   */
  public cleanupAll(): void {
    this.activeSockets.forEach((ws) => {
      this.closeSocket(ws, 1000, 'App teardown cleanup');
    });
    this.activeSockets.clear();
  }

  /**
   * Utility to check whether a given error string, object, or event is WebSocket-related.
   */
  public static isWebSocketError(error: unknown): boolean {
    if (!error) return false;
    const errString = String(
      typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : error
    ).toLowerCase();

    const stackString = String(
      typeof error === 'object' && error !== null && 'stack' in error
        ? (error as { stack: string }).stack
        : ''
    ).toLowerCase();

    const patterns = [
      'websocket',
      'ws://',
      'wss://',
      'vite',
      'hmr',
      'connection closed',
      'closed without opened',
      'failed to connect to websocket',
      'ws connection',
      'socket',
      'cannot set property fetch',
      'fetch of #<window>'
    ];

    return patterns.some((p) => errString.includes(p) || stackString.includes(p));
  }

  /**
   * Installs window event listeners to silently absorb unhandled WebSocket promises and unload cleanup.
   */
  private setupGlobalSuppression(): void {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // Teardown sockets before page unload/refresh
    window.addEventListener('beforeunload', () => {
      this.cleanupAll();
    });

    // Suppress unhandled rejections from WS disconnects
    window.addEventListener('unhandledrejection', (event) => {
      if (ConnectionManager.isWebSocketError(event.reason)) {
        console.warn('[ConnectionManager] Suppressed unhandled WebSocket promise rejection:', event.reason);
        event.preventDefault();
        event.stopPropagation();
      }
    });
  }
}

export const connectionManager = ConnectionManager.getInstance();
