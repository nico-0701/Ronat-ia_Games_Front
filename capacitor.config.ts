import type { CapacitorConfig } from '@capacitor/cli';

/**
 * App Android (Capacitor): o mesmo site, empacotado num WebView. O endereço da API entra no build (`VITE_API_URL`).
 *
 * Para testar contra uma API em HTTP na rede local (ex.: o PC do desenvolvedor), faça o build com `CAP_LAN=true`: o WebView passa a
 * usar `http://localhost` como origem (senão chamar HTTP a partir de `https://localhost` seria bloqueado como conteúdo misto) e a
 * versão de depuração libera tráfego sem HTTPS. A versão final (release) é sempre HTTPS.
 */
const lan = process.env.CAP_LAN === 'true';

const config: CapacitorConfig = {
  appId: 'com.ronatia.games',
  appName: 'Ronat-ia Games',
  webDir: 'dist',
  backgroundColor: '#402660',
  server: {
    androidScheme: lan ? 'http' : 'https',
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
