# PocketDevAI 🤖

A lightweight, production-ready AI coding assistant for Android. Connects to your Ollama server and provides a Claude-like coding chat experience — optimized for 2GB RAM devices.

---

## ✨ Features

- 🔥 **Streaming responses** — real-time token-by-token output
- 💻 **Code blocks with syntax highlighting** — copy button included
- 🗂️ **Chat history** — persistent across app restarts
- 📁 **Project file upload** — attach code files as context
- 🎛️ **Model selector** — switch between Ollama models
- 🔒 **Secure storage** — API keys stored with SecureStore
- 🌑 **Dark mode only** — optimized for OLED screens
- ⚡ **Low RAM design** — max 100 messages per session, lazy rendering

---

## 📱 Screenshots

> Dark theme · Chat UI · Model selector · Project files · Settings

---

## 🚀 Quick Start

### Option A: Download Pre-built APK
Grab the latest APK from the [GitHub Releases](../../releases) page.

### Option B: Build Locally

**Requirements:**
- Node.js 20+
- Android Studio + SDK (API 34)
- Java 17
- Expo CLI

```bash
# 1. Clone the repo
git clone https://github.com/yourusername/pocket-dev-ai
cd pocket-dev-ai

# 2. Install dependencies
npm install

# 3. Generate native Android project
npx expo prebuild --platform android --clean

# 4. Build debug APK (fast, for testing)
cd android
./gradlew assembleDebug

# APK location:
# android/app/build/outputs/apk/debug/app-debug.apk

# 5. Or build release APK
./gradlew assembleRelease

# APK location:
# android/app/build/outputs/apk/release/app-release-unsigned.apk
```

### Option C: GitHub Actions (Automated)

1. Push code to `main` branch
2. Actions workflow auto-builds APK
3. Download from **Actions → Artifacts**

For release builds with a tag:
```bash
git tag v1.0.0
git push origin v1.0.0
# APK auto-attached to GitHub Release
```

---

## 🔌 Server Setup (Ollama)

### On your PC/VPS/Mac:

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Allow connections from network (needed for phone access)
OLLAMA_HOST=0.0.0.0 ollama serve

# Pull recommended models
ollama pull qwen2.5-coder:7b      # Best coding model, ~4.5GB
ollama pull deepseek-coder:6.7b   # Alternative, ~3.8GB
ollama pull codellama:7b          # Meta's coding model, ~3.8GB
ollama pull llama3.2:3b           # Fast lightweight chat, ~2GB
```

### Connect from App:
- Same WiFi network: `http://192.168.1.100:11434`
- Via USB (ADB forward): `http://localhost:11434`
  ```bash
  adb reverse tcp:11434 tcp:11434
  ```
- Remote VPS: `http://your-server-ip:11434`
- RunPod: `https://your-pod-id-11434.proxy.runpod.net`

---

## ⚙️ Configuration

All settings are in the **Settings** tab:

| Setting | Description |
|---------|-------------|
| API URL | Your Ollama server address |
| API Key | Optional Bearer token (for proxied servers) |
| Model | Selected from server's available models |

---

## 🏗️ Project Structure

```
pocket-dev-ai/
├── App.js                      # Root component + navigation
├── app.json                    # Expo configuration
├── eas.json                    # EAS build profiles
├── package.json
├── .github/
│   └── workflows/
│       └── build.yml           # GitHub Actions APK builder
└── src/
    ├── components/
    │   ├── MessageBubble.js    # Chat message with code rendering
    │   ├── ModelSelector.js    # Bottom sheet model picker
    │   ├── HeaderBar.js        # Top navigation bar
    │   └── EmptyChat.js        # Welcome screen with suggestions
    ├── context/
    │   └── AppContext.js       # Global state (useReducer)
    ├── hooks/
    │   ├── useChat.js          # Chat send/stream/abort logic
    │   └── useSettings.js      # Config persistence
    ├── navigation/
    │   └── MainTabNavigator.js # Bottom tab navigation
    ├── screens/
    │   ├── ChatScreen.js       # Main chat interface
    │   ├── HistoryScreen.js    # Past sessions list
    │   ├── ProjectScreen.js    # File upload/management
    │   └── SettingsScreen.js   # API config + setup guide
    ├── services/
    │   ├── OllamaService.js    # API client with streaming
    │   ├── StorageService.js   # SecureStore persistence
    │   └── FileService.js      # File picking + reading
    ├── styles/
    │   └── colors.js           # Design tokens + theme
    └── utils/
        └── helpers.js          # Pure utility functions
```

---

## 🧠 API Reference (Ollama)

The app uses the standard Ollama chat endpoint:

```
POST http://your-server:11434/api/chat
```

```json
{
  "model": "qwen2.5-coder:7b",
  "messages": [
    { "role": "system", "content": "You are a coding assistant..." },
    { "role": "user", "content": "Fix this bug: ..." }
  ],
  "stream": true,
  "options": {
    "temperature": 0.7,
    "num_ctx": 4096,
    "num_predict": 2048
  }
}
```

---

## 📊 Performance Optimizations

| Technique | Implementation |
|-----------|----------------|
| Message limit | Max 100 messages per session (oldest pruned) |
| Session limit | Max 50 sessions stored |
| Context window | Only last 20 messages sent to API |
| File size cap | 5MB max per uploaded file |
| FlatList | `removeClippedSubviews`, `maxToRenderPerBatch=10` |
| Context window | 8000 char cap on project context |
| Streaming abort | AbortController per session |
| Storage | SecureStore (not AsyncStorage) — faster |

---

## 🔐 Security

- API keys stored in `expo-secure-store` (Android Keystore-backed)
- No telemetry or third-party analytics
- No data leaves device except API calls to your Ollama server
- API key never logged or exposed in UI

---

## 🛠️ Troubleshooting

**"Server unreachable" error:**
- Ensure Ollama started with `OLLAMA_HOST=0.0.0.0 ollama serve`
- Check firewall allows port 11434
- Try USB tunnel: `adb reverse tcp:11434 tcp:11434`

**Slow responses:**
- Use smaller models (3B-7B) on low-RAM servers
- Reduce `num_ctx` in OllamaService.js (try 2048)

**APK build fails:**
- Ensure Java 17 is set: `export JAVA_HOME=$(/usr/libexec/java_home -v 17)`
- Clean build: `cd android && ./gradlew clean`

---

## 📄 License

MIT License — see [LICENSE](LICENSE)

---

## 🙏 Credits

Built with [Expo](https://expo.dev) · [React Native](https://reactnative.dev) · [Ollama](https://ollama.com)
