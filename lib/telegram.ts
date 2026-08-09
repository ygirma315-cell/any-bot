export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    query_id?: string;
    user?: TelegramUser;
    auth_date?: string;
    hash?: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  isClosingConfirmationEnabled: boolean;
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText: (text: string) => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  sendData: (data: string) => void;
  openLink: (url: string) => void;
  openTelegramLink: (url: string) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

/**
 * Retrieves Telegram WebApp instance if available, otherwise returns safe browser fallback.
 */
export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
}

/**
 * Returns current Telegram user or browser fallback user for localhost testing.
 */
export function getTelegramUser(): { user: TelegramUser; isFallback: boolean } {
  if (typeof window !== 'undefined') {
    const webApp = window.Telegram?.WebApp;
    if (webApp?.initDataUnsafe?.user) {
      return {
        user: webApp.initDataUnsafe.user,
        isFallback: false
      };
    }
  }

  // Browser Fallback Mode for localhost
  return {
    user: {
      id: 987654321,
      first_name: 'Demo',
      last_name: 'Customer',
      username: 'demo_customer',
      language_code: 'en'
    },
    isFallback: true
  };
}

/**
 * Triggers Telegram haptic feedback if supported, falls back to Web Vibrate API or no-op.
 */
export function triggerHaptic(style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' = 'light') {
  if (typeof window === 'undefined') return;
  const webApp = window.Telegram?.WebApp;

  if (webApp?.HapticFeedback) {
    if (style === 'success' || style === 'warning') {
      webApp.HapticFeedback.notificationOccurred(style);
    } else {
      webApp.HapticFeedback.impactOccurred(style);
    }
  } else if ('vibrate' in navigator) {
    try {
      navigator.vibrate(20);
    } catch {
      // Ignore vibration errors
    }
  }
}
