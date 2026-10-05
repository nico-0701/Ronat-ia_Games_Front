# App Android (Capacitor)

O app Android é o **mesmo site** (`dist/`) empacotado num WebView pelo [Capacitor](https://capacitorjs.com). Não há código nativo próprio além do que o Capacitor gera; o que é do aparelho (compartilhar, salvar arquivo, botão voltar, voltar ao primeiro plano) passa por plugins e está isolado em `src/lib/platform.ts`, `src/lib/share.ts`, `src/lib/download.ts` e `src/app/lifecycle.ts`.

|                   |                                                                                                      |
| ----------------- | ---------------------------------------------------------------------------------------------------- |
| Pacote            | `com.ronatia.games`                                                                                  |
| Versão            | a do `package.json` (`0.1.0` vira `versionCode` 100)                                                 |
| Android mínimo    | 7.0 (API 24)                                                                                         |
| Plugins           | `@capacitor/app` (botão voltar, primeiro/segundo plano), `@capacitor/share`, `@capacitor/filesystem` |
| Origem do WebView | `https://localhost` (versão final) ou `http://localhost` (build `CAP_LAN=true`)                      |

## Pré-requisitos

- Node 22+ e `npm ci`.
- JDK 17+ (o do Android Studio serve: `C:\Program Files\Android\Android Studio\jbr`) e o Android SDK (`ANDROID_HOME`).
- O Gradle é baixado pelo próprio `gradlew` na primeira vez.

## Gerar o APK de depuração

O endereço da API entra **no build do site** (`VITE_API_URL`). Dois cenários:

**A. API publicada (HTTPS)**

```powershell
$env:VITE_API_URL = 'https://sua-api.onrender.com'
npm run build
npx cap sync android

$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
cd android
.\gradlew.bat :app:assembleDebug
# APK: android\app\build\outputs\apk\debug\app-debug.apk
```

**B. API no PC, pela rede local (HTTP)** — para testar no celular ou no emulador sem publicar nada:

```powershell
# API rodando no PC (dotnet run, escuta em 0.0.0.0:5080) e o celular na mesma rede Wi-Fi.
$env:CAP_LAN = 'true'                       # origem http://localhost no WebView (senão HTTP seria "conteúdo misto")
$env:VITE_API_URL = 'http://192.168.0.8:5080'   # o IP do PC (no emulador, 10.0.2.2 também serve)
npm run build
npx cap sync android
cd android; .\gradlew.bat :app:assembleDebug
```

A versão de **depuração** libera tráfego HTTP (`android/app/src/debug/AndroidManifest.xml`); a versão final (release) só fala HTTPS. No Back, o CORS precisa aceitar a origem do WebView (`http://localhost` ou `https://localhost`): em desenvolvimento ela já está em `appsettings.Development.json`; em produção, acrescente `https://localhost` em `Cors__AllowedOrigins__*` (ver `docs/DEPLOY.md` do Back).

Instalar: `adb install -r app-debug.apk` (mantém os dados).

## Versão final (release)

1. Gere uma chave **uma vez** e guarde-a (e a senha) num lugar seguro **fora do Git**: quem perde a chave não consegue mais atualizar o app para quem já o instalou.

   ```powershell
   & "$env:JAVA_HOME\bin\keytool.exe" -genkeypair -v -keystore ronat-ia-release.jks -alias ronatia -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Crie `android/keystore.properties` (ignorado pelo Git):

   ```properties
   storeFile=C:/caminho/seguro/ronat-ia-release.jks
   storePassword=...
   keyAlias=ronatia
   keyPassword=...
   ```

3. `npm run build` (com a `VITE_API_URL` de produção), `npx cap sync android` e `.\gradlew.bat :app:assembleRelease` (APK) ou `:app:bundleRelease` (AAB, para a Play Store).

Sem o `keystore.properties`, o release sai **sem assinatura** (não instala): é de propósito.

## O que o app faz de diferente do site

- **Botão voltar** do Android: volta uma tela; na primeira, sai do app.
- **Voltar ao primeiro plano:** o Android suspende WebSockets em segundo plano; ao voltar, o app reconecta o tempo real, assina de novo e atualiza as telas.
- **Compartilhar convite:** abre o menu de compartilhar do Android (WhatsApp...).
- **Baixar os meus dados:** grava o JSON no cache do app e abre o menu de compartilhar (salvar no Drive, mandar por e-mail...), porque o WebView não baixa `blob:`.
- **Foto de perfil:** o seletor de arquivos do WebView oferece galeria e câmera; a foto é reduzida no aparelho antes de enviar.
- **Backup do Android desligado** (`allowBackup=false`): o login fica no armazenamento do WebView e não deve ir para o backup na nuvem.

## Ícone e abertura

Os ícones (quadrado arredondado, redondo e a camada do ícone adaptativo) são gerados por `npm run icons` a partir do desenho do favicon; o fundo do ícone adaptativo e da abertura é o roxo do app (`values/ic_launcher_background.xml`).

## Evoluções previstas

- **Links de convite abrindo o app** (Android App Links): exige `assetlinks.json` no site e um _intent filter_ para `/grupos/entrar`.
- **Guardar o refresh token no Keystore** (hoje fica no `localStorage` do WebView, como no site; ver ADR-0001).
- Push (avisar que é a vez de alguém), se um dia fizer sentido.
