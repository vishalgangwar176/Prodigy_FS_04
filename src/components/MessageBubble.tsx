import { Check, CheckCheck, Download, FileText } from 'lucide-react';
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { formatFileSize, formatMessageTime } from '../lib/utils';
import { Message } from '../types';
import { UserAvatar } from './UserAvatar';

interface MessageBubbleProps {
  message: Message;
  isFirstInGroup?: boolean;
  onImageClick?: (url: string, name: string) => void;
}

// WhatsApp-style distinct name colors for group chats
const SENDER_COLORS = [
  'text-[#00a884] dark:text-[#25d366]',
  'text-[#53bdeb] dark:text-[#53bdeb]',
  'text-[#f15c6d] dark:text-[#f15c6d]',
  'text-[#e542a3] dark:text-[#e542a3]',
  'text-[#9b59b6] dark:text-[#a855f7]',
  'text-[#e67e22] dark:text-[#f97316]',
  'text-[#3498db] dark:text-[#38bdf8]',
  'text-[#1abc9c] dark:text-[#2dd4bf]',
];

function getSenderColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % SENDER_COLORS.length;
  return SENDER_COLORS[index];
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isFirstInGroup = true,
  onImageClick,
}) => {
  const { currentUser } = useAuth();
  const isMine = currentUser?.uid === message.senderId;

  // Delivered vs Read state:
  // If isMine: check if any other member has read it
  const isReadByOthers = isMine && message.readBy && message.readBy.some((uid) => uid !== currentUser?.uid);

  const isImageAttachment =
    message.attachment &&
    (message.attachment.type.startsWith('image/') ||
      /\.(jpeg|jpg|gif|png|webp|svg)$/i.test(message.attachment.name || ''));

  return (
    <div
      className={`group flex items-end gap-2 px-3 sm:px-9 py-0.5 select-none ${
        isMine ? 'justify-end' : 'justify-start'
      }`}
    >
      {/* Sender Avatar for incoming messages if first in sequence */}
      {!isMine && (
        <div className="shrink-0 self-end mb-1">
          {isFirstInGroup ? (
            <UserAvatar
              name={message.senderName}
              photoURL={message.senderAvatar}
              size="sm"
            />
          ) : (
            <div className="w-8 h-8" />
          )}
        </div>
      )}

      {/* WhatsApp Message Bubble */}
      <div className={`max-w-[85%] sm:max-w-[65%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
        <div
          className={`relative px-3 py-1.5 rounded-lg text-[14px] leading-relaxed break-words shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] ${
            isMine
              ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-tr-none'
              : 'bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-tl-none'
          }`}
        >
          {/* Sender Name above message if incoming and first in group */}
          {!isMine && isFirstInGroup && (
            <div className={`text-[12.5px] font-semibold mb-0.5 ${getSenderColor(message.senderName)}`}>
              {message.senderName}
            </div>
          )}

          {/* Attachment Preview (if any) */}
          {message.attachment && (
            <div className="mb-1.5 mt-0.5">
              {isImageAttachment ? (
                <div
                  onClick={() => onImageClick?.(message.attachment!.url, message.attachment!.name)}
                  className="cursor-pointer overflow-hidden rounded-md group/img relative bg-black/5 dark:bg-white/5"
                >
                  <img
                    src={message.attachment.url}
                    alt={message.attachment.name}
                    className="max-h-72 w-auto max-w-full rounded-md object-cover hover:opacity-95 transition"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center text-white">
                    <span className="text-[11px] font-medium bg-black/60 px-2 py-0.5 rounded-full">
                      Click to expand
                    </span>
                  </div>
                </div>
              ) : (
                <a
                  href={message.attachment.url}
                  download={message.attachment.name}
                  target="_blank"
                  rel="noreferrer"
                  className={`flex items-center gap-3 p-2.5 rounded-lg transition ${
                    isMine
                      ? 'bg-black/5 dark:bg-black/20 hover:bg-black/10'
                      : 'bg-[#f0f2f5] dark:bg-[#111b21] hover:bg-[#e9edef] dark:hover:bg-[#2a3942]'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-[#00a884]/15 text-[#00a884] dark:text-[#25d366]">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">{message.attachment.name}</p>
                    <p className="text-[11px] text-[#667781] dark:text-[#8696a0]">
                      {formatFileSize(message.attachment.size)}
                    </p>
                  </div>
                  <Download className="w-4 h-4 text-[#54656f] dark:text-[#aebac1] hover:text-[#111b21] dark:hover:text-white shrink-0" />
                </a>
              )}
            </div>
          )}

          {/* Message Text with inline timestamp wrapper */}
          <div className="flex flex-wrap items-baseline justify-between gap-x-2.5">
            {message.text && (
              <span className="whitespace-pre-wrap select-text pr-1">{message.text}</span>
            )}

            {/* WhatsApp Timestamp & Read Ticks inline */}
            <span
              className={`inline-flex items-center gap-1 ml-auto pt-0.5 text-[11px] select-none shrink-0 ${
                isMine
                  ? 'text-[#667781] dark:text-[#8696a0]'
                  : 'text-[#667781] dark:text-[#8696a0]'
              }`}
            >
              <span>{formatMessageTime(message.createdAt)}</span>

              {/* Read / Delivered Double Ticks */}
              {isMine && (
                <span title={isReadByOthers ? 'Read' : 'Delivered'} className="inline-flex">
                  {isReadByOthers ? (
                    <CheckCheck className="w-4 h-4 text-[#53bdeb]" />
                  ) : (
                    <CheckCheck className="w-4 h-4 text-[#8696a0]" />
                  )}
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
