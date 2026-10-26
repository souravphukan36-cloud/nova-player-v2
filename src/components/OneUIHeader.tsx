import React from 'react';
import { NatureMusicLogo } from './NatureMusicLogo';
import { usePlayer } from '../context/PlayerContext';
import { Download, Bell, Check, Menu, Moon, Sun, Palette } from 'lucide-react';

interface OneUIHeaderProps {
  title: string;
  subtitle?: string;
  showScanner?: boolean;
  onOpenMenu?: () => void;
}

export const OneUIHeader: React.FC<OneUIHeaderProps> = ({ 
  title, 
  subtitle,
  onOpenMenu
}) => {
  const { 
    settings, 
    updateSettings,
    updateTheme,
    isInstallable, 
    promptInstall, 
    requestNotificationPermission, 
    notificationPermission 
  } = usePlayer();
  const isLight = settings.theme === 'light' || settings.theme === 'light-silver' || settings.theme === 'warm-light';
  const isColor = settings.theme.startsWith('color-');
  const [installedSuccess, setInstalledSuccess] = React.useState(false);

  const handleInstallClick = async () => {
    const success = await promptInstall();
    if (success) {
      setInstalledSuccess(true);
      setTimeout(() => setInstalledSuccess(false), 4000);
    }
  };

  const cycleTheme = () => {
    if (isLight) {
      updateTheme('dark');
      updateSettings({ accentColor: '#10B981' });
    } else if (!isLight && !isColor) {
      updateTheme('color-emerald');
      updateSettings({ accentColor: '#10B981' });
    } else {
      updateTheme('light');
      updateSettings({ accentColor: '#059669' });
    }
  };

  return (
    <div className="px-4 sm:px-6 pt-3 pb-3 flex flex-col gap-1 select-none">
      {/* Action Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* Mobile Menu Hamburger Button */}
          {onOpenMenu && (
            <button
              onClick={onOpenMenu}
              className="p-2 rounded-xl border md:hidden hover:bg-white/10 active:scale-95 transition-all"
              style={{
                borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
                backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)'
              }}
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <NatureMusicLogo size={28} showText={false} />
            <div className="flex flex-col leading-none">
              <span className={`text-xs font-black tracking-wider uppercase ${isLight ? 'text-neutral-900' : 'text-white'}`}>
                Nature Music
              </span>
              <span className="text-[9px] font-bold text-emerald-500 tracking-wider uppercase">Audiophile Stream</span>
            </div>
          </div>
        </div>

        {/* Quick Header Actions: Live Event Switch, Theme Toggle & PWA Install */}
        <div className="flex items-center gap-2">
          {/* Quick Theme Cycle Button */}
          <button
            onClick={cycleTheme}
            className="flex items-center gap-1.5 py-1 px-2.5 rounded-full border text-xs font-bold active:scale-95 transition-all shadow-sm"
            style={{
              backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)',
              borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'
            }}
            title="Switch Theme (Dark / Light / Color)"
          >
            {isLight ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px]">Light</span>
              </>
            ) : isColor ? (
              <>
                <Palette className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px]">Color</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-neutral-300" />
                <span className="text-[11px]">Dark</span>
              </>
            )}
          </button>
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

