import {
  CircleDashed,
  Hash,
  MessageSquare,
  Moon,
  Radio,
  Settings,
  Sun,
  UserCheck,
  Users,
} from 'lucide-react';
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../context/ThemeContext';
import { isFirebaseConfigured } from '../lib/firebase';
import { UserAvatar } from './UserAvatar';

interface LeftNavRailProps {
  currentTab: 'all' | 'channels' | 'direct';
  onSelectTab: (tab: 'all' | 'channels' | 'direct') => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onOpenDemoUsers: () => void;
  isMobileChatOpen?: boolean;
}

export const LeftNavRail: React.FC<LeftNavRailProps> = ({
  currentTab,
  onSelectTab,
  onOpenProfile,
  onOpenSettings,
  onOpenDemoUsers,
  isMobileChatOpen = false,
}) => {
  const { currentUser } = useAuth();
  const { unreadCounts, rooms } = useChat();
  const { theme, toggleTheme } = useTheme();

  // Calculate unread totals for channels vs direct
  const channelUnreads = React.useMemo(() => {
    return rooms
      .filter((r) => r.type === 'channel')
      .reduce((sum, r) => sum + (unreadCounts[r.id] || 0), 0);
  }, [rooms, unreadCounts]);

  const directUnreads = React.useMemo(() => {
    return rooms
      .filter((r) => r.type === 'direct')
      .reduce((sum, r) => sum + (unreadCounts[r.id] || 0), 0);
  }, [rooms, unreadCounts]);

  const totalUnreads = channelUnreads + directUnreads;
  const isFbConnected = isFirebaseConfigured();

  return (
    <>
      {/* 1. Desktop Left Rail (hidden on mobile, visible on md and up) */}
      <aside className="hidden md:flex w-16 md:w-16 shrink-0 bg-[#f0f2f5] dark:bg-[#202c33] border-r border-[#e9edef] dark:border-[#222d34] flex-col items-center py-3 justify-between select-none z-20">
        {/* WhatsApp Brand Icon & Top Navigation */}
        <div className="flex flex-col items-center gap-4 w-full">
          {/* WhatsApp Icon Logo */}
          <div
            className="w-10 h-10 rounded-full bg-[#00a884] dark:bg-[#00a884] flex items-center justify-center text-white shadow-sm cursor-pointer hover:scale-105 active:scale-95 transition"
            title="WhatsApp Web"
            onClick={() => onSelectTab('all')}
          >
            <MessageSquare className="w-5 h-5 fill-current" />
          </div>

          <div className="w-7 h-[1px] bg-[#e9edef] dark:bg-[#222d34]" />

          {/* View Switches */}
          <div className="flex flex-col items-center gap-2 w-full px-2">
            {/* All Chats */}
            <button
              onClick={() => onSelectTab('all')}
              className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                currentTab === 'all'
                  ? 'bg-[#d9fdd3] dark:bg-[#111b21] text-[#008069] dark:text-[#00a884] font-semibold'
                  : 'text-[#54656f] dark:text-[#aebac1] hover:bg-[#e9edef] dark:hover:bg-[#111b21] hover:text-[#111b21] dark:hover:text-[#e9edef]'
              }`}
              title="Chats"
            >
              <MessageSquare className="w-5 h-5" />
              {totalUnreads > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 bg-[#25d366] text-[#111b21] text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-[#f0f2f5] dark:ring-[#202c33]">
                  {totalUnreads > 9 ? '9+' : totalUnreads}
                </span>
              )}
            </button>

            {/* Status / Updates */}
            <button
              onClick={() => onSelectTab('all')}
              className="w-10 h-10 rounded-full flex items-center justify-center text-[#54656f] dark:text-[#aebac1] hover:bg-[#e9edef] dark:hover:bg-[#111b21] hover:text-[#111b21] dark:hover:text-[#e9edef] transition-all cursor-pointer"
              title="Status"
            >
              <CircleDashed className="w-5 h-5" />
            </button>

            {/* Channels */}
            <button
              onClick={() => onSelectTab('channels')}
              className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                currentTab === 'channels'
                  ? 'bg-[#d9fdd3] dark:bg-[#111b21] text-[#008069] dark:text-[#00a884] font-semibold'
                  : 'text-[#54656f] dark:text-[#aebac1] hover:bg-[#e9edef] dark:hover:bg-[#111b21] hover:text-[#111b21] dark:hover:text-[#e9edef]'
              }`}
              title="Channels & Groups"
            >
              <Hash className="w-5 h-5" />
              {channelUnreads > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 bg-[#25d366] text-[#111b21] text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-[#f0f2f5] dark:ring-[#202c33]">
                  {channelUnreads > 9 ? '9+' : channelUnreads}
                </span>
              )}
            </button>

            {/* Direct Messages Only */}
            <button
              onClick={() => onSelectTab('direct')}
              className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                currentTab === 'direct'
                  ? 'bg-[#d9fdd3] dark:bg-[#111b21] text-[#008069] dark:text-[#00a884] font-semibold'
                  : 'text-[#54656f] dark:text-[#aebac1] hover:bg-[#e9edef] dark:hover:bg-[#111b21] hover:text-[#111b21] dark:hover:text-[#e9edef]'
              }`}
              title="Direct Messages"
            >
              <Users className="w-5 h-5" />
              {directUnreads > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 bg-[#25d366] text-[#111b21] text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-[#f0f2f5] dark:ring-[#202c33]">
                  {directUnreads > 9 ? '9+' : directUnreads}
                </span>
              )}
            </button>

            {/* Multi-User Switcher */}
            <button
              onClick={onOpenDemoUsers}
              className="w-10 h-10 rounded-full flex items-center justify-center text-[#54656f] dark:text-[#aebac1] hover:bg-[#e9edef] dark:hover:bg-[#111b21] hover:text-[#00a884] transition cursor-pointer"
              title="Switch User / Multi-User Test"
            >
              <UserCheck className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Bottom Controls: Theme Toggle, Settings & User Profile */}
        <div className="flex flex-col items-center gap-2.5 w-full px-2">
          {/* Connection status indicator */}
          <button
            onClick={onOpenSettings}
            className="relative w-10 h-10 rounded-full flex items-center justify-center text-[#54656f] dark:text-[#aebac1] hover:bg-[#e9edef] dark:hover:bg-[#111b21] hover:text-[#111b21] dark:hover:text-[#e9edef] transition cursor-pointer"
            title={isFbConnected ? 'WhatsApp / Firebase Sync Connected' : 'WhatsApp Realtime Engine (Live)'}
          >
            <Settings className="w-5 h-5" />
            <span
              className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                isFbConnected ? 'bg-[#25d366] ring-2 ring-white dark:ring-[#202c33]' : 'bg-[#00a884]'
              }`}
            />
          </button>

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#54656f] dark:text-[#aebac1] hover:bg-[#e9edef] dark:hover:bg-[#111b21] hover:text-[#111b21] dark:hover:text-[#e9edef] transition cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-[#54656f]" />}
          </button>

          {/* User Profile Avatar with Presence Badge */}
          {currentUser && (
            <button
              onClick={onOpenProfile}
              className="p-0.5 rounded-full hover:ring-2 hover:ring-[#00a884] transition group focus:outline-none cursor-pointer mt-1"
              title={`${currentUser.displayName} (${currentUser.statusText || 'Available'}) - Click to edit profile`}
            >
              <UserAvatar
                name={currentUser.displayName}
                photoURL={currentUser.photoURL}
                size="sm"
                isOnline={currentUser.isOnline}
                showPresence={true}
              />
            </button>
          )}
        </div>
      </aside>

      {/* 2. Mobile WhatsApp Bottom Navigation Bar (visible ONLY on mobile and ONLY when chats list is open) */}
      {!isMobileChatOpen && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#f0f2f5] dark:bg-[#202c33] border-t border-[#e9edef] dark:border-[#222d34] flex items-center justify-around px-2 z-30 pb-safe shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
          {/* Chats */}
          <button
            onClick={() => onSelectTab('all')}
            className={`flex flex-col items-center justify-center flex-1 h-full min-w-[48px] py-1 transition cursor-pointer ${
              currentTab === 'all'
                ? 'text-[#008069] dark:text-[#25d366]'
                : 'text-[#54656f] dark:text-[#8696a0]'
            }`}
          >
            <div className="relative">
              <MessageSquare className="w-5 h-5" />
              {totalUnreads > 0 && (
                <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 bg-[#25d366] text-[#111b21] text-[10px] font-bold rounded-full flex items-center justify-center">
                  {totalUnreads > 9 ? '9+' : totalUnreads}
                </span>
              )}
            </div>
            <span className="text-[11px] font-medium mt-0.5">Chats</span>
          </button>

          {/* Groups */}
          <button
            onClick={() => onSelectTab('channels')}
            className={`flex flex-col items-center justify-center flex-1 h-full min-w-[48px] py-1 transition cursor-pointer ${
              currentTab === 'channels'
                ? 'text-[#008069] dark:text-[#25d366]'
                : 'text-[#54656f] dark:text-[#8696a0]'
            }`}
          >
            <div className="relative">
              <Hash className="w-5 h-5" />
              {channelUnreads > 0 && (
                <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 bg-[#25d366] text-[#111b21] text-[10px] font-bold rounded-full flex items-center justify-center">
                  {channelUnreads > 9 ? '9+' : channelUnreads}
                </span>
              )}
            </div>
            <span className="text-[11px] font-medium mt-0.5">Groups</span>
          </button>

          {/* Direct */}
          <button
            onClick={() => onSelectTab('direct')}
            className={`flex flex-col items-center justify-center flex-1 h-full min-w-[48px] py-1 transition cursor-pointer ${
              currentTab === 'direct'
                ? 'text-[#008069] dark:text-[#25d366]'
                : 'text-[#54656f] dark:text-[#8696a0]'
            }`}
          >
            <div className="relative">
              <Users className="w-5 h-5" />
              {directUnreads > 0 && (
                <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 bg-[#25d366] text-[#111b21] text-[10px] font-bold rounded-full flex items-center justify-center">
                  {directUnreads > 9 ? '9+' : directUnreads}
                </span>
              )}
            </div>
            <span className="text-[11px] font-medium mt-0.5">Direct</span>
          </button>

          {/* Teammate Switcher */}
          <button
            onClick={onOpenDemoUsers}
            className="flex flex-col items-center justify-center flex-1 h-full min-w-[48px] py-1 text-[#54656f] dark:text-[#8696a0] hover:text-[#00a884] transition cursor-pointer"
          >
            <UserCheck className="w-5 h-5" />
            <span className="text-[11px] font-medium mt-0.5">Switch</span>
          </button>

          {/* Profile / Settings */}
          <button
            onClick={onOpenProfile}
            className="flex flex-col items-center justify-center flex-1 h-full min-w-[48px] py-1 text-[#54656f] dark:text-[#8696a0] hover:text-[#00a884] transition cursor-pointer"
          >
            {currentUser ? (
              <div className="w-6 h-6 rounded-full overflow-hidden ring-1 ring-[#00a884]">
                <img
                  src={currentUser.photoURL || undefined}
                  alt={currentUser.displayName}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <Settings className="w-5 h-5" />
            )}
            <span className="text-[11px] font-medium mt-0.5">Profile</span>
          </button>
        </nav>
      )}
    </>
  );
};
