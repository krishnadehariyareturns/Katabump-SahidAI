import { REST, Routes } from 'discord.js';
import config from '../config/config.js';
import createLogger from './logger.js';

const logger = createLogger('CommandRegistration');

/**
 * Registers the given command modules with Discord's API.
 * Registers to a single guild (instant propagation) if DISCORD_GUILD_ID
 * is set, otherwise registers globally (can take up to ~1hr to propagate
 * the first time, subsequent updates are faster).
 *
 * @param {Array<{data: import('discord.js').SlashCommandBuilder}>} commands
 */
export async function registerCommands(commands) {
  const rest = new REST().setToken(config.discord.token);
  const body = commands.map((command) => command.data.toJSON());

  const target = config.discord.guildId
    ? Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId)
    : Routes.applicationCommands(config.discord.clientId);

  logger.info(
    config.discord.guildId
      ? `Registering ${body.length} command(s) to guild ${config.discord.guildId}...`
      : `Registering ${body.length} command(s) globally...`
  );

  await rest.put(target, { body });
  logger.info('Slash commands registered successfully.');
}

export default { registerCommands };
