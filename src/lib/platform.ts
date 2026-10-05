import { Capacitor } from '@capacitor/core';

/** `true` dentro do app Android (Capacitor); `false` no navegador. */
export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}
