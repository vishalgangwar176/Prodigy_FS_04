import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocket, WebSocketServer } from 'ws';
import { INITIAL_DEMO_USERS, INITIAL_MESSAGES, INITIAL_ROOMS } from './src/lib/demoData.ts';
import { Message, Room, UserProfile } from './src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '15mb' }));

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

// --- In-Memory Authoritative Server State ---
let users: UserProfile[] = [...INITIAL_DEMO_USERS];
let rooms: Room[] = [...INITIAL_ROOMS];
const messagesByRoom: Map<string, Message[]> = new Map();

// Initialize messages from demo data
for (const [roomId, msgs] of Object.entries(INITIAL_MESSAGES)) {
  messagesByRoom.set(roomId, [...msgs]);
}

interface ExtendedWebSocket extends WebSocket {
  userId?: string;
  joinedRooms: Set<string>;
  isAlive: boolean;
}

// WebSocket Connection Management
wss.on('connection', (ws: ExtendedWebSocket) => {
  ws.joinedRooms = new Set();
  ws.isAlive = true;

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (data: string) => {
    try {
      const payload = JSON.parse(data.toString());
      handleWebSocketMessage(ws, payload);
    } catch (err) {
      console.error('[WS Error] Failed to parse message:', err);
    }
  });

  ws.on('close', () => {
    if (ws.userId) {
      // If no other connections for this user, mark as offline after a grace period
      const hasOtherSockets = Array.from(wss.clients).some(
        (c) => (c as ExtendedWebSocket).userId === ws.userId && c !== ws && c.readyState === WebSocket.OPEN
      );
      if (!hasOtherSockets) {
        const u = users.find((x) => x.uid === ws.userId);
        if (u) {
          u.isOnline = false;
          u.lastSeen = new Date().toISOString();
          broadcast({
            type: 'PRESENCE',
            userId: u.uid,
            isOnline: false,
            lastSeen: u.lastSeen,
          });
        }
      }
    }
  });
});

// Periodic ping to keep connections alive
const pingInterval = setInterval(() => {
  wss.clients.forEach((client) => {
    const ws = client as ExtendedWebSocket;
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(pingInterval);
});

// Broadcast helper: send to all connected clients
function broadcast(event: any) {
  const json = JSON.stringify(event);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  });
}

function handleWebSocketMessage(ws: ExtendedWebSocket, payload: any) {
  switch (payload.type) {
    case 'IDENTIFY': {
      ws.userId = payload.userId;
      if (payload.userId) {
        const u = users.find((x) => x.uid === payload.userId);
        if (u) {
          u.isOnline = true;
          u.lastSeen = new Date().toISOString();
          broadcast({
            type: 'PRESENCE',
            userId: u.uid,
            isOnline: true,
            lastSeen: u.lastSeen,
          });
        }
      }
      break;
    }

    case 'JOIN_ROOM': {
      const { roomId, userId } = payload;
      if (roomId) {
        ws.joinedRooms.add(roomId);
        if (userId) ws.userId = userId;
        console.log(`[WS Server] Client (${ws.userId || 'anon'}) joined room: ${roomId}`);
        ws.send(JSON.stringify({ type: 'ROOM_JOINED', roomId }));
      }
      break;
    }

    case 'LEAVE_ROOM': {
      const { roomId } = payload;
      if (roomId) {
        ws.joinedRooms.delete(roomId);
      }
      break;
    }

    case 'CREATE_ROOM': {
      const { room } = payload;
      if (room && room.id) {
        const exists = rooms.find((r) => r.id === room.id);
        if (!exists) {
          rooms.unshift(room);
          if (!messagesByRoom.has(room.id)) {
            messagesByRoom.set(room.id, []);
          }
          console.log(`[WS Server] 🏠 Room created & broadcast to all clients: ${room.name} (${room.id})`);
          broadcast({ type: 'ROOM_CREATED', room });
        }
      }
      break;
    }

    case 'SEND_MESSAGE': {
      const { message, room } = payload;
      if (!message || !message.roomId) return;

      const roomId = message.roomId;
      const roomMessages = messagesByRoom.get(roomId) || [];

      // Avoid duplicates
      if (!roomMessages.some((m) => m.id === message.id)) {
        roomMessages.push(message);
        messagesByRoom.set(roomId, roomMessages);
      }

      // If room wasn't in rooms list yet (e.g. freshly created DM)
      let targetRoom: Room | undefined = rooms.find((r) => r.id === roomId);
      if (!targetRoom && room) {
        const newRoom = room as Room;
        targetRoom = newRoom;
        rooms.unshift(newRoom);
        broadcast({ type: 'ROOM_CREATED', room: newRoom });
      }

      // Update room last message snippet and sort to top
      if (targetRoom) {
        targetRoom.lastMessageSnippet = message.attachment
          ? `[Attachment: ${message.attachment.name}]`
          : message.text;
        targetRoom.lastMessageSenderId = message.senderId;
        targetRoom.lastMessageAt = message.createdAt;
        targetRoom.updatedAt = message.createdAt;
        rooms.sort(
          (a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
        );
      }

      console.log(`[WS Server] 📨 Broadcasting new message in room ${roomId} to all connected clients: "${message.text || message.attachment?.name}"`);
      broadcast({ type: 'NEW_MESSAGE', roomId, message });
      break;
    }

    case 'TYPING': {
      const { roomId, userId, displayName, isTyping } = payload;
      if (roomId && userId) {
        broadcast({ type: 'TYPING', roomId, userId, displayName, isTyping });
      }
      break;
    }

    case 'PRESENCE': {
      const { userId, isOnline, lastSeen } = payload;
      const u = users.find((x) => x.uid === userId);
      if (u) {
        u.isOnline = isOnline;
        u.lastSeen = lastSeen || new Date().toISOString();
        broadcast({ type: 'PRESENCE', userId, isOnline, lastSeen: u.lastSeen });
      }
      break;
    }

    case 'READ_MESSAGES': {
      const { roomId, userId } = payload;
      const roomMessages = messagesByRoom.get(roomId);
      if (roomMessages) {
        let changed = false;
        roomMessages.forEach((msg) => {
          if (!msg.readBy.includes(userId)) {
            msg.readBy.push(userId);
            changed = true;
          }
        });
        if (changed) {
          broadcast({ type: 'MESSAGES_READ', roomId, userId });
        }
      }
      break;
    }
  }
}

// Upgrade handling on /ws
server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
  if (url.pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
});

