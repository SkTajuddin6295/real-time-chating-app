import React, { useState } from 'react';
import { 
  Hash, 
  Users, 
  Plus, 
  Volume2, 
  VolumeX, 
  Code2, 
  Radio, 
  Layers, 
  ExternalLink,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { RoomMeta, RoomUser } from '../types/chat';

interface SidebarProps {
  currentRoom: string;
  rooms: RoomMeta[];
  onlineUsers: RoomUser[];
  username: string;
  avatar: string;
  isConnected: boolean;
  soundEnabled: boolean;
  onSelectRoom: (room: string) => void;
  onCreateRoom: (room: string) => void;
  onToggleSound: () => void;
  onOpenCodeViewer: () => void;
  onOpenMultiUserTester: () => void;
  onOpenVanillaPreview: () => void;
  onChangeUser: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoom,
  rooms,
  onlineUsers,
  username,
  avatar,
  isConnected,
  soundEnabled,
  onSelectRoom,
  onCreateRoom,
  onToggleSound,
  onOpenCodeViewer,
  onOpenMultiUserTester,
  onOpenVanillaPreview,
  onChangeUser,
}) => {
  const [newRoomInput, setNewRoomInput] = useState('');
  const [isAddingRoom, setIsAddingRoom] = useState(false);

  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomInput.trim()) return;
    const sanitized = newRoomInput.trim().toLowerCase().replace(/\s+/g, '-');
    onCreateRoom(sanitized);
    setNewRoomInput('');
    setIsAddingRoom(false);
  };

  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col h-full select-none shrink-0 text-slate-200">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/20">
            💬
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              MERN Chat
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-medium">
                v1.0
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Node • Express • Socket.io</p>
          </div>
        </div>

        {/* Live Socket Connection Badge */}
        <div 
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
            isConnected 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          }`}
          title={isConnected ? 'Connected to live Socket.io server' : 'Disconnected from server'}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
          {isConnected ? 'Live' : 'Offline'}
        </div>
      </div>

      {/* Current User Card */}
      <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-base border border-slate-700 shrink-0">
            {avatar}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-white truncate">{username}</div>
            <div className="text-[11px] text-blue-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              #{currentRoom}
            </div>
          </div>
        </div>
        <button
          onClick={onChangeUser}
          title="Switch User / Persona"
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition text-xs flex items-center"
        >
          <LogOut size={13} />
        </button>
      </div>

      {/* Channels Section */}
      <div className="px-3 py-3 border-b border-slate-800/60">
        <div className="flex items-center justify-between px-2 mb-1.5">
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            Channels
          </span>
          <button
            onClick={() => setIsAddingRoom(!isAddingRoom)}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
            title="Create channel"
          >
            <Plus size={14} />
          </button>
        </div>

        {isAddingRoom && (
          <form onSubmit={handleAddRoom} className="mb-2 px-1">
            <input
              type="text"
              value={newRoomInput}
              onChange={(e) => setNewRoomInput(e.target.value)}
              placeholder="channel-name"
              autoFocus
              className="w-full bg-slate-800 text-xs text-white rounded px-2.5 py-1.5 border border-slate-700 focus:outline-none focus:border-blue-500"
            />
          </form>
        )}

        <div className="space-y-0.5 max-h-40 overflow-y-auto pr-1">
          {rooms.map((room) => {
            const isActive = room.name === currentRoom;
            return (
              <button
                key={room.name}
                onClick={() => onSelectRoom(room.name)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Hash size={13} className={isActive ? 'text-white' : 'text-slate-500'} />
                  <span className="truncate">{room.name}</span>
                </div>
                {room.onlineCount > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-blue-700 text-blue-100' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {room.onlineCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Online Users In Current Room */}
      <div className="flex-1 px-3 py-3 overflow-y-auto">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
            <Users size={12} />
            In Room ({onlineUsers.length})
          </span>
        </div>

        <div className="space-y-1">
          {onlineUsers.length === 0 ? (
            <div className="text-xs text-slate-500 italic px-2 py-1">No other users online</div>
          ) : (
            onlineUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between px-2.5 py-1.5 rounded text-xs text-slate-300 hover:bg-slate-800/50"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-sm shrink-0">{user.avatar || '👤'}</span>
                  <span className="truncate">
                    {user.username} {user.username === username ? '(you)' : ''}
                  </span>
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Tools & Architecture Inspection */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 space-y-1.5">
        <button
          onClick={onOpenCodeViewer}
          className="w-full flex items-center justify-between px-2.5 py-2 rounded-md bg-slate-800/80 hover:bg-slate-800 text-xs text-slate-200 transition font-medium border border-slate-700/60"
        >
          <div className="flex items-center gap-2">
            <Code2 size={14} className="text-blue-400" />
            <span>MERN Code Inspector</span>
          </div>
          <ChevronRight size={13} className="text-slate-500" />
        </button>

        <button
          onClick={onOpenMultiUserTester}
          className="w-full flex items-center justify-between px-2.5 py-2 rounded-md bg-slate-800/80 hover:bg-slate-800 text-xs text-slate-200 transition font-medium border border-slate-700/60"
        >
          <div className="flex items-center gap-2">
            <Radio size={14} className="text-emerald-400" />
            <span>Multi-User Tester</span>
          </div>
          <ChevronRight size={13} className="text-slate-500" />
        </button>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={onToggleSound}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded bg-slate-800/60 hover:bg-slate-800 text-[11px] text-slate-400 hover:text-white transition"
            title="Toggle sound effects"
          >
            {soundEnabled ? <Volume2 size={13} className="text-emerald-400" /> : <VolumeX size={13} />}
            <span>{soundEnabled ? 'Sound On' : 'Muted'}</span>
          </button>

          <button
            onClick={onOpenVanillaPreview}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded bg-slate-800/60 hover:bg-slate-800 text-[11px] text-slate-400 hover:text-white transition"
            title="Preview Vanilla HTML Client"
          >
            <Layers size={13} className="text-amber-400" />
            <span>Vanilla UI</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
