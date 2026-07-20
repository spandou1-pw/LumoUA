# Lumo — повний пакет проєкту

```
lumo-complete/
├── .github/workflows/build-desktop.yml  ← ГОЛОВНЕ: пуште на GitHub, і це збере реальний .exe/.dmg
├── LUMO.md      ← що саме змінилося цього разу і як отримати .exe — читайте це першим
├── backend/     ← NestJS API
├── web/         ← Next.js: '/' — публічний лендинг, решта — застосунок (доступний лише через desktop app)
├── desktop/     ← Tauri-обгортка
├── mobile/      ← React Native/Expo (iOS/Android)
├── docs/        ← початкова архітектурна документація
└── design/      ← макети дизайн-системи
```

## Найважливіше — з чого почати

Читайте **`LUMO.md`** — там покроково, як запушити на GitHub і за ~10 хвилин отримати справжній скомпільований `.exe` для Windows та `.dmg` для macOS, зібраний безкоштовно на серверах GitHub (тут, у цьому середовищі, скомпілювати бінарник фізично неможливо — немає Windows/Rust-тулчейну).

## Швидкий локальний запуск (backend + сайт у браузері)

```bash
cd backend
cp .env.example .env
docker compose up -d
npm install
npm run migration:run
npm run start:dev
```

```bash
cd web
npm install
PORT=3001 npm run dev
```

`http://localhost:3001/` — публічний лендинг. `http://localhost:3001/app` — вхід у застосунок напряму (в браузері він теж технічно відкриється, але в реальному розгортанні весь функціонал доступний лише з desktop-застосунку — див. LUMO.md).
