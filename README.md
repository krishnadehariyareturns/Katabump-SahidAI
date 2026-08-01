# Discord AI Chatbot

A production-ready Discord bot powered by OpenRouter, with automatic model
fallback, shared per-channel conversation memory (SQLite), and a `/clear`
command to reset a channel's history.

## Features

- Replies only when: the bot is @mentioned, someone replies to one of its
  messages, or the message is a DM.
- Tries multiple AI models in order (configurable), automatically falling
  back if one fails, times out, or is rate-limited.
- Shared conversation history per channel — multiple people can talk to the
  bot in the same channel and it keeps everyone's turns straight.
- `/clear` slash command wipes a channel's stored history.
- All secrets via environment variables. Structured logging throughout.

## Project structure

```
src/
  config/config.js          # loads & validates all env vars
  utils/logger.js           # scoped/leveled logger
  utils/discordHelpers.js   # message-splitting helper (2000-char limit)
  database/schema.sql       # SQLite table definition
  database/db.js            # connection + schema bootstrap
  database/conversationRepository.js  # all SQL lives here
  memory/conversationMemory.js        # builds AI prompt from history
  ai/systemPrompt.js        # bot personality
  ai/openrouter.js          # single-model API call
  ai/aiClient.js            # fallback chain across models
  commands/clear.js         # /clear slash command
  handlers/messageHandler.js   # reply-trigger logic + AI call + send
  handlers/commandHandler.js   # routes slash command interactions
  events/ready.js, messageCreate.js, interactionCreate.js
  index.js                  # entry point
  deploy-commands.js        # registers slash commands (run manually)
```

## 1. Create the Discord application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) → **New Application**.
2. Under **Bot**:
   - Click **Reset Token** to get your bot token → this is `DISCORD_TOKEN`.
   - Enable **MESSAGE CONTENT INTENT** under Privileged Gateway Intents. The bot cannot read message text without this.
3. Under **OAuth2 → General**, copy the **Application ID** → this is `DISCORD_CLIENT_ID`.
4. Under **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot permissions: at minimum `Send Messages`, `Read Message History`, `View Channels`. Add `Use Slash Commands` (included automatically with `applications.commands`).
   - Open the generated URL and invite the bot to your server.

## 2. Get an OpenRouter API key

1. Sign up at [openrouter.ai](https://openrouter.ai) and create an API key → this is `OPENROUTER_API_KEY`.
2. Double-check the exact model slugs you want in `OPENROUTER_MODELS` against [openrouter.ai/models](https://openrouter.ai/models) — free-tier model availability and naming changes over time, so verify before deploying.

## 3. Configure environment variables

Copy the example file and fill it in:

```bash
cp .env.example .env
```

| Variable | Required | Notes |
|---|---|---|
| `DISCORD_TOKEN` | Yes | From the Bot tab in the Developer Portal |
| `DISCORD_CLIENT_ID` | Yes | Application ID from OAuth2 → General |
| `DISCORD_GUILD_ID` | No | Set during development for instant slash-command updates; unset for global (production) rollout |
| `OPENROUTER_API_KEY` | Yes | From openrouter.ai dashboard |
| `OPENROUTER_SITE_URL` | No | Shown in OpenRouter's dashboard for attribution |
| `OPENROUTER_APP_NAME` | No | Same as above |
| `OPENROUTER_MODELS` | No (has default) | Comma-separated fallback chain, tried in order |
| `AI_REQUEST_TIMEOUT_MS` | No (default 15000) | Per-model timeout before falling back |
| `MEMORY_HISTORY_LIMIT` | No (default 20) | How many past messages to include as context |
| `DATABASE_PATH` | No (default `./data/bot.sqlite`) | Where the SQLite file lives |
| `LOG_LEVEL` | No (default `info`) | `error` \| `warn` \| `info` \| `debug` |

## 4. Install and run

```bash
npm install
npm start                 # or: npm run dev  (auto-restarts on file changes)
```

Slash commands are **registered automatically every time the bot starts** —
no separate step needed. If `DISCORD_GUILD_ID` is set, `/clear` appears in
that server within seconds. If left unset, it's registered globally and can
take up to ~1 hour to show up everywhere the first time.

`npm run deploy-commands` still exists if you ever want to register commands
without starting the bot (e.g. in a CI step), but it's optional.

## /clear behavior

Running `/clear` posts a confirmation prompt with **Yes** (green) and
**No** (red) buttons:

- **Yes** → deletes the channel's stored history, deletes the prompt, and
  sends a private (ephemeral) confirmation of how many messages were cleared.
- **No** → deletes the prompt, does nothing else.
- If nobody responds within 30 seconds, the prompt deletes itself.
- Only the person who ran the command can click its buttons.

## Notes on current design choices

- **`/clear` is usable by everyone** (`setDefaultMemberPermissions(null)`) and
  requires a Yes/No confirmation before deleting anything, so an accidental
  invocation can't wipe history unintentionally. If you want to restrict who
  can run it (e.g. to users with "Manage Messages"), that's a one-line change
  in `src/commands/clear.js` via `.setDefaultMemberPermissions(...)`.
- **History is per-channel, not per-user** — everyone talking to the bot in
  the same channel shares one memory thread. DMs naturally get their own
  thread since each DM has a unique channel ID.
- **SQLite via `better-sqlite3`** is synchronous and file-based — great for
  a single-process bot. If you ever run multiple bot instances against the
  same database concurrently, you'd want to migrate to a networked DB
  (Postgres, etc.) instead.
