import {
  ChevronLeft,
  Code2,
  Coffee,
  Hash,
  Info,
  Megaphone,
  MoreVertical,
  Palette,
  Phone,
  Search,
  Users,
  Video,
} from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { formatLastSeen } from '../lib/utils';
import { Room } from '../types';
import { CallModal } from './CallModal';
import { UserAvatar } from './UserAvatar';

interface ChatHeaderProps {
  room: Room;
  onBackMobile: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ room, onBackMobile }) => {
  const { currentUser, allUsers } = useAuth();
  const { typingUsers } = useChat();
  const [showMembers, setShowMembers] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [activeCall, setActiveCall] = useState<'voice' | 'video' | null>(null);

  const isDirect = room.type === 'direct';
  const otherUid = isDirect ? (room.members.find((m) => m !== currentUser?.uid) || room.members[0]) : null;
  const otherUser = otherUid ? allUsers.find((u) => u.uid === otherUid) : room.otherUser;

  const title = isDirect ? otherUser?.displayName || 'Direct Chat' : `#${room.name}`;

  const roomMembers = allUsers.filter((u) => room.members.includes(u.uid));

  // Check if anyone in this room is currently typing
  const isTyping = typingUsers.length > 0;

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

  const getSubtitle = () => {
    if (isTyping) {
      return (
        <span className="text-[#00a884] dark:text-[#25d366] font-medium animate-pulse">
          typing...
        </span>
      );
    }
    if (isDirect) {
      if (otherUser?.isOnline) {
        return <span className="text-[#00a884] dark:text-[#25d366]">online</span>;
      }
      return formatLastSeen(otherUser?.lastSeen);
    }
    return roomMembers.map((m) => m.displayName.split(' ')[0]).join(', ');
  };

  return (
    <>
      <div className="h-16 px-3 sm:px-4 border-b border-[#e9edef] dark:border-[#222d34] bg-[#f0f2f5] dark:bg-[#202c33] flex items-center justify-between z-10 shrink-0 select-none">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Back Button with ample touch target */}
          <button
            onClick={onBackMobile}
            className="md:hidden -ml-1 p-2 rounded-full text-[#54656f] dark:text-[#aebac1] hover:text-[#111b21] dark:hover:text-[#e9edef] active:bg-black/10 dark:active:bg-white/10 transition cursor-pointer"
            title="Back to chat list"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Avatar or Channel Symbol */}
          <div
            onClick={() => setShowMembers(!showMembers)}
            className="relative shrink-0 cursor-pointer"
          >
            {isDirect ? (
              <UserAvatar
                name={title}
                photoURL={otherUser?.photoURL}
                size="md"
                isOnline={otherUser?.isOnline}
                showPresence={true}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#e9edef] dark:bg-[#111b21] border border-[#e9edef] dark:border-[#222d34] flex items-center justify-center">
                {renderChannelIcon(room.icon)}
              </div>
            )}
          </div>

          {/* Name and WhatsApp Status */}
          <div
            onClick={() => setShowMembers(!showMembers)}
            className="min-w-0 cursor-pointer"
          >
            <h2 className="text-[15px] font-medium text-[#111b21] dark:text-[#e9edef] truncate leading-tight">
              {title}
            </h2>
            <p className="text-[12px] text-[#667781] dark:text-[#8696a0] truncate leading-normal">
              {getSubtitle()}
            </p>
          </div>
        </div>

        {/* WhatsApp Right Action Icons */}
        <div className="relative flex items-center gap-0.5 sm:gap-2 text-[#54656f] dark:text-[#aebac1]">
          {/* Video Call button */}
          <button
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#111b21] dark:hover:text-[#e9edef] transition cursor-pointer"
            title="Video call"
            onClick={() => setActiveCall('video')}
          >
            <Video className="w-5 h-5" />
          </button>

          {/* Voice Call button */}
          <button
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#111b21] dark:hover:text-[#e9edef] transition cursor-pointer"
            title="Voice call"
            onClick={() => setActiveCall('voice')}
          >
            <Phone className="w-4.5 h-4.5" />
          </button>

          <div className="w-[1px] h-6 bg-[#d1d7db] dark:bg-[#374248] mx-1 hidden sm:block" />

          {/* Search in chat */}
          <button
            onClick={() => setShowMembers(!showMembers)}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#111b21] dark:hover:text-[#e9edef] transition cursor-pointer hidden sm:block"
            title="Search in chat"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Group / Teammate Info button */}
          <button
            onClick={() => setShowMembers(!showMembers)}
            className={`p-2 rounded-full transition cursor-pointer ${
              showMembers
                ? 'bg-[#d9fdd3] dark:bg-[#111b21] text-[#008069] dark:text-[#00a884]'
                : 'hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#111b21] dark:hover:text-[#e9edef]'
            }`}
            title="Contact / Group Info"
          >
            <Users className="w-5 h-5" />
          </button>

          {/* More 3-dots Menu */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 hover:text-[#111b21] dark:hover:text-[#e9edef] transition cursor-pointer"
            title="More options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {/* More Options Dropdown */}
          {showMenu && (
            <div className="absolute right-0 top-12 w-48 bg-white dark:bg-[#202c33] border border-[#e9edef] dark:border-[#222d34] rounded-lg shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowMembers(true);
                }}
                className="w-full px-4 py-2 text-left text-sm text-[#111b21] dark:text-[#e9edef] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] transition"
              >
                {isDirect ? 'Contact info' : 'Group info'}
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  setActiveCall('voice');
                }}
                className="w-full px-4 py-2 text-left text-sm text-[#111b21] dark:text-[#e9edef] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] transition"
              >
                Start audio call
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  setActiveCall('video');
                }}
                className="w-full px-4 py-2 text-left text-sm text-[#111b21] dark:text-[#e9edef] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] transition"
              >
                Start video call
              </button>
              <div className="h-[1px] bg-[#e9edef] dark:bg-[#222d34] my-1" />
              <button
                onClick={() => {
                  setShowMenu(false);
                  onBackMobile();
                }}
                className="w-full px-4 py-2 text-left text-sm text-[#ea0038] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] transition"
              >
                Close chat
              </button>
            </div>
          )}

          {/* Members / Info Popover Dropdown */}
          {showMembers && (
            <div className="absolute right-0 top-12 w-72 max-w-[calc(100vw-32px)] bg-white dark:bg-[#202c33] border border-[#e9edef] dark:border-[#222d34] rounded-xl shadow-xl p-3 z-50">
              <div className="text-xs font-semibold text-[#54656f] dark:text-[#8696a0] uppercase tracking-wider mb-2 pb-1.5 border-b border-[#e9edef] dark:border-[#222d34]">
                {isDirect ? 'Participant' : `Group Members (${roomMembers.length})`}
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {roomMembers.map((member) => (
                  <div key={member.uid} className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-[#f5f6f6] dark:hover:bg-[#111b21]">
                    <UserAvatar
                      name={member.displayName}
                      photoURL={member.photoURL}
                      size="sm"
                      isOnline={member.isOnline}
                      showPresence={true}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[#111b21] dark:text-[#e9edef] truncate">
                        {member.displayName}
                        {member.uid === currentUser?.uid && ' (You)'}
                      </p>
                      <p className="text-[11px] text-[#667781] dark:text-[#8696a0] truncate">
                        {member.isOnline ? 'online' : formatLastSeen(member.lastSeen)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp Simulated Call Screen */}
      {activeCall && (
        <CallModal
          isOpen={true}
          type={activeCall}
          calleeName={title}
          calleeAvatar={isDirect ? otherUser?.photoURL : undefined}
          onClose={() => setActiveCall(null)}
        />
      )}
    </>
  );
};
