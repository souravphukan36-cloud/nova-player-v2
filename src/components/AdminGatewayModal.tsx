import React, { useState } from 'react';
import { 
  Shield, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles, 
  X, 
  Globe, 
  Smartphone, 
  Layers, 
  Lock,
  ArrowRight
} from 'lucide-react';

interface AdminGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenInsideApp: () => void;
}

export const AdminGatewayModal: React.FC<AdminGatewayModalProps> = ({
  isOpen,
  onClose,
  onOpenInsideApp,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const adminUrl = `${currentOrigin}/admin`;

  const handleOpenInBrowser = () => {
    // Try opening in new tab/window
    try {
      const win = window.open(adminUrl, '_blank');
      if (!win || win.closed || typeof win.closed === 'undefined') {
        // Fallback for pop-up blockers or webview
        window.location.href = adminUrl;
      }
    } catch {
      window.location.href = adminUrl;
    }
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(adminUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#121218] border border-white/10 rounded-3xl p-6 space-y-5 shadow-2xl relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top bar with close */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Private Admin Web Portal</h3>
              <p className="text-[11px] text-white/50">Manage songs, users & bot from any browser</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Developer attribution badge */}
        <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-800/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-purple-200">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Developer: <strong className="text-white">Sourav Phukan</strong></span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold">
            PIN Protected
          </span>
        </div>

        {/* Direct Link box */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-white/70 block">Secret Web Address</label>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10">
            <Globe className="w-4 h-4 text-white/40 ml-1.5 flex-shrink-0" />
            <input
              type="text"
              readOnly
              value={adminUrl}
              className="w-full bg-transparent text-xs text-purple-300 font-mono focus:outline-none select-all"
            />
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white flex items-center gap-1.5 transition-colors flex-shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Action Choice Buttons */}
        <div className="space-y-2.5 pt-1">
          {/* Option 1: Open in Browser (New Window / Chrome) */}
          <button
            onClick={handleOpenInBrowser}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-purple-600/25 flex items-center justify-between group active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <ExternalLink className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-sm font-extrabold leading-tight">Open in Web Browser</span>
                <span className="text-[11px] text-white/70 font-normal">Full-screen Chrome / Safari / Edge tab</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-white/60 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Option 2: Open Inside App */}
          <button
            onClick={() => {
              onClose();
              onOpenInsideApp();
            }}
            className="w-full p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2.5 text-left">
              <Smartphone className="w-4 h-4 text-white/60" />
              <div>
                <span className="block text-xs font-bold text-white/90">Open Inside Mobile App</span>
                <span className="text-[10px] text-white/40">Quick edit right here without switching tabs</span>
              </div>
            </div>
            <span className="text-[11px] text-purple-400 font-semibold">Open &rarr;</span>
          </button>
        </div>

        {/* Footer PIN hint */}
        <div className="pt-2 text-center border-t border-white/5">
          <p className="text-[11px] text-white/40 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" />
            <span>Default PIN is <strong className="text-white">7788</strong> (can be authenticated once)</span>
          </p>
        </div>
      </div>
    </div>
  );
};
