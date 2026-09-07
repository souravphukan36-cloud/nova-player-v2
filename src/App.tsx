import React, { useState } from 'react';
import { PlayerProvider, usePlayer } from './context/PlayerContext';
import { StatusBar } from './components/StatusBar';
import { OneUIHeader } from './components/OneUIHeader';
import { HomeTab } from './components/HomeTab';
import { LibraryTab } from './components/LibraryTab';
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
import { MainTab, LibrarySubTab } from './types';

const MainLayout: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<MainTab>('home');
  const [librarySubTab, setLibrarySubTab] = useState<LibrarySubTab>('songs');
  const { settings, currentTrack } = usePlayer();

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
      case 'library':
        return 'Tracks, Albums, Playlists & Folders';
      case 'search':
        return 'Find tracks across your device';
      case 'settings':
        return 'Audio Customization & About';
    }
  };

  // Determine theme background
  const themeBgMap = {
    amoled: '#000000',
    dark: '#101116',
    midnight: '#0C0A17',
    slate: '#0B0F19',
  };
  const bgColor = themeBgMap[settings.theme] || '#000000';

  return (
    <div 
      className="w-full h-full min-h-screen h-[100dvh] relative flex flex-col overflow-hidden transition-colors duration-300 select-none"
      style={{ backgroundColor: bgColor }}
    >
      {/* 1. Android / One UI Status Bar */}
      <StatusBar />

      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col min-h-0 relative">
        {/* 2. Top Samsung One UI Header */}
        <OneUIHeader 
          title={getHeaderTitle()} 
          subtitle={getHeaderSubtitle()}
          showScanner={currentTab !== 'settings'}
        />

        {/* 3. Tab Content View Area */}
        <main 
          id="main-scroll-view"
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain pb-36 touch-pan-y"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {currentTab === 'home' && (
            <HomeTab onNavigateToLibrary={handleNavigateToLibrary} />
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
      <div className="fixed bottom-14 left-0 right-0 z-30 pointer-events-auto px-2 sm:px-4 max-w-4xl mx-auto">
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
    </div>
  );
};

export default function App() {
  return (
    <PlayerProvider>
      <MainLayout />
    </PlayerProvider>
  );
}
