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
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    if (!this.hasPermission) {
      if (Notification.permission === 'default') {
        const granted = await this.requestPermission();
        if (!granted) return;
      } else if (Notification.permission === 'granted') {
        this.hasPermission = true;
      } else {
        return;
      }
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const icon = track.coverArt
      ? (track.coverArt.startsWith('http') || track.coverArt.startsWith('data:') ? track.coverArt : `${origin}${track.coverArt}`)
      : `${origin}/icon-192.png`;

    const title = isPlaying ? `▶ ${track.title}` : `❚❚ ${track.title}`;
    const options: any = {
      body: `${track.artist} • ${track.album || 'NOVA Player'}`,
      icon,
      image: icon,
      badge: `${origin}/icon-192.png`,
      tag: 'nova-player-active',
      renotify: false,
      silent: true,
      actions: [
        { action: 'prev', title: '⏮ Previous' },
        { action: isPlaying ? 'pause' : 'play', title: isPlaying ? '❚❚ Pause' : '▶ Play' },
        { action: 'next', title: '⏭ Next' },
      ],
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

// Listen for service worker notification click messages on Android
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'nova-notification-action') {
      const action = event.data.action;
      if (action === 'play') {
        window.dispatchEvent(new CustomEvent('nova-play'));
      } else if (action === 'pause') {
        window.dispatchEvent(new CustomEvent('nova-pause'));
      } else if (action === 'prev') {
        window.dispatchEvent(new CustomEvent('nova-prev-track'));
      } else if (action === 'next') {
        window.dispatchEvent(new CustomEvent('nova-next-track'));
      }
    }
  });
}
