import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile as updateFirebaseUserProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { INITIAL_DEMO_USERS } from '../lib/demoData';
import { auth, isFirebaseConfigured } from '../lib/firebase';
import { syncUserProfile } from '../lib/firebaseService';
import { localRealtimeEngine } from '../lib/localRealtimeEngine';
import { PRESET_AVATARS } from '../lib/utils';
import { UserProfile } from '../types';

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string, displayName: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginAsDemoUser: (uid: string) => void;
  logout: () => Promise<void>;
  updateProfileData: (data: { displayName?: string; photoURL?: string; statusText?: string }) => Promise<void>;
  allUsers: UserProfile[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_AUTH_USER_KEY = 'pulsechat_current_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => localRealtimeEngine.getUsers());

  // Listen to user directory updates from local engine
  useEffect(() => {
    const unsub = localRealtimeEngine.subscribe((event) => {
      if (event.type === 'PRESENCE') {
        setAllUsers(localRealtimeEngine.getUsers());
        setCurrentUser((prev) => {
          if (prev && prev.uid === event.userId) {
            return { ...prev, isOnline: event.isOnline, lastSeen: event.lastSeen };
          }
          return prev;
        });
      }
    });
    return unsub;
  }, []);

  // Initialize session
  useEffect(() => {
    if (isFirebaseConfigured() && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          const profile: UserProfile = {
            uid: fbUser.uid,
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            email: fbUser.email || '',
            photoURL: fbUser.photoURL || PRESET_AVATARS[0],
            statusText: 'Available',
            isOnline: true,
            lastSeen: new Date().toISOString(),
          };
          setCurrentUser(profile);
          localRealtimeEngine.saveUser(profile);
          syncUserProfile(profile).catch(console.warn);
        } else {
          // Check local stored session fallback
          loadLocalSession();
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      loadLocalSession();
      setLoading(false);
    }
  }, []);

  const loadLocalSession = async () => {
    try {
      const serverUsers = await localRealtimeEngine.fetchUsers();
      if (serverUsers && serverUsers.length > 0) {
        setAllUsers(serverUsers);
      }
      const stored = localStorage.getItem(LOCAL_AUTH_USER_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserProfile;
        parsed.isOnline = true;
        parsed.lastSeen = new Date().toISOString();
        setCurrentUser(parsed);
        localRealtimeEngine.setIdentity(parsed.uid);
        localRealtimeEngine.saveUser(parsed);
      } else {
        // Default to first demo user (Alex Chen) so application starts immediately interactive
        const defaultUser = INITIAL_DEMO_USERS[0];
        setCurrentUser(defaultUser);
        localStorage.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify(defaultUser));
        localRealtimeEngine.setIdentity(defaultUser.uid);
        localRealtimeEngine.saveUser(defaultUser);
      }
    } catch {
      setCurrentUser(INITIAL_DEMO_USERS[0]);
    }
  };

  // Heartbeat presence update every 45 seconds & beforeunload
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(() => {
      localRealtimeEngine.updatePresence(currentUser.uid, true);
    }, 45000);

    const handleBeforeUnload = () => {
      localRealtimeEngine.updatePresence(currentUser.uid, false);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentUser]);

  const loginWithEmail = async (email: string, pass: string) => {
    if (isFirebaseConfigured() && auth) {
      await signInWithEmailAndPassword(auth, email, pass);
    } else {
      // Find existing demo or registered user with this email
      const users = localRealtimeEngine.getUsers();
      let match = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!match) {
        match = {
          uid: 'user_' + Math.random().toString(36).substring(2, 9),
          displayName: email.split('@')[0],
          email,
          photoURL: PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)],
          statusText: 'Active',
          isOnline: true,
          lastSeen: new Date().toISOString(),
        };
      }
      match.isOnline = true;
      setCurrentUser(match);
      localStorage.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify(match));
      localRealtimeEngine.saveUser(match);
    }
  };

  const signupWithEmail = async (email: string, pass: string, displayName: string) => {
    if (isFirebaseConfigured() && auth) {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const photo = PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)];
      await updateFirebaseUserProfile(cred.user, { displayName, photoURL: photo });
      const profile: UserProfile = {
        uid: cred.user.uid,
        displayName,
        email,
        photoURL: photo,
        statusText: 'Available',
        isOnline: true,
        lastSeen: new Date().toISOString(),
      };
      setCurrentUser(profile);
      localRealtimeEngine.saveUser(profile);
      syncUserProfile(profile).catch(console.warn);
    } else {
      const newUser: UserProfile = {
        uid: 'user_' + Math.random().toString(36).substring(2, 9),
        displayName,
        email,
        photoURL: PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)],
        statusText: 'Just joined PulseChat 👋',
        isOnline: true,
        lastSeen: new Date().toISOString(),
      };
      setCurrentUser(newUser);
      localStorage.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify(newUser));
      localRealtimeEngine.saveUser(newUser);
    }
  };

  const loginWithGoogle = async () => {
    if (isFirebaseConfigured() && auth) {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } else {
      // Demo Google login
      const googleUser: UserProfile = {
        uid: 'user_google_' + Math.random().toString(36).substring(2, 9),
        displayName: 'Google User',
        email: 'google.user@example.com',
        photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        statusText: 'Signed in via Google',
        isOnline: true,
        lastSeen: new Date().toISOString(),
      };
      setCurrentUser(googleUser);
      localStorage.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify(googleUser));
      localRealtimeEngine.saveUser(googleUser);
    }
  };

  const loginAsDemoUser = (uid: string) => {
    const users = localRealtimeEngine.getUsers();
    const target = users.find((u) => u.uid === uid);
    if (target) {
      const updated = { ...target, isOnline: true, lastSeen: new Date().toISOString() };
      setCurrentUser(updated);
      localStorage.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify(updated));
      localRealtimeEngine.saveUser(updated);
    }
  };

  const logout = async () => {
    if (currentUser) {
      localRealtimeEngine.updatePresence(currentUser.uid, false);
    }
    if (isFirebaseConfigured() && auth) {
      await signOut(auth);
    }
    localStorage.removeItem(LOCAL_AUTH_USER_KEY);
    setCurrentUser(null);
  };

  const updateProfileData = async (data: { displayName?: string; photoURL?: string; statusText?: string }) => {
    if (!currentUser) return;
    const updated: UserProfile = {
      ...currentUser,
      displayName: data.displayName ?? currentUser.displayName,
      photoURL: data.photoURL ?? currentUser.photoURL,
      statusText: data.statusText ?? currentUser.statusText,
    };
    setCurrentUser(updated);
    localStorage.setItem(LOCAL_AUTH_USER_KEY, JSON.stringify(updated));
    localRealtimeEngine.saveUser(updated);

    if (isFirebaseConfigured() && auth?.currentUser) {
      if (data.displayName || data.photoURL) {
        await updateFirebaseUserProfile(auth.currentUser, {
          displayName: updated.displayName,
          photoURL: updated.photoURL,
        });
      }
      syncUserProfile(updated).catch(console.warn);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        loginWithEmail,
        signupWithEmail,
        loginWithGoogle,
        loginAsDemoUser,
        logout,
        updateProfileData,
        allUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
