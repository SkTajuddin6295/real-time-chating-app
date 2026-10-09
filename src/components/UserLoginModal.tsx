import React, { useState } from 'react';
import { MessageSquare, ArrowRight } from 'lucide-react';

interface UserLoginModalProps {
  isOpen: boolean;
  initialUsername: string;
  initialAvatar: string;
  onJoin: (username: string, avatar: string, room: string) => void;
  availableRooms: string[];
}

const AVATAR_OPTIONS = ['🤖', '🦊', '🐱', '🥷', '👨‍🚀', '👾', '⚡', '👩‍💻'];

export const UserLoginModal: React.FC<UserLoginModalProps> = ({
  isOpen,
  initialUsername,
  initialAvatar,
  onJoin,
  availableRooms,
}) => {
  const [username, setUsername] = useState(initialUsername || 'User' + Math.floor(100 + Math.random() * 900));
  const [avatar, setAvatar] = useState(initialAvatar || '🤖');
  const [room, setRoom] = useState(availableRooms[0] || 'general');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    onJoin(username.trim(), avatar, room);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 text-slate-100">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl mx-auto mb-3 shadow-lg shadow-blue-500/20">
            💬
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Join MERN Chat</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-room messaging with Express, MongoDB & Socket.io
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Your Display Name
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Alex, Sam, DevMaster"
              maxLength={25}
              required
              className="w-full bg-slate-800 text-sm text-white px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Choose an Avatar
            </label>
            <div className="grid grid-cols-4 gap-2">
              {AVATAR_OPTIONS.map((av) => (
                <button
                  key={av}
                  type="button"
                  onClick={() => setAvatar(av)}
                  className={`py-2 rounded-xl text-2xl flex items-center justify-center border transition ${
                    avatar === av
                      ? 'bg-blue-600/20 border-blue-500 scale-105'
                      : 'bg-slate-800/70 border-slate-700/60 hover:bg-slate-800'
                  }`}
                >
                  {av}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Starting Channel
            </label>
            <select
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="w-full bg-slate-800 text-sm text-white px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-500 transition"
            >
              {availableRooms.map((r) => (
                <option key={r} value={r}>
                  #{r}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/30 mt-6"
          >
            <span>Enter Chat</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
