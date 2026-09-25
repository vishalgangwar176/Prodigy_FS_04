import { FileText, Image as ImageIcon, Loader2, Mic, Paperclip, Send, Smile, Trash2, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '../context/ChatContext';
import { EmojiPicker } from './EmojiPicker';
import { FileUploadPreview } from './FileUploadPreview';

export const MessageComposer: React.FC = () => {
  const { sendMessage, sendTyping, activeRoom } = useChat();

  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [sending, setSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea to accommodate multi-line typing up to 130px
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 130)}px`;
    }
  }, [text]);

  // Handle voice recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      setRecordingSeconds(0);
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Notify typing when user inputs
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    sendTyping(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    if ((!text.trim() && !selectedFile) || sending) return;

    try {
      setSending(true);
      const currentText = text;
      const currentFile = selectedFile;

      setText('');
      setSelectedFile(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      await sendMessage(currentText, currentFile);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleSendVoiceNote = async () => {
    const duration = recordingSeconds > 0 ? recordingSeconds : 1;
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    const formatted = `${mins}:${secs.toString().padStart(2, '0')}`;
    setIsRecording(false);
    try {
      setSending(true);
      await sendMessage(`🎤 Voice message (${formatted})`);
    } catch (err) {
      console.error('Failed to send voice note:', err);
    } finally {
      setSending(false);
    }
  };

  const handleCancelVoiceNote = () => {
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const handleSelectEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    sendTyping(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setShowAttachMenu(false);
    }
  };

  const hasContent = text.trim().length > 0 || selectedFile !== null;

  return (
    <div className="relative px-2 sm:px-4 py-2 sm:py-2.5 pb-safe bg-[#f0f2f5] dark:bg-[#202c33] border-t border-[#e9edef] dark:border-[#222d34] select-none z-20">
      {/* File preview badge before sending */}
      {selectedFile && (
        <div className="mb-2">
          <FileUploadPreview file={selectedFile} onRemove={() => setSelectedFile(null)} />
        </div>
      )}

      {/* Emoji picker dropdown */}
      {showEmojiPicker && (
        <EmojiPicker
          onSelectEmoji={handleSelectEmoji}
          onClose={() => setShowEmojiPicker(false)}
        />
      )}

      {/* WhatsApp Attachment Drawer Menu */}
      {showAttachMenu && (
        <div className="absolute left-2 sm:left-12 bottom-16 bg-white dark:bg-[#202c33] border border-[#e9edef] dark:border-[#222d34] rounded-2xl shadow-2xl p-3 flex flex-col gap-2 z-50 animate-in fade-in slide-in-from-bottom-3 duration-150">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] text-[#111b21] dark:text-[#e9edef] text-sm font-medium transition cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 text-white flex items-center justify-center shadow-xs">
              <ImageIcon className="w-5 h-5" />
            </div>
            <span>Photos & Videos</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#f0f2f5] dark:hover:bg-[#111b21] text-[#111b21] dark:text-[#e9edef] text-sm font-medium transition cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-500 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <span>Document</span>
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt,.zip"
      />

      {/* Composer Input Bar or Voice Recording Bar */}
      {isRecording ? (
        <div className="flex items-center justify-between gap-3 py-1 animate-in fade-in duration-150">
          {/* Cancel trash button */}
          <button
            type="button"
            onClick={handleCancelVoiceNote}
            className="p-2.5 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
            title="Cancel recording"
          >
            <Trash2 className="w-5 h-5" />
          </button>

          {/* Recording indicator and animated waves */}
          <div className="flex-1 flex items-center gap-3 bg-white dark:bg-[#2a3942] rounded-full px-4 py-2 shadow-xs">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse shrink-0" />
            <span className="text-sm font-medium text-red-500 font-mono">
              {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
            </span>
            <div className="flex-1 flex items-center gap-1 overflow-hidden px-2">
              <span className="h-2 w-1 bg-[#00a884] rounded-full animate-bounce" />
              <span className="h-4 w-1 bg-[#00a884] rounded-full animate-pulse" />
              <span className="h-3 w-1 bg-[#00a884] rounded-full animate-bounce delay-100" />
              <span className="h-5 w-1 bg-[#00a884] rounded-full animate-pulse" />
              <span className="h-2 w-1 bg-[#00a884] rounded-full animate-bounce" />
              <span className="h-4 w-1 bg-[#00a884] rounded-full animate-pulse" />
              <span className="h-3 w-1 bg-[#00a884] rounded-full animate-bounce" />
            </div>
            <span className="text-xs text-[#8696a0] hidden sm:inline">Recording audio note...</span>
          </div>

          {/* Send voice note button */}
          <button
            type="button"
            onClick={handleSendVoiceNote}
            disabled={sending}
            className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#02906f] text-white flex items-center justify-center shadow-sm transition active:scale-95 cursor-pointer shrink-0"
            title="Send voice note"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5 fill-current" />}
          </button>
        </div>
      ) : (
        <div className="flex items-end gap-1.5 sm:gap-2">
          {/* Left Action Buttons: Smile & Paperclip */}
          <div className="flex items-center gap-0.5 pb-1 text-[#54656f] dark:text-[#8696a0]">
            <button
              type="button"
              onClick={() => {
                setShowEmojiPicker(!showEmojiPicker);
                setShowAttachMenu(false);
              }}
              className={`p-2 rounded-full transition cursor-pointer ${
                showEmojiPicker
                  ? 'text-[#00a884] dark:text-[#00a884]'
                  : 'hover:text-[#111b21] dark:hover:text-[#e9edef]'
              }`}
              title="Emojis"
            >
              <Smile className="w-6 h-6" />
            </button>

            <button
              type="button"
              onClick={() => {
                setShowAttachMenu(!showAttachMenu);
                setShowEmojiPicker(false);
              }}
              className={`p-2 rounded-full transition cursor-pointer ${
                showAttachMenu
                  ? 'text-[#00a884] dark:text-[#00a884]'
                  : 'hover:text-[#111b21] dark:hover:text-[#e9edef]'
              }`}
              title="Attach file"
            >
              <Paperclip className="w-6 h-6" />
            </button>
          </div>

          {/* Textarea WhatsApp Pill */}
          <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-lg px-3 sm:px-3.5 py-2 sm:py-2.5 flex items-center shadow-xs min-h-[42px]">
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message"
              className="w-full bg-transparent text-[14px] sm:text-[15px] text-[#111b21] dark:text-[#e9edef] outline-none resize-none leading-relaxed placeholder-[#54656f] dark:placeholder-[#8696a0] max-h-32 custom-scrollbar"
            />
          </div>

          {/* Right Action: Send or Mic */}
          <div className="pb-1 shrink-0">
            {hasContent ? (
              <button
                type="button"
                onClick={handleSend}
                disabled={sending}
                className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#02906f] text-white flex items-center justify-center shadow-sm transition active:scale-95 cursor-pointer"
                title="Send (Enter)"
              >
                {sending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5 ml-0.5 fill-current" />
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsRecording(true)}
                className="w-10 h-10 rounded-full text-[#54656f] dark:text-[#8696a0] hover:text-[#00a884] dark:hover:text-[#00a884] active:scale-90 flex items-center justify-center transition cursor-pointer"
                title="Record voice message"
              >
                <Mic className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
