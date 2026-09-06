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
        return 'NOVA Player';
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
        return 'High Fidelity Audio Player';
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
      className="h-[100dvh] h-screen max-w-md mx-auto relative flex flex-col overflow-hidden shadow-2xl transition-colors duration-300"
      style={{ backgroundColor: bgColor }}
    >
      {/* 1. Android / One UI Status Bar */}
      <StatusBar />

      {/* 2. Top Samsung One UI Header */}
      <OneUIHeader 
        title={getHeaderTitle()} 
        subtitle={getHeaderSubtitle()}
        showScanner={currentTab !== 'settings'}
      />

      {/* 3. Tab Content View Area */}
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain pb-36">
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

      {/* 4. Docked Mini Player bar directly above Bottom Navigation */}
      <div className="fixed bottom-14 left-0 right-0 max-w-md mx-auto z-30 pointer-events-auto">
        <MiniPlayer />
      </div>

      {/* 5. Bottom Navigation Bar */}
      <BottomNav currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* 6. Modals & Drawers */}
      <NowPlayingModal />
      <EqualizerModal />
      <LockScreenModal />
      <NotificationShadeModal />
      <SleepTimerModal />
      <FileScannerModal />
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
