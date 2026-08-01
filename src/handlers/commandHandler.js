import createLogger from '../utils/logger.js';

const logger = createLogger('CommandHandler');

export async function handleInteraction(client, interaction) {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    logger.warn(`Received unknown command: ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (err) {
    logger.error(`Error executing command "${interaction.commandName}"`, err);
    const errorResponse = {
      content: 'Something went wrong running that command.',
      ephemeral: true,
    };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorResponse).catch(() => {});
    } else {
      await interaction.reply(errorResponse).catch(() => {});
    }
  }
}

export default { handleInteraction };
