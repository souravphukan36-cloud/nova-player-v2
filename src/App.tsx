import React, { useState } from 'react';
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
  const { settings, currentTrack } = usePlayer();

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
