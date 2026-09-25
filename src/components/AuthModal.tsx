import { Check, Lock, Mail, Radio, User } from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { INITIAL_DEMO_USERS } from '../lib/demoData';
import { UserAvatar } from './UserAvatar';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  isForced?: boolean; // when user is completely logged out
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  isForced = false,
}) => {
  const {
    loginWithEmail,
    signupWithEmail,
    loginWithGoogle,
    loginAsDemoUser,
    currentUser,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup' | 'demo'>('demo');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen && !isForced) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else if (mode === 'signup') {
        if (!displayName.trim()) {
          setError('Please provide a display name.');
          setLoading(false);
          return;
        }
        await signupWithEmail(email, password, displayName);
      }
      if (onClose) onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      if (onClose) onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemoUser = (uid: string) => {
    loginAsDemoUser(uid);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Logo and Welcome Title */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-[#00a884] flex items-center justify-center text-white shadow-lg mb-3">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
            {mode === 'demo'
              ? 'WhatsApp Teammate Switcher'
              : mode === 'signup'
              ? 'Create PulseChat Account'
              : 'Sign in to PulseChat'}
          </h2>
          <p className="text-xs text-neutral-500 mt-1 max-w-xs">
            {mode === 'demo'
              ? 'Switch between active Indian personas to test real-time multi-user chat, typing, and presence.'
              : 'Real-time collaborative messaging workspace.'}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex gap-1 p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('demo');
              setError('');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              mode === 'demo'
                ? 'bg-white dark:bg-neutral-800 text-[#00a884] dark:text-[#25d366] shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            Teammates
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              mode === 'login'
                ? 'bg-white dark:bg-neutral-800 text-[#00a884] dark:text-[#25d366] shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError('');
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              mode === 'signup'
                ? 'bg-white dark:bg-neutral-800 text-[#00a884] dark:text-[#25d366] shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        {/* DEMO ACCOUNTS VIEW */}
        {mode === 'demo' ? (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              Select persona to log in as:
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
              {INITIAL_DEMO_USERS.map((user) => {
                const isCurrent = currentUser?.uid === user.uid;
                return (
                  <button
                    key={user.uid}
                    type="button"
                    onClick={() => handleSelectDemoUser(user.uid)}
                    className={`w-full p-2.5 rounded-xl flex items-center justify-between border transition text-left cursor-pointer ${
                      isCurrent
                        ? 'border-[#00a884] bg-[#d9fdd3]/40 dark:bg-[#005c4b]/30'
                        : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar
                        name={user.displayName}
                        photoURL={user.photoURL}
                        size="sm"
                        isOnline={user.isOnline}
                        showPresence={true}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                          {user.displayName}
                        </p>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                          {user.statusText}
                        </p>
                      </div>
                    </div>

                    {isCurrent ? (
                      <span className="text-xs font-bold text-[#00a884] dark:text-[#25d366] flex items-center gap-1 shrink-0">
                        <Check className="w-4 h-4" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-neutral-400 font-medium">Switch →</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 text-center">
              <p className="text-[11px] text-neutral-400">
                Tip: Open an incognito window or another browser tab to experience instant multi-user messaging!
              </p>
            </div>
          </div>
        ) : (
          /* EMAIL / PASSWORD FORM */
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Vikram Malhotra"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884] transition text-neutral-900 dark:text-white placeholder-neutral-400"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884] transition text-neutral-900 dark:text-white placeholder-neutral-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884] transition text-neutral-900 dark:text-white placeholder-neutral-400"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#00a884] hover:bg-[#02906f] text-white rounded-xl text-sm font-semibold shadow-md transition cursor-pointer"
            >
              {loading ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
            </button>

            <div className="relative flex items-center justify-center my-3">
              <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
              <span className="absolute px-2 bg-white dark:bg-neutral-900 text-[11px] text-neutral-400 font-medium">
                or continue with
              </span>
            </div>

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google Account</span>
            </button>
          </form>
        )}

        {!isForced && (
          <div className="mt-4 text-center">
            <button
              onClick={onClose}
              className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
