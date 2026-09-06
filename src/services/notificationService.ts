import { Track } from '../types';

class NotificationService {
  private hasPermission = false;
  private currentNotification: Notification | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.hasPermission = Notification.permission === 'granted';
    }
  }

  public getPermissionStatus(): NotificationPermission | 'unsupported' {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  public async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    try {
      const permission = await Notification.requestPermission();
      this.hasPermission = permission === 'granted';
      return this.hasPermission;
    } catch (e) {
      console.warn('Failed to request notification permission:', e);
      return false;
    }
  }

  public async showPlaybackNotification(track: Track, isPlaying: boolean) {
    if (!this.hasPermission || typeof window === 'undefined') {
      return;
    }

    const icon = (track.coverArt && (track.coverArt.startsWith('http') || track.coverArt.startsWith('data:')))
      ? track.coverArt
      : '/icon-192.png';

    const title = isPlaying ? `▶ Playing: ${track.title}` : `❚❚ Paused: ${track.title}`;
    const options: NotificationOptions = {
      body: `${track.artist} • ${track.album || 'NOVA Player'}`,
      icon,
      badge: '/icon-192.png',
      tag: 'nova-player-active',
      silent: true,
    };

    // Prefer serviceWorker.showNotification on Android mobile browsers
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg && reg.showNotification) {
          await reg.showNotification(title, options);
          return;
        }
      } catch {
        // fallback
      }
    }

    if ('Notification' in window) {
      try {
        if (this.currentNotification) {
          this.currentNotification.close();
        }
        this.currentNotification = new Notification(title, options);
      } catch {
        // ignore
      }
    }
  }
}

export const notificationService = new NotificationService();
