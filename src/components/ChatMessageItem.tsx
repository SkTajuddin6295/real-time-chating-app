import React from 'react';
import { Check, CheckCheck, FileText, Image as ImageIcon } from 'lucide-react';
import { ChatMessage } from '../types/chat';

interface ChatMessageItemProps {
  message: ChatMessage;
  currentUserId: string;
  formatTime: (isoString: string) => string;
  onImageClick?: (url: string) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  currentUserId,
  formatTime,
  onImageClick,
}) => {
  // Determine alignment dynamically by comparing message senderId with current logged-in user's unique ID
  const isOwn = message.senderId === currentUserId;

  const renderStatus = () => {
    if (!isOwn) return null;

    if (message.status === 'read') {
      return (
        <span title="Read" className="text-blue-200 inline-flex items-center ml-1">
          <CheckCheck size={14} strokeWidth={2.2} />
        </span>
      );
    }

    if (message.status === 'delivered') {
      return (
        <span title="Delivered" className="text-blue-200/80 inline-flex items-center ml-1">
          <CheckCheck size={14} strokeWidth={2} />
        </span>
      );
    }

    return (
      <span title="Sent" className="text-blue-200/70 inline-flex items-center ml-1">
        <Check size={13} strokeWidth={2} />
      </span>
    );
  };

  return (
    <div
      className={`flex flex-col max-w-[85%] sm:max-w-[72%] space-y-1 transition-all ${
        isOwn ? 'ml-auto items-end text-right' : 'mr-auto items-start text-left'
      }`}
    >
      {/* Sender name & Timestamp Header */}
      <div
        className={`flex items-center gap-2 text-[11px] font-medium text-slate-500 px-1 ${
          isOwn ? 'flex-row-reverse text-right' : 'text-left'
        }`}
      >
        <span className={isOwn ? 'text-blue-600 font-semibold' : 'text-slate-700 font-semibold'}>
          {message.username} {isOwn ? '(You)' : ''}
        </span>
        <span className="text-slate-400 text-[10px]">
          {formatTime(message.createdAt)}
        </span>
      </div>

      {/* Message Bubble */}
      <div
        className={`relative px-4 py-2.5 rounded-2xl break-words leading-relaxed text-sm shadow-xs ${
          isOwn
            ? 'bg-[#2563eb] text-white rounded-tr-xs shadow-blue-500/10'
            : 'bg-[#f1f5f9] text-slate-800 rounded-tl-xs border border-slate-100'
        }`}
      >
        {/* Attachment preview if present */}
        {message.attachmentUrl && (
          <div className="mb-2 overflow-hidden rounded-xl">
            {message.attachmentType === 'image' ? (
              <img
                src={message.attachmentUrl}
                alt={message.attachmentName || 'Attachment'}
                onClick={() => onImageClick?.(message.attachmentUrl!)}
                className="max-h-60 w-auto rounded-lg object-cover cursor-pointer hover:opacity-95 transition"
                loading="lazy"
              />
            ) : (
              <div
                className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium ${
                  isOwn ? 'bg-blue-700/60 text-white' : 'bg-slate-200/80 text-slate-800'
                }`}
              >
                <FileText size={16} />
                <span className="truncate max-w-[180px]">
                  {message.attachmentName || 'Attachment file'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Message Text */}
        {message.text && (
          <p className="whitespace-pre-wrap select-text">{message.text}</p>
        )}

        {/* Inline timestamp & status checks for sent messages */}
        <div
          className={`flex items-center gap-1 mt-1 text-[10px] select-none ${
            isOwn ? 'justify-end text-blue-100/90' : 'justify-end text-slate-400'
          }`}
        >
          <span>{formatTime(message.createdAt)}</span>
          {renderStatus()}
        </div>
      </div>
    </div>
  );
};
