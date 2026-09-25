import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { isFirebaseConfigured } from '../lib/firebase';
import {
  createRoomInFirestore,
  sendMessageToFirestore,
  subscribeToRoomMessages,
  subscribeToRooms,
  uploadChatFile,
} from '../lib/firebaseService';
import { localRealtimeEngine } from '../lib/localRealtimeEngine';
import { playNotificationSound } from '../lib/utils';
import { Attachment, Message, Room, TypingIndicatorInfo, UserProfile } from '../types';
import { useAuth } from './AuthContext';

interface ToastNotification {
  id: string;
  roomName: string;
  senderName: string;
  text: string;
  roomId: string;
}

interface ChatContextType {
  rooms: Room[];
  activeRoomId: string;
  activeRoom: Room | undefined;
  messages: Message[];
  loadingMessages: boolean;
  hasMoreOlderMessages: boolean;
  loadEarlierMessages: () => void;
  unreadCounts: Record<string, number>;
  typingUsers: TypingIndicatorInfo[];
  onlineUsers: Record<string, boolean>;
  setActiveRoomId: (id: string) => void;
  sendMessage: (text: string, file?: File | null) => Promise<void>;
  sendTyping: (isTyping: boolean) => void;
  createChannel: (name: string, description: string, icon?: string) => Promise<string>;
  startDirectMessage: (otherUser: UserProfile) => Promise<string>;
  toastNotification: ToastNotification | null;
  dismissToast: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  requestDesktopNotificationPermission: () => Promise<boolean>;
  desktopNotificationsEnabled: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const UNREAD_STORAGE_KEY = 'pulsechat_unread_counts_v2';
const SOUND_SETTING_KEY = 'pulsechat_sound_enabled';

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, allUsers } = useAuth();

  const [rooms, setRooms] = useState<Room[]>(() => localRealtimeEngine.getRooms());
  const [activeRoomId, setActiveRoomIdState] = useState<string>('room_general');
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [visibleMessageCount, setVisibleMessageCount] = useState<number>(30);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [typingMap, setTypingMap] = useState<Record<string, Record<string, TypingIndicatorInfo>>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem(UNREAD_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [toastNotification, setToastNotification] = useState<ToastNotification | null>(null);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    return localStorage.getItem(SOUND_SETTING_KEY) !== 'false';
  });
  const [desktopNotificationsEnabled, setDesktopNotificationsEnabled] = useState<boolean>(() => {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  });

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set sound enabled & persist
  const setSoundEnabled = (val: boolean) => {
    setSoundEnabledState(val);
    localStorage.setItem(SOUND_SETTING_KEY, String(val));
  };

  // Request desktop notification permission
  const requestDesktopNotificationPermission = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    try {
      const perm = await Notification.requestPermission();
      const granted = perm === 'granted';
      setDesktopNotificationsEnabled(granted);
      return granted;
    } catch {
      return false;
    }
  };

  // Keep unread counts persisted
  useEffect(() => {
    localStorage.setItem(UNREAD_STORAGE_KEY, JSON.stringify(unreadCounts));
  }, [unreadCounts]);

  // Synchronize rooms from Local Engine or Firebase
  useEffect(() => {
    if (!currentUser) return;

    localRealtimeEngine.setIdentity(currentUser.uid);

    if (isFirebaseConfigured()) {
      const unsub = subscribeToRooms(currentUser.uid, (fbRooms) => {
        setRooms(fbRooms);
      });
      return () => unsub();
    } else {
      localRealtimeEngine.fetchRooms().then((r) => {
        if (r && r.length > 0) setRooms(r);
      });
    }
  }, [currentUser]);

  // Handle active room messages subscription
  useEffect(() => {
    if (!activeRoomId) return;
    setLoadingMessages(true);

    // Reset visible count when switching rooms
    setVisibleMessageCount(30);

    // Clear unreads for active room
    setUnreadCounts((prev) => {
      if (!prev[activeRoomId]) return prev;
      const copy = { ...prev };
      delete copy[activeRoomId];
      return copy;
    });

    if (currentUser) {
      localRealtimeEngine.markMessagesRead(activeRoomId, currentUser.uid);
    }

    // Join room on WebSocket server so live broadcasts are routed to this client
    localRealtimeEngine.joinRoom(activeRoomId, currentUser?.uid);

    if (isFirebaseConfigured()) {
      const unsub = subscribeToRoomMessages(activeRoomId, (msgs) => {
        console.log(`[PulseChat Firestore] 📥 onSnapshot received ${msgs.length} messages for room [${activeRoomId}]`);
        setAllMessages(msgs);
        setLoadingMessages(false);
      });
      return () => {
        unsub();
        localRealtimeEngine.leaveRoom(activeRoomId);
      };
    } else {
      localRealtimeEngine.fetchMessages(activeRoomId).then((msgs) => {
        console.log(`[PulseChat Realtime] 📥 Loaded initial ${msgs.length} messages for room [${activeRoomId}]`);
        setAllMessages(msgs);
        setLoadingMessages(false);
      });
      return () => {
        localRealtimeEngine.leaveRoom(activeRoomId);
      };
    }
  }, [activeRoomId, currentUser?.uid]);

  // Subscribe to real-time events from local engine / WebSocket
  useEffect(() => {
    const unsub = localRealtimeEngine.subscribe((event) => {
      switch (event.type) {
        case 'NEW_MESSAGE': {
          const { roomId, message } = event;
          console.log(`[PulseChat UI] 📨 Real-time message arrived in room [${roomId}]:`, message.text || message.attachment?.name, message);

          // If currently open room, append immediately
          if (roomId === activeRoomId) {
            setAllMessages((prev) => {
              if (prev.some((m) => m.id === message.id)) return prev;
              return [...prev, message];
            });

            // Mark as read if from someone else
            if (currentUser && message.senderId !== currentUser.uid) {
              localRealtimeEngine.markMessagesRead(roomId, currentUser.uid);
            }
          } else {
            // Received in background room: increment unread count & show toast/chime
            if (currentUser && message.senderId !== currentUser.uid) {
              setUnreadCounts((prev) => ({
                ...prev,
                [roomId]: (prev[roomId] || 0) + 1,
              }));

              if (soundEnabled) {
                playNotificationSound();
              }

              // Show in-app notification toast
              const sender = allUsers.find((u) => u.uid === message.senderId)?.displayName || message.senderName;
              const targetRoom = rooms.find((r) => r.id === roomId);
              const roomName = targetRoom ? (targetRoom.type === 'channel' ? `#${targetRoom.name}` : sender) : 'New Message';

              setToastNotification({
                id: message.id,
                roomName,
                senderName: sender,
                text: message.attachment ? `Sent an attachment: ${message.attachment.name}` : message.text,
                roomId,
              });

              // Optional Desktop push notification
              if (desktopNotificationsEnabled && document.hidden) {
                try {
                  new Notification(`PulseChat: ${roomName}`, {
                    body: `${sender}: ${message.text || 'Sent an attachment'}`,
                    icon: message.senderAvatar || '/vite.svg',
                  });
                } catch {
                  // Push fallback
                }
              }
            }
          }

          // Update room snippet and sort rooms list to bring latest conversation to top
          setRooms((prevRooms) => {
            const copy = [...prevRooms];
            const targetRoom = copy.find((r) => r.id === roomId);
            if (targetRoom) {
              targetRoom.lastMessageSnippet = message.attachment
                ? `[Attachment: ${message.attachment.name}]`
                : message.text;
              targetRoom.lastMessageSenderId = message.senderId;
              targetRoom.lastMessageAt = message.createdAt;
              targetRoom.updatedAt = message.createdAt;
              copy.sort(
                (a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
              );
              return copy;
            } else {
              // Might be newly created direct room, re-fetch from engine
              localRealtimeEngine.fetchRooms().then((r) => {
                if (r && r.length > 0) setRooms(r);
              });
              return prevRooms;
            }
          });
          break;
        }

        case 'TYPING': {
          setTypingMap((prev) => {
            const roomTyping = { ...(prev[event.roomId] || {}) };
            if (event.isTyping) {
              roomTyping[event.userId] = {
                userId: event.userId,
                displayName: event.displayName,
                timestamp: Date.now(),
              };
            } else {
              delete roomTyping[event.userId];
            }
            return { ...prev, [event.roomId]: roomTyping };
          });
          break;
        }

        case 'ROOM_CREATED': {
          const { room } = event;
          setRooms((prev) => {
            if (prev.some((r) => r.id === room.id)) return prev;
            return [room, ...prev];
          });
          localRealtimeEngine.cacheRoomLocally(room);
          break;
        }

        case 'MESSAGES_READ': {
          if (event.roomId === activeRoomId) {
            setAllMessages((prev) =>
              prev.map((msg) =>
                msg.readBy.includes(event.userId) ? msg : { ...msg, readBy: [...msg.readBy, event.userId] }
              )
            );
          }
          break;
        }
      }
    });

    return unsub;
  }, [activeRoomId, currentUser, soundEnabled, desktopNotificationsEnabled, rooms, allUsers]);

  // Clean stale typing indicators every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setTypingMap((prev) => {
        let hasChanges = false;
        const newMap = { ...prev };

        for (const roomId in newMap) {
          const roomTyping = { ...newMap[roomId] };
          for (const uid in roomTyping) {
            if (now - roomTyping[uid].timestamp > 4000) {
              delete roomTyping[uid];
              hasChanges = true;
            }
          }
          newMap[roomId] = roomTyping;
        }

        return hasChanges ? newMap : prev;
      });
    }, 2000);

    return () => clearInterval(timer);
  }, []);

  const setActiveRoomId = (id: string) => {
    setActiveRoomIdState(id);
    setUnreadCounts((prev) => {
      if (!prev[id]) return prev;
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  // Populated active room object (with otherUser if direct)
  const activeRoom = React.useMemo(() => {
    const r = rooms.find((x) => x.id === activeRoomId);
    if (!r) return undefined;
    if (r.type === 'direct' && currentUser) {
      const otherUid = r.members.find((m) => m !== currentUser.uid) || r.members[0];
      const otherUser = allUsers.find((u) => u.uid === otherUid);
      return { ...r, otherUser };
    }
    return r;
  }, [rooms, activeRoomId, currentUser, allUsers]);

  // Paginated visible messages
  const visibleMessages = React.useMemo(() => {
    const startIndex = Math.max(0, allMessages.length - visibleMessageCount);
    return allMessages.slice(startIndex);
  }, [allMessages, visibleMessageCount]);

  const hasMoreOlderMessages = allMessages.length > visibleMessageCount;

  const loadEarlierMessages = () => {
    setVisibleMessageCount((prev) => Math.min(allMessages.length, prev + 25));
  };

  // Send message implementation
  const sendMessage = async (text: string, file?: File | null) => {
    if (!currentUser || (!text.trim() && !file)) return;

    let attachment: Attachment | undefined = undefined;

    if (file) {
      const url = await uploadChatFile(file, activeRoomId);
      attachment = {
        name: file.name,
        url,
        type: file.type,
        size: file.size,
      };
    }

    const messageData: Omit<Message, 'id'> = {
      roomId: activeRoomId,
      senderId: currentUser.uid,
      senderName: currentUser.displayName,
      senderAvatar: currentUser.photoURL,
      text: text.trim(),
      attachment,
      readBy: [currentUser.uid],
      createdAt: new Date().toISOString(),
    };

    const fullMessage: Message = {
      ...messageData,
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    };

    if (isFirebaseConfigured()) {
      sendMessageToFirestore(messageData).catch(console.warn);
    }

    await localRealtimeEngine.addMessage(fullMessage, activeRoom);

    // Clear typing immediately on send
    sendTyping(false);
  };

  // Send typing event
  const sendTyping = (isTyping: boolean) => {
    if (!currentUser || !activeRoomId) return;

    localRealtimeEngine.emitTyping(activeRoomId, currentUser.uid, currentUser.displayName, isTyping);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        localRealtimeEngine.emitTyping(activeRoomId, currentUser.uid, currentUser.displayName, false);
      }, 3000);
    }
  };

  // Create Channel
  const createChannel = async (name: string, description: string, icon = 'Hash'): Promise<string> => {
    if (!currentUser) throw new Error('Must be signed in to create a channel');

    const cleanName = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '');
    const roomId = 'room_' + cleanName + '_' + Date.now().toString(36).substr(4, 4);

    const newRoom: Room = {
      id: roomId,
      type: 'channel',
      name: cleanName,
      description: description.trim(),
      icon,
      createdBy: currentUser.uid,
      members: [currentUser.uid],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastMessageSnippet: 'Channel created. Say hello!',
      lastMessageAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured()) {
      createRoomInFirestore(newRoom).catch(console.warn);
    }
    await localRealtimeEngine.createRoom(newRoom);
    setRooms((prev) => (prev.some((r) => r.id === newRoom.id) ? prev : [newRoom, ...prev]));

    setActiveRoomId(roomId);
    return roomId;
  };

  // Start Direct Message conversation
  const startDirectMessage = async (otherUser: UserProfile): Promise<string> => {
    if (!currentUser) throw new Error('Must be signed in');

    // Check if DM already exists between these two users
    const existing = rooms.find(
      (r) =>
        r.type === 'direct' &&
        r.members.includes(currentUser.uid) &&
        r.members.includes(otherUser.uid)
    );

    if (existing) {
      setActiveRoomId(existing.id);
      return existing.id;
    }

    // Otherwise create new direct room
    const roomId = 'dm_' + [currentUser.uid, otherUser.uid].sort().join('_');
    const newRoom: Room = {
      id: roomId,
      type: 'direct',
      name: otherUser.displayName,
      description: `Direct conversation with ${otherUser.displayName}`,
      createdBy: currentUser.uid,
      members: [currentUser.uid, otherUser.uid],
      otherUser,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastMessageSnippet: 'Direct chat opened.',
      lastMessageAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured()) {
      createRoomInFirestore(newRoom).catch(console.warn);
    }
    await localRealtimeEngine.createRoom(newRoom);
    setRooms((prev) => (prev.some((r) => r.id === newRoom.id) ? prev : [newRoom, ...prev]));

    setActiveRoomId(roomId);
    return roomId;
  };

  // Active room typing users
  const activeTypingUsers = React.useMemo(() => {
    if (!activeRoomId || !currentUser) return [];
    const roomTyping = typingMap[activeRoomId] || {};
    return Object.values(roomTyping).filter((t) => t.userId !== currentUser.uid);
  }, [typingMap, activeRoomId, currentUser]);

  // Online users map
  const onlineUsers = React.useMemo(() => {
    const map: Record<string, boolean> = {};
    allUsers.forEach((u) => {
      map[u.uid] = !!u.isOnline;
    });
    return map;
  }, [allUsers]);

  const dismissToast = () => setToastNotification(null);

  return (
    <ChatContext.Provider
      value={{
        rooms,
        activeRoomId,
        activeRoom,
        messages: visibleMessages,
        loadingMessages,
        hasMoreOlderMessages,
        loadEarlierMessages,
        unreadCounts,
        typingUsers: activeTypingUsers,
        onlineUsers,
        setActiveRoomId,
        sendMessage,
        sendTyping,
        createChannel,
        startDirectMessage,
        toastNotification,
        dismissToast,
        soundEnabled,
        setSoundEnabled,
        requestDesktopNotificationPermission,
        desktopNotificationsEnabled,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
