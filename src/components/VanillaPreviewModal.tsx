import React from 'react';
import { X, ExternalLink, RefreshCw, Layers } from 'lucide-react';

interface VanillaPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VanillaPreviewModal: React.FC<VanillaPreviewModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Layers size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Vanilla Client Preview
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                  mern-chat/client/index.html
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Running live and connected to the same Socket.io server on port 3000
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/standalone"
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition border border-slate-700"
            >
              <span>Open In New Tab</span>
              <ExternalLink size={12} />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Embedded Iframe */}
        <div className="flex-1 bg-slate-950 relative">
          <iframe
            src="/standalone"
            title="Vanilla MERN Chat Client"
            className="w-full h-full border-none"
          />
        </div>
      </div>
    </div>
  );
};
