import React, { useState, useRef } from 'react';
import { ArrowUp, Smile, Paperclip, X, Image as ImageIcon } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string, attachment?: { url: string; type: 'image' | 'file'; name: string }) => void;
  onTyping: () => void;
  onStopTyping: () => void;
  placeholder?: string;
}

const COMMON_EMOJIS = ['😊', '😂', '❤️', '👍', '🔥', '🎉', '🚀', '👋', '✨', '🙏', '💯', '🤔'];

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onTyping,
  onStopTyping,
  placeholder = 'Write a message to everyone...',
}) => {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachment, setAttachment] = useState<{ url: string; type: 'image' | 'file'; name: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    onTyping();

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      onStopTyping();
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !attachment) return;

    onSendMessage(text.trim(), attachment || undefined);
    setText('');
    setAttachment(null);
    setShowEmojiPicker(false);
    onStopTyping();

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    inputRef.current?.focus();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImg = file.type.startsWith('image/');
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAttachment({
          url: reader.result,
          type: isImg ? 'image' : 'file',
          name: file.name,
        });
      }
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleSelectEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  return (
    <div className="relative p-4 px-6 border-t border-slate-100 bg-white/95 backdrop-blur shrink-0">
      {/* Attachment Preview Chip */}
      {attachment && (
        <div className="mb-2.5 inline-flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 animate-fadeIn">
          {attachment.type === 'image' ? (
            <img
              src={attachment.url}
              alt="Preview"
              className="w-8 h-8 rounded-lg object-cover border border-slate-200"
            />
          ) : (
            <Paperclip size={16} className="text-slate-500 ml-1" />
          )}
          <span className="truncate max-w-[200px] font-medium">{attachment.name}</span>
          <button
            type="button"
            onClick={() => setAttachment(null)}
            className="p-1 rounded-full hover:bg-slate-200 text-slate-500 hover:text-rose-500 transition"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Emoji Quick Drawer */}
      {showEmojiPicker && (
        <div className="mb-2 p-2.5 bg-white border border-slate-200 rounded-2xl shadow-lg flex flex-wrap gap-1.5 max-w-sm animate-fadeIn">
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleSelectEmoji(emoji)}
              className="text-lg hover:scale-125 transition-transform p-1 rounded hover:bg-slate-100"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt"
        />

        {/* Outer Input Box */}
        <div className="flex-1 bg-white border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 rounded-2xl px-3 py-2 flex items-center gap-2 transition">
          {/* Attachment button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Add attachment"
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition shrink-0"
          >
            <Paperclip size={18} />
          </button>

          {/* Emoji button */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Choose emoji"
            className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-slate-100 rounded-lg transition shrink-0"
          >
            <Smile size={18} />
          </button>

          {/* Text Input */}
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={handleInputChange}
            placeholder={placeholder}
            autoFocus
            className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none py-1"
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!text.trim() && !attachment}
          className="w-11 h-11 rounded-2xl bg-[#2563eb] hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-[#2563eb] text-white flex items-center justify-center transition shadow-sm shadow-blue-500/20 shrink-0 cursor-pointer"
          title="Send message (Enter)"
        >
          <ArrowUp size={18} strokeWidth={2.5} />
        </button>
      </form>
    </div>
  );
};
