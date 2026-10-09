import React, { useState } from 'react';
import { LogOut, Share2, Check, ExternalLink, Users } from 'lucide-react';
import { UserProfile } from '../types/chat';

interface ChatHeaderProps {
  roomTitle: string;
  isConnected: boolean;
  onlineCount: number;
  currentUser: UserProfile;
  availableUsers: UserProfile[];
  onSwitchUser: (user: UserProfile) => void;
  onLeaveRoom: () => void;
  onOpenDemonstrator: () => void;
  onOpenShareModal: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  roomTitle,
  isConnected,
  onlineCount,
  currentUser,
  availableUsers,
  onSwitchUser,
  onLeaveRoom,
  onOpenDemonstrator,
  onOpenShareModal,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    let url = window.location.href;
    if (url.includes('ais-dev-')) {
      url = url.replace('ais-dev-', 'ais-pre-');
    }
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenSecondWindow = () => {
    let url = window.location.href;
    if (url.includes('ais-dev-')) {
      url = url.replace('ais-dev-', 'ais-pre-');
    }
    window.open(url, '_blank');
  };

  return (
    <div className="px-5 sm:px-6 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
      {/* Left Room Details */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg font-bold border border-blue-100/60 shadow-xs">
          <span className="text-blue-500 text-lg">✳</span>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 leading-tight">
              {roomTitle}
            </h2>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {onlineCount} {onlineCount === 1 ? 'person' : 'people'} online
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isConnected ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            <span>{isConnected ? 'Live & open to everyone' : 'Connecting...'}</span>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-200 mx-1 hidden lg:block" />

        <div className="hidden lg:block">
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block leading-none mb-1">
            Public Room
          </span>
          <span className="text-xs text-slate-500 leading-none">
            Anyone with the link can chat
          </span>
        </div>
      </div>

      {/* Right: Actions, Demonstrator, Share Link & User Pill */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Live Demonstrator Button */}
        <button
          onClick={onOpenDemonstrator}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold transition shadow-sm shadow-blue-500/20 cursor-pointer"
          title="Open Split-Screen Dual-User Demonstrator"
        >
          <span>⚡ Demonstrator</span>
        </button>

        {/* Mobile / Other Device QR Button */}
        <button
          onClick={onOpenShareModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold transition border border-slate-200 shadow-xs cursor-pointer"
          title="Open QR Code & Public Link for phones & other devices"
        >
          <span>📱 Other Device</span>
        </button>

        {/* Share Link Button */}
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100/80 text-blue-700 text-xs font-semibold transition border border-blue-200/60 shadow-xs cursor-pointer"
          title="Copy chat link to share with anyone"
        >
          {copied ? (
            <>
              <Check size={13} className="text-emerald-600" />
              <span className="text-emerald-700">Link Copied!</span>
            </>
          ) : (
            <>
              <Share2 size={13} />
              <span className="hidden sm:inline">Share Chat</span>
            </>
          )}
        </button>

        {/* Open in second tab button for testing */}
        <button
          onClick={handleOpenSecondWindow}
          className="hidden sm:flex items-center gap-1 p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 text-xs transition border border-slate-200/70"
          title="Open in new window to test multi-user chat"
        >
          <ExternalLink size={13} />
          <span className="text-[11px]">2nd Tab</span>
        </button>

        {/* Identity Switcher Dropdown */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 rounded-xl px-2 py-1 text-xs">
          <span className="text-[11px] text-slate-400 font-medium">As:</span>
          <select
            value={currentUser.id}
            onChange={(e) => {
              const selected = availableUsers.find((u) => u.id === e.target.value);
              if (selected) onSwitchUser(selected);
            }}
            className="bg-transparent text-xs font-semibold text-slate-800 outline-none cursor-pointer"
            title="Switch demo user"
          >
            {availableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        {/* Current User Profile Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-xs shadow-xs">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-5 h-5 rounded-full bg-blue-100 object-cover"
          />
          <span className="font-semibold text-slate-800 max-w-[80px] sm:max-w-[120px] truncate">
            {currentUser.name}
          </span>
        </div>

        {/* Leave Room Button */}
        <button
          onClick={onLeaveRoom}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          title="Switch name / Leave Room"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
};
