import React, { useState } from 'react';
import { X, Bot, Send, Radio, UserPlus, Sparkles } from 'lucide-react';

interface MultiUserSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoom: string;
  onSendSimulatedMessage: (username: string, avatar: string, text: string) => void;
  onSimulatedTyping: (username: string) => void;
  onSwitchPersona: (username: string, avatar: string) => void;
}

const PEER_PERSONAS = [
  { name: 'Sarah (Frontend)', avatar: '👩‍💻', role: 'React Developer' },
  { name: 'Marcus (Backend)', avatar: '👨‍🔧', role: 'Node.js & Mongo Engineer' },
  { name: 'DevBot', avatar: '🤖', role: 'AI Simulator' },
  { name: 'Elena (QA)', avatar: '🚀', role: 'Test Engineer' },
];

const PRESET_MESSAGES = [
  'Hey everyone! How is the WebSocket latency looking?',
  'Socket.io connection is super snappy on port 3000!',
  'Just reviewed the Mongoose Message schema in server/models/Message.js, looks great 👍',
  'Testing real-time broadcast and room channels!',
  'Everything working seamlessly across rooms! 🎉',
];

export const MultiUserSimulator: React.FC<MultiUserSimulatorProps> = ({
  isOpen,
  onClose,
  currentRoom,
  onSendSimulatedMessage,
  onSimulatedTyping,
  onSwitchPersona,
}) => {
  const [selectedPersona, setSelectedPersona] = useState(PEER_PERSONAS[0]);
  const [customText, setCustomText] = useState('');

  if (!isOpen) return null;

  const handleSendCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim()) return;
    onSendSimulatedMessage(selectedPersona.name, selectedPersona.avatar, customText.trim());
    setCustomText('');
  };

  const handleSendPreset = (msg: string) => {
    onSimulatedTyping(selectedPersona.name);
    setTimeout(() => {
      onSendSimulatedMessage(selectedPersona.name, selectedPersona.avatar, msg);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Radio size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Multi-User Testing Station</h2>
              <p className="text-[11px] text-slate-400">
                Simulate remote peer users and test Socket.io messaging in #{currentRoom}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Persona Picker */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Select Peer Persona
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PEER_PERSONAS.map((p) => {
                const isSelected = selectedPersona.name === p.name;
                return (
                  <button
                    key={p.name}
                    onClick={() => setSelectedPersona(p)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xl">{p.avatar}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">{p.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{p.role}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Switch Primary User */}
          <div className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400">Want to chat AS {selectedPersona.name}?</span>
            <button
              onClick={() => {
                onSwitchPersona(selectedPersona.name, selectedPersona.avatar);
                onClose();
              }}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-blue-400 font-medium rounded-lg border border-slate-700 flex items-center gap-1 transition"
            >
              <UserPlus size={12} /> Switch to this user
            </button>
          </div>

          {/* Quick Simulation Actions */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Dispatch Rapid Test Messages (Broadcasts via Socket.io)
            </label>
            <div className="space-y-1.5">
              {PRESET_MESSAGES.map((msg, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendPreset(msg)}
                  className="w-full text-left p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-xs text-slate-300 border border-slate-700/50 hover:border-slate-600 transition flex items-center justify-between group"
                >
                  <span className="truncate pr-2">"{msg}"</span>
                  <span className="text-[10px] font-mono text-emerald-400 opacity-0 group-hover:opacity-100 transition shrink-0">
                    Send ➔
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Message Input for Simulated Peer */}
          <form onSubmit={handleSendCustom} className="flex gap-2 pt-1">
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder={`Send message as ${selectedPersona.name}...`}
              className="flex-1 bg-slate-800 text-xs text-white px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={!customText.trim()}
              className="px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition"
            >
              <Send size={13} /> Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
