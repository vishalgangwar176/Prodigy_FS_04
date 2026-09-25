import { Message, Room, UserProfile } from '../types';
import { INITIAL_DEMO_USERS, INITIAL_MESSAGES, INITIAL_ROOMS } from './demoData';

export type BusEvent =
  | { type: 'NEW_MESSAGE'; roomId: string; message: Message }
  | { type: 'TYPING'; roomId: string; userId: string; displayName: string; isTyping: boolean }
  | { type: 'PRESENCE'; userId: string; isOnline: boolean; lastSeen: string }
  | { type: 'ROOM_CREATED'; room: Room }
  | { type: 'MESSAGES_READ'; roomId: string; userId: string };

class RealtimeClientEngine {
  private ws: WebSocket | null = null;
  private listeners: Set<(event: BusEvent) => void> = new Set();
  private localChannel: BroadcastChannel | null = null;
  private currentUserId: string | null = null;
  private activeRoomId: string | null = null;
  private reconnectTimer: any = null;
  private isConnected: boolean = false;
  private sendQueue: string[] = [];

  constructor() {
    this.initBroadcastChannel();
    this.connectWebSocket();
  }

  private initBroadcastChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.localChannel = new BroadcastChannel('pulsechat_sync_bus');
        this.localChannel.onmessage = (ev: MessageEvent<BusEvent>) => {
          this.notify(ev.data, 'broadcast_channel');
        };
      } catch (err) {
        console.warn('BroadcastChannel fallback unavailable:', err);
      }
    }
  }

  public connectWebSocket() {
    if (typeof window === 'undefined') return;

    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    console.log(`[PulseChat Realtime] 🔌 Connecting to WebSocket: ${wsUrl}`);

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[PulseChat Realtime] ✅ WebSocket connected successfully.');
        this.isConnected = true;

        if (this.currentUserId) {
          this.sendWs({ type: 'IDENTIFY', userId: this.currentUserId });
        }
        if (this.activeRoomId) {
          this.sendWs({
            type: 'JOIN_ROOM',
            roomId: this.activeRoomId,
            userId: this.currentUserId,
          });
        }

        // Flush any queued payloads that were waiting for connection
        while (this.sendQueue.length > 0) {
          const queued = this.sendQueue.shift();
          if (queued && this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(queued);
          }
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'NEW_MESSAGE') {
            console.log(
              `[PulseChat Live Sync] 📨 RECEIVED MESSAGE event in room [${data.roomId}]:`,
              data.message?.text || data.message?.attachment?.name,
              data.message
            );
            // Cache locally so message persists even across reloads
            if (data.roomId && data.message) {
              const current = this.getMessages(data.roomId);
              if (!current.some((m) => m.id === data.message.id)) {
                current.push(data.message);
                localStorage.setItem(`pulsechat_local_messages_v2_${data.roomId}`, JSON.stringify(current));
              }
            }
          } else if (data.type === 'ROOM_CREATED') {
            console.log(`[PulseChat Live Sync] 🏠 Received new room created event:`, data.room?.name, data.room?.id);
            if (data.room) {
              this.cacheRoomLocally(data.room);
            }
          }
          this.notify(data, 'websocket');
        } catch (err) {
          console.error('[PulseChat Realtime] Error parsing WS message:', err);
        }
      };

      this.ws.onclose = () => {
        console.warn('[PulseChat Realtime] ⚠️ WebSocket disconnected. Reconnecting in 2s...');
        this.isConnected = false;
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.error('[PulseChat Realtime] ❌ WebSocket error:', err);
      };
    } catch (err) {
      console.error('[PulseChat Realtime] Failed to initialize WebSocket:', err);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connectWebSocket();
    }, 2000);
  }

  private sendWs(payload: any) {
    const json = JSON.stringify(payload);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(json);
    } else {
      this.sendQueue.push(json);
    }
  }

  private notify(event: BusEvent, source: string = 'internal') {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('[PulseChat Realtime] Listener error:', err);
      }
    });
  }

  public subscribe(listener: (event: BusEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public setIdentity(userId: string) {
    this.currentUserId = userId;
    this.sendWs({ type: 'IDENTIFY', userId });
  }

  public joinRoom(roomId: string, userId?: string) {
    this.activeRoomId = roomId;
    console.log(`[PulseChat Realtime] 🔄 Subscribing client to conversation: ${roomId}`);
    this.sendWs({
      type: 'JOIN_ROOM',
      roomId,
      userId: userId || this.currentUserId,
    });
  }

  public leaveRoom(roomId: string) {
    if (this.activeRoomId === roomId) {
      this.activeRoomId = null;
    }
    this.sendWs({ type: 'LEAVE_ROOM', roomId });
  }

  // --- REST / Local Persistence Methods ---

  public async fetchUsers(): Promise<UserProfile[]> {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const serverUsers: UserProfile[] = await res.json();
        const merged = [...serverUsers];
        INITIAL_DEMO_USERS.forEach((demoUser) => {
          const existing = merged.find((u) => u.uid === demoUser.uid);
          if (!existing) {
            merged.push(demoUser);
          }
        });
        localStorage.setItem('pulsechat_local_users_v2', JSON.stringify(merged));
        return merged;
      }
    } catch (err) {
      console.warn('[PulseChat Realtime] Failed to fetch users via API, using fallback:', err);
    }
    return this.getUsers();
  }

  public getUsers(): UserProfile[] {
    const raw = localStorage.getItem('pulsechat_local_users_v2');
    const existing: UserProfile[] = raw ? JSON.parse(raw) : [];
    const merged = [...existing];
    INITIAL_DEMO_USERS.forEach((demoUser) => {
      const idx = merged.findIndex((u) => u.uid === demoUser.uid);
      if (idx === -1) {
        merged.push(demoUser);
      } else {
        // Update name/status/photo if changed
        merged[idx] = { ...demoUser, ...merged[idx] };
      }
    });
    localStorage.setItem('pulsechat_local_users_v2', JSON.stringify(merged));
    return merged;
  }

  public async saveUser(user: UserProfile) {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.uid === user.uid);
    if (idx >= 0) users[idx] = { ...users[idx], ...user };
    else users.push(user);
    localStorage.setItem('pulsechat_local_users_v2', JSON.stringify(users));

    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
    } catch {}

    this.sendWs({
      type: 'PRESENCE',
      userId: user.uid,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
    });
  }

  public updatePresence(userId: string, isOnline: boolean) {
    const lastSeen = new Date().toISOString();
    this.sendWs({ type: 'PRESENCE', userId, isOnline, lastSeen });
  }

  public async fetchRooms(): Promise<Room[]> {
    try {
      const res = await fetch('/api/rooms');
      if (res.ok) {
        const rms: Room[] = await res.json();
        const merged = [...rms];
        INITIAL_ROOMS.forEach((initRoom) => {
          if (!merged.some((r) => r.id === initRoom.id)) {
            merged.push(initRoom);
          }
        });
        localStorage.setItem('pulsechat_local_rooms_v2', JSON.stringify(merged));
        return merged;
      }
    } catch {}
    return this.getRooms();
  }

  public getRooms(): Room[] {
    const raw = localStorage.getItem('pulsechat_local_rooms_v2');
    const existing: Room[] = raw ? JSON.parse(raw) : [];
    const merged = [...existing];
    INITIAL_ROOMS.forEach((initRoom) => {
      if (!merged.some((r) => r.id === initRoom.id)) {
        merged.push(initRoom);
      }
    });
    localStorage.setItem('pulsechat_local_rooms_v2', JSON.stringify(merged));
    return merged;
  }

  public cacheRoomLocally(room: Room) {
    const rooms = this.getRooms();
    const idx = rooms.findIndex((r) => r.id === room.id);
    if (idx >= 0) {
      rooms[idx] = { ...rooms[idx], ...room };
    } else {
      rooms.unshift(room);
    }
    localStorage.setItem('pulsechat_local_rooms_v2', JSON.stringify(rooms));
  }

  public async createRoom(room: Room): Promise<Room> {
    this.cacheRoomLocally(room);

    // Send via WebSocket to broadcast to all connected clients immediately
    this.sendWs({
      type: 'CREATE_ROOM',
      room,
    });

    try {
      await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(room),
      });
    } catch {}

    this.notify({ type: 'ROOM_CREATED', room });
    if (this.localChannel) {
      try {
        this.localChannel.postMessage({ type: 'ROOM_CREATED', room });
      } catch {}
    }
    return room;
  }

  public async fetchMessages(roomId: string): Promise<Message[]> {
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/messages`);
      if (res.ok) {
        const msgs = await res.json();
        localStorage.setItem(`pulsechat_local_messages_v2_${roomId}`, JSON.stringify(msgs));
        return msgs;
      }
    } catch {}
    const raw = localStorage.getItem(`pulsechat_local_messages_v2_${roomId}`);
    return raw ? JSON.parse(raw) : (INITIAL_MESSAGES[roomId] || []);
  }

  public getMessages(roomId: string): Message[] {
    const raw = localStorage.getItem(`pulsechat_local_messages_v2_${roomId}`);
    return raw ? JSON.parse(raw) : (INITIAL_MESSAGES[roomId] || []);
  }

  public async addMessage(message: Message, room?: Room): Promise<Message> {
    console.log(`[PulseChat Realtime] 🚀 SENDING MESSAGE to room [${message.roomId}]:`, message.text, message);

    // Update local storage cache immediately
    const messages = this.getMessages(message.roomId);
    if (!messages.some((m) => m.id === message.id)) {
      messages.push(message);
      localStorage.setItem(`pulsechat_local_messages_v2_${message.roomId}`, JSON.stringify(messages));
    }

    // Send via WebSocket for instant live broadcast to all connected clients
    this.sendWs({
      type: 'SEND_MESSAGE',
      message,
      room,
    });

    // Also persist via REST API
    try {
      await fetch(`/api/rooms/${encodeURIComponent(message.roomId)}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });
    } catch (err) {
      console.warn('[PulseChat Realtime] REST message backup warning:', err);
    }

    // Notify local listeners
    this.notify({
      type: 'NEW_MESSAGE',
      roomId: message.roomId,
      message,
    });

    if (this.localChannel) {
      try {
        this.localChannel.postMessage({
          type: 'NEW_MESSAGE',
          roomId: message.roomId,
          message,
        });
      } catch {}
    }

    return message;
  }

  public emitTyping(roomId: string, userId: string, displayName: string, isTyping: boolean) {
    this.sendWs({
      type: 'TYPING',
      roomId,
      userId,
      displayName,
      isTyping,
    });
  }

  public markMessagesRead(roomId: string, userId: string) {
    this.sendWs({
      type: 'READ_MESSAGES',
      roomId,
      userId,
    });
  }
}

export const localRealtimeEngine = new RealtimeClientEngine();
