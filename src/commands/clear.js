import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from 'discord.js';
import conversationMemory from '../memory/conversationMemory.js';
import createLogger from '../utils/logger.js';

const logger = createLogger('ClearCommand');

const CONFIRM_TIMEOUT_MS = 30_000;
const YES_ID = 'clear_confirm_yes';
const NO_ID = 'clear_confirm_no';

export default {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription("Clear this channel's AI conversation history")
    // Usable by everyone by default — no permission restriction.
    .setDefaultMemberPermissions(null)
    .setDMPermission(true),

  async execute(interaction) {
    const channelId = interaction.channel.id;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(YES_ID).setLabel('Yes').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(NO_ID).setLabel('No').setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({
      content: 'Are you sure you want to clear this channel\'s AI conversation history?',
      components: [row],
    });

    const promptMessage = await interaction.fetchReply();

    const collector = promptMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: CONFIRM_TIMEOUT_MS,
      // Only the person who ran /clear can confirm/cancel it.
      filter: (buttonInteraction) => buttonInteraction.user.id === interaction.user.id,
      max: 1,
    });

    collector.on('collect', async (buttonInteraction) => {
      try {
        await buttonInteraction.deferUpdate();

        if (buttonInteraction.customId === YES_ID) {
          const deletedCount = conversationMemory.clearChannelMemory(channelId);
          await interaction.deleteReply().catch(() => {});
          await buttonInteraction
            .followUp({
              content:
                deletedCount > 0
                  ? `Cleared ${deletedCount} message${deletedCount === 1 ? '' : 's'} from this channel's memory.`
                  : 'There was no conversation history to clear in this channel.',
              ephemeral: true,
            })
            .catch(() => {});
        } else {
          await interaction.deleteReply().catch(() => {});
        }
      } catch (err) {
        logger.error(`Failed to process /clear confirmation for channel ${channelId}`, err);
        await interaction.deleteReply().catch(() => {});
      }
    });

    // If nobody clicks a button in time, clean up the prompt instead of
    // leaving a stale confirmation message sitting in the channel.
    collector.on('end', async (collected) => {
      if (collected.size === 0) {
        await interaction.deleteReply().catch(() => {});
      }
    });
  },
};
