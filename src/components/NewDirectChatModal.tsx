import { MessageSquare, Search, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { formatLastSeen } from '../lib/utils';
import { UserProfile } from '../types';
import { UserAvatar } from './UserAvatar';
import { UserPresenceBadge } from './UserPresenceBadge';

interface NewDirectChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewDirectChatModal: React.FC<NewDirectChatModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { allUsers, currentUser } = useAuth();
  const { startDirectMessage } = useChat();

  const [search, setSearch] = useState('');
  const [starting, setStarting] = useState(false);

  // Filter out current user, and filter by search term
  const filteredUsers = useMemo(() => {
    return allUsers
      .filter((u) => u.uid !== currentUser?.uid)
      .filter((u) => {
        if (!search.trim()) return true;
        const term = search.toLowerCase();
        return (
          u.displayName.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term) ||
          u.statusText?.toLowerCase().includes(term)
        );
      });
  }, [allUsers, currentUser, search]);

  if (!isOpen) return null;

  const handleSelectUser = async (user: UserProfile) => {
    try {
      setStarting(true);
      await startDirectMessage(user);
      onClose();
    } catch (err) {
      console.error('Failed to start DM:', err);
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Direct Message
            </h3>
            <p className="text-xs text-neutral-500">
              Select a teammate to start a 1:1 conversation.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mt-4">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by name, email, or status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-[#00a884]/20 focus:border-[#00a884] transition text-neutral-900 dark:text-white placeholder-neutral-400"
            autoFocus
          />
        </div>

        {/* User Directory List */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-1.5 custom-scrollbar pr-1">
          {filteredUsers.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400 font-medium">
              No teammates found matching &quot;{search}&quot;
            </div>
          ) : (
            filteredUsers.map((user) => (
              <button
                key={user.uid}
                onClick={() => handleSelectUser(user)}
                disabled={starting}
                className="w-full p-2.5 rounded-xl flex items-center gap-3 text-left hover:bg-[#f0f2f5] dark:hover:bg-[#202c33] transition group border border-transparent hover:border-[#00a884]/30 cursor-pointer"
              >
                <UserAvatar
                  name={user.displayName}
                  photoURL={user.photoURL}
                  size="md"
                  isOnline={user.isOnline}
                  showPresence={true}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                      {user.displayName}
                    </p>
                    <span className="text-[10px] text-neutral-400">
                      {user.isOnline ? 'Online' : formatLastSeen(user.lastSeen)}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                    {user.statusText || user.email}
                  </p>
                </div>

                <div className="opacity-0 group-hover:opacity-100 text-[#00a884] dark:text-[#25d366] transition p-1">
                  <MessageSquare className="w-4 h-4" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
