import React from 'react';

interface NatureMusicLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const NatureMusicLogo: React.FC<NatureMusicLogoProps> = ({ 
  className = '', 
  size = 28,
  showText = false
}) => {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {/* Nature Symbol: Acoustic Leaf with Sound Waves */}
      <div 
        className="relative flex-shrink-0 flex items-center justify-center rounded-xl overflow-hidden shadow-lg group transition-transform duration-300 hover:scale-105"
        style={{ 
          width: size, 
          height: size, 
          background: 'linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)' 
        }}
      >
        {/* Subtle Ambient Leaf Glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/40 via-transparent to-amber-300/30 pointer-events-none" />

        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-3/4 h-3/4 text-white drop-shadow-md"
        >
          {/* Nature Sprouting Leaf */}
          <path
            d="M12 2C7.5 4 4 8.5 4 13.5C4 18 7.5 21.5 12 22C16.5 21.5 20 18 20 13.5C20 8.5 16.5 4 12 2Z"
            fill="currentColor"
            fillOpacity="0.25"
          />
          {/* Leaf Central Vein / Sound Wave Stem */}
          <path
            d="M12 22V5M12 12C14.5 10 17 11.5 18 13M12 16C9.5 14.5 7 15.5 6 17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Acoustic Resonance Rings (Nature Harmonic Waves) */}
          <circle cx="12" cy="12" r="8.5" stroke="#FDE047" strokeWidth="1" strokeDasharray="2 3" opacity="0.8" />
          <circle cx="12" cy="12" r="2.5" fill="#FDE047" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className="text-sm font-extrabold tracking-wider text-white uppercase font-sans">
            NOVA
          </span>
          <span className="text-[9px] font-semibold tracking-widest text-emerald-400 uppercase">
            Nature Sound
          </span>
        </div>
      )}
    </div>
  );
};
