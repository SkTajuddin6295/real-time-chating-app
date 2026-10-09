/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { ArrowRight, Zap, X, Share2, Check } from 'lucide-react';
import { ChatMessage, UserProfile } from './types/chat';
import { ChatMessageItem } from './components/ChatMessageItem';
import { ChatHeader } from './components/ChatHeader';
import { ChatInput } from './components/ChatInput';
import { DualChatDemonstrator } from './components/DualChatDemonstrator';
import { ShareDeviceModal } from './components/ShareDeviceModal';

const DEMO_PROFILES: UserProfile[] = [
  {
    id: 'user_raj_101',
    name: 'Raj',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Raj',
    status: 'online',
    role: 'Product Lead',
  },
  {
    id: 'user_taj_202',
    name: 'Taj',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Taj',
    status: 'online',
    role: 'Frontend Engineer',
  },
  {
    id: 'user_elena_303',
    name: 'Elena',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena',
    status: 'online',
    role: 'Designer',
  },
];

// Helper to get or initialize a unique persistent user profile for each visitor / browser
function getInitialProfile(): UserProfile {
  try {
    const saved = localStorage.getItem('commonroom_user_profile');
    if (saved) return JSON.parse(saved);
  } catch {}

  const randomNum = Math.floor(100 + Math.random() * 900);
  const randomId = 'usr_' + Math.random().toString(36).substring(2, 8);
  return {
    id: randomId,
    name: `Guest ${randomNum}`,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomId}`,
    status: 'online',
  };
}

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [hasJoined, setHasJoined] = useState(() => {
    try {
      return localStorage.getItem('commonroom_has_joined') === 'true';
    } catch {
      return false;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(getInitialProfile);
  const [nameInput, setNameInput] = useState(() => {
    const initial = getInitialProfile();
    return initial.name.startsWith('Guest') ? '' : initial.name;
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [typingUser, setTypingUser] = useState('');
  const [systemNotification, setSystemNotification] = useState<string | null>(null);
  const [activeImageModal, setActiveImageModal] = useState<string | null>(null);
  const [showDemonstrator, setShowDemonstrator] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

  const getSharedUrl = () => {
    let url = window.location.href;
    if (url.includes('ais-dev-')) {
      url = url.replace('ais-dev-', 'ais-pre-');
    }
    return url;
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Real-time Socket.io Connection
  useEffect(() => {
    // Enable polling + websocket for universal connectivity across all browsers, mobile devices, and proxies
    const s = io({
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
    });

    setSocket(s);

    s.on('connect', () => {
      setIsConnected(true);
      s.emit('join_room', {
        userId: currentUser.id,
        username: currentUser.name,
        avatar: currentUser.avatar,
        room: 'general',
      });
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.on('room_history', (history: ChatMessage[]) => {
      setMessages(history || []);
    });

    s.on('receive_message', (newMsg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === newMsg._id)) return prev;
        return [...prev, newMsg];
      });

      if (newMsg.senderId !== currentUser.id) {
        playNotificationTone();
      }
    });

    s.on('room_users', (data: { room: string; users: Array<{ id: string; userId?: string; username: string }> }) => {
      if (data?.users) {
        setOnlineCount(data.users.length);
      }
    });

    s.on('user_joined', (data: { username: string; userId?: string }) => {
      if (data.username && data.userId !== currentUser.id) {
        showTemporaryNotice(`${data.username} joined the room`);
      }
    });

    s.on('user_left', (data: { username: string }) => {
      if (data.username && data.username !== currentUser.name) {
        showTemporaryNotice(`${data.username} left the room`);
      }
    });

    s.on('user_typing', (data: { username: string }) => {
      if (data.username !== currentUser.name) {
        setTypingUser(data.username);
      }
    });

    s.on('user_stop_typing', () => {
      setTypingUser('');
    });

    return () => {
      s.disconnect();
    };
  }, [currentUser.id, currentUser.name, currentUser.avatar]);

  // Save profile and join status to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('commonroom_user_profile', JSON.stringify(currentUser));
      localStorage.setItem('commonroom_has_joined', hasJoined ? 'true' : 'false');
    } catch {}
  }, [currentUser, hasJoined]);

  // Auto-scroll to bottom on message updates
  useEffect(() => {
    if (hasJoined) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typingUser, hasJoined]);

  const showTemporaryNotice = (text: string) => {
    setSystemNotification(text);
    setTimeout(() => {
      setSystemNotification((curr) => (curr === text ? null : curr));
    }, 3500);
  };

  const playNotificationTone = () => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(580, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch {}
  };

  // Join Room with chosen Name
  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = nameInput.trim() || currentUser.name;

    // Check if name matches a demo profile
    const matched = DEMO_PROFILES.find((p) => p.name.toLowerCase() === cleanName.toLowerCase());
    const profileToUse: UserProfile = matched
      ? { ...matched, id: `${matched.id}_${Math.random().toString(36).substring(2, 6)}` } // unique instance per browser
      : {
          id: currentUser.id,
          name: cleanName,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanName}`,
          status: 'online',
        };

    setCurrentUser(profileToUse);
    setHasJoined(true);

    if (socket) {
      socket.emit('join_room', {
        userId: profileToUse.id,
        username: profileToUse.name,
        avatar: profileToUse.avatar,
        room: 'general',
      });
    }
  };

  // Instant Guest Quick Join (No typing needed)
  const handleQuickGuestJoin = () => {
    setHasJoined(true);
    if (socket) {
      socket.emit('join_room', {
        userId: currentUser.id,
        username: currentUser.name,
        avatar: currentUser.avatar,
        room: 'general',
      });
    }
  };

  // Send message
  const handleSendMessage = (
    text: string,
    attachment?: { url: string; type: 'image' | 'file'; name: string }
  ) => {
    if (!socket || (!text.trim() && !attachment)) return;

    const payload = {
      senderId: currentUser.id, // DYNAMIC UNIQUE ID
      username: currentUser.name,
      room: 'general',
      text: text.trim(),
      avatar: currentUser.avatar,
      attachmentUrl: attachment?.url,
      attachmentType: attachment?.type,
      attachmentName: attachment?.name,
    };

    socket.emit('send_message', payload);
  };

  // Typing debounce
  const handleTyping = () => {
    if (!socket) return;
    socket.emit('typing', { username: currentUser.name, room: 'general' });
  };

  const handleStopTyping = () => {
    if (!socket) return;
    socket.emit('stop_typing', { username: currentUser.name, room: 'general' });
  };

  // Switch demo user to verify left-right alignment dynamically
  const handleSwitchUser = (newProfile: UserProfile) => {
    const updated = {
      ...newProfile,
      id: `${newProfile.id}_${Math.random().toString(36).substring(2, 5)}`,
    };
    setCurrentUser(updated);
    if (socket) {
      socket.emit('join_room', {
        userId: updated.id,
        username: updated.name,
        avatar: updated.avatar,
        room: 'general',
      });
    }
  };

  const handleLeaveRoom = () => {
    setHasJoined(false);
    try {
      localStorage.setItem('commonroom_has_joined', 'false');
    } catch {}
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f7fb] text-slate-800 flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900">
      {/* TOP BRAND HEADER */}
      <header className="w-full px-6 sm:px-12 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#2563eb] flex items-center justify-center p-1.5 shadow-sm shadow-blue-500/20">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-full h-full text-white"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            >
              <line x1="6" y1="9" x2="6" y2="15" />
              <line x1="12" y1="6" x2="12" y2="18" />
              <line x1="18" y1="9" x2="18" y2="15" />
            </svg>
          </div>
          <span className="font-bold text-slate-900 text-lg tracking-tight">commonroom</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs sm:text-sm text-slate-400 font-normal hidden sm:inline">
            A little space to talk
          </span>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-8 py-4 sm:py-6">
        {!hasJoined ? (
          /* ================= SCREEN 1: INSTANT ACCESS ONBOARDING ================= */
          <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-[460px]">
            {/* Left Graphic Side */}
            <div className="relative bg-gradient-to-br from-blue-50/70 via-[#f8fafc] to-amber-50/40 p-8 flex items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r border-slate-100">
              <div className="absolute w-72 h-44 border border-blue-200/60 rounded-full rotate-[-20deg] pointer-events-none" />
              <div className="absolute w-80 h-48 border border-slate-200/50 rounded-full rotate-[15deg] pointer-events-none" />

              <div className="w-44 h-44 rounded-full bg-[#fef08a]/60 blur-xs shadow-inner flex items-center justify-center relative">
                <div className="w-32 h-32 rounded-full bg-[#fde047]/30 blur-sm" />
              </div>

              {/* Floating Chat Bubbles */}
              <div className="absolute top-20 left-8 sm:left-12 bg-white/95 backdrop-blur px-3.5 py-1.5 rounded-xl shadow-[0_8px_20px_rgba(0,0,0,0.06)] border border-slate-100/80 text-xs font-medium text-slate-700 flex items-center gap-1.5 animate-bounce [animation-duration:5s]">
                <span>hey there</span>
                <span className="text-amber-500 text-sm">✳</span>
              </div>

              <div className="absolute bottom-16 right-8 sm:right-12 bg-white/95 backdrop-blur px-3.5 py-1.5 rounded-xl shadow-[0_8px_20px_rgba(0,0,0,0.06)] border border-slate-100/80 text-xs font-medium text-slate-700 flex items-center gap-2 animate-bounce [animation-duration:6s] [animation-delay:1s]">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>good to see you</span>
              </div>
            </div>

            {/* Right Form Side */}
            <div className="p-8 sm:p-12 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-slate-500 uppercase mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                <span>Open to everyone · No login required</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                Good conversations <br />
                start <span className="text-[#2563eb]">right here.</span>
              </h2>

              <p className="text-sm text-slate-500 mt-3 mb-6 leading-relaxed">
                Drop in, say hello, and catch up with everyone in the room. Anyone with the link can join!
              </p>

              <form onSubmit={handleJoin} className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-2">
                    What should we call you?
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder={currentUser.name || 'Your name'}
                      maxLength={25}
                      autoFocus
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                    />

                    <button
                      type="submit"
                      className="px-5 py-3 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white font-medium text-sm flex items-center justify-center gap-2 transition shadow-sm shadow-blue-500/20 shrink-0 cursor-pointer"
                    >
                      <span>Join Room</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>

                {/* Instant 1-Click Guest Join & Demonstrator Options */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleQuickGuestJoin}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1.5 hover:underline cursor-pointer"
                  >
                    <Zap size={13} className="text-amber-500" />
                    <span>Quick Join as {currentUser.name} (1-Click)</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowShareModal(true)}
                      className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <span>📱 QR / Other Device</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowDemonstrator(true)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <span>⚡ Split-View</span>
                    </button>
                  </div>
                </div>

                {/* Demo Names Quick Selection */}
                <div className="pt-2">
                  <span className="text-[11px] text-slate-400 font-medium block mb-1.5">
                    Or choose a name:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {DEMO_PROFILES.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setNameInput(p.name)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition flex items-center gap-1.5 ${
                          nameInput.toLowerCase() === p.name.toLowerCase()
                            ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <img src={p.avatar} alt={p.name} className="w-4 h-4 rounded-full" />
                        <span>{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-1.5 pt-2">
                  <span className="text-emerald-600">✦</span>
                  <span>No passwords or signups. Just be kind and respectful.</span>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* ================= SCREEN 2: ACTIVE LIVE CHAT ROOM ================= */
          <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col h-[82vh] min-h-[560px]">
            {/* Chat Header with Share Link and Online Count */}
            <ChatHeader
              roomTitle="The common room"
              isConnected={isConnected}
              onlineCount={onlineCount}
              currentUser={currentUser}
              availableUsers={DEMO_PROFILES}
              onSwitchUser={handleSwitchUser}
              onLeaveRoom={handleLeaveRoom}
              onOpenDemonstrator={() => setShowDemonstrator(true)}
              onOpenShareModal={() => setShowShareModal(true)}
            />

            {/* Conversation Subheader */}
            <div className="relative py-2.5 px-6 flex items-center justify-center shrink-0 bg-white">
              <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 h-px bg-slate-100" />
              <span className="relative bg-white px-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                The conversation
              </span>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-1 py-12">
                  <span className="text-2xl text-blue-400">✳</span>
                  <p className="text-xs font-medium text-slate-500">The room is calm and quiet.</p>
                  <p className="text-xs text-slate-400">
                    Send a message below or share the link to chat with friends in real time!
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <ChatMessageItem
                    key={msg._id}
                    message={msg}
                    currentUserId={currentUser.id} // DYNAMIC COMPARISON
                    formatTime={formatTime}
                    onImageClick={(url) => setActiveImageModal(url)}
                  />
                ))
              )}

              {/* System Join/Leave Notification Toast */}
              {systemNotification && (
                <div className="text-center py-1">
                  <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[11px] font-medium animate-fadeIn border border-slate-200/70">
                    {systemNotification}
                  </span>
                </div>
              )}

              {/* Typing indicator */}
              {typingUser && (
                <div className="text-xs text-slate-400 italic pt-1 animate-pulse flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>{typingUser} is typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Fixed Message Input at Bottom */}
            <ChatInput
              onSendMessage={handleSendMessage}
              onTyping={handleTyping}
              onStopTyping={handleStopTyping}
              placeholder={`Write a message to everyone as ${currentUser.name}...`}
            />

            {/* Card Footer */}
            <div className="px-6 py-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 shrink-0 bg-slate-50/50">
              <span className="flex items-center gap-1.5">
                <span>Made for good conversations.</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500 font-medium">{onlineCount} online</span>
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                Be the reason someone smiles <span className="text-emerald-500 font-bold">✳</span>
              </span>
            </div>
          </div>
        )}
      </main>

      {/* PAGE BOTTOM FOOTER */}
      <footer className="w-full py-4 text-center text-xs text-slate-400">
        A calmer corner of the internet · Just for you and your people
      </footer>

      {/* Lightbox Image Preview Modal */}
      {activeImageModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveImageModal(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <button
              onClick={() => setActiveImageModal(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300 p-1"
            >
              <X size={24} />
            </button>
            <img
              src={activeImageModal}
              alt="Full size attachment"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Dual Client Live Demonstrator Modal */}
      <DualChatDemonstrator
        isOpen={showDemonstrator}
        onClose={() => setShowDemonstrator(false)}
        messages={messages}
        onSendMessage={(senderId, username, text, attachmentUrl, attachmentType) => {
          if (!socket) return;
          socket.emit('send_message', {
            senderId,
            username,
            room: 'general',
            text,
            attachmentUrl,
            attachmentType,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
          });
        }}
        onTyping={(username) => {
          if (!socket) return;
          socket.emit('typing', { username, room: 'general' });
        }}
        onStopTyping={(username) => {
          if (!socket) return;
          socket.emit('stop_typing', { username, room: 'general' });
        }}
        formatTime={formatTime}
      />

      {/* Share / Mobile Access QR Code Modal */}
      <ShareDeviceModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        sharedUrl={getSharedUrl()}
      />
    </div>
  );
}
