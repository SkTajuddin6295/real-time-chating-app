import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Play, Sparkles, X, Smartphone, Check, CheckCheck, RefreshCw } from 'lucide-react';
import { ChatMessage, UserProfile } from '../types/chat';

interface DualChatDemonstratorProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (senderId: string, username: string, text: string, attachmentUrl?: string, attachmentType?: 'image' | 'file') => void;
  onTyping: (username: string) => void;
  onStopTyping: (username: string) => void;
  formatTime: (isoString: string) => string;
}

const USER_A: UserProfile = {
  id: 'user_raj_101',
  name: 'Raj',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Raj',
  status: 'online',
  role: 'Product Lead',
};

const USER_B: UserProfile = {
  id: 'user_taj_202',
  name: 'Taj',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Taj',
  status: 'online',
  role: 'Frontend Engineer',
};

const DEMO_SCRIPT = [
  { sender: USER_A, text: 'Hey Taj! How does the left-right message alignment look on your end?' },
  { sender: USER_B, text: 'Hey Raj! It looks fantastic. My messages are on my right, and yours are on my left!' },
  { sender: USER_A, text: 'Exactly! Notice the blue bubbles for sent messages and gray for received.' },
  { sender: USER_B, text: 'And real-time delivery ticks work instantly across both devices ✓✓' },
  {
    sender: USER_A,
    text: 'Check out this design preview attachment:',
    attachmentUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80',
    attachmentType: 'image' as const,
  },
  { sender: USER_B, text: 'Awesome! Seamless, real-time, and open to everyone.' },
];

