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
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Official NOVA Logo No. 4: Glowing Cosmic Gradient Star */}
      <div 
        className="relative flex-shrink-0 flex items-center justify-center rounded-xl overflow-hidden shadow-lg shadow-purple-950/40 group transition-transform duration-300 hover:scale-105 border border-white/15 bg-black"
        style={{ 
          width: size, 
          height: size, 
        }}
      >
        <img 
          src="/logo.png" 
          alt="NOVA" 
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className="text-sm font-black tracking-widest text-white uppercase font-sans">
            NOVA
          </span>
          <span className="text-[9px] font-semibold tracking-widest text-purple-400 uppercase font-mono">
            High-Res Music
          </span>
        </div>
      )}
    </div>
  );
};
