import { ArrowDown, Loader2, MessageSquareText, UploadCloud } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { formatDateDivider } from '../lib/utils';
import { ImageLightbox } from './ImageLightbox';
import { MessageBubble } from './MessageBubble';

interface ChatPanelProps {
  onDropFiles?: (file: File) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ onDropFiles }) => {
  const { currentUser } = useAuth();
  const {
    messages,
    loadingMessages,
    hasMoreOlderMessages,
    loadEarlierMessages,
    typingUsers,
    activeRoom,
    sendMessage,
  } = useChat();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [unreadWhileScrolled, setUnreadWhileScrolled] = useState(0);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);

  const prevMessageCountRef = useRef(messages.length);

  // Handle scroll events to detect if user has scrolled up
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    if (distanceFromBottom > 150) {
      setIsScrolledUp(true);
    } else {
      setIsScrolledUp(false);
      setUnreadWhileScrolled(0);
    }
  };

  // Scroll to bottom helper
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setIsScrolledUp(false);
    setUnreadWhileScrolled(0);
  };

  // Auto-scroll when new messages arrive (or increment unread counter if user is scrolled up)
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      if (isScrolledUp) {
        setUnreadWhileScrolled((prev) => prev + (messages.length - prevMessageCountRef.current));
      } else {
        scrollToBottom('smooth');
      }
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length, isScrolledUp]);

  // Initial scroll to bottom on room change
  useEffect(() => {
    scrollToBottom('auto');
    setIsScrolledUp(false);
    setUnreadWhileScrolled(0);
  }, [activeRoom?.id]);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (onDropFiles) {
        onDropFiles(file);
      } else {
        await sendMessage('', file);
      }
    }
  };

  // Group messages by date
  const groupedMessages = React.useMemo(() => {
    const groups: { date: string; items: typeof messages }[] = [];
    let currentDate = '';
    let currentGroup: typeof messages = [];

    messages.forEach((msg) => {
      const dateLabel = formatDateDivider(msg.createdAt);
      if (dateLabel !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, items: currentGroup });
        }
        currentDate = dateLabel;
        currentGroup = [msg];
      } else {
        currentGroup.push(msg);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, items: currentGroup });
    }

    return groups;
  }, [messages]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative flex-1 flex flex-col h-full overflow-hidden wa-chat-bg-light dark:wa-chat-bg-dark select-none"
    >
      {/* Drag & drop overlay indicator */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-40 bg-[#00a884]/90 backdrop-blur-xs flex flex-col items-center justify-center text-white border-2 border-dashed border-white m-4 rounded-2xl animate-in fade-in zoom-in-95 duration-150">
          <UploadCloud className="w-16 h-16 animate-bounce mb-3" />
          <p className="text-lg font-bold">Drop files here to send</p>
          <p className="text-xs text-white/90">Supports images, documents, and files</p>
        </div>
      )}

      {/* Messages Scroll Container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto py-3 space-y-1 custom-scrollbar"
      >
        {/* WhatsApp End-to-End Encryption Banner */}
        <div className="flex justify-center px-4 pt-1 pb-3">
          <div className="max-w-md px-3.5 py-1.5 rounded-lg bg-[#ffeecd] dark:bg-[#182229] border border-[#f5db99]/70 dark:border-[#222d34] text-[#54656f] dark:text-[#ffd279] text-[12px] text-center shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] leading-normal flex items-center justify-center gap-1.5">
            <span>🔒</span>
            <span>Messages are end-to-end encrypted. No one outside of this chat can read them.</span>
          </div>
        </div>

        {/* Loading skeleton state */}
        {loadingMessages ? (
          <div className="flex flex-col gap-3 p-6 animate-pulse">
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 shrink-0" />
              <div className="space-y-1.5 flex-1 max-w-sm">
                <div className="h-2.5 w-24 bg-black/10 dark:bg-white/10 rounded" />
                <div className="h-10 bg-white dark:bg-[#202c33] rounded-lg shadow-xs" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <div className="space-y-1.5 flex-1 max-w-xs">
                <div className="h-12 bg-[#d9fdd3] dark:bg-[#005c4b] rounded-lg shadow-xs" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/10 shrink-0" />
              <div className="space-y-1.5 flex-1 max-w-md">
                <div className="h-2.5 w-28 bg-black/10 dark:bg-white/10 rounded" />
                <div className="h-14 bg-white dark:bg-[#202c33] rounded-lg shadow-xs" />
              </div>
            </div>
          </div>
        ) : messages.length === 0 ? (
          /* Empty state */
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 select-none">
            <div className="w-14 h-14 rounded-full bg-white dark:bg-[#202c33] border border-[#e9edef] dark:border-[#222d34] flex items-center justify-center text-[#00a884] mb-3 shadow-xs">
              <MessageSquareText className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-[#111b21] dark:text-[#e9edef] mb-1">
              No messages yet
            </h3>
            <p className="text-xs text-[#54656f] dark:text-[#8696a0] max-w-xs mb-4 leading-relaxed">
              Send a message, attachment, or emoji to begin chatting!
            </p>
          </div>
        ) : (
          <>
            {/* Load earlier messages pagination button */}
            {hasMoreOlderMessages && (
              <div className="flex justify-center pb-2">
                <button
                  onClick={loadEarlierMessages}
                  className="px-3 py-1 rounded-md bg-white dark:bg-[#182229] border border-[#e9edef] dark:border-[#222d34] text-[12px] font-medium text-[#54656f] dark:text-[#8696a0] hover:bg-[#f0f2f5] dark:hover:bg-[#202c33] shadow-xs transition cursor-pointer"
                >
                  Load earlier messages
                </button>
              </div>
            )}

            {/* Date Grouped Message List */}
            {groupedMessages.map((group) => (
              <div key={group.date} className="space-y-0.5">
                {/* WhatsApp Centered Date Divider Pill */}
                <div className="flex items-center justify-center my-3 select-none">
                  <span className="px-3 py-1 bg-white dark:bg-[#182229] text-[12px] font-medium text-[#54656f] dark:text-[#8696a0] rounded-md shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] uppercase">
                    {group.date}
                  </span>
                </div>

                {/* Message bubbles in this date group */}
                {group.items.map((msg, index) => {
                  const prevMsg = group.items[index - 1];
                  const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId;

                  return (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      isFirstInGroup={isFirstInGroup}
                      onImageClick={(url, name) => setLightboxImage({ url, name })}
                    />
                  );
                })}
              </div>
            ))}
          </>
        )}

        {/* WhatsApp Typing Indicator Bubble */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 px-6 py-1 select-none animate-in fade-in duration-200">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-[#202c33] text-[#54656f] dark:text-[#8696a0] text-xs shadow-xs border border-transparent dark:border-[#222d34]">
              <span className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-bounce [animation-delay:0.4s]" />
              </span>
              <span className="text-[12px]">
                {typingUsers.map((u) => u.displayName).join(', ')}{' '}
                {typingUsers.length === 1 ? 'is typing...' : 'are typing...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating "Jump to latest" WhatsApp pill if scrolled up */}
      {isScrolledUp && (
        <button
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-4 right-6 z-30 flex items-center justify-center w-10 h-10 bg-white dark:bg-[#202c33] text-[#54656f] dark:text-[#aebac1] rounded-full shadow-lg border border-[#e9edef] dark:border-[#222d34] cursor-pointer hover:bg-[#f0f2f5] dark:hover:bg-[#2a3942] active:scale-95 transition"
          title="Scroll to bottom"
        >
          <ArrowDown className="w-4 h-4" />
          {unreadWhileScrolled > 0 && (
            <span className="absolute -top-1.5 -right-1.5 px-1.5 min-w-5 h-5 bg-[#25d366] text-[#111b21] rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#202c33]">
              {unreadWhileScrolled}
            </span>
          )}
        </button>
      )}

      {/* Image Lightbox Modal */}
      {lightboxImage && (
        <ImageLightbox
          imageUrl={lightboxImage.url}
          imageName={lightboxImage.name}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  );
};
