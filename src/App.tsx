import React, { useState, useEffect, useRef, useCallback } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { PlayerProvider, usePlayer } from './context/PlayerContext';
import { StatusBar } from './components/StatusBar';
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
import { LockScreenModal } from './components/LockScreenModal';
import { NotificationShadeModal } from './components/NotificationShadeModal';
import { SleepTimerModal } from './components/SleepTimerModal';
import { FileScannerModal } from './components/FileScannerModal';
import { CustomizerModal } from './components/CustomizerModal';
import { CarModeModal } from './components/CarModeModal';
import { IEMStageModal } from './components/IEMStageModal';
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
  const [exitToastVisible, setExitToastVisible] = useState(false);
  const lastBackPressRef = useRef(0);

  const { 
    settings, 
    currentTrack,
    nowPlayingOpen, setNowPlayingOpen,
    equalizerOpen, setEqualizerOpen,
    iemModalOpen, setIEMModalOpen,
    queueOpen, setQueueOpen,
    lyricsOpen, setLyricsOpen,
    lockScreenOpen, setLockScreenOpen,
    notificationShadeOpen, setNotificationShadeOpen,
    sleepTimerOpen, setSleepTimerOpen,
    scannerOpen, setScannerOpen,
    customizerOpen, setCustomizerOpen,
    carModeOpen, setCarModeOpen,
  } = usePlayer();

  // One UI Native Android Hardware Back Button & Gesture Navigation Handler
  const handleBackNavigation = useCallback(() => {
    // 1. First priority: Close any open modal or drawer in order
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
    if (notificationShadeOpen) {
      setNotificationShadeOpen(false);
      return true;
    }
    if (lockScreenOpen) {
      setLockScreenOpen(false);
      return true;
    }

    // 2. Second priority: If on a sub-tab (library, cloud, search, settings), return to Home tab
    if (currentTab !== 'home') {
      setCurrentTab('home');
      return true;
    }

    // 3. User is on Home screen with no modals open: double-press back to exit
    const now = Date.now();
    if (now - lastBackPressRef.current < 2000) {
      try {
        CapacitorApp.exitApp();
      } catch {}
      return false;
    } else {
      lastBackPressRef.current = now;
      setExitToastVisible(true);
      setTimeout(() => setExitToastVisible(false), 2000);
      return true;
    }
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
    notificationShadeOpen,
    lockScreenOpen,
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
    setNotificationShadeOpen,
    setLockScreenOpen
  ]);

  useEffect(() => {
    let listener: any = null;

    try {
      CapacitorApp.addListener('backButton', () => {
        handleBackNavigation();
      }).then(l => {
        listener = l;
      }).catch(() => {});
    } catch {}

    const handlePop = (e: PopStateEvent) => {
      e.preventDefault();
      const consumed = handleBackNavigation();
      if (consumed) {
        window.history.pushState({ page: 'nova' }, '', window.location.href);
      }
    };

    window.history.pushState({ page: 'nova' }, '', window.location.href);
    window.addEventListener('popstate', handlePop);

    return () => {
      if (listener?.remove) listener.remove();
      window.removeEventListener('popstate', handlePop);
    };
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
    dark: '#101116',
    midnight: '#0C0A17',
    slate: '#0B0F19',
    light: '#F2F4F8',
    'light-silver': '#FFFFFF',
    'warm-light': '#FAF7F2',
  };
  const isLight = settings.theme === 'light' || settings.theme === 'light-silver' || settings.theme === 'warm-light';
  const bgColor = themeBgMap[settings.theme] || (isLight ? '#F2F4F8' : '#000000');

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
      style={{ 
        backgroundColor: bgColor,
        paddingTop: 'max(env(safe-area-inset-top, 0px), 26px)'
      }}
    >
      {/* 1. Android / One UI Status Bar */}
      <StatusBar />

      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col min-h-0 h-full relative overflow-hidden">
        {/* 2. Top Samsung One UI Header */}
        <OneUIHeader 
          title={getHeaderTitle()} 
          subtitle={getHeaderSubtitle()}
        />

        {/* 3. Tab Content View Area */}
        <main 
          id="main-scroll-view"
          className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden pb-44"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
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
        </main>
      </div>

      {/* 4. Docked Mini Player bar directly above Bottom Navigation */}
      <div className="fixed bottom-14 left-0 right-0 z-30 pointer-events-none px-2 sm:px-4 max-w-4xl mx-auto">
        <MiniPlayer />
      </div>

      {/* 5. Bottom Navigation Bar */}
      <div className="w-full">
        <div className="max-w-4xl mx-auto">
          <BottomNav currentTab={currentTab} onSelectTab={setCurrentTab} />
        </div>
      </div>

      {/* 6. Modals & Drawers */}
      <NowPlayingModal />
      <EqualizerModal />
      <LockScreenModal />
      <NotificationShadeModal />
      <SleepTimerModal />
      <FileScannerModal />
      <CustomizerModal />
      <CarModeModal />
      <IEMStageModal />

      {/* 7. Samsung One UI Double-Back Exit Toast */}
      {exitToastVisible && (
        <div 
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[250] px-5 py-2.5 rounded-full shadow-2xl border border-white/15 text-xs font-bold tracking-wide pointer-events-none animate-in fade-in zoom-in-95 duration-150"
          style={{
            backgroundColor: isLight ? 'rgba(0,0,0,0.85)' : 'rgba(28,30,38,0.95)',
            color: '#FFFFFF'
          }}
        >
          Press back again to exit
        </div>
      )}
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
