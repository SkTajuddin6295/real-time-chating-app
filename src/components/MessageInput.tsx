import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  onTyping: () => void;
  onStopTyping: () => void;
  typingUsers: string[];
  currentRoom: string;
}

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '🚀', '🎉', '😂', '✨', '👋'];

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onTyping,
  onStopTyping,
  typingUsers,
  currentRoom,
}) => {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    onTyping();

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onStopTyping();
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    onSendMessage(text.trim());
    setText('');
    onStopTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleAddEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="border-t border-slate-800 bg-slate-900/90 backdrop-blur px-4 pt-2 pb-3 shrink-0">
      {/* Typing Indicator Bar */}
      <div className="h-5 flex items-center gap-2 text-xs text-slate-400 mb-1 px-1">
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-1.5 animate-pulse text-blue-400 font-medium">
            <span className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            </span>
            <span>
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        )}
      </div>

      {/* Quick Emojis Bar */}
      <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1 text-sm select-none">
        <span className="text-[11px] text-slate-500 font-medium mr-1 hidden sm:inline">
          Quick:
        </span>
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => handleAddEmoji(emoji)}
            className="hover:scale-125 transition-transform px-1 py-0.5 rounded hover:bg-slate-800"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700/80 focus-within:border-blue-500 transition px-3 py-2 flex items-center gap-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={`Message #${currentRoom} (Press Enter to send)...`}
            className="w-full bg-transparent text-xs sm:text-sm text-white resize-none outline-none max-h-28 placeholder:text-slate-500"
          />
        </div>

        <button
          type="submit"
          disabled={!text.trim()}
          className="h-10 w-10 sm:h-10 sm:w-auto sm:px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-sm shadow-blue-600/30 shrink-0"
        >
          <Send size={15} />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
};
