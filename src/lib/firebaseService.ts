import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { Message, Room, UserProfile } from '../types';
import { auth, db, isFirebaseConfigured, storage } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ----------------- Firestore Collections & Methods -----------------

export async function syncUserProfile(profile: UserProfile): Promise<void> {
  if (!isFirebaseConfigured() || !db) return;
  const path = `users/${profile.uid}`;
  try {
    const userDocRef = doc(db, 'users', profile.uid);
    await setDoc(userDocRef, profile, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchUsersFromFirestore(): Promise<UserProfile[]> {
  if (!isFirebaseConfigured() || !db) return [];
  const path = 'users';
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map((d) => d.data() as UserProfile);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export function subscribeToRooms(
  userId: string,
  onRoomsUpdate: (rooms: Room[]) => void,
  onError?: (err: unknown) => void
): () => void {
  if (!isFirebaseConfigured() || !db) return () => {};

  const path = 'rooms';
  try {
    const roomsQuery = query(collection(db, 'rooms'), orderBy('updatedAt', 'desc'));
    return onSnapshot(
      roomsQuery,
      (snapshot) => {
        const rooms: Room[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Room;
          // Filter to public channel or rooms where user is member
          if (data.type === 'channel' || (Array.isArray(data.members) && data.members.includes(userId))) {
            rooms.push({ ...data, id: docSnap.id });
          }
        });
        onRoomsUpdate(rooms);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export function subscribeToRoomMessages(
  roomId: string,
  onMessagesUpdate: (messages: Message[]) => void,
  onError?: (err: unknown) => void
): () => void {
  if (!isFirebaseConfigured() || !db) return () => {};

  const path = `rooms/${roomId}/messages`;
  try {
    const messagesQuery = query(collection(db, 'rooms', roomId, 'messages'), orderBy('createdAt', 'asc'));
    return onSnapshot(
      messagesQuery,
      (snapshot) => {
        const msgs: Message[] = [];
        snapshot.forEach((docSnap) => {
          msgs.push({ ...docSnap.data(), id: docSnap.id } as Message);
        });
        onMessagesUpdate(msgs);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function sendMessageToFirestore(message: Omit<Message, 'id'>): Promise<string> {
  if (!isFirebaseConfigured() || !db) return '';
  const path = `rooms/${message.roomId}/messages`;
  try {
    const docRef = await addDoc(collection(db, 'rooms', message.roomId, 'messages'), message);

    // Update parent room's last message snippet
    const roomRef = doc(db, 'rooms', message.roomId);
    await updateDoc(roomRef, {
      lastMessageSnippet: message.attachment ? `[Attachment: ${message.attachment.name}]` : message.text,
      lastMessageAt: message.createdAt,
      lastMessageSenderId: message.senderId,
      updatedAt: message.createdAt,
    });

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function createRoomInFirestore(room: Room): Promise<string> {
  if (!isFirebaseConfigured() || !db) return room.id;
  const path = `rooms/${room.id}`;
  try {
    await setDoc(doc(db, 'rooms', room.id), room);
    return room.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function uploadChatFile(file: File, roomId: string): Promise<string> {
  if (!isFirebaseConfigured() || !storage) {
    // If Firebase storage is not configured, create a data URL for instant in-browser delivery
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  const fileRef = ref(storage, `chat_uploads/${roomId}/${Date.now()}_${file.name}`);
  const snap = await uploadBytes(fileRef, file);
  return await getDownloadURL(snap.ref);
}
