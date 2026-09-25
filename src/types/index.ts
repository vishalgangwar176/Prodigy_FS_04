export type RoomType = 'channel' | 'direct';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  statusText?: string;
  isOnline: boolean;
  lastSeen: string; // ISO string
  createdAt?: string;
}

export interface Attachment {
  name: string;
  url: string;
  type: string; // mime type
  size: number;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  attachment?: Attachment;
  readBy: string[]; // array of userIds
  createdAt: string; // ISO string
  pending?: boolean;
}

export interface Room {
  id: string;
  type: RoomType;
  name: string;
  description?: string;
  icon?: string;
  createdBy: string;
  members: string[]; // user UIDs
  otherUser?: UserProfile; // populated for direct chats
  createdAt: string;
  updatedAt: string;
  lastMessageSnippet?: string;
  lastMessageAt?: string;
  lastMessageSenderId?: string;
}

export interface TypingIndicatorInfo {
  userId: string;
  displayName: string;
  timestamp: number;
}

export interface FirebaseCustomConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}
