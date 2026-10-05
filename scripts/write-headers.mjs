// Escreve dist/_headers (Cloudflare Pages) com a política de segurança do app.
// A CSP precisa saber a origem da API (VITE_API_URL), por isso o arquivo é gerado no build e não versionado.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const apiUrl = (process.env.VITE_API_URL ?? '').trim().replace(/\/+$/, '');

function origins(url) {
  if (!url) {
    return { http: [], ws: [] };
  }

  const parsed = new URL(url);
  const host = parsed.host;
  return {
    http: [`${parsed.protocol}//${host}`],
    ws: [`${parsed.protocol === 'https:' ? 'wss' : 'ws'}://${host}`],
  };
}

const api = origins(apiUrl);
const turnstile = 'https://challenges.cloudflare.com';

const csp = [
  "default-src 'self'",
  `script-src 'self' ${turnstile}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${api.http.join(' ')}`.trim(),
  `font-src 'self'`,
  `connect-src 'self' ${[...api.http, ...api.ws].join(' ')}`.trim(),
  `frame-src ${turnstile}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const headers = `/*
  Content-Security-Policy: ${csp}
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  X-Frame-Options: DENY
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/index.html
  Cache-Control: no-cache
`;

const target = resolve(root, 'dist/_headers');
await mkdir(dirname(target), { recursive: true });
await writeFile(target, headers);
console.log(`dist/_headers escrito (API: ${apiUrl || 'mesma origem'})`);
