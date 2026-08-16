# 🎬 Cinevo Viral Bot

An independent automation bot that fetches **trending movies & TV shows** from the TMDB API and generates **engaging promotional content** (captions, hashtags, image URLs, and clean links) that point back to the **Cinevo** platform.

Built to run **24/7 on a Linux VPS** with **PM2** or **Docker**, with robust error handling, automatic retries, and clean structured logging.

---

## ✨ Features

- 🔥 **Trending data** — Pulls weekly trending movies and/or TV shows from TMDB.
- ✍️ **Content generation** — Produces ready-to-post promotional captions with hashtags.
- 🔗 **Clean Cinevo links** — Builds SEO-friendly URLs pointing back to your platform (configurable path templates).
- 🖼️ **Image URLs** — Includes poster and backdrop image URLs for use in posts.
- 🔁 **Auto-retry** — Exponential backoff with jitter for resilient API calls.
- 🛡️ **Graceful shutdown** — Handles `SIGINT`/`SIGTERM` cleanly.
- 📦 **Deploy-ready** — Ships with `Dockerfile`, `docker-compose.yml`, and a PM2 `ecosystem.config.js`.
- 📝 **Structured logging** — Console + rotating file logs via Winston.
- 🧱 **Modular & type-safe** — Clean TypeScript architecture with strict typing.

---

## 📁 Project Structure

```
cinevo-viral-bot/
├── src/
│   ├── config/            # Environment-based configuration loader
│   ├── services/
│   │   ├── tmdbClient.ts      # TMDB API client with retry logic
│   │   ├── contentGenerator.ts# Promotional caption generation
│   │   ├── cinevoLinker.ts    # Cinevo URL builder
│   │   ├── outputWriter.ts    # Writes JSON/Markdown output
│   │   └── scheduler.ts       # Interval-based scheduler
│   ├── types/             # Shared TypeScript types
│   ├── utils/logger.ts    # Winston logger
│   ├── bot.ts             # Bot orchestrator (single cycle)
│   └── index.ts           # Entry point
├── Dockerfile             # Multi-stage production image
├── docker-compose.yml     # Docker Compose for VPS deployment
├── ecosystem.config.js    # PM2 configuration
├── .env.example           # Environment template
├── tsconfig.json
└── package.json
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites

- **Node.js** 18+ (recommended: 20 LTS)
- **npm** (or pnpm/yarn)
- A free **TMDB API key** — get one at [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Then edit `.env` and set at least:

```env
TMDB_API_KEY=your_tmdb_api_key_here
CINEVO_BASE_URL=https://streamflixx-seven.vercel.app

CINEVO_MOVIE_PATH=/movie/{id}
CINEVO_TV_PATH=/tv/{id}
```

> **Cinevo URL format:** Use `{id}` as a placeholder for the TMDB id. Examples:
> - `/movie/{id}` → `https://streamflixx-seven.vercel.app/movie/12345`
> - `/watch/{id}` → `https://streamflixx-seven.vercel.app/watch/12345`
> - `/search?q={title}` → `https://streamflixx-seven.vercel.app/search?q=Inception`


### 3. Run in development

```bash
npm run dev
```

The bot will immediately run one cycle, then repeat on the configured interval (default: every 60 minutes). Generated content is written to `./output/`.

### 4. Build & run in production

```bash
npm run build
npm start
```

---

## ⚙️ Configuration Reference

All configuration is done via environment variables (see `.env.example`).

