import React, { useState } from 'react';
import { X, Copy, Check, Smartphone, QrCode, Globe, ShieldCheck } from 'lucide-react';

interface ShareDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sharedUrl: string;
}

export const ShareDeviceModal: React.FC<ShareDeviceModalProps> = ({
  isOpen,
  onClose,
  sharedUrl,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(sharedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(
    sharedUrl
  )}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <Smartphone size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Access on Mobile & Other Devices</h2>
              <p className="text-[11px] text-slate-500">Scan QR or share the public link</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-center sm:text-left">
          {/* QR Code and Explanation */}
          <div className="flex flex-col sm:flex-row items-center gap-5 bg-[#f8fafc] p-4 rounded-2xl border border-slate-200/70">
            {/* QR Code */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm shrink-0">
              <img
                src={qrImageUrl}
                alt="QR Code to access chat"
                className="w-36 h-36 rounded-lg object-contain"
                loading="eager"
              />
              <span className="text-[10px] text-slate-400 block text-center mt-1">Scan with camera</span>
            </div>

            {/* Steps */}
            <div className="space-y-2 text-xs text-slate-600">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Globe size={14} className="text-blue-600 shrink-0" />
                <span>How to open on other devices:</span>
              </div>
              <ol className="list-decimal pl-4 space-y-1 text-slate-600 leading-relaxed text-[11px]">
                <li>
                  Scan the QR code with your <strong>phone camera</strong> or copy the link below.
                </li>
                <li>
                  Use the <strong>Shared App URL</strong> (<span className="text-blue-600 font-mono">ais-pre-</span>), not the dev URL.
                </li>
                <li>
                  If prompted, sign in with your Google account.
                </li>
                <li>
                  Start messaging in real-time between devices!
                </li>
              </ol>
            </div>
          </div>

          {/* Copy Link Input Box */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5 text-left">
              Public Shared Link (For Phones, Tablets & Friends):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={sharedUrl}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-mono outline-none select-all"
              />
              <button
                onClick={handleCopy}
                className="px-4 py-2.5 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm shadow-blue-500/20 shrink-0 cursor-pointer"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 flex items-start gap-2 text-[11px] text-blue-900 leading-relaxed text-left">
            <ShieldCheck size={16} className="text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Note on Google Cloud / AI Studio previews:</span>
              <p className="text-blue-800/90 mt-0.5">
                The development URL (<code className="font-mono text-blue-900 bg-blue-100/60 px-1 rounded">ais-dev-</code>) is private to this browser tab. This shared URL (<code className="font-mono text-blue-900 bg-blue-100/60 px-1 rounded">ais-pre-</code>) is the one configured for external devices.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
