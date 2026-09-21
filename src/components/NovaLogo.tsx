import React from 'react';

interface NovaLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export default function NovaLogo({ className = '', size = 40, showText = false }: NovaLogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div 
        className="relative rounded-2xl overflow-hidden shadow-lg shadow-purple-900/30 border border-white/10 flex-shrink-0"
        style={{ width: size, height: size }}
      >
        <img 
          src="/logo.png" 
          alt="NOVA Logo" 
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback SVG if image not loaded
            const target = e.currentTarget;
            target.style.display = 'none';
          }}
        />
      </div>
      {showText && (
        <span className="font-extrabold tracking-wider text-white text-lg font-mono">
          NOVA
        </span>
      )}
    </div>
  );
}
