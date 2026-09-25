import { MessageSquare, X } from 'lucide-react';
import React, { useEffect } from 'react';

interface NotificationToastProps {
  roomName: string;
  senderName: string;
  text: string;
  onOpenRoom: () => void;
  onDismiss: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  roomName,
  senderName,
  text,
  onOpenRoom,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 6000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      onClick={onOpenRoom}
      className="cursor-pointer fixed top-4 right-4 z-50 max-w-sm w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-3.5 flex items-start gap-3 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-indigo-500/10 group"
    >
      <div className="w-9 h-9 rounded-full bg-[#d9fdd3] dark:bg-[#005c4b] text-[#008069] dark:text-[#25d366] flex items-center justify-center shrink-0">
        <MessageSquare className="w-5 h-5 fill-current" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
            {roomName}
          </span>
          <span className="text-[10px] text-neutral-400">now</span>
        </div>
        <p className="text-xs text-neutral-600 dark:text-neutral-300 font-medium truncate">
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">{senderName}: </span>
          {text}
        </p>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
