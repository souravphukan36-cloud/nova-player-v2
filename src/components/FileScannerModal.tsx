import React, { useState, useRef } from 'react';
import { 
  FolderPlus, 
  FileAudio, 
  UploadCloud, 
  X, 
  Check, 
  HardDrive, 
  Search,
  Sparkles 
} from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { parseAudioFile, SUPPORTED_EXTENSIONS, isRingtoneOrSystemSound } from '../services/fileScanner';
import { Track } from '../types';

export const FileScannerModal: React.FC = () => {
  const {
    scannerOpen,
    setScannerOpen,
    addTracks,
    settings,
  } = usePlayer();

  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string>('');
  const [scannedTracks, setScannedTracks] = useState<Track[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  if (!scannerOpen) return null;

  const handleFilesSelected = async (files: FileList | null, folderPath?: string) => {
    if (!files || files.length === 0) return;
    setIsScanning(true);
    setScanStatus(`Scanning ${files.length} audio files...`);

    const newTracks: Track[] = [];
    const validExtensions = Object.keys(SUPPORTED_EXTENSIONS);
    let skippedRingtones = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop()?.toLowerCase() || '';

      if (validExtensions.includes(ext) || file.type.startsWith('audio/')) {
        // Filter out Samsung ringtones, notification sounds, alarms
        if (isRingtoneOrSystemSound(file.name, folderPath || '')) {
          skippedRingtones++;
          continue;
        }

        setScanStatus(`Parsing metadata: ${file.name} (${i + 1}/${files.length})`);
        try {
          const track = await parseAudioFile(file, folderPath || '/Storage/Music/Imported');
          if (isRingtoneOrSystemSound(track.title, track.folder, track.duration)) {
            skippedRingtones++;
          } else {
            newTracks.push(track);
          }
        } catch (e) {
          console.warn('Failed to parse file', file.name, e);
        }
      }
    }

    setScannedTracks(newTracks);
    setIsScanning(false);
    const skipMsg = skippedRingtones > 0 ? ` (Filtered ${skippedRingtones} ringtones/system sounds)` : '';
    setScanStatus(`Scan complete. Found ${newTracks.length} valid audio tracks.${skipMsg}`);

    if (newTracks.length > 0) {
      addTracks(newTracks);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      await handleFilesSelected(e.dataTransfer.files, '/Storage/Music/DragDrop');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md rounded-3xl bg-neutral-900 border border-white/15 p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
        style={{ backgroundColor: settings.theme === 'amoled' ? '#0A0B10' : '#11151E' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-9 h-9 rounded-2xl flex items-center justify-center text-black shadow-lg"
              style={{ backgroundColor: settings.accentColor }}
            >
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Local Music Scanner</h3>
              <p className="text-xs text-white/50">Import MP3, WAV, FLAC, AAC, OGG, M4A</p>
            </div>
          </div>

          <button
            onClick={() => setScannerOpen(false)}
            className="p-1 rounded-full text-white/50 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden inputs for files and directories */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="audio/*,.mp3,.wav,.flac,.aac,.ogg,.m4a"
          className="hidden"
          onChange={(e) => handleFilesSelected(e.target.files)}
        />
        <input
          ref={folderInputRef}
          type="file"
          {...{ webkitdirectory: '', directory: '' }}
          multiple
          className="hidden"
          onChange={(e) => handleFilesSelected(e.target.files, '/Storage/Music/ScannedFolder')}
        />

        {/* Drag & Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-white/20 hover:border-white/40 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-white/5 hover:bg-white/10 group"
        >
          <UploadCloud className="w-10 h-10 mx-auto text-white/40 group-hover:text-white transition-colors mb-2" />
          <p className="text-sm font-semibold text-white">Drop audio files here or click to browse</p>
          <p className="text-xs text-white/50 mt-1">Supports MP3, FLAC, WAV, AAC, OGG, M4A files</p>

          {/* Supported Format Badges */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3">
            {['MP3', 'FLAC', 'WAV', 'AAC', 'OGG', 'M4A'].map(ext => (
              <span key={ext} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                {ext}
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons: Pick Files or Scan Entire Folder */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
          >
            <FileAudio className="w-4 h-4" />
            <span>Select Files</span>
          </button>

          <button
            onClick={() => folderInputRef.current?.click()}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Scan Music Folder</span>
          </button>
        </div>

        {/* Scanner Status Message */}
        {scanStatus && (
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-white/80 flex items-center gap-2">
            {isScanning ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
            ) : (
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            )}
            <span className="truncate">{scanStatus}</span>
          </div>
        )}

        {/* Scanned result summary & Done button */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <span className="text-xs text-white/50">
            {scannedTracks.length > 0 ? `Added ${scannedTracks.length} songs` : 'Ready to scan local storage'}
          </span>
          <button
            onClick={() => setScannerOpen(false)}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-black shadow-lg transition-transform active:scale-95"
            style={{ backgroundColor: settings.accentColor }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