export const DualChatDemonstrator: React.FC<DualChatDemonstratorProps> = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  onTyping,
  onStopTyping,
  formatTime,
}) => {
  const [inputA, setInputA] = useState('');
  const [inputB, setInputB] = useState('');
  const [isDemoPlaying, setIsDemoPlaying] = useState(false);
  const [typingState, setTypingState] = useState<{ [username: string]: boolean }>({});

  const listARef = useRef<HTMLDivElement>(null);
  const listBRef = useRef<HTMLDivElement>(null);

  // Auto-scroll both lists
  useEffect(() => {
    if (isOpen) {
      listARef.current?.scrollIntoView({ behavior: 'smooth' });
      listBRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typingState, isOpen]);

  if (!isOpen) return null;

  // Run automated live demonstration script
  const handlePlayScript = async () => {
    if (isDemoPlaying) return;
    setIsDemoPlaying(true);

    for (let i = 0; i < DEMO_SCRIPT.length; i++) {
      const step = DEMO_SCRIPT[i];

      // Simulate typing indicator
      setTypingState({ [step.sender.name]: true });
      onTyping(step.sender.name);
      await new Promise((r) => setTimeout(r, 900));

      // Stop typing & send message
      setTypingState({});
      onStopTyping(step.sender.name);
      onSendMessage(
        step.sender.id,
        step.sender.name,
        step.text,
        step.attachmentUrl,
        step.attachmentType
      );

      await new Promise((r) => setTimeout(r, 1200));
    }

    setIsDemoPlaying(false);
  };

  const handleSendA = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputA.trim()) return;
    onSendMessage(USER_A.id, USER_A.name, inputA.trim());
    setInputA('');
  };

  const handleSendB = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputB.trim()) return;
    onSendMessage(USER_B.id, USER_B.name, inputB.trim());
    setInputB('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col p-2 sm:p-4 animate-fadeIn">
      {/* Demonstrator Top Bar */}
      <div className="max-w-6xl w-full mx-auto bg-slate-900 border border-slate-800 rounded-2xl px-5 py-3 mb-3 flex items-center justify-between shadow-xl text-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight">Live Chat Demonstrator</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-medium">
                Split-View Mode
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Watch real-time Socket.io messages route dynamically between two live users side-by-side
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePlayScript}
            disabled={isDemoPlaying}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-sm shadow-blue-600/30 transition cursor-pointer"
          >
            <Play size={13} fill="currentColor" />
            <span>{isDemoPlaying ? 'Running Demo...' : '▶ Play Live Conversation'}</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Close Demonstrator"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Split Screens Grid */}
      <div className="flex-1 max-w-6xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-3 min-h-0">
        {/* ================= DEVICE 1: RAJ'S PERSPECTIVE ================= */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-lg flex flex-col overflow-hidden h-full">
          {/* Header A */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <img src={USER_A.avatar} alt="Raj" className="w-6 h-6 rounded-full bg-blue-100" />
              <div>
                <span className="text-xs font-bold text-slate-900 block leading-tight">
                  {USER_A.name}'s Device
                </span>
                <span className="text-[10px] text-blue-600 font-medium">
                  Own messages appear on RIGHT (Blue)
                </span>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
              ● Live Client 1
            </span>
          </div>

          {/* Messages Area A */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8fafc]/50">
            {messages.map((msg) => {
              const isOwn = msg.senderId === USER_A.id;
              return (
                <div
                  key={'devA_' + msg._id}
                  className={`flex flex-col max-w-[85%] space-y-0.5 ${
                    isOwn ? 'ml-auto items-end text-right' : 'mr-auto items-start text-left'
                  }`}
                >
                  <span className="text-[10px] text-slate-400 px-1 font-medium">
                    {msg.username} {isOwn ? '(You)' : ''} · {formatTime(msg.createdAt)}
                  </span>
                  <div
                    className={`px-3.5 py-2 rounded-2xl text-xs leading-relaxed break-words shadow-xs ${
                      isOwn
                        ? 'bg-[#2563eb] text-white rounded-tr-xs'
                        : 'bg-white text-slate-800 border border-slate-200/70 rounded-tl-xs'
                    }`}
                  >
                    {msg.attachmentUrl && (
                      <img
                        src={msg.attachmentUrl}
                        alt="attachment"
                        className="rounded-lg max-h-36 mb-1 object-cover"
                      />
                    )}
                    <span>{msg.text}</span>
                    {isOwn && (
                      <span className="inline-flex items-center ml-1.5 text-blue-200">
                        <CheckCheck size={12} />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {typingState[USER_B.name] && (
              <div className="text-[11px] text-slate-400 italic animate-pulse">
                {USER_B.name} is typing...
              </div>
            )}
            <div ref={listARef} />
          </div>

          {/* Input A */}
          <form onSubmit={handleSendA} className="p-2.5 border-t border-slate-100 bg-white flex gap-2">
            <input
              type="text"
              value={inputA}
              onChange={(e) => setInputA(e.target.value)}
              placeholder="Type message as Raj..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={!inputA.trim()}
              className="px-3 bg-[#2563eb] hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center justify-center transition"
            >
              <ArrowUp size={14} />
            </button>
          </form>
        </div>

        {/* ================= DEVICE 2: TAJ'S PERSPECTIVE ================= */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-lg flex flex-col overflow-hidden h-full">
          {/* Header B */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <img src={USER_B.avatar} alt="Taj" className="w-6 h-6 rounded-full bg-blue-100" />
              <div>
                <span className="text-xs font-bold text-slate-900 block leading-tight">
                  {USER_B.name}'s Device
                </span>
                <span className="text-[10px] text-blue-600 font-medium">
                  Own messages appear on RIGHT (Blue)
                </span>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
              ● Live Client 2
            </span>
          </div>

          {/* Messages Area B */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8fafc]/50">
            {messages.map((msg) => {
              const isOwn = msg.senderId === USER_B.id;
              return (
                <div
                  key={'devB_' + msg._id}
                  className={`flex flex-col max-w-[85%] space-y-0.5 ${
                    isOwn ? 'ml-auto items-end text-right' : 'mr-auto items-start text-left'
                  }`}
                >
                  <span className="text-[10px] text-slate-400 px-1 font-medium">
                    {msg.username} {isOwn ? '(You)' : ''} · {formatTime(msg.createdAt)}
                  </span>
                  <div
                    className={`px-3.5 py-2 rounded-2xl text-xs leading-relaxed break-words shadow-xs ${
                      isOwn
                        ? 'bg-[#2563eb] text-white rounded-tr-xs'
                        : 'bg-white text-slate-800 border border-slate-200/70 rounded-tl-xs'
                    }`}
                  >
                    {msg.attachmentUrl && (
                      <img
                        src={msg.attachmentUrl}
                        alt="attachment"
                        className="rounded-lg max-h-36 mb-1 object-cover"
                      />
                    )}
                    <span>{msg.text}</span>
                    {isOwn && (
                      <span className="inline-flex items-center ml-1.5 text-blue-200">
                        <CheckCheck size={12} />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {typingState[USER_A.name] && (
              <div className="text-[11px] text-slate-400 italic animate-pulse">
                {USER_A.name} is typing...
              </div>
            )}
            <div ref={listBRef} />
          </div>

          {/* Input B */}
          <form onSubmit={handleSendB} className="p-2.5 border-t border-slate-100 bg-white flex gap-2">
            <input
              type="text"
              value={inputB}
              onChange={(e) => setInputB(e.target.value)}
              placeholder="Type message as Taj..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={!inputB.trim()}
              className="px-3 bg-[#2563eb] hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center justify-center transition"
            >
              <ArrowUp size={14} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
