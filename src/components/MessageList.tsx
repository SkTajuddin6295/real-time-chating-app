import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../types/chat';
import { SmilePlus, Hash } from 'lucide-react';

interface MessageListProps {
  messages: ChatMessage[];
  currentUser: string;
  currentRoom: string;
  searchQuery: string;
  onAddReaction: (messageId: string, emoji: string) => void;
}

const COMMON_REACTIONS = ['👍', '❤️', '🔥', '😂', '🚀', '🎉'];

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUser,
  currentRoom,
  searchQuery,
  onAddReaction,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filteredMessages = messages.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return m.text.toLowerCase().includes(q) || m.username.toLowerCase().includes(q);
  });

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {/* Welcome Banner */}
      <div className="py-6 px-4 bg-slate-900/60 rounded-xl border border-slate-800 text-center max-w-lg mx-auto">
        <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-2 text-xl font-bold">
          <Hash size={20} />
        </div>
        <h3 className="text-sm font-semibold text-white mb-1">
          Welcome to #{currentRoom}
        </h3>
        <p className="text-xs text-slate-400">
          Messages in this channel are broadcasted live to all connected Socket.io clients and saved in MongoDB/memory.
        </p>
      </div>

      {/* Messages */}
      {filteredMessages.length === 0 ? (
        <div className="text-center py-8 text-xs text-slate-500">
          {searchQuery ? 'No messages match your search filter.' : 'No messages yet. Send the first message!'}
        </div>
      ) : (
        filteredMessages.map((msg) => {
          const isMe = msg.username === currentUser;

          // Group reactions by emoji
          const reactionCounts: Record<string, { count: number; users: string[] }> = {};
          (msg.reactions || []).forEach((r) => {
            if (!reactionCounts[r.emoji]) {
              reactionCounts[r.emoji] = { count: 0, users: [] };
            }
            reactionCounts[r.emoji].count += 1;
            reactionCounts[r.emoji].users.push(r.username);
          });

          return (
            <div
              key={msg._id}
              className={`flex gap-2.5 max-w-[85%] group ${
                isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 select-none border ${
                  isMe
                    ? 'bg-blue-600/20 border-blue-500/30'
                    : 'bg-slate-800 border-slate-700'
                }`}
              >
                {msg.avatar || '👤'}
              </div>

              {/* Message Content */}
              <div className={`space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                {/* Meta */}
                <div
                  className={`flex items-baseline gap-2 text-[11px] ${
                    isMe ? 'flex-row-reverse' : ''
                  }`}
                >
                  <span className="font-semibold text-slate-300">
                    {msg.username} {isMe ? '(you)' : ''}
                  </span>
                  <span className="text-slate-500 text-[10px]">
                    {formatTimestamp(msg.createdAt)}
                  </span>
                </div>

                {/* Bubble */}
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed break-words shadow-sm ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-slate-800 text-slate-100 border border-slate-700/70 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Reactions & Reaction Bar */}
                <div
                  className={`flex items-center flex-wrap gap-1 pt-0.5 ${
                    isMe ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {Object.entries(reactionCounts).map(([emoji, data]) => {
                    const hasMyReaction = data.users.includes(currentUser);
                    return (
                      <button
                        key={emoji}
                        onClick={() => onAddReaction(msg._id, emoji)}
                        title={`Reacted by: ${data.users.join(', ')}`}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] border transition ${
                          hasMyReaction
                            ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                            : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <span>{emoji}</span>
                        <span className="text-[10px] font-mono">{data.count}</span>
                      </button>
                    );
                  })}

                  {/* Quick Add Reaction Popover trigger */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-slate-900 border border-slate-700/80 rounded-full px-1 py-0.5">
                    {COMMON_REACTIONS.slice(0, 4).map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => onAddReaction(msg._id, emoji)}
                        className="hover:scale-125 transition-transform px-0.5 text-xs"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}

      <div ref={bottomRef} />
    </div>
  );
};
