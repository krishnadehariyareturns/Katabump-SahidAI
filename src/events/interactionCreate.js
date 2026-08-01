import { handleInteraction } from '../handlers/commandHandler.js';

export default {
  name: 'interactionCreate',
  once: false,
  execute(client, interaction) {
    return handleInteraction(client, interaction);
  },
};
