/**
 * Optional: manually (re-)registers slash commands without starting the bot.
 * Not required for normal use — src/index.js registers commands automatically
 * every time the bot starts. This is here for CI pipelines or quick checks.
 *
 * Usage: node src/deploy-commands.js
 */
import clearCommand from './commands/clear.js';
import { registerCommands } from './utils/registerCommands.js';
import createLogger from './utils/logger.js';

const logger = createLogger('DeployCommands');

registerCommands([clearCommand]).catch((err) => {
  logger.error('Failed to register slash commands', err);
  process.exitCode = 1;
});
