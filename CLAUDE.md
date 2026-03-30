# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code Style

Only add comments for complex or non-obvious logic. Do not comment self-explanatory code.

## Commands

```bash
npm run dev          # Start dev server (Next.js + Turbopack)
npm run build        # Production build
npm run start        # Start production server
npm run test         # Run all tests (Vitest)
npm run lint         # ESLint
npm run setup        # Fresh install: npm install + prisma generate + migrate
npm run db:reset     # Reset SQLite database (destructive)
```

Run a single test file:
```bash
npx vitest run src/lib/transform/__tests__/jsx-transformer.test.ts
```

**Windows note:** Scripts require `cross-env` (already installed). Do not revert to bare `NODE_OPTIONS=...` syntax.

## Environment

- `ANTHROPIC_API_KEY` — Optional. Without it the app uses a mock provider that returns static components.
- `JWT_SECRET` — Optional. Defaults to `"development-secret-key"`.

## Architecture

UIGen is an AI-powered React component generator. Users describe components in natural language; Claude generates/edits code inside a **virtual file system** (in-memory only, never written to disk). Components are compiled with Babel Standalone and rendered live in an `<iframe>`.

### Request flow

1. User prompt → `POST /[projectId]/api/chat` (streaming, max 120s, 40 tool steps)
2. Route passes current virtual FS state + chat messages to Claude via Vercel AI SDK
3. Claude calls tools (`str_replace_editor`, `file_manager`) to create/modify files
4. Tool calls stream back to the client, handled by `FileSystemProvider`
5. `PreviewFrame` detects FS changes and re-renders the iframe
6. On stream finish, project is saved to SQLite (authenticated users only)

### Key files & directories

| Path | Purpose |
|------|---------|
| `src/app/page.tsx` | Home page; redirects auth'd users, shows demo for anonymous |
| `src/app/[projectId]/page.tsx` | Project page (requires auth) |
| `src/app/[projectId]/api/chat/route.ts` | Streaming chat endpoint with tool definitions |
| `src/lib/contexts/chat-context.tsx` | Chat state + Vercel AI SDK `useChat` integration |
| `src/lib/contexts/file-system-context.tsx` | Virtual FS state; handles incoming tool calls from the stream |
| `src/lib/file-system.ts` | `VirtualFileSystem` class — in-memory file tree |
| `src/lib/transform/jsx-transformer.ts` | Transforms generated JSX for iframe rendering |
| `src/lib/prompts/generation.tsx` | System prompt sent to Claude |
| `src/lib/provider.ts` | Selects Claude Haiku 4.5 or mock provider based on `ANTHROPIC_API_KEY` |
| `src/lib/auth.ts` | JWT session lifecycle (httpOnly cookie `auth-token`, 7-day expiry) |
| `src/actions/index.ts` | Server actions: `signUp`, `signIn`, `signOut`, `getUser` |
| `src/lib/anon-work-tracker.ts` | Persists anonymous work to `sessionStorage` |
| `prisma/schema.prisma` | SQLite schema — reference this file to understand all stored data structures |

### Auth flow

- JWT stored in httpOnly cookie; verified per-request via `getSession()`.
- Anonymous users generate components freely (stored in `sessionStorage`).
- On sign-up/sign-in, `useAuth` hook detects anonymous work, creates a project from it, then redirects to the new project page.

### Database schema

Always refer to `prisma/schema.prisma` for the authoritative data model. Key points:

- **`User`** — `id`, `email` (unique), `password` (bcrypt), timestamps, relation to projects
- **`Project`** — `id`, `name`, optional `userId` (cascade delete), `messages` (JSON string — chat history), `data` (JSON string — serialized virtual FS), timestamps

`messages` and `data` are stored as raw JSON strings in SQLite (not native JSON columns), so they must be parsed/serialized explicitly in application code.

### Virtual file system

`VirtualFileSystem` holds files in memory. It is serialized to JSON and stored in `Project.data` in SQLite. The iframe receives the compiled JS bundle produced by `jsx-transformer.ts` via Babel Standalone — no server-side bundling occurs.

### AI tools available to Claude

- `str_replace_editor` — create, view, str-replace, or insert in virtual files
- `file_manager` — rename or delete virtual files/directories

### Testing

Tests use Vitest + jsdom + React Testing Library. Test files live next to the code they test in `__tests__/` subdirectories.
