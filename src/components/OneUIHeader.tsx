import React from 'react';
import { NatureMusicLogo } from './NatureMusicLogo';
import { usePlayer } from '../context/PlayerContext';
import { Download, Bell, Check } from 'lucide-react';

interface OneUIHeaderProps {
  title: string;
  subtitle?: string;
  showScanner?: boolean;
}

export const OneUIHeader: React.FC<OneUIHeaderProps> = ({ 
  title, 
  subtitle 
}) => {
  const { 
    settings, 
    isInstallable, 
    promptInstall, 
    requestNotificationPermission, 
    notificationPermission 
  } = usePlayer();
  const isLight = settings.theme === 'light' || settings.theme === 'light-silver' || settings.theme === 'warm-light';
  const [installedSuccess, setInstalledSuccess] = React.useState(false);

  const handleInstallClick = async () => {
    const success = await promptInstall();
    if (success) {
      setInstalledSuccess(true);
      setTimeout(() => setInstalledSuccess(false), 4000);
    }
  };

  return (
    <div className="px-5 pt-3 pb-4 flex flex-col gap-1 select-none">
      {/* Action Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <NatureMusicLogo size={28} showText={false} />
          <div className="flex flex-col leading-none">
            <span className={`text-xs font-bold tracking-wider uppercase ${isLight ? 'text-neutral-900' : 'text-white'}`}>
              NOVA
            </span>
            <span className="text-[9px] font-semibold text-emerald-500 tracking-wider uppercase">Natural Audio</span>
          </div>
        </div>

        {/* Quick Header Actions: Install PWA App Icon & System Notification */}
        <div className="flex items-center gap-2">
          {/* Live Notification Permission Button */}
          {notificationPermission !== 'granted' && (
            <button
              onClick={() => requestNotificationPermission()}
              title="Enable Android Live Notification & Lock Screen"
              className="flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 active:scale-95 transition-all text-[11px] font-bold"
            >
              <Bell className="w-3 h-3 animate-bounce" />
              <span>Live Alert</span>
            </button>
          )}

          {/* Install App to Home Screen Button */}
          {isInstallable && (
            <button
              onClick={handleInstallClick}
              title="Add NOVA App Icon to Phone Home Screen"
              className="flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30 active:scale-95 transition-all text-[11px] font-bold"
            >
              {installedSuccess ? (
                <>
                  <Check className="w-3 h-3 text-emerald-300" />
                  <span>Installed!</span>
                </>
              ) : (
                <>
                  <Download className="w-3 h-3" />
                  <span>Install App</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Prominent One UI Title */}
      {title ? (
        <div className="mt-2">
          <h1 className={`text-2xl font-bold tracking-tight ${isLight ? 'text-neutral-900' : 'text-white'}`}>{title}</h1>
          {subtitle && (
            <p className={`text-xs font-medium mt-0.5 ${isLight ? 'text-neutral-500' : 'text-white/50'}`}>{subtitle}</p>
          )}
        </div>
      ) : null}
    </div>
  );
};

