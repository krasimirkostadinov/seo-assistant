# SEO Assistant

A conversational AI agent that analyzes web pages and suggests optimized `<title>`, `<meta description>`, and `<h1>` tags based on target keywords. You give it a URL and keywords, it fetches the page, reads the current values, and comes back with three alternatives per tag — all within a persistent chat interface.

Built as a monorepo: React + Vite frontend (`apps/web`), Fastify + SQLite API (`apps/api`).

**Live demo:** https://seo-assistant-web.vercel.app/

## Stack

- **Frontend:** React 19, Vite, Tailwind CSS, Zustand, Auth0
- **Backend:** Fastify, Drizzle ORM, SQLite (better-sqlite3)
- **AI:** Vercel AI SDK, OpenAI `gpt-4o-mini`
- **Auth:** Auth0 (JWT, RS256)

## Prerequisites

- Node 20+
- pnpm 10+
- Auth0 tenant with an SPA application and an API resource
- OpenAI API key

### Auth0 setup

1. Create an **SPA Application** — add `http://localhost:5173` to allowed callbacks, logout URLs, and web origins.
2. Create an **API** — the Identifier you set here is the audience value used in both `.env` files.

## Getting started

```bash
pnpm install
```

If pnpm prompts about native builds, run `pnpm approve-builds` and enable `better-sqlite3`. If the API still fails to start, rebuild it manually:

```bash
pnpm rebuild better-sqlite3 --filter api
```

Copy the example env files and fill in your values:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Create the database:

```bash
mkdir -p apps/api/data
pnpm db:push
```

Start both apps:

```bash
pnpm dev
```

Frontend runs on http://localhost:5173, API on http://localhost:4000.

## Configuration

All AI-related config lives in `apps/api/.env`:

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini   # swap for any OpenAI-compatible model
```

`gpt-4o-mini` is the default — fast, cheap, and handles tool calls + structured output well enough for this use case. You can point it at a local model (Ollama, LM Studio) via `OPENAI_BASE_URL` if you want to run it offline.

## API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | — | Health check |
| GET | `/threads` | JWT | List user's threads |
| POST | `/threads` | JWT | Create a thread |
| PATCH | `/threads/:id` | JWT | Rename a thread |
| GET | `/threads/:id/messages` | JWT | Fetch message history |
| POST | `/threads/:id/messages` | JWT | Send a message, runs the agent |

Agent responses include a `metadata.suggestions` array when the model has enough context to generate recommendations. Each entry covers one of the three supported tags (`<title>`, `<meta description>`, `<h1>`), with three suggestions per tag:

```json
{
  "tag": "<title>",
  "currentValue": "Home | Acme Corp",
  "suggestedValue": "Acme Corp – Project Management Software for Teams"
}
```

## Deployment

The project ships with a `Dockerfile` for the API and deploys as:

- **Backend:** Railway (auto-deploys on push to `main`)
- **Frontend:** Vercel (auto-deploys on push to `main`)

GitHub Actions runs the test suite on every push.

## Notes

- The URL fetcher blocks common private IP ranges (localhost, 127.x, 10.x, 192.168.x, 172.16.x, 169.254.x) to prevent SSRF - not exhaustive, but covers the obvious cases.
- UI is English only.
