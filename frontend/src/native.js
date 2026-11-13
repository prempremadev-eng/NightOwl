// 📱 Inside the NightOwl Android app (Capacitor), not a browser tab.
export const isNativeApp = () => !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform());