// --- REST API Endpoints ---
app.get('/api/users', (req, res) => {
  res.json(users);
});

app.post('/api/users', (req, res) => {
  const user = req.body as UserProfile;
  if (!user || !user.uid) {
    return res.status(400).json({ error: 'Invalid user payload' });
  }
  const idx = users.findIndex((u) => u.uid === user.uid);
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...user };
  } else {
    users.push(user);
  }
  broadcast({
    type: 'PRESENCE',
    userId: user.uid,
    isOnline: user.isOnline,
    lastSeen: user.lastSeen,
  });
  res.json(user);
});

app.get('/api/rooms', (req, res) => {
  res.json(rooms);
});

app.post('/api/rooms', (req, res) => {
  const room = req.body as Room;
  if (!room || !room.id) {
    return res.status(400).json({ error: 'Invalid room payload' });
  }
  const exists = rooms.find((r) => r.id === room.id);
  if (!exists) {
    rooms.unshift(room);
    if (!messagesByRoom.has(room.id)) {
      messagesByRoom.set(room.id, []);
    }
    broadcast({ type: 'ROOM_CREATED', room });
  }
  res.json(room);
});

app.get('/api/rooms/:roomId/messages', (req, res) => {
  const roomId = req.params.roomId;
  const msgs = messagesByRoom.get(roomId) || [];
  res.json(msgs);
});

app.post('/api/rooms/:roomId/messages', (req, res) => {
  const roomId = req.params.roomId;
  const message = req.body as Message;
  if (!message || !message.id) {
    return res.status(400).json({ error: 'Invalid message payload' });
  }

  const roomMessages = messagesByRoom.get(roomId) || [];
  if (!roomMessages.some((m) => m.id === message.id)) {
    roomMessages.push(message);
    messagesByRoom.set(roomId, roomMessages);
  }

  const room = rooms.find((r) => r.id === roomId);
  if (room) {
    room.lastMessageSnippet = message.attachment
      ? `[Attachment: ${message.attachment.name}]`
      : message.text;
    room.lastMessageSenderId = message.senderId;
    room.lastMessageAt = message.createdAt;
    room.updatedAt = message.createdAt;
    rooms.sort(
      (a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
    );
  }

  broadcast({ type: 'NEW_MESSAGE', roomId, message });
  res.json(message);
});

// Vite Middleware integration for dev or static dist for prod
async function startServer() {
  const port = 3000;

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`[PulseChat Server] 🚀 Server running with WebSocket on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('[Server Error] Failed to start server:', err);
});
