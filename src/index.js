import { Client, GatewayIntentBits, Partials, Collection } from 'discord.js';
import config from './config/config.js';
import createLogger from './utils/logger.js';

// Importing this triggers DB connection + schema setup as a side effect,
// so it's ready before any event handler runs.
import './database/db.js';

import readyEvent from './events/ready.js';
import messageCreateEvent from './events/messageCreate.js';
import interactionCreateEvent from './events/interactionCreate.js';
import clearCommand from './commands/clear.js';
import { registerCommands } from './utils/registerCommands.js';

const logger = createLogger('Bot');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel, Partials.Message],
});

// Command registry, keyed by command name, so the interaction handler
// can look up the right module in O(1).
client.commands = new Collection();
client.commands.set(clearCommand.data.name, clearCommand);

const events = [readyEvent, messageCreateEvent, interactionCreateEvent];
for (const event of events) {
  if (event.once) {
    client.once(event.name, (...args) => event.execute(client, ...args));
  } else {
    client.on(event.name, (...args) => event.execute(client, ...args));
  }
}

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled promise rejection', err);
});

process.on('SIGINT', () => {
  logger.info('Shutting down (SIGINT)...');
  client.destroy();
  process.exit(0);
});

async function start() {
  try {
    await registerCommands([...client.commands.values()]);
  } catch (err) {
    // Non-fatal: log and continue so the bot still comes online even if
    // command registration hiccups (e.g. transient Discord API issue).
    logger.error('Failed to auto-register slash commands at startup', err);
  }

  try {
    await client.login(config.discord.token);
  } catch (err) {
    logger.error('Failed to log in to Discord — check DISCORD_TOKEN', err);
    process.exit(1);
  }
}

start();
