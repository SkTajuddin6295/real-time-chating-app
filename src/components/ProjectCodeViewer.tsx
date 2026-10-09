import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  FileCode, 
  FileText, 
  Copy, 
  Check, 
  X, 
  Terminal, 
  Download,
  Server,
  Layers,
  Database
} from 'lucide-react';

interface ProjectCodeViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

const FILE_ORDER = [
  'server/models/Message.js',
  'server/.env',
  'server/package.json',
  'server/server.js',
  'client/index.html',
  'client/style.css',
  'client/script.js',
  'README.md',
];

export const ProjectCodeViewer: React.FC<ProjectCodeViewerProps> = ({ isOpen, onClose }) => {
  const [files, setFiles] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<string>('server/server.js');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/project-files')
        .then((res) => res.json())
        .then((data) => {
          setFiles(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to load project files:', err);
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (files[selectedFile]) {
      navigator.clipboard.writeText(files[selectedFile]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getLanguageTag = (fileName: string) => {
    if (fileName.endsWith('.js')) return 'JavaScript';
    if (fileName.endsWith('.html')) return 'HTML5';
    if (fileName.endsWith('.css')) return 'CSS3';
    if (fileName.endsWith('.json')) return 'JSON';
    if (fileName.endsWith('.env')) return 'ENV';
    if (fileName.endsWith('.md')) return 'Markdown';
    return 'Text';
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.startsWith('server/models')) return <Database size={14} className="text-emerald-400" />;
    if (fileName.startsWith('server')) return <Server size={14} className="text-blue-400" />;
    if (fileName.startsWith('client')) return <Layers size={14} className="text-amber-400" />;
    return <FileText size={14} className="text-slate-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
              📁
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                mern-chat/ Source Architecture
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-mono">
                  All Files Generated
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Explore the complete MERN Chat codebase (Express backend, Mongoose schema, Socket.io client & UI)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* File Tree Sidebar */}
          <div className="w-64 bg-slate-950/40 border-r border-slate-800 p-3 overflow-y-auto shrink-0 select-none">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 mb-2">
              Project Structure
            </div>

            <div className="space-y-1">
              <div className="px-2 py-1 text-xs text-blue-400 font-mono font-semibold flex items-center gap-1.5">
                <Folder size={14} /> mern-chat/
              </div>

              {/* Server folder */}
              <div className="pl-3 space-y-0.5">
                <div className="px-2 py-0.5 text-xs text-slate-400 font-mono flex items-center gap-1.5">
                  <Folder size={13} className="text-blue-500" /> server/
                </div>

                <div className="pl-3 space-y-0.5">
                  <div className="px-2 py-0.5 text-xs text-slate-400 font-mono flex items-center gap-1.5">
                    <Folder size={12} className="text-emerald-500" /> models/
                  </div>
                  <button
                    onClick={() => setSelectedFile('server/models/Message.js')}
                    className={`w-full text-left pl-6 pr-2 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition ${
                      selectedFile === 'server/models/Message.js'
                        ? 'bg-blue-600 text-white font-medium'
                        : 'text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    {getFileIcon('server/models/Message.js')} Message.js
                  </button>
                </div>

                {['server/.env', 'server/package.json', 'server/server.js'].map((filePath) => {
                  const name = filePath.replace('server/', '');
                  return (
                    <button
                      key={filePath}
                      onClick={() => setSelectedFile(filePath)}
                      className={`w-full text-left pl-6 pr-2 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition ${
                        selectedFile === filePath
                          ? 'bg-blue-600 text-white font-medium'
                          : 'text-slate-300 hover:bg-slate-800/80'
                      }`}
                    >
                      {getFileIcon(filePath)} {name}
                    </button>
                  );
                })}
              </div>

              {/* Client folder */}
              <div className="pl-3 pt-2 space-y-0.5">
                <div className="px-2 py-0.5 text-xs text-slate-400 font-mono flex items-center gap-1.5">
                  <Folder size={13} className="text-amber-500" /> client/
                </div>
                {['client/index.html', 'client/style.css', 'client/script.js'].map((filePath) => {
                  const name = filePath.replace('client/', '');
                  return (
                    <button
                      key={filePath}
                      onClick={() => setSelectedFile(filePath)}
                      className={`w-full text-left pl-6 pr-2 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition ${
                        selectedFile === filePath
                          ? 'bg-blue-600 text-white font-medium'
                          : 'text-slate-300 hover:bg-slate-800/80'
                      }`}
                    >
                      {getFileIcon(filePath)} {name}
                    </button>
                  );
                })}
              </div>

              {/* README */}
              <div className="pl-3 pt-2">
                <button
                  onClick={() => setSelectedFile('README.md')}
                  className={`w-full text-left px-2 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition ${
                    selectedFile === 'README.md'
                      ? 'bg-blue-600 text-white font-medium'
                      : 'text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <FileText size={13} /> README.md
                </button>
              </div>
            </div>
          </div>

          {/* Main Code View Area */}
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
            {/* Code Toolbar */}
            <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-white font-semibold">
                  mern-chat/{selectedFile}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                  {getLanguageTag(selectedFile)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition font-medium border border-slate-700"
                >
                  {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
            </div>

            {/* Code Editor Body */}
            <div className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-200 leading-relaxed bg-slate-950 select-text">
              {loading ? (
                <div className="text-center py-12 text-slate-500">Loading code...</div>
              ) : files[selectedFile] ? (
                <pre className="whitespace-pre">
                  <code>{files[selectedFile]}</code>
                </pre>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  File content not loaded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
