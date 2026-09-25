import { Search, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_CATEGORIES = [
  {
    name: 'Frequent & Smileys',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😋', '😜', '🤪', '🤩', '🥳', '😎', '🤓', '🧐', '🤔', '🤫', '🤭', '🥱', '😴', '🙄', '😬', '😮', '🤐', '😯', '🤯', '🥳'],
  },
  {
    name: 'Gestures & People',
    emojis: ['👍', '👎', '👏', '🙌', '🤝', '👊', '✌️', '🤞', '🤟', '🤘', '👌', '🤌', '👈', '👉', '👆', '👇', '👋', '🤚', '🖐️', '✋', '🖖', '💪', '🙏', '✍️', '💅', '🤳', '🙇', '🙋', '💁'],
  },
  {
    name: 'Hearts & Emotions',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '✨', '⭐', '🌟', '💫', '🔥', '💥', '🎉', '🎊'],
  },
  {
    name: 'Work & Objects',
    emojis: ['💻', '🖥️', '⌨️', '📱', '💡', '🚀', '⚡', '📊', '📈', '📌', '📎', '📋', '📁', '📂', '🔒', '🔑', '☕', '🍕', '🎯', '🏆', '🥇', '🎨', '⚙️', '🛠️', '📦', '🔔', '📣'],
  },
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelectEmoji, onClose }) => {
  const [search, setSearch] = useState('');

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return EMOJI_CATEGORIES;
    const term = search.toLowerCase();
    return EMOJI_CATEGORIES.map((cat) => ({
      ...cat,
      emojis: cat.emojis.filter((emoji) => emoji.includes(term)),
    })).filter((cat) => cat.emojis.length > 0);
  }, [search]);

  return (
    <div className="absolute bottom-16 left-3 sm:left-4 z-50 w-[calc(100vw-24px)] sm:w-80 max-w-sm bg-white dark:bg-[#202c33] border border-[#e9edef] dark:border-[#222d34] rounded-2xl shadow-2xl p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between pb-2 border-b border-[#e9edef] dark:border-[#222d34]">
        <span className="text-xs font-semibold text-[#54656f] dark:text-[#8696a0] uppercase tracking-wider">
          Insert Emoji
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-[#54656f] dark:text-[#8696a0] hover:text-[#111b21] dark:hover:text-[#e9edef] hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#54656f] dark:text-[#8696a0]" />
        <input
          type="text"
          placeholder="Search emojis..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#f0f2f5] dark:bg-[#111b21] text-[#111b21] dark:text-[#e9edef] rounded-lg outline-none focus:ring-1 focus:ring-[#00a884] placeholder-[#54656f] dark:placeholder-[#8696a0]"
          autoFocus
        />
      </div>

      <div className="max-h-56 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
        {filteredCategories.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#8696a0]">No matching emojis</div>
        ) : (
          filteredCategories.map((cat) => (
            <div key={cat.name}>
              <div className="text-[10px] font-medium text-[#54656f] dark:text-[#8696a0] mb-1">
                {cat.name}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {cat.emojis.map((emoji, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onSelectEmoji(emoji);
                      onClose();
                    }}
                    className="h-8 flex items-center justify-center text-lg hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] rounded-lg transition-transform active:scale-125 cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
