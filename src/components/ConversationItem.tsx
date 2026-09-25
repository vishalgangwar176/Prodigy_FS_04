import { Check, CheckCheck, Code2, Coffee, Hash, Megaphone, Palette, Users } from 'lucide-react';
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { formatConversationTime } from '../lib/utils';
import { Room } from '../types';
import { UserAvatar } from './UserAvatar';

interface ConversationItemProps {
  room: Room;
  isActive: boolean;
  onSelect: () => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  room,
  isActive,
  onSelect,
}) => {
  const { currentUser, allUsers } = useAuth();
  const { unreadCounts, typingUsers } = useChat();

  const unreadCount = unreadCounts[room.id] || 0;

  // Determine display title and avatar/icon relative to current user
  const isDirect = room.type === 'direct';
  const otherUid = isDirect ? (room.members.find((m) => m !== currentUser?.uid) || room.members[0]) : null;
  const otherUser = otherUid ? allUsers.find((u) => u.uid === otherUid) : room.otherUser;

  const title = isDirect
    ? otherUser?.displayName || 'Direct Chat'
    : `#${room.name}`;

  // Check if anyone in this room is currently typing
  const isTyping = React.useMemo(() => {
    if (isActive && typingUsers.length > 0) {
      return `${typingUsers[0].displayName} is typing...`;
    }
    return null;
  }, [isActive, typingUsers]);

  const renderChannelIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Megaphone':
        return <Megaphone className="w-5 h-5 text-[#00a884]" />;
      case 'Code2':
        return <Code2 className="w-5 h-5 text-[#00a884]" />;
      case 'Palette':
        return <Palette className="w-5 h-5 text-[#00a884]" />;
      case 'Coffee':
        return <Coffee className="w-5 h-5 text-[#00a884]" />;
      default:
        return <Hash className="w-5 h-5 text-[#8696a0]" />;
    }
  };

  const isLastMessageMine = room.lastMessageSenderId === currentUser?.uid;

  return (
    <button
      onClick={onSelect}
      className={`w-full px-3.5 py-3 flex items-center gap-3.5 text-left transition-colors relative cursor-pointer border-b border-[#f0f2f5] dark:border-[#222d34]/60 ${
        isActive
          ? 'bg-[#f0f2f5] dark:bg-[#2a3942]'
          : 'bg-transparent hover:bg-[#f5f6f6] dark:hover:bg-[#202c33]'
      }`}
    >
      {/* Avatar or Channel Symbol */}
      <div className="relative shrink-0">
        {isDirect ? (
          <UserAvatar
            name={title}
            photoURL={otherUser?.photoURL}
            size="lg"
            isOnline={otherUser?.isOnline}
            showPresence={true}
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-[#f0f2f5] dark:bg-[#202c33] border border-[#e9edef] dark:border-[#222d34] flex items-center justify-center">
            {renderChannelIcon(room.icon)}
          </div>
        )}
      </div>

      {/* Details: Title & Last Message Snippet */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center justify-between gap-1 mb-1">
          <span
            className={`text-[15px] truncate font-normal ${
              unreadCount > 0
                ? 'font-semibold text-[#111b21] dark:text-[#e9edef]'
                : 'text-[#111b21] dark:text-[#e9edef]'
            }`}
          >
            {title}
          </span>
          <span
            className={`text-[12px] shrink-0 font-normal ${
              unreadCount > 0
                ? 'text-[#25d366] font-medium'
                : 'text-[#667781] dark:text-[#8696a0]'
            }`}
          >
            {formatConversationTime(room.lastMessageAt || room.updatedAt)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 min-w-0 text-[13px] text-[#667781] dark:text-[#8696a0]">
            {isLastMessageMine && !isTyping && (
              <span className="shrink-0 text-[#53bdeb]">
                <CheckCheck className="w-3.5 h-3.5" />
              </span>
            )}
            <p
              className={`truncate ${
                isTyping
                  ? 'text-[#00a884] dark:text-[#25d366] font-medium animate-pulse'
                  : unreadCount > 0
                  ? 'font-medium text-[#111b21] dark:text-[#e9edef]'
                  : 'text-[#667781] dark:text-[#8696a0]'
              }`}
            >
              {isTyping
                ? isTyping
                : isLastMessageMine
                ? room.lastMessageSnippet || 'Sent a message'
                : room.lastMessageSnippet || 'No messages yet'}
            </p>
          </div>

          {/* WhatsApp Unread Counter Badge */}
          {unreadCount > 0 && (
            <span className="min-w-5 h-5 px-1.5 bg-[#25d366] text-[#111b21] text-[11px] font-bold rounded-full flex items-center justify-center shrink-0">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};
