import React, { useState, useEffect, useCallback } from 'react';
import { PlayerProvider, usePlayer } from './context/PlayerContext';
import { OneUIHeader } from './components/OneUIHeader';
import { HomeTab } from './components/HomeTab';
import { LibraryTab } from './components/LibraryTab';
import { CloudTab } from './components/CloudTab';
import { SearchTab } from './components/SearchTab';
import { SettingsTab } from './components/SettingsTab';
import { MiniPlayer } from './components/MiniPlayer';
import { BottomNav } from './components/BottomNav';
import { NowPlayingModal } from './components/NowPlayingModal';
import { EqualizerModal } from './components/EqualizerModal';
import { SleepTimerModal } from './components/SleepTimerModal';
import { FileScannerModal } from './components/FileScannerModal';
import { CustomizerModal } from './components/CustomizerModal';
import { CarModeModal } from './components/CarModeModal';
import { IEMSoundStageModal } from './components/IEMSoundStageModal';
import { AdminWebPortal } from './components/AdminWebPortal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MainTab, LibrarySubTab } from './types';

const MainLayout: React.FC = () => {
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname.toLowerCase();
      const s = window.location.search.toLowerCase();
      const h = window.location.hash.toLowerCase();
      return p === '/admin' || p.startsWith('/admin') || s.includes('page=admin') || h.includes('admin');
    }
    return false;
  });

  React.useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname.toLowerCase();
      const s = window.location.search.toLowerCase();
      const h = window.location.hash.toLowerCase();
      setIsAdminRoute(p === '/admin' || p.startsWith('/admin') || s.includes('page=admin') || h.includes('admin'));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [currentTab, setCurrentTab] = useState<MainTab>('home');
  const [librarySubTab, setLibrarySubTab] = useState<LibrarySubTab>('songs');

  const { 
    settings, 
    nowPlayingOpen, setNowPlayingOpen,
    equalizerOpen, setEqualizerOpen,
    queueOpen, setQueueOpen,
    lyricsOpen, setLyricsOpen,
    sleepTimerOpen, setSleepTimerOpen,
    scannerOpen, setScannerOpen,
    customizerOpen, setCustomizerOpen,
    carModeOpen, setCarModeOpen,
    iemModalOpen, setIEMModalOpen,
  } = usePlayer();

  // Web Browser Back Navigation Handler (closes top-level modals on browser back)
  const handleBackNavigation = useCallback(() => {
    if (isAdminRoute) {
      window.history.pushState({}, '', '/');
      setIsAdminRoute(false);
      return true;
    }
    if (iemModalOpen) {
      setIEMModalOpen(false);
      return true;
    }
    if (equalizerOpen) {
      setEqualizerOpen(false);
      return true;
    }
    if (queueOpen) {
      setQueueOpen(false);
      return true;
    }
    if (lyricsOpen) {
      setLyricsOpen(false);
      return true;
    }
    if (customizerOpen) {
      setCustomizerOpen(false);
      return true;
    }
    if (scannerOpen) {
      setScannerOpen(false);
      return true;
    }
    if (sleepTimerOpen) {
      setSleepTimerOpen(false);
      return true;
    }
    if (carModeOpen) {
      setCarModeOpen(false);
      return true;
    }
    if (nowPlayingOpen) {
      setNowPlayingOpen(false);
      return true;
    }

    if (currentTab !== 'home') {
      setCurrentTab('home');
      return true;
    }
    return false;
  }, [
    isAdminRoute,
    iemModalOpen,
    equalizerOpen,
    queueOpen,
    lyricsOpen,
    customizerOpen,
    scannerOpen,
    sleepTimerOpen,
    carModeOpen,
    nowPlayingOpen,
    currentTab,
    setIEMModalOpen,
    setEqualizerOpen,
    setQueueOpen,
    setLyricsOpen,
    setCustomizerOpen,
    setScannerOpen,
    setSleepTimerOpen,
    setCarModeOpen,
    setNowPlayingOpen,
  ]);

  useEffect(() => {
    const handlePop = (e: PopStateEvent) => {
      const consumed = handleBackNavigation();
      if (consumed) {
        e.preventDefault();
      }
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [handleBackNavigation]);

  // If user navigates to /admin, show full-page Admin Web Portal
  if (isAdminRoute) {
    return (
      <AdminWebPortal
        onBackToApp={() => {
          window.history.pushState({}, '', '/');
          setIsAdminRoute(false);
        }}
      />
    );
  }

  const handleNavigateToLibrary = (subTab?: string) => {
    if (subTab) {
      setLibrarySubTab(subTab as LibrarySubTab);
    }
    setCurrentTab('library');
  };

  const getHeaderTitle = () => {
    switch (currentTab) {
      case 'home':
        return '';
      case 'cloud':
        return 'Cloud Library';
      case 'library':
        return 'Music Library';
      case 'search':
        return 'Search';
      case 'settings':
        return 'Settings';
    }
  };

  const getHeaderSubtitle = () => {
    switch (currentTab) {
      case 'home':
        return '';
      case 'cloud':
        return 'NOVA Private Channel • Singer-Wise Library';
      case 'library':
        return 'Tracks, Albums, Playlists & Folders';
      case 'search':
        return 'Find tracks across your device';
      case 'settings':
        return 'Audio Customization & About';
    }
  };

  // Determine theme background
  const themeBgMap: Record<string, string> = {
    amoled: '#000000',
    dark: '#0A0C10',
    midnight: '#0C0A17',
    slate: '#0B0F19',
    light: '#F8FAFC',
    'light-silver': '#FFFFFF',
    'warm-light': '#FAF7F2',
    'color-emerald': '#041d14',
    'color-violet': '#0f0c20',
    'color-sunset': '#1c0b14',
    'color-cyan': '#041525',
  };
  const isLight = settings.theme === 'light' || settings.theme === 'light-silver' || settings.theme === 'warm-light';
  const bgColor = themeBgMap[settings.theme] || (isLight ? '#F8FAFC' : '#0A0C10');

  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('theme-light', isLight);
      document.body.style.backgroundColor = bgColor;
    }
  }, [isLight, bgColor]);

  return (
    <div 
      className={`fixed inset-0 w-full h-full flex flex-col overflow-hidden transition-colors duration-300 select-none ${
        isLight ? 'theme-light text-neutral-900' : 'text-neutral-100'
      }`}
      style={{ backgroundColor: bgColor }}
    >
      {/* Centered One UI Container */}
      <div className="w-full flex-1 flex flex-col min-h-0 h-full relative overflow-hidden max-w-md sm:max-w-lg md:max-w-xl mx-auto">
        {/* Top Header matching original One UI design */}
        <OneUIHeader 
          title={getHeaderTitle()} 
          subtitle={getHeaderSubtitle()}
          onOpenSettings={() => setCurrentTab('settings')}
        />

        {/* Scrollable Tab View Area with proper bottom padding for MiniPlayer + BottomNav */}
        <main 
          id="main-scroll-view"
          className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden pb-40"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="w-full px-4 sm:px-5">
            {currentTab === 'home' && (
              <HomeTab onNavigateToLibrary={handleNavigateToLibrary} />
            )}
            {currentTab === 'cloud' && (
              <CloudTab />
            )}
            {currentTab === 'library' && (
              <LibraryTab initialSubTab={librarySubTab} />
            )}
            {currentTab === 'search' && (
              <SearchTab />
            )}
            {currentTab === 'settings' && (
              <SettingsTab />
            )}
          </div>
        </main>
      </div>

      {/* Persistent Floating MiniPlayer & Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-auto flex flex-col items-center">
        <div className="w-full max-w-md sm:max-w-lg md:max-w-xl">
          <MiniPlayer />
          <BottomNav 
            currentTab={currentTab} 
            onSelectTab={setCurrentTab} 
          />
        </div>
      </div>

      {/* Modals & Sheets */}
      <NowPlayingModal />
      <EqualizerModal />
      <IEMSoundStageModal isOpen={iemModalOpen} onClose={() => setIEMModalOpen(false)} />
      <SleepTimerModal />
      <FileScannerModal />
      <CustomizerModal />
      <CarModeModal />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <PlayerProvider>
        <MainLayout />
      </PlayerProvider>
    </ErrorBoundary>
  );
}
