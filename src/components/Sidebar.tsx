import {
  Camera,
  Hash,
  MessageSquare,
  MessageSquarePlus,
  Moon,
  MoreVertical,
  Plus,
  Search,
  Settings,
  Sun,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useTheme } from '../context/ThemeContext';
import { ConversationItem } from './ConversationItem';

interface SidebarProps {
  currentTab: 'all' | 'channels' | 'direct';
  onTabChange: (tab: 'all' | 'channels' | 'direct') => void;
  onOpenCreateChannel: () => void;
  onOpenNewDirectMessage: () => void;
  onSelectConversationMobile?: () => void;
  onOpenProfile?: () => void;
  onOpenSettings?: () => void;
  onOpenDemoUsers?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  onOpenCreateChannel,
  onOpenNewDirectMessage,
  onSelectConversationMobile,
  onOpenProfile,
  onOpenSettings,
  onOpenDemoUsers,
}) => {
  const { currentUser } = useAuth();
  const { rooms, activeRoomId, setActiveRoomId, unreadCounts } = useChat();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Filter rooms based on current active tab, search query, and unread filter
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      // Unread only toggle
      if (showUnreadOnly && (unreadCounts[room.id] || 0) === 0) return false;

      // Tab filter
      if (currentTab === 'channels' && room.type !== 'channel') return false;
      if (currentTab === 'direct' && room.type !== 'direct') return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const roomNameMatch = room.name.toLowerCase().includes(query);
        const descriptionMatch = room.description?.toLowerCase().includes(query);
        const otherUserMatch =
          room.type === 'direct' &&
          room.otherUser?.displayName.toLowerCase().includes(query);

        return roomNameMatch || descriptionMatch || otherUserMatch;
      }

      return true;
    });
  }, [rooms, currentTab, searchQuery, showUnreadOnly, unreadCounts]);

  const handleSelectRoom = (roomId: string) => {
    setActiveRoomId(roomId);
    if (onSelectConversationMobile) {
      onSelectConversationMobile();
    }
  };

  return (
    <div className="w-full md:w-80 lg:w-96 shrink-0 bg-white dark:bg-[#111b21] border-r border-[#e9edef] dark:border-[#222d34] flex flex-col h-full select-none relative">
      {/* WhatsApp Web & Mobile Top Header */}
      <div className="h-16 px-4 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-[#e9edef] dark:border-[#222d34] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {/* Mobile WhatsApp brand logo in WhatsApp green */}
          <div className="md:hidden w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center text-white shadow-xs">
            <MessageSquare className="w-4 h-4 fill-current" />
          </div>
          <h1 className="text-xl font-bold text-[#111b21] dark:text-[#e9edef]">
            <span className="md:hidden text-[#008069] dark:text-[#25d366]">WhatsApp</span>
            <span className="hidden md:inline">Chats</span>
          </h1>
        </div>

        <div className="flex items-center gap-1 text-[#54656f] dark:text-[#aebac1]">
          {/* Desktop direct action buttons */}
          <button
            onClick={onOpenNewDirectMessage}
            className="p-2 rounded-full hover:bg-[#e9edef] dark:hover:bg-[#111b21] hover:text-[#111b21] dark:hover:text-[#e9edef] transition cursor-pointer"
            title="New Chat"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </button>
          <button
            onClick={onOpenCreateChannel}
            className="p-2 rounded-full hover:bg-[#e9edef] dark:hover:bg-[#111b21] hover:text-[#111b21] dark:hover:text-[#e9edef] transition cursor-pointer"
            title="New Group / Channel"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Mobile 3-Dots Menu */}
          <div className="relative md:hidden">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-full hover:bg-[#e9edef] dark:hover:bg-[#111b21] text-[#54656f] dark:text-[#aebac1] transition cursor-pointer"
              title="More options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMobileMenu && (
              <div className="absolute right-0 top-11 w-52 bg-white dark:bg-[#202c33] border border-[#e9edef] dark:border-[#222d34] rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    onOpenCreateChannel();
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-[#111b21] dark:text-[#e9edef] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] flex items-center gap-2.5 transition"
                >
                  <Plus className="w-4 h-4 text-[#00a884]" />
                  <span>New group</span>
                </button>

                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    onOpenNewDirectMessage();
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-[#111b21] dark:text-[#e9edef] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] flex items-center gap-2.5 transition"
                >
                  <MessageSquarePlus className="w-4 h-4 text-[#00a884]" />
                  <span>New chat</span>
                </button>

                {onOpenDemoUsers && (
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      onOpenDemoUsers();
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-[#111b21] dark:text-[#e9edef] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] flex items-center gap-2.5 transition"
                  >
                    <UserCheck className="w-4 h-4 text-[#00a884]" />
                    <span>Switch user</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    toggleTheme();
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-[#111b21] dark:text-[#e9edef] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] flex items-center gap-2.5 transition"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="w-4 h-4 text-amber-400" />
                      <span>Light mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 text-[#54656f]" />
                      <span>Dark mode</span>
                    </>
                  )}
                </button>

                {onOpenSettings && (
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      onOpenSettings();
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-[#111b21] dark:text-[#e9edef] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] flex items-center gap-2.5 transition"
                  >
                    <Settings className="w-4 h-4 text-[#8696a0]" />
                    <span>Settings</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* WhatsApp Search Bar & Filter Chips */}
      <div className="p-2.5 bg-white dark:bg-[#111b21] border-b border-[#e9edef] dark:border-[#222d34]/70 shrink-0">
        <div className="relative flex items-center bg-[#f0f2f5] dark:bg-[#202c33] rounded-lg px-3 py-1.5 focus-within:ring-1 focus-within:ring-[#00a884]">
          <Search className="w-4 h-4 text-[#54656f] dark:text-[#8696a0] shrink-0 mr-3" />
          <input
            type="text"
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-[13px] bg-transparent text-[#111b21] dark:text-[#e9edef] outline-none placeholder-[#54656f] dark:placeholder-[#8696a0]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-[#54656f] dark:text-[#8696a0] hover:text-[#111b21] dark:hover:text-[#e9edef] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* WhatsApp Filter Pills */}
        <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => {
              onTabChange('all');
              setShowUnreadOnly(false);
            }}
            className={`px-3 py-1 rounded-full text-[12px] font-medium transition cursor-pointer shrink-0 ${
              currentTab === 'all' && !showUnreadOnly
                ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-[#008069] dark:text-[#e9edef]'
                : 'bg-[#f0f2f5] dark:bg-[#202c33] text-[#54656f] dark:text-[#8696a0] hover:bg-[#e9edef] dark:hover:bg-[#2a3942]'
            }`}
          >
            All
          </button>

          <button
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            className={`px-3 py-1 rounded-full text-[12px] font-medium transition cursor-pointer shrink-0 ${
              showUnreadOnly
                ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-[#008069] dark:text-[#e9edef]'
                : 'bg-[#f0f2f5] dark:bg-[#202c33] text-[#54656f] dark:text-[#8696a0] hover:bg-[#e9edef] dark:hover:bg-[#2a3942]'
            }`}
          >
            Unread
          </button>

          <button
            onClick={() => {
              onTabChange('channels');
              setShowUnreadOnly(false);
            }}
            className={`px-3 py-1 rounded-full text-[12px] font-medium transition cursor-pointer shrink-0 ${
              currentTab === 'channels' && !showUnreadOnly
                ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-[#008069] dark:text-[#e9edef]'
                : 'bg-[#f0f2f5] dark:bg-[#202c33] text-[#54656f] dark:text-[#8696a0] hover:bg-[#e9edef] dark:hover:bg-[#2a3942]'
            }`}
          >
            Groups
          </button>

          <button
            onClick={() => {
              onTabChange('direct');
              setShowUnreadOnly(false);
            }}
            className={`px-3 py-1 rounded-full text-[12px] font-medium transition cursor-pointer shrink-0 ${
              currentTab === 'direct' && !showUnreadOnly
                ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-[#008069] dark:text-[#e9edef]'
                : 'bg-[#f0f2f5] dark:bg-[#202c33] text-[#54656f] dark:text-[#8696a0] hover:bg-[#e9edef] dark:hover:bg-[#2a3942]'
            }`}
          >
            Direct
          </button>
        </div>
      </div>

      {/* WhatsApp Conversation List - with bottom padding for mobile bottom bar */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-[#111b21] pb-24 md:pb-4">
        {filteredRooms.length === 0 ? (
          <div className="h-52 flex flex-col items-center justify-center text-center px-4">
            <p className="text-[13px] text-[#8696a0] font-normal mb-2">
              {searchQuery
                ? `No chats found matching "${searchQuery}"`
                : showUnreadOnly
                ? 'No unread chats.'
                : 'No chats available.'}
            </p>
            {!searchQuery && (
              <button
                onClick={onOpenNewDirectMessage}
                className="text-xs font-semibold text-[#00a884] hover:underline cursor-pointer"
              >
                + Start a new chat
              </button>
            )}
          </div>
        ) : (
          filteredRooms.map((room) => (
            <ConversationItem
              key={room.id}
              room={room}
              isActive={room.id === activeRoomId}
              onSelect={() => handleSelectRoom(room.id)}
            />
          ))
        )}
      </div>

      {/* Mobile Floating Action Button (FAB) for starting new chats */}
      <button
        onClick={onOpenNewDirectMessage}
        className="md:hidden fixed bottom-20 right-4 z-30 w-14 h-14 rounded-2xl bg-[#00a884] hover:bg-[#02906f] text-white shadow-2xl flex items-center justify-center transition-all duration-200 active:scale-90 cursor-pointer"
        title="New Chat"
      >
        <MessageSquarePlus className="w-6 h-6" />
      </button>
    </div>
  );
};
