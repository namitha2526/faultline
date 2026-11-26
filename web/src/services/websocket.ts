import { LiveStreamEvent } from '../types/api';

type Listener = (event: LiveStreamEvent) => void;

class WebSocketClient {
  private socket: WebSocket | null = null;
  private listeners: Set<Listener> = new Set();
  private reconnectTimeout: number | null = null;
  private isConnected: boolean = false;

  public connect() {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use window.location.host so Vite proxy passes it through to :8000
    const wsUrl = `${protocol}//${window.location.host}/ws/feed`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnected = true;
        console.log('[WebSocket] Connected to live error feed:', wsUrl);
      };

      this.socket.onmessage = (messageEvent) => {
        try {
          const parsed = JSON.parse(messageEvent.data);
          this.listeners.forEach((listener) => listener(parsed));
        } catch (e) {
          // Non-JSON ping/pong
        }
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        this.scheduleReconnect();
      };

      this.socket.onerror = () => {
        this.isConnected = false;
        if (this.socket) this.socket.close();
      };
    } catch (err) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) return;
    this.reconnectTimeout = window.setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, 2000);
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    this.connect();
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getStatus(): boolean {
    return this.isConnected;
  }
}

export const wsClient = new WebSocketClient();
