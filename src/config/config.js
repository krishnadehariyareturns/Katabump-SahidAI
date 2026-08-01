import 'dotenv/config';

/**
 * Central configuration object. Every env var the app needs is read here,
 * once, so the rest of the codebase never touches process.env directly.
 * This makes required-var validation and future config sources (e.g. a
 * remote config service) a one-file change.
 */

function requireEnv(name) {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseModelList(raw) {
  return raw
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);
}

const config = {
  discord: {
    token: requireEnv('DISCORD_TOKEN'),
    clientId: requireEnv('DISCORD_CLIENT_ID'),
    // Optional: if set, slash commands are registered to this guild only,
    // which propagates instantly (vs. up to ~1hr for global commands).
    // Great for development; leave unset in production for global rollout.
    guildId: process.env.DISCORD_GUILD_ID || null,
  },
  openRouter: {
    apiKey: requireEnv('OPENROUTER_API_KEY'),
    baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
    siteUrl: process.env.OPENROUTER_SITE_URL || '',
    appName: process.env.OPENROUTER_APP_NAME || 'discord-ai-bot',
    models: parseModelList(
      process.env.OPENROUTER_MODELS ||
        'openrouter/free,openai/gpt-oss-120b:free,meta-llama/llama-3.3-70b-instruct:free'
    ),
    requestTimeoutMs: Number(process.env.AI_REQUEST_TIMEOUT_MS || 15000),
  },
  memory: {
    historyLimit: Number(process.env.MEMORY_HISTORY_LIMIT || 20),
  },
  database: {
    path: process.env.DATABASE_PATH || './data/bot.sqlite',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

if (config.openRouter.models.length === 0) {
  throw new Error('OPENROUTER_MODELS must contain at least one model.');
}

export default config;
