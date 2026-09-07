import React from 'react';
import { NatureMusicLogo } from './NatureMusicLogo';

interface OneUIHeaderProps {
  title: string;
  subtitle?: string;
  showScanner?: boolean;
}

export const OneUIHeader: React.FC<OneUIHeaderProps> = ({ 
  title, 
  subtitle 
}) => {
  return (
    <div className="px-5 pt-3 pb-4 flex flex-col gap-1 select-none">
      {/* Action Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <NatureMusicLogo size={28} showText={false} />
          <div className="flex flex-col leading-none">
            <span className="text-xs font-bold tracking-wider text-white uppercase">NOVA</span>
            <span className="text-[9px] font-semibold text-emerald-400 tracking-wider uppercase">Natural Audio</span>
          </div>
        </div>
      </div>

      {/* Prominent One UI Title */}
      {title ? (
        <div className="mt-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
          {subtitle && (
            <p className="text-xs text-white/50 font-medium mt-0.5">{subtitle}</p>
          )}
        </div>
      ) : null}
    </div>
  );
};

