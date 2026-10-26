import React from 'react';
import { X, Check, Sparkles, Wifi, Gauge, Disc3, ShieldCheck } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { AudioStreamingQuality } from '../types';

interface AudioQualityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AudioQualityModal: React.FC<AudioQualityModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = usePlayer();

  if (!isOpen) return null;

  const currentQuality = settings.streamingQuality || 'high-res';

  const QUALITY_TIERS: {
    id: AudioStreamingQuality;
    title: string;
    bitrate: string;
    tag: string;
    tagColor: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    desc: string;
    dataUsage: string;
  }[] = [
    {
      id: 'data-saver',
      title: 'Data Saver',
      bitrate: '128 kbps AAC',
      tag: 'Eco',
      tagColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      icon: Wifi,
      desc: 'Optimized for slow 3G/4G network coverage. Uses minimum mobile data with instant playback.',
      dataUsage: '~0.9 MB per min',
    },
    {
      id: 'standard',
      title: 'Standard',
      bitrate: '192 kbps MP3',
      tag: 'Balanced',
      tagColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      icon: Gauge,
      desc: 'Well-balanced clarity and fast caching. Ideal for daily casual headphone listening.',
      dataUsage: '~1.4 MB per min',
    },
    {
      id: 'high-res',
      title: 'High Definition (HD)',
      bitrate: '320 kbps HD',
      tag: 'Recommended',
      tagColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      icon: Sparkles,
      desc: 'Crystal-clear studio grade streaming. Punchy sub-bass, full vocals, and crisp high frequencies.',
      dataUsage: '~2.4 MB per min',
    },
    {
      id: 'lossless',
      title: 'Lossless Master',
      bitrate: 'FLAC / 24-bit Direct',
      tag: 'Audiophile',
      tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      icon: Disc3,
      desc: 'Bit-perfect studio direct audio with zero compression artifacts for high-end earphones & speakers.',
      dataUsage: '~7.2 MB per min',
    },
  ];

  const handleSelect = (qualityId: AudioStreamingQuality) => {
    updateSettings({ streamingQuality: qualityId });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in select-none">
      <div 
        className="w-full max-w-md bg-[#0F111A] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col text-white max-h-[90vh]"
        style={{ borderColor: `${settings.accentColor}35` }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div 
              className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: `${settings.accentColor}25`, color: settings.accentColor }}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Streaming Audio Quality</span>
              </h2>
              <p className="text-xs text-white/50">Spotify-grade adaptive bitrate streaming</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quality Cards List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          {QUALITY_TIERS.map((tier) => {
            const isSelected = currentQuality === tier.id;
            const Icon = tier.icon;

            return (
              <div
                key={tier.id}
                onClick={() => handleSelect(tier.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-white/[0.08] border-white/20 shadow-lg'
                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
                }`}
                style={{
                  borderColor: isSelected ? settings.accentColor : undefined,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div 
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform ${
                        isSelected ? 'scale-105' : 'opacity-70'
                      }`}
                      style={{
                        backgroundColor: isSelected ? `${settings.accentColor}25` : 'rgba(255,255,255,0.05)',
                        color: isSelected ? settings.accentColor : '#ffffff',
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white tracking-tight">
                          {tier.title}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${tier.tagColor}`}>
                          {tier.tag}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-mono font-semibold" style={{ color: settings.accentColor }}>
                          {tier.bitrate}
                        </span>
                        <span className="text-white/30 text-[10px]">•</span>
                        <span className="text-white/50 text-[11px] font-mono">
                          {tier.dataUsage}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Radio indicator */}
                  <div 
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all mt-1 shrink-0 ${
                      isSelected 
                        ? 'border-transparent shadow-sm' 
                        : 'border-white/20 bg-transparent'
                    }`}
                    style={{ backgroundColor: isSelected ? settings.accentColor : undefined }}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                  </div>
                </div>

                <p className="text-[11px] text-white/55 mt-2 leading-relaxed pl-13">
                  {tier.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-white/60">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Zero buffer optimization applied</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-black shadow-md active:scale-95 transition-transform"
            style={{ backgroundColor: settings.accentColor }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