| Variable | Default | Description |
|----------|---------|-------------|
| `TMDB_API_KEY` | *(required)* | Your TMDB API key. |
| `TMDB_API_BASE_URL` | `https://api.themoviedb.org/3` | TMDB API base URL. |
| `TMDB_IMAGE_BASE_URL` | `https://image.tmdb.org/t/p` | TMDB image CDN base. |
| `TMDB_LANGUAGE` | `en` | Language for TMDB data (ISO 639-1). |
| `TMDB_REGION` | *(empty)* | Region for trending (ISO 3166-1). |
| `CINEVO_BASE_URL` | `https://streamflixx-seven.vercel.app` | Base URL of the Cinevo site. |
| `CINEVO_MOVIE_PATH` | `/movie/{id}` | Path template for movie links. |
| `CINEVO_TV_PATH` | `/tv/{id}` | Path template for TV links. |
| `BOT_INTERVAL_MINUTES` | `60` | How often to run a cycle (minutes). |
| `TRENDING_LIMIT` | `10` | Max items per cycle (1–20). |
| `TRENDING_MEDIA_TYPE` | `both` | `movie`, `tv`, or `both`. |
| `OUTPUT_DIR` | `./output` | Where generated content is written. |
| `OUTPUT_FORMAT` | `both` | `json`, `md`, or `both`. |
| `LOG_LEVEL` | `info` | `error`, `warn`, `info`, or `debug`. |
| `LOG_TO_FILE` | `true` | Write logs to `./logs/bot.log`. |
| `MAX_RETRIES` | `3` | Max retry attempts for API calls. |
| `RETRY_BASE_DELAY_MS` | `1000` | Base backoff delay (ms). |
| `RETRY_MAX_DELAY_MS` | `30000` | Max backoff delay (ms). |
| `HTTP_TIMEOUT_MS` | `15000` | HTTP request timeout (ms). |


---

## 🖥️ Deploying on a VPS

### Option A — Docker (recommended)

1. **Install Docker & Docker Compose** on your VPS.
2. **Clone/copy** this project to the VPS.
3. **Configure** the environment:
   ```bash
   cp .env.example .env
   nano .env   # add your TMDB_API_KEY and Cinevo URLs
   ```
4. **Build & start**:
   ```bash
   docker compose up -d --build
   ```
5. **Monitor**:
   ```bash
   docker compose logs -f
   docker compose ps
   ```
6. **Stop**:
   ```bash
   docker compose down
   ```

The container restarts automatically (`restart: unless-stopped`) and persists generated content/logs in `./output` and `./logs` on the host.

### Option B — PM2

1. **Install Node.js 20+** on your VPS.
2. **Install PM2 globally**:
   ```bash
   npm install -g pm2
   ```
3. **Clone/copy** this project to the VPS.
4. **Install & build**:
   ```bash
   npm install
   npm run build
   ```
5. **Configure** the environment:
   ```bash
   cp .env.example .env
   nano .env
   ```
6. **Start with PM2**:
   ```bash
   pm2 start ecosystem.config.js
   ```
7. **Monitor**:
   ```bash
   pm2 logs cinevo-viral-bot
   pm2 status
   pm2 monit
   ```
8. **Persist across reboots**:
   ```bash
   pm2 save
   pm2 startup
   ```

---

## 📤 Output

Each cycle writes timestamped files to `./output/`:

- **JSON** — Full structured result (all posts, links, images).
- **Markdown** — Human-readable posts ready for review or manual posting.

Example Markdown snippet:

```markdown
## Inception (2010)

- **Type:** Movie
- **Rating:** 8.8/10
- **TMDB ID:** 27205

**Overview:** A thief who steals corporate secrets through dream-sharing technology...

**Caption:**
> 🔥 Trending now: Inception (2010) is taking the world by storm with a 8.8/10 rating! Don't miss out — watch it today on Cinevo.

**Hashtags:** #Inception #Cinevo #Movies #Streaming #WatchNow

**Cinevo Link:** https://streamflixx-seven.vercel.app/movie/27205

```

---

## 🧪 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Run in development with ts-node. |
| `npm run build` | Compile TypeScript to `dist/`. |
| `npm start` | Run the compiled bot. |
| `npm run typecheck` | Type-check without emitting. |
| `npm run lint` | Lint the source. |
| `npm run smoke` | Run the smoke test (no API key needed). |
| `npm run pm2:start` | Start via PM2. |
| `npm run pm2:logs` | Tail PM2 logs. |
| `npm run docker:up` | Build & start via Docker Compose. |
| `npm run docker:down` | Stop Docker Compose services. |


---

## 🛠️ Extending the Bot

The architecture is modular, so extending is straightforward:

- **Add a new data source** — Create a new client in `src/services/` and call it from `bot.ts`.
- **Change caption templates** — Edit `MOVIE_TEMPLATES` / `TV_TEMPLATES` in `src/services/contentGenerator.ts`.
- **Add auto-posting** — Add a new service (e.g., `twitterClient.ts`) and call it from `bot.ts` after generation.
- **Add a database** — Swap `outputWriter.ts` for a DB-backed writer.

---

## 📄 License

MIT © Cinevo
