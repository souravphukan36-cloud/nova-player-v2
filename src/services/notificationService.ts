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

  public showPlaybackNotification(track: Track, isPlaying: boolean) {
    if (!this.hasPermission || typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    try {
      if (this.currentNotification) {
        this.currentNotification.close();
      }

      const icon = (track.coverArt && (track.coverArt.startsWith('http') || track.coverArt.startsWith('data:')))
        ? track.coverArt
        : '/favicon.ico';

      this.currentNotification = new Notification(
        isPlaying ? `▶ Playing: ${track.title}` : `❚❚ Paused: ${track.title}`,
        {
          body: `${track.artist} • ${track.album}`,
          icon,
          badge: '/favicon.ico',
          tag: 'nova-player-active',
          silent: true,
        }
      );
    } catch {
      // ignore
    }
  }
}

export const notificationService = new NotificationService();
